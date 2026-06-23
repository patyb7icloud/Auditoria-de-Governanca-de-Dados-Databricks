import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string);
  const rows = await sql`SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY table_schema, table_name`;
  console.log(rows);
  await sql.end({ timeout: 0 });
}

main().catch((e)=>{ console.error(e); process.exit(1); });
