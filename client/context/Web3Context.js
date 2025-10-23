import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { SignClient } from '@walletconnect/sign-client';
import { WALLETCONNECT_PROJECT_ID } from '@env';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [session, setSession] = useState(null);
  const signClientRef = useRef(null);

  // Initialize SignClient
  useEffect(() => {
    initializeSignClient();
    loadSavedConnection();
  }, []);

  const initializeSignClient = async () => {
    try {
      const client = await SignClient.init({
        projectId: WALLETCONNECT_PROJECT_ID,
        metadata: {
          name: 'FitStake',
          description: 'Fitness Challenge DApp',
          url: 'https://fitstake.app',
          icons: ['https://fitstake.app/icon.png'],
        },
      });

      signClientRef.current = client;

      // Setup event listeners
      client.on('session_event', ({ event }) => {
        console.log('Session event:', event);
      });

      client.on('session_update', ({ topic, params }) => {
        console.log('Session update:', topic, params);
        const { namespaces } = params;
        const accounts = namespaces?.eip155?.accounts || [];
        if (accounts.length > 0) {
          const [, chainIdStr, address] = accounts[0].split(':');
          const newChainId = parseInt(chainIdStr);
          
          setAccount(address);
          setChainId(newChainId);
        }
      });

      client.on('session_delete', () => {
        console.log('Session deleted');
        disconnectWallet();
      });

      // Check for existing sessions
      const sessions = client.session.getAll();
      if (sessions.length > 0) {
        const lastSession = sessions[sessions.length - 1];
        setSession(lastSession);
        const accounts = lastSession.namespaces?.eip155?.accounts || [];
        if (accounts.length > 0) {
          const [, chainIdStr, address] = accounts[0].split(':');
          const existingChainId = parseInt(chainIdStr);
          
          setAccount(address);
          setChainId(existingChainId);
        }
      }
    } catch (error) {
      console.error('Failed to initialize SignClient:', error);
    }
  };

  const loadSavedConnection = async () => {
    try {
      const savedAccount = await AsyncStorage.getItem('walletAccount');
      const savedChainId = await AsyncStorage.getItem('chainId');
      
      if (savedAccount && !account) {
        setAccount(savedAccount);
      }
      if (savedChainId && !chainId) {
        setChainId(parseInt(savedChainId));
      }
    } catch (error) {
      console.error('Error loading saved connection:', error);
    }
  };

  const saveConnection = async (accountAddress, chain) => {
    try {
      await AsyncStorage.setItem('walletAccount', accountAddress);
      await AsyncStorage.setItem('chainId', chain.toString());
    } catch (error) {
      console.error('Error saving connection:', error);
    }
  };

  const connectWallet = async () => {
    if (!signClientRef.current) {
      throw new Error('SignClient not initialized');
    }

    setIsConnecting(true);
    try {
      const { uri, approval } = await signClientRef.current.connect({
        requiredNamespaces: {
          eip155: {
            methods: [
              'eth_sendTransaction',
              'eth_signTransaction',
              'eth_sign',
              'personal_sign',
              'eth_signTypedData',
              'wallet_switchEthereumChain',
              'wallet_addEthereumChain',
            ],
            // Allow both mainnet and Sepolia for initial connection
            chains: ['eip155:1', 'eip155:11155111'],
            events: ['chainChanged', 'accountsChanged'],
          },
        },
      });

      if (uri) {
        console.log('🔗 WalletConnect URI generated, opening wallet...');
        
        // Open MetaMask with WalletConnect URI
        const metamaskUrl = `metamask://wc?uri=${encodeURIComponent(uri)}`;
        
        // Try MetaMask deep link first
        const supported = await Linking.canOpenURL(metamaskUrl);
        if (supported) {
          console.log('✅ Opening MetaMask via deep link');
          await Linking.openURL(metamaskUrl);
        } else {
          // Fallback to universal link
          const universalLink = `https://metamask.app.link/wc?uri=${encodeURIComponent(uri)}`;
          console.log('✅ Opening MetaMask via universal link');
          await Linking.openURL(universalLink);
        }
      } else {
        console.error('❌ No WalletConnect URI generated');
        throw new Error('Failed to generate connection URI');
      }

      console.log('⏳ Waiting for wallet approval...');
      
      // Wait for session approval
      const approvedSession = await approval();
      console.log('✅ Wallet connection approved!');
      setSession(approvedSession);

      // Extract account and chain info
      const accounts = approvedSession.namespaces?.eip155?.accounts || [];
      console.log('📋 Accounts received:', accounts);
      
      if (accounts.length > 0) {
        const [, chainIdStr, address] = accounts[0].split(':');
        const chain = parseInt(chainIdStr);
        
        console.log('🔍 Connection details:', {
          address,
          chainId: chain,
          chainName: chain === 1 ? 'Mainnet' : chain === 11155111 ? 'Sepolia' : `Chain ${chain}`,
        });

        // Set account and chain (assuming it's always Sepolia)
        setAccount(address);
        setChainId(chain);
        await saveConnection(address, chain);

        return { address, chainId: chain };
      }

      throw new Error('No accounts found in session');
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      console.log('🔄 Disconnecting wallet...');
      
      if (signClientRef.current && session) {
        console.log('📤 Sending disconnect request to wallet...');
        await signClientRef.current.disconnect({
          topic: session.topic,
          reason: {
            code: 6000,
            message: 'User disconnected',
          },
        });
        console.log('✅ Wallet disconnect request sent');
      }
      
      console.log('🧹 Clearing local storage...');
      await AsyncStorage.removeItem('walletAccount');
      await AsyncStorage.removeItem('chainId');
      
      console.log('🔄 Clearing app state...');
      setAccount(null);
      setChainId(null);
      setSession(null);
      
      console.log('✅ Wallet disconnected successfully');
    } catch (error) {
      console.error('❌ Disconnect error:', error);
      // Clear state anyway
      console.log('🧹 Clearing state despite error...');
      setAccount(null);
      setChainId(null);
      setSession(null);
    }
  };

  const sendTransaction = async (transaction) => {
    if (!signClientRef.current || !session || !account) {
      throw new Error('Not connected');
    }

    try {
      const result = await signClientRef.current.request({
        topic: session.topic,
        chainId: `eip155:${chainId}`,
        request: {
          method: 'eth_sendTransaction',
          params: [transaction],
        },
      });
      return result;
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  };

  const signMessage = async (message) => {
    if (!signClientRef.current || !session || !account) {
      throw new Error('Not connected');
    }

    try {
      const result = await signClientRef.current.request({
        topic: session.topic,
        chainId: `eip155:${chainId}`,
        request: {
          method: 'personal_sign',
          params: [message, account],
        },
      });
      return result;
    } catch (error) {
      console.error('Sign message error:', error);
      throw error;
    }
  };

  const switchChain = async (targetChainId) => {
    if (!signClientRef.current || !session) {
      throw new Error('Not connected');
    }

    try {
      console.log(`🔄 Switching to chain ${targetChainId} (Sepolia)...`);
      
      // Add timeout to prevent hanging
      const switchPromise = signClientRef.current.request({
        topic: session.topic,
        chainId: `eip155:${chainId}`, // Use current chain for the request
        request: {
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        },
      });

      // Add 30 second timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Switch request timed out after 30 seconds')), 30000);
      });

      await Promise.race([switchPromise, timeoutPromise]);
      
      console.log(`✅ Successfully switched to chain ${targetChainId}`);
      setChainId(targetChainId);
      await AsyncStorage.setItem('chainId', targetChainId.toString());
    } catch (error) {
      console.error('❌ Switch chain error:', error);
      
      // If the chain doesn't exist, try to add it first
      if (error.message && (error.message.includes('4902') || error.message.includes('Unrecognized chain'))) {
        console.log('🔄 Chain not found, attempting to add Sepolia network...');
        try {
          const addPromise = signClientRef.current.request({
            topic: session.topic,
            chainId: `eip155:${chainId}`,
            request: {
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: 'Sepolia Test Network',
                rpcUrls: ['https://sepolia.infura.io/v3/fccd5042681c42b598675d08a67dbaa8'],
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              }],
            },
          });

          // Add timeout for add network request too
          const addTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Add network request timed out after 30 seconds')), 30000);
          });

          await Promise.race([addPromise, addTimeoutPromise]);
          console.log('✅ Sepolia network added successfully');
          setChainId(targetChainId);
          await AsyncStorage.setItem('chainId', targetChainId.toString());
        } catch (addError) {
          console.error('❌ Failed to add Sepolia network:', addError);
          throw new Error('Please manually add Sepolia testnet to your wallet and try again');
        }
      } else {
        throw error;
      }
    }
  };

  /**
   * Get a provider for reading blockchain data
   * Uses Infura RPC endpoint for Sepolia (matches MetaMask's built-in Sepolia)
   */
  const getProvider = () => {
    // For React Native, we use JsonRpcProvider with Infura endpoint
    return new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/fccd5042681c42b598675d08a67dbaa8');
  };

  /**
   * Get a signer for sending transactions
   * Uses WalletConnect session to create a signer
   */
  const getSigner = () => {
    if (!signClientRef.current || !session || !account) {
      throw new Error('Not connected to wallet');
    }

    // Create a custom signer that uses WalletConnect for signing
    const provider = getProvider();
    
    // Create a Wallet instance that wraps WalletConnect
    const walletConnectSigner = new ethers.JsonRpcSigner(provider, account);
    
    // Override sendTransaction to use WalletConnect
    const originalSendTransaction = walletConnectSigner.sendTransaction.bind(walletConnectSigner);
    walletConnectSigner.sendTransaction = async (transaction) => {
      // Use WalletConnect's sendTransaction
      const txHash = await sendTransaction(transaction);
      
      // Return a transaction response object
      return provider.getTransaction(txHash);
    };

    return walletConnectSigner;
  };

  /**
   * Get WalletConnect session info for direct contract calls
   */
  const getWalletConnectInfo = () => {
    if (!signClientRef.current || !session || !account) {
      throw new Error('Not connected to wallet');
    }
    
    return {
      signClient: signClientRef.current,
      session,
      account,
      chainId
    };
  };

  const value = {
    account,
    chainId,
    isConnecting,
    isConnected: !!account,
    connectWallet,
    disconnectWallet,
    switchChain,
    sendTransaction,
    signMessage,
    getProvider,
    getSigner,
    getWalletConnectInfo,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
