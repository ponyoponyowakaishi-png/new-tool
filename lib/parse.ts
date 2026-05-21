export function parseNonNegativeInt(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number.parseInt(trimmed, 10);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

export function parseNonNegativeFloat(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number.parseFloat(trimmed);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

export function formatNumber(value: number | null, digits = 1): string {
  if (value === null) return "—";
  return value.toLocaleString("ja-JP", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}
