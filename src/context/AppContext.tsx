import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { calculateMetrics } from '@/lib/calculations'
import { EXAMPLE_POSITION, LLTV } from '@/lib/constants'
import { fetchMarketData, fetchUserPosition } from '@/lib/morpho-api'
import {
  isOnboardingDone,
  loadMarket,
  loadPosition,
  loadSettings,
  saveMarket,
  savePosition,
  saveSettings,
  setOnboardingDone,
} from '@/lib/storage'
import type {
  MarketData,
  Position,
  PositionMetrics,
  TabId,
  UserSettings,
} from '@/lib/types'

interface AppState {
  position: Position | null
  market: MarketData | null
  settings: UserSettings
  metrics: PositionMetrics | null
  activeTab: TabId
  loading: boolean
  error: string | null
  showOnboarding: boolean
}

interface AppContextValue extends AppState {
  setActiveTab: (tab: TabId) => void
  loadFromWallet: (address: string) => Promise<void>
  loadManual: (collateralBtc: number, debtUsdc: number, btcPrice?: number) => void
  refreshMarket: () => Promise<void>
  updateSettings: (partial: Partial<UserSettings>) => void
  clearPosition: () => void
  loadExample: () => void
  dismissOnboarding: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<Position | null>(() => loadPosition())
  const [market, setMarket] = useState<MarketData | null>(() => loadMarket())
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings())
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboardingDone() && !loadPosition())

  const borrowApy = settings.borrowApyOverride ?? market?.borrowApy ?? 0.05
  const lltv = market?.lltv ?? LLTV

  const metrics = useMemo(() => {
    if (!position) return null
    return calculateMetrics(position, borrowApy, lltv)
  }, [position, borrowApy, lltv])

  const refreshMarket = useCallback(async () => {
    try {
      const data = await fetchMarketData()
      setMarket(data)
      saveMarket(data)
    } catch (err) {
      console.warn('Market fetch failed, using cached data:', err)
    }
  }, [])

  useEffect(() => {
    refreshMarket()
  }, [refreshMarket])

  const loadFromWallet = useCallback(
    async (address: string) => {
      setLoading(true)
      setError(null)
      try {
        const [pos, mkt] = await Promise.all([fetchUserPosition(address), fetchMarketData()])
        setPosition(pos)
        setMarket(mkt)
        savePosition(pos)
        saveMarket(mkt)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load position')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const loadManual = useCallback(
    (collateralBtc: number, debtUsdc: number, btcPrice?: number) => {
      const price = btcPrice ?? market?.oraclePrice ?? settings.btcPriceOverride ?? 95000
      const pos: Position = {
        collateralBtc,
        debtUsdc,
        btcPrice: price,
        source: 'manual',
        updatedAt: Date.now(),
      }
      setPosition(pos)
      savePosition(pos)
      setError(null)
    },
    [market, settings.btcPriceOverride],
  )

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      saveSettings(next)
      return next
    })
  }, [])

  const clearPosition = useCallback(() => {
    setPosition(null)
    localStorage.removeItem('mba-position')
  }, [])

  const loadExample = useCallback(() => {
    loadManual(EXAMPLE_POSITION.collateralBtc, EXAMPLE_POSITION.debtUsdc, EXAMPLE_POSITION.btcPrice)
    setShowOnboarding(false)
    setOnboardingDone()
  }, [loadManual])

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false)
    setOnboardingDone()
  }, [])

  const value: AppContextValue = {
    position,
    market,
    settings,
    metrics,
    activeTab,
    loading,
    error,
    showOnboarding,
    setActiveTab,
    loadFromWallet,
    loadManual,
    refreshMarket,
    updateSettings,
    clearPosition,
    loadExample,
    dismissOnboarding,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}