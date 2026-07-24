import type { SearchEvent } from "./events.js"
import type { SearchGen, SearchResult } from "./types.js"

/**
 * ジェネレータ方式のアルゴリズムを最後まで回し、
 * yield されたイベントを trace[] に畳んで完全な結果を得る。
 *
 * eager 方式（全走査してから返す）と等価な結果を、
 * ジェネレータの可読性・テスト容易性を保ったまま得るための補助。
 * 実時間(timeMs) はここで計測して stats に埋める。
 */
export function collect<S, A>(gen: SearchGen<S, A>): SearchResult<S, A> {
  const trace: SearchEvent<S>[] = []
  const start = performance.now()

  let step = gen.next()
  while (!step.done) {
    trace.push(step.value)
    step = gen.next()
  }
  const timeMs = performance.now() - start

  const outcome = step.value
  return {
    ...outcome,
    stats: { ...outcome.stats, timeMs },
    trace,
  }
}
