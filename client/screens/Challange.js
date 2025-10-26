import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useWeb3 } from '../context/Web3Context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getChallengeById, getContract, getProvider } from '../services/contract';
import { formatAddress, getActivityIcon, getDaysLeft } from '../utils/helpers';
import { ethers } from 'ethers';
import { 
  getChallengeById as getChallengeByIdEnvio, 
  getChallengeParticipants, 
  getChallengeTaskCompletions,
  getChallengeFinalization 
} from '../services/envioService';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

export default function Challenge() {
  const navigation = useNavigation();
  const route = useRoute();
  const { account, getProvider } = useWeb3();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  const { challenge: initialChallenge } = route.params || {};
  
  const [challenge, setChallenge] = useState(initialChallenge);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalStaked, setTotalStaked] = useState('0');
  const [isActive, setIsActive] = useState(true);

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

    if (initialChallenge) {
      loadChallengeDetails();
    }
  }, [initialChallenge]);

  const loadChallengeDetails = async () => {
    if (!initialChallenge) return;
    
    setIsLoading(true);
    try {
      // Try to fetch from Envio service first
      const envioChallenge = await getChallengeByIdEnvio(initialChallenge.id);
      console.log('🔍 Envio challenge:', envioChallenge);
      if (envioChallenge) {
        // Use Envio data if available
        setChallenge(envioChallenge);
        
        // Fetch participants from Envio
        await loadParticipantsFromEnvio(initialChallenge.id);
        
        // Calculate total staked from participants
        await calculateTotalStakedFromEnvio(initialChallenge.id);
        
        // Check if challenge is active
        checkIfActive(envioChallenge);
      } else {
        // Fallback to contract if Envio data not available
        const provider = getProvider();
        const updatedChallenge = await getChallengeById(provider, initialChallenge.id);
        console.log('🔍 Updated challenge:', updatedChallenge);
        setChallenge(updatedChallenge);
        
        // Fetch participants
        await loadParticipants(provider, initialChallenge.id);
        
        // Calculate total staked
        await calculateTotalStaked(provider, initialChallenge.id);
        
        // Check if challenge is active
        checkIfActive(updatedChallenge);
      }
    } catch (error) {
      console.error('Error loading challenge details:', error);
      Alert.alert('Error', 'Failed to load challenge details.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadParticipantsFromEnvio = async (challengeId) => {
    try {
      const [participantsData, taskCompletions] = await Promise.all([
        getChallengeParticipants(challengeId),
        getChallengeTaskCompletions(challengeId)
      ]);
      
      // Create a map of user completions for today's check
      const today = new Date().toDateString();
      const userCompletions = {};
      taskCompletions.forEach(task => {
        const taskDate = new Date(task.completionTimestamp * 1000).toDateString();
        if (taskDate === today) {
          userCompletions[task.user] = true;
        }
      });
      
      const participantDetails = participantsData.map(participant => ({
        address: participant.user,
        hasCompleted: false, // This would need to be calculated based on task completions
        hasWithdrawn: false, // This would need to be fetched from winnings data
        stakedAmount: ethers.formatEther(participant.stakedAmount),
        completedToday: userCompletions[participant.user] || false,
      }));
      
      setParticipants(participantDetails);
    } catch (error) {
      console.error('Error loading participants from Envio:', error);
    }
  };

  const loadParticipants = async (provider, challengeId) => {
    try {
      const contract = getContract(provider);
      const participantAddresses = await contract.getChallengeParticipants(challengeId);
      
      // Fetch participant details for each address
      const participantDetails = await Promise.all(
        participantAddresses.map(async (address) => {
          try {
            const participant = await contract.getParticipant(challengeId, address);
            return {
              address,
              hasCompleted: participant.hasCompleted,
              hasWithdrawn: participant.hasWithdrawn,
              stakedAmount: ethers.formatEther(participant.stakedAmount),
              completedToday: Math.random() > 0.5, // Hardcoded for now - would fetch from Strava
            };
          } catch (err) {
            console.error(`Error fetching participant ${address}:`, err);
            return null;
          }
        })
      );
      
      setParticipants(participantDetails.filter(p => p !== null));
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const calculateTotalStakedFromEnvio = async (challengeId) => {
    try {
      const participantsData = await getChallengeParticipants(challengeId);
      const totalStakedAmount = participantsData.reduce((sum, participant) => {
        return sum + parseFloat(ethers.formatEther(participant.stakedAmount));
      }, 0);
      setTotalStaked(totalStakedAmount.toString());
    } catch (error) {
      console.error('Error calculating total staked from Envio:', error);
    }
  };

  const calculateTotalStaked = async (provider, challengeId) => {
    try {
      const contract = getContract(provider);
      const challenge = await contract.getChallenge(challengeId);
      const totalStakedAmount = ethers.formatEther(challenge.totalStaked);
      setTotalStaked(totalStakedAmount);
    } catch (error) {
      console.error('Error calculating total staked:', error);
    }
  };

  const checkIfActive = (challengeData) => {
    const now = Math.floor(Date.now() / 1000);
    const endTime = challengeData.deadline || challengeData.endTime;
    
    if (!endTime) {
      setIsActive(false);
      return;
    }
    
    // Handle different timestamp formats
    let endTimestamp;
    if (typeof endTime === 'string') {
      endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);
    } else if (endTime > 1000000000000) {
      // If timestamp is in milliseconds
      endTimestamp = Math.floor(endTime / 1000);
    } else {
      // If timestamp is in seconds
      endTimestamp = endTime;
    }
    
    setIsActive(endTimestamp > now);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    // Handle both timestamp formats (seconds or milliseconds)
    let date;
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp > 1000000000000) {
      // If timestamp is in milliseconds
      date = new Date(timestamp);
    } else {
      // If timestamp is in seconds
      date = new Date(timestamp * 1000);
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleWithdraw = () => {
    // Placeholder function - to be implemented later
    Alert.alert('Withdraw', 'Withdraw function will be implemented soon');
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EC4899" />
          <Text className="text-gray-600 mt-4 font-medium">Loading challenge...</Text>
        </View>
      </View>
    );
  }

  if (!challenge) {
    return (
      <View className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center px-6">
          <MaterialCommunityIcons name="run-fast" size={64} color="#EC4899" className="mb-4" />
          <Text className="text-gray-900 font-bold text-xl mb-2">Challenge Not Found</Text>
          <Text className="text-gray-600 text-center mb-6">
            The challenge you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity
            className="bg-pink-600 px-6 py-4 rounded-xl shadow-sm w-full"
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-center">Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const daysLeft = getDaysLeft(challenge.deadline || challenge.endTime);

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
            <Text className="text-gray-900 font-bold text-2xl">Challenge Details</Text>
            <Text className="text-pink-600 text-sm font-medium mt-1">
              {participants.length} participants • {isActive ? `${daysLeft}d left` : 'Completed'}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={loadChallengeDetails}
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
          {/* Challenge Header Card */}
          <View 
            className="bg-white rounded-2xl p-6 border border-gray-100 mb-6"
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
              <View className="mr-3">
                {getActivityIcon(challenge.activityType)}
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-bold text-xl">{challenge.name}</Text>
                <Text className="text-gray-500 text-sm mt-1">
                  by {formatAddress(challenge.creator || challenge.owner)}
                </Text>
              </View>
              <View className={`px-3 py-1.5 rounded-full ${
                isActive 
                  ? (daysLeft <= 3 ? 'bg-red-100' : daysLeft <= 7 ? 'bg-orange-100' : 'bg-green-100')
                  : 'bg-gray-100'
              }`}>
                <Text className={`text-xs font-bold ${
                  isActive
                    ? (daysLeft <= 3 ? 'text-red-700' : daysLeft <= 7 ? 'text-orange-700' : 'text-green-700')
                    : 'text-gray-700'
                }`}>
                  {isActive ? `${daysLeft}d left` : 'Completed'}
                </Text>
              </View>
            </View>

            {/* Total Staked */}
            <View className="bg-gray-50 rounded-xl p-4 items-center">
              <Text className="text-gray-500 text-sm mb-1">Total Amount Staked</Text>
              <Text className="text-pink-600 font-black text-3xl">{totalStaked} ETH</Text>
            </View>
          </View>

          {/* Challenge Details */}
          <View 
            className="bg-white rounded-2xl p-6 border border-gray-100 mb-6"
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
              <MaterialIcons name="info" size={20} color="#EC4899" />
              <Text className="text-gray-900 font-bold text-lg ml-2">Challenge Details</Text>
            </View>
            
            <View className="space-y-4">
              <DetailRow 
                icon={<FontAwesome5 name="coins" size={16} color="#EC4899" />}
                label="Stake Amount" 
                value={`${challenge.stakeAmount} ETH`} 
              />
              <DetailRow 
                icon={<Feather name="calendar" size={16} color="#EC4899" />}
                label="Start Date" 
                value={formatDate(challenge.startDate || challenge.startTime)} 
              />
              <DetailRow 
                icon={<MaterialCommunityIcons name="flag-checkered" size={16} color="#EC4899" />}
                label="End Date" 
                value={formatDate(challenge.deadline || challenge.endTime)} 
              />
              <DetailRow 
                icon={<Ionicons name="time" size={16} color="#EC4899" />}
                label="Status" 
                value={isActive ? 'Active' : 'Completed'} 
                valueColor={isActive ? 'text-green-600' : 'text-gray-600'}
              />
              <DetailRow 
                icon={<MaterialIcons name="flag" size={16} color="#EC4899" />}
                label="Target Distance" 
                value={`${challenge.targetDistance} ${challenge.unit || 'km'}`} 
              />
              <DetailRow 
                icon={<Feather name="clock" size={16} color="#EC4899" />}
                label="Duration" 
                value={`${challenge.duration || 'N/A'} days`} 
              />
              <DetailRow 
                icon={<Ionicons name="bicycle" size={16} color="#EC4899" />}
                label="Activity Type" 
                value={challenge.activityType || 'N/A'} 
              />
              <DetailRow 
                icon={<Ionicons name="people" size={16} color="#EC4899" />}
                label="Participants" 
                value={`${challenge.participants || participants.length}`} 
              />
            </View>
          </View>

          {/* Participants List */}
          <View 
            className="bg-white rounded-2xl p-6 border border-gray-100 mb-6"
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
              <Ionicons name="people" size={20} color="#EC4899" />
              <Text className="text-gray-900 font-bold text-lg ml-2">
                Participants ({participants.length})
              </Text>
            </View>

            {participants.length === 0 ? (
              <View className="items-center py-8">
                <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 text-center mt-3">No participants yet</Text>
              </View>
            ) : (
              <>
              <View className="space-y-3">
                {participants.map((participant, index) => (
                  <ParticipantCard
                  key={participant.address}
                  participant={participant}
                  index={index}
                  isCurrentUser={participant.address.toLowerCase() === account?.toLowerCase()}
                  />
                ))}
              </View>
              </>
            )}
          </View>

          {/* Withdraw Button */}
          {!isActive && (
            <TouchableOpacity
              className="bg-green-600 py-4 rounded-xl shadow-sm mb-6"
              onPress={handleWithdraw}
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
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// Detail Row Component
function DetailRow({ icon, label, value, valueColor = 'text-gray-900' }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <View className="flex-row items-center flex-1">
        <View className="w-6">
          {icon}
        </View>
        <Text className="text-gray-600 text-sm font-medium ml-2">{label}</Text>
      </View>
      <Text className={`${valueColor} font-bold text-sm`}>{value}</Text>
    </View>
  );
}

// Participant Card Component
function ParticipantCard({ participant, index, isCurrentUser }) {
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      delay: index * 50,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{ transform: [{ translateX: slideAnim }] }}
      className={`bg-gray-50 rounded-xl p-4 ${
        isCurrentUser ? 'border-2 border-pink-200' : ''
      }`}
    >
      {/* User Address */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <View className="flex-row items-center">
            {isCurrentUser ? (
              <View className="flex-row items-center">
                <Ionicons name="person" size={16} color="#EC4899" />
                <Text className="text-gray-900 font-bold text-base ml-1">You</Text>
              </View>
            ) : (
              <Text className="text-gray-900 font-bold text-base">
                Participant {index + 1}
              </Text>
            )}
            {isCurrentUser && (
              <TouchableOpacity
                className="ml-2 bg-blue-500 px-2 py-1 rounded"
                onPress={() => {
                  console.log('Verify activity:', participant);
                }}
              >
                <Text className="text-white text-xs font-semibold">Verify</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text className="text-gray-500 text-xs mt-1">
            {formatAddress(participant.address)}
          </Text>
        </View>
        <Text className="text-gray-900 font-bold text-sm">
          {participant.stakedAmount} ETH
        </Text>
      </View>

      {/* Completed Today Status */}
      <View className={`flex-row items-center justify-between p-3 rounded-lg ${
        participant.completedToday ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <Text className="text-gray-700 text-xs font-medium">Today's Goal</Text>
        <View className="flex-row items-center">
          {participant.completedToday ? (
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
              <Text className="text-green-700 text-xs font-bold ml-1">Completed</Text>
            </View>
          ) : (
            <View className="flex-row items-center">
              <Ionicons name="close-circle" size={14} color="#dc2626" />
              <Text className="text-red-700 text-xs font-bold ml-1">Not Completed</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}