// Applies db/schema.sql to the Neon database in DATABASE_URL.
// Usage: npm run db:migrate   (reads .env via node --env-file)
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Add it to .env first.');
  process.exit(1);
}

const sql = neon(url);
const statements = readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8')
  .replace(/--.*$/gm, '')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
  console.log('✓', statement.split('\n')[0]);
}
console.log(`Applied ${statements.length} statements.`);
