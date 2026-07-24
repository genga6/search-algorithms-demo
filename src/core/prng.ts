/**
 * 再現性のためのシード付き擬似乱数（mulberry32）。
 *
 * 同じシードなら毎回同じ列を返すので、確率的手法やテストが決定的になる。
 */
export interface RNG {
  /** [0, 1) の乱数 */
  next(): number
  /** [min, max) の整数 */
  int(min: number, max: number): number
  /** 配列から 1 つ選ぶ */
  pick<T>(arr: readonly T[]): T
  /** Fisher–Yates で破壊的にシャッフルし、その配列を返す */
  shuffle<T>(arr: T[]): T[]
}

export function mulberry32(seed: number): RNG {
  let a = seed >>> 0

  const next = (): number => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min)),
    pick: (arr) => arr[Math.floor(next() * arr.length)] as (typeof arr)[number],
    shuffle: (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j] as (typeof arr)[number], arr[i] as (typeof arr)[number]]
      }
      return arr
    },
  }
}
