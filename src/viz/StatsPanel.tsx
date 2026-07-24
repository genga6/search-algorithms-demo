import type { SearchResult } from "../core/types.js"
import type { Cell, Move } from "../problems/grid.js"

const LEGEND: { color: string; label: string }[] = [
  { color: "#bfdbfe", label: "フロンティア(open)" },
  { color: "#c7d2cf", label: "展開済み(closed)" },
  { color: "#f59e0b", label: "展開中" },
  { color: "#fecaca", label: "枝刈り" },
  { color: "#4ade80", label: "最終経路" },
]

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold tabular-nums text-slate-800">{value}</div>
    </div>
  )
}

/** 解の質と効率を数値で見せるパネル＋凡例。 */
export function StatsPanel({ result }: { result: SearchResult<Cell, Move> }) {
  const { stats } = result
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat
          label="解の有無"
          value={result.truncated ? "打ち切り" : result.found ? "発見" : "なし"}
        />
        <Stat label="経路コスト" value={result.found ? result.cost : "—"} />
        <Stat label="経路長(手数)" value={result.found ? result.actions.length : "—"} />
        <Stat label="展開ノード" value={stats.expanded} />
        <Stat label="生成ノード" value={stats.generated} />
        <Stat label="最大フロンティア幅" value={stats.frontierMax} />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-600">
        {LEGEND.map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3.5 w-3.5 rounded-sm border border-slate-300"
              style={{ backgroundColor: l.color }}
            />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  )
}
