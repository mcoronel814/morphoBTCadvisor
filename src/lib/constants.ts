export const MORPHO_GRAPHQL_URL = 'https://api.morpho.org/graphql'

export const BASE_CHAIN_ID = 8453

export const MARKET_UNIQUE_KEY =
  '0x9103c3b4e834476c9a62ea009ba2c884ee42e94e6e314a26f04d312434191836'

export const MARKET_ID = MARKET_UNIQUE_KEY

export const LLTV = 0.86

export const CBBTC_DECIMALS = 8
export const USDC_DECIMALS = 6

export const LTV_ZONES = {
  safe: 50,
  caution: 70,
  danger: 80,
} as const

export const BTC_CAGR_PRESETS = {
  conservative: 0.3,
  moderate: 0.5,
  bull: 0.8,
} as const

export const RISK_PROFILES = {
  safe: {
    label: 'Safe',
    targetLtv: 35,
    rebalanceThreshold: 45,
    crashResilience: 0.4,
    description: 'Maximum safety buffer. Low LTV, high crash tolerance.',
  },
  balanced: {
    label: 'Balanced',
    targetLtv: 50,
    rebalanceThreshold: 60,
    crashResilience: 0.3,
    description: 'Moderate leverage with reasonable safety margins.',
  },
  aggressive: {
    label: 'Aggressive',
    targetLtv: 65,
    rebalanceThreshold: 72,
    crashResilience: 0.2,
    description: 'Higher leverage while staying below liquidation threshold.',
  },
} as const

export const EXAMPLE_POSITION = {
  collateralBtc: 0.5,
  debtUsdc: 25000,
  btcPrice: 95000,
} as const

export const STORAGE_KEYS = {
  position: 'mba-position',
  market: 'mba-market',
  settings: 'mba-settings',
  playbook: 'mba-playbook',
  onboarding: 'mba-onboarding-done',
} as const