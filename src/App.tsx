import { TooltipProvider } from '@/components/ui/tooltip'
import { AppLayout } from '@/components/layout/AppLayout'
import { AppProvider, useApp } from '@/context/AppContext'
import { AdvisorView } from '@/views/AdvisorView'
import { DashboardView } from '@/views/DashboardView'
import { ScenariosView } from '@/views/ScenariosView'
import { SimulatorView } from '@/views/SimulatorView'

function AppContent() {
  const { activeTab } = useApp()

  return (
    <AppLayout>
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'simulator' && <SimulatorView />}
      {activeTab === 'advisor' && <AdvisorView />}
      {activeTab === 'scenarios' && <ScenariosView />}
    </AppLayout>
  )
}

export default function App() {
  return (
    <TooltipProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </TooltipProvider>
  )
}