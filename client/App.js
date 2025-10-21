import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Web3Provider, useWeb3 } from './context/Web3Context';

function WalletScreen() {
  const { account, chainId, isConnecting, connectWallet, disconnectWallet } = useWeb3();

  const handleConnect = async () => {
    try {
      await connectWallet();
      Alert.alert('Success', 'Wallet connected successfully!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to connect wallet');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      Alert.alert('Disconnected', 'Wallet disconnected successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to disconnect wallet');
    }
  };

  const getChainName = (id) => {
    const chains = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      137: 'Polygon',
      10: 'Optimism',
    };
    return chains[id] || `Chain ID: ${id}`;
  };

  return (
    <View className="flex-1 bg-gray-100 items-center justify-center px-6">
      <Text className="text-3xl font-extrabold text-gray-900 mb-4 text-center">
        Welcome to FitStake
      </Text>
      <Text className="text-gray-600 text-center mb-8">
        Connect your wallet to start interacting with your decentralized app.
      </Text>

      {account ? (
        <View className="w-full max-w-md">
          <View className="bg-white p-6 rounded-2xl shadow-lg mb-4">
            <Text className="text-gray-500 text-sm mb-2">Connected Account</Text>
            <Text className="text-gray-900 font-bold text-lg mb-4">
              {account.slice(0, 6)}...{account.slice(-4)}
            </Text>
            
            {chainId && (
              <>
                <Text className="text-gray-500 text-sm mb-2">Network</Text>
                <Text className="text-gray-900 font-semibold">
                  {getChainName(chainId)}
                </Text>
              </>
            )}
          </View>

          <TouchableOpacity
            className="bg-red-500 px-8 py-4 rounded-2xl shadow-lg"
            onPress={handleDisconnect}
          >
            <Text className="text-white font-bold text-lg text-center">
              Disconnect Wallet
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          className="bg-purple-600 px-8 py-4 rounded-2xl shadow-lg"
          onPress={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              Connect Wallet
            </Text>
          )}
        </TouchableOpacity>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <Web3Provider>
      <WalletScreen />
    </Web3Provider>
  );
}
