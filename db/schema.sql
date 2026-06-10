-- =============================================================================
-- EU CO₂ 規制シナリオ・シミュレーター — PostgreSQL スキーマ定義
-- 設計: 案1 スナップショット型
--
-- 考え方:
--   「そのとき画面に表示されていた状態をまるごとひとつのレコードとして保存する」
--   scenarios が SimulatorState 全体の入れ物となり、
--   配下の表がポートフォリオ行・規制パラメータ・重量補正・計算結果・AI文案を保持する。
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 拡張機能
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid() 用

-- ---------------------------------------------------------------------------
-- 列挙型（ENUM）
-- ---------------------------------------------------------------------------

-- 車の動力方式
--   ICE_HEV  : ガソリン / ハイブリッド
--   PHEV     : プラグインハイブリッド
--   BEV_SMALL: 小型 EV（スーパークレジット対象）
--   BEV_NORMAL: 通常 EV
CREATE TYPE powertrain AS ENUM ('ICE_HEV', 'PHEV', 'BEV_SMALL', 'BEV_NORMAL');

-- ポートフォリオの基準年（2表独立）
--   '2025': 実績ベース
--   '2026': 予測ベース
CREATE TYPE portfolio_base_year AS ENUM ('2025', '2026');

-- 規制の対象年（シミュレーションで選択できる年）
CREATE TYPE regulation_year AS ENUM ('2025', '2027', '2030');

