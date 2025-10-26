import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useWeb3 } from '../context/Web3Context';
import { useNavigation } from '@react-navigation/native';
import { getActiveChallenges, joinChallenge as joinChallengeContract, getContract } from '../services/contract';
import { getActivityIcon, getDaysLeft, getStatusColor } from '../utils/helpers';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

export default function JoinChallenge() {
  const navigation = useNavigation();
  const { account, isConnected, getSigner, getProvider, getWalletConnectInfo } = useWeb3();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [challenges, setChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);

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

    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    setIsLoading(true);
    try {
      const provider = getProvider();
      const challengesList = await getActiveChallenges(provider);
      
      const challengesWithIcons = challengesList.map(challenge => ({
        ...challenge,
        icon: getActivityIcon(challenge.activityType),
      }));
      
      const availableChallenges = await filterUserChallenges(challengesWithIcons, provider);
      
      setChallenges(availableChallenges);
    } catch (error) {
      console.error('Error loading challenges:', error);
      Alert.alert('Error', 'Failed to load challenges. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterUserChallenges = async (challengesList, provider) => {
    if (!account) {
      return challengesList;
    }

    try {
      const contract = getContract(provider);
      const filteredChallenges = [];

      for (const challenge of challengesList) {
        try {
          const isParticipant = await contract.isParticipant(challenge.id, account);
          console.log(`Challenge ${challenge.id}: User enrolled = ${isParticipant}`);
          
          if (!isParticipant) {
            filteredChallenges.push(challenge);
          }
        } catch (error) {
          console.error(`Error checking participation for challenge ${challenge.id}:`, error);
          filteredChallenges.push(challenge);
        }
      }

      console.log(`Filtered challenges: ${filteredChallenges.length} available out of ${challengesList.length} total`);
      return filteredChallenges;
    } catch (error) {
      console.error('Error filtering user challenges:', error);
      return challengesList;
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
              const walletConnectInfo = getWalletConnectInfo();
              const result = await joinChallengeContract(
                signer,
                challenge.id,
                challenge.stakeAmount,
                walletConnectInfo
              );
              
              Alert.alert(
                'Success! 🎉',
                `You've joined "${challenge.name}"!\n\nTransaction: ${result.transactionHash.substring(0, 10)}...${result.transactionHash.substring(result.transactionHash.length - 8)}\n\nStart tracking your activities on Strava to complete this challenge.`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      loadChallenges();
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
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <LinearGradient
        colors={['#ffffff', '#fdf2f8', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="pt-16 pb-5 px-6 shadow-sm border-b border-pink-100"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-white rounded-xl border border-pink-200 items-center justify-center shadow-sm"
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#EC4899" />
          </TouchableOpacity>
          
          <View className="flex-1 mx-4">
            <Text className="text-gray-900 font-bold text-2xl">Join Challenge</Text>
            <Text className="text-pink-600 text-sm font-medium mt-1">
              {challenges.length} available challenges
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={loadChallenges}
            className="w-10 h-10 bg-white rounded-xl border border-pink-200 items-center justify-center shadow-sm"
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color="#EC4899" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Body */}
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className="px-6 pt-6"
        >
          {/* Loading State */}
          {isLoading ? (
            <View 
              className="bg-white rounded-2xl p-12 items-center border border-gray-100"
              style={Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                },
                android: { elevation: 3 },
              })}
            >
              <ActivityIndicator size="large" color="#EC4899" />
              <Text className="text-gray-600 mt-4 font-medium">Loading challenges...</Text>
            </View>
          ) : challenges.length === 0 ? (
            /* Empty State */
            <View 
              className="bg-white rounded-2xl p-8 items-center border border-gray-100"
              style={Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                },
                android: { elevation: 3 },
              })}
            >
              <MaterialCommunityIcons name="run-fast" size={48} color="#EC4899" className="mb-4" />
              <Text className="text-gray-900 font-bold text-xl mb-2">No Available Challenges</Text>
              <Text className="text-gray-600 text-center mb-6">
                {account ? 
                  "You've joined all available challenges or there are no active challenges yet." :
                  "Connect your wallet to see available challenges."
                }
              </Text>
              <View className="w-full flex-row space-x-3">
                <TouchableOpacity
                  className="flex-1 bg-pink-600 px-6 py-4 rounded-xl shadow-sm"
                  onPress={() => navigation.navigate('CreateChallenge')}
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-bold text-center">Create Challenge</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-blue-600 px-6 py-4 rounded-xl shadow-sm"
                  onPress={loadChallenges}
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-bold text-center">Refresh</Text>
                </TouchableOpacity>
              </View>
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
          <View 
            className="bg-white rounded-2xl p-5 mt-6 border border-gray-100"
            style={Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              },
              android: { elevation: 3 },
            })}
          >
            <View className="flex-row items-center mb-3">
              <Ionicons name="bulb-outline" size={20} color="#EC4899" />
              <Text className="text-gray-900 font-bold text-base ml-2">Before You Join</Text>
            </View>
            <View className="space-y-2">
              <InfoItem 
                icon={<MaterialIcons name="attach-money" size={16} color="#EC4899" />} 
                text="Make sure you have enough ETH for the stake" 
              />
              <InfoItem 
                icon={<FontAwesome5 name="strava" size={16} color="#EC4899" />} 
                text="Connect your Strava account to track progress" 
              />
              <InfoItem 
                icon={<MaterialCommunityIcons name="clock-outline" size={16} color="#EC4899" />} 
                text="Complete the target within the time limit" 
              />
              <InfoItem 
                icon={<MaterialIcons name="warning" size={16} color="#EC4899" />} 
                text="Failed challenges lose the staked amount" 
              />
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

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
      <View 
        className="bg-white rounded-2xl p-6 border border-gray-100"
        style={Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
          },
          android: { elevation: 3 },
        })}
      >
        {/* Header */}
        <View className="flex-row items-start justify-between mb-4">
          <View className="flex-1 mr-4">
            <View className="flex-row items-center mb-2">
              <View className="mr-2">
                {challenge.icon}
              </View>
              <Text className="text-gray-900 font-bold text-lg flex-1">
                {challenge.name}
              </Text>
            </View>
            <Text className="text-gray-500 text-xs font-medium">
              by {challenge.creator.slice(0, 6)}...{challenge.creator.slice(-4)}
            </Text>
          </View>
          <View className={`px-3 py-1.5 rounded-full ${
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
        </View>

        {/* Stats Grid */}
        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <View className="flex-row justify-between mb-3">
            <StatItem 
              icon={<MaterialIcons name="flag" size={20} color="#EC4899" />} 
              label="Target" 
              value={`${challenge.targetDistance} ${challenge.unit}`} 
            />
            <StatItem 
              icon={<Feather name="clock" size={20} color="#EC4899" />} 
              label="Duration" 
              value={`${challenge.duration} days`} 
            />
          </View>
          <View className="flex-row justify-between">
            <StatItem 
              icon={<FontAwesome5 name="coins" size={20} color="#EC4899" />} 
              label="Stake" 
              value={`${challenge.stakeAmount} ETH`} 
            />
            <StatItem 
              icon={<Ionicons name="people" size={20} color="#EC4899" />} 
              label="Participants" 
              value={challenge.participants} 
            />
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
            <LinearGradient
              colors={['#3B82F6', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ 
                width: `${(challenge.duration - daysLeft) / challenge.duration * 100}%`,
                height: '100%',
                borderRadius: 9999 
              }}
            />
          </View>
        </View>

        {/* Join Button */}
        <TouchableOpacity
          className="bg-pink-500 py-4 rounded-xl shadow-sm"
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
              Join Challenge <Ionicons name="arrow-forward" size={16} color="white" />
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function StatItem({ icon, label, value }) {
  return (
    <View className="flex-1">
      <View className="mb-1">
        {icon}
      </View>
      <Text className="text-gray-500 text-xs mb-1">{label}</Text>
      <Text className="text-gray-900 font-bold text-sm">{value}</Text>
    </View>
  );
}

function InfoItem({ icon, text }) {
  return (
    <View className="flex-row items-start">
      <View className="mr-2 mt-0.5">
        {icon}
      </View>
      <Text className="text-gray-600 text-sm flex-1 leading-5">{text}</Text>
    </View>
  );
}