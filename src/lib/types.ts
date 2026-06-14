export interface Position {
  collateralBtc: number
  debtUsdc: number
  btcPrice: number
  address?: string
  source: 'wallet' | 'manual' | 'api'
  updatedAt: number
}

export interface MarketData {
  lltv: number
  borrowApy: number
  utilization: number
  supplyAssetsUsd: number
  borrowAssetsUsd: number
  collateralAssetsUsd: number
  oraclePrice: number
  updatedAt: number
}

export interface PositionMetrics {
  collateralUsd: number
  debtUsd: number
  ltv: number
  healthFactor: number
  borrowPowerAvailable: number
  monthlyInterest: number
  distanceToLiquidation: number
  isHealthy: boolean
}

export interface Snapshot {
  id: string
  timestamp: number
  collateralBtc: number
  debtUsdc: number
  btcPrice: number
  ltv: number
  healthFactor: number
  borrowApy: number
}

export type RiskProfile = 'safe' | 'balanced' | 'aggressive'

export type SimulationMode = 'cagr' | 'power-law'

export interface UserSettings {
  riskProfile: RiskProfile
  targetLtv: number
  rebalanceThreshold: number
  crashResilience: number
  btcCagr: number
  borrowApyOverride?: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyMinedBtc: number
  includeMinedBtc: boolean
  timeHorizonYears: number
  btcPriceOverride?: number
  simulationMode: SimulationMode
}

export interface SimulationMonth {
  month: number
  btcPrice: number
  collateralBtc: number
  debtUsdc: number
  ltv: number
  healthFactor: number
  interestPaid: number
  cumulativeInterest: number
  netEquity: number
}

export interface SimulationScenario {
  name: string
  color: string
  months: SimulationMonth[]
  finalBtc: number
  finalEquity: number
  totalInterest: number
}

export interface PlaybookMonth {
  month: number
  borrowNeeded: number
  collateralToAdd: number
  repayAmount: number
  projectedLtv: number
  projectedHf: number
  action: string
  notes: string
}

export interface Playbook {
  id: string
  createdAt: number
  riskProfile: RiskProfile
  months: PlaybookMonth[]
  recommendation: string
}

export interface WhatIfState {
  btcPriceChange: number
  additionalBorrow: number
  additionalCollateral: number
  debtRepay: number
}

export type TabId = 'dashboard' | 'simulator' | 'advisor' | 'scenarios'