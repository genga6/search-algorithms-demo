import type { TracePlayer } from "./useTracePlayer.js"

const SPEEDS = [4, 12, 30, 90]

/** trace 再生の操作パネル（再生/停止・コマ送り・速度・シークバー）。 */
export function PlayerControls({ player }: { player: TracePlayer }) {
  const atEnd = player.index >= player.length
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={player.reset}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          ⏮ 最初
        </button>
        <button
          type="button"
          onClick={player.stepBack}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          ◀ コマ戻し
        </button>
        <button
          type="button"
          onClick={player.toggle}
          className="rounded-md bg-slate-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          {player.playing ? "⏸ 一時停止" : atEnd ? "↻ 頭出し再生" : "▶ 再生"}
        </button>
        <button
          type="button"
          onClick={player.stepForward}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          コマ送り ▶
        </button>
      </div>

      <input
        type="range"
        min={0}
        max={player.length}
        value={player.index}
        onChange={(e) => player.seek(Number(e.target.value))}
        className="w-full accent-slate-700"
        aria-label="再生位置"
      />
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          ステップ {player.index} / {player.length}
        </span>
        <label className="flex items-center gap-2">
          速度
          <select
            value={player.speed}
            onChange={(e) => player.setSpeed(Number(e.target.value))}
            className="rounded border border-slate-300 px-2 py-1"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
