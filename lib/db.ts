import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL が設定されていません。" +
      ".env.local を確認するか、`vercel env pull .env.local` を再実行してください。"
  );
}

/**
 * Neon サーバーレス PostgreSQL クライアント
 *
 * 使い方（Server Actions / Route Handlers の中で）:
 *
 * ```ts
 * import { sql } from "@/lib/db";
 *
 * const rows = await sql`SELECT * FROM scenarios ORDER BY created_at DESC`;
 * ```
 *
 * テンプレートリテラルで書くとパラメータは自動でエスケープされるため
 * SQL インジェクション（外部からの不正な SQL 挿入）を防げます。
 *
 * ```ts
 * const name = "テスト";
 * const rows = await sql`SELECT * FROM scenarios WHERE name = ${name}`;
 * ```
 */
export const sql = neon(process.env.DATABASE_URL);
