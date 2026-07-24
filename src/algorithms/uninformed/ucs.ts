import { StatsCounter } from "../../core/metrics.js"
import { MinHeap } from "../../core/priorityQueue.js"
import type { SearchGen, SearchProblem } from "../../core/types.js"
import { actionsFromPath, reconstructPath } from "../shared.js"

/**
 * 一様コスト探索(UCS) = Dijkstra。
 * 確定距離 g の小さい順に取り出す。確定距離が波紋状に拡大する。
 * 非負コストなら完全かつ最適。
 */
export function* ucs<S, A>(p: SearchProblem<S, A>): SearchGen<S, A> {
  const stats = new StatsCounter()
  const start = p.initial
  const startKey = p.key(start)

  const frontier = new MinHeap<S>()
  const bestG = new Map<string, number>([[startKey, 0]])
  const parent = new Map<string, S>()
  const closed = new Set<string>()

  frontier.push(start, 0)
  stats.generate()
  yield { type: "push", state: start, g: 0, parent: null }

  while (!frontier.isEmpty()) {
    stats.observeFrontier(frontier.size)
    const node = frontier.pop() as S
    const nodeKey = p.key(node)
    if (closed.has(nodeKey)) continue // 古い（改善済みの）エントリ
    closed.add(nodeKey)
    const g = bestG.get(nodeKey) ?? 0
    stats.expand()
    yield { type: "pop", state: node }

    if (p.isGoal(node)) {
      yield { type: "goal", state: node }
      const path = reconstructPath(parent, p.key, node)
      yield { type: "solution", path }
      return {
        found: true,
        path,
        actions: actionsFromPath(p, path),
        cost: g,
        stats: stats.snapshot(),
      }
    }

    yield { type: "close", state: node }
    for (const a of p.actions(node)) {
      const child = p.result(node, a)
      const childKey = p.key(child)
      if (closed.has(childKey)) continue
      const tentative = g + p.stepCost(node, a, child)
      const known = bestG.get(childKey)
      if (known === undefined || tentative < known) {
        bestG.set(childKey, tentative)
        parent.set(childKey, node)
        frontier.push(child, tentative)
        stats.generate()
        if (known === undefined) {
          yield { type: "push", state: child, g: tentative, parent: node }
        } else {
          yield { type: "relax", state: child, g: tentative, parent: node }
        }
      }
    }
  }

  return { found: false, path: [], actions: [], cost: 0, stats: stats.snapshot() }
}
