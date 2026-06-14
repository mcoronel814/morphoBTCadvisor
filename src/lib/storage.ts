import { RISK_PROFILES, STORAGE_KEYS } from './constants'
import { normalizeLltv } from './morpho-api'
import type {
  MarketData,
  Playbook,
  Position,
  Snapshot,
  UserSettings,
} from './types'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export const defaultSettings: UserSettings = {
  riskProfile: 'balanced',
  targetLtv: RISK_PROFILES.balanced.targetLtv,
  rebalanceThreshold: RISK_PROFILES.balanced.rebalanceThreshold,
  crashResilience: RISK_PROFILES.balanced.crashResilience,
  btcCagr: 0.5,
  monthlyIncome: 8000,
  monthlyExpenses: 5000,
  monthlyMinedBtc: 0.01,
  includeMinedBtc: false,
  timeHorizonYears: 5,
  simulationMode: 'cagr',
}

export function loadPosition(): Position | null {
  return load<Position | null>(STORAGE_KEYS.position, null)
}

export function savePosition(position: Position): void {
  save(STORAGE_KEYS.position, position)
}

export function loadMarket(): MarketData | null {
  const market = load<MarketData | null>(STORAGE_KEYS.market, null)
  if (!market) return null
  const normalized = { ...market, lltv: normalizeLltv(market.lltv) }
  if (normalized.lltv !== market.lltv) saveMarket(normalized)
  return normalized
}

export function saveMarket(market: MarketData): void {
  save(STORAGE_KEYS.market, market)
}

export function loadSnapshots(): Snapshot[] {
  return load<Snapshot[]>(STORAGE_KEYS.snapshots, [])
}

export function saveSnapshot(snapshot: Snapshot): void {
  const snapshots = loadSnapshots()
  snapshots.unshift(snapshot)
  save(STORAGE_KEYS.snapshots, snapshots.slice(0, 100))
}

export function loadSettings(): UserSettings {
  return { ...defaultSettings, ...load(STORAGE_KEYS.settings, {}) }
}

export function saveSettings(settings: UserSettings): void {
  save(STORAGE_KEYS.settings, settings)
}

export function loadPlaybooks(): Playbook[] {
  return load<Playbook[]>(STORAGE_KEYS.playbook, [])
}

export function savePlaybook(playbook: Playbook): void {
  const playbooks = loadPlaybooks()
  playbooks.unshift(playbook)
  save(STORAGE_KEYS.playbook, playbooks.slice(0, 20))
}

export function isOnboardingDone(): boolean {
  return load(STORAGE_KEYS.onboarding, false)
}

export function setOnboardingDone(): void {
  save(STORAGE_KEYS.onboarding, true)
}