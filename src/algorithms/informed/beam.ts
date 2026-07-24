import { StatsCounter } from "../../core/metrics.js"
import type { SearchGen, SearchProblem } from "../../core/types.js"
import { actionsFromPath, pathCost, reconstructPath } from "../shared.js"

/**
 * ビームサーチ。各層で h の良い上位 k 個だけを残して次の層へ進む。
 * 貪欲と BFS の中間。省メモリだが、良い解を刈ってしまい非最適・不完全。
 */
export function* beam<S, A>(p: SearchProblem<S, A>, width = 3): SearchGen<S, A> {
  const stats = new StatsCounter()
  const h = (s: S): number => p.heuristic?.(s) ?? 0

  const parent = new Map<string, S>()
  const seen = new Set<string>([p.key(p.initial)])
  let beamLevel: S[] = [p.initial]

  stats.generate()
  yield { type: "push", state: p.initial, h: h(p.initial), parent: null }

  while (beamLevel.length > 0) {
    stats.observeFrontier(beamLevel.length)
    const candidates: S[] = []

    for (const node of beamLevel) {
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
          cost: pathCost(p, path),
          stats: stats.snapshot(),
        }
      }

      yield { type: "close", state: node }
      for (const a of p.actions(node)) {
        const child = p.result(node, a)
        const childKey = p.key(child)
        if (seen.has(childKey)) continue
        seen.add(childKey)
        parent.set(childKey, node)
        candidates.push(child)
        stats.generate()
        yield { type: "push", state: child, h: h(child), parent: node }
      }
    }

    // h の小さい順に並べ、上位 width 個だけ残す。残りは枝刈り。
    candidates.sort((a, b) => h(a) - h(b))
    const kept = candidates.slice(0, width)
    for (const dropped of candidates.slice(width)) {
      yield { type: "prune", state: dropped, reason: "beam width" }
    }
    beamLevel = kept
  }

  return { found: false, path: [], actions: [], cost: 0, stats: stats.snapshot() }
}
