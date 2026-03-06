/**
 * UsageChart — simple SVG bar chart for API call counts by day.
 * No external deps.
 */

const W = 600
const H = 120
const PAD = { top: 10, right: 10, bottom: 28, left: 36 }
const INNER_W = W - PAD.left - PAD.right
const INNER_H = H - PAD.top - PAD.bottom

export default function UsageChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-28 text-sm text-slate-400">
        Sem dados de uso ainda.
      </div>
    )
  }

  const maxCount = Math.max(...data.map(d => d.count), 1)
  const barW = Math.max(4, INNER_W / data.length - 2)
  const gap  = INNER_W / data.length

  // Y-axis tick labels
  const yTicks = [0, Math.round(maxCount / 2), maxCount]

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: '280px', maxHeight: '140px' }}
        aria-label="API usage by day"
      >
        {/* Grid lines */}
        {yTicks.map(tick => {
          const y = PAD.top + INNER_H - (tick / maxCount) * INNER_H
          return (
            <g key={tick}>
              <line
                x1={PAD.left} y1={y}
                x2={PAD.left + INNER_W} y2={y}
                stroke="#E2E8F0" strokeWidth="1"
              />
              <text
                x={PAD.left - 6} y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#94A3B8"
              >
                {tick}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = Math.max(2, (d.count / maxCount) * INNER_H)
          const x    = PAD.left + i * gap + (gap - barW) / 2
          const y    = PAD.top + INNER_H - barH

          // Show label only every ~7 bars or last
          const showLabel = data.length <= 10 || i % Math.ceil(data.length / 8) === 0 || i === data.length - 1
          const label     = d.date ? d.date.slice(5) : '' // MM-DD

          return (
            <g key={d.date || i}>
              <rect
                x={x} y={y}
                width={barW} height={barH}
                rx={3}
                fill="#16A34A"
                opacity="0.85"
              >
                <title>{d.date}: {d.count} requests</title>
              </rect>
              {showLabel && (
                <text
                  x={x + barW / 2}
                  y={PAD.top + INNER_H + 16}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#64748B"
                >
                  {label}
                </text>
              )}
            </g>
          )
        })}

        {/* Y-axis line */}
        <line
          x1={PAD.left} y1={PAD.top}
          x2={PAD.left} y2={PAD.top + INNER_H}
          stroke="#CBD5E1" strokeWidth="1"
        />
      </svg>
    </div>
  )
}
