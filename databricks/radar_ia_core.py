"""Core, testable logic for the Databricks AI asset inventory job.

No credentials are stored in this module. OAuth secrets are supplied at runtime
from a Databricks secret scope by the notebook entry point.

Production safety: inventory/tag APIs are GET-only. The only POST requests in
this module obtain OAuth tokens; no native tags or agent configurations are written.
"""
from __future__ import annotations

import hashlib
import json
import re
from typing import Any, Iterable
from urllib.parse import quote

import requests

REQUEST_TIMEOUT_SECONDS = 30
ACCOUNT_HOST = "https://accounts.cloud.databricks.com"

REQUIRED_TAGS = (
    "ai_project_id",
    "ai_solution",
    "ai_component",
    "environment",
    "business_unit",
    "owner_team",
    "cost_center",
    "data_classification",
    "risk_tier",
    "criticality",
    "lifecycle",
    "chargeback_model",
)

ALLOWED_VALUES = {
    "ai_component": {
        "supervisor_agent",
        "genie_agent",
        "knowledge_assistant",
        "model_serving",
        "vector_search",
        "rag",
        "tool",
        "evaluator",
    },
    "environment": {"dev", "qa", "staging", "prod"},
    "data_classification": {"public", "internal", "confidential", "restricted"},
    "risk_tier": {"low", "medium", "high", "critical"},
    "criticality": {"low", "medium", "high", "mission_critical"},
    "lifecycle": {"design", "pilot", "production", "retired"},
    "chargeback_model": {"direct", "shared", "allocated"},
}

ASSET_SPECS = (
    {
        "type": "Supervisor Agent",
        "component": "supervisor_agent",
        "endpoint": "/api/2.1/supervisor-agents",
        "response_key": "supervisor_agents",
    },
    {
        "type": "Genie Agent",
        "component": "genie_agent",
        "endpoint": "/api/2.0/genie/spaces",
        "response_key": "spaces",
    },
    {
        "type": "Knowledge Assistant",
        "component": "knowledge_assistant",
        "endpoint": "/api/2.1/knowledge-assistants",
        "response_key": "knowledge_assistants",
    },
)


def _raise_for_status(response: Any) -> Any:
    response.raise_for_status()
    return response


def obtain_token(
    token_url: str,
    client_id: str,
    client_secret: str,
    *,
    session: Any = requests,
    timeout: int = REQUEST_TIMEOUT_SECONDS,
) -> str:
    """Obtain a short-lived Databricks OAuth client-credentials token."""
    response = _raise_for_status(
        session.post(
            token_url,
            data={"grant_type": "client_credentials", "scope": "all-apis"},
            auth=(client_id, client_secret),
            timeout=timeout,
        )
    )
    token = response.json().get("access_token")
    if not token:
        raise RuntimeError("Resposta OAuth sem access_token.")
    return str(token)


def _items_from_payload(payload: Any, response_key: str) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        rows = payload.get(response_key, [])
        if isinstance(rows, list):
            return [item for item in rows if isinstance(item, dict)]
    return []


def _get_json(session: Any, url: str, headers: dict[str, str], params: dict[str, Any], timeout: int) -> Any:
    response = _raise_for_status(session.get(url, headers=headers, params=params, timeout=timeout))
    return response.json()


def _list_pages(
    session: Any,
    url: str,
    headers: dict[str, str],
    response_key: str,
    *,
    page_size: int,
    timeout: int = REQUEST_TIMEOUT_SECONDS,
) -> list[dict[str, Any]]:
    """Read all pages that use Databricks' next_page_token convention."""
    result: list[dict[str, Any]] = []
    page_token: str | None = None
    seen_tokens: set[str] = set()
    while True:
        params: dict[str, Any] = {"page_size": page_size}
        if page_token:
            params["page_token"] = page_token
        payload = _get_json(session, url, headers, params, timeout)
        result.extend(_items_from_payload(payload, response_key))
        next_token = payload.get("next_page_token") if isinstance(payload, dict) else None
        if not next_token:
            break
        next_token = str(next_token)
        if next_token in seen_tokens:
            raise RuntimeError(f"A API retornou next_page_token repetido em {url}.")
        seen_tokens.add(next_token)
        page_token = next_token
    return result


def _workspace_url(workspace: dict[str, Any]) -> str | None:
    url = workspace.get("workspace_url") or workspace.get("workspace_url_base")
    fqdn = workspace.get("workspace_fqdn") or workspace.get("workspace_url")
    if not url and fqdn:
        url = str(fqdn)
    if not url:
        return None
    url = str(url).strip().rstrip("/")
    if not url:
        return None
    if not url.startswith(("https://", "http://")):
        url = f"https://{url}"
    return url


