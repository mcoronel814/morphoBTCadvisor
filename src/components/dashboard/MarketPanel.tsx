import { RefreshCw, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useApp } from '@/context/AppContext'
import { LLTV } from '@/lib/constants'
import { formatApy, formatPercent, formatUsd } from '@/lib/utils'

export function MarketPanel() {
  const { market, refreshMarket, loading } = useApp()

  if (!market) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-morpho" />
            Live Market
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading market data...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-morpho" />
          Live Market
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => refreshMarket()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Borrow APY</span>
          <span className="font-semibold text-morpho">{formatApy(market.borrowApy)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Utilization</span>
          <span className="font-semibold">{formatPercent(market.utilization * 100, 1)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">LLTV</span>
          <span className="font-semibold">{(market.lltv * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Oracle Price</span>
          <span className="font-semibold text-btc">
            {market.oraclePrice > 0 ? formatUsd(market.oraclePrice) : '—'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Supplied</span>
          <span className="font-semibold">{formatUsd(market.supplyAssetsUsd, true)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Borrowed</span>
          <span className="font-semibold">{formatUsd(market.borrowAssetsUsd, true)}</span>
        </div>
        <p className="pt-2 text-xs text-muted-foreground">
          cbBTC-USDC market on Base · LLTV {(LLTV * 100).toFixed(0)}%
        </p>
      </CardContent>
    </Card>
  )
}