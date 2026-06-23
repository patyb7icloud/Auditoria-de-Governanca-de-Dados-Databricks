-- Databricks permission grants for the governance audit tool
-- Replace `patricia` with the database principal used by your service token if different.
-- Use the Databricks SQL editor or run via the Admin Web UI.

-- Grant usage on the catalog (if needed)
GRANT USAGE ON CATALOG casas_bahia_mvp TO `patricia`;

-- Grant usage on the specific schema that caused insufficient privileges
GRANT USAGE ON SCHEMA casas_bahia_mvp.system.access TO `patricia`;

-- Grant SELECT on all current tables in that schema
GRANT SELECT ON ALL TABLES IN SCHEMA casas_bahia_mvp.system.access TO `patricia`;

-- Ensure future tables in the schema grant SELECT to the principal by default
ALTER DEFAULT PRIVILEGES IN SCHEMA casas_bahia_mvp.system.access
  GRANT SELECT ON TABLES TO `patricia`;

-- Optional: if your analyses require reading other system schemas, repeat for them.
-- Example for a generic schema:
-- GRANT USAGE ON SCHEMA casas_bahia_mvp.system TO `patricia`;

-- End of grants
