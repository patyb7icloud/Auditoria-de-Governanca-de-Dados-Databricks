# Databricks notebook source
# RadarIA: inventory, 12-tag governance gate, Delta history and solution mapping.
# Place this file beside radar_ia_core.py in a Databricks Repo/Workspace folder.
# Secrets are read only from the Databricks Secret Scope; never paste secrets here.

# COMMAND ----------

from datetime import datetime, timezone
import json
import os
import re
import uuid

from pyspark.sql import functions as F
from pyspark.sql.types import (
    ArrayType,
    BooleanType,
    MapType,
    StringType,
    StructField,
    StructType,
    TimestampType,
)
from delta.tables import DeltaTable

from radar_ia_core import REQUIRED_TAGS, scan_account, validate_agent

# COMMAND ----------

# Job parameters. Configure defaults in the Databricks Workflow task.
dbutils.widgets.text("account_id", "", "Databricks account ID")
dbutils.widgets.text("secret_scope", "governance-secrets", "Databricks secret scope")
dbutils.widgets.text("client_id_secret_key", "radaria-client-id", "OAuth client ID secret key")
dbutils.widgets.text("client_secret_secret_key", "radaria-client-secret", "OAuth client secret key")
dbutils.widgets.text("account_host", "https://accounts.azuredatabricks.net", "Databricks account API host")
dbutils.widgets.text("registry_table", "governance.ai_inventory.ai_solution_registry", "Approved AI Registry Delta table")
dbutils.widgets.text("history_table", "governance.ai_inventory.radar_scan_history", "Append-only inventory history table")
dbutils.widgets.text("workspace_status_table", "governance.ai_inventory.radar_scan_workspace_status", "Workspace scan status table")
dbutils.widgets.text("mapping_table", "governance.ai_inventory.solution_mapping", "Observed-to-declared mapping table")
dbutils.widgets.text("updated_by", "radarIA", "Audit identity")
dbutils.widgets.text("report_output_path", "", "Optional XLSX destination: /Volumes/... or dbfs:/...")

# COMMAND ----------

account_id = dbutils.widgets.get("account_id").strip()
secret_scope = dbutils.widgets.get("secret_scope").strip()
client_id_secret_key = dbutils.widgets.get("client_id_secret_key").strip()
client_secret_secret_key = dbutils.widgets.get("client_secret_secret_key").strip()
account_host = dbutils.widgets.get("account_host").strip().rstrip("/")
registry_table = dbutils.widgets.get("registry_table").strip()
history_table = dbutils.widgets.get("history_table").strip()
workspace_status_table = dbutils.widgets.get("workspace_status_table").strip()
mapping_table = dbutils.widgets.get("mapping_table").strip()
updated_by = dbutils.widgets.get("updated_by").strip() or "radarIA"
report_output_path = dbutils.widgets.get("report_output_path").strip()

if not account_id:
    raise ValueError("Informe o widget account_id; o valor não é lido do notebook DBC.")

_IDENTIFIER = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*){2}$")
for _name, _value in {
    "registry_table": registry_table,
    "history_table": history_table,
    "workspace_status_table": workspace_status_table,
    "mapping_table": mapping_table,
}.items():
    if not _IDENTIFIER.fullmatch(_value):
        raise ValueError(f"{_name} deve ser um identificador Unity Catalog de três partes: catalog.schema.table")

# The catalog must already exist; create the schema and target tables idempotently.
_catalog, _schema, _ = mapping_table.split(".")
spark.sql(f"CREATE SCHEMA IF NOT EXISTS `{_catalog}`.`{_schema}`")

