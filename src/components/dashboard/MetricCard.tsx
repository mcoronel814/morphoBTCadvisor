import { motion } from 'framer-motion'
import { HelpCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string
  subValue?: string
  tooltip?: string
  accent?: 'btc' | 'usdc' | 'safe' | 'danger' | 'default'
  icon?: ReactNode
}

const accentClasses = {
  btc: 'text-btc',
  usdc: 'text-usdc',
  safe: 'text-safe',
  danger: 'text-danger',
  default: 'text-foreground',
}

export function MetricCard({ label, value, subValue, tooltip, accent = 'default', icon }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 sm:p-5"
    >
      <div className="flex items-center justify-between">
        <p className="metric-label flex items-center gap-1">
          {icon}
          {label}
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-foreground">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
            </Tooltip>
          )}
        </p>
      </div>
      <p className={cn('metric-value mt-2', accentClasses[accent])}>{value}</p>
      {subValue && <p className="mt-1 text-sm text-muted-foreground">{subValue}</p>}
    </motion.div>
  )
}