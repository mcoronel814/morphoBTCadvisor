import { BASE_CHAIN_ID, LLTV, MARKET_UNIQUE_KEY, MORPHO_GRAPHQL_URL } from './constants'
import type { MarketData, Position } from './types'

const WAD = 1e18

/**
 * Morpho returns LLTV as a WAD-scaled integer string (e.g. "860000000000000000" = 0.86).
 * Normalize to a decimal ratio for all calculations and display.
 */
export function normalizeLltv(raw: string | number): number {
  const n = typeof raw === 'string' ? Number(raw) : raw
  if (!Number.isFinite(n) || n <= 0) return LLTV
  if (n > 1) return n / WAD
  return n
}

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

async function graphqlQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(MORPHO_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`Morpho API error: ${response.status} ${response.statusText}`)
  }

  const json: GraphQLResponse<T> = await response.json()

  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join(', '))
  }

  if (!json.data) {
    throw new Error('No data returned from Morpho API')
  }

  return json.data
}

/**
 * Example: Fetch market params for cbBTC-USDC on Base
 *
 * query MarketData($marketId: String!, $chainId: Int!) {
 *   marketById(marketId: $marketId, chainId: $chainId) {
 *     lltv
 *     loanAsset { symbol decimals }
 *     collateralAsset { symbol decimals }
 *     state {
 *       borrowApy
 *       utilization
 *       supplyAssetsUsd
 *       borrowAssetsUsd
 *       collateralAssetsUsd
 *     }
 *   }
 * }
 */
const MARKET_QUERY = `
  query MarketData($marketId: String!, $chainId: Int!) {
    marketById(marketId: $marketId, chainId: $chainId) {
      lltv
      loanAsset { symbol decimals }
      collateralAsset { symbol decimals }
      state {
        borrowApy
        avgBorrowApy
        utilization
        supplyAssetsUsd
        borrowAssetsUsd
        collateralAssetsUsd
      }
    }
  }
`

/**
 * Example: Fetch user position by address
 *
 * query UserPosition($address: String!, $chainId: Int!, $marketKey: String!) {
 *   userByAddress(chainId: $chainId, address: $address) {
 *     marketPositions(where: { marketUniqueKey_in: [$marketKey] }) {
 *       state {
 *         collateral
 *         borrowAssets
 *         borrowAssetsUsd
 *         collateralUsd
 *       }
 *       market {
 *         collateralAsset { decimals }
 *         loanAsset { decimals }
 *       }
 *     }
 *   }
 * }
 */
const POSITION_QUERY = `
  query UserPosition($address: String!, $chainId: Int!, $marketKey: String!) {
    userByAddress(chainId: $chainId, address: $address) {
      marketPositions(where: { marketUniqueKey_in: [$marketKey] }) {
        state {
          collateral
          borrowAssets
          borrowAssetsUsd
          collateralUsd
        }
        market {
          collateralAsset { decimals }
          loanAsset { decimals }
        }
      }
    }
  }
`

const CBBTC_PRICE_QUERY = `
  query CbBtcPrice($chainId: Int!) {
    assets(where: { symbol_in: ["cbBTC", "BTC"], chainId_in: [$chainId] }, first: 5) {
      items {
        symbol
        price { usd timestamp }
      }
    }
  }
`

interface MarketQueryResult {
  marketById: {
    lltv: string | number
    state: {
      borrowApy: number
      avgBorrowApy: number
      utilization: number
      supplyAssetsUsd: number
      borrowAssetsUsd: number
      collateralAssetsUsd: number
    }
  } | null
}

interface PositionQueryResult {
  userByAddress: {
    marketPositions: Array<{
      state: {
        collateral: string
        borrowAssets: string
        borrowAssetsUsd: number
        collateralUsd: number
      }
      market: {
        collateralAsset: { decimals: number }
        loanAsset: { decimals: number }
      }
    }>
  } | null
}

interface PriceQueryResult {
  assets: {
    items: Array<{
      symbol: string
      price: { usd: number; timestamp: number } | null
    }>
  }
}

function fromWei(value: string, decimals: number): number {
  return Number(value) / 10 ** decimals
}

export async function fetchMarketData(): Promise<MarketData> {
  const data = await graphqlQuery<MarketQueryResult>(MARKET_QUERY, {
    marketId: MARKET_UNIQUE_KEY,
    chainId: BASE_CHAIN_ID,
  })

  const market = data.marketById
  if (!market) {
    throw new Error('Market not found on Base network')
  }

  let oraclePrice = 0
  try {
    const priceData = await graphqlQuery<PriceQueryResult>(CBBTC_PRICE_QUERY, {
      chainId: BASE_CHAIN_ID,
    })
    const cbBtc = priceData.assets.items.find(
      (a) => a.symbol === 'cbBTC' || a.symbol === 'BTC',
    )
    oraclePrice = cbBtc?.price?.usd ?? 0
  } catch {
    oraclePrice = 0
  }

  return {
    lltv: normalizeLltv(market.lltv),
    borrowApy: market.state.avgBorrowApy ?? market.state.borrowApy,
    utilization: market.state.utilization,
    supplyAssetsUsd: market.state.supplyAssetsUsd,
    borrowAssetsUsd: market.state.borrowAssetsUsd,
    collateralAssetsUsd: market.state.collateralAssetsUsd,
    oraclePrice,
    updatedAt: Date.now(),
  }
}

export async function fetchUserPosition(address: string): Promise<Position> {
  const [positionData, marketData] = await Promise.all([
    graphqlQuery<PositionQueryResult>(POSITION_QUERY, {
      address,
      chainId: BASE_CHAIN_ID,
      marketKey: MARKET_UNIQUE_KEY,
    }),
    fetchMarketData(),
  ])

  const user = positionData.userByAddress
  if (!user?.marketPositions?.length) {
    throw new Error('No position found for this address in the cbBTC-USDC market')
  }

  const pos = user.marketPositions[0]
  const collateralDecimals = pos.market.collateralAsset.decimals
  const loanDecimals = pos.market.loanAsset.decimals

  const collateralBtc = fromWei(pos.state.collateral, collateralDecimals)
  const debtUsdc = fromWei(pos.state.borrowAssets, loanDecimals)
  const btcPrice =
    collateralBtc > 0
      ? pos.state.collateralUsd / collateralBtc
      : marketData.oraclePrice

  return {
    collateralBtc,
    debtUsdc,
    btcPrice: btcPrice || marketData.oraclePrice,
    address,
    source: 'api',
    updatedAt: Date.now(),
  }
}

export async function fetchBtcPrice(): Promise<number> {
  try {
    const data = await graphqlQuery<PriceQueryResult>(CBBTC_PRICE_QUERY, {
      chainId: BASE_CHAIN_ID,
    })
    const cbBtc = data.assets.items.find((a) => a.symbol === 'cbBTC' || a.symbol === 'BTC')
    return cbBtc?.price?.usd ?? 0
  } catch {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    )
    if (response.ok) {
      const json = await response.json()
      return json.bitcoin?.usd ?? 0
    }
    return 0
  }
}