import { cn } from "@/lib/utils"

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  className?: string
  positive?: boolean
}

/**
 * Clean SVG sparkline with gradient fill.
 * Color auto-derived from first vs last data point, or forced via `positive`.
 */
export function Sparkline({
  data,
  width = 80,
  height = 28,
  className,
  positive,
}: SparklineProps) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const px = 1 // padding

  const pts = data.map((v, i) => {
    const x = px + (i / (data.length - 1)) * (width - px * 2)
    const y = height - px - ((v - min) / range) * (height - px * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const isUp = positive ?? data[data.length - 1] >= data[0]
  const stroke = isUp ? "#10B981" : "#EF4444"
  const id = `sp-${isUp ? "g" : "r"}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`${px},${height} ${pts.join(" ")} ${width - px},${height}`}
        fill={`url(#${id})`}
      />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