def list_account_workspaces(
    account_id: str,
    account_token: str,
    *,
    account_host: str = ACCOUNT_HOST,
    session: Any = requests,
    timeout: int = REQUEST_TIMEOUT_SECONDS,
) -> list[dict[str, Any]]:
    """List and de-duplicate account workspaces, accepting list or object payloads."""
    url = f"{account_host.rstrip('/')}/api/2.0/accounts/{quote(str(account_id), safe='')}/workspaces"
    headers = {"Authorization": f"Bearer {account_token}"}
    all_workspaces: list[dict[str, Any]] = []
    page_token: str | None = None
    seen_tokens: set[str] = set()
    while True:
        params: dict[str, Any] = {}
        if page_token:
            params["page_token"] = page_token
        payload = _get_json(session, url, headers, params, timeout)
        if isinstance(payload, dict):
            entries = payload.get("workspaces", [])
            if isinstance(entries, list):
                all_workspaces.extend(w for w in entries if isinstance(w, dict))
            next_token = payload.get("next_page_token")
        elif isinstance(payload, list):
            all_workspaces.extend(w for w in payload if isinstance(w, dict))
            next_token = None
        else:
            next_token = None
        if not next_token:
            break
        next_token = str(next_token)
        if next_token in seen_tokens:
            raise RuntimeError("A API de workspaces retornou next_page_token repetido.")
        seen_tokens.add(next_token)
        page_token = next_token

    unique: dict[str, dict[str, Any]] = {}
    for workspace in all_workspaces:
        wid = workspace.get("workspace_id") or workspace.get("workspaceId")
        host = _workspace_url(workspace)
        if wid is None or not host:
            continue
        workspace_id = str(wid)
        if workspace_id not in unique:
            unique[workspace_id] = {
                "workspace_id": workspace_id,
                "workspace_name": str(workspace.get("workspace_name") or workspace.get("workspaceName") or "Null"),
                "workspace_url": host,
            }
    return list(unique.values())


def _tag_map(tags: Any) -> tuple[dict[str, str], list[str]]:
    """Normalize Databricks tag arrays/maps; report duplicate or malformed keys."""
    values: dict[str, str] = {}
    issues: list[str] = []
    if isinstance(tags, dict):
        iterable: Iterable[Any] = ({"key": key, "value": value} for key, value in tags.items())
    elif isinstance(tags, list):
        iterable = tags
    else:
        iterable = []

    for entry in iterable:
        if not isinstance(entry, dict):
            issues.append("Formato de tag não reconhecido")
            continue
        key = entry.get("key") or entry.get("tag_key")
        value = entry.get("value") if "value" in entry else entry.get("tag_value")
        if key is None or str(key).strip() == "":
            issues.append("Tag sem chave")
            continue
        key = str(key).strip()
        if key in values:
            issues.append(f"Chave de tag duplicada: {key}")
        values[key] = "" if value is None else str(value).strip()
    return values, issues


def _read_serving_endpoint_tags(
    workspace_url: str,
    token: str,
    endpoint_name: str,
    *,
    session: Any,
    timeout: int,
) -> tuple[dict[str, str], str | None, list[str]]:
    """Read native serving-endpoint tags using GET only; never replace assignments."""
    url = f"{workspace_url}/api/2.0/serving-endpoints/{quote(endpoint_name, safe='')}"
    payload = _get_json(session, url, {"Authorization": f"Bearer {token}"}, {}, timeout)
    values, issues = _tag_map(payload.get("tags", []) if isinstance(payload, dict) else [])
    return values, None, issues


def _read_genie_tags(
    workspace_url: str,
    token: str,
    space_id: str,
    *,
    session: Any,
    timeout: int,
) -> tuple[dict[str, str], str | None, list[str]]:
    """Read Genie tag assignments using GET only; never mutate existing tags."""
    url = f"{workspace_url}/api/2.0/entity-tag-assignments/geniespaces/{quote(space_id, safe='')}/tags"
    assignments = _list_pages(
        session,
        url,
        {"Authorization": f"Bearer {token}"},
        "tag_assignments",
        page_size=100,
        timeout=timeout,
    )
    values, issues = _tag_map(assignments)
    return values, None, issues


def _asset_identity(spec: dict[str, Any], source: dict[str, Any]) -> tuple[str, str]:
    if spec["type"] == "Supervisor Agent":
        agent_id = source.get("supervisor_agent_id") or source.get("id")
        name = source.get("display_name") or source.get("name")
    elif spec["type"] == "Genie Agent":
        agent_id = source.get("space_id") or source.get("id")
        name = source.get("title") or source.get("name")
    else:
        agent_id = source.get("id") or source.get("knowledge_assistant_id")
        name = source.get("display_name") or source.get("name")
    return str(agent_id or "Null"), str(name or "Null")


