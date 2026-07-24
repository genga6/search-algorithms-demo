import type { SearchGen, SearchProblem } from "../../core/types.js"
import { bestFirst } from "./bestFirst.js"

/**
 * 貪欲最良優先探索。f = h（ヒューリスティックのみ）で選ぶ。
 * ゴールへ一直線に向かうので速いが、遠回り・非最適になりうる。
 */
export function greedy<S, A>(p: SearchProblem<S, A>): SearchGen<S, A> {
  return bestFirst(p, (_g, h) => h)
}
