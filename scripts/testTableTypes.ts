import { analyzeStructure } from "../server/databricks";

const config = {
  host: process.env.DATABRICKS_HOST || "",
  token: process.env.DATABRICKS_TOKEN || "",
  catalog: process.env.DATABRICKS_CATALOG || "test_sistema",
};

async function main() {
  try {
    const result = await analyzeStructure(config);
    console.log("Total tables:", result.summary.totalTables);
    console.log("Total views:", result.summary.totalViews);
    console.log("\nTable types found:");
    result.tables.forEach((t: any) => {
      console.log(`  ${t.table_schema}.${t.table_name} (${t.table_type})`);
    });
  } catch (e) {
    console.error("Error:", e);
  }
}

main();
