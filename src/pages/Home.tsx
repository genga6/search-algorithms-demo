import { Link } from "react-router-dom"

interface Family {
  id: string
  title: string
  items: string
  status: "ready" | "planned"
  to?: string
}

// roadmap 3 の系統マップ。実装済みのバッチはリンクを張る。
const FAMILIES: Family[] = [
  {
    id: "A",
    title: "情報なし探索",
    items: "BFS / DFS / IDDFS / UCS / 双方向",
    status: "ready",
    to: "/grid?algo=bfs", // BFS を初期選択で開く
  },
  {
    id: "B",
    title: "情報あり探索",
    items: "貪欲 / A* / 重み付きA* / IDA* / ビーム",
    status: "ready",
    to: "/grid?algo=astar", // A* を初期選択で開く
  },
  {
    id: "C",
    title: "動的計画法(DP)",
    items: "最短路DP / ナップサック / 編集距離",
    status: "planned",
  },
  {
    id: "D",
    title: "系統的最適化・枝刈り",
    items: "バックトラッキング / CSP / 分枝限定法",
    status: "planned",
  },
  { id: "E", title: "ゲーム木", items: "Minimax / Alpha-Beta / MCTS", status: "planned" },
  {
    id: "F",
    title: "局所探索・メタヒューリスティクス",
    items: "山登り / 焼きなまし / タブー / GA / PSO",
    status: "planned",
  },
  { id: "G", title: "確率的手法", items: "モンテカルロ / MCMC", status: "planned" },
  {
    id: "H",
    title: "勾配ベース最適化",
    items: "GD/SGD / Momentum / RMSProp / Adam",
    status: "planned",
  },
  { id: "I", title: "モデルベース最適化", items: "ベイズ最適化(GP)", status: "planned" },
  { id: "J", title: "強化学習", items: "バンディット / Q学習 / SARSA", status: "planned" },
]

function FamilyCard({ f }: { f: Family }) {
  const inner = (
    <div
      className={`flex h-full flex-col gap-1 rounded-xl border p-4 transition ${
        f.status === "ready"
          ? "border-slate-200 bg-white shadow-sm hover:border-amber-300 hover:shadow"
          : "border-dashed border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-800 text-xs font-bold text-white">
          {f.id}
        </span>
        <h2 className="font-semibold text-slate-800">{f.title}</h2>
        {f.status !== "ready" && (
          <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-500">
            準備中
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500">{f.items}</p>
    </div>
  )
  return f.to ? (
    <Link to={f.to} className="block">
      {inner}
    </Link>
  ) : (
    inner
  )
}

export function Home() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-800">探索アルゴリズムデモ</h1>
        <p className="max-w-2xl text-slate-600">
          膨大な状態空間から効率よく「それなりに良い解」を見つける営みを、主要アルゴリズムを
          可視化しながら体系的に理解する。すべて共通の trace（イベント列）基盤の上で動く。
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {FAMILIES.map((f) => (
          <FamilyCard key={f.id} f={f} />
        ))}
      </section>
    </div>
  )
}
