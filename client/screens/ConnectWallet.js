import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity, ActivityIndicator, Alert, Animated, Dimensions } from 'react-native';
import { useWeb3 } from '../context/Web3Context';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ConnectWallet() {
  const { account, chainId, isConnecting, connectWallet, disconnectWallet, isConnected } = useWeb3();
  const navigation = useNavigation();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleConnect = async () => {
    try {
      await connectWallet();
      Alert.alert('Success! 🎉', 'Wallet connected successfully!', [{ text: 'OK' }]);
    } catch (error) {
      Alert.alert('Connection Failed', error.message || 'Failed to connect wallet. Please try again.', [
        { text: 'OK' }
      ]);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Wallet?',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectWallet();
              Alert.alert('Disconnected', 'Wallet disconnected successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect wallet');
            }
          },
        },
      ]
    );
  };

  const handleContinue = () => {
    navigation.navigate('Home');
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

  const getChainColor = (id) => {
    const colors = {
      1: '#627EEA',
      11155111: '#7B3FE4',
      137: '#8247E5',
      10: '#FF0420',
    };
    return colors[id] || '#6366F1';
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <View className="flex-1 items-center justify-center px-6">
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            width: width - 48,
            maxWidth: 400,
          }}
        >
          {/* Header Section */}
          <View className="mb-10 items-center">
            <View className="bg-white/20 backdrop-blur-xl rounded-full p-6 mb-6 shadow-lg">
              <Text className="text-6xl">💪</Text>
            </View>
            <Text className="text-5xl font-black text-white mb-3 text-center tracking-tight">
              FitStake
            </Text>
            <Text className="text-white/90 text-center text-lg font-semibold mb-2">
              Stake your crypto, commit to fitness
            </Text>
            <Text className="text-white/70 text-center text-sm">
              Connect your wallet to get started
            </Text>
          </View>

          {/* Wallet Connection Section */}
          {isConnected && account ? (
            <View className="w-full">
              {/* Connected Card */}
              <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl mb-4">
                <View className="flex-row items-center justify-between mb-5">
                  <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                    Connected Wallet
                  </Text>
                  <View className="bg-green-500/20 px-3 py-1.5 rounded-full border border-green-500/30">
                    <Text className="text-green-700 text-xs font-bold">● Active</Text>
                  </View>
                </View>
                
                <View className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-2xl mb-4">
                  <Text className="text-gray-500 text-xs mb-2 font-semibold uppercase tracking-wide">Address</Text>
                  <Text className="text-gray-900 font-black text-2xl tracking-wider">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </Text>
                </View>

                {chainId && (
                  <View className="flex-row items-center bg-gray-50 p-4 rounded-2xl">
                    <View 
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: getChainColor(chainId) }}
                    />
                    <View className="flex-1">
                      <Text className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">Network</Text>
                      <Text className="text-gray-900 font-bold text-base">
                        {getChainName(chainId)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                className="bg-white px-8 py-5 rounded-2xl shadow-2xl mb-3"
                onPress={handleContinue}
                activeOpacity={0.8}
              >
                <Text className="text-purple-600 font-black text-lg text-center tracking-wide">
                  Continue to App →
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-white/20 backdrop-blur-xl px-8 py-4 rounded-2xl border border-white/30"
                onPress={handleDisconnect}
                activeOpacity={0.7}
              >
                <Text className="text-white font-bold text-base text-center">
                  Disconnect Wallet
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="w-full">
              {/* Features List */}
              <View className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 mb-6 border border-white/20">
                <FeatureItem icon="🏃" text="Create fitness challenges" />
                <FeatureItem icon="💰" text="Stake crypto on your goals" />
                <FeatureItem icon="🔗" text="Connect with Strava" />
                <FeatureItem icon="🏆" text="Earn rewards for completing" />
              </View>

              {/* Connect Button */}
              <TouchableOpacity
                className="bg-white px-8 py-5 rounded-2xl shadow-2xl mb-3"
                onPress={handleConnect}
                disabled={isConnecting}
                activeOpacity={0.9}
              >
                {isConnecting ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator color="#667eea" size="small" />
                    <Text className="text-purple-600 font-black text-lg ml-3">
                      Connecting...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-purple-600 font-black text-lg text-center tracking-wide">
                    Connect Wallet
                  </Text>
                )}
              </TouchableOpacity>

              <Text className="text-white/60 text-center text-xs">
                Supports MetaMask & WalletConnect
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
      <StatusBar style="light" />
    </LinearGradient>
  );
}

function FeatureItem({ icon, text }) {
  return (
    <View className="flex-row items-center mb-4 last:mb-0">
      <View className="bg-white/10 w-10 h-10 rounded-xl items-center justify-center mr-3">
        <Text className="text-2xl">{icon}</Text>
      </View>
      <Text className="text-white font-semibold text-base flex-1">{text}</Text>
    </View>
  );
}