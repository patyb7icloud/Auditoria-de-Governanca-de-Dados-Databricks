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
    'SELECT "analysisType", "resultData" FROM analysis_results WHERE "sessionId" = 27;',
    (err: any, res: any) => {
      if (err) {
        console.error('Erro na query:', err);
      } else {
        console.log('\n=== ANALYSIS RESULTS FOR SESSION 26 ===\n');
        res.rows.forEach((r: any) => {
          const data = r.resultData;
          console.log(`Type: ${r.analysisType}`);
          if (r.analysisType === 'structure') {
            console.log('Summary:', JSON.stringify(data.summary, null, 2));
            console.log('Tables count:', data.tables?.length);
            console.log('Table types:');
            const typeCount: any = {};
            data.tables?.forEach((t: any) => {
              typeCount[t.table_type] = (typeCount[t.table_type] || 0) + 1;
            });
            console.log(typeCount);
            console.log('First 5 tables:');
            data.tables?.slice(0, 5).forEach((t: any) => {
              console.log(`  ${t.table_schema}.${t.table_name} (${t.table_type})`);
            });
          }
          console.log('---');
        });
      }
      client.end();
    }
  );
});
