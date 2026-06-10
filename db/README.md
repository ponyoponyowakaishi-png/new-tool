# DB 設計・セットアップガイド

EU CO₂ 規制シナリオ・シミュレーターのデータベース関連ファイルの説明と起動手順です。

---

## ファイル構成

```
db/
  schema.sql   テーブル・ENUM・制約・インデックスの定義
  seed.sql     開発・テスト用の初期データ（デフォルトシナリオ2件）
lib/
  db-types.ts  PostgreSQL 行型の TypeScript 定義 + ドメイン型との変換ヘルパー
```

---

## 設計方針（案1: スナップショット型）

「そのとき画面に表示されていた状態をまるごと1レコードとして保存する」という設計です。
`scenarios` テーブルが中心にあり、配下の4テーブルがぶら下がります。

```
scenarios
  │
  ├── portfolio_rows       (Pane1: 車種行。base_year で 2025実績表/2026予測表を区別)
  ├── regulation_params    (Pane2: 年次規制パラメータ。regulation_year 3行)
  ├── weight_coefficients  (Pane2 詳細: 重量補正係数 a, M₀)
  ├── scenario_results     (Pane3: 計算結果。Phase 2 で INSERT)
  └── ai_analyses          (Pane4: AI文案。Phase 2 で INSERT)
```

ドメイン型（`lib/types.ts`）との対応:

| テーブル             | 対応するドメイン型         |
|----------------------|---------------------------|
| `scenarios`          | `SimulatorState`（の選択状態）|
| `portfolio_rows`     | `VehicleRow`               |
| `regulation_params`  | `YearRegulation`           |
| `weight_coefficients`| `WeightCoefficients`       |
| `scenario_results`   | `CalculationResult`        |
| `ai_analyses`        | Pane4 の markdown_text     |

---

## セットアップ手順

### 前提

- PostgreSQL 15 以上がインストール済みであること
- `psql` コマンドが使えること

### 1. データベースを作成する

```bash
createdb eu_co2_simulator
```

### 2. スキーマを適用する

```bash
psql -d eu_co2_simulator -f db/schema.sql
```

実行すると以下が作成されます:
- `pgcrypto` 拡張（UUID生成用）
- ENUM 型: `powertrain`, `portfolio_base_year`, `regulation_year`
- テーブル: `scenarios`, `portfolio_rows`, `regulation_params`, `weight_coefficients`, `scenario_results`, `ai_analyses`
- インデックス・制約・`updated_at` 自動更新トリガー

### 3. 初期データを投入する（任意）

開発時のリセットや動作確認に使います。本番では不要です。

```bash
psql -d eu_co2_simulator -f db/seed.sql
```

投入されるデータ:
- `デフォルトシナリオ（欧州委員会案ベース）` — アプリ初期表示と同じ車種・規制値
- `比較シナリオ（欧州議会修正案ベース）` — 同じポートフォリオで規制のみ厳格化したもの

`ON CONFLICT DO NOTHING` を使っているため、**何度実行しても安全**です。

---

## Docker で PostgreSQL を動かす場合

```bash
docker run -d \
  --name eu-co2-db \
  -e POSTGRES_DB=eu_co2_simulator \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15-alpine
```

起動後に schema.sql と seed.sql を適用します:

```bash
psql -h localhost -U postgres -d eu_co2_simulator -f db/schema.sql
psql -h localhost -U postgres -d eu_co2_simulator -f db/seed.sql
```

---

## TypeScript からの使い方（lib/db-types.ts）

`lib/db-types.ts` はテーブルの行型と、ドメイン型（`lib/types.ts`）との変換ヘルパーを提供します。
DB ライブラリ（`pg`, `postgres.js`, Drizzle ORM 等）と組み合わせて使います。

```ts
import { toVehicleRow, toYearRegulation } from "@/lib/db-types";

// DB から取得した portfolio_rows の行をドメイン型に変換する例
const vehicleRows = dbRows.map(toVehicleRow);

// ドメイン型を DB 用の INSERT ペイロードに変換する例
import { toInsertPortfolioRow } from "@/lib/db-types";
const payload = toInsertPortfolioRow(vehicleRow, scenarioId, "2025", 0);
```

---

## スキーマのリセット（開発時）

```bash
dropdb eu_co2_simulator && createdb eu_co2_simulator
psql -d eu_co2_simulator -f db/schema.sql
psql -d eu_co2_simulator -f db/seed.sql
```

---

## Phase 2 での拡張予定

現時点では `scenario_results` と `ai_analyses` は空です。
Phase 2 で以下が実装されると使われるようになります:

- `lib/calculations.ts` — `CalculationInput` → `CalculationResult` を算出し `scenario_results` に INSERT
- Pane4 の LLM API 呼び出し — 生成された Markdown を `ai_analyses` に INSERT
