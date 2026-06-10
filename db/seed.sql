-- =============================================================================
-- EU CO₂ 規制シナリオ・シミュレーター — 初期データ（シードデータ）
-- =============================================================================
-- このファイルは schema.sql 適用後に実行する。
-- lib/defaults.ts の createInitialState() と同じ内容を SQL で表現したもの。
-- 本番運用では毎回実行しなくてよい（開発・テスト環境のリセット用）。
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- シナリオ: 「デフォルトシナリオ（欧州委員会案ベース）」
-- ---------------------------------------------------------------------------
-- UUID を固定することで再実行時に冪等（何度実行しても同じ結果）にする
INSERT INTO scenarios (id, name, description, active_portfolio, selected_year)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'デフォルトシナリオ（欧州委員会案ベース）',
    '初期起動時の状態。2025実績・2026予測の両ポートフォリオと欧州委員会案の規制値を含む。',
    '2025',
    '2027'
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- portfolio_rows — 2025 実績ベース（lib/defaults.ts の SAMPLE_VEHICLES_2025 と対応）
-- ---------------------------------------------------------------------------
INSERT INTO portfolio_rows
    (scenario_id, base_year, sort_order, name, powertrain, sales_count, wltp_g_per_km, weight_kg)
VALUES
    ('00000000-0000-0000-0000-000000000001', '2025', 0, 'コンパクト（ICE/HEV）',  'ICE_HEV',    12500, 118,  1420),
    ('00000000-0000-0000-0000-000000000001', '2025', 1, 'セダン（PHEV）',          'PHEV',        8200,  42,  1680),
    ('00000000-0000-0000-0000-000000000001', '2025', 2, 'SUV（PHEV）',             'PHEV',        6100,  48,  1920),
    ('00000000-0000-0000-0000-000000000001', '2025', 3, 'ハッチ（BEV・小型）',    'BEV_SMALL',   4500,   0,  1280),
    ('00000000-0000-0000-0000-000000000001', '2025', 4, 'クロスオーバー（BEV）',  'BEV_NORMAL', 11200,   0,  1850),
    ('00000000-0000-0000-0000-000000000001', '2025', 5, 'ミニバン（ICE/HEV）',    'ICE_HEV',     6000, 132,  1780)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- portfolio_rows — 2026 予測ベース（lib/defaults.ts の SAMPLE_VEHICLES_2026 と対応）
-- ---------------------------------------------------------------------------
INSERT INTO portfolio_rows
    (scenario_id, base_year, sort_order, name, powertrain, sales_count, wltp_g_per_km, weight_kg)
VALUES
    ('00000000-0000-0000-0000-000000000001', '2026', 0, 'コンパクト（ICE/HEV）',  'ICE_HEV',    11800, 115,  1410),
    ('00000000-0000-0000-0000-000000000001', '2026', 1, 'セダン（PHEV）',          'PHEV',        9000,  40,  1670),
    ('00000000-0000-0000-0000-000000000001', '2026', 2, 'SUV（PHEV）',             'PHEV',        7200,  46,  1910),
    ('00000000-0000-0000-0000-000000000001', '2026', 3, 'ハッチ（BEV・小型）',    'BEV_SMALL',   5800,   0,  1270),
    ('00000000-0000-0000-0000-000000000001', '2026', 4, 'クロスオーバー（BEV）',  'BEV_NORMAL', 13500,   0,  1840)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- regulation_params — 3年分（lib/defaults.ts の createYearRegulation() と対応）
--
-- INITIAL_YEAR_TARGETS: 2025=95, 2027=90, 2030=85 g/km
-- 欧州委員会案ベース: fuelCredit=0, greenSteelCredit=0, superCreditFactor=1.0
-- penaltyPerG = 95 EUR（EU規制の超過排出プレミアム）
-- ---------------------------------------------------------------------------
INSERT INTO regulation_params
    (scenario_id, regulation_year,
     target_g_per_km, fuel_credit_g_per_km, green_steel_credit_g_per_km,
     small_ev_super_credit_factor, penalty_per_g_eur,
     use_manual_target, manual_target_g_per_km)
