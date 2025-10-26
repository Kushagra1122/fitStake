import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity, Alert, Animated, Dimensions, Image } from 'react-native';
import { useWeb3 } from '../context/Web3Context';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function ConnectWallet() {
  const { account, chainId, isConnecting, connectWallet, disconnectWallet, isConnected } = useWeb3();
  const navigation = useNavigation();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

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
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
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

  const glowInterpolate = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0px 0px 0px rgba(139, 92, 246, 0.1)', '0px 0px 30px rgba(139, 92, 246, 0.4)'],
  });

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Minimal Header */}
      <View className="bg-white pt-16 pb-4 px-6">
        <View className="flex-row items-center justify-center">
          <View className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg items-center justify-center mr-2">
            <Text className="text-white font-bold text-sm">F</Text>
          </View>
          <Text className="text-gray-900 font-bold text-xl">FitStake</Text>
        </View>
      </View>

      <View className="flex-1">
        {/* Animated Background Gradient */}
        <Animated.View 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 235, 238, 0.4)',
            opacity: fadeAnim,
          }}
        />
        
        <View className="flex-1 px-6 pt-4">
          <Animated.View 
            style={{ 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
            }}
          >
            {/* Loading State */}
            {isConnecting ? (
              <View className="items-center justify-center py-20">
                <Image 
                  source={require('../assets/main_loading.gif')}
                  style={{ width: 200, height: 200 }}
                  resizeMode="contain"
                />
                <Text className="text-gray-600 text-base font-semibold mt-4">
                  Connecting...
                </Text>
              </View>
            ) : isConnected && account ? (
              <View className="w-full">
                {/* Connected State */}
                <Animated.View 
                  style={{ shadowOffset: { width: 0, height: 10 }, shadowRadius: 20, shadowOpacity: 0.1, elevation: 10 }}
                  className="bg-white rounded-3xl p-7 mb-6 border border-gray-100"
                >
                  <View className="flex-row items-center justify-between mb-6">
                    <Text className="text-gray-700 text-xs font-semibold uppercase tracking-wider">
                      Connected Wallet
                    </Text>
                    <View className="bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                      <View className="flex-row items-center">
                        <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        <Text className="text-green-700 text-xs font-semibold">Connected</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-2xl mb-6 border border-purple-100">
                    <Text className="text-gray-500 text-xs mb-2 font-semibold uppercase tracking-wide">Address</Text>
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center mr-3 border border-purple-200">
                        <Ionicons name="wallet" size={16} color="#7C3AED" />
                      </View>
                      <Text className="text-gray-900 font-black text-2xl tracking-wider">
                        {account.slice(0, 6)}...{account.slice(-4)}
                      </Text>
                    </View>
                  </View>

                  {chainId && (
                    <View className="flex-row items-center bg-gray-50 p-4 rounded-2xl border border-gray-200">
                      <View 
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: getChainColor(chainId) }}
                      />
                      <View className="flex-1">
                        <Text className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">Network</Text>
                        <Text className="font-bold text-base text-gray-900">
                          {getChainName(chainId)}
                        </Text>
                      </View>
                    </View>
                  )}
                </Animated.View>

                {/* Action Button */}
                <Animated.View style={{ shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, shadowOpacity: 0.3, elevation: 8 }}>
                  <TouchableOpacity
                    className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 rounded-2xl"
                    onPress={handleContinue}
                    activeOpacity={0.9}
                  >
                    <Text className="text-white font-bold text-lg text-center tracking-wide">
                      Continue to Dashboard →
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            ) : (
              <View className="w-full">
                {/* Hero Section */}
                <View className="items-center mb-8">
                  <Animated.View 
                    style={{ 
                      shadowOffset: { width: 0, height: 20 }, 
                      shadowRadius: 30, 
                      shadowOpacity: 0.2,
                      elevation: 15,
                      shadowColor: '#8B5CF6',
                    }}
                    className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl items-center justify-center mb-6 border-4 border-white"
                  >
                    <Text className="text-4xl">💪</Text>
                  </Animated.View>
                  
                  <Text className="text-gray-900 text-4xl font-black mb-3 text-center">
                    Welcome to FitStake
                  </Text>
                  <Text className="text-gray-600 text-lg text-center leading-7 max-w-xs">
                    Stake crypto, commit to fitness goals, and earn rewards for completing challenges.
                  </Text>
                </View>

                {/* Features Grid */}
                <View className="bg-white rounded-3xl p-6 mb-8 shadow-xl border border-gray-100">
                  <View className="grid grid-cols-2 gap-3">
                    <FeatureCard
                      icon="🏃"
                      text="Create fitness challenges"
                      gradient="from-blue-500 to-blue-600"
                    />
                    <FeatureCard
                      icon="💰"
                      text="Stake crypto on goals"
                      gradient="from-green-500 to-green-600"
                    />
                    <FeatureCard
                      icon="🔗"
                      text="Connect with Strava"
                      gradient="from-orange-500 to-orange-600"
                    />
                    <FeatureCard
                      icon="🏆"
                      text="Earn completion rewards"
                      gradient="from-purple-500 to-purple-600"
                    />
                  </View>
                </View>

                {/* Connect Button */}
                <Animated.View 
                  style={{ 
                    shadowOffset: { width: 0, height: 12 }, 
                    shadowRadius: 24, 
                    shadowOpacity: 0.3,
                    elevation: 12,
                    shadowColor: '#8B5CF6',
                  }}
                >
                  <TouchableOpacity
                    className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-5 rounded-2xl"
                    onPress={handleConnect}
                    disabled={isConnecting}
                    activeOpacity={0.9}
                  >
                    <Text className="text-white font-bold text-lg text-center tracking-wide">
                      Connect Wallet
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                <Text className="text-gray-400 text-center text-xs mt-4">
                  Supports MetaMask & WalletConnect
                </Text>
              </View>
            )}
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

function FeatureCard({ icon, text, gradient }) {
  return (
    <View className="bg-gray-50 p-4 rounded-2xl border border-gray-200 items-center justify-center h-24">
      <View className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-xl items-center justify-center mb-2 shadow-sm`}>
        <Text className="text-2xl">{icon}</Text>
      </View>
      <Text className="text-gray-900 font-semibold text-xs text-center leading-tight">{text}</Text>
    </View>
  );
}