def scan_account(
    account_id: str,
    client_id: str,
    client_secret: str,
    *,
    account_host: str = ACCOUNT_HOST,
    session: Any = requests,
    timeout: int = REQUEST_TIMEOUT_SECONDS,
) -> dict[str, Any]:
    """Inventory Supervisor Agents, Genie Agents and Knowledge Assistants."""
    account_token_url = f"{account_host.rstrip('/')}/oidc/accounts/{quote(str(account_id), safe='')}/v1/token"
    account_token = obtain_token(account_token_url, client_id, client_secret, session=session, timeout=timeout)
    workspaces = list_account_workspaces(
        account_id,
        account_token,
        account_host=account_host,
        session=session,
        timeout=timeout,
    )
    if not workspaces:
        raise RuntimeError("A conta não retornou workspaces acessíveis com workspace_id e URL.")

    agents: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []
    scanned_workspace_ids: list[str] = []

    for workspace in workspaces:
        workspace_url = workspace["workspace_url"]
        wid = workspace["workspace_id"]
        name = workspace["workspace_name"]
        try:
            token_url = f"{workspace_url}/oidc/v1/token"
            token = obtain_token(token_url, client_id, client_secret, session=session, timeout=timeout)
        except Exception as exc:  # one inaccessible workspace must not stop the account scan
            errors.append({"workspace_id": wid, "workspace_name": name, "phase": "workspace_oauth", "message": str(exc)[:1000]})
            continue

        successful_lists = 0
        for spec in ASSET_SPECS:
            url = f"{workspace_url}{spec['endpoint']}"
            try:
                page_size = 20 if spec["type"] == "Genie Agent" else 100
                workspace_agents = _list_pages(
                    session,
                    url,
                    {"Authorization": f"Bearer {token}"},
                    spec["response_key"],
                    page_size=page_size,
                    timeout=timeout,
                )
                successful_lists += 1
            except Exception as exc:
                errors.append({"workspace_id": wid, "workspace_name": name, "phase": f"list_{spec['type']}", "message": str(exc)[:1000]})
                continue

            for source in workspace_agents:
                agent_id, agent_name = _asset_identity(spec, source)
                endpoint_name = source.get("endpoint_name")
                tag_error: str | None = None
                tag_issues: list[str] = []
                try:
                    if spec["type"] == "Genie Agent":
                        tags, tag_error, tag_issues = _read_genie_tags(
                            workspace_url,
                            token,
                            str(source.get("space_id") or agent_id),
                            session=session,
                            timeout=timeout,
                        )
                    elif endpoint_name:
                        tags, tag_error, tag_issues = _read_serving_endpoint_tags(
                            workspace_url,
                            token,
                            str(endpoint_name),
                            session=session,
                            timeout=timeout,
                        )
                    else:
                        tags = {}
                        tag_error = "O agente não retornou endpoint_name para consultar as tags do serving endpoint."
                except Exception as exc:
                    tags = {}
                    tag_error = str(exc)[:1000]

                if tag_error:
                    errors.append({
                        "workspace_id": wid,
                        "workspace_name": name,
                        "phase": f"tags_{spec['type']}",
                        "message": f"{agent_id}: {tag_error}"[:1000],
                    })
                agents.append({
                    "agent_id": agent_id,
                    "agent_name": agent_name,
                    "agent_type": spec["type"],
                    "expected_component": spec["component"],
                    "workspace_id": wid,
                    "workspace_name": name,
                    "workspace_url": workspace_url,
                    "endpoint_name": str(endpoint_name) if endpoint_name else None,
                    "observed_tags": tags,
                    "tag_read_status": "ERROR" if tag_error else ("OK" if tags else "EMPTY"),
                    "tag_error": tag_error,
                    "tag_issues": tag_issues,
                })
        if successful_lists:
            scanned_workspace_ids.append(wid)

    return {
        "workspaces_found": len(workspaces),
        "workspaces": workspaces,
        "scanned_workspace_ids": scanned_workspace_ids,
        "agents": agents,
        "workspace_errors": errors,
    }


def _is_approved(row: dict[str, Any]) -> bool:
    value = row.get("approved", False)
    if isinstance(value, str):
        return value.strip().lower() in {"true", "1", "yes", "approved", "aprovado"}
    return bool(value)


def _tag_tuple(row: dict[str, Any]) -> tuple[str, ...]:
    return tuple(str(row.get(key) or "").strip() for key in REQUIRED_TAGS)


