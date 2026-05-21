# 欧州CO₂規制シナリオ・シミュレーター

個人PC上で動かす Next.js 試作ツール。**横4ペイン**ワークスペース（Pane 1・2・4 は操作可能、Pane 3 は固定デモ数値）。

## ドキュメント

- [グリル合意一覧](docs/eu-co2-simulator-grill-decisions.md)
- [UI 実装計画](docs/eu-co2-simulator-ui-plan.md)

## 開発

```bash
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

```bash
npm run build   # 本番ビルド確認
npm test        # 状態ルールの最小テスト
```

## スコープ（現時点）

| 含む | 含まない（Phase 2） |
|------|---------------------|
| 4ペイン UI・サンプルデータ | `lib/calculations.ts` 本番計算 |
| 2025/2026 ポートフォリオ編集 | localStorage / JSON 入出力 |
| 規制プリセット・年次編集 | LLM API 本番送信 |
