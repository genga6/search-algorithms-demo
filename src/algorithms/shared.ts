import type { SearchProblem } from "../core/types.js"

/**
 * 親マップから初期状態→ゴールの経路を復元する。
 * parent は「状態キー → 直前の状態」を持つ。
 */
export function reconstructPath<S>(parent: Map<string, S>, keyOf: (s: S) => string, goal: S): S[] {
  const path: S[] = [goal]
  let cur = goal
  let key = keyOf(cur)
  while (parent.has(key)) {
    cur = parent.get(key) as S
    path.push(cur)
    key = keyOf(cur)
  }
  path.reverse()
  return path
}

/**
 * 経路（状態列）から総コストを計算する。
 * 各ステップは「その状態へ入るコスト」を stepCost で問い合わせる。
 */
export function pathCost<S, A>(problem: SearchProblem<S, A>, path: S[]): number {
  let cost = 0
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1] as S
    const cur = path[i] as S
    // 行動 a は経路復元では失われるため、遷移コストは (prev,cur) で問い合わせる。
    // grid の stepCost は s2 のみ参照するので a はダミーで良い。
    const action = findAction(problem, prev, cur)
    cost += problem.stepCost(prev, action, cur)
  }
  return cost
}

/** 経路（状態列）を再生して、取った行動列を復元する。 */
export function actionsFromPath<S, A>(problem: SearchProblem<S, A>, path: S[]): A[] {
  const actions: A[] = []
  for (let i = 1; i < path.length; i++) {
    actions.push(findAction(problem, path[i - 1] as S, path[i] as S))
  }
  return actions
}

/** prev から cur へ至る行動を探す（経路復元用）。 */
function findAction<S, A>(problem: SearchProblem<S, A>, prev: S, cur: S): A {
  const curKey = problem.key(cur)
  for (const a of problem.actions(prev)) {
    if (problem.key(problem.result(prev, a)) === curKey) return a
  }
  // 見つからないのは経路が不正な場合のみ。呼び出し側のバグ。
  throw new Error("findAction: no action connects the given states")
}
