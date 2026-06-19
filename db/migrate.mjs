/**
 * db/migrate.mjs
 * schema.sql を DB に適用してテーブルを作成するスクリプト。
 *
 * 実行:
 *   node db/migrate.mjs          # スキーマのみ
 *   node db/migrate.mjs --seed   # スキーマ + 開発用シード（dev/staging のみ）
 */
import { readFileSync } from "fs";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { loadEnvLocal } from "./load-env.mjs";

neonConfig.webSocketConstructor = ws;
loadEnvLocal();

const withSeed = process.argv.includes("--seed");
const schema = readFileSync("db/schema.sql", "utf-8");
const seed = withSeed ? readFileSync("db/seed.sql", "utf-8") : null;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  console.log("テーブルを作成中...");
  await pool.query(schema);
  console.log("スキーマ適用完了。");

  if (withSeed) {
    console.log("開発用シードを投入中...");
    await pool.query(seed);
    console.log("シード投入完了。");
  }

  const { rows } = await pool.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);

  if (rows.length === 0) {
    console.log("（テーブルなし）");
  } else {
    console.log("作成済みテーブル:");
    rows.forEach((r) => console.log(" -", r.tablename));
  }

  if (withSeed) {
    const { rows: scenarios } = await pool.query(
      "SELECT id, name FROM scenarios ORDER BY name"
    );
    console.log("投入済みシナリオ:");
    scenarios.forEach((s) => console.log(` - ${s.name} (${s.id})`));
  }
} catch (e) {
  if (e.message.includes("already exists")) {
    console.log("一部オブジェクトはすでに存在しています。");
    if (withSeed) {
      console.log("シードのみ再実行します...");
      try {
        await pool.query(seed);
        console.log("シード投入完了。");
      } catch (seedErr) {
        console.error("シードエラー:", seedErr.message);
        process.exit(1);
      }
    }
  } else {
    console.error("エラー:", e.message);
    process.exit(1);
  }
} finally {
  await pool.end();
}
