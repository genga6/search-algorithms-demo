import type { SearchGen, SearchProblem } from "../../core/types.js"
import { bestFirst } from "./bestFirst.js"

/**
 * 重み付き A\*。f = g + w·h （w ≥ 1）。
 * w を上げるほど貪欲寄りになり速くなるが、解コストは最大 w 倍まで悪化しうる。
 */
export function weightedAstar<S, A>(p: SearchProblem<S, A>, w = 1.5): SearchGen<S, A> {
  return bestFirst(p, (g, h) => g + w * h)
}
