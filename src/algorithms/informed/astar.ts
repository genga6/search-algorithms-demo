import type { SearchGen, SearchProblem } from "../../core/types.js"
import { bestFirst } from "./bestFirst.js"

/**
 * A\*。f = g + h。h が許容的(admissible)なら最適。
 * h が良いほど無駄な展開が激減する。
 */
export function astar<S, A>(p: SearchProblem<S, A>): SearchGen<S, A> {
  return bestFirst(p, (g, h) => g + h)
}
