# 6. Frontend Development Guide

## Overview

This guide provides complete instructions for building the Carbon Offset Marketplace 2.0 frontend using React, Next.js, and TypeScript. The frontend provides an intuitive interface for companies to manage carbon credits, trade on the marketplace, and track environmental impact.

## 🏗️ Frontend Architecture

### Technology Stack

**Core Framework**
- **React 18**: Modern React with hooks and concurrent features
- **Next.js 14**: Full-stack React framework with App Router
- **TypeScript**: Type-safe development with strict mode
- **Tailwind CSS**: Utility-first CSS framework for styling

**State Management**
- **Zustand**: Lightweight state management
- **TanStack Query (React Query)**: Server state management and caching
- **React Hook Form**: Form handling with validation

**Blockchain Integration**
- **Aptos Wallet Adapter**: Official wallet connection library
- **@aptos-labs/ts-sdk**: Aptos blockchain SDK
- **Web3Modal**: Multi-wallet connection interface

**UI Components**
- **Radix UI**: Headless accessible components
- **Lucide React**: Modern icon library
- **Chart.js + react-chartjs-2**: Data visualization
- **Framer Motion**: Animation library

**Development Tools**
- **ESLint + Prettier**: Code linting and formatting
- **Husky**: Git hooks for code quality
- **Storybook**: Component documentation and testing

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth layout group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/       # Dashboard layout group
│   │   │   ├── credits/
│   │   │   ├── marketplace/
│   │   │   ├── portfolio/
│   │   │   ├── certificates/
│   │   │   └── analytics/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI components
│   │   ├── forms/            # Form components
│   │   ├── charts/           # Chart components
│   │   ├── marketplace/      # Marketplace specific
│   │   ├── wallet/           # Wallet integration
│   │   └── common/           # Common components
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useWallet.ts
│   │   ├── useMarketplace.ts
│   │   └── useIoT.ts
│   ├── lib/                  # Utilities and configurations
│   │   ├── api.ts           # API client
│   │   ├── auth.ts          # Auth utilities
│   │   ├── blockchain.ts    # Aptos utilities
│   │   ├── utils.ts         # General utilities
│   │   └── validations.ts   # Form validation schemas
│   ├── store/                # Global state management
│   │   ├── auth.store.ts
│   │   ├── marketplace.store.ts
│   │   └── ui.store.ts
│   ├── types/                # TypeScript type definitions
│   │   ├── api.types.ts
│   │   ├── blockchain.types.ts
│   │   └── ui.types.ts
│   └── styles/               # Global styles
├── public/                   # Static assets
├── stories/                  # Storybook stories
├── tests/                    # Test files
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## 🚀 Setting Up the Frontend

### Prerequisites

```bash
# Install Node.js 18+ and npm
node --version  # v18.0.0 or higher
npm --version   # 8.0.0 or higher

# Verify Aptos CLI installation (optional for development)
aptos --version
```

### Initial Setup

```bash
# Navigate to frontend directory
cd frontend

# Create Next.js project with TypeScript
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir

# Install additional dependencies
npm install @aptos-labs/wallet-adapter-react @aptos-labs/wallet-adapter-ant-design
npm install @aptos-labs/ts-sdk @aptos-labs/wallet-adapter-core
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install @hookform/resolvers react-hook-form zod
npm install zustand immer
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-toast @radix-ui/react-tabs
npm install lucide-react framer-motion
npm install chart.js react-chartjs-2
npm install axios date-fns clsx tailwind-merge

# Install development dependencies
npm install -D @types/node @storybook/react
npm install -D @storybook/addon-essentials @storybook/addon-docs
npm install -D husky lint-staged prettier
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D jest jest-environment-jsdom
```

### Environment Configuration

