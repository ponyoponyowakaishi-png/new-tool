# 欧州CO₂規制シナリオ・シミュレーター

Vercel + Neon 上で動かす Next.js 試作ツール（Basic 認証）。**横4ペイン**ワークスペース。

## ドキュメント

- [グリル合意一覧](docs/eu-co2-simulator-grill-decisions.md) — §17 に保存方針
- [データ保存の図解](docs/co2-simulator-data-persistence.html)
- [UI 実装計画（Phase 1・完了）](docs/eu-co2-simulator-ui-plan.md)
- [Phase 2 実装計画](docs/eu-co2-simulator-phase2-plan.md) — 計算・DB 保存・デプロイ
- [DB セットアップ](db/README.md)

## 開発

```bash
npm install
npm run dev
```

```bash
npm run build
npm test
```

環境変数（`.env.local` または Vercel）:

| 変数 | 用途 |
|------|------|
| `DATABASE_URL` | Neon PostgreSQL 接続 |
| `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD` | 本番 Basic 認証（未設定時は開発でスキップ） |
| `OPENAI_API_KEY` | Pane4 AI 分析（未設定時はモック） |

`.env.example` をコピーして `.env.local` を作成してください。

### DB セットアップ（初回）

```bash
npm run db:migrate
npm run db:seed   # 開発・ステージングのみ。本番 Neon では実行しない
```

### Vercel デプロイ

1. Vercel にリポジトリを接続
2. 環境変数 `DATABASE_URL`, `BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD` を設定（`OPENAI_API_KEY` は任意）
3. 本番 Neon に `npm run db:migrate` でスキーマ適用（seed は不要）
4. デプロイ

## スコープ

| Phase 1（完了） | Phase 2（完了） |
|-----------------|---------------|
| 4ペイン UI・サンプルデータ | `lib/calculations.ts` 本番計算 |
| Pane3 固定デモ | Pane3 リアルタイム連動 |
| 規制プリセット・年次編集 | Neon への名前付きシナリオ保存 |
| | Basic 認証 + Vercel デプロイ + Pane4 AI |

**v1 で使わない**: localStorage、JSON 入出力、`ai_analyses` への保存。
