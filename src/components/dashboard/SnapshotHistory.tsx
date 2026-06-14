import { Camera, Download } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useApp } from '@/context/AppContext'
import { exportSnapshotsCsv, exportSnapshotsJson } from '@/lib/export'
import { formatPercent } from '@/lib/utils'

export function SnapshotHistory() {
  const { snapshots } = useApp()

  if (snapshots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">LTV History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Take snapshots to track your LTV over time.
          </p>
        </CardContent>
      </Card>
    )
  }

  const chartData = [...snapshots]
    .reverse()
    .map((s) => ({
      date: new Date(s.timestamp).toLocaleDateString(),
      ltv: s.ltv,
      hf: s.healthFactor === Infinity ? 10 : s.healthFactor,
    }))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Camera className="h-4 w-4" />
          LTV History
        </CardTitle>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => exportSnapshotsCsv(snapshots)}>
            <Download className="h-3 w-3" />
            CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={() => exportSnapshotsJson(snapshots)}>
            JSON
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 11 }} stroke="#64748b" domain={[0, 100]} />
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
                dot={{ fill: '#f7931a', r: 3 }}
                name="LTV %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 max-h-32 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="pb-2 text-left">Date</th>
                <th className="pb-2 text-right">LTV</th>
                <th className="pb-2 text-right">HF</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.slice(0, 5).map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="py-1.5">{new Date(s.timestamp).toLocaleString()}</td>
                  <td className="py-1.5 text-right">{formatPercent(s.ltv)}</td>
                  <td className="py-1.5 text-right">
                    {s.healthFactor === Infinity ? '∞' : s.healthFactor.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}