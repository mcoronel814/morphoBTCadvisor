import { Bitcoin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useApp } from '@/context/AppContext'
import { getLtvZone } from '@/lib/calculations'
import { formatBtc, formatPercent, formatUsd } from '@/lib/utils'

export function PositionBar() {
  const { position, metrics } = useApp()

  if (!position || !metrics) return null

  const zone = getLtvZone(metrics.ltv)
  const badgeVariant =
    zone === 'safe' ? 'safe' : zone === 'caution' ? 'caution' : 'danger'

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <div className="flex items-center gap-3">
          <Bitcoin className="h-5 w-5 text-btc" />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span>
              <span className="text-muted-foreground">Collateral </span>
              <strong className="text-btc">{formatBtc(position.collateralBtc)}</strong>
              <span className="text-muted-foreground"> ({formatUsd(metrics.collateralUsd, true)})</span>
            </span>
            <span>
              <span className="text-muted-foreground">Debt </span>
              <strong className="text-usdc">{formatUsd(metrics.debtUsd)}</strong>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={badgeVariant}>LTV {formatPercent(metrics.ltv)}</Badge>
          <Badge variant={metrics.isHealthy ? 'safe' : 'danger'}>
            HF {metrics.healthFactor === Infinity ? '∞' : metrics.healthFactor.toFixed(2)}
          </Badge>
        </div>
      </div>
    </div>
  )
}