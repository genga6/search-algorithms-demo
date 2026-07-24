import { useCallback, useEffect, useRef, useState } from "react"

export interface TracePlayer {
  /** 現在の再生位置（0 = まだ何も起きていない、length = 最後まで再生済み） */
  index: number
  length: number
  playing: boolean
  /** 1 秒あたりのステップ数 */
  speed: number
  play(): void
  pause(): void
  toggle(): void
  stepForward(): void
  stepBack(): void
  reset(): void
  seek(index: number): void
  setSpeed(stepsPerSecond: number): void
}

/**
 * trace（イベント列）の再生を司る汎用フック。
 * アルゴリズム本体とも描画とも独立していて、「今どこまで再生したか」だけを管理する。
 * 系統ごとの Player はこの index を使って自分の描画を組み立てる。
 */
export function useTracePlayer(length: number, initialSpeed = 12): TracePlayer {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(initialSpeed)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  // trace が差し替わったら先頭へ戻す
  // biome-ignore lint/correctness/useExhaustiveDependencies: length 変化時のみリセットしたい
  useEffect(() => {
    setIndex(0)
    setPlaying(false)
  }, [length])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setIndex((i) => {
        if (i >= length) {
          setPlaying(false)
          return i
        }
        return i + 1
      })
    }, 1000 / speed)
    timer.current = id
    return () => clearInterval(id)
  }, [playing, speed, length])

  const play = useCallback(() => {
    setIndex((i) => (i >= length ? 0 : i)) // 末尾なら頭出しして再生
    setPlaying(true)
  }, [length])
  const pause = useCallback(() => setPlaying(false), [])
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, play, pause])
  const stepForward = useCallback(() => {
    setPlaying(false)
    setIndex((i) => Math.min(length, i + 1))
  }, [length])
  const stepBack = useCallback(() => {
    setPlaying(false)
    setIndex((i) => Math.max(0, i - 1))
  }, [])
  const reset = useCallback(() => {
    setPlaying(false)
    setIndex(0)
  }, [])
  const seek = useCallback(
    (target: number) => {
      setPlaying(false)
      setIndex(Math.max(0, Math.min(length, target)))
    },
    [length],
  )

  return {
    index,
    length,
    playing,
    speed,
    play,
    pause,
    toggle,
    stepForward,
    stepBack,
    reset,
    seek,
    setSpeed,
  }
}