spark.sql(f"""
CREATE TABLE IF NOT EXISTS {registry_table} (
  ai_project_id STRING NOT NULL,
  ai_solution STRING NOT NULL,
  ai_component STRING NOT NULL,
  environment STRING NOT NULL,
  business_unit STRING NOT NULL,
  owner_team STRING NOT NULL,
  cost_center STRING NOT NULL,
  data_classification STRING NOT NULL,
  risk_tier STRING NOT NULL,
  criticality STRING NOT NULL,
  lifecycle STRING NOT NULL,
  chargeback_model STRING NOT NULL,
  approved BOOLEAN NOT NULL,
  registry_owner STRING,
  approved_at TIMESTAMP,
  updated_at TIMESTAMP
) USING DELTA
""")

spark.sql(f"""
CREATE TABLE IF NOT EXISTS {history_table} (
  scan_run_id STRING NOT NULL, scanned_at TIMESTAMP NOT NULL,
  agent_id STRING, agent_name STRING, agent_type STRING,
  workspace_id STRING, workspace_name STRING, workspace_url STRING,
  endpoint_name STRING, observed_tags MAP<STRING, STRING>,
  tag_read_status STRING, tag_error STRING
) USING DELTA
""")

spark.sql(f"""
CREATE TABLE IF NOT EXISTS {workspace_status_table} (
  scan_run_id STRING NOT NULL, scanned_at TIMESTAMP NOT NULL,
  workspace_id STRING, workspace_name STRING, phase STRING,
  status STRING, error_message STRING
) USING DELTA
""")

spark.sql(f"""
CREATE TABLE IF NOT EXISTS {mapping_table} (
  agent_id STRING NOT NULL, agent_name STRING, agent_type STRING,
  workspace_id STRING, workspace_name STRING,
  observed_tags MAP<STRING, STRING>, ai_project_id STRING, ai_solution STRING,
  homologated_flag BOOLEAN,
  compliance_status STRING COMMENT 'CONFORME, PARCIAL ou NÃO_HOMOLOGADO',
  compliance_reasons ARRAY<STRING>,
  first_seen_at TIMESTAMP, last_seen_at TIMESTAMP,
  notified_admin BOOLEAN, updated_by STRING, alert_signature STRING,
  tag_read_status STRING
) USING DELTA
""")

# COMMAND ----------

# The service principal is a Databricks secret, not notebook source or workflow JSON.
client_id = dbutils.secrets.get(scope=secret_scope, key=client_id_secret_key)
client_secret = dbutils.secrets.get(scope=secret_scope, key=client_secret_secret_key)
spark.conf.set("spark.sql.session.timeZone", "UTC")
scan_run_id = str(uuid.uuid4())
scanned_at = datetime.now(timezone.utc).replace(tzinfo=None)

scan = scan_account(
    account_id=account_id,
    client_id=client_id,
    client_secret=client_secret,
    account_host=account_host,
)

if scan["workspaces_found"] == 0 or not scan["scanned_workspace_ids"]:
    # Fail closed: do not replace/refresh mappings after a scan that could not
    # successfully read at least one workspace.
    raise RuntimeError(
        f"Varredura sem workspace lido com sucesso. Workspaces encontrados={scan['workspaces_found']}; "
        f"erros={len(scan['workspace_errors'])}. Nenhuma tabela foi atualizada."
    )

# COMMAND ----------

# Read only approved declarations. The registry owner remains the source of truth.
registry_df = spark.table(registry_table).where(F.coalesce(F.col("approved"), F.lit(False)) == F.lit(True))
registry_rows = [row.asDict(recursive=True) for row in registry_df.select(*REQUIRED_TAGS, "approved").collect()]

history_schema = StructType([
    StructField("scan_run_id", StringType(), False),
    StructField("scanned_at", TimestampType(), False),
    StructField("agent_id", StringType(), True),
    StructField("agent_name", StringType(), True),
    StructField("agent_type", StringType(), True),
    StructField("workspace_id", StringType(), True),
    StructField("workspace_name", StringType(), True),
    StructField("workspace_url", StringType(), True),
    StructField("endpoint_name", StringType(), True),
    StructField("observed_tags", MapType(StringType(), StringType(), True), True),
    StructField("tag_read_status", StringType(), True),
    StructField("tag_error", StringType(), True),
])

