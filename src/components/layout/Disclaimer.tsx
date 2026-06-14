import { AlertTriangle } from 'lucide-react'

export function Disclaimer() {
  return (
    <div className="rounded-lg border border-caution/30 bg-caution/5 px-4 py-3 text-sm text-muted-foreground">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-caution" />
        <p>
          <strong className="text-foreground">Not financial advice.</strong> DeFi involves smart
          contract risk, liquidation risk, oracle risk, and variable rates. Always DYOR before
          making decisions.
        </p>
      </div>
    </div>
  )
}