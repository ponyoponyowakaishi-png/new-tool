import { describe, expect, it } from "vitest";
import { createInitialState } from "@/lib/defaults";
import { calculateFromState } from "@/lib/calculations";
import {
  buildAnalysisPrompt,
  buildMockAnalysisMarkdown,
} from "@/lib/ai-prompt";
import { PORTFOLIO_LABELS } from "@/lib/sample-data";
import { toCalculationInput } from "@/lib/selectors";

describe("buildAnalysisPrompt", () => {
  it("includes portfolio, regulation, and result sections", () => {
    const state = createInitialState();
    const payload = {
      input: toCalculationInput(state),
      result: calculateFromState(state),
      portfolioLabel: PORTFOLIO_LABELS[state.activePortfolio],
    };

    const { system, user } = buildAnalysisPrompt(payload);

    expect(system).toContain("ゴールシーク");
    expect(system).toContain("JAMA");
    expect(user).toContain(String(state.selectedYear));
    expect(user).toContain(payload.portfolioLabel);
    expect(user).toContain("想定総罰金");
  });
});

describe("buildMockAnalysisMarkdown", () => {
  it("reflects compliance status in the mock output", () => {
    const state = createInitialState();
    const payload = {
      input: toCalculationInput(state),
      result: calculateFromState(state),
      portfolioLabel: PORTFOLIO_LABELS[state.activePortfolio],
    };

    const markdown = buildMockAnalysisMarkdown(payload);

    expect(markdown).toContain("【ゴールシーク");
    expect(markdown).toContain("【エグゼクティブ・サマリー】");
    expect(markdown).toContain("JAMA 向け文案は含みません");
    if (payload.result.isCompliant) {
      expect(markdown).toContain("達成見込み");
    } else {
      expect(markdown).toContain("未達見込み");
    }
  });
});
