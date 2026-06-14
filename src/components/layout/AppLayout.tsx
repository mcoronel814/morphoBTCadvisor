import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Bitcoin, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Disclaimer } from './Disclaimer'
import { Nav } from './Nav'
import { PositionBar } from './PositionBar'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="no-print border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-btc/10 glow-btc">
              <Bitcoin className="h-6 w-6 text-btc" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                Morpho Bitcoin Advisor
              </h1>
              <p className="text-xs text-muted-foreground">cbBTC-USDC on Base</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="safe" className="hidden gap-1 sm:inline-flex">
              <ShieldCheck className="h-3 w-3" />
              Read-only
            </Badge>
            <ConnectButton chainStatus="icon" showBalance={false} />
          </div>
        </div>
      </header>

      <PositionBar />
      <Nav />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <Disclaimer />
        </div>
        {children}
      </main>

      <footer className="no-print border-t border-border py-6 text-center text-xs text-muted-foreground">
        Morpho Bitcoin Advisor v1.0 — Read-only position tracking & strategy planning
      </footer>
    </div>
  )
}