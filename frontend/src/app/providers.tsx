'use client';

import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-wallet-adapter';
import { PontemWallet } from '@pontem/wallet-adapter-plugin';
import { MartianWallet } from '@martianwallet/wallet-adapter';
import { RiseWallet } from '@rise-wallet/wallet-adapter';
import { FewchaWallet } from 'fewcha-plugin-wallet-adapter';
import { Network } from '@aptos-labs/ts-sdk';

import { ThemeProvider } from './theme-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { SocketProvider } from '@/contexts/socket-context';
import { NotificationProvider } from '@/contexts/notification-context';

// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry for authentication errors
        if (error?.response?.status === 401) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

// Aptos wallet configuration
const wallets = [
  new PetraWallet(),
  new PontemWallet(),
  new MartianWallet(),
  new RiseWallet(),
  new FewchaWallet(),
];

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const aptosNetwork = process.env.NEXT_PUBLIC_APTOS_NETWORK === 'mainnet'
    ? Network.MAINNET
    : process.env.NEXT_PUBLIC_APTOS_NETWORK === 'testnet'
    ? Network.TESTNET
    : Network.DEVNET;

  return (
    <QueryClientProvider client={queryClient}>
      <AptosWalletAdapterProvider
        plugins={wallets}
        autoConnect={true}
        dappConfig={{
          network: aptosNetwork,
          aptosConnectDappId: 'carbon-offset-marketplace'
        }}
        onError={(error) => {
          console.error('Wallet connection error:', error);
        }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SocketProvider>
              <NotificationProvider>
                {children}

                {/* Development tools */}
                {process.env.NODE_ENV === 'development' && (
                  <ReactQueryDevtools
                    initialIsOpen={false}
                    position="bottom-right"
                  />
                )}
              </NotificationProvider>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </AptosWalletAdapterProvider>
    </QueryClientProvider>
  );
}