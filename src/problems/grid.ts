/**
 * グリッド迷路の「問題」定義。
 *
 * このファイルの流れ（ここだけ掴めば OK）：
 *   1. parseGrid / mazeGrid / randomGrid … 作り方は違うが、どれも GridSpec を返す。
 *   2. GridSpec … グリッドの「生データ」。壁・重み・start・goal など、絵の情報そのもの。
 *      （アルゴリズムの知識はゼロ。ただのデータ）
 *   3. gridProblem(spec) … その生データを渡すと、初めて「探索問題(SearchProblem)」に
 *      変換される。ここで初めてアルゴリズムが解ける形になる。
 *
 *   生データ ──gridProblem()──▶ 探索問題 ──アルゴリズム──▶ 解 + trace
 */
import type { RNG } from "../core/prng.js"
import type { SearchProblem } from "../core/types.js"

/** グリッド上のマス（状態）。 */
export interface Cell {
  r: number
  c: number
}

/** 4 近傍の移動（行動）。 */
export type Move = "up" | "down" | "left" | "right"

const MOVES: Record<Move, { dr: number; dc: number }> = {
  up: { dr: -1, dc: 0 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
  right: { dr: 0, dc: 1 },
}

/** グリッド迷路の仕様。重み付き地形に対応。 */
export interface GridSpec {
  rows: number
  cols: number
  start: Cell
  goal: Cell
  /** 壁（通れないマス）。"r,c" のキー集合 */
  walls: Set<string>
  /** 各マスに入るコスト（地形の重み）。既定は 1 */
  weights: Map<string, number>
}

export const cellKey = (cell: Cell): string => `${cell.r},${cell.c}`

export const cellEquals = (a: Cell, b: Cell): boolean => a.r === b.r && a.c === b.c

/** マスに入るコスト（重み）。壁でなければ既定 1。 */
export function weightAt(spec: GridSpec, cell: Cell): number {
  return spec.weights.get(cellKey(cell)) ?? 1
}

/** マンハッタン距離。4 近傍・重み下界 1 なら許容的なヒューリスティック。 */
export function manhattan(a: Cell, b: Cell): number {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c)
}

/**
 * GridSpec から SearchProblem を作る。
 * これがアルゴリズムに渡る「問題」の実体。
 */
export function gridProblem(spec: GridSpec): SearchProblem<Cell, Move> {
  const inBounds = (cell: Cell): boolean =>
    cell.r >= 0 && cell.r < spec.rows && cell.c >= 0 && cell.c < spec.cols
  const isWall = (cell: Cell): boolean => spec.walls.has(cellKey(cell))

  return {
    initial: spec.start,
    key: cellKey,
    isGoal: (s) => cellEquals(s, spec.goal),
    actions: (s) => {
      const result: Move[] = []
      for (const move of Object.keys(MOVES) as Move[]) {
        const { dr, dc } = MOVES[move]
        const next = { r: s.r + dr, c: s.c + dc }
        if (inBounds(next) && !isWall(next)) result.push(move)
      }
      return result
    },
    result: (s, a) => ({ r: s.r + MOVES[a].dr, c: s.c + MOVES[a].dc }),
    // コストは「入るマスの重み」で定義。均一グリッドなら常に 1。
    stepCost: (_s, _a, s2) => weightAt(spec, s2),
    heuristic: (s) => manhattan(s, spec.goal),
  }
}

/**
 * ランダムな重み付き迷路を生成する（デモの初期状態用）。
 * - `wallRatio` の割合で壁を置く（start/goal は避ける）
 * - `heavyRatio` の割合で重いマス（コスト大）を置く
 * シード付き RNG を使うので再現性がある。
 */
