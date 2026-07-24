import { StatsCounter } from "../../core/metrics.js"
import type { SearchGen, SearchProblem } from "../../core/types.js"
import { actionsFromPath, pathCost, reconstructPath } from "../shared.js"

/**
 * 深さ優先探索(DFS)。スタックで深追いする。
 * 完全性は有限グラフ(訪問済み管理あり)でのみ。最適性はない。
 *
 * BFS との対比（骨格はそっくりで、違いは 2 点だけ）：
 *   ① 入れ物：BFS は queue で「先頭から shift」= FIFO。
 *      DFS は stack で「末尾から pop」= LIFO。今入れた隣へ潜り続ける＝深さ優先。
 *   ② seen(見た印)をつけるタイミング：
 *      BFS は push する時（各マスはキューに一度しか入らない → start を先に seen へ登録）。
 *      DFS は pop する時（同じマスがスタックに複数積まれ得るので、取り出した時に重複を弾く）。
 *      このため DFS では start を先に seen へ入れる必要がなく、startKey も不要。
 */
export function* dfs<S, A>(p: SearchProblem<S, A>): SearchGen<S, A> {
  const stats = new StatsCounter()
  const start = p.initial

  const stack: S[] = [start] // フロンティア。BFS の queue と違い「末尾から」取り出す
  const parent = new Map<string, S>() // 経路復元用（どのマスから来たか）
  const seen = new Set<string>() // BFS と違い空で開始。印は pop 時につける

  stats.generate()
  yield { type: "push", state: start, parent: null }

  while (stack.length > 0) {
    stats.observeFrontier(stack.length)
    const node = stack.pop() as S // ← ここが BFS との最大の違い（shift ではなく pop）

    const nodeKey = p.key(node)
    if (seen.has(nodeKey)) continue // 既に展開済みなら捨てる（スタックには重複があり得る）
    seen.add(nodeKey) // ここで初めて「見た」印をつける（＝pop 時にマーク）
    stats.expand()
    yield { type: "pop", state: node }

    // 取り出したマスがゴールなら終了。親をたどって経路を復元して返す
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

    // 隣を全部スタックに積む。次のループで「最後に積んだ隣」から潜っていく
    yield { type: "close", state: node }

    for (const a of p.actions(node)) {
      const child = p.result(node, a)
      const childKey = p.key(child)
      if (seen.has(childKey)) continue // 既に展開済みの隣は積まない
      // 親は「最初に到達した経路」を記録（既に記録済みなら上書きしない）
      if (!parent.has(childKey)) parent.set(childKey, node)
      stack.push(child)
      stats.generate()
      yield { type: "push", state: child, parent: node }
    }
  }

  // スタックが尽きても見つからなかった = 解なし
  return { found: false, path: [], actions: [], cost: 0, stats: stats.snapshot() }
}
