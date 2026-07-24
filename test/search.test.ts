import { describe, expect, it } from "vitest"
import { ALGORITHMS, ALGORITHMS_BY_ID } from "../src/algorithms/registry.js"
import { collect } from "../src/core/collect.js"
import { mulberry32 } from "../src/core/prng.js"
import type { SearchProblem } from "../src/core/types.js"
import { GRID_PRESETS } from "../src/lib/presets.js"
import { type Cell, type Move, gridProblem, parseGrid, randomGrid } from "../src/problems/grid.js"

/** 単位コストの空きグリッド。最短経路長 = マンハッタン距離 = 8。 */
const emptyGrid = parseGrid(["S....", ".....", ".....", ".....", "....G"])

/**
 * 重み付きグリッド。まっすぐ進むと重い地形(9)を踏むので、
 * 「歩数最短」と「コスト最短」が食い違う。
 * 最短歩数は 8 だが、コスト最短は迂回して 8 になる…では困るので
 * 中央に壁と重みを置いて明確に差を出す。
 */
const weightedGrid = parseGrid(["S9...", ".9.9.", ".9.9.", ".9.9.", "...9G"])

const OPTIMAL_IDS = ["bfs", "ucs", "astar", "idastar", "iddfs", "bidirectional"]

/** UCS を最適コストの基準にする（重み付きでも常に最適）。 */
function optimalCost(problem: SearchProblem<Cell, Move>): number {
  const res = collect(ALGORITHMS_BY_ID.ucs!.run(problem))
  expect(res.found).toBe(true)
  return res.cost
}

describe("全アルゴリズムが解を見つける", () => {
  for (const algo of ALGORITHMS) {
    it(`${algo.id}: 空きグリッドで解を見つける`, () => {
      const res = collect(algo.run(gridProblem(emptyGrid)))
      expect(res.found).toBe(true)
      // 経路は start から goal までつながっている
      expect(res.path[0]).toEqual(emptyGrid.start)
      expect(res.path[res.path.length - 1]).toEqual(emptyGrid.goal)
    })
  }
})

describe("最適性（単位コスト）", () => {
  const best = 8 // マンハッタン距離
  for (const id of OPTIMAL_IDS) {
    it(`${id}: 空きグリッドで最短コスト ${best}`, () => {
      const res = collect(ALGORITHMS_BY_ID[id]!.run(gridProblem(emptyGrid)))
      expect(res.cost).toBe(best)
    })
  }
})

describe("最適性（重み付き）", () => {
  const problem = gridProblem(weightedGrid)
  const best = optimalCost(problem)

  for (const id of ["ucs", "astar", "idastar"]) {
    it(`${id}: 重み付きグリッドで UCS と同じ最適コスト ${best}`, () => {
      const res = collect(ALGORITHMS_BY_ID[id]!.run(problem))
      expect(res.found).toBe(true)
      expect(res.cost).toBe(best)
    })
  }

  it("貪欲は最適とは限らない（コスト >= 最適）", () => {
    const res = collect(ALGORITHMS_BY_ID.greedy!.run(problem))
    expect(res.found).toBe(true)
    expect(res.cost).toBeGreaterThanOrEqual(best)
  })
})

describe("A* は h が良いほど UCS より展開が少ない（同じ最適解）", () => {
  it("展開ノード数 A* <= UCS", () => {
    const problem = gridProblem(weightedGrid)
    const astar = collect(ALGORITHMS_BY_ID.astar!.run(problem))
    const ucs = collect(ALGORITHMS_BY_ID.ucs!.run(problem))
    expect(astar.cost).toBe(ucs.cost)
    expect(astar.stats.expanded).toBeLessThanOrEqual(ucs.stats.expanded)
  })
})

describe("trace の健全性", () => {
  it("解が見つかったとき solution イベントで終わる", () => {
    const res = collect(ALGORITHMS_BY_ID.astar!.run(gridProblem(emptyGrid)))
    const last = res.trace[res.trace.length - 1]
    expect(last?.type).toBe("solution")
  })

  it("生成ノード数 >= 展開ノード数", () => {
    const res = collect(ALGORITHMS_BY_ID.bfs!.run(gridProblem(emptyGrid)))
    expect(res.stats.generated).toBeGreaterThanOrEqual(res.stats.expanded)
  })
})

describe("解なし（壁で封鎖）", () => {
  const blocked = parseGrid(["S#G", ".#.", ".#."])
  for (const id of ["bfs", "ucs", "astar", "dfs"]) {
    it(`${id}: found=false`, () => {
      const res = collect(ALGORITHMS_BY_ID[id]!.run(gridProblem(blocked)))
      expect(res.found).toBe(false)
    })
  }
})

describe("デモのプリセットは全て解ける", () => {
  for (const preset of GRID_PRESETS) {
    it(`${preset.id}: 解が存在する`, () => {
      const res = collect(ALGORITHMS_BY_ID.bfs!.run(gridProblem(preset.make())))
      expect(res.found).toBe(true)
    })
  }
})

describe("ランダムグリッドでの整合性（決定的シード）", () => {
  it("解けるrandom gridで最適系は全て同じコスト", () => {
    const rng = mulberry32(42)
    // 解ける盤面が出るまでシードを進める
    let problem: SearchProblem<Cell, Move> | null = null
    for (let i = 0; i < 50; i++) {
      const spec = randomGrid(rng, { rows: 8, cols: 8, wallRatio: 0.2 })
      const candidate = gridProblem(spec)
      if (collect(ALGORITHMS_BY_ID.bfs!.run(candidate)).found) {
        problem = candidate
        break
      }
    }
    expect(problem).not.toBeNull()
    if (!problem) return

    const ucs = collect(ALGORITHMS_BY_ID.ucs!.run(problem)).cost
    expect(collect(ALGORITHMS_BY_ID.astar!.run(problem)).cost).toBe(ucs)
    expect(collect(ALGORITHMS_BY_ID.idastar!.run(problem)).cost).toBe(ucs)
  })
})
