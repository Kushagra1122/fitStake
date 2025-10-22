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
import { getActiveChallenges, joinChallenge as joinChallengeContract } from '../services/contract';
import { getActivityIcon, getDaysLeft, getStatusColor } from '../utils/helpers';

export default function JoinChallenge() {
  const navigation = useNavigation();
  const { account, isConnected, getSigner, getProvider } = useWeb3();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [challenges, setChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    setIsLoading(true);
    try {
      const provider = getProvider();
      const challengesList = await getActiveChallenges(provider);
      
      // Add activity icons to each challenge
      const challengesWithIcons = challengesList.map(challenge => ({
        ...challenge,
        icon: getActivityIcon(challenge.activityType),
      }));
      
      setChallenges(challengesWithIcons);
    } catch (error) {
      console.error('Error loading challenges:', error);
      Alert.alert('Error', 'Failed to load challenges. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinChallenge = async (challenge) => {
    if (!isConnected) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    Alert.alert(
      'Join Challenge',
      `Join "${challenge.name}"?\n\nStake: ${challenge.stakeAmount} ETH\nTarget: ${challenge.targetDistance} ${challenge.unit} in ${challenge.duration} days`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join & Stake',
          onPress: async () => {
            setJoiningId(challenge.id);
            try {
              const signer = getSigner();
              const result = await joinChallengeContract(
                signer,
                challenge.id,
                challenge.stakeAmount
              );
              
              Alert.alert(
                'Success! 🎉',
                `You've joined "${challenge.name}"!\n\nTransaction: ${result.transactionHash.substring(0, 10)}...${result.transactionHash.substring(result.transactionHash.length - 8)}\n\nStart tracking your activities on Strava to complete this challenge.`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      loadChallenges(); // Reload to reflect updated participant count
                      navigation.navigate('Home');
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Error joining challenge:', error);
              Alert.alert('Error', error.message || 'Failed to join challenge. Please try again.');
            } finally {
              setJoiningId(null);
            }
          },
        },
      ]
    );
  };

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
              <Text className="text-white text-3xl font-black">Join Challenge</Text>
              <Text className="text-white/70 text-sm mt-1">
                {challenges.length} active challenges
              </Text>
            </View>
            <TouchableOpacity
              onPress={loadChallenges}
              className="bg-white/20 p-3 rounded-xl"
            >
              <Text className="text-white text-lg">🔄</Text>
            </TouchableOpacity>
          </View>

          {/* Loading State */}
          {isLoading ? (
            <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-12 items-center">
              <ActivityIndicator size="large" color="#667eea" />
              <Text className="text-gray-600 mt-4 font-medium">Loading challenges...</Text>
            </View>
          ) : challenges.length === 0 ? (
            /* Empty State */
            <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 items-center">
              <Text className="text-6xl mb-4">🏃</Text>
              <Text className="text-gray-900 font-bold text-xl mb-2">No Challenges Yet</Text>
              <Text className="text-gray-600 text-center mb-6">
                Be the first to create a challenge!
              </Text>
              <TouchableOpacity
                className="bg-purple-600 px-6 py-3 rounded-xl"
                onPress={() => navigation.navigate('CreateChallenge')}
              >
                <Text className="text-white font-bold">Create Challenge</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Challenges List */
            <View>
              {challenges.map((challenge, index) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onJoin={handleJoinChallenge}
                  isJoining={joiningId === challenge.id}
                  daysLeft={getDaysLeft(challenge.deadline)}
                  index={index}
                />
              ))}
            </View>
          )}

          {/* Info Card */}
          <View className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 mt-4 border border-white/20">
            <Text className="text-white font-bold text-sm mb-2">💡 Before you join</Text>
            <Text className="text-white/80 text-xs leading-5">
              • Make sure you have enough ETH for the stake{'\n'}
              • Connect your Strava account to track progress{'\n'}
              • Complete the target within the time limit{'\n'}
              • Failed challenges lose the staked amount
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

// Challenge Card Component
function ChallengeCard({ challenge, onJoin, isJoining, daysLeft, index }) {
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
            <Text className="text-gray-500 text-xs">
              by {challenge.creator}
            </Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${getStatusColor(daysLeft)}`}>
            <Text className="text-xs font-bold">{daysLeft}d left</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="bg-gray-50 rounded-2xl p-4 mb-4">
          <View className="flex-row justify-between mb-3">
            <StatItem icon="🎯" label="Target" value={`${challenge.targetDistance} ${challenge.unit}`} />
            <StatItem icon="⏱️" label="Duration" value={`${challenge.duration} days`} />
          </View>
          <View className="flex-row justify-between">
            <StatItem icon="💰" label="Stake" value={`${challenge.stakeAmount} ETH`} />
            <StatItem icon="👥" label="Participants" value={challenge.participants} />
          </View>
        </View>

        {/* Progress Bar */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-600 text-xs font-medium">Challenge Progress</Text>
            <Text className="text-gray-900 text-xs font-bold">
              {Math.round((challenge.duration - daysLeft) / challenge.duration * 100)}%
            </Text>
          </View>
          <View className="bg-gray-200 h-2 rounded-full overflow-hidden">
            <View
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-full"
              style={{ width: `${(challenge.duration - daysLeft) / challenge.duration * 100}%` }}
            />
          </View>
        </View>

        {/* Join Button */}
        <TouchableOpacity
          className="bg-gradient-to-r from-purple-600 to-pink-600 py-4 rounded-2xl shadow-lg"
          onPress={() => onJoin(challenge)}
          disabled={isJoining}
          activeOpacity={0.8}
        >
          {isJoining ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white font-bold text-base ml-2">Joining...</Text>
            </View>
          ) : (
            <Text className="text-white font-bold text-base text-center">
              Join Challenge →
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// Stat Item Component
function StatItem({ icon, label, value }) {
  return (
    <View className="flex-1">
      <Text className="text-lg mb-1">{icon}</Text>
      <Text className="text-gray-500 text-xs mb-1">{label}</Text>
      <Text className="text-gray-900 font-bold text-sm">{value}</Text>
    </View>
  );
}
