import 'dotenv/config';
import { testConnection } from '../server/databricks';

async function main() {
  const host = process.env.DATABRICKS_HOST;
  const token = process.env.DATABRICKS_TOKEN;
  const catalog = process.env.DATABRICKS_CATALOG;

  if (!host || !token || !catalog) {
    console.error('DATABRICKS_HOST, DATABRICKS_TOKEN e DATABRICKS_CATALOG devem estar definidos no .env');
    process.exit(1);
  }

  try {
    const res = await testConnection({ host, token, catalog });
    console.log('Resultado do teste de conexão:', res);
  } catch (e: any) {
    console.error('Erro ao testar conexão:', e.message ?? e);
    process.exit(1);
  }
}

main();
