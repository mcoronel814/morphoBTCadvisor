import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useApp } from '@/context/AppContext'
import { EXAMPLE_POSITION } from '@/lib/constants'

export function Onboarding() {
  const { loadExample, dismissOnboarding } = useApp()

  return (
    <Card className="border-btc/30 bg-btc/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-btc" />
          How to use this for your situation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This tool helps you track your Morpho cbBTC-USDC position on Base, understand your
          liquidation risk, and plan long-term Bitcoin DeFi strategies without selling your stack.
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Load your position via wallet connection or paste your address</li>
          <li>Or enter collateral/debt manually for quick what-if analysis</li>
          <li>Take snapshots to track LTV over time</li>
          <li>Use the Simulator and Advisor tabs to plan your strategy</li>
        </ol>
        <div className="rounded-lg bg-card p-3 text-sm">
          <p className="font-medium">Example position:</p>
          <p className="text-muted-foreground">
            {EXAMPLE_POSITION.collateralBtc} cbBTC collateral · $
            {EXAMPLE_POSITION.debtUsdc.toLocaleString()} USDC debt · BTC @ $
            {EXAMPLE_POSITION.btcPrice.toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="btc" onClick={loadExample}>
            Try Example
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={dismissOnboarding}>
            I'll enter my own data
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}