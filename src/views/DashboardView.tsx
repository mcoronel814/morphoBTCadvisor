import { Camera, FlaskConical, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LTVGauge } from '@/components/dashboard/LTVGauge'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { MarketPanel } from '@/components/dashboard/MarketPanel'
import { Onboarding } from '@/components/dashboard/Onboarding'
import { PositionLoader } from '@/components/dashboard/PositionLoader'
import { SnapshotHistory } from '@/components/dashboard/SnapshotHistory'
import { EducationPanel } from '@/components/layout/EducationPanel'
import { useApp } from '@/context/AppContext'
import { optimizeToTargetLtv } from '@/lib/calculations'
import { formatBtc, formatPercent, formatUsd } from '@/lib/utils'

export function DashboardView() {
  const {
    position,
    metrics,
    settings,
    showOnboarding,
    takeSnapshot,
    setActiveTab,
    market,
  } = useApp()

  const lltv = market?.lltv ?? 0.86

  if (!position || !metrics) {
    return (
      <div className="space-y-6">
        {showOnboarding && <Onboarding />}
        <EducationPanel />
        <PositionLoader />
        <MarketPanel />
      </div>
    )
  }

  const optimization = optimizeToTargetLtv(
    position.collateralBtc,
    position.debtUsdc,
    position.btcPrice,
    settings.targetLtv,
    lltv,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button onClick={takeSnapshot} variant="outline" size="sm">
          <Camera className="h-4 w-4" />
          Take Snapshot
        </Button>
        <Button onClick={() => setActiveTab('scenarios')} variant="outline" size="sm">
          <FlaskConical className="h-4 w-4" />
          What if I borrow more?
        </Button>
        <Button onClick={() => setActiveTab('scenarios')} variant="outline" size="sm">
          <Target className="h-4 w-4" />
          Optimize to target LTV
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex items-center justify-center rounded-xl border border-border bg-card p-6 lg:col-span-1">
          <LTVGauge ltv={metrics.ltv} healthFactor={metrics.healthFactor} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <MetricCard
            label="cbBTC Collateral"
            value={formatBtc(position.collateralBtc)}
            subValue={formatUsd(metrics.collateralUsd)}
            accent="btc"
            tooltip="Your cbBTC supplied as collateral in the Morpho market"
          />
          <MetricCard
            label="USDC Debt"
            value={formatUsd(metrics.debtUsd)}
            subValue={`@${formatUsd(position.btcPrice)} BTC`}
            accent="usdc"
            tooltip="Total USDC borrowed against your collateral"
          />
          <MetricCard
            label="Borrow Power Available"
            value={formatUsd(metrics.borrowPowerAvailable)}
            tooltip="Additional USDC you can borrow before hitting LLTV limit"
          />
          <MetricCard
            label="Est. Monthly Interest"
            value={formatUsd(metrics.monthlyInterest)}
            tooltip="Estimated monthly interest cost at current borrow APY"
          />
          <MetricCard
            label="Distance to Liquidation"
            value={formatPercent(metrics.distanceToLiquidation)}
            accent={metrics.distanceToLiquidation > 30 ? 'safe' : 'danger'}
            tooltip="% BTC price drop tolerable before liquidation at current debt"
          />
          <MetricCard
            label="Target LTV Suggestion"
            value={optimization.action === 'none' ? 'On target' : formatUsd(optimization.amount)}
            subValue={optimization.description}
            tooltip={`Optimize to your ${settings.targetLtv}% target LTV`}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SnapshotHistory />
        </div>
        <MarketPanel />
      </div>

      <EducationPanel />
      <PositionLoader />
    </div>
  )
}