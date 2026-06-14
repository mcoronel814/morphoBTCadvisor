import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'

export const wagmiConfig = getDefaultConfig({
  appName: 'Morpho Bitcoin Advisor',
  projectId: 'morpho-btc-advisor-demo',
  chains: [base],
  ssr: false,
})