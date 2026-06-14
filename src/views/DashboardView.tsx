import { LayoutDashboard } from 'lucide-react'
import { LTVGauge } from '@/components/dashboard/LTVGauge'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { MarketPanel } from '@/components/dashboard/MarketPanel'
import { Onboarding } from '@/components/dashboard/Onboarding'
import { PositionLoader } from '@/components/dashboard/PositionLoader'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { SnapshotHistory } from '@/components/dashboard/SnapshotHistory'
import { EducationPanel } from '@/components/layout/EducationPanel'
import { SectionGuide } from '@/components/layout/SectionGuide'
import { useApp } from '@/context/AppContext'
import { optimizeToTargetLtv } from '@/lib/calculations'
import { formatBtc, formatPercent, formatUsd } from '@/lib/utils'

export function DashboardView() {
  const {
    position,
    metrics,
    settings,
    showOnboarding,
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
      <SectionGuide title="Your position at a glance" icon={LayoutDashboard} defaultOpen>
        <p>
          This is your home base. Connect your wallet to load your live Morpho cbBTC-USDC loan on
          Base, then watch your <strong className="text-foreground">LTV</strong> (how leveraged you
          are) and <strong className="text-foreground">health factor</strong> (how close you are to
          liquidation).
        </p>
        <p>
          A loan against your Bitcoin is powerful — you keep your BTC while accessing USDC — but if
          BTC falls or debt grows too fast, you can be liquidated and lose collateral. Check this
          page regularly, especially after big BTC moves or when you borrow more.
        </p>
        <p>
          Use the quick actions below to save history, test changes safely, or plan how to reach
          your target LTV. Nothing here moves funds; it only helps you understand and plan.
        </p>
      </SectionGuide>

      <QuickActions />

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