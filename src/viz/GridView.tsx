import { useMemo } from "react"
import type { SearchEvent } from "../core/events.js"
import { type Cell, type GridSpec, cellEquals, weightAt } from "../problems/grid.js"
import { type CellStatus, foldGridTrace } from "./gridTrace.js"

interface Props {
  spec: GridSpec
  trace: SearchEvent<Cell>[]
  index: number
  cellPx?: number
}

const STATUS_FILL: Record<CellStatus, string> = {
  frontier: "#bfdbfe", // 青系：open に入っている
  expanded: "#c7d2cf", // 灰緑：展開済み(closed)
  current: "#f59e0b", // 橙：今まさに展開中
  pruned: "#fecaca", // 赤系：枝刈り
  path: "#4ade80", // 緑：最終経路
}

/** 重いマスほど濃い黄土色。通常マス(=1)は白。 */
function weightFill(w: number): string {
  if (w <= 1) return "#ffffff"
  const t = Math.min(1, (w - 1) / 8)
  const lightness = 96 - t * 32
  return `hsl(45 80% ${lightness}%)`
}

export function GridView({ spec, trace, index, cellPx = 30 }: Props) {
  const fold = useMemo(() => foldGridTrace(trace, index), [trace, index])
  const width = spec.cols * cellPx
  const height = spec.rows * cellPx

  const cells = []
  for (let r = 0; r < spec.rows; r++) {
    for (let c = 0; c < spec.cols; c++) {
      const cell: Cell = { r, c }
      const key = `${r},${c}`
      const isWall = spec.walls.has(key)
      const status = fold.status.get(key)
      const w = weightAt(spec, cell)

      let fill = weightFill(w)
      if (isWall) fill = "#334155"
      else if (status) fill = STATUS_FILL[status]

      cells.push(
        <rect
          key={key}
          x={c * cellPx}
          y={r * cellPx}
          width={cellPx}
          height={cellPx}
          fill={fill}
          stroke="#e2e8f0"
          strokeWidth={1}
        />,
      )

      // 重みの数値（壁でなく、重い場合のみ）
      if (!isWall && w > 1) {
        cells.push(
          <text
            key={`${key}-w`}
            x={c * cellPx + cellPx / 2}
            y={r * cellPx + cellPx / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={cellPx * 0.35}
            fill="#92400e"
            pointerEvents="none"
          >
            {w}
          </text>,
        )
      }
    }
  }

  const marker = (cell: Cell, label: string, color: string) => (
    <g key={label} pointerEvents="none">
      <circle
        cx={cell.c * cellPx + cellPx / 2}
        cy={cell.r * cellPx + cellPx / 2}
        r={cellPx * 0.3}
        fill={color}
      />
      <text
        x={cell.c * cellPx + cellPx / 2}
        y={cell.r * cellPx + cellPx / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={cellPx * 0.38}
        fontWeight="bold"
        fill="white"
      >
        {label}
      </text>
    </g>
  )

  // 今展開中のマスの枠強調
  const currentCell = fold.current
    ? { r: Number(fold.current.split(",")[0]), c: Number(fold.current.split(",")[1]) }
    : null

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto max-w-full rounded-lg border border-slate-200 bg-white shadow-sm"
      role="img"
      aria-label="探索の進行を示すグリッド"
    >
      <title>探索グリッド</title>
      {cells}
      {currentCell &&
        !cellEquals(currentCell, spec.start) &&
        !cellEquals(currentCell, spec.goal) && (
          <rect
            x={currentCell.c * cellPx}
            y={currentCell.r * cellPx}
            width={cellPx}
            height={cellPx}
            fill="none"
            stroke="#b45309"
            strokeWidth={3}
            pointerEvents="none"
          />
        )}
      {marker(spec.start, "S", "#16a34a")}
      {marker(spec.goal, "G", "#dc2626")}
    </svg>
  )
}