export function randomGrid(
  rng: RNG,
  opts: {
    rows: number
    cols: number
    start?: Cell
    goal?: Cell
    wallRatio?: number
    heavyRatio?: number
    heavyCost?: number
  },
): GridSpec {
  const { rows, cols } = opts
  const start = opts.start ?? { r: 0, c: 0 }
  const goal = opts.goal ?? { r: rows - 1, c: cols - 1 }
  const wallRatio = opts.wallRatio ?? 0.25
  const heavyRatio = opts.heavyRatio ?? 0.15
  const heavyCost = opts.heavyCost ?? 5

  const walls = new Set<string>()
  const weights = new Map<string, number>()

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = { r, c }
      if (cellEquals(cell, start) || cellEquals(cell, goal)) continue
      const roll = rng.next()
      if (roll < wallRatio) {
        walls.add(cellKey(cell))
      } else if (roll < wallRatio + heavyRatio) {
        weights.set(cellKey(cell), heavyCost)
      }
    }
  }

  return { rows, cols, start, goal, walls, weights }
}

/**
 * 完全連結な「完全迷路」を生成する（再帰的バックトラッカ）。
 * 通路は必ず start から goal へつながるので、デモが行き止まりにならない。
 * rows/cols は奇数に丸められる（偶数座標が通路、奇数座標が壁になるため）。
 */
export function mazeGrid(rng: RNG, opts: { rows: number; cols: number }): GridSpec {
  const rows = opts.rows % 2 === 0 ? opts.rows - 1 : opts.rows
  const cols = opts.cols % 2 === 0 ? opts.cols - 1 : opts.cols

  // まず全マスを壁にし、通路(偶数座標)を掘っていく
  const walls = new Set<string>()
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) walls.add(`${r},${c}`)
  }
  const carve = (r: number, c: number) => walls.delete(`${r},${c}`)

  const stack: Cell[] = [{ r: 0, c: 0 }]
  carve(0, 0)
  const dirs = [
    { dr: -2, dc: 0 },
    { dr: 2, dc: 0 },
    { dr: 0, dc: -2 },
    { dr: 0, dc: 2 },
  ]

  while (stack.length > 0) {
    const cur = stack[stack.length - 1] as Cell
    const options = rng.shuffle([...dirs]).filter(({ dr, dc }) => {
      const nr = cur.r + dr
      const nc = cur.c + dc
      return nr >= 0 && nr < rows && nc >= 0 && nc < cols && walls.has(`${nr},${nc}`)
    })
    const step = options[0]
    if (!step) {
      stack.pop()
      continue
    }
    // 間の壁も掘って隣の通路へ
    carve(cur.r + step.dr / 2, cur.c + step.dc / 2)
    carve(cur.r + step.dr, cur.c + step.dc)
    stack.push({ r: cur.r + step.dr, c: cur.c + step.dc })
  }

  return {
    rows,
    cols,
    start: { r: 0, c: 0 },
    goal: { r: rows - 1, c: cols - 1 },
    walls,
    weights: new Map(),
  }
}

/**
 * ASCII アートからグリッドを組み立てる。テストのフィクスチャや
 * デモのプリセットに使う。各文字の意味：
 * - `S` 開始 / `G` ゴール
 * - `#` 壁（通れない）
 * - `.` 通常マス（コスト 1）
 * - `2`〜`9` 重いマス（そのコストで入る）
 *
 * @example
 * parseGrid(["S..", ".#.", "..G"])
 */
export function parseGrid(rows: string[]): GridSpec {
  const height = rows.length
  const width = Math.max(...rows.map((row) => row.length))
  const walls = new Set<string>()
  const weights = new Map<string, number>()
  let start: Cell | null = null
  let goal: Cell | null = null

  for (let r = 0; r < height; r++) {
    const line = rows[r] ?? ""
    for (let c = 0; c < width; c++) {
      const ch = line[c] ?? "."
      const key = `${r},${c}`
      if (ch === "#") walls.add(key)
      else if (ch === "S") start = { r, c }
      else if (ch === "G") goal = { r, c }
      else if (ch >= "2" && ch <= "9") weights.set(key, Number(ch))
    }
  }

  if (!start || !goal) throw new Error("parseGrid: S（開始）と G（ゴール）が必要です")
  return { rows: height, cols: width, start, goal, walls, weights }
}
