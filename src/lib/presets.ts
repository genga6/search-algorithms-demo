import { mulberry32 } from "../core/prng.js"
import { type GridSpec, mazeGrid, parseGrid, randomGrid } from "../problems/grid.js"

export interface GridPreset {
  id: string
  label: string
  description: string
  make(): GridSpec
}

/**
 * デモ用のグリッド・プリセット。
 * ランダム系はシード固定で再現性を持たせる（roadmap 10）。
 */
export const GRID_PRESETS: GridPreset[] = [
  {
    id: "open",
    label: "平地",
    description: "壁も重みもない。BFS の波紋や貪欲の一直線が素直に見える。",
    make: () =>
      parseGrid([
        "S.........",
        "..........",
        "..........",
        "..........",
        "..........",
        "..........",
        "..........",
        ".........G",
      ]),
  },
  {
    id: "walls",
    label: "迷路",
    description: "必ず解ける完全迷路。DFS の深追いと A* の賢さが対比できる。",
    make: () => mazeGrid(mulberry32(3), { rows: 15, cols: 21 }),
  },
  {
    id: "weighted",
    label: "重み付き地形",
    description: "重いマス(数値)を通ると高コスト。UCS/A* は迂回、BFS は踏み抜く。",
    make: () =>
      parseGrid([
        "S..3333...",
        "...3993...",
        "...3993...",
        "5553993555",
        "9999999995",
        "5553993555",
        "...3993...",
        "...3993..G",
      ]),
  },
  {
    id: "random",
    label: "ランダム",
    description: "シード固定のランダム迷路。壁と重みが混在。",
    make: () =>
      randomGrid(mulberry32(7), { rows: 12, cols: 16, wallRatio: 0.22, heavyRatio: 0.12 }),
  },
]

export const DEFAULT_PRESET_ID = "weighted"
