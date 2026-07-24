import type { SearchEvent } from "./events.js"

/**
 * 状態空間探索の共通インターフェース。
 * 系統 A（情報なし探索）/ B（情報あり探索）で共有する。
 *
 * @typeParam S 状態(state)
 * @typeParam A 行動(action)
 */
export interface SearchProblem<S, A> {
  /** 初期状態 */
  initial: S
  /** 状態 s で選べる行動の一覧 */
  actions(s: S): A[]
  /** 遷移：状態 s で行動 a を取った結果の状態 */
  result(s: S, a: A): S
  /** 1 手あたりのコスト（重み付きグリッドなど） */
  stepCost(s: S, a: A, s2: S): number
  /** ゴール判定 */
  isGoal(s: S): boolean
  /** 情報あり探索用：ゴールまでの下界推定。許容的(admissible)なら A\* が最適 */
  heuristic?(s: S): number
  /** closed 判定のためのハッシュキー */
  key(s: S): string
}

/** 効率の計測値（全手法で共通に計測する。） */
export interface SearchStats {
  /** 展開したノード数（pop の回数） */
  expanded: number
  /** 生成したノード数（push の回数） */
  generated: number
  /** フロンティアの最大幅 */
  frontierMax: number
  /** 実時間(ms)。collect() が計測して埋める */
  timeMs: number
}

/** アルゴリズムが返す結果本体（trace を含まない）。 */
export interface SearchOutcome<S, A> {
  /** 解が見つかったか */
  found: boolean
  /** 初期状態からゴールまでの状態列 */
  path: S[]
  /** 経路上で取った行動列 */
  actions: A[]
  /** 経路の総コスト */
  cost: number
  /** 効率の計測値 */
  stats: SearchStats
  /**
   * 予算(展開ノード数の上限)に達して探索を打ち切ったか。
   * 反復深化系(IDDFS/IDA\*)は開けたグリッドで組合せ爆発するため、ハング化を防ぐ安全弁。
   * true のとき found=false は「解なし」ではなく「諦めた（打ち切り）」を意味する。
   */
  truncated?: boolean
}

/** collect() が組み立てる、trace 付きの完全な結果。 */
export interface SearchResult<S, A> extends SearchOutcome<S, A> {
  /** 可視化用イベント列 */
  trace: SearchEvent<S>[]
}

/**
 * アルゴリズムの実体：探索の過程を `SearchEvent` として `yield` しつつ、
 * 最後に `SearchOutcome` を `return` するジェネレータ。
 * Generator<yieldする値, returnする値, next()に渡す値>
 *
 * - テスト時：collect() で最後まで回して結果＋trace を一括取得
 * - 可視化時：Player が 1 ステップずつ駆動
 */

export type SearchGen<S, A> = Generator<SearchEvent<S>, SearchOutcome<S, A>, void>

/** アルゴリズム関数の型。 */
export type SearchAlgorithm<S, A> = (p: SearchProblem<S, A>) => SearchGen<S, A>
