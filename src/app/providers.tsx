'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './wagmi-config';
import { WalletProvider } from '@/contexts/WalletContext';
import { NetworkProvider } from '@/contexts/NetworkContext';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <NetworkProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </NetworkProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
