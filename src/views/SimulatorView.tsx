import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts'
import { Info, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useApp } from '@/context/AppContext'
import { BTC_CAGR_PRESETS } from '@/lib/constants'
import {
  getPowerLawPricesToday,
  getPriceBandContext,
  isBeyondPowerLawRange,
  maxHorizonYearsTo2040,
  POWER_LAW_BANDS,
  POWER_LAW_MAX_YEAR,
  POWER_LAW_PARAMS,
} from '@/lib/power-law'
import {
  buildPowerLawPriceChartData,
  compareStrategies,
  runStressTestAtMonth,
} from '@/lib/simulation'
import type { SimulationMode } from '@/lib/types'
import { formatBtc, formatPercent, formatUsd } from '@/lib/utils'

export function SimulatorView() {
  const { position, settings, updateSettings, market } = useApp()
  const [stressCrash, setStressCrash] = useState(40)
  const [stressMonth, setStressMonth] = useState(12)

  const borrowApy = settings.borrowApyOverride ?? market?.borrowApy ?? 0.05
  const isPowerLaw = settings.simulationMode === 'power-law'
  const maxPowerLawYears = maxHorizonYearsTo2040()
  const beyondRange = isPowerLaw && isBeyondPowerLawRange(settings.timeHorizonYears)

  const powerLawToday = useMemo(() => getPowerLawPricesToday(), [])
  const priceContext = useMemo(
    () => (position ? getPriceBandContext(position.btcPrice) : null),
    [position],
  )

  const scenarios = useMemo(() => {
    if (!position) return []
    return compareStrategies({
      collateralBtc: position.collateralBtc,
      debtUsdc: position.debtUsdc,
      btcPrice: position.btcPrice,
      borrowApy,
      settings,
      targetLtv: settings.targetLtv,
      lltv: market?.lltv,
    })
  }, [position, settings, borrowApy, market])

  const chartData = useMemo(() => {
    if (!scenarios.length) return []
    const maxMonths = scenarios[0].months.length
    return Array.from({ length: maxMonths }, (_, i) => {
      const point: Record<string, number | string> = { month: i + 1 }
      for (const s of scenarios) {
        const m = s.months[i]
        if (m) {
          point[`${s.name}_ltv`] = m.ltv
          point[`${s.name}_equity`] = m.netEquity
          point[`${s.name}_btc`] = m.collateralBtc
          point[`${s.name}_price`] = m.btcPrice
        }
      }
      return point
    })
  }, [scenarios])

  const powerLawPriceData = useMemo(() => {
    if (!isPowerLaw || !position) return []
    return buildPowerLawPriceChartData(settings.timeHorizonYears * 12)
  }, [isPowerLaw, position, settings.timeHorizonYears])

  const stressResult = useMemo(() => {
    const baseline = scenarios.find((s) =>
      isPowerLaw ? s.name === 'Fair (Regression)' : s.name === 'Balanced',
    )
    if (!baseline) return null
    return runStressTestAtMonth(baseline, stressCrash, stressMonth)
  }, [scenarios, stressCrash, stressMonth, isPowerLaw])

  const setSimulationMode = (mode: SimulationMode) => {
    if (mode === 'power-law' && settings.timeHorizonYears > maxPowerLawYears) {
      updateSettings({ simulationMode: mode, timeHorizonYears: maxPowerLawYears })
    } else {
      updateSettings({ simulationMode: mode })
    }
  }

  if (!position) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Load a position on the Dashboard to run simulations.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Price Model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!isPowerLaw ? 'btc' : 'outline'}
              size="sm"
              onClick={() => setSimulationMode('cagr')}
            >
              CAGR Scenarios
            </Button>
            <Button
              variant={isPowerLaw ? 'btc' : 'outline'}
              size="sm"
              onClick={() => setSimulationMode('power-law')}
            >
              <TrendingUp className="h-4 w-4" />
              Bitcoin Power Law
            </Button>
          </div>

          {isPowerLaw && (
            <div className="rounded-lg border border-btc/20 bg-btc/5 p-4 text-sm space-y-3">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-btc" />
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Giovanni Santostasi Power Law</strong> —
                    models BTC price as a function of time since genesis (Jan 3, 2009). Three
                    scenarios track the historical corridor bands:
                  </p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>
                      <strong className="text-safe">Floor (Support)</strong> —{' '}
                      {POWER_LAW_BANDS.floor.description}
                    </li>
                    <li>
                      <strong className="text-primary">Fair (Regression)</strong> —{' '}
                      {POWER_LAW_BANDS.fair.description}
                    </li>
                    <li>
                      <strong className="text-btc">Ceiling (Resistance)</strong> —{' '}
                      {POWER_LAW_BANDS.ceiling.description}
                    </li>
                  </ul>
                  <p className="font-mono text-xs">
                    Price(t) = 10^{POWER_LAW_PARAMS.logA} × t^{POWER_LAW_PARAMS.beta} · σ ={' '}
                    {POWER_LAW_PARAMS.sigma}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {(Object.keys(POWER_LAW_BANDS) as Array<keyof typeof POWER_LAW_BANDS>).map(
                  (band) => (
                    <div key={band} className="rounded-md bg-card p-3">
                      <p className="text-xs text-muted-foreground">{POWER_LAW_BANDS[band].label}</p>
                      <p className="text-lg font-bold text-foreground">
                        {formatUsd(powerLawToday[band])}
                      </p>
                      <p className="text-xs text-muted-foreground">Today</p>
                    </div>
                  ),
                )}
              </div>

              {priceContext && (
                <p className="text-xs">
                  Your price ({formatUsd(position.btcPrice)}) is{' '}
                  <strong>{priceContext.ratioToFair.toFixed(2)}×</strong> fair value
                  {priceContext.band === 'below-floor' && (
                    <Badge variant="danger" className="ml-2">
                      Below floor
                    </Badge>
                  )}
                  {priceContext.band === 'above-ceiling' && (
                    <Badge variant="btc" className="ml-2">
                      Above ceiling
                    </Badge>
                  )}
                </p>
              )}

              {beyondRange && (
                <p className="rounded-md bg-caution/10 px-3 py-2 text-xs text-caution">
                  Horizon extends past {POWER_LAW_MAX_YEAR}. Power law projections beyond that year
                  are extrapolation — use CAGR mode for longer speculative horizons.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Simulation Inputs</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Monthly Income ($)</Label>
            <Input
              type="number"
              value={settings.monthlyIncome}
              onChange={(e) => updateSettings({ monthlyIncome: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Monthly Expenses ($)</Label>
            <Input
              type="number"
              value={settings.monthlyExpenses}
              onChange={(e) => updateSettings({ monthlyExpenses: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Time Horizon (years)</Label>
            <Input
              type="number"
              min={1}
              max={isPowerLaw ? maxPowerLawYears : 10}
              value={settings.timeHorizonYears}
              onChange={(e) =>
                updateSettings({ timeHorizonYears: parseInt(e.target.value) || 5 })
              }
            />
            {isPowerLaw && (
              <p className="text-xs text-muted-foreground">Max {maxPowerLawYears}y to {POWER_LAW_MAX_YEAR}</p>
            )}
          </div>

          {!isPowerLaw && (
            <div className="space-y-2">
              <Label>BTC CAGR Scenario</Label>
              <Select
                value={String(settings.btcCagr)}
                onValueChange={(v) => updateSettings({ btcCagr: parseFloat(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(BTC_CAGR_PRESETS.conservative)}>
                    Conservative (30%)
                  </SelectItem>
                  <SelectItem value={String(BTC_CAGR_PRESETS.moderate)}>
                    Moderate (50%)
                  </SelectItem>
                  <SelectItem value={String(BTC_CAGR_PRESETS.bull)}>Bull (80%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Borrow APY Override</Label>
            <Input
              type="number"
              step="0.01"
              placeholder={(borrowApy * 100).toFixed(2)}
              value={settings.borrowApyOverride ? settings.borrowApyOverride * 100 : ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                updateSettings({ borrowApyOverride: isNaN(val) ? undefined : val / 100 })
              }}
            />
          </div>
          <div className="flex items-center justify-between space-y-0 rounded-lg border border-border p-3">
            <div>
              <Label>Include Monthly Mined BTC</Label>
              <p className="text-xs text-muted-foreground">
                {settings.monthlyMinedBtc} BTC/month
              </p>
            </div>
            <Switch
              checked={settings.includeMinedBtc}
              onCheckedChange={(v) => updateSettings({ includeMinedBtc: v })}
            />
          </div>
        </CardContent>
      </Card>

      <div className={`grid gap-4 sm:grid-cols-2 ${isPowerLaw ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
        {scenarios.map((s) => (
          <Card key={s.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: s.color }}>
                {s.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>
                Final BTC: <strong>{formatBtc(s.finalBtc)}</strong>
              </p>
              <p>
                Net Equity: <strong>{formatUsd(s.finalEquity, true)}</strong>
              </p>
              <p>
                Total Interest: <strong>{formatUsd(s.totalInterest, true)}</strong>
              </p>
              {isPowerLaw && s.months.length > 0 && (
                <p>
                  End BTC Price:{' '}
                  <strong>{formatUsd(s.months[s.months.length - 1].btcPrice, true)}</strong>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {isPowerLaw && powerLawPriceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Power Law Price Bands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={powerLawPriceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#64748b" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="#64748b"
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    scale="log"
                    domain={['auto', 'auto']}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      background: '#111827',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => formatUsd(Number(value ?? 0))}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="floor"
                    stroke="#166534"
                    strokeWidth={2}
                    dot={false}
                    name="Floor"
                  />
                  <Line
                    type="monotone"
                    dataKey="fair"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="Fair"
                  />
                  <Line
                    type="monotone"
                    dataKey="ceiling"
                    stroke="#f7931a"
                    strokeWidth={2}
                    dot={false}
                    name="Ceiling"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">LTV Trajectory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" domain={[0, 90]} />
                <RechartsTooltip
                  contentStyle={{
                    background: '#111827',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                {scenarios.map((s) => (
                  <Line
                    key={s.name}
                    type="monotone"
                    dataKey={`${s.name}_ltv`}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={false}
                    name={`${s.name} LTV`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Net Equity Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#64748b"
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <RechartsTooltip
                  contentStyle={{
                    background: '#111827',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => formatUsd(Number(value ?? 0))}
                />
                <Legend />
                {scenarios.map((s) => (
                  <Line
                    key={s.name}
                    type="monotone"
                    dataKey={`${s.name}_equity`}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={false}
                    name={`${s.name} Equity`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stress Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Applied to {isPowerLaw ? 'Fair (Regression)' : 'Balanced'} scenario
          </p>
          <div className="space-y-2">
            <Label>BTC Crash: {stressCrash}%</Label>
            <Slider
              value={[stressCrash]}
              onValueChange={([v]) => setStressCrash(v)}
              min={10}
              max={70}
              step={5}
            />
          </div>
          <div className="space-y-2">
            <Label>At Month: {stressMonth}</Label>
            <Slider
              value={[stressMonth]}
              onValueChange={([v]) => setStressMonth(v)}
              min={1}
              max={settings.timeHorizonYears * 12}
              step={1}
            />
          </div>
          {stressResult && (
            <div className="rounded-lg bg-destructive/10 p-4 text-sm">
              <p>
                After {stressCrash}% crash at month {stressMonth}:
              </p>
              <p className="mt-2 font-semibold">
                LTV: {formatPercent(stressResult.ltv)} · HF:{' '}
                {stressResult.healthFactor.toFixed(2)} · Equity:{' '}
                {formatUsd(stressResult.netEquity)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}