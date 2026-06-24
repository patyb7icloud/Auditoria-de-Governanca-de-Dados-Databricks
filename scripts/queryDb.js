const pg = require('pg');
const client = new pg.Client('postgres://patricia:patricia@localhost:5432/auditoria_gov');

client.connect((err) => {
  if (err) {
    console.error('Erro de conexão:', err);
    process.exit(1);
  }

  client.query(
    'SELECT id, created_at, databricks_host, databricks_catalog, score FROM audit_sessions ORDER BY created_at DESC LIMIT 3;',
    (err, res) => {
      if (err) {
        console.error('Erro na query:', err);
      } else {
        console.log('\n=== ÚLTIMAS 3 AUDITORIAS ===\n');
        res.rows.forEach(r => {
          console.log(`ID: ${r.id}`);
          console.log(`Score: ${r.score}`);
          console.log(`Host: ${r.databricks_host}`);
          console.log(`Catalog: ${r.databricks_catalog}`);
          console.log(`Data: ${r.created_at}`);
          console.log('---');
        });
      }
      client.end();
    }
  );
});
