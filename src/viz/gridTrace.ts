import type { SearchEvent } from "../core/events.js"
import { type Cell, cellKey } from "../problems/grid.js"

export type CellStatus = "frontier" | "expanded" | "current" | "pruned" | "path"

/** trace の先頭〜index までを畳んで、各マスの表示状態を求める。 */
export interface GridFold {
  status: Map<string, CellStatus>
  /** ちょうど今 pop したマス（強調表示用）。無ければ null */
  current: string | null
  /** これまでに解が確定したか */
  solved: boolean
}

/**
 * イベント列を index まで再生した結果の「見え方」を計算する純関数。
 * push→frontier, pop→current/expanded, prune→pruned, solution→path。
 * 小さなグリッドなら毎フレーム畳んでも十分軽い。
 */
export function foldGridTrace(trace: SearchEvent<Cell>[], upto: number): GridFold {
  const status = new Map<string, CellStatus>()
  let current: string | null = null
  let solved = false

  const set = (key: string, s: CellStatus) => status.set(key, s)

  const end = Math.min(upto, trace.length)
  for (let i = 0; i < end; i++) {
    const ev = trace[i]
    if (!ev) continue
    // このステップで pop したマスだけを current にしたいので毎回クリア
    if (i === end - 1) current = null

    switch (ev.type) {
      case "push":
      case "relax": {
        const key = cellKey(ev.state)
        if (status.get(key) !== "path") set(key, "frontier")
        break
      }
      case "pop": {
        const key = cellKey(ev.state)
        set(key, "expanded")
        if (i === end - 1) current = key
        break
      }
      case "close":
        set(cellKey(ev.state), "expanded")
        break
      case "prune":
        set(cellKey(ev.state), "pruned")
        break
      case "solution": {
        solved = true
        for (const cell of ev.path) set(cellKey(cell), "path")
        break
      }
      // goal / note は色に影響しない
    }
  }

  return { status, current, solved }
}
