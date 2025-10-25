import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

export default function Challenge() {
  const navigation = useNavigation();
  const route = useRoute();
  const { account, getProvider } = useWeb3();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const { challenge: initialChallenge } = route.params || {};
  
  const [challenge, setChallenge] = useState(initialChallenge);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalStaked, setTotalStaked] = useState('0');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

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
    const endTime = challengeData.endTime;
    setIsActive(endTime && endTime > now);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleWithdraw = () => {
    // Placeholder function - to be implemented later
    Alert.alert('Withdraw', 'Withdraw function will be implemented soon');
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1 items-center justify-center"
      >
        <ActivityIndicator size="large" color="#fff" />
        <Text className="text-white text-base mt-3">Loading challenge...</Text>
      </LinearGradient>
    );
  }

  if (!challenge) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1 items-center justify-center"
      >
        <Text className="text-white text-xl mb-4">Challenge not found</Text>
        <TouchableOpacity
          className="bg-white px-6 py-3 rounded-xl"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-purple-600 font-bold">Go Back</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const daysLeft = getDaysLeft(challenge.deadline || challenge.endTime);

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
              <Text className="text-white text-3xl font-black">
                {challenge.name || 'Challenge Details'}
              </Text>
              <Text className="text-white/70 text-sm mt-1">
                ID: {challenge.challengeId || challenge.id}
              </Text>
            </View>
            <TouchableOpacity
              onPress={loadChallengeDetails}
              className="bg-white/20 p-3 rounded-xl"
            >
              <Text className="text-white text-lg">🔄</Text>
            </TouchableOpacity>
          </View>

          {/* Total Amount Staked */}
          <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-xl mb-6 items-center">
            <Text className="text-gray-500 text-sm mb-2">Total Amount Staked</Text>
            <Text className="text-purple-600 font-black text-4xl">{totalStaked} ETH</Text>
          </View>

          {/* Challenge Details */}
          <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-xl mb-6">
            <Text className="text-gray-900 font-black text-xl mb-4 text-center">
              Challenge Details
            </Text>
            
            <View className="space-y-3">
              <DetailRow label="Stake Amount (Each)" value={`${challenge.stakeAmount} ETH`} />
              <DetailRow label="Start Date" value={formatDate(challenge.startTime)} />
              <DetailRow label="End Date" value={formatDate(challenge.endTime)} />
              <DetailRow 
                label="Is Active" 
                value={isActive ? 'Yes' : 'No'} 
                valueColor={isActive ? 'text-green-600' : 'text-red-600'}
              />
              <DetailRow label="Total Distance" value={`${challenge.targetDistance} ${challenge.unit || 'km'}`} />
              <DetailRow label="Days" value={`${challenge.duration || 'N/A'} days`} />
              <DetailRow label="Activity Type" value={challenge.activityType || 'N/A'} />
            </View>
          </View>

          {/* Participants List */}
          <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-xl mb-6">
            <Text className="text-gray-900 font-black text-xl mb-4">
              Participants ({participants.length})
            </Text>

            {participants.length === 0 ? (
              <Text className="text-gray-500 text-center py-8">No participants yet</Text>
            ) : (
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
            )}
          </View>

          {/* Withdraw Button */}
          {!isActive && (
            <TouchableOpacity
              className="bg-gradient-to-r from-green-500 to-emerald-500 py-4 rounded-2xl shadow-lg mb-6"
              onPress={handleWithdraw}
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-lg text-center">
                Withdraw Winnings 💰
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

// Detail Row Component
function DetailRow({ label, value, valueColor = 'text-gray-900' }) {
  return (
    <View className="flex-row items-center justify-between py-2 border-b border-gray-200">
      <Text className="text-gray-600 text-sm font-medium">{label}</Text>
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
      className={`bg-gray-50 rounded-xl p-4 mb-2 ${
        isCurrentUser ? 'border-2 border-purple-200' : ''
      }`}
    >
      {/* User Address */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1">
          <Text className="text-purple-600 font-bold text-base">
            {isCurrentUser ? 'You' : `Participant ${index + 1}`}
          </Text>
          <Text className="text-gray-500 text-xs mt-1">
            {formatAddress(participant.address)}
          </Text>
        </View>
        <Text className="text-gray-900 font-bold text-sm">
          {participant.stakedAmount} ETH
        </Text>
      </View>

      {/* Completed Today Status */}
      <View className={`flex-row items-center justify-between p-2 rounded-lg ${
        participant.completedToday ? 'bg-green-100' : 'bg-red-100'
      }`}>
        <Text className="text-gray-700 text-xs font-medium">Today's Goal</Text>
        <View className="flex-row items-center">
          {participant.completedToday ? (
            <>
              <Text className="text-green-700 text-xs font-bold mr-1">✓ Completed</Text>
            </>
          ) : (
            <>
              <Text className="text-red-700 text-xs font-bold mr-1">✗ Not Completed</Text>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
