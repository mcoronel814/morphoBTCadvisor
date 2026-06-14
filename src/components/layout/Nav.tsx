import { BarChart3, FlaskConical, LayoutDashboard, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'
import type { TabId } from '@/lib/types'
import { cn } from '@/lib/utils'

const tabs: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'simulator', label: 'Simulator', icon: BarChart3 },
  { id: 'advisor', label: 'Advisor', icon: Sparkles },
  { id: 'scenarios', label: 'What-If', icon: FlaskConical },
]

export function Nav() {
  const { activeTab, setActiveTab } = useApp()

  return (
    <nav className="no-print border-b border-border">
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeTab === id ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(id)}
            className={cn('shrink-0', activeTab === id && 'bg-secondary')}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(' ')[0]}</span>
          </Button>
        ))}
      </div>
    </nav>
  )
}