// src/wagmi.js
import { http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

export const config = getDefaultConfig({
  appName: "Base Dapp",
  projectId,
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: http("https://sepolia.base.org"),
    [base.id]: http("https://mainnet.base.org"),
  },
  ssr: false,
});

// Export chains if you want to reference them elsewhere (e.g., initialChain)
export { base, baseSepolia };
