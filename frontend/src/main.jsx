import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { WagmiProvider, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@rainbow-me/rainbowkit/styles.css'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

const config = getDefaultConfig({
  appName: 'Base Dapp',
  projectId,
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org'),
    [base.id]:       http('https://mainnet.base.org'),
  },
  ssr: false,
})


const queryClient = new QueryClient()



createRoot(document.getElementById('root')).render(
 <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()} initialChain={baseSepolia}>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
)
