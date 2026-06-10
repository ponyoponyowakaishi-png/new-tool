import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

// .env.local を手動で読み込む
const envContent = readFileSync('.env.local', 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
}

const sql = neon(process.env.DATABASE_URL);
try {
  const rows = await sql`SELECT version()`;
  console.log('接続成功:', rows[0].version.split(' ').slice(0, 2).join(' '));
} catch (e) {
  console.error('接続失敗:', e.message);
  process.exit(1);
}
