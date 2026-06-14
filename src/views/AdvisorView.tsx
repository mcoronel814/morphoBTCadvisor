import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Download, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { useApp } from '@/context/AppContext'
import { stressTestCrash } from '@/lib/calculations'
import { RISK_PROFILES } from '@/lib/constants'
import { exportPlaybookJson, printReport } from '@/lib/export'
import { applyRiskProfile, generatePlaybook } from '@/lib/playbook'
import { savePlaybook } from '@/lib/storage'
import type { RiskProfile } from '@/lib/types'
import { formatPercent, formatUsd } from '@/lib/utils'

export function AdvisorView() {
  const { position, settings, updateSettings, market } = useApp()
  const [playbook, setPlaybook] = useState(() => null as ReturnType<typeof generatePlaybook> | null)
  const [selectedMonth, setSelectedMonth] = useState(1)
  const [crashPercent, setCrashPercent] = useState(40)

  const borrowApy = settings.borrowApyOverride ?? market?.borrowApy ?? 0.05
  const lltv = market?.lltv ?? 0.86

  const stressResult = useMemo(() => {
    if (!position) return null
    return stressTestCrash(
      position.collateralBtc,
      position.debtUsdc,
      position.btcPrice,
      crashPercent,
      lltv,
    )
  }, [position, crashPercent, lltv])

  const projectionData = useMemo(() => {
    if (!playbook) return []
    return playbook.months.map((m) => ({
      month: m.month,
      ltv: m.projectedLtv,
      hf: m.projectedHf === Infinity ? 5 : m.projectedHf,
    }))
  }, [playbook])

  const handleGenerate = () => {
    if (!position) return
    const pb = generatePlaybook(position, settings, borrowApy, lltv)
    setPlaybook(pb)
    savePlaybook(pb)
  }

  const handleRiskProfile = (profile: RiskProfile) => {
    updateSettings(applyRiskProfile(profile))
  }

  if (!position) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Load a position on the Dashboard to generate your personalized playbook.
        </CardContent>
      </Card>
    )
  }

  const currentMonth = playbook?.months[selectedMonth - 1]

  return (
    <div className="space-y-6 print:space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Risk Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(RISK_PROFILES) as RiskProfile[]).map((key) => (
              <Button
                key={key}
                variant={settings.riskProfile === key ? 'btc' : 'outline'}
                size="sm"
                onClick={() => handleRiskProfile(key)}
              >
                {RISK_PROFILES[key].label}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {RISK_PROFILES[settings.riskProfile].description}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Target LTV (%)</Label>
              <Input
                type="number"
                value={settings.targetLtv}
                onChange={(e) =>
                  updateSettings({ targetLtv: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Rebalance Threshold (%)</Label>
              <Input
                type="number"
                value={settings.rebalanceThreshold}
                onChange={(e) =>
                  updateSettings({ rebalanceThreshold: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Crash Resilience Goal (%)</Label>
              <Input
                type="number"
                value={settings.crashResilience * 100}
                onChange={(e) =>
                  updateSettings({ crashResilience: (parseFloat(e.target.value) || 0) / 100 })
                }
              />
            </div>
          </div>
          <Button variant="btc" onClick={handleGenerate} className="w-full sm:w-auto">
            <Sparkles className="h-4 w-4" />
            Generate Personalized Playbook
          </Button>
        </CardContent>
      </Card>

      {playbook && (
        <>
          <Card className="border-btc/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Current Recommendation</CardTitle>
              <div className="no-print flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => exportPlaybookJson(playbook)}>
                  <Download className="h-3 w-3" />
                  JSON
                </Button>
                <Button variant="ghost" size="sm" onClick={printReport}>
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{playbook.recommendation}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Month {selectedMonth}</Label>
                <Slider
                  value={[selectedMonth]}
                  onValueChange={([v]) => setSelectedMonth(v)}
                  min={1}
                  max={playbook.months.length}
                  step={1}
                />
              </div>
              {currentMonth && (
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="btc">{currentMonth.action}</Badge>
                    <span className="text-sm text-muted-foreground">
                      Month {currentMonth.month}
                    </span>
                  </div>
                  <p className="text-sm">{currentMonth.notes}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <div>
                      <span className="text-muted-foreground">Borrow</span>
                      <p className="font-semibold">{formatUsd(currentMonth.borrowNeeded)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Collateral +</span>
                      <p className="font-semibold">{currentMonth.collateralToAdd.toFixed(4)} BTC</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Repay</span>
                      <p className="font-semibold">{formatUsd(currentMonth.repayAmount)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Proj. LTV / HF</span>
                      <p className="font-semibold">
                        {formatPercent(currentMonth.projectedLtv)} /{' '}
                        {currentMonth.projectedHf.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">5-Year LTV Projection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#64748b" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                    <RechartsTooltip
                      contentStyle={{
                        background: '#111827',
                        border: '1px solid #1e293b',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ltv"
                      stroke="#f7931a"
                      strokeWidth={2}
                      dot={false}
                      name="LTV %"
                    />
                    <Line
                      type="monotone"
                      dataKey="hf"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      name="Health Factor"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stress Test: What if BTC drops tomorrow?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Crash: {crashPercent}%</Label>
            <Slider
              value={[crashPercent]}
              onValueChange={([v]) => setCrashPercent(v)}
              min={10}
              max={70}
              step={5}
            />
          </div>
          {stressResult && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-destructive/10 p-4">
                <p className="text-sm text-muted-foreground">After crash</p>
                <p className="text-xl font-bold">
                  LTV {formatPercent(stressResult.newLtv)} · HF {stressResult.newHf.toFixed(2)}
                </p>
                <p className="text-sm">BTC @ {formatUsd(stressResult.newBtcPrice)}</p>
              </div>
              <div className="rounded-lg bg-safe/10 p-4">
                <p className="text-sm text-muted-foreground">To restore target LTV</p>
                <p className="text-sm">
                  Repay: <strong>{formatUsd(stressResult.repayToTarget(settings.targetLtv))}</strong>
                </p>
                <p className="text-sm">
                  Or add: <strong>{stressResult.collateralToAdd(settings.targetLtv).toFixed(4)} cbBTC</strong>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}