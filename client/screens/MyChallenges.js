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
import { getUserChallenges, withdrawWinnings } from '../services/contract';
import { getActivityIcon, getDaysLeft, formatDistance } from '../utils/helpers';
import { runTests } from '../services/test';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons, Feather, FontAwesome } from '@expo/vector-icons';

export default function MyChallenges() {
  const navigation = useNavigation();
  const { account, getSigner, getWalletConnectInfo, getProvider } = useWeb3();
  const { accessToken, isConnected } = useStrava();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [challenges, setChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

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
    
    runTests().catch(console.error);
    loadMyChallenges();
  }, [account]);

  const loadMyChallenges = async () => {
    if (!account) {
      setChallenges([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Loading user challenges for account:', account);
      const provider = getProvider();
      
      const userChallenges = await getUserChallenges(provider, account);
      
      console.log('📊 User challenges loaded:', userChallenges.length);
      
      const challengesWithIcons = userChallenges.map(challenge => ({
        ...challenge,
        icon: getActivityIcon(challenge.activityType),
      }));
      
      setChallenges(challengesWithIcons);
    } catch (error) {
      console.error('Error loading challenges:', error);
      Alert.alert('Error', 'Failed to load your challenges. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChallengePress = (challenge) => {
    navigation.navigate('Challenge', { challenge });
  };

  const handleCompleteChallenge = async (challenge) => {
    if (!challenge.finalized) {
      Alert.alert(
        'Challenge Not Finalized',
        'This challenge needs to be finalized before you can withdraw. The challenge must be past its end date.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (challenge.hasWithdrawn) {
      Alert.alert('Already Withdrawn', 'You have already withdrawn your funds from this challenge.');
      return;
    }

    Alert.alert(
      'Withdraw Winnings',
      `Withdraw your stake${challenge.isCompleted ? ' + rewards' : ''} from "${challenge.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: async () => {
            try {
              const signer = getSigner();
              const walletConnectInfo = getWalletConnectInfo();
              const result = await withdrawWinnings(signer, challenge.id, walletConnectInfo);
              
              Alert.alert(
                'Success! 🎉',
                `Funds withdrawn!\n\nTransaction: ${result.transactionHash.substring(0, 10)}...${result.transactionHash.substring(result.transactionHash.length - 8)}`,
                [{ text: 'OK', onPress: () => loadMyChallenges() }]
              );
            } catch (error) {
              console.error('Error withdrawing winnings:', error);
              Alert.alert('Error', error.message || 'Failed to withdraw winnings.');
            }
          },
        },
      ]
    );
  };

  const activeChallenges = challenges.filter(c => 
    !c.finalized && !c.hasWithdrawn
  );
  const completedChallenges = challenges.filter(c => 
    c.finalized || c.hasWithdrawn
  );

  const displayChallenges = activeTab === 'active' ? activeChallenges : completedChallenges;

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
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-white rounded-xl border border-pink-200 items-center justify-center shadow-sm"
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#EC4899" />
          </TouchableOpacity>
          
          <View className="flex-1 mx-4">
            <Text className="text-gray-900 font-bold text-2xl">My Challenges</Text>
            <Text className="text-pink-600 text-sm font-medium mt-1">
              {activeChallenges.length} active • {completedChallenges.length} completed
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={loadMyChallenges}
            className="w-10 h-10 bg-white rounded-xl border border-pink-200 items-center justify-center shadow-sm"
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color="#EC4899" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-gray-100 rounded-xl p-1">
          <TouchableOpacity
            className={`flex-1 py-3 rounded-lg ${
              activeTab === 'active' ? 'bg-white shadow-sm' : ''
            }`}
            onPress={() => setActiveTab('active')}
            activeOpacity={0.8}
          >
            <Text
              className={`text-center font-bold text-sm ${
                activeTab === 'active' ? 'text-pink-600' : 'text-gray-500'
              }`}
            >
              Active ({activeChallenges.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 rounded-lg ${
              activeTab === 'completed' ? 'bg-white shadow-sm' : ''
            }`}
            onPress={() => setActiveTab('completed')}
            activeOpacity={0.8}
          >
            <Text
              className={`text-center font-bold text-sm ${
                activeTab === 'completed' ? 'text-pink-600' : 'text-gray-500'
              }`}
            >
              Completed ({completedChallenges.length})
            </Text>
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
          ) : displayChallenges.length === 0 ? (
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
              <View className="mb-4">
                {activeTab === 'active' ? (
                  <MaterialCommunityIcons name="run-fast" size={48} color="#EC4899" />
                ) : (
                  <FontAwesome5 name="trophy" size={48} color="#EC4899" />
                )}
              </View>
              <Text className="text-gray-900 font-bold text-xl mb-2">
                {activeTab === 'active' ? 'No Active Challenges' : 'No Completed Challenges'}
              </Text>
              <Text className="text-gray-600 text-center mb-6">
                {activeTab === 'active'
                  ? 'Join or create a challenge to get started!'
                  : "Complete your active challenges to see them here!"}
              </Text>
              {activeTab === 'active' && (
                <View className="w-full space-y-3">
                  <TouchableOpacity
                    className="bg-pink-600 px-6 py-4 rounded-xl shadow-sm"
                    onPress={() => navigation.navigate('CreateChallenge')}
                    activeOpacity={0.8}
                  >
                    <Text className="text-white text-center font-bold">Create Challenge</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-blue-600 px-6 py-4 rounded-xl shadow-sm"
                    onPress={() => navigation.navigate('JoinChallenge')}
                    activeOpacity={0.8}
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
                  onPress={handleChallengePress}
                  onComplete={handleCompleteChallenge}
                  onVerify={handleVerifyRun}
                  isActive={activeTab === 'active'}
                  isVerifying={isVerifying && verifyingChallengeId === challenge.id}
                  index={index}
                />
              ))}
            </View>
          )}

          {/* Stats Summary */}
          {!isLoading && challenges.length > 0 && (
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
              <View className="flex-row items-center mb-4">
                <MaterialIcons name="analytics" size={20} color="#EC4899" />
                <Text className="text-gray-900 font-bold text-base ml-2">Your Stats</Text>
              </View>
              <View className="flex-row justify-between">
                <StatItem label="Total" value={challenges.length} />
                <StatItem label="Active" value={activeChallenges.length} />
                <StatItem label="Completed" value={completedChallenges.length} />
                <StatItem 
                  label="Success" 
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
    </View>
  );
}

function ChallengeCard({ challenge, onPress, onComplete, isActive, index }) {
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
      <TouchableOpacity
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
        onPress={() => onPress(challenge)}
        activeOpacity={0.8}
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
              {challenge.activityType} • Staked: {challenge.stakeAmount} ETH
            </Text>
          </View>
          {isActive ? (
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
          ) : (
            <View className={`bg-green-100 px-3 py-1.5 rounded-full ${challenge.isCompleted ? 'flex-row items-center' : ''}`}>
              {challenge.isCompleted ? (
                <>
                  <Ionicons name="checkmark" size={12} color="#16a34a" />
                  <Text className="text-green-700 text-xs font-bold ml-1">Completed</Text>
                </>
              ) : challenge.hasWithdrawn ? (
                <View className="flex-row items-center">
                  <FontAwesome5 name="money-bill-wave" size={12} color="#16a34a" />
                  <Text className="text-green-700 text-xs font-bold ml-1">Withdrawn</Text>
                </View>
              ) : challenge.finalized ? (
                <View className="flex-row items-center">
                  <MaterialIcons name="flag" size={12} color="#16a34a" />
                  <Text className="text-green-700 text-xs font-bold ml-1">Finalized</Text>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-done" size={12} color="#16a34a" />
                  <Text className="text-green-700 text-xs font-bold ml-1">Done</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Progress */}
        {/* <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-600 text-sm font-medium">Progress</Text>
            <Text className="text-gray-900 text-sm font-bold">
              {formatDistance(challenge.currentProgress || 0, challenge.unit)} / {formatDistance(challenge.targetDistance, challenge.unit)}
            </Text>
          </View>
          <View className="bg-gray-200 h-3 rounded-full overflow-hidden">
            <LinearGradient
              colors={['#EC4899', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: `${progressPercentage}%`, height: '100%', borderRadius: 9999 }}
            />
          </View>
          <Text className="text-gray-500 text-xs mt-1 text-right">
            {Math.round(progressPercentage)}% complete
          </Text>
        </View> */}

        {/* Stats */}
        <View className="flex-row justify-between bg-gray-50 p-4 rounded-xl mb-4">
          <MiniStat 
            icon={<MaterialIcons name="flag" size={20} color="#EC4899" />} 
            label="Target" 
            value={formatDistance(challenge.targetDistance, challenge.unit)} 
          />
          <MiniStat 
            icon={<FontAwesome5 name="coins" size={20} color="#EC4899" />} 
            label="Stake" 
            value={`${challenge.stakeAmount} ETH`} 
          />
          <MiniStat 
            icon={<Feather name="clock" size={20} color="#EC4899" />} 
            label="Duration" 
            value={`${challenge.duration}d`} 
          />
        </View>

        {/* Action Buttons */}
        {isActive && challenge.finalized && !challenge.hasWithdrawn && (
          <TouchableOpacity
            className="bg-green-600 py-4 rounded-xl shadow-sm"
            onPress={() => onComplete(challenge)}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-center">
              <FontAwesome5 name="money-bill-wave" size={16} color="white" />
              <Text className="text-white font-bold text-base ml-2">
                Withdraw Winnings
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {isActive && !challenge.finalized && !challenge.isCompleted && (
          <TouchableOpacity
            className={`py-4 rounded-2xl ${
              isVerifying 
                ? 'bg-gray-400' 
                : 'bg-gradient-to-r from-purple-600 to-pink-600'
            }`}
            onPress={() => onVerify(challenge)}
            activeOpacity={0.8}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="white" className="mr-2" />
                <Text className="text-white font-bold text-base">
                  Verifying Run...
                </Text>
              </View>
            ) : (
              <Text className="text-white font-bold text-base text-center">
                Verify Run 🏃
              </Text>
            )}
          </TouchableOpacity>
        )}

        {isActive && !challenge.finalized && challenge.isCompleted && (
          <View className="bg-green-50 p-3 rounded-xl">
            <Text className="text-green-700 text-xs text-center font-medium">
              ✅ Challenge completed! Waiting for finalization
            </Text>
          </View>
        )}

        {!isActive && challenge.hasWithdrawn && (
          <View className="bg-green-50 p-3 rounded-xl">
            <View className="flex-row items-center justify-center">
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
              <Text className="text-green-700 text-xs ml-1 font-medium">
                Winnings withdrawn successfully
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <View className="flex-1 items-center">
      <View className="mb-1">
        {icon}
      </View>
      <Text className="text-gray-500 text-xs mb-1">{label}</Text>
      <Text className="text-gray-900 font-bold text-sm">{value}</Text>
    </View>
  );
}

function StatItem({ label, value }) {
  return (
    <View className="items-center">
      <Text className="text-gray-900 font-bold text-xl mb-1">{value}</Text>
      <Text className="text-gray-500 text-xs">{label}</Text>
    </View>
  );
}