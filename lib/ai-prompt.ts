import {
  formatAchievementRatePercent,
  normalizeAchievementRateForDb,
} from "@/lib/calculations";
import { formatNumber } from "@/lib/parse";
import { POWERTRAIN_LABELS } from "@/lib/sample-data";
import type { AnalystRequestPayload } from "@/lib/types";

function formatVehicleTable(payload: AnalystRequestPayload): string {
  const lines = payload.input.vehicles
    .filter((v) => (v.salesCount ?? 0) > 0)
    .map((v) => {
      const sales = v.salesCount ?? 0;
      const wltp = v.wltpGPerKm ?? 0;
      const weight = v.weightKg ?? 0;
      return `- ${v.name}（${POWERTRAIN_LABELS[v.powertrain]}）: 販売 ${sales.toLocaleString("ja-JP")} 台, WLTP ${formatNumber(wltp)} g/km, 重量 ${formatNumber(weight, 0)} kg`;
    });

  return lines.length > 0 ? lines.join("\n") : "- （有効な車種行なし）";
}

function formatRegulation(payload: AnalystRequestPayload): string {
  const r = payload.input.regulation;
  const target = payload.result.targetGPerKm;
  return [
    `- 対象年: ${payload.input.selectedYear}`,
    `- ポートフォリオ: ${payload.portfolioLabel}`,
    `- 目標 CO₂（実効）: ${formatNumber(target)} g/km`,
    `- 燃料クレジット: ${formatNumber(r.fuelCreditGPerKm)} g/km`,
    `- グリーンスチールクレジット: ${formatNumber(r.greenSteelCreditGPerKm)} g/km`,
    `- 小型 BEV スーパークレジット係数: ${formatNumber(r.smallEvSuperCreditFactor, 2)}`,
    `- 罰金単価: € ${formatNumber(r.penaltyPerGPerKmEur, 0)} / g/km / 台`,
    `- 手入力目標上書き: ${r.useManualTarget ? "あり" : "なし"}`,
  ].join("\n");
}

function formatResults(payload: AnalystRequestPayload): string {
  const r = payload.result;
  return [
    `- 達成見込み: ${r.isCompliant ? "達成" : "未達"}`,
    `- 規制達成率: ${formatAchievementRatePercent(r.achievementRatePercent, formatNumber)}`,
    `- フリート平均 CO₂: ${formatNumber(r.fleetAverageGPerKm)} g/km`,
    `- 実質排出量: ${formatNumber(r.effectiveEmissionsGPerKm)} g/km`,
    `- 超過 / 猶予: ${r.excessGPerKm > 0 ? "+" : ""}${formatNumber(r.excessGPerKm)} g/km`,
    `- 想定総罰金: € ${Math.round(r.totalPenaltyEur).toLocaleString("ja-JP")}`,
    `- 総販売台数: ${Math.round(r.totalSalesUnits).toLocaleString("ja-JP")} 台`,
    `- 総カウント台数: ${Math.round(r.totalCountedUnits).toLocaleString("ja-JP")} 台`,
  ].join("\n");
}

export function buildAnalysisPrompt(payload: AnalystRequestPayload): {
  system: string;
  user: string;
} {
  const system = `あなたは自動車業界の環境法規・渉外の専門家です。
欧州 CO₂ 規制シミュレーターの試算結果をもとに、社内向けの分析文案を Markdown で作成してください。

出力は必ず次の2セクションのみ（見出しはそのまま使用）:
1. ## 【ゴールシーク（逆算シナリオ）】
   - 罰金ゼロ・達成率100%に近づけるための具体策（BEV 増、高排出車抑制、WLTP 改善、スーパークレジット活用など）
   - 数値の根拠は入力データに沿うこと
2. ## 【エグゼクティブ・サマリー】
   - 経営層・他部署向けのリスク整理（3〜5 箇条書き）

制約:
- JAMA 向け文案は含めない
- 単一メーカー・プールなし・エコイノベ未反映の試算であることを前提に書く
- 架空のサンプル数値である可能性があるため、断定しすぎず「試算」「たたき台」のトーンを保つ`;

  const user = `以下のシミュレーション入力と計算結果を分析してください。

### 車種ポートフォリオ
${formatVehicleTable(payload)}

### 規制パラメータ
${formatRegulation(payload)}

### 計算結果（Pane 3）
${formatResults(payload)}`;

  return { system, user };
}

/** API キー未設定時のフォールバック（入力データに基づくテンプレート） */
export function buildMockAnalysisMarkdown(
  payload: AnalystRequestPayload,
): string {
  const { result } = payload;
  const achievement = formatAchievementRatePercent(
    result.achievementRatePercent,
    formatNumber,
  );
  const excessLabel =
    result.excessGPerKm <= 0
      ? `猶予 ${formatNumber(Math.abs(result.excessGPerKm))} g/km`
      : `超過 +${formatNumber(result.excessGPerKm)} g/km`;
  const penalty = Math.round(result.totalPenaltyEur).toLocaleString("ja-JP");
  const complianceLine = result.isCompliant
    ? "現状の試算では **達成見込み** です。余裕を維持するための構成比・WLTP 前提の確認を推奨します。"
    : "現状のポートフォリオでは **未達見込み** です。罰金ゼロ・達成率100%に近づけるには、次の組み合わせが有効なたたき台になります。";

  const actions = result.isCompliant
    ? [
        "1. **BEV 比率の維持** — 高排出 ICE/HEV の構成比が増えないよう販売計画を確認する",
        "2. **WLTP 前提の更新** — PHEV / ICE の改善前提が古い場合、試算が楽観的になっていないか点検する",
        "3. **規制シナリオの切替** — 議会修正案など厳格プリセットでも余裕が残るか確認する",
      ]
    : [
        "1. **BEV（通常）の販売台数を増やし**、高排出の ICE/HEV 構成比を下げる",
        "2. **PHEV の WLTP を改善**する前提で、当該車種の販売を維持しつつフリート平均を押し下げる",
        "3. **小型 BEV の比率**を高め、スーパークレジット係数の効果を最大化する（規制シナリオ次第）",
      ];

  return `## 【ゴールシーク（逆算シナリオ）】

${complianceLine}

${actions.join("\n")}

※本回答は API キー未設定時のモックです。OpenAI 接続時は同一入力に基づく本番分析が生成されます。

---

## 【エグゼクティブ・サマリー】

- **リスク**: 対象年 ${payload.input.selectedYear} の実効目標 ${formatNumber(result.targetGPerKm)} g/km に対し、試算フリート平均は **${formatNumber(result.fleetAverageGPerKm)} g/km**（${excessLabel}）。規制達成率 **${achievement}**
- **罰金**: 想定総罰金 **約 € ${penalty}**（試算）
- **前提**: 単一メーカー・プールなし・エコイノベ未反映。ポートフォリオ: ${payload.portfolioLabel}
- **社内共有向け**: 設計・生産・販売は数値の根拠（ポートフォリオ表）と規制シナリオのプリセット名をセットで共有してください

---

*JAMA 向け文案は含みません（v1 合意どおり）。*`;
}

/** テスト・デバッグ用 */
export function summarizePayloadForTest(payload: AnalystRequestPayload): {
  achievementDb: number | null;
  vehicleCount: number;
} {
  return {
    achievementDb: normalizeAchievementRateForDb(
      payload.result.achievementRatePercent,
    ),
    vehicleCount: payload.input.vehicles.length,
  };
}
