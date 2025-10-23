import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWeb3 } from '../context/Web3Context';
import { useNavigation } from '@react-navigation/native';
import { createChallenge as createChallengeContract } from '../services/contract';
import { getActivityIcon, formatDuration } from '../utils/helpers';

export default function CreateChallenge() {
  const navigation = useNavigation();
  const { account, isConnected, getSigner } = useWeb3();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Form state
  const [challengeName, setChallengeName] = useState('');
  const [activityType, setActivityType] = useState('running');
  const [targetDistance, setTargetDistance] = useState('');
  const [duration, setDuration] = useState('7');
  const [stakeAmount, setStakeAmount] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const activityTypes = [
    { id: 'running', name: 'Running', icon: '🏃', unit: 'km' },
    { id: 'cycling', name: 'Cycling', icon: '🚴', unit: 'km' },
    { id: 'walking', name: 'Walking', icon: '🚶', unit: 'km' },
    { id: 'swimming', name: 'Swimming', icon: '🏊', unit: 'km' },
  ];

  const durationOptions = [
    { value: '7', label: '7 Days' },
    { value: '14', label: '14 Days' },
    { value: '30', label: '30 Days' },
    { value: '60', label: '60 Days' },
  ];

  const handleCreateChallenge = async () => {
    // Validation
    if (!challengeName.trim()) {
      Alert.alert('Error', 'Please enter a challenge name');
      return;
    }
    if (!targetDistance || parseFloat(targetDistance) <= 0) {
      Alert.alert('Error', 'Please enter a valid target distance');
      return;
    }
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid stake amount');
      return;
    }

    if (!isConnected) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    setIsCreating(true);

    try {
      const signer = getSigner();
      const challengeData = {
        description: challengeName,
        activityType,
        targetDistance: parseFloat(targetDistance),
        duration: parseInt(duration),
        stakeAmount: parseFloat(stakeAmount),
      };
      
      const result = await createChallengeContract(signer, challengeData);
      
      Alert.alert(
        'Challenge Created! 🎉',
        `Your "${challengeName}" challenge has been created successfully!\n\nTransaction: ${result.transactionHash.substring(0, 10)}...${result.transactionHash.substring(result.transactionHash.length - 8)}${result.challengeId ? `\n\nChallenge ID: ${result.challengeId}` : ''}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );

      // Reset form
      setChallengeName('');
      setTargetDistance('');
      setStakeAmount('');
    } catch (error) {
      console.error('Error creating challenge:', error);
      Alert.alert('Error', error.message || 'Failed to create challenge. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const selectedActivity = activityTypes.find(a => a.id === activityType);

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                <Text className="text-white text-3xl font-black">Create Challenge</Text>
                <Text className="text-white/70 text-sm mt-1">Set your fitness goal</Text>
              </View>
            </View>

            {/* Form Container */}
            <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl">
              {/* Challenge Name */}
              <View className="mb-6">
                <Text className="text-gray-700 font-bold text-sm mb-2 uppercase tracking-wide">
                  Challenge Name
                </Text>
                <TextInput
                  className="bg-gray-50 px-4 py-4 rounded-xl text-gray-900 text-base font-medium"
                  placeholder="e.g., Marathon Month Challenge"
                  placeholderTextColor="#9CA3AF"
                  value={challengeName}
                  onChangeText={setChallengeName}
                />
              </View>

              {/* Activity Type */}
              <View className="mb-6">
                <Text className="text-gray-700 font-bold text-sm mb-3 uppercase tracking-wide">
                  Activity Type
                </Text>
                <View className="flex-row flex-wrap -mx-2">
                  {activityTypes.map((activity) => (
                    <TouchableOpacity
                      key={activity.id}
                      onPress={() => setActivityType(activity.id)}
                      className="w-1/2 px-2 mb-3"
                    >
                      <View
                        className={`p-4 rounded-xl items-center ${
                          activityType === activity.id
                            ? 'bg-purple-600'
                            : 'bg-gray-50'
                        }`}
                      >
                        <Text className="text-3xl mb-2">{activity.icon}</Text>
                        <Text
                          className={`font-bold text-sm ${
                            activityType === activity.id ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          {activity.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Target Distance */}
              <View className="mb-6">
                <Text className="text-gray-700 font-bold text-sm mb-2 uppercase tracking-wide">
                  Target Distance ({selectedActivity?.unit})
                </Text>
                <View className="flex-row items-center bg-gray-50 rounded-xl overflow-hidden">
                  <TextInput
                    className="flex-1 px-4 py-4 text-gray-900 text-base font-medium"
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                    value={targetDistance}
                    onChangeText={setTargetDistance}
                  />
                  <View className="bg-purple-100 px-4 py-4">
                    <Text className="text-purple-700 font-bold">{selectedActivity?.unit}</Text>
                  </View>
                </View>
              </View>

              {/* Duration */}
              <View className="mb-6">
                <Text className="text-gray-700 font-bold text-sm mb-3 uppercase tracking-wide">
                  Duration
                </Text>
                <View className="flex-row flex-wrap -mx-1">
                  {durationOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setDuration(option.value)}
                      className="w-1/4 px-1 mb-2"
                    >
                      <View
                        className={`py-3 rounded-xl items-center ${
                          duration === option.value ? 'bg-purple-600' : 'bg-gray-50'
                        }`}
                      >
                        <Text
                          className={`font-bold text-sm ${
                            duration === option.value ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          {option.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Stake Amount */}
              <View className="mb-6">
                <Text className="text-gray-700 font-bold text-sm mb-2 uppercase tracking-wide">
                  Stake Amount
                </Text>
                <View className="flex-row items-center bg-gray-50 rounded-xl overflow-hidden">
                  <TextInput
                    className="flex-1 px-4 py-4 text-gray-900 text-base font-medium"
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                    value={stakeAmount}
                    onChangeText={setStakeAmount}
                  />
                  <View className="bg-purple-100 px-4 py-4">
                    <Text className="text-purple-700 font-bold">ETH</Text>
                  </View>
                </View>
                <Text className="text-gray-500 text-xs mt-2">
                  You'll get your stake back + rewards if you complete the challenge
                </Text>
              </View>

              {/* Summary Card */}
              <View className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl mb-6">
                <Text className="text-gray-700 font-bold text-sm mb-3">Challenge Summary</Text>
                <SummaryRow label="Activity" value={selectedActivity?.name} />
                <SummaryRow label="Target" value={`${targetDistance || '0'} ${selectedActivity?.unit}`} />
                <SummaryRow label="Duration" value={`${duration} days`} />
                <SummaryRow label="Stake" value={`${stakeAmount || '0'} ETH`} />
              </View>

              {/* Create Button */}
              <TouchableOpacity
                className="bg-purple-600 py-5 rounded-2xl shadow-xl border border-purple-700"
                onPress={handleCreateChallenge}
                disabled={isCreating}
                activeOpacity={0.8}
              >
                {isCreating ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator color="white" size="small" />
                    <Text className="text-white font-bold text-lg ml-3">Creating...</Text>
                  </View>
                ) : (
                  <Text className="text-white font-bold text-lg text-center ">
                    Create Challenge
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Info Card */}
            <View className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 mt-4 border border-white/20">
              <Text className="text-white font-bold text-sm mb-2">💡 How it works</Text>
              <Text className="text-white/80 text-xs leading-5">
                • Your stake is locked in a smart contract{'\n'}
                • Complete your target within the duration{'\n'}
                • Connect Strava to verify your activities{'\n'}
                • Get your stake back + rewards upon completion
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// Summary Row Component
function SummaryRow({ label, value }) {
  return (
    <View className="flex-row justify-between items-center mb-2 last:mb-0">
      <Text className="text-gray-600 text-sm">{label}</Text>
      <Text className="text-gray-900 font-bold text-sm">{value}</Text>
    </View>
  );
}
