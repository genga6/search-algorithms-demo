# search-algorithms-demo

**🔗 ライブデモ: https://genga6.github.io/search-algorithms-demo/**

[![Deploy to GitHub Pages](https://github.com/genga6/search-algorithms-demo/actions/workflows/deploy.yml/badge.svg)](https://github.com/genga6/search-algorithms-demo/actions/workflows/deploy.yml)


探索・最適化アルゴリズムを、共通の **trace（イベント列）基盤**の上で可視化しながら
体系的に学ぶインタラクティブ・デモ集。設計思想と全体像は [`roadmap.md`](./roadmap.md) を参照。

## いま動くもの（バッチ 0 + 1）

- **基盤 (`src/core`)**：`SearchProblem` 型・`SearchEvent`・二分ヒープ・シード付き乱数・計測・`collect()`
- **グリッド探索デモ (`/grid`)**：同じ迷路の上で情報なし探索(A)・情報あり探索(B)を走らせて比較
  - 情報なし：BFS / DFS / IDDFS / UCS(Dijkstra) / 双方向
  - 情報あり：貪欲 / A\* / 重み付き A\* / IDA\* / ビーム
  - 再生バーでステップ実行、全手法の統計（展開数・コスト等）を横並び比較

## アーキテクチャの要

アルゴリズムは探索過程を `SearchEvent` として `yield` する**ジェネレータ**として書く。

- テスト時：`collect(algo(problem))` で全イベント＋結果を一括取得（純関数なので検証しやすい）
- 可視化時：`useTracePlayer` が `index` を進め、`GridView` がその地点までを畳んで描画

これでアルゴリズム本体・問題定義・描画が `SearchEvent[]` だけで疎結合になる。

## 開発

```bash
pnpm install
pnpm dev        # 開発サーバ (http://localhost:5173)
pnpm test       # Vitest（アルゴリズムの最適性・完全性を回帰テスト）
pnpm lint       # Biome
pnpm build      # 型チェック + 本番ビルド → dist/
```

## GitHub Pages へのデプロイ

`main` に push すると `.github/workflows/deploy.yml` が build → Pages へ公開する。
初回のみ、リポジトリの **Settings → Pages → Build and deployment → Source を「GitHub Actions」** に設定する。

- `vite.config.ts` の `base: "./"` で、プロジェクトサブパス配信でもアセットを正しく解決
- ルーティングは `HashRouter`（サーバ側リライト不要でリロードしても 404 にならない）

## スタック

Vite + React + TypeScript / TailwindCSS v4 / Biome / Vitest / pnpm
