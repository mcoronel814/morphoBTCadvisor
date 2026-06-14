import { useMemo, useState } from 'react'
import { Shield, TrendingDown, TrendingUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { LTVGauge } from '@/components/dashboard/LTVGauge'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { useApp } from '@/context/AppContext'
import {
  calculateMetrics,
  calculateMonthlyInterest,
  optimizeToTargetLtv,
} from '@/lib/calculations'
import { formatBtc, formatPercent, formatUsd } from '@/lib/utils'
import type { WhatIfState } from '@/lib/types'

const defaultWhatIf: WhatIfState = {
  btcPriceChange: 0,
  additionalBorrow: 0,
  additionalCollateral: 0,
  debtRepay: 0,
}

export function ScenariosView() {
  const { position, settings, market } = useApp()
  const [whatIf, setWhatIf] = useState<WhatIfState>(defaultWhatIf)

  const borrowApy = settings.borrowApyOverride ?? market?.borrowApy ?? 0.05
  const lltv = market?.lltv ?? 0.86

  const scenarioPosition = useMemo(() => {
    if (!position) return null
    const newBtcPrice = position.btcPrice * (1 + whatIf.btcPriceChange / 100)
    return {
      collateralBtc: position.collateralBtc + whatIf.additionalCollateral,
      debtUsdc: position.debtUsdc + whatIf.additionalBorrow - whatIf.debtRepay,
      btcPrice: newBtcPrice,
      source: position.source,
      updatedAt: Date.now(),
    }
  }, [position, whatIf])

  const metrics = useMemo(() => {
    if (!scenarioPosition) return null
    return calculateMetrics(scenarioPosition, borrowApy, lltv)
  }, [scenarioPosition, borrowApy, lltv])

  const optimization = useMemo(() => {
    if (!scenarioPosition) return null
    return optimizeToTargetLtv(
      scenarioPosition.collateralBtc,
      scenarioPosition.debtUsdc,
      scenarioPosition.btcPrice,
      settings.targetLtv,
      lltv,
    )
  }, [scenarioPosition, settings.targetLtv, lltv])

  const updateWhatIf = (partial: Partial<WhatIfState>) => {
    setWhatIf((prev) => ({ ...prev, ...partial }))
  }

  const applyPreset = (preset: string) => {
    if (!position || !metrics) return
    switch (preset) {
      case 'volatility':
        setWhatIf({ ...defaultWhatIf, btcPriceChange: -30 })
        break
      case 'max-credit':
        setWhatIf({
          ...defaultWhatIf,
          additionalBorrow: Math.min(metrics.borrowPowerAvailable, 10000),
        })
        break
      case 'deleverage':
        setWhatIf({
          ...defaultWhatIf,
          btcPriceChange: -20,
          debtRepay: Math.min(position.debtUsdc * 0.2, 10000),
        })
        break
      case 'reset':
        setWhatIf(defaultWhatIf)
        break
    }
  }

  if (!position || !metrics) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Load a position on the Dashboard to use the What-If Lab.
        </CardContent>
      </Card>
    )
  }

  const monthlyInterest = calculateMonthlyInterest(metrics.debtUsd, borrowApy)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => applyPreset('volatility')}>
          <Shield className="h-4 w-4" />
          Prepare for volatility
        </Button>
        <Button variant="outline" size="sm" onClick={() => applyPreset('max-credit')}>
          <Zap className="h-4 w-4" />
          Maximize credit line
        </Button>
        <Button variant="outline" size="sm" onClick={() => applyPreset('deleverage')}>
          <TrendingDown className="h-4 w-4" />
          Deleverage after dip
        </Button>
        <Button variant="ghost" size="sm" onClick={() => applyPreset('reset')}>
          Reset
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interactive Sliders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>BTC Price Change: {whatIf.btcPriceChange > 0 ? '+' : ''}{whatIf.btcPriceChange}%</Label>
              <Slider
                value={[whatIf.btcPriceChange]}
                onValueChange={([v]) => updateWhatIf({ btcPriceChange: v })}
                min={-50}
                max={50}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Additional Borrow: {formatUsd(whatIf.additionalBorrow)}</Label>
              <Slider
                value={[whatIf.additionalBorrow]}
                onValueChange={([v]) => updateWhatIf({ additionalBorrow: v })}
                min={0}
                max={50000}
                step={500}
              />
            </div>
            <div className="space-y-2">
              <Label>Additional Collateral: {whatIf.additionalCollateral.toFixed(4)} BTC</Label>
              <Slider
                value={[whatIf.additionalCollateral]}
                onValueChange={([v]) => updateWhatIf({ additionalCollateral: v })}
                min={0}
                max={1}
                step={0.01}
              />
            </div>
            <div className="space-y-2">
              <Label>Debt Repay: {formatUsd(whatIf.debtRepay)}</Label>
              <Slider
                value={[whatIf.debtRepay]}
                onValueChange={([v]) => updateWhatIf({ debtRepay: v })}
                min={0}
                max={position.debtUsdc}
                step={500}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center rounded-xl border border-border bg-card p-6">
          {scenarioPosition && metrics && (
            <LTVGauge ltv={metrics.ltv} healthFactor={metrics.healthFactor} />
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Scenario LTV"
          value={formatPercent(metrics.ltv)}
          accent={metrics.ltv < 50 ? 'safe' : metrics.ltv < 70 ? 'default' : 'danger'}
        />
        <MetricCard
          label="Health Factor"
          value={metrics.healthFactor === Infinity ? '∞' : metrics.healthFactor.toFixed(2)}
          accent={metrics.isHealthy ? 'safe' : 'danger'}
        />
        <MetricCard
          label="Borrow Power"
          value={formatUsd(metrics.borrowPowerAvailable)}
        />
        <MetricCard
          label="Monthly Interest"
          value={formatUsd(monthlyInterest)}
        />
        <MetricCard
          label="Distance to Liquidation"
          value={formatPercent(metrics.distanceToLiquidation)}
          accent={metrics.distanceToLiquidation > 25 ? 'safe' : 'danger'}
        />
        <MetricCard
          label="Collateral Value"
          value={formatUsd(metrics.collateralUsd)}
          subValue={scenarioPosition ? formatBtc(scenarioPosition.collateralBtc) : undefined}
          accent="btc"
        />
        <MetricCard
          label="Total Debt"
          value={formatUsd(metrics.debtUsd)}
          accent="usdc"
        />
        <MetricCard
          label="Net Equity"
          value={formatUsd(metrics.collateralUsd - metrics.debtUsd)}
          accent={metrics.collateralUsd > metrics.debtUsd ? 'safe' : 'danger'}
        />
      </div>

      {optimization && optimization.action !== 'none' && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Optimize to {settings.targetLtv}% Target LTV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{optimization.description}</p>
            <Button
              className="mt-3"
              variant="outline"
              size="sm"
              onClick={() => {
                if (optimization.action === 'borrow') {
                  updateWhatIf({ additionalBorrow: optimization.amount })
                } else if (optimization.action === 'repay') {
                  updateWhatIf({ debtRepay: optimization.amount })
                } else if (optimization.action === 'add_collateral') {
                  updateWhatIf({ additionalCollateral: optimization.amount })
                }
              }}
            >
              Apply Suggestion
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}