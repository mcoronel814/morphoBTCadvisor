import { Camera, FlaskConical, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useApp } from '@/context/AppContext'
import type { TabId } from '@/lib/types'

const actions: Array<{
  id: string
  icon: typeof Camera
  title: string
  description: string
  buttonLabel: string
  tab: TabId | null
}> = [
  {
    id: 'snapshot',
    icon: Camera,
    title: 'Take Snapshot',
    description:
      'Save a point-in-time record of your LTV and health factor. Snapshots build your history chart so you can see whether your loan is getting safer or riskier over weeks and months.',
    buttonLabel: 'Save snapshot',
    tab: null,
  },
  {
    id: 'borrow-more',
    icon: FlaskConical,
    title: 'What if I borrow more?',
    description:
      'Open the What-If Lab to model extra borrowing before you do it on-chain. Slide how much USDC you would add and instantly see the impact on LTV, health factor, and liquidation distance.',
    buttonLabel: 'Try in What-If',
    tab: 'scenarios',
  },
  {
    id: 'optimize',
    icon: Target,
    title: 'Optimize to target LTV',
    description:
      'See exactly how much to borrow, repay, or add in collateral to hit your personal target LTV. Use this as a planning guide — you still execute trades yourself in Morpho.',
    buttonLabel: 'Open optimizer',
    tab: 'scenarios',
  },
]

export function QuickActions() {
  const { takeSnapshot, setActiveTab } = useApp()

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {actions.map(({ id, icon: Icon, title, description, buttonLabel, tab }) => (
        <Card key={id} className="border-border/80">
          <CardContent className="flex h-full flex-col gap-3 p-4">
            <div className="flex items-start gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-auto w-full"
              onClick={() => (tab ? setActiveTab(tab) : takeSnapshot())}
            >
              <Icon className="h-4 w-4" />
              {buttonLabel}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}