import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWeb3 } from '../context/Web3Context';
import { getUserChallenges } from '../services/contract';

const { width } = Dimensions.get('window');

export default function Home({ navigation }) {
  const { account, chainId, disconnectWallet, getProvider } = useWeb3();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  const [activeChallengesCount, setActiveChallengesCount] = useState(0);
  const [totalStaked, setTotalStaked] = useState('0');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 30,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    loadUserStats();
  }, [account]);

  const loadUserStats = async () => {
    if (!account) {
      return;
    }

    try {
      const provider = getProvider();
      const userChallenges = await getUserChallenges(provider, account);
      
      // Count active challenges (not completed/finalized)
      const activeChallenges = userChallenges.filter(c => !c.finalized && !c.hasWithdrawn);
      setActiveChallengesCount(activeChallenges.length);
      
      // Calculate total staked
      const total = activeChallenges.reduce((sum, challenge) => {
        return sum + parseFloat(challenge.stakeAmount || '0');
      }, 0);
      setTotalStaked(total.toFixed(4));
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
    navigation.navigate('ConnectWallet');
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-16">
          <Animated.View 
            style={{ 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            <View className="flex-row items-center justify-between mb-8">
              <View>
                <Text className="text-white/70 text-sm font-medium mb-1">Welcome back</Text>
                <Text className="text-white font-bold text-2xl">
                  {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'User'}
                </Text>
              </View>
              <TouchableOpacity 
                className="bg-white/20 p-3 rounded-xl border border-white/30"
                onPress={handleDisconnect}
              >
                <Text className="text-white font-semibold text-sm">Disconnect</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row mb-6">
              <StatCard title="Active Challenges" value={activeChallengesCount.toString()} icon="🏃" />
              <View className="w-4" />
              <StatCard title="Total Staked" value={`${totalStaked} ETH`} icon="💰" />
            </View>

            <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 mb-4 shadow-xl">
              <Text className="text-2xl font-black text-gray-900 mb-2">FitStake Dashboard</Text>
              <Text className="text-gray-600 text-base mb-6">
                Create challenges, stake crypto, and achieve your fitness goals!
              </Text>
              
              <View className="space-y-3">
                <FeatureCard
                  icon="👤"
                  title="Profile"
                  description="Get your personal dashboard"
                  color="from-orange-500 to-red-500"
                  onPress={() => navigation.navigate('Profile')}
                />
                <FeatureCard
                  icon="🏃‍♂️"
                  title="Create Challenge"
                  description="Set your fitness goal and stake"
                  color="from-purple-500 to-pink-500"
                  onPress={() => navigation.navigate('CreateChallenge')}
                />
                <FeatureCard
                  icon="🤝"
                  title="Join Challenge"
                  description="Browse and join existing challenges"
                  color="from-blue-500 to-cyan-500"
                  onPress={() => navigation.navigate('JoinChallenge')}
                />
                <FeatureCard
                  icon="📊"
                  title="My Challenges"
                  description="View and track your active goals"
                  color="from-green-500 to-emerald-500"
                  onPress={() => navigation.navigate('MyChallenges')}
                />
                <FeatureCard
                  icon="🔗"
                  title="Connect Strava"
                  description="Link your fitness tracking app"
                  color="from-orange-500 to-red-500"
                  onPress={() => navigation.navigate('ConnectStrava')}
                />
              </View>
            </View>

            <View className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-6 shadow-xl">
              <Text className="text-white text-xl font-bold mb-2">💡 How it works</Text>
              <Text className="text-white/90 text-sm leading-6">
                1. Create a fitness challenge and stake crypto{'\n'}
                2. Complete your workouts and log them via Strava{'\n'}
                3. Smart contracts verify your progress{'\n'}
                4. Achieve your goal and get your stake back + rewards!
              </Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <View className="flex-1 bg-white/20 backdrop-blur-xl rounded-2xl p-4 border border-white/30">
      <Text className="text-4xl mb-2">{icon}</Text>
      <Text className="text-white/70 text-xs font-medium mb-1">{title}</Text>
      <Text className="text-white font-bold text-xl">{value}</Text>
    </View>
  );
}

function FeatureCard({ icon, title, description, color, onPress }) {
  return (
    <TouchableOpacity 
      className="bg-gray-50 rounded-2xl p-4 flex-row items-center mb-3 active:opacity-70"
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View className={`bg-gradient-to-r ${color} w-12 h-12 rounded-xl items-center justify-center mr-4`}>
        <Text className="text-2xl">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 font-bold text-base mb-1">{title}</Text>
        <Text className="text-gray-500 text-sm">{description}</Text>
      </View>
      <Text className="text-gray-400 text-xl">→</Text>
    </TouchableOpacity>
  );
}
