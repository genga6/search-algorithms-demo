import type { SearchGen, SearchProblem } from "../core/types.js"
import { astar } from "./informed/astar.js"
import { beam } from "./informed/beam.js"
import { greedy } from "./informed/greedy.js"
import { idastar } from "./informed/idastar.js"
import { weightedAstar } from "./informed/weightedAstar.js"
import { bfs } from "./uninformed/bfs.js"
import { bidirectional } from "./uninformed/bidirectional.js"
import { dfs } from "./uninformed/dfs.js"
import { iddfs } from "./uninformed/iddfs.js"
import { ucs } from "./uninformed/ucs.js"

export type Category = "uninformed" | "informed"

/** UI が 1 手法を表示・実行するために必要な情報一式。 */
export interface AlgorithmEntry {
  id: string
  label: string
  category: Category
  /** 完全性・最適性・計算量などの短い注記 */
  complete: string
  optimal: string
  complexity: string
  blurb: string
  /** 任意の問題に対してジェネレータを返す。追加パラメータは既定値で束縛済み。 */
  run<S, A>(p: SearchProblem<S, A>): SearchGen<S, A>
}

export const ALGORITHMS: AlgorithmEntry[] = [
  {
    id: "bfs",
    label: "BFS 幅優先",
    category: "uninformed",
    complete: "○",
    optimal: "○（単位コスト）",
    complexity: "時間 O(b^d) / 空間 O(b^d)",
    blurb: "キューで浅い層から。層ごとに波紋状に広がる。",
    run: bfs,
  },
  {
    id: "dfs",
    label: "DFS 深さ優先",
    category: "uninformed",
    complete: "△（有限グラフ）",
    optimal: "×",
    complexity: "時間 O(b^m) / 空間 O(bm)",
    blurb: "スタックで深追い。省メモリだが遠回りしやすい。",
    run: dfs,
  },
  {
    id: "iddfs",
    label: "IDDFS 反復深化",
    category: "uninformed",
    complete: "○",
    optimal: "○（単位コスト）",
    complexity: "時間 O(b^d) / 空間 O(bd)",
    blurb: "深さ上限を上げながら DFS を反復。BFS 並の最適性を省メモリで。",
    run: iddfs,
  },
  {
    id: "ucs",
    label: "UCS / Dijkstra",
    category: "uninformed",
    complete: "○",
    optimal: "○",
    complexity: "時間 O(E + V log V) / 空間 O(V)",
    blurb: "確定距離 g の小さい順に展開。重み付きグリッドで最適。",
    run: ucs,
  },
  {
    id: "bidirectional",
    label: "双方向探索",
    category: "uninformed",
    complete: "○",
    optimal: "○（単位コスト）",
    complexity: "時間・空間 O(b^(d/2))",
    blurb: "start と goal から同時に BFS。出会った地点で連結。",
    run: bidirectional,
  },
  {
    id: "greedy",
    label: "貪欲最良優先",
    category: "informed",
    complete: "×",
    optimal: "×",
    complexity: "最悪 O(b^m)",
    blurb: "h のみで選ぶ。速いが遠回り・非最適になりうる。",
    run: greedy,
  },
  {
    id: "astar",
    label: "A*",
    category: "informed",
    complete: "○",
    optimal: "○（h が許容的）",
    complexity: "実用は h 次第",
    blurb: "f = g + h。最適かつ、良い h なら展開が激減。",
    run: astar,
  },
  {
    id: "weightedAstar",
    label: "重み付き A* (w=1.5)",
    category: "informed",
    complete: "○",
    optimal: "w-最適（w≥1）",
    complexity: "A* より高速",
    blurb: "f = g + w·h。w で速さ⇄最適性を調整。",
    run: (p) => weightedAstar(p, 1.5),
  },
  {
    id: "idastar",
    label: "IDA*",
    category: "informed",
    complete: "○",
    optimal: "○",
    complexity: "時間 O(b^d) / 空間 O(d)",
    blurb: "閾値 f を上げながら深さ優先。省メモリな A*。",
    run: idastar,
  },
  {
    id: "beam",
    label: "ビームサーチ (k=3)",
    category: "informed",
    complete: "×",
    optimal: "×",
    complexity: "O(k·b·d)",
    blurb: "各層で上位 k 個だけ残す。貪欲と BFS の中間。",
    run: (p) => beam(p, 3),
  },
]

export const ALGORITHMS_BY_ID: Record<string, AlgorithmEntry> = Object.fromEntries(
  ALGORITHMS.map((a) => [a.id, a]),
)
