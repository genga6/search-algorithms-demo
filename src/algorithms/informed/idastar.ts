import type { SearchEvent } from "../../core/events.js"
import { StatsCounter } from "../../core/metrics.js"
import type { SearchGen, SearchProblem } from "../../core/types.js"
import { actionsFromPath, pathCost } from "../shared.js"

const INF = Number.POSITIVE_INFINITY

/**
 * IDA\*（反復深化 A\*）。閾値 = f(=g+h) を少しずつ上げながら
 * 深さ優先で潜る。空間は経路長 O(d) だけ。15 パズルのような
 * 状態数が爆発する問題で A\* の最適性を省メモリに得る。
 */
export function* idastar<S, A>(p: SearchProblem<S, A>): SearchGen<S, A> {
  const stats = new StatsCounter()
  const h = (s: S): number => p.heuristic?.(s) ?? 0

  let threshold = h(p.initial)
  while (threshold !== INF) {
    yield { type: "note", message: `閾値 f ≤ ${threshold}` }
    const pathStack: S[] = []
    const onPath = new Set<string>()
    const result = yield* dfsBounded(p, stats, p.initial, 0, threshold, pathStack, onPath, h)

    if (result.found) {
      const path = [...pathStack]
      yield { type: "solution", path }
      return {
        found: true,
        path,
        actions: actionsFromPath(p, path),
        cost: pathCost(p, path),
        stats: stats.snapshot(),
      }
    }
    threshold = result.nextThreshold // 閾値を超えた最小 f まで一気に上げる
  }

  return { found: false, path: [], actions: [], cost: 0, stats: stats.snapshot() }
}

interface Bounded {
  found: boolean
  nextThreshold: number
}

/** f ≤ threshold の範囲で深さ優先。超えた枝の最小 f を nextThreshold に集める。 */
function* dfsBounded<S, A>(
  p: SearchProblem<S, A>,
  stats: StatsCounter,
  node: S,
  g: number,
  threshold: number,
  pathStack: S[],
  onPath: Set<string>,
  h: (s: S) => number,
): Generator<SearchEvent<S>, Bounded, void> {
  const f = g + h(node)
  if (f > threshold) {
    yield { type: "prune", state: node, reason: `f=${f} > ${threshold}` }
    return { found: false, nextThreshold: f }
  }

  pathStack.push(node)
  onPath.add(p.key(node))
  stats.generate()
  stats.observeFrontier(pathStack.length)
  yield { type: "push", state: node, g, h: h(node), f }
  stats.expand()
  yield { type: "pop", state: node }

  if (p.isGoal(node)) {
    yield { type: "goal", state: node }
    return { found: true, nextThreshold: threshold }
  }

  let nextThreshold = INF
  for (const a of p.actions(node)) {
    const child = p.result(node, a)
    if (onPath.has(p.key(child))) continue
    const childG = g + p.stepCost(node, a, child)
    const res = yield* dfsBounded(p, stats, child, childG, threshold, pathStack, onPath, h)
    if (res.found) return { found: true, nextThreshold: threshold }
    if (res.nextThreshold < nextThreshold) nextThreshold = res.nextThreshold
  }

  // 行き止まり：経路から戻す
  pathStack.pop()
  onPath.delete(p.key(node))
  yield { type: "close", state: node }
  return { found: false, nextThreshold }
}