```typescript
// .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APTOS_NETWORK=devnet
NEXT_PUBLIC_APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com/v1
NEXT_PUBLIC_CONTRACT_ADDRESS=0x123...

# Optional
NEXT_PUBLIC_ENABLE_DEVTOOLS=true
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

## 🔗 Wallet Integration

### Wallet Provider Setup

```tsx
// src/components/wallet/WalletProvider.tsx
'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { MartianWallet } from '@martianwallet/wallet-adapter';
import { PontemWallet } from '@pontem/wallet-adapter';
import { Network } from '@aptos-labs/ts-sdk';
import { ReactNode } from 'react';

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const wallets = [
    new PetraWallet(),
    new MartianWallet(),
    new PontemWallet(),
  ];

  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={true}
      dappConfig={{
        network: Network.DEVNET,
        mizuwallet: {
          manifestURL: "https://assets.mizu.io/dapp-config.json",
        },
      }}
      onError={(error) => {
        console.error('Wallet connection error:', error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
```

### Wallet Connection Hook

```tsx
// src/hooks/useWallet.ts
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { useMemo } from 'react';

export function useWallet() {
  const {
    connect,
    disconnect,
    connected,
    wallet,
    account,
    signAndSubmitTransaction,
    signTransaction,
    signMessage
  } = useAptosWallet();

  const client = useMemo(() => {
    const config = new AptosConfig({
      network: process.env.NEXT_PUBLIC_APTOS_NETWORK as Network,
      nodeUrl: process.env.NEXT_PUBLIC_APTOS_NODE_URL
    });
    return new Aptos(config);
  }, []);

  const getAccountBalance = async (): Promise<number> => {
    if (!account?.address) return 0;

    try {
      const resources = await client.getAccountResources({
        accountAddress: account.address
      });

      const coinStore = resources.find(
        (r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
      );

      if (coinStore) {
        return parseInt((coinStore.data as any).coin.value);
      }
      return 0;
    } catch (error) {
      console.error('Error getting account balance:', error);
      return 0;
    }
  };

  const submitTransaction = async (payload: any) => {
    if (!account) throw new Error('Wallet not connected');

    try {
      const transaction = await client.transaction.build.simple({
        sender: account.address,
        data: payload
      });

      const response = await signAndSubmitTransaction({
        transaction,
        sender: account
      });

      const result = await client.waitForTransaction({
        transactionHash: response.hash
      });

      return result;
    } catch (error) {
      console.error('Transaction submission failed:', error);
      throw error;
    }
  };

  return {
    // Wallet state
    connected,
    wallet,
    account,
    client,

    // Wallet actions
    connect,
    disconnect,
    getAccountBalance,
    submitTransaction,
    signMessage,

    // Utilities
    formatAddress: (address: string) =>
      `${address.slice(0, 6)}...${address.slice(-4)}`,

    isDevnet: process.env.NEXT_PUBLIC_APTOS_NETWORK === 'devnet'
  };
}
```

### Wallet Connection Component

```tsx
// src/components/wallet/WalletButton.tsx
'use client';

import { Button } from '@/components/ui/Button';
import { useWallet } from '@/hooks/useWallet';
import { Wallet, Copy, ExternalLink, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/Toast';

export function WalletButton() {
  const { connected, account, connect, disconnect, getAccountBalance, formatAddress } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (connected && account) {
      loadBalance();
    }
  }, [connected, account]);

  const loadBalance = async () => {
    try {
      const accountBalance = await getAccountBalance();
      setBalance(accountBalance);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await connect();
      toast({
        title: 'Wallet Connected',
        description: 'Successfully connected to your wallet.',
      });
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect wallet. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setBalance(0);
      toast({
        title: 'Wallet Disconnected',
        description: 'Successfully disconnected your wallet.',
      });
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
      toast({
        title: 'Address Copied',
        description: 'Wallet address copied to clipboard.',
      });
    }
  };

  const openExplorer = () => {
    if (account?.address) {
      const explorerUrl = `https://explorer.aptoslabs.com/account/${account.address}?network=devnet`;
      window.open(explorerUrl, '_blank');
    }
  };

  if (!connected || !account) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          <div className="flex flex-col items-start">
            <span className="text-xs font-medium">
              {formatAddress(account.address)}
            </span>
            <span className="text-xs text-muted-foreground">
              {(balance / 100000000).toFixed(4)} APT
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={copyAddress}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openExplorer}>
          <ExternalLink className="h-4 w-4 mr-2" />
          View in Explorer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect} className="text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## 🛒 Credit Marketplace Interface

### Marketplace Store

```typescript
// src/store/marketplace.store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface CarbonCredit {
  id: number;
  projectId: string;
  projectName: string;
  vintage: number;
  methodology: string;
  amountTons: number;
  pricePerTon: number;
  verificationLevel: number;
  location: string;
  projectType: 'renewable' | 'forestry' | 'industrial' | 'agriculture';
  certifications: string[];
  iotDataQuality: number;
  seller: {
    id: string;
    name: string;
    reputation: number;
  };
}

interface MarketOrder {
  id: number;
  type: 'buy' | 'sell';
  pricePerTon: number;
  quantity: number;
  filled: number;
  status: 'open' | 'filled' | 'cancelled';
  timestamp: Date;
  user: string;
}

interface MarketplaceState {
  // Credits
  availableCredits: CarbonCredit[];
  selectedCredits: number[];
  creditFilters: {
    projectType: string[];
    vintage: [number, number];
    priceRange: [number, number];
    verificationLevel: number;
    location: string;
    methodology: string[];
  };

  // Orders
  buyOrders: MarketOrder[];
  sellOrders: MarketOrder[];
  myOrders: MarketOrder[];

  // UI State
  isLoading: boolean;
  viewMode: 'grid' | 'list';
  sortBy: 'price' | 'vintage' | 'quality' | 'reputation';
  sortDirection: 'asc' | 'desc';

  // Actions
  loadCredits: () => Promise<void>;
  loadOrders: () => Promise<void>;
  selectCredit: (creditId: number) => void;
  deselectCredit: (creditId: number) => void;
  clearSelection: () => void;
  updateFilters: (filters: Partial<MarketplaceState['creditFilters']>) => void;
  placeBuyOrder: (order: Omit<MarketOrder, 'id' | 'timestamp'>) => Promise<void>;
  placeSellOrder: (order: Omit<MarketOrder, 'id' | 'timestamp'>) => Promise<void>;
  cancelOrder: (orderId: number) => Promise<void>;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSortBy: (sortBy: MarketplaceState['sortBy']) => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;
}

export const useMarketplaceStore = create<MarketplaceState>()(
  immer((set, get) => ({
    // Initial state
    availableCredits: [],
    selectedCredits: [],
    creditFilters: {
      projectType: [],
      vintage: [2020, new Date().getFullYear()],
      priceRange: [0, 100],
      verificationLevel: 0,
      location: '',
      methodology: []
    },
    buyOrders: [],
    sellOrders: [],
    myOrders: [],
    isLoading: false,
    viewMode: 'grid',
    sortBy: 'price',
    sortDirection: 'asc',

    // Actions
    loadCredits: async () => {
      set((state) => {
        state.isLoading = true;
      });

      try {
        // API call to load credits
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/credits`);
        const credits = await response.json();

        set((state) => {
          state.availableCredits = credits;
          state.isLoading = false;
        });
      } catch (error) {
        console.error('Failed to load credits:', error);
        set((state) => {
          state.isLoading = false;
        });
      }
    },

    loadOrders: async () => {
      try {
        const [buyOrdersRes, sellOrdersRes, myOrdersRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/orders/buy`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/orders/sell`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/orders/my`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
        ]);

        const [buyOrders, sellOrders, myOrders] = await Promise.all([
          buyOrdersRes.json(),
          sellOrdersRes.json(),
          myOrdersRes.json()
        ]);

        set((state) => {
          state.buyOrders = buyOrders;
          state.sellOrders = sellOrders;
          state.myOrders = myOrders;
        });
      } catch (error) {
        console.error('Failed to load orders:', error);
      }
    },

    selectCredit: (creditId) => {
      set((state) => {
        if (!state.selectedCredits.includes(creditId)) {
          state.selectedCredits.push(creditId);
        }
      });
    },

    deselectCredit: (creditId) => {
      set((state) => {
        state.selectedCredits = state.selectedCredits.filter(id => id !== creditId);
      });
    },

    clearSelection: () => {
      set((state) => {
        state.selectedCredits = [];
      });
    },

    updateFilters: (filters) => {
      set((state) => {
        Object.assign(state.creditFilters, filters);
      });
    },

    placeBuyOrder: async (order) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/orders/buy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(order)
        });

        if (response.ok) {
          // Reload orders
          get().loadOrders();
        }
      } catch (error) {
        console.error('Failed to place buy order:', error);
        throw error;
      }
    },

    placeSellOrder: async (order) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/orders/sell`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(order)
        });

        if (response.ok) {
          // Reload orders
          get().loadOrders();
        }
      } catch (error) {
        console.error('Failed to place sell order:', error);
        throw error;
      }
    },

    cancelOrder: async (orderId) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/orders/${orderId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          get().loadOrders();
        }
      } catch (error) {
        console.error('Failed to cancel order:', error);
        throw error;
      }
    },

    setViewMode: (mode) => {
      set((state) => {
        state.viewMode = mode;
      });
    },

    setSortBy: (sortBy) => {
      set((state) => {
        state.sortBy = sortBy;
      });
    },

    setSortDirection: (direction) => {
      set((state) => {
        state.sortDirection = direction;
      });
    }
  }))
);
```

### Credit Card Component

```tsx
// src/components/marketplace/CreditCard.tsx
'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { MapPin, Leaf, Award, TrendingUp, Shield } from 'lucide-react';
import { CarbonCredit } from '@/types/marketplace.types';
import { useState } from 'react';