VALUES
    ('00000000-0000-0000-0000-000000000001', '2025', 95, 0, 0, 1.0, 95, FALSE, NULL),
    ('00000000-0000-0000-0000-000000000001', '2027', 90, 0, 0, 1.0, 95, FALSE, NULL),
    ('00000000-0000-0000-0000-000000000001', '2030', 85, 0, 0, 1.0, 95, FALSE, NULL)
ON CONFLICT (scenario_id, regulation_year) DO NOTHING;

-- ---------------------------------------------------------------------------
-- weight_coefficients（lib/constants.ts の DEFAULT_WEIGHT_COEFFICIENTS と対応）
-- a = 0.0333, m0 = 1377 kg
-- ---------------------------------------------------------------------------
INSERT INTO weight_coefficients (scenario_id, a, m0)
VALUES ('00000000-0000-0000-0000-000000000001', 0.0333, 1377)
ON CONFLICT (scenario_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 欧州議会修正案ベースのサンプルシナリオ
-- ---------------------------------------------------------------------------
INSERT INTO scenarios (id, name, description, active_portfolio, selected_year)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '比較シナリオ（欧州議会修正案ベース）',
    'デフォルトシナリオと同じポートフォリオで規制値を議会修正案に変えたサンプル。',
    '2025',
    '2027'
)
ON CONFLICT (id) DO NOTHING;

-- 2025 ポートフォリオをそのままコピー
INSERT INTO portfolio_rows
    (scenario_id, base_year, sort_order, name, powertrain, sales_count, wltp_g_per_km, weight_kg)
VALUES
    ('00000000-0000-0000-0000-000000000002', '2025', 0, 'コンパクト（ICE/HEV）',  'ICE_HEV',    12500, 118,  1420),
    ('00000000-0000-0000-0000-000000000002', '2025', 1, 'セダン（PHEV）',          'PHEV',        8200,  42,  1680),
    ('00000000-0000-0000-0000-000000000002', '2025', 2, 'SUV（PHEV）',             'PHEV',        6100,  48,  1920),
    ('00000000-0000-0000-0000-000000000002', '2025', 3, 'ハッチ（BEV・小型）',    'BEV_SMALL',   4500,   0,  1280),
    ('00000000-0000-0000-0000-000000000002', '2025', 4, 'クロスオーバー（BEV）',  'BEV_NORMAL', 11200,   0,  1850),
    ('00000000-0000-0000-0000-000000000002', '2025', 5, 'ミニバン（ICE/HEV）',    'ICE_HEV',     6000, 132,  1780)
ON CONFLICT DO NOTHING;

-- 欧州議会修正案の規制値:
--   target: 85 g/km（厳格化）、fuelCredit=1.5、greenSteelCredit=0.5、superCreditFactor=1.3
--   （lib/constants.ts の PRESETS.parliament と対応）
INSERT INTO regulation_params
    (scenario_id, regulation_year,
     target_g_per_km, fuel_credit_g_per_km, green_steel_credit_g_per_km,
     small_ev_super_credit_factor, penalty_per_g_eur,
     use_manual_target, manual_target_g_per_km)
VALUES
    ('00000000-0000-0000-0000-000000000002', '2025', 85, 1.5, 0.5, 1.3, 95, FALSE, NULL),
    ('00000000-0000-0000-0000-000000000002', '2027', 85, 1.5, 0.5, 1.3, 95, FALSE, NULL),
    ('00000000-0000-0000-0000-000000000002', '2030', 85, 1.5, 0.5, 1.3, 95, FALSE, NULL)
ON CONFLICT (scenario_id, regulation_year) DO NOTHING;

INSERT INTO weight_coefficients (scenario_id, a, m0)
VALUES ('00000000-0000-0000-0000-000000000002', 0.0333, 1377)
ON CONFLICT (scenario_id) DO NOTHING;

COMMIT;
