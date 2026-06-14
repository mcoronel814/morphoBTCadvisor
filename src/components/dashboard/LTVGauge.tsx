import { motion } from 'framer-motion'
import { getLtvColor } from '@/lib/calculations'
import { formatPercent } from '@/lib/utils'

interface LTVGaugeProps {
  ltv: number
  healthFactor: number
}

export function LTVGauge({ ltv, healthFactor }: LTVGaugeProps) {
  const color = getLtvColor(ltv)
  const maxLtv = 100
  const percentage = Math.min(ltv / maxLtv, 1)
  const radius = 90
  const strokeWidth = 14
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - percentage * 0.75)

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-[135deg]">
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
          />
          <motion.circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={ltv}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-bold tabular-nums sm:text-5xl"
            style={{ color }}
          >
            {formatPercent(ltv, 1)}
          </motion.span>
          <span className="text-sm text-muted-foreground">LTV</span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="text-center">
          <p className="text-muted-foreground">Health Factor</p>
          <p className={`text-xl font-bold tabular-nums ${healthFactor > 1 ? 'text-safe' : 'text-danger'}`}>
            {healthFactor === Infinity ? '∞' : healthFactor.toFixed(2)}
          </p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-safe" /> Safe &lt;50%
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-caution" /> Caution
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-danger" /> Danger
          </span>
        </div>
      </div>
    </div>
  )
}