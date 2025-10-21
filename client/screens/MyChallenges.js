import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWeb3 } from '../context/Web3Context';
import { useNavigation } from '@react-navigation/native';
import { getUserChallenges } from '../services/contract';
import { getActivityIcon, getDaysLeft, formatDistance } from '../utils/helpers';

export default function MyChallenges() {
  const navigation = useNavigation();
  const { account } = useWeb3();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [challenges, setChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    loadMyChallenges();
  }, [account]);

  const loadMyChallenges = async () => {
    setIsLoading(true);
    try {
      // TODO: Uncomment when smart contract is ready
      // const provider = await getProvider(); // Get from Web3Context
      // const userChallenges = await getUserChallenges(provider, account);
      // 
      // // Add activity icons to each challenge
      // const challengesWithIcons = userChallenges.map(challenge => ({
      //   ...challenge,
      //   icon: getActivityIcon(challenge.activityType),
      // }));
      // 
      // setChallenges(challengesWithIcons);
      
      // For now, return empty array until smart contract is integrated
      setChallenges([]);
    } catch (error) {
      console.error('Error loading challenges:', error);
      Alert.alert('Error', 'Failed to load your challenges. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteChallenge = async (challenge) => {
    Alert.alert(
      'Complete Challenge',
      `Mark "${challenge.name}" as complete and claim your rewards?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim Rewards',
          onPress: async () => {
            try {
              // TODO: Uncomment when smart contract is ready
              // const signer = await getSigner(); // Get from Web3Context
              // const result = await completeChallenge(signer, challenge.id);
              // 
              // Alert.alert(
              //   'Success! 🎉',
              //   `Rewards claimed!\n\nTransaction: ${result.transactionHash}`,
              //   [{ text: 'OK', onPress: () => loadMyChallenges() }]
              // );

              Alert.alert('Coming Soon', 'Challenge completion will be automated with Strava verification!');
            } catch (error) {
              console.error('Error completing challenge:', error);
              Alert.alert('Error', error.message || 'Failed to complete challenge.');
            }
          },
        },
      ]
    );
  };

  const activeChallenges = challenges.filter(c => !c.isCompleted);
  const completedChallenges = challenges.filter(c => c.isCompleted);

  const displayChallenges = activeTab === 'active' ? activeChallenges : completedChallenges;

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <Animated.View style={{ opacity: fadeAnim }} className="px-6 pt-16">
          {/* Header */}
          <View className="flex-row items-center mb-8">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="bg-white/20 p-3 rounded-xl mr-4"
            >
              <Text className="text-white text-xl">←</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-white text-3xl font-black">My Challenges</Text>
              <Text className="text-white/70 text-sm mt-1">
                {challenges.length} total challenges
              </Text>
            </View>
            <TouchableOpacity
              onPress={loadMyChallenges}
              className="bg-white/20 p-3 rounded-xl"
            >
              <Text className="text-white text-lg">🔄</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View className="flex-row bg-white/20 backdrop-blur-xl rounded-2xl p-2 mb-6">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl ${
                activeTab === 'active' ? 'bg-white' : ''
              }`}
              onPress={() => setActiveTab('active')}
            >
              <Text
                className={`text-center font-bold ${
                  activeTab === 'active' ? 'text-purple-600' : 'text-white'
                }`}
              >
                Active ({activeChallenges.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl ${
                activeTab === 'completed' ? 'bg-white' : ''
              }`}
              onPress={() => setActiveTab('completed')}
            >
              <Text
                className={`text-center font-bold ${
                  activeTab === 'completed' ? 'text-purple-600' : 'text-white'
                }`}
              >
                Completed ({completedChallenges.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Loading State */}
          {isLoading ? (
            <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-12 items-center">
              <ActivityIndicator size="large" color="#667eea" />
              <Text className="text-gray-600 mt-4 font-medium">Loading challenges...</Text>
            </View>
          ) : displayChallenges.length === 0 ? (
            /* Empty State */
            <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 items-center">
              <Text className="text-6xl mb-4">
                {activeTab === 'active' ? '🏃' : '🏆'}
              </Text>
              <Text className="text-gray-900 font-bold text-xl mb-2">
                {activeTab === 'active' ? 'No Active Challenges' : 'No Completed Challenges'}
              </Text>
              <Text className="text-gray-600 text-center mb-6">
                {activeTab === 'active'
                  ? 'Join or create a challenge to get started!'
                  : "Complete your active challenges to see them here!"}
              </Text>
              {activeTab === 'active' && (
                <View className="flex-col space-y-3">
                  <TouchableOpacity
                    className="bg-purple-600 px-6 py-3 rounded-xl "
                    onPress={() => navigation.navigate('CreateChallenge')}
                  >
                    <Text className="text-white text-center font-bold">Create Challenge</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-purple-600 px-6 py-3 rounded-xl"
                    onPress={() => navigation.navigate('JoinChallenge')}
                  >
                    <Text className="text-white text-center font-bold">Join Challenge</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            /* Challenges List */
            <View>
              {displayChallenges.map((challenge, index) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onComplete={handleCompleteChallenge}
                  isActive={activeTab === 'active'}
                  index={index}
                />
              ))}
            </View>
          )}

          {/* Stats Summary */}
          {!isLoading && challenges.length > 0 && (
            <View className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 mt-4 border border-white/20">
              <Text className="text-white font-bold text-sm mb-3">📊 Your Stats</Text>
              <View className="flex-row justify-between">
                <StatItem label="Total" value={challenges.length} />
                <StatItem label="Active" value={activeChallenges.length} />
                <StatItem label="Completed" value={completedChallenges.length} />
                <StatItem 
                  label="Success Rate" 
                  value={challenges.length > 0 
                    ? `${Math.round((completedChallenges.length / challenges.length) * 100)}%`
                    : '0%'
                  } 
                />
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

// Challenge Card Component
function ChallengeCard({ challenge, onComplete, isActive, index }) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 100,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        delay: index * 100,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const daysLeft = getDaysLeft(challenge.deadline);
  const progressPercentage = challenge.currentProgress && challenge.targetDistance
    ? Math.min((challenge.currentProgress / challenge.targetDistance) * 100, 100)
    : 0;

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
      }}
      className="mb-4"
    >
      <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
        {/* Header */}
        <View className="flex-row items-start justify-between mb-4">
          <View className="flex-1 mr-4">
            <View className="flex-row items-center mb-2">
              <Text className="text-3xl mr-2">{challenge.icon}</Text>
              <Text className="text-gray-900 font-black text-lg flex-1">
                {challenge.name}
              </Text>
            </View>
            <Text className="text-gray-500 text-xs">{challenge.activityType}</Text>
          </View>
          {isActive ? (
            <View className={`px-3 py-1 rounded-full ${
              daysLeft <= 3 ? 'bg-red-100' : 
              daysLeft <= 7 ? 'bg-orange-100' : 
              'bg-green-100'
            }`}>
              <Text className={`text-xs font-bold ${
                daysLeft <= 3 ? 'text-red-700' : 
                daysLeft <= 7 ? 'text-orange-700' : 
                'text-green-700'
              }`}>
                {daysLeft}d left
              </Text>
            </View>
          ) : (
            <View className="bg-green-100 px-3 py-1 rounded-full">
              <Text className="text-green-700 text-xs font-bold">✓ Done</Text>
            </View>
          )}
        </View>

        {/* Progress */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-600 text-sm font-medium">Progress</Text>
            <Text className="text-gray-900 text-sm font-bold">
              {formatDistance(challenge.currentProgress || 0, challenge.unit)} / {formatDistance(challenge.targetDistance, challenge.unit)}
            </Text>
          </View>
          <View className="bg-gray-200 h-3 rounded-full overflow-hidden">
            <View
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-full rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </View>
          <Text className="text-gray-500 text-xs mt-1 text-right">
            {Math.round(progressPercentage)}% complete
          </Text>
        </View>

        {/* Stats */}
        <View className="flex-row justify-between bg-gray-50 p-4 rounded-xl mb-4">
          <MiniStat icon="🎯" label="Target" value={formatDistance(challenge.targetDistance, challenge.unit)} />
          <MiniStat icon="💰" label="Stake" value={`${challenge.stakeAmount} ETH`} />
          <MiniStat icon="⏱️" label="Duration" value={`${challenge.duration}d`} />
        </View>

        {/* Action Button */}
        {isActive && progressPercentage >= 100 && (
          <TouchableOpacity
            className="bg-gradient-to-r from-green-500 to-emerald-500 py-4 rounded-2xl"
            onPress={() => onComplete(challenge)}
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-base text-center">
              Claim Rewards 🎉
            </Text>
          </TouchableOpacity>
        )}

        {isActive && progressPercentage < 100 && (
          <View className="bg-blue-50 p-3 rounded-xl">
            <Text className="text-blue-700 text-xs text-center font-medium">
              Keep going! Connect Strava to track your progress
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// Mini Stat Component
function MiniStat({ icon, label, value }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-lg mb-1">{icon}</Text>
      <Text className="text-gray-500 text-xs mb-1">{label}</Text>
      <Text className="text-gray-900 font-bold text-sm">{value}</Text>
    </View>
  );
}

// Stat Item Component
function StatItem({ label, value }) {
  return (
    <View className="items-center">
      <Text className="text-white font-bold text-xl mb-1">{value}</Text>
      <Text className="text-white/70 text-xs">{label}</Text>
    </View>
  );
}
