/**
 * db/migrate.mjs
 * schema.sql を Neon DB に適用してテーブルを作成するスクリプト。
 * 実行: node db/migrate.mjs
 */
import { readFileSync } from 'fs';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Node.js 環境では WebSocket ポリフィルが必要
neonConfig.webSocketConstructor = ws;

// .env.local から環境変数を読み込む
const envContent = readFileSync('.env.local', 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
}

const schema = readFileSync('db/schema.sql', 'utf-8');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  console.log('テーブルを作成中...');
  await pool.query(schema);
  console.log('完了！作成されたテーブルを確認します...');

  const { rows } = await pool.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);

  if (rows.length === 0) {
    console.log('（テーブルなし）');
  } else {
    console.log('作成済みテーブル:');
    rows.forEach(r => console.log(' -', r.tablename));
  }
} catch (e) {
  if (e.message.includes('already exists')) {
    console.log('テーブルはすでに存在しています（スキップ）');
  } else {
    console.error('エラー:', e.message);
    process.exit(1);
  }
} finally {
  await pool.end();
}
