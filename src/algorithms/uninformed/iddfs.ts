import type { SearchEvent } from "../../core/events.js"
import { StatsCounter } from "../../core/metrics.js"
import type { SearchGen, SearchProblem } from "../../core/types.js"
import { DEEPENING_NODE_BUDGET, actionsFromPath, pathCost } from "../shared.js"

// "budget" = 予算超過で打ち切り（開けた盤面での組合せ爆発を防ぐ安全弁）
type DlsResult = "found" | "cutoff" | "failure" | "budget"

/**
 * 反復深化深さ優先探索(IDDFS)。
 * 深さ上限を 0,1,2,… と上げながら深さ制限つき DFS を繰り返す。
 * BFS 並みの最適性(単位コスト)を DFS 並みの省メモリ O(bd) で得る。
 */
export function* iddfs<S, A>(p: SearchProblem<S, A>, maxDepth = 200): SearchGen<S, A> {
  const stats = new StatsCounter()

  for (let limit = 0; limit <= maxDepth; limit++) {
    yield { type: "note", message: `深さ上限 = ${limit}` }
    const pathStack: S[] = []
    const onPath = new Set<string>()

    const outcome = yield* dls(p, stats, p.initial, limit, pathStack, onPath)
    if (outcome === "found") {
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
    if (outcome === "budget") {
      // 展開ノードが上限を超えた。開けた盤面では反復深化は非現実的なので諦める。
      yield { type: "note", message: `打ち切り（展開 ${DEEPENING_NODE_BUDGET} ノード超過）` }
      return {
        found: false,
        path: [],
        actions: [],
        cost: 0,
        stats: stats.snapshot(),
        truncated: true,
      }
    }
    if (outcome === "failure") break // これ以上深くしても解はない
  }

  return { found: false, path: [], actions: [], cost: 0, stats: stats.snapshot() }
}

/** 深さ制限つき DFS。現在の経路を pathStack に積みながら再帰的に潜る。 */
function* dls<S, A>(
  p: SearchProblem<S, A>,
  stats: StatsCounter,
  node: S,
  limit: number,
  pathStack: S[],
  onPath: Set<string>,
): Generator<SearchEvent<S>, DlsResult, void> {
  // 予算オーバーなら即中断（これ以上潜らない）
  if (stats.expandedCount >= DEEPENING_NODE_BUDGET) return "budget"

  pathStack.push(node)
  onPath.add(p.key(node))
  stats.generate()
  stats.observeFrontier(pathStack.length)
  yield { type: "push", state: node }
  stats.expand()
  yield { type: "pop", state: node }

  let found: DlsResult = "failure"

  if (p.isGoal(node)) {
    yield { type: "goal", state: node }
    found = "found"
  } else if (limit === 0) {
    yield { type: "prune", state: node, reason: "depth cutoff" }
    found = "cutoff"
  } else {
    let anyCutoff = false
    let hitBudget = false
    for (const a of p.actions(node)) {
      const child = p.result(node, a)
      if (onPath.has(p.key(child))) continue // 経路上の循環を避ける
      const res = yield* dls(p, stats, child, limit - 1, pathStack, onPath)
      if (res === "found") {
        found = "found"
        break
      }
      if (res === "budget") {
        hitBudget = true // 予算超過。これ以上探索せず上へ伝播する
        break
      }
      if (res === "cutoff") anyCutoff = true
    }
    if (found !== "found") found = hitBudget ? "budget" : anyCutoff ? "cutoff" : "failure"
  }

  // 解が見つかったときは pathStack を経路として残す。それ以外は戻す。
  if (found !== "found") {
    pathStack.pop()
    onPath.delete(p.key(node))
    yield { type: "close", state: node }
  }
  return found
}