-- ---------------------------------------------------------------------------
-- scenarios — シナリオ（SimulatorState 全体のコンテナ）
-- ---------------------------------------------------------------------------
-- 1 レコード = 「名前をつけて保存したときの画面状態まるごと」
-- active_portfolio と selected_year は UI の表示選択状態を保持する
CREATE TABLE scenarios (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT        NOT NULL,                     -- ユーザーがつけたシナリオ名
    description      TEXT,                                     -- 任意メモ
    active_portfolio portfolio_base_year NOT NULL DEFAULT '2025', -- 保存時に選択中だったポートフォリオ表
    selected_year    regulation_year     NOT NULL DEFAULT '2027',  -- 保存時に選択中だった対象年
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  scenarios IS 'Pane1+Pane2 の全入力をまとめて保存するシナリオ。1行 = 1回の「保存」';
COMMENT ON COLUMN scenarios.active_portfolio IS '保存時点で Pane1 で選択中だったポートフォリオ表（2025実績 or 2026予測）';
COMMENT ON COLUMN scenarios.selected_year    IS '保存時点で Pane2 で選択中だった規制対象年';

-- ---------------------------------------------------------------------------
-- portfolio_rows — 車種行（Pane1）
-- ---------------------------------------------------------------------------
-- 1 scenario につき base_year ごとに最大 MAX_VEHICLES(10) 行
-- base_year で 2025実績表 / 2026予測表を区別する
CREATE TABLE portfolio_rows (
    id           UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id  UUID                NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    base_year    portfolio_base_year NOT NULL,   -- どちらの表の行か
    sort_order   SMALLINT            NOT NULL,   -- 表示順（0始まり）
    name         TEXT                NOT NULL DEFAULT '',  -- 車種名
    powertrain   powertrain          NOT NULL DEFAULT 'ICE_HEV',
    sales_count  INTEGER,                        -- 販売台数（台）。NULL = 未入力
    wltp_g_per_km NUMERIC(6, 2),                -- CO₂排出量（g/km）。BEV は 0 固定。NULL = 未入力
    weight_kg    NUMERIC(7, 1),                  -- 車両重量（kg）。NULL = 未入力

    CONSTRAINT portfolio_rows_sort_order_non_negative CHECK (sort_order >= 0),
    CONSTRAINT portfolio_rows_sales_count_non_negative CHECK (sales_count IS NULL OR sales_count >= 0),
    CONSTRAINT portfolio_rows_wltp_non_negative       CHECK (wltp_g_per_km IS NULL OR wltp_g_per_km >= 0),
    CONSTRAINT portfolio_rows_weight_non_negative     CHECK (weight_kg IS NULL OR weight_kg >= 0)
);

CREATE INDEX idx_portfolio_rows_scenario ON portfolio_rows (scenario_id, base_year, sort_order);

COMMENT ON TABLE  portfolio_rows IS 'Pane1 の車種行。scenario + base_year の組み合わせで 2025実績表 / 2026予測表を区別';
COMMENT ON COLUMN portfolio_rows.base_year    IS '2025 = 実績ベース, 2026 = 予測ベース';
COMMENT ON COLUMN portfolio_rows.sort_order   IS '0始まりの表示順。同一 (scenario_id, base_year) 内でユニークにする';
COMMENT ON COLUMN portfolio_rows.wltp_g_per_km IS 'BEV_SMALL / BEV_NORMAL は 0 で保存する。NULL は未入力';

-- ---------------------------------------------------------------------------
-- regulation_params — 年次規制パラメータ（Pane2）
-- ---------------------------------------------------------------------------
-- 1 scenario につき regulation_year 3行（2025 / 2027 / 2030）が入る
-- 年を切り替えても他年の値が消えない仕様を反映
CREATE TABLE regulation_params (
    id                          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id                 UUID            NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    regulation_year             regulation_year NOT NULL,   -- 2025 / 2027 / 2030

    -- 年次目標 CO₂（g/km）
    target_g_per_km             NUMERIC(6, 2),
    -- クレジット類（緩和分として目標から差し引く）
    fuel_credit_g_per_km        NUMERIC(6, 2) NOT NULL DEFAULT 0,
    green_steel_credit_g_per_km NUMERIC(6, 2) NOT NULL DEFAULT 0,
    -- 小型 EV のスーパークレジット係数（台数カウントに乗算）
    small_ev_super_credit_factor NUMERIC(5, 3) NOT NULL DEFAULT 1.0,
    -- 超過 1g/km あたりの罰金（ユーロ）
    penalty_per_g_eur           NUMERIC(8, 2) NOT NULL DEFAULT 95,
    -- 手入力目標 CO₂ の上書きフラグと値
    use_manual_target           BOOLEAN       NOT NULL DEFAULT FALSE,
    manual_target_g_per_km      NUMERIC(6, 2),              -- use_manual_target = TRUE のときのみ有効

    CONSTRAINT regulation_params_unique_year UNIQUE (scenario_id, regulation_year),
    CONSTRAINT regulation_params_target_non_negative     CHECK (target_g_per_km IS NULL OR target_g_per_km >= 0),
    CONSTRAINT regulation_params_fuel_credit_non_negative CHECK (fuel_credit_g_per_km >= 0),
    CONSTRAINT regulation_params_green_steel_non_negative CHECK (green_steel_credit_g_per_km >= 0),
    CONSTRAINT regulation_params_super_credit_positive   CHECK (small_ev_super_credit_factor > 0),
    CONSTRAINT regulation_params_penalty_non_negative    CHECK (penalty_per_g_eur >= 0),
    CONSTRAINT regulation_params_manual_target_non_negative
        CHECK (manual_target_g_per_km IS NULL OR manual_target_g_per_km >= 0)
);

CREATE INDEX idx_regulation_params_scenario ON regulation_params (scenario_id);

COMMENT ON TABLE  regulation_params IS 'Pane2 の年次規制パラメータ。scenario_id × regulation_year で一意';
COMMENT ON COLUMN regulation_params.use_manual_target      IS 'TRUE のとき target_g_per_km の代わりに manual_target_g_per_km を試算に使う';
COMMENT ON COLUMN regulation_params.manual_target_g_per_km IS 'Pane2「実効目標」の手入力値。use_manual_target = FALSE なら無視される';

-- ---------------------------------------------------------------------------
-- weight_coefficients — 重量補正係数（Pane2 詳細設定）
-- ---------------------------------------------------------------------------
-- EU 重量補正式: target = base_target + a * (M_avg - M0)
--   a  : 補正係数（デフォルト 0.0333）
--   m0 : 基準重量 kg（デフォルト 1377 kg）
-- scenarios と 1:1 のため UNIQUE 制約で保証
CREATE TABLE weight_coefficients (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID    NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    a           NUMERIC(8, 4) NOT NULL DEFAULT 0.0333,
    m0          NUMERIC(8, 1) NOT NULL DEFAULT 1377,

    CONSTRAINT weight_coefficients_unique_scenario UNIQUE (scenario_id),
    CONSTRAINT weight_coefficients_a_positive  CHECK (a > 0),
    CONSTRAINT weight_coefficients_m0_positive CHECK (m0 > 0)
);

COMMENT ON TABLE  weight_coefficients IS 'EU 重量補正式の係数。scenarios と 1:1';
COMMENT ON COLUMN weight_coefficients.a  IS '補正係数 a。デフォルト 0.0333（EU規制 Regulation (EU) 2019/631 Annex I）';
COMMENT ON COLUMN weight_coefficients.m0 IS '基準重量 M₀（kg）。デフォルト 1377 kg';

-- ---------------------------------------------------------------------------
-- scenario_results — 計算結果（Pane3 / Phase 2 で算出）
-- ---------------------------------------------------------------------------
-- 同一 scenario に対して selected_year ごとに結果が生まれる（最大3行）
-- Phase 2 で lib/calculations.ts が実装されたら INSERT/UPDATE される
CREATE TABLE scenario_results (
    id                        UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id               UUID            NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    selected_year             regulation_year NOT NULL,   -- どの対象年で計算した結果か

    -- CalculationResult の各フィールド（lib/types.ts と対応）
    fleet_avg_g_per_km        NUMERIC(7, 3)  NOT NULL, -- フリート平均 CO₂（g/km）
    effective_emissions_g_per_km NUMERIC(7, 3) NOT NULL, -- クレジット反映後の実質排出（g/km）
    target_g_per_km           NUMERIC(7, 3)  NOT NULL, -- 比較対象の目標 CO₂（g/km）
    achievement_rate_percent  NUMERIC(7, 3),           -- 達成率（%）。目標 0 等で計算不能なら NULL
    excess_g_per_km           NUMERIC(7, 3)  NOT NULL, -- 超過量（g/km）。正=超過、負=猶予
    total_penalty_eur         NUMERIC(15, 2) NOT NULL, -- 想定総罰金（ユーロ）
    total_counted_units       INTEGER        NOT NULL, -- スーパークレジット反映後のカウント台数
    total_sales_units         INTEGER        NOT NULL, -- 実販売台数合計
    is_compliant              BOOLEAN        NOT NULL, -- 達成見込みか

    calculated_at             TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT scenario_results_unique_year UNIQUE (scenario_id, selected_year),
    CONSTRAINT scenario_results_fleet_avg_non_negative   CHECK (fleet_avg_g_per_km >= 0),
    CONSTRAINT scenario_results_target_non_negative      CHECK (target_g_per_km >= 0),
    CONSTRAINT scenario_results_total_penalty_non_negative CHECK (total_penalty_eur >= 0),
    CONSTRAINT scenario_results_counted_units_non_negative CHECK (total_counted_units >= 0),
    CONSTRAINT scenario_results_sales_units_non_negative   CHECK (total_sales_units >= 0)
);

CREATE INDEX idx_scenario_results_scenario ON scenario_results (scenario_id);

COMMENT ON TABLE  scenario_results IS 'Pane3 の計算結果。Phase 2 で lib/calculations.ts が実装されたら INSERT される';
COMMENT ON COLUMN scenario_results.excess_g_per_km IS '正の値 = 目標超過（未達）、負の値 = 目標達成余力あり';
COMMENT ON COLUMN scenario_results.total_penalty_eur IS '超過g/km × 超過排出プレミアム（€95）× 台数 で算出';

-- ---------------------------------------------------------------------------
-- ai_analyses — AI 分析文案（Pane4 / Phase 2 で生成）
-- ---------------------------------------------------------------------------
-- 同一 scenario × selected_year に対して複数の文案が生成されうるため
-- UNIQUE は付けない（再生成のたびに新しい行が追加される）
CREATE TABLE ai_analyses (
    id            UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id   UUID            NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    selected_year regulation_year NOT NULL,   -- どの対象年の結果に基づいて生成された文案か
    markdown_text TEXT            NOT NULL,   -- Pane4 に表示する Markdown 本文
    created_at    TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_analyses_scenario ON ai_analyses (scenario_id, selected_year, created_at DESC);

COMMENT ON TABLE  ai_analyses IS 'Pane4 の AI 分析文案。再生成のたびに行が追加される。Phase 2 で LLM API 接続後に使用';
COMMENT ON COLUMN ai_analyses.markdown_text IS 'ゴールシーク案・エグゼクティブサマリーなど複数ブロックを含む Markdown';

-- ---------------------------------------------------------------------------
-- updated_at 自動更新トリガー
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_scenarios
    BEFORE UPDATE ON scenarios
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();