history_rows = [
    (
        scan_run_id, scanned_at, str(agent.get("agent_id") or "Null"), agent.get("agent_name"),
        agent.get("agent_type"), str(agent.get("workspace_id") or ""), agent.get("workspace_name"),
        agent.get("workspace_url"), agent.get("endpoint_name"), agent.get("observed_tags") or {},
        agent.get("tag_read_status"), agent.get("tag_error"),
    )
    for agent in scan["agents"]
]
history_df = spark.createDataFrame(history_rows, history_schema)
history_df.write.format("delta").mode("append").saveAsTable(history_table)

workspace_status_schema = StructType([
    StructField("scan_run_id", StringType(), False),
    StructField("scanned_at", TimestampType(), False),
    StructField("workspace_id", StringType(), True),
    StructField("workspace_name", StringType(), True),
    StructField("phase", StringType(), True),
    StructField("status", StringType(), True),
    StructField("error_message", StringType(), True),
])
scanned_set = set(scan["scanned_workspace_ids"])
workspace_status_rows = []
for workspace in scan.get("workspaces", []):
    wid = str(workspace["workspace_id"])
    workspace_errors = [e for e in scan["workspace_errors"] if str(e.get("workspace_id")) == wid]
    if wid in scanned_set:
        status = "PARTIAL" if workspace_errors else "SUCCESS"
    else:
        status = "ERROR"
    error_message = "; ".join(f"{e.get('phase')}: {e.get('message')}" for e in workspace_errors) or None
    workspace_status_rows.append((
        scan_run_id, scanned_at, wid, workspace.get("workspace_name"),
        "inventory", status, error_message,
    ))
for error in scan["workspace_errors"]:
    if not error.get("workspace_id"):
        workspace_status_rows.append((
            scan_run_id, scanned_at, None, error.get("workspace_name"),
            error.get("phase"), "ERROR", error.get("message"),
        ))
workspace_status_df = spark.createDataFrame(workspace_status_rows, workspace_status_schema)
workspace_status_df.write.format("delta").mode("append").saveAsTable(workspace_status_table)

# COMMAND ----------

mapping_schema = StructType([
    StructField("agent_id", StringType(), False),
    StructField("agent_name", StringType(), True),
    StructField("agent_type", StringType(), True),
    StructField("workspace_id", StringType(), True),
    StructField("workspace_name", StringType(), True),
    StructField("observed_tags", MapType(StringType(), StringType(), True), True),
    StructField("ai_project_id", StringType(), True),
    StructField("ai_solution", StringType(), True),
    StructField("homologated_flag", BooleanType(), False),
    StructField("compliance_status", StringType(), False),
    StructField("compliance_reasons", ArrayType(StringType(), False), False),
    StructField("first_seen_at", TimestampType(), False),
    StructField("last_seen_at", TimestampType(), False),
    StructField("notified_admin", BooleanType(), False),
    StructField("updated_by", StringType(), True),
    StructField("alert_signature", StringType(), False),
    StructField("tag_read_status", StringType(), True),
])

previous_rows = spark.table(mapping_table).select(
    "agent_id", "agent_type", "workspace_id", "first_seen_at", "notified_admin", "alert_signature"
).collect()
previous = {
    (row["agent_id"], row["agent_type"], row["workspace_id"]): row.asDict(recursive=True)
    for row in previous_rows
}

