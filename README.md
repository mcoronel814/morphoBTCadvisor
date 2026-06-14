# Morpho Bitcoin Advisor

A modern, installable PWA for tracking your Morpho cbBTC-USDC position on Base, managing LTV risk, and simulating long-term Bitcoin DeFi strategies — without selling your stack.

![Dark theme financial dashboard](public/favicon.svg)

## Features

- **Dashboard** — Circular LTV gauge, health factor, metric cards, live market data, position snapshots
- **Simulator** — Multi-scenario projections (Conservative / Balanced / Aggressive / No Leverage) with LTV trajectory charts
- **Advisor / Playbook** — Personalized monthly action plan based on your risk profile and cash flow
- **What-If Lab** — Real-time sliders for price changes, borrow, collateral, and debt repay
- **PWA** — Installable on mobile/desktop with offline support for calculators and cached position data
- **Wallet** — Optional RainbowKit connection on Base (read-only, no signing required)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Production Build

```bash
npm run build
npm run preview
```

## Connect Wallet on Base

1. Click **Connect Wallet** in the header
2. Select your wallet (MetaMask, Rainbow, etc.)
3. Switch to **Base** network when prompted
4. Your address auto-fills in the position loader — click **Load / Refresh Position**

No transactions are signed. The app only reads position data via the Morpho GraphQL API.

### Manual / No-Wallet Mode

Always available:

1. Go to **Dashboard → Load Position → Manual Input**
2. Enter cbBTC collateral, USDC debt, and optional BTC price override
3. Or paste any wallet address in the Wallet/Address tab

Data persists in `localStorage` between sessions.

## Market

This app targets the **cbBTC-USDC market on Base**:

- **Market ID**: `0x9103c3b4e834476c9a62ea009ba2c884ee42e94e6e314a26f04d312434191836`
- **Chain**: Base (8453)
- **LLTV**: 86%

## Key Formulas

```
LTV (%) = (borrowed USDC value / collateral cbBTC value in USDC) × 100

Health Factor = (collateral value in USDC × LLTV) / borrowed USDC value

HF > 1.0 = healthy
HF ≤ 1.0 = liquidatable
```

## Example GraphQL Queries

API endpoint: `https://api.morpho.org/graphql`

### Market Parameters

```graphql
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
```

Variables:
```json
{
  "marketId": "0x9103c3b4e834476c9a62ea009ba2c884ee42e94e6e314a26f04d312434191836",
  "chainId": 8453
}
```

### User Position by Address

```graphql
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
```

Variables:
```json
{
  "address": "0xYourAddressHere",
  "chainId": 8453,
  "marketKey": "0x9103c3b4e834476c9a62ea009ba2c884ee42e94e6e314a26f04d312434191836"
}
```

## Tech Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 + Radix UI primitives (shadcn-style)
- Recharts for visualizations
- Framer Motion for gauge animations
- Lucide React icons
- wagmi + viem + RainbowKit (Base network)
- vite-plugin-pwa for offline/install support

## Project Structure

```
src/
├── components/
│   ├── dashboard/     # LTV gauge, metrics, market panel, snapshots
│   ├── layout/        # Nav, header, disclaimers, education
│   └── ui/            # Reusable UI primitives
├── context/           # Global app state + localStorage persistence
├── lib/
│   ├── calculations.ts  # LTV, HF, optimization formulas
│   ├── morpho-api.ts    # GraphQL integration
│   ├── simulation.ts    # Long-term projection engine
│   ├── playbook.ts      # Advisor / monthly action generator
│   └── storage.ts       # localStorage helpers
├── views/             # Dashboard, Simulator, Advisor, Scenarios
└── providers/         # Wallet provider setup
```

## Extending

The codebase is modular for future features:

- **Mining rewards auto-tracking** — Add to `simulation.ts` and `playbook.ts` monthly loops
- **Multi-market support** — Extend `constants.ts` and `morpho-api.ts` with market selector
- **Alerts** — Hook into snapshot history and LTV threshold checks
- **WalletConnect Project ID** — Set a real ID in `src/config/wagmi.ts` for production

## Disclaimer

**Not financial advice.** DeFi involves smart contract risk, liquidation risk, oracle risk, and variable rates. Always DYOR.

## License

MIT