interface CreditCardProps {
  credit: CarbonCredit;
  isSelected: boolean;
  onSelect: (creditId: number) => void;
  onViewDetails: (creditId: number) => void;
  onBuyNow: (creditId: number) => void;
}

export function CreditCard({
  credit,
  isSelected,
  onSelect,
  onViewDetails,
  onBuyNow
}: CreditCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getProjectTypeIcon = (type: string) => {
    switch (type) {
      case 'renewable':
        return <TrendingUp className="h-4 w-4" />;
      case 'forestry':
        return <Leaf className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getProjectTypeColor = (type: string) => {
    switch (type) {
      case 'renewable':
        return 'bg-green-100 text-green-800';
      case 'forestry':
        return 'bg-emerald-100 text-emerald-800';
      case 'industrial':
        return 'bg-blue-100 text-blue-800';
      case 'agriculture':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getQualityBadge = (quality: number) => {
    if (quality >= 90) return { label: 'Excellent', color: 'bg-green-500' };
    if (quality >= 80) return { label: 'Very Good', color: 'bg-blue-500' };
    if (quality >= 70) return { label: 'Good', color: 'bg-yellow-500' };
    return { label: 'Fair', color: 'bg-orange-500' };
  };

  const qualityBadge = getQualityBadge(credit.iotDataQuality);

  const handleBuyNow = async () => {
    setIsLoading(true);
    try {
      await onBuyNow(credit.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className={`transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-green-500 shadow-lg' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-2">
              {credit.projectName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="h-3 w-3 text-gray-500" />
              <span className="text-sm text-gray-600">{credit.location}</span>
            </div>
          </div>
          <Badge
            className={`${getProjectTypeColor(credit.projectType)} border-0`}
          >
            {getProjectTypeIcon(credit.projectType)}
            <span className="ml-1 capitalize">{credit.projectType}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price and Amount */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-green-600">
              ${credit.pricePerTon}
            </p>
            <p className="text-sm text-gray-500">per ton CO₂e</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-medium">{credit.amountTons} tons</p>
            <p className="text-sm text-gray-500">available</p>
          </div>
        </div>

        {/* Quality Indicators */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${qualityBadge.color}`} />
            <span className="text-sm font-medium">{qualityBadge.label}</span>
            <span className="text-xs text-gray-500">({credit.iotDataQuality}%)</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="h-3 w-3 text-yellow-500" />
            <span className="text-sm">{credit.seller.reputation}/100</span>
          </div>
        </div>

        {/* Vintage and Methodology */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Vintage</p>
            <p className="font-medium">{credit.vintage}</p>
          </div>
          <div>
            <p className="text-gray-500">Methodology</p>
            <p className="font-medium line-clamp-1" title={credit.methodology}>
              {credit.methodology}
            </p>
          </div>
        </div>

        {/* Certifications */}
        {credit.certifications.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {credit.certifications.slice(0, 3).map((cert, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {cert}
              </Badge>
            ))}
            {credit.certifications.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{credit.certifications.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelect(credit.id)}
          className="flex-1"
        >
          {isSelected ? 'Selected' : 'Select'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(credit.id)}
          className="flex-1"
        >
          Details
        </Button>
        <Button
          size="sm"
          onClick={handleBuyNow}
          disabled={isLoading}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {isLoading ? 'Processing...' : 'Buy Now'}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Marketplace Filter Component

```tsx
// src/components/marketplace/MarketplaceFilters.tsx
'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { Slider } from '@/components/ui/Slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { X, Filter } from 'lucide-react';
import { useMarketplaceStore } from '@/store/marketplace.store';
import { useState, useEffect } from 'react';

export function MarketplaceFilters() {
  const { creditFilters, updateFilters } = useMarketplaceStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(creditFilters);

  useEffect(() => {
    setLocalFilters(creditFilters);
  }, [creditFilters]);

  const projectTypes = [
    { value: 'renewable', label: 'Renewable Energy' },
    { value: 'forestry', label: 'Forestry & Land Use' },
    { value: 'industrial', label: 'Industrial Processes' },
    { value: 'agriculture', label: 'Agriculture' }
  ];

  const methodologies = [
    { value: 'vcs', label: 'VCS (Verified Carbon Standard)' },
    { value: 'cdm', label: 'CDM (Clean Development Mechanism)' },
    { value: 'gold', label: 'Gold Standard' },
    { value: 'car', label: 'Climate Action Reserve' }
  ];

  const handleProjectTypeChange = (value: string, checked: boolean) => {
    const newProjectTypes = checked
      ? [...localFilters.projectType, value]
      : localFilters.projectType.filter(type => type !== value);

    setLocalFilters({
      ...localFilters,
      projectType: newProjectTypes
    });
  };

  const handleMethodologyChange = (value: string, checked: boolean) => {
    const newMethodologies = checked
      ? [...localFilters.methodology, value]
      : localFilters.methodology.filter(method => method !== value);

    setLocalFilters({
      ...localFilters,
      methodology: newMethodologies
    });
  };

  const applyFilters = () => {
    updateFilters(localFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      projectType: [],
      vintage: [2020, new Date().getFullYear()],
      priceRange: [0, 100],
      verificationLevel: 0,
      location: '',
      methodology: []
    };
    setLocalFilters(defaultFilters);
    updateFilters(defaultFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.projectType.length > 0) count++;
    if (localFilters.methodology.length > 0) count++;
    if (localFilters.location.trim() !== '') count++;
    if (localFilters.verificationLevel > 0) count++;
    if (localFilters.vintage[0] > 2020 || localFilters.vintage[1] < new Date().getFullYear()) count++;
    if (localFilters.priceRange[0] > 0 || localFilters.priceRange[1] < 100) count++;
    return count;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">{getActiveFilterCount()}</Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className={`space-y-6 ${!isExpanded ? 'hidden' : ''}`}>
        {/* Project Type */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Project Type</Label>
          <div className="space-y-2">
            {projectTypes.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={type.value}
                  checked={localFilters.projectType.includes(type.value)}
                  onCheckedChange={(checked) =>
                    handleProjectTypeChange(type.value, checked as boolean)
                  }
                />
                <Label htmlFor={type.value} className="text-sm">
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Vintage Range */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Vintage Year: {localFilters.vintage[0]} - {localFilters.vintage[1]}
          </Label>
          <Slider
            value={localFilters.vintage}
            onValueChange={(value) =>
              setLocalFilters({
                ...localFilters,
                vintage: value as [number, number]
              })
            }
            min={2010}
            max={new Date().getFullYear()}
            step={1}
            className="w-full"
          />
        </div>

        {/* Price Range */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Price Range: ${localFilters.priceRange[0]} - ${localFilters.priceRange[1]}
          </Label>
          <Slider
            value={localFilters.priceRange}
            onValueChange={(value) =>
              setLocalFilters({
                ...localFilters,
                priceRange: value as [number, number]
              })
            }
            min={0}
            max={200}
            step={5}
            className="w-full"
          />
        </div>

        {/* Location */}
        <div>
          <Label htmlFor="location" className="text-sm font-medium mb-2 block">
            Location
          </Label>
          <Input
            id="location"
            placeholder="Enter country or region..."
            value={localFilters.location}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                location: e.target.value
              })
            }
          />
        </div>

        {/* Verification Level */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Minimum IoT Data Quality: {localFilters.verificationLevel}%
          </Label>
          <Slider
            value={[localFilters.verificationLevel]}
            onValueChange={(value) =>
              setLocalFilters({
                ...localFilters,
                verificationLevel: value[0]
              })
            }
            min={0}
            max={100}
            step={10}
            className="w-full"
          />
        </div>

        {/* Methodology */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Methodology</Label>
          <div className="space-y-2">
            {methodologies.map((method) => (
              <div key={method.value} className="flex items-center space-x-2">
                <Checkbox
                  id={method.value}
                  checked={localFilters.methodology.includes(method.value)}
                  onCheckedChange={(checked) =>
                    handleMethodologyChange(method.value, checked as boolean)
                  }
                />
                <Label htmlFor={method.value} className="text-sm">
                  {method.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={applyFilters} className="flex-1">
            Apply Filters
          </Button>
          <Button variant="outline" onClick={resetFilters}>
            <X className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

## 📊 Emission Calculator Interface

### Emission Calculator Form

```tsx
// src/components/calculator/EmissionCalculatorForm.tsx
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Plus, Trash2, Calculator, FileText } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

const emissionCalculationSchema = z.object({
  reportingPeriod: z.object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required')
  }),
  energyData: z.object({
    electricity: z.number().min(0, 'Must be positive'),
    naturalGas: z.number().min(0, 'Must be positive'),
    fuel: z.number().min(0, 'Must be positive')
  }).optional(),
  transportationData: z.object({
    flights: z.array(z.object({
      origin: z.string().min(1, 'Origin is required'),
      destination: z.string().min(1, 'Destination is required'),
      class: z.enum(['economy', 'business', 'first']),
      passengers: z.number().min(1, 'Must have at least 1 passenger')
    })),
    vehicles: z.array(z.object({
      distance: z.number().min(0, 'Distance must be positive'),
      fuelType: z.enum(['gasoline', 'diesel', 'electric', 'hybrid']),
      vehicleType: z.enum(['car', 'truck', 'van', 'motorcycle'])
    })),
    shipping: z.array(z.object({
      distance: z.number().min(0, 'Distance must be positive'),
      weight: z.number().min(0, 'Weight must be positive'),
      method: z.enum(['road', 'rail', 'air', 'sea'])
    }))
  }).optional(),
  facilityData: z.object({
    buildingSize: z.number().min(0, 'Building size must be positive'),
    occupancy: z.number().min(0, 'Occupancy must be positive'),
    location: z.string().min(1, 'Location is required')
  }).optional(),
  productionData: z.object({
    materials: z.array(z.object({
      type: z.string().min(1, 'Material type is required'),
      quantity: z.number().min(0, 'Quantity must be positive'),
      unit: z.string().min(1, 'Unit is required')
    })),
    products: z.array(z.object({
      type: z.string().min(1, 'Product type is required'),
      quantity: z.number().min(0, 'Quantity must be positive')
    })),
    waste: z.array(z.object({
      type: z.string().min(1, 'Waste type is required'),
      quantity: z.number().min(0, 'Quantity must be positive'),
      disposal: z.enum(['landfill', 'incineration', 'recycling', 'composting'])
    }))
  }).optional()
});

type EmissionCalculationForm = z.infer<typeof emissionCalculationSchema>;

interface EmissionCalculatorFormProps {
  onCalculate: (data: EmissionCalculationForm) => Promise<void>;
  isLoading: boolean;
}

export function EmissionCalculatorForm({ onCalculate, isLoading }: EmissionCalculatorFormProps) {
  const [activeTab, setActiveTab] = useState('basic');

  const form = useForm<EmissionCalculationForm>({
    resolver: zodResolver(emissionCalculationSchema),
    defaultValues: {
      reportingPeriod: {
        startDate: '',
        endDate: ''
      },
      energyData: {
        electricity: 0,
        naturalGas: 0,
        fuel: 0
      },
      transportationData: {
        flights: [],
        vehicles: [],
        shipping: []
      },
      facilityData: {
        buildingSize: 0,
        occupancy: 0,
        location: ''
      },
      productionData: {
        materials: [],
        products: [],
        waste: []
      }
    }
  });

  const {
    fields: flightFields,
    append: appendFlight,
    remove: removeFlight
  } = useFieldArray({
    control: form.control,
    name: 'transportationData.flights'
  });

  const {
    fields: vehicleFields,
    append: appendVehicle,
    remove: removeVehicle
  } = useFieldArray({
    control: form.control,
    name: 'transportationData.vehicles'
  });

  const {
    fields: materialFields,
    append: appendMaterial,
    remove: removeMaterial
  } = useFieldArray({
    control: form.control,
    name: 'productionData.materials'
  });

  const onSubmit = async (data: EmissionCalculationForm) => {
    try {
      await onCalculate(data);
      toast({
        title: 'Calculation Complete',
        description: 'Your emission calculation has been processed successfully.',
      });
    } catch (error) {
      toast({
        title: 'Calculation Failed',
        description: 'Failed to calculate emissions. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Carbon Emission Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="energy">Energy</TabsTrigger>
              <TabsTrigger value="transport">Transport</TabsTrigger>
              <TabsTrigger value="production">Production</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Reporting Period Start</Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...form.register('reportingPeriod.startDate')}
                  />
                  {form.formState.errors.reportingPeriod?.startDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.reportingPeriod.startDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="endDate">Reporting Period End</Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...form.register('reportingPeriod.endDate')}
                  />
                  {form.formState.errors.reportingPeriod?.endDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.reportingPeriod.endDate.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="buildingSize">Building Size (sq ft)</Label>
                  <Input
                    id="buildingSize"
                    type="number"
                    placeholder="10000"
                    {...form.register('facilityData.buildingSize', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="occupancy">Occupancy (people)</Label>
                  <Input
                    id="occupancy"
                    type="number"
                    placeholder="50"
                    {...form.register('facilityData.occupancy', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="City, State"
                    {...form.register('facilityData.location')}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="energy" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="electricity">Electricity (kWh)</Label>
                  <Input
                    id="electricity"
                    type="number"
                    placeholder="10000"
                    {...form.register('energyData.electricity', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="naturalGas">Natural Gas (therms)</Label>
                  <Input
                    id="naturalGas"
                    type="number"
                    placeholder="500"
                    {...form.register('energyData.naturalGas', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="fuel">Fuel (gallons)</Label>
                  <Input
                    id="fuel"
                    type="number"
                    placeholder="1000"
                    {...form.register('energyData.fuel', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="transport" className="space-y-6">
              {/* Flights */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold">Flight Data</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendFlight({
                      origin: '',
                      destination: '',
                      class: 'economy',
                      passengers: 1
                    })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Flight
                  </Button>
                </div>

                <div className="space-y-3">
                  {flightFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-5 gap-2 items-end">
                      <Input
                        placeholder="Origin"
                        {...form.register(`transportationData.flights.${index}.origin`)}
                      />
                      <Input
                        placeholder="Destination"
                        {...form.register(`transportationData.flights.${index}.destination`)}
                      />
                      <select
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        {...form.register(`transportationData.flights.${index}.class`)}
                      >
                        <option value="economy">Economy</option>
                        <option value="business">Business</option>
                        <option value="first">First</option>
                      </select>
                      <Input
                        type="number"
                        placeholder="Passengers"
                        {...form.register(`transportationData.flights.${index}.passengers`, { valueAsNumber: true })}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFlight(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vehicles */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold">Vehicle Data</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendVehicle({
                      distance: 0,
                      fuelType: 'gasoline',
                      vehicleType: 'car'
                    })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Vehicle
                  </Button>
                </div>

                <div className="space-y-3">
                  {vehicleFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-4 gap-2 items-end">
                      <Input
                        type="number"
                        placeholder="Distance (miles)"
                        {...form.register(`transportationData.vehicles.${index}.distance`, { valueAsNumber: true })}
                      />
                      <select
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        {...form.register(`transportationData.vehicles.${index}.fuelType`)}
                      >
                        <option value="gasoline">Gasoline</option>
                        <option value="diesel">Diesel</option>
                        <option value="electric">Electric</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                      <select
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        {...form.register(`transportationData.vehicles.${index}.vehicleType`)}
                      >
                        <option value="car">Car</option>
                        <option value="truck">Truck</option>
                        <option value="van">Van</option>
                        <option value="motorcycle">Motorcycle</option>
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeVehicle(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="production" className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold">Materials Used</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendMaterial({
                      type: '',
                      quantity: 0,
                      unit: ''
                    })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Material
                  </Button>
                </div>

                <div className="space-y-3">
                  {materialFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-4 gap-2 items-end">
                      <Input
                        placeholder="Material type"
                        {...form.register(`productionData.materials.${index}.type`)}
                      />
                      <Input
                        type="number"
                        placeholder="Quantity"
                        {...form.register(`productionData.materials.${index}.quantity`, { valueAsNumber: true })}
                      />
                      <Input
                        placeholder="Unit"
                        {...form.register(`productionData.materials.${index}.unit`)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeMaterial(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? 'Calculating...' : (
            <>
              <Calculator className="h-4 w-4" />
              Calculate Emissions
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => form.reset()}
          disabled={isLoading}
        >
          Reset Form
        </Button>
      </div>
    </form>
  );
}
```

## 📡 IoT Verification Dashboard

### IoT Data Visualization

```tsx
// src/components/iot/IoTDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Thermometer,
  Zap,
  TreePine,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wifi,
  Battery
} from 'lucide-react';

interface SensorReading {
  timestamp: string;
  temperature: number;
  humidity: number;
  co2Reduced: number;
  energyOutput: number;
  airQuality: number;
}

interface SensorStatus {
  sensorId: string;
  status: 'online' | 'offline' | 'warning';
  lastSeen: string;
  batteryLevel: number;
  signalStrength: number;
  location: string;
  type: 'temperature' | 'energy' | 'air_quality' | 'environmental';
}

interface IoTDashboardProps {
  projectId: string;
}

export function IoTDashboard({ projectId }: IoTDashboardProps) {
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [sensorStatus, setSensorStatus] = useState<SensorStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    loadIoTData();
    loadSensorStatus();

    // Setup real-time updates
    const interval = setInterval(() => {
      loadIoTData();
      loadSensorStatus();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [projectId, timeRange]);

  const loadIoTData = async () => {
    try {
      const response = await fetch(
        `/api/iot/data/${projectId}?timeRange=${timeRange}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const data = await response.json();
      setSensorData(data);
    } catch (error) {
      console.error('Failed to load IoT data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSensorStatus = async () => {
    try {
      const response = await fetch(
        `/api/iot/sensors/${projectId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const data = await response.json();
      setSensorStatus(data);
    } catch (error) {
      console.error('Failed to load sensor status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'offline':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'offline':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate summary metrics
  const summaryMetrics = {
    totalCO2Reduced: sensorData.reduce((sum, reading) => sum + reading.co2Reduced, 0),
    totalEnergyGenerated: sensorData.reduce((sum, reading) => sum + reading.energyOutput, 0),
    averageTemperature: sensorData.length > 0
      ? sensorData.reduce((sum, reading) => sum + reading.temperature, 0) / sensorData.length
      : 0,
    onlineSensors: sensorStatus.filter(s => s.status === 'online').length,
    totalSensors: sensorStatus.length
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CO₂ Reduced</p>
                <p className="text-2xl font-bold text-green-600">
                  {summaryMetrics.totalCO2Reduced.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">tons this period</p>
              </div>
              <TreePine className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Energy Generated</p>
                <p className="text-2xl font-bold text-blue-600">
                  {summaryMetrics.totalEnergyGenerated.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">kWh this period</p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Temperature</p>
                <p className="text-2xl font-bold text-orange-600">
                  {summaryMetrics.averageTemperature.toFixed(1)}°C
                </p>
                <p className="text-xs text-gray-500">current period</p>
              </div>
              <Thermometer className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sensor Status</p>
                <p className="text-2xl font-bold text-purple-600">
                  {summaryMetrics.onlineSensors}/{summaryMetrics.totalSensors}
                </p>
                <p className="text-xs text-gray-500">sensors online</p>
              </div>
              <Wifi className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {['1h', '6h', '24h', '7d', '30d'].map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange(range)}
          >
            {range}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="charts">Data Charts</TabsTrigger>
          <TabsTrigger value="sensors">Sensor Status</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          {/* Environmental Data Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Temperature & Humidity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={sensorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis yAxisId="temp" orientation="left" />
                    <YAxis yAxisId="humidity" orientation="right" />
                    <Tooltip />
                    <Line
                      yAxisId="temp"
                      type="monotone"
                      dataKey="temperature"
                      stroke="#f97316"
                      strokeWidth={2}
                      name="Temperature (°C)"
                    />
                    <Line
                      yAxisId="humidity"
                      type="monotone"
                      dataKey="humidity"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Humidity (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CO₂ Reduction</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={sensorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="co2Reduced"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                      name="CO₂ Reduced (tons)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Energy Output</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sensorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="energyOutput"
                      fill="#3b82f6"
                      name="Energy Output (kWh)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Air Quality Index</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={sensorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="airQuality"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="Air Quality Index"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sensors" className="space-y-4">
          <div className="grid gap-4">
            {sensorStatus.map((sensor) => (
              <Card key={sensor.sensorId}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(sensor.status)}
                      <div>
                        <h3 className="font-medium">{sensor.sensorId}</h3>
                        <p className="text-sm text-gray-500">{sensor.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(sensor.status)}>
                        {sensor.status}
                      </Badge>

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Battery className="h-4 w-4" />
                        {sensor.batteryLevel}%
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Wifi className="h-4 w-4" />
                        {sensor.signalStrength}%
                      </div>

                      <div className="text-sm text-gray-500">
                        Last seen: {new Date(sensor.lastSeen).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts & System Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-800">Low Battery Warning</p>
                    <p className="text-sm text-yellow-700">Sensor ENV-001 battery level below 20%</p>
                    <p className="text-xs text-yellow-600">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800">Sensor Reconnected</p>
                    <p className="text-sm text-green-700">Sensor TEMP-003 is back online</p>
                    <p className="text-xs text-green-600">4 hours ago</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-800">Data Verification Complete</p>
                    <p className="text-sm text-blue-700">Hourly data successfully verified and stored on blockchain</p>
                    <p className="text-xs text-blue-600">1 hour ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

This comprehensive frontend guide provides:

1. **Complete wallet integration** with Aptos wallet adapter
2. **Sophisticated marketplace interface** with filtering and real-time updates
3. **Advanced emission calculator** with multi-step form validation
4. **Real-time IoT data visualization** with charts and sensor monitoring
5. **Modern UI components** built with Radix UI and Tailwind CSS
6. **Type-safe development** with TypeScript throughout
7. **State management** using Zustand for global state
8. **Responsive design** that works on all devices

The frontend provides an intuitive, professional interface that makes carbon credit management accessible to businesses while maintaining the technical sophistication required for blockchain and IoT integration.