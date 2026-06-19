import { neon } from "@neondatabase/serverless";
import { loadEnvLocal } from "./load-env.mjs";

loadEnvLocal();

const sql = neon(process.env.DATABASE_URL);
try {
  const rows = await sql`SELECT version()`;
  console.log("接続成功:", rows[0].version.split(" ").slice(0, 2).join(" "));

  const scenarios = await sql`SELECT COUNT(*)::int AS count FROM scenarios`;
  console.log(`scenarios テーブル: ${scenarios[0].count} 件`);
} catch (e) {
  console.error("接続失敗:", e.message);
  process.exit(1);
}