def validate_agent(agent: dict[str, Any], registry_rows: Iterable[dict[str, Any]]) -> dict[str, Any]:
    """Compare observed tags to the approved registry and return the mapping row fields."""
    raw_tags = agent.get("observed_tags") or {}
    tags, parse_issues = _tag_map(raw_tags)
    missing = [key for key in REQUIRED_TAGS if key not in tags or tags[key] == ""]
    reasons: list[str] = []
    invalid: list[str] = []

    for key, allowed in ALLOWED_VALUES.items():
        value = tags.get(key, "")
        if value and value not in allowed:
            invalid.append(f"{key}={value!r} (permitidos: {', '.join(sorted(allowed))})")
    solution = tags.get("ai_solution", "")
    if solution and not re.fullmatch(r"[a-z0-9]+(?:[-_][a-z0-9]+)*", solution):
        invalid.append("ai_solution deve ser um slug minúsculo")
    business_unit = tags.get("business_unit", "")
    if business_unit and not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]*", business_unit):
        invalid.append("business_unit deve ser um slug/código sem espaços")
    owner_team = tags.get("owner_team", "")
    if owner_team and "@" in owner_team:
        invalid.append("owner_team deve ser um grupo institucional, não um e-mail pessoal")
    if tags.get("environment") == "prod" and tags.get("lifecycle") not in {"production", "retired"}:
        invalid.append("environment=prod exige lifecycle=production (ou retired para ativo desativado)")

    component = agent.get("expected_component")
    if tags.get("ai_component") and component and tags["ai_component"] != component:
        invalid.append(f"ai_component deve ser {component} para {agent.get('agent_type', 'o tipo observado')}")

    if missing:
        reasons.append("Tags obrigatórias ausentes/vazias: " + ", ".join(missing))
    if invalid:
        reasons.extend("Tag inválida: " + message for message in invalid)
    for issue in parse_issues + list(agent.get("tag_issues") or []):
        reasons.append("Problema ao ler tags: " + issue)
    if agent.get("tag_read_status") == "ERROR":
        reasons.append("Não foi possível consultar as tags nativas do ativo.")

    approved_rows = [row for row in registry_rows if _is_approved(row)]
    project_id = tags.get("ai_project_id", "")
    solution = tags.get("ai_solution", "")
    identity_rows = [
        row for row in approved_rows
        if str(row.get("ai_project_id") or "").strip() == project_id
        and str(row.get("ai_solution") or "").strip() == solution
    ] if project_id and solution else []

    exact_match = False
    mismatches: list[str] = []
    if identity_rows and not missing:
        observed_tuple = _tag_tuple(tags)
        exact_match = any(_tag_tuple(row) == observed_tuple for row in identity_rows)
        if not exact_match:
            mismatch_candidates: list[list[str]] = []
            for row in identity_rows:
                mismatch_candidates.append([
                    key for key in REQUIRED_TAGS
                    if tags.get(key, "") != str(row.get(key) or "").strip()
                ])
            if mismatch_candidates:
                best = min(mismatch_candidates, key=len)
                mismatches = best
                if best:
                    reasons.append("Divergência com o AI Registry em: " + ", ".join(best))

    if not project_id or not solution or not identity_rows:
        status = "NÃO_HOMOLOGADO"
        if not project_id or not solution:
            reasons.append("ai_project_id/ai_solution não identificam uma solução declarada no AI Registry.")
        else:
            reasons.append(f"Solução {project_id}/{solution} não consta como aprovada no AI Registry.")
    elif (
        exact_match
        and not missing
        and not invalid
        and not parse_issues
        and not agent.get("tag_issues")
        and agent.get("tag_read_status") != "ERROR"
    ):
        status = "CONFORME"
    else:
        status = "PARCIAL"

    # Stable fingerprint suppresses duplicate alerts until the finding changes.
    signature_input = {
        "agent_id": agent.get("agent_id"),
        "agent_type": agent.get("agent_type"),
        "workspace_id": agent.get("workspace_id"),
        "status": status,
        "tags": dict(sorted(tags.items())),
        "reasons": sorted(set(reasons)),
    }
    signature = hashlib.sha256(
        json.dumps(signature_input, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()

    return {
        "agent_id": str(agent.get("agent_id") or "Null"),
        "agent_name": str(agent.get("agent_name") or "Null"),
        "agent_type": str(agent.get("agent_type") or "Unknown"),
        "workspace_id": str(agent.get("workspace_id") or ""),
        "workspace_name": str(agent.get("workspace_name") or "Unknown"),
        "observed_tags": tags,
        "ai_project_id": project_id or None,
        "ai_solution": solution or None,
        "homologated_flag": status == "CONFORME",
        "compliance_status": status,
        "compliance_reasons": sorted(set(reasons)),
        "alert_signature": signature,
    }


def admin_notification_state(result: dict[str, Any], previous: dict[str, Any]) -> bool:
    """Preserve delivery state only for the same nonconforming finding.

    A conforming asset does not need an admin alert and must not be represented
    as notified when no message was sent. A changed finding becomes pending again.
    """
    if result.get("compliance_status") == "CONFORME":
        return False
    if previous.get("alert_signature") != result.get("alert_signature"):
        return False
    return bool(previous.get("notified_admin"))
