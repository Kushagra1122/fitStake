// Type declarations for Hardhat viem plugin
import 'hardhat/types/runtime';
import type { GetContractReturnType, PublicClient, WalletClient } from 'viem';

declare module 'hardhat/types/runtime' {
  interface NetworkConnection<T extends string = string> {
    viem: {
      getPublicClient: () => Promise<PublicClient>;
      getWalletClients: () => Promise<WalletClient[]>;
      deployContract: (name: string, args?: any[]) => Promise<any>;
      getContractAt: (name: string, address: string) => Promise<any>;
      assertions: any;
      test: any;
    };
  }
}

