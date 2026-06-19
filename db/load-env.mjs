import { existsSync, readFileSync } from "fs";

/**
 * .env.local があれば読み込む。なければ process.env の DATABASE_URL を使う。
 */
export function loadEnvLocal() {
  if (!existsSync(".env.local")) {
    if (!process.env.DATABASE_URL) {
      console.error(
        "エラー: .env.local が見つかりません。\n" +
          "  1. Copy-Item env.local.example .env.local\n" +
          "  2. DATABASE_URL を設定してください。"
      );
      process.exit(1);
    }
    return;
  }

  const envContent = readFileSync(".env.local", "utf-8").replace(/^\uFEFF/, "");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }

  if (!process.env.DATABASE_URL) {
    console.error("エラー: .env.local に DATABASE_URL が設定されていません。");
    process.exit(1);
  }
}
