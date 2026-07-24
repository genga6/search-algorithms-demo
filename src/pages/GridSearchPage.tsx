import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { ALGORITHMS, ALGORITHMS_BY_ID } from "../algorithms/registry.js"
import { collect } from "../core/collect.js"
import { DEFAULT_PRESET_ID, GRID_PRESETS } from "../lib/presets.js"
import { gridProblem } from "../problems/grid.js"
import { GridView } from "../viz/GridView.js"
import { PlayerControls } from "../viz/PlayerControls.js"
import { StatsPanel } from "../viz/StatsPanel.js"
import { useTracePlayer } from "../viz/useTracePlayer.js"

export function GridSearchPage() {
  // Home の A/B カードから ?algo=... で初期アルゴリズムを受け取る（無ければ astar）
  const [searchParams] = useSearchParams()
  const initialAlgo =
    searchParams.get("algo") && ALGORITHMS_BY_ID[searchParams.get("algo") as string]
      ? (searchParams.get("algo") as string)
      : "astar"

  const [presetId, setPresetId] = useState(DEFAULT_PRESET_ID)
  const [algoId, setAlgoId] = useState(initialAlgo)

  const preset = GRID_PRESETS.find((p) => p.id === presetId) ?? GRID_PRESETS[0]!
  const algo = ALGORITHMS_BY_ID[algoId]!

  const spec = useMemo(() => preset.make(), [preset])
  const problem = useMemo(() => gridProblem(spec), [spec])
  const result = useMemo(() => collect(algo.run(problem)), [algo, problem])
  const player = useTracePlayer(result.trace.length)

  // 同じ盤面で全手法を走らせて統計を並べる
  const comparison = useMemo(
    () => ALGORITHMS.map((a) => ({ algo: a, res: collect(a.run(problem)) })),
    [problem],
  )

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">グリッド探索</h1>
        <p className="mt-1 text-sm text-slate-600">
          同じ迷路の上で情報なし探索(A)・情報あり探索(B)を走らせ、広がり方・解の質・展開ノード数を見比べる。
        </p>
      </header>

      {/* 操作：プリセットとアルゴリズム */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">マップ</span>
          <select
            value={presetId}
            onChange={(e) => setPresetId(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            {GRID_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-500">{preset.description}</span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">アルゴリズム</span>
          <select
            value={algoId}
            onChange={(e) => setAlgoId(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <optgroup label="A. 情報なし探索">
              {ALGORITHMS.filter((a) => a.category === "uninformed").map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="B. 情報あり探索">
              {ALGORITHMS.filter((a) => a.category === "informed").map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </optgroup>
          </select>
          <span className="text-xs text-slate-500">{algo.blurb}</span>
        </label>
      </div>

      {/* 本体：グリッド ＋ 統計 */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <GridView spec={spec} trace={result.trace} index={player.index} />
          <PlayerControls player={player} />
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600">
              <span>完全性: {algo.complete}</span>
              <span>最適性: {algo.optimal}</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">{algo.complexity}</div>
          </div>
          <StatsPanel result={result} />
        </div>
      </div>

      {/* 横並び比較 */}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-slate-800">この迷路での全手法の比較</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-left text-slate-500">
                <th className="py-2 pr-4">手法</th>
                <th className="py-2 pr-4 text-right">コスト</th>
                <th className="py-2 pr-4 text-right">手数</th>
                <th className="py-2 pr-4 text-right">展開</th>
                <th className="py-2 pr-4 text-right">生成</th>
                <th className="py-2 pr-4 text-right">最大幅</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map(({ algo: a, res }) => (
                <tr
                  key={a.id}
                  className={`border-b border-slate-100 ${a.id === algoId ? "bg-amber-50" : ""}`}
                >
                  <td className="py-1.5 pr-4">
                    <button
                      type="button"
                      onClick={() => setAlgoId(a.id)}
                      className="text-slate-700 hover:text-amber-700 hover:underline"
                    >
                      {a.label}
                    </button>
                  </td>
                  <td className="py-1.5 pr-4 text-right tabular-nums">
                    {res.truncated ? "打ち切り" : res.found ? res.cost : "—"}
                  </td>
                  <td className="py-1.5 pr-4 text-right tabular-nums">
                    {res.found ? res.actions.length : "—"}
                  </td>
                  <td className="py-1.5 pr-4 text-right tabular-nums">{res.stats.expanded}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums">{res.stats.generated}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums">{res.stats.frontierMax}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500">
          行をクリックするとそのアルゴリズムに切り替わる。UCS(≒BFS)は一様に多く展開、貪欲は少ないが非最適、A*は最適かつ少数、という三者関係が数字で見える。
        </p>
      </section>
    </div>
  )
}
