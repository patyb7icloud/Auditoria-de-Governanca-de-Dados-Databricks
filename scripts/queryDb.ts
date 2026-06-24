import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const client = new Client('postgres://patricia:patricia@localhost:5432/auditoria_gov');

client.connect((err: any) => {
  if (err) {
    console.error('Erro de conexão:', err);
    process.exit(1);
  }

  client.query(
    'SELECT id, "createdAt", "databricksHost", "targetCatalog", "governanceScore" FROM audit_sessions ORDER BY "createdAt" DESC LIMIT 3;',
    (err: any, res: any) => {
      if (err) {
        console.error('Erro na query:', err);
      } else {
        console.log('\n=== ÚLTIMAS 3 AUDITORIAS ===\n');
        res.rows.forEach((r: any) => {
          console.log(`ID: ${r.id}`);
          console.log(`Score: ${r.governanceScore}`);
          console.log(`Host: ${r.databricksHost}`);
          console.log(`Catalog: ${r.targetCatalog}`);
          console.log(`Data: ${r.createdAt}`);
          console.log('---');
        });
      }
      client.end();
    }
  );
});
