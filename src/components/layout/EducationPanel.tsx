import { ChevronDown, Info } from 'lucide-react'
import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { LLTV } from '@/lib/constants'

export function EducationPanel() {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-accent/50">
        <span className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          How LTV & Health Factor Work
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground space-y-3">
        <div>
          <strong className="text-foreground">LTV (Loan-to-Value)</strong>
          <p className="mt-1 font-mono text-xs">
            LTV (%) = (borrowed USDC value / collateral cbBTC value in USDC) × 100
          </p>
          <p className="mt-1">
            Measures how much you've borrowed relative to your collateral. Lower is safer.
          </p>
        </div>
        <div>
          <strong className="text-foreground">Health Factor</strong>
          <p className="mt-1 font-mono text-xs">
            HF = (collateral value × LLTV) / borrowed USDC value
          </p>
          <p className="mt-1">
            HF &gt; 1.0 = healthy position. HF ≤ 1.0 = liquidatable. LLTV for this market ={' '}
            {(LLTV * 100).toFixed(0)}%.
          </p>
        </div>
        <div>
          <strong className="text-foreground">Distance to Liquidation</strong>
          <p className="mt-1">
            The percentage BTC price can drop before your position becomes liquidatable at current
            debt levels.
          </p>
        </div>
        <div>
          <strong className="text-foreground">Why LTV often improves over time</strong>
          <p className="mt-1">
            If BTC appreciates faster than your debt grows (interest), your LTV naturally decreases —
            your collateral grows in USD terms while debt stays relatively flat.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}