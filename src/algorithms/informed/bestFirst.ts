import { StatsCounter } from "../../core/metrics.js"
import { MinHeap } from "../../core/priorityQueue.js"
import type { SearchGen, SearchProblem } from "../../core/types.js"
import { actionsFromPath, reconstructPath } from "../shared.js"

/**
 * 最良優先探索の共通コア。優先度 f を (g, h) から計算する関数で
 * 貪欲 / A\* / 重み付き A\* を切り替える。
 *
 * - 貪欲　　 : f = h
 * - A\*　　　: f = g + h
 * - 重み付き : f = g + w·h
 */
export function* bestFirst<S, A>(
  p: SearchProblem<S, A>,
  priority: (g: number, h: number) => number,
): SearchGen<S, A> {
  const stats = new StatsCounter()
  const h = (s: S): number => p.heuristic?.(s) ?? 0

  const start = p.initial
  const startKey = p.key(start)
  const frontier = new MinHeap<S>()
  const bestG = new Map<string, number>([[startKey, 0]])
  const parent = new Map<string, S>()
  const closed = new Set<string>()

  const h0 = h(start)
  frontier.push(start, priority(0, h0))
  stats.generate()
  yield { type: "push", state: start, g: 0, h: h0, f: priority(0, h0), parent: null }

  while (!frontier.isEmpty()) {
    stats.observeFrontier(frontier.size)
    const node = frontier.pop() as S
    const nodeKey = p.key(node)
    if (closed.has(nodeKey)) continue
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
        const hc = h(child)
        const f = priority(tentative, hc)
        frontier.push(child, f)
        stats.generate()
        if (known === undefined) {
          yield { type: "push", state: child, g: tentative, h: hc, f, parent: node }
        } else {
          yield { type: "relax", state: child, g: tentative, parent: node }
        }
      }
    }
  }

  return { found: false, path: [], actions: [], cost: 0, stats: stats.snapshot() }
}
