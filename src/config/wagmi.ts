import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'

// Free project ID from https://cloud.walletconnect.com — set in .env for production
const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? 'YOUR_WALLETCONNECT_PROJECT_ID'

export const wagmiConfig = getDefaultConfig({
  appName: 'Morpho Bitcoin Advisor',
  projectId,
  chains: [base],
  ssr: false,
})