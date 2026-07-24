import type { SearchEvent } from "../../core/events.js"
import { StatsCounter } from "../../core/metrics.js"
import type { SearchGen, SearchProblem } from "../../core/types.js"
import { actionsFromPath, pathCost } from "../shared.js"

/** 片側の探索が覚えるノード：状態と、そこへ来た直前ノードのキー。 */
interface Node<S> {
  state: S
  parentKey: string | null
}

/**
 * 双方向探索（BFS ベース）。start と goal から同時に BFS を広げ、
 * 2 つのフロンティアが出会った地点で経路を連結する。
 * 探索量は片側 O(b^d) に対し O(b^(d/2)) 程度で済む。
 *
 * 前提：グラフが無向（A→B に行けるなら B→A にも行ける）。
 * grid の 4 近傍移動はこれを満たす。最適性は単位コストのとき。
 */
export function* bidirectional<S, A>(p: SearchProblem<S, A>): SearchGen<S, A> {
  const stats = new StatsCounter()

  // goal は isGoal でしか与えられないので、前向き走査でゴール状態を1つ特定する。
  const goal = findGoalState(p)
  const startKey = p.key(p.initial)
  if (goal === null) {
    return { found: false, path: [], actions: [], cost: 0, stats: stats.snapshot() }
  }
  const goalKey = p.key(goal)

  // 各側：key -> Node。これで出会った地点から両方向に親を辿れる。
  const fwd = new Map<string, Node<S>>([[startKey, { state: p.initial, parentKey: null }]])
  const bwd = new Map<string, Node<S>>([[goalKey, { state: goal, parentKey: null }]])
  let fwdQueue: S[] = [p.initial]
  let bwdQueue: S[] = [goal]

  stats.generate(2)
  yield { type: "push", state: p.initial, parent: null }
  yield { type: "push", state: goal, parent: null }

  // start === goal の縮退ケース
  if (startKey === goalKey) {
    const path = [p.initial]
    yield { type: "solution", path }
    return { found: true, path, actions: [], cost: 0, stats: stats.snapshot() }
  }

  while (fwdQueue.length > 0 && bwdQueue.length > 0) {
    // 小さい方のフロンティアを 1 層広げる
    const expandForward = fwdQueue.length <= bwdQueue.length
    const [own, other, queue] = expandForward ? [fwd, bwd, fwdQueue] : [bwd, fwd, bwdQueue]

    const { nextQueue, meetKey } = yield* expandLayer(p, stats, queue, own, other)
    if (expandForward) fwdQueue = nextQueue
    else bwdQueue = nextQueue

    if (meetKey !== null) {
      return yield* emitSolution(p, stats, meetKey, fwd, bwd)
    }
  }

  return { found: false, path: [], actions: [], cost: 0, stats: stats.snapshot() }
}

/** 一方向のフロンティアを 1 層展開する。相手側 (other) に届いたら meetKey を返す。 */
function* expandLayer<S, A>(
  p: SearchProblem<S, A>,
  stats: StatsCounter,
  queue: S[],
  own: Map<string, Node<S>>,
  other: Map<string, Node<S>>,
): Generator<SearchEvent<S>, { nextQueue: S[]; meetKey: string | null }, void> {
  const nextQueue: S[] = []
  stats.observeFrontier(queue.length)

  for (const node of queue) {
    stats.expand()
    yield { type: "pop", state: node }
    yield { type: "close", state: node }

    for (const a of p.actions(node)) {
      const child = p.result(node, a)
      const childKey = p.key(child)
      if (own.has(childKey)) continue
      own.set(childKey, { state: child, parentKey: p.key(node) })
      nextQueue.push(child)
      stats.generate()
      yield { type: "push", state: child, parent: node }
      if (other.has(childKey)) return { nextQueue, meetKey: childKey }
    }
  }
  return { nextQueue, meetKey: null }
}

/** 出会った地点で start..meet と meet..goal をつないで解を出力する。 */
function* emitSolution<S, A>(
  p: SearchProblem<S, A>,
  stats: StatsCounter,
  meetKey: string,
  fwd: Map<string, Node<S>>,
  bwd: Map<string, Node<S>>,
): SearchGen<S, A> {
  const front = chase(fwd, meetKey).reverse() // start .. meet
  const back = chase(bwd, meetKey) // meet .. goal
  const path = [...front, ...back.slice(1)] // meet の重複を除く

  yield { type: "goal", state: path[path.length - 1] as S }
  yield { type: "solution", path }
  return {
    found: true,
    path,
    actions: actionsFromPath(p, path),
    cost: pathCost(p, path),
    stats: stats.snapshot(),
  }
}

/** key から親を辿って状態列を返す（meet からその側の端まで）。 */
function chase<S>(side: Map<string, Node<S>>, fromKey: string): S[] {
  const out: S[] = []
  let key: string | null = fromKey
  while (key !== null) {
    const node = side.get(key)
    if (!node) break
    out.push(node.state)
    key = node.parentKey
  }
  return out
}

/**
 * ゴール状態を1つ特定する（BFS）。SearchProblem は goal を直接持たず
 * isGoal しか与えないため、双方向探索の後ろ向き起点を得るための補助。
 */
function findGoalState<S, A>(p: SearchProblem<S, A>): S | null {
  const seen = new Set<string>([p.key(p.initial)])
  const queue: S[] = [p.initial]
  while (queue.length > 0) {
    const node = queue.shift() as S
    if (p.isGoal(node)) return node
    for (const a of p.actions(node)) {
      const child = p.result(node, a)
      const key = p.key(child)
      if (seen.has(key)) continue
      seen.add(key)
      queue.push(child)
    }
  }
  return null
}
