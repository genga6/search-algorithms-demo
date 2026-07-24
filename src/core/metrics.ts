import type { SearchStats } from "./types.js"

/**
 * 探索の効率を数える小さなカウンタ。
 * アルゴリズム内で push/pop のたびに呼び、フロンティア幅の最大値を追う。
 */
export class StatsCounter {
  private expanded = 0
  private generated = 0
  private frontierMax = 0

  /** ノードを 1 つ展開した（pop） */
  expand(): void {
    this.expanded++
  }

  /** ノードを 1 つ生成した（push）。必要なら複数まとめて */
  generate(n = 1): void {
    this.generated += n
  }

  /** 現在のフロンティア幅を報告し、最大値を更新する */
  observeFrontier(size: number): void {
    if (size > this.frontierMax) this.frontierMax = size
  }

  /** timeMs は collect() が計測するのでここでは 0 を入れておく */
  snapshot(): SearchStats {
    return {
      expanded: this.expanded,
      generated: this.generated,
      frontierMax: this.frontierMax,
      timeMs: 0,
    }
  }
}
