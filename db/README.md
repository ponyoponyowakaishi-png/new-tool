# DB 設計・セットアップガイド

EU CO₂ 規制シナリオ・シミュレーターのデータベース関連ファイルの説明と起動手順です。

**永続化方針の全体像**は [docs/eu-co2-simulator-grill-decisions.md §17](../docs/eu-co2-simulator-grill-decisions.md)、[図解 HTML](../docs/co2-simulator-data-persistence.html)、[Phase 2 計画](../docs/eu-co2-simulator-phase2-plan.md) を参照。

---

## Git と DB の境界

| 置き場所 | ファイル / テーブル | 役割 |
|----------|---------------------|------|
| **Git** | `db/schema.sql` | テーブル設計図 |
| **Git** | `lib/constants.ts` | 委員会案 / 議会案プリセット（ボタン用） |
| **Git** | `lib/defaults.ts` | **サンプル初期値の正**。新規シナリオ雛形・DB 空時の画面表示 |
| **Git（dev のみ）** | `db/seed.sql` | 開発／ステージング DB リセット用。**本番 Neon には流さない** |
| **Neon DB** | `scenarios` 以下 | ユーザーが保存した名前付きシナリオ + 計算結果 |

**二重化について**: `seed.sql` は `lib/defaults.ts` と同じサンプル数値を SQL で書いたコピーです。数値を変えるときは **defaults.ts を先に更新**し、seed.sql を手動で揃えてください。

---

## ファイル構成

```
db/
  schema.sql   テーブル・ENUM・制約・インデックスの定義
  seed.sql     開発・テスト用の初期データ（本番では使わない）
  migrate.mjs  schema + seed を Neon/ローカルに適用（開発用）
lib/
  db-types.ts  PostgreSQL 行型の TypeScript 定義 + ドメイン型との変換ヘルパー
  db.ts        Neon サーバーレス接続
```

---

## 設計方針（案1: スナップショット型）

「そのとき画面に表示されていた状態をまるごと1レコードとして保存する」という設計です。
`scenarios` テーブルが中心にあり、配下の表がぶら下がります。

```
scenarios
  │
  ├── portfolio_rows       (Pane1: 車種行。base_year で 2025実績表/2026予測表を区別)
  ├── regulation_params    (Pane2: 年次規制パラメータ。regulation_year 3行)
  ├── weight_coefficients  (Pane2 詳細: 重量補正係数 a, M₀)
  ├── scenario_results     (Pane3: 保存時の計算結果。3年分 UPSERT)
  └── ai_analyses          (Pane4: v1 未使用 — AI 文案は都度再生成)
```

ドメイン型（`lib/types.ts`）との対応:

| テーブル             | 対応するドメイン型         | v1 |
|----------------------|---------------------------|-----|
| `scenarios`          | `SimulatorState`（の選択状態）| 使う |
| `portfolio_rows`     | `VehicleRow`               | 使う |
| `regulation_params`  | `YearRegulation`           | 使う |
| `weight_coefficients`| `WeightCoefficients`       | 使う |
| `scenario_results`   | `CalculationResult`        | 使う（保存時3年分） |
| `ai_analyses`        | Pane4 の markdown_text     | **未使用** |

---

## セットアップ手順（開発環境）

### 前提

- PostgreSQL 15 以上、または Neon の DATABASE_URL
- `psql` または `node db/migrate.mjs`

### 1. スキーマを適用する

```bash
psql "$DATABASE_URL" -f db/schema.sql
# または
node db/migrate.mjs
```

### 2. 開発用シードを投入する（任意・dev/staging のみ）

```bash
psql "$DATABASE_URL" -f db/seed.sql
```

投入されるデータ（defaults.ts と同内容）:
- `デフォルトシナリオ（欧州委員会案ベース）`
- `比較シナリオ（欧州議会修正案ベース）`

**本番 Neon では seed.sql を実行しない。** 初回はアプリが `defaults.ts` で画面表示し、ユーザーの初回「保存」で DB に1件目が作成される。

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

```bash
psql -h localhost -U postgres -d eu_co2_simulator -f db/schema.sql
psql -h localhost -U postgres -d eu_co2_simulator -f db/seed.sql
```

---

## TypeScript からの使い方

```ts
import { sql } from "@/lib/db";
import { toVehicleRow, toInsertPortfolioRow } from "@/lib/db-types";

const rows = await sql`SELECT * FROM scenarios ORDER BY updated_at DESC`;
```

Server Actions / Route Handlers 内でのみ `lib/db.ts` を import すること（クライアントコンポーネントからは不可）。

---

## スキーマのリセット（開発時）

```bash
dropdb eu_co2_simulator && createdb eu_co2_simulator
psql -d eu_co2_simulator -f db/schema.sql
psql -d eu_co2_simulator -f db/seed.sql
```

---

## Phase 2 実装

詳細は [docs/eu-co2-simulator-phase2-plan.md](../docs/eu-co2-simulator-phase2-plan.md):

- `lib/calculations.ts` — 計算 + 保存時3年分の `scenario_results`
- Server Actions — list / load / save / delete
- Basic 認証 + Vercel デプロイ