mapping_rows = []
for agent in scan["agents"]:
    result = validate_agent(agent, registry_rows)
    key = (result["agent_id"], result["agent_type"], result["workspace_id"])
    old = previous.get(key, {})
    signature_unchanged = old.get("alert_signature") == result["alert_signature"]
    if result["homologated_flag"]:
        notified_admin = True
    else:
        notified_admin = bool(old.get("notified_admin")) if signature_unchanged else False
    mapping_rows.append((
        result["agent_id"], result["agent_name"], result["agent_type"],
        result["workspace_id"], result["workspace_name"], result["observed_tags"],
        result["ai_project_id"], result["ai_solution"], result["homologated_flag"],
        result["compliance_status"], result["compliance_reasons"],
        old.get("first_seen_at") or scanned_at, scanned_at, notified_admin,
        updated_by, result["alert_signature"], agent.get("tag_read_status"),
    ))

if mapping_rows:
    mapping_df = spark.createDataFrame(mapping_rows, mapping_schema)
    key_condition = (
        "target.agent_id = source.agent_id AND "
        "target.agent_type = source.agent_type AND "
        "target.workspace_id = source.workspace_id"
    )
    (DeltaTable.forName(spark, mapping_table)
        .alias("target")
        .merge(mapping_df.alias("source"), key_condition)
        .whenMatchedUpdateAll()
        .whenNotMatchedInsertAll()
        .execute())

# COMMAND ----------

summary = {
    "scan_run_id": scan_run_id,
    "workspaces_found": scan["workspaces_found"],
    "workspaces_scanned": len(scan["scanned_workspace_ids"]),
    "agents_observed": len(scan["agents"]),
    "workspace_or_tag_errors": len(scan["workspace_errors"]),
    "nonconforming_observed": sum(1 for row in mapping_rows if row[9] != "CONFORME"),
    "registry_table": registry_table,
    "mapping_table": mapping_table,
}
report_path = None
if report_output_path:
    if not (report_output_path.startswith("/Volumes/") or report_output_path.startswith("dbfs:/")):
        raise ValueError("report_output_path deve apontar para /Volumes/... ou dbfs:/...; não use paths locais sem controle de acesso.")
    report_path = report_output_path if report_output_path.lower().endswith(".xlsx") else (
        report_output_path.rstrip("/") + f"/radaria_{scanned_at.strftime('%Y%m%d_%H%M%S')}_{scan_run_id[:8]}.xlsx"
    )
    local_path = f"/tmp/radaria_{scan_run_id}.xlsx"
    report_records = []
    for row in mapping_rows:
        report_records.append({
            "agent_id": row[0], "agent_name": row[1], "agent_type": row[2],
            "workspace_id": row[3], "workspace_name": row[4],
            "observed_tags": json.dumps(row[5] or {}, ensure_ascii=False, sort_keys=True),
            "ai_project_id": row[6], "ai_solution": row[7],
            "homologated_flag": row[8], "compliance_status": row[9],
            "compliance_reasons": "; ".join(row[10] or []),
            "first_seen_at": row[11], "last_seen_at": row[12],
            "notified_admin": row[13], "updated_by": row[14],
        })
    try:
        import pandas as pd
        report_columns = [
            "agent_id", "agent_name", "agent_type", "workspace_id", "workspace_name",
            "observed_tags", "ai_project_id", "ai_solution", "homologated_flag",
            "compliance_status", "compliance_reasons", "first_seen_at", "last_seen_at",
            "notified_admin", "updated_by",
        ]
        report_df = pd.DataFrame(report_records, columns=report_columns)
        with pd.ExcelWriter(local_path, engine="openpyxl") as writer:
            report_df.to_excel(writer, sheet_name="Inventario IA", index=False)
        destination_directory = report_path.rsplit("/", 1)[0]
        dbutils.fs.mkdirs(destination_directory)
        dbutils.fs.cp(f"file:{local_path}", report_path)
        summary["excel_report"] = report_path
    except Exception as exc:
        # Delta remains the source of truth, but fail visibly when an enabled export cannot be delivered.
        raise RuntimeError(f"Exportação XLSX falhou após persistência Delta: {type(exc).__name__}: {exc}") from exc
else:
    summary["excel_report"] = None
print(summary)
