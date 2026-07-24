import { StatsCounter } from "../../core/metrics.js"
import type { SearchGen, SearchProblem } from "../../core/types.js"
import { actionsFromPath, pathCost, reconstructPath } from "../shared.js"

/**
 * 幅優先探索(BFS)。キューで浅い層から広げる。
 * 単位コストなら最適。層ごとに波紋状に広がる様子が見える。
 *
 * 幅優先の正体は「末尾に push ＋ 先頭から shift」= FIFO(先入れ先出し)。
 * 先に見つけた浅いマスから順に処理するので、波紋状に「広く」進む。
 * もし先頭からでなく末尾から取り出す(LIFO)と、今入れた隣へ潜り続ける＝DFS(深さ優先)になる。
 * つまり push は同じで、取り出す端を変えるだけで「幅」か「深さ」かが決まる。
 */
export function* bfs<S, A>(p: SearchProblem<S, A>): SearchGen<S, A> {
  const stats = new StatsCounter()
  const start = p.initial

  const queue: S[] = [start] // フロンティア(open)。先頭から取り出す
  const parent = new Map<string, S>() // 「このマスへは、どのマスから来たか」経路復元用
  // 一度でもキューに入れたマス（重複投入を防ぐ）。BFS は push 時に印をつけるので start を先に登録
  const seen = new Set<string>([p.key(start)])

  stats.generate()
  yield { type: "push", state: start, parent: null }

  // キューが空になるまで＝まだ調べていないマスがある限り探索を続ける
  while (queue.length > 0) {
    stats.observeFrontier(queue.length)
    const node = queue.shift() as S // 先頭を1つ取り出して展開する（＝一番浅いマス）

    stats.expand()
    yield { type: "pop", state: node }

    // 取り出したマスがゴールなら、そこで終了。親をたどって経路を復元して返す
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

    // ゴールでなければ、このマスから行ける隣を全部キューの末尾に足す
    yield { type: "close", state: node }

    for (const a of p.actions(node)) {
      const child = p.result(node, a)
      const childKey = p.key(child)
      if (seen.has(childKey)) continue // すでに見たマスは無視（無限ループ・重複を防ぐ）
      seen.add(childKey)
      parent.set(childKey, node) // child へは node から来た、と記録
      queue.push(child) // ← ここで queue の中身が自動で変わる（末尾に追加）
      stats.generate()
      yield { type: "push", state: child, parent: node }
    }
  }

  // キューが尽きても見つからなかった = 解なし
  return { found: false, path: [], actions: [], cost: 0, stats: stats.snapshot() }
}
