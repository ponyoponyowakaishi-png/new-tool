import { readFileSync } from "fs";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { REGULATION_YEARS } from "../lib/constants.ts";

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

const sql = neon(process.env.DATABASE_URL);
const { loadScenario, saveScenario } = await import("../app/actions/scenarios.ts");

const loaded = await loadScenario("00000000-0000-0000-0000-000000000001");
const targetType = typeof loaded.state.regulationsByYear[2030].targetGPerKm;
console.log("loaded target type:", targetType, loaded.state.regulationsByYear[2030].targetGPerKm);

const saved = await saveScenario(null, `save-as-test-${Date.now()}`, loaded.state, {
  saveAs: true,
});
console.log("saved:", saved);

await sql`DELETE FROM scenarios WHERE id = ${saved.id}`;
console.log("cleaned up");
