import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { NETWORK_CONFIGS } from '@/lib/contracts';

export const config = createConfig({
  chains: [
    {
      id: NETWORK_CONFIGS.testnet.chainId,
      name: NETWORK_CONFIGS.testnet.name,
      nativeCurrency: NETWORK_CONFIGS.testnet.nativeCurrency,
      rpcUrls: {
        default: {
          http: [NETWORK_CONFIGS.testnet.rpcUrl],
        },
      },
      blockExplorers: {
        default: {
          name: 'CrossFi Scan',
          url: NETWORK_CONFIGS.testnet.explorerUrl,
        },
      },
    },
    {
      id: NETWORK_CONFIGS.mainnet.chainId,
      name: NETWORK_CONFIGS.mainnet.name,
      nativeCurrency: NETWORK_CONFIGS.mainnet.nativeCurrency,
      rpcUrls: {
        default: {
          http: [NETWORK_CONFIGS.mainnet.rpcUrl],
        },
      },
      blockExplorers: {
        default: {
          name: 'CrossFi Scan',
          url: NETWORK_CONFIGS.mainnet.explorerUrl,
        },
      },
    },
  ],
  connectors: [injected()],
  transports: {
    [NETWORK_CONFIGS.testnet.chainId]: http(),
    [NETWORK_CONFIGS.mainnet.chainId]: http(),
  },
  ssr: true,
});
