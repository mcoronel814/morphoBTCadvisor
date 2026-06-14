import { FlaskConical, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useApp } from '@/context/AppContext'

const actions = [
  {
    id: 'borrow-more',
    icon: FlaskConical,
    title: 'What if I borrow more?',
    description:
      'Open the What-If Lab to model extra borrowing before you do it on-chain. Slide how much USDC you would add and instantly see the impact on LTV, health factor, and liquidation distance.',
    buttonLabel: 'Try in What-If',
    tab: 'scenarios' as const,
  },
  {
    id: 'optimize',
    icon: Target,
    title: 'Optimize to target LTV',
    description:
      'See exactly how much to borrow, repay, or add in collateral to hit your personal target LTV. Use this as a planning guide — you still execute trades yourself in Morpho.',
    buttonLabel: 'Open optimizer',
    tab: 'scenarios' as const,
  },
]

export function QuickActions() {
  const { setActiveTab } = useApp()

  return (
    <div className="grid gap-3 sm:grid-cols-2">
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
              onClick={() => setActiveTab(tab)}
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