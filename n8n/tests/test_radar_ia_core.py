import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "databricks"))

from radar_ia_core import REQUIRED_TAGS, _list_pages, list_account_workspaces, scan_account, validate_agent


class FakeResponse:
    def __init__(self, payload, status=200):
        self.payload = payload
        self.status = status

    def raise_for_status(self):
        if self.status >= 400:
            raise RuntimeError(f"HTTP {self.status}")

    def json(self):
        return self.payload


class FakeSession:
    def __init__(self, pages):
        self.pages = list(pages)
        self.calls = []

    def get(self, url, headers=None, params=None, timeout=None):
        self.calls.append((url, headers, params, timeout))
        return FakeResponse(self.pages.pop(0))


class FakeScanSession:
    def post(self, url, data=None, auth=None, timeout=None):
        if "/oidc/accounts/" in url:
            return FakeResponse({"access_token": "account-token"})
        if "ws-one.example" in url:
            return FakeResponse({"error": "workspace unavailable"}, status=403)
        return FakeResponse({"access_token": "workspace-token"})

    def get(self, url, headers=None, params=None, timeout=None):
        if "/api/2.0/accounts/account/workspaces" in url:
            return FakeResponse({"workspaces": [
                {"workspace_id": 1, "workspace_name": "unavailable", "workspace_fqdn": "ws-one.example"},
                {"workspace_id": 2, "workspace_name": "available", "workspace_fqdn": "ws-two.example"},
            ]})
        if url.endswith("/api/2.1/supervisor-agents"):
            return FakeResponse({"supervisor_agents": [{"supervisor_agent_id": "agent-22", "display_name": "Supervisor X", "endpoint_name": "serve-x"}]})
        if url.endswith("/api/2.0/genie/spaces"):
            return FakeResponse({"spaces": []})
        if url.endswith("/api/2.1/knowledge-assistants"):
            return FakeResponse({"knowledge_assistants": []})
        if url.endswith("/api/2.0/serving-endpoints/serve-x"):
            return FakeResponse({"tags": []})
        raise AssertionError(f"Unexpected GET URL: {url}")


class RadarIACoreTests(unittest.TestCase):
    def setUp(self):
        self.tags = {
            "ai_project_id": "AI-MARTECO-001",
            "ai_solution": "marteco",
            "ai_component": "genie_agent",
            "environment": "prod",
            "business_unit": "midia_marketing",
            "owner_team": "time-martech",
            "cost_center": "CC-4301",
            "data_classification": "internal",
            "risk_tier": "medium",
            "criticality": "high",
            "lifecycle": "production",
            "chargeback_model": "allocated",
        }
        self.agent = {
            "agent_id": "space-001",
            "agent_name": "Genie Performance",
            "agent_type": "Genie Agent",
            "expected_component": "genie_agent",
            "workspace_id": "7508584018066802",
            "workspace_name": "dbw-gibdev-midiamkt",
            "observed_tags": dict(self.tags),
            "tag_read_status": "OK",
        }
        self.registry = [{**self.tags, "approved": True}]

    def test_exact_approved_registry_tuple_is_conforming(self):
        result = validate_agent(self.agent, self.registry)
        self.assertEqual(result["compliance_status"], "CONFORME")
        self.assertTrue(result["homologated_flag"])
        self.assertEqual(result["compliance_reasons"], [])
        self.assertEqual(set(result["observed_tags"]), set(REQUIRED_TAGS))

    def test_unknown_solution_is_not_homologated(self):
        result = validate_agent(self.agent, [])
        self.assertEqual(result["compliance_status"], "NÃO_HOMOLOGADO")
        self.assertFalse(result["homologated_flag"])
        self.assertTrue(any("AI Registry" in reason for reason in result["compliance_reasons"]))

    def test_missing_tags_are_reported(self):
        candidate = {**self.agent, "observed_tags": {"ai_solution": "marteco"}}
        result = validate_agent(candidate, [])
        self.assertEqual(result["compliance_status"], "NÃO_HOMOLOGADO")
        self.assertTrue(any("ai_project_id" in reason for reason in result["compliance_reasons"]))
        self.assertTrue(any("cost_center" in reason for reason in result["compliance_reasons"]))

    def test_divergent_value_and_personal_email_are_partial(self):
        tags = {**self.tags, "owner_team": "pessoa@empresa.com", "risk_tier": "extreme"}
        result = validate_agent({**self.agent, "observed_tags": tags}, self.registry)
        self.assertEqual(result["compliance_status"], "PARCIAL")
        self.assertFalse(result["homologated_flag"])
        joined = " ".join(result["compliance_reasons"])
        self.assertIn("owner_team", joined)
        self.assertIn("risk_tier", joined)

    def test_production_requires_production_lifecycle(self):
        tags = {**self.tags, "lifecycle": "pilot"}
        result = validate_agent({**self.agent, "observed_tags": tags}, self.registry)
        self.assertEqual(result["compliance_status"], "PARCIAL")
        self.assertTrue(any("environment=prod" in reason for reason in result["compliance_reasons"]))

    def test_duplicate_native_tag_key_is_not_conforming(self):
        duplicate_tags = [{"key": key, "value": value} for key, value in self.tags.items()]
        duplicate_tags.append({"key": "ai_project_id", "value": self.tags["ai_project_id"]})
        result = validate_agent({**self.agent, "observed_tags": duplicate_tags}, self.registry)
        self.assertEqual(result["compliance_status"], "PARCIAL")
        self.assertTrue(any("duplicada" in reason for reason in result["compliance_reasons"]))

    def test_pagination_follows_next_page_token(self):
        session = FakeSession([
            {"spaces": [{"space_id": "1"}], "next_page_token": "next"},
            {"spaces": [{"space_id": "2"}]},
        ])
        rows = _list_pages(
            session,
            "https://workspace.example/api/2.0/genie/spaces",
            {"Authorization": "Bearer test-only"},
            "spaces",
            page_size=20,
        )
        self.assertEqual([row["space_id"] for row in rows], ["1", "2"])
        self.assertEqual(session.calls[0][2], {"page_size": 20})
        self.assertEqual(session.calls[1][2], {"page_size": 20, "page_token": "next"})

    def test_workspace_listing_accepts_object_payload_and_deduplicates(self):
        session = FakeSession([{
            "workspaces": [
                {"workspace_id": 7, "workspace_name": "one", "workspace_fqdn": "one.example"},
                {"workspace_id": 7, "workspace_name": "duplicate", "workspace_fqdn": "one.example"},
                {"workspace_id": 8, "workspace_name": "missing URL"},
                {"workspace_id": 9, "workspace_name": "two", "workspace_url": "https://two.example/"},
            ]
        }])
        result = list_account_workspaces("account", "token", account_host="https://accounts.example", session=session)
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["workspace_id"], "7")
        self.assertEqual(result[0]["workspace_url"], "https://one.example")
        self.assertEqual(result[1]["workspace_url"], "https://two.example")
        self.assertEqual(session.calls[0][2], {})

    def test_workspace_listing_accepts_documented_direct_array(self):
        session = FakeSession([[
            {"workspace_id": 10, "workspace_name": "direct-list", "workspace_url": "direct.example"}
        ]])
        result = list_account_workspaces("account", "token", account_host="https://accounts.example", session=session)
        self.assertEqual(result, [{
            "workspace_id": "10",
            "workspace_name": "direct-list",
            "workspace_url": "https://direct.example",
        }])

    def test_scanner_continues_when_one_workspace_authentication_fails(self):
        result = scan_account(
            "account", "client-id", "placeholder-secret", account_host="https://accounts.example", session=FakeScanSession()
        )
        self.assertEqual(result["workspaces_found"], 2)
        self.assertEqual(result["scanned_workspace_ids"], ["2"])
        self.assertEqual(len(result["agents"]), 1)
        self.assertEqual(result["agents"][0]["agent_id"], "agent-22")
        self.assertEqual(result["agents"][0]["tag_read_status"], "EMPTY")
        self.assertEqual(result["workspaces"][1]["workspace_name"], "available")
        self.assertTrue(any(e["phase"] == "workspace_oauth" and e["workspace_id"] == "1" for e in result["workspace_errors"]))


if __name__ == "__main__":
    unittest.main()
