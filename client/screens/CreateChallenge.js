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
import { StatusBar } from 'expo-status-bar';
import { useWeb3 } from '../context/Web3Context';
import { useNavigation } from '@react-navigation/native';
import { createChallenge as createChallengeContract } from '../services/contract';
import { getActivityIcon, formatDuration } from '../utils/helpers';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

export default function CreateChallenge() {
  const navigation = useNavigation();
  const { account, isConnected, getSigner, getWalletConnectInfo } = useWeb3();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Form state
  const [challengeName, setChallengeName] = useState('');
  const [activityType, setActivityType] = useState('running');
  const [targetDistance, setTargetDistance] = useState('');
  const [duration, setDuration] = useState('7');
  const [stakeAmount, setStakeAmount] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
    console.log('🚀 Starting challenge creation process...');
    
    // Validation
    console.log('📋 Validating form data...');
    if (!challengeName.trim()) {
      console.log('❌ Validation failed: Challenge name is empty');
      Alert.alert('Error', 'Please enter a challenge name');
      return;
    }
    if (!targetDistance || parseFloat(targetDistance) <= 0) {
      console.log('❌ Validation failed: Invalid target distance');
      Alert.alert('Error', 'Please enter a valid target distance');
      return;
    }
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      console.log('❌ Validation failed: Invalid stake amount');
      Alert.alert('Error', 'Please enter a valid stake amount');
      return;
    }

    if (!isConnected) {
      console.log('❌ Validation failed: Wallet not connected');
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    console.log('✅ Form validation passed');
    console.log('📊 Challenge data:', {
      name: challengeName,
      activityType,
      targetDistance: parseFloat(targetDistance),
      duration: parseInt(duration),
      stakeAmount: parseFloat(stakeAmount),
    });

    setIsCreating(true);
    console.log('🔄 Setting creating state to true');

    try {
      console.log('🔑 Getting signer from wallet...');
      const signer = getSigner();
      console.log('✅ Signer obtained:', {
        address: signer.address,
        provider: signer.provider ? 'Connected' : 'Not connected'
      });

      const challengeData = {
        description: challengeName,
        activityType,
        targetDistance: parseFloat(targetDistance),
        duration: parseInt(duration),
        stakeAmount: parseFloat(stakeAmount),
      };
      
      console.log('📤 Calling smart contract to create challenge...');
      console.log('📋 Challenge data being sent:', challengeData);
      console.log('⚠️ IMPORTANT: Check MetaMask - you should see a transaction approval prompt!');
      console.log('📱 If MetaMask is not open, open it manually and look for the pending transaction');
      
      // Get WalletConnect info for direct transaction
      const walletConnectInfo = getWalletConnectInfo();
      console.log('🔗 Using WalletConnect for transaction:', {
        hasSignClient: !!walletConnectInfo.signClient,
        sessionTopic: walletConnectInfo.session.topic,
        account: walletConnectInfo.account,
        chainId: walletConnectInfo.chainId
      });
      
      const result = await createChallengeContract(signer, challengeData, walletConnectInfo);
      
      console.log('✅ Challenge creation successful!');
      console.log('📄 Result:', {
        success: result.success,
        transactionHash: result.transactionHash,
        challengeId: result.challengeId
      });
      
      Alert.alert(
        'Challenge Created! 🎉',
        `Your "${challengeName}" challenge has been created successfully!\n\nTransaction: ${result.transactionHash.substring(0, 10)}...${result.transactionHash.substring(result.transactionHash.length - 8)}${result.challengeId ? `\n\nChallenge ID: ${result.challengeId}` : ''}`,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('🏠 Navigating to Home screen');
              navigation.navigate('Home');
            },
          },
        ]
      );

      // Reset form
      console.log('🧹 Resetting form fields');
      setChallengeName('');
      setTargetDistance('');
      setStakeAmount('');
    } catch (error) {
      console.error('❌ Error creating challenge:', error);
      console.error('❌ Error details:', {
        message: error.message,
        reason: error.reason,
        code: error.code,
        stack: error.stack
      });
      Alert.alert('Error', error.message || 'Failed to create challenge. Please try again.');
    } finally {
      console.log('🏁 Challenge creation process completed');
      setIsCreating(false);
    }
  };

  const selectedActivity = activityTypes.find(a => a.id === activityType);

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
            <Text className="text-gray-900 font-bold text-2xl">Create Challenge</Text>
            <Text className="text-pink-600 text-sm font-medium mt-1">
              Set your fitness goal and stake
            </Text>
          </View>
          
          <View className="w-10 h-10" /> {/* Spacer for balance */}
        </View>
      </LinearGradient>

      {/* Body */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
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
            {/* Form Container */}
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
              {/* Challenge Name */}
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="create-outline" size={18} color="#EC4899" />
                  <Text className="text-gray-700 font-bold text-base ml-2">Challenge Name</Text>
                </View>
                <TextInput
                  className="bg-gray-50 px-4 py-4 rounded-xl text-gray-900 text-base font-medium border border-gray-200"
                  placeholder="e.g., Marathon Month Challenge"
                  placeholderTextColor="#9CA3AF"
                  value={challengeName}
                  onChangeText={setChallengeName}
                />
              </View>

              {/* Activity Type */}
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <MaterialCommunityIcons name="run-fast" size={18} color="#EC4899" />
                  <Text className="text-gray-700 font-bold text-base ml-2">Activity Type</Text>
                </View>
                <View className="flex-row flex-wrap -mx-1">
                  {activityTypes.map((activity) => (
                    <TouchableOpacity
                      key={activity.id}
                      onPress={() => setActivityType(activity.id)}
                      className="w-1/2 px-1 mb-2"
                    >
                      <View
                        className={`p-4 rounded-xl border-2 ${
                          activityType === activity.id
                            ? 'bg-pink-50 border-pink-500'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <Text className="text-3xl mb-2 text-center">{activity.icon}</Text>
                        <Text
                          className={`font-bold text-sm text-center ${
                            activityType === activity.id ? 'text-pink-700' : 'text-gray-700'
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
                <View className="flex-row items-center mb-3">
                  <MaterialIcons name="flag" size={18} color="#EC4899" />
                  <Text className="text-gray-700 font-bold text-base ml-2">
                    Target Distance ({selectedActivity?.unit})
                  </Text>
                </View>
                <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                  <TextInput
                    className="flex-1 px-4 py-4 text-gray-900 text-base font-medium"
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                    value={targetDistance}
                    onChangeText={setTargetDistance}
                  />
                  <View className="bg-pink-100 px-4 py-4 border-l border-pink-200">
                    <Text className="text-pink-700 font-bold">{selectedActivity?.unit}</Text>
                  </View>
                </View>
              </View>

              {/* Duration */}
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Feather name="clock" size={18} color="#EC4899" />
                  <Text className="text-gray-700 font-bold text-base ml-2">Duration</Text>
                </View>
                <View className="flex-row flex-wrap -mx-1">
                  {durationOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setDuration(option.value)}
                      className="w-1/2 px-1 mb-2"
                    >
                      <View
                        className={`py-4 rounded-xl border-2 ${
                          duration === option.value ? 'bg-pink-50 border-pink-500' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <Text
                          className={`font-bold text-sm text-center ${
                            duration === option.value ? 'text-pink-700' : 'text-gray-700'
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
                <View className="flex-row items-center mb-3">
                  <FontAwesome5 name="coins" size={16} color="#EC4899" />
                  <Text className="text-gray-700 font-bold text-base ml-2">Stake Amount</Text>
                </View>
                <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                  <TextInput
                    className="flex-1 px-4 py-4 text-gray-900 text-base font-medium"
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                    value={stakeAmount}
                    onChangeText={setStakeAmount}
                  />
                  <View className="bg-pink-100 px-4 py-4 border-l border-pink-200">
                    <Text className="text-pink-700 font-bold">ETH</Text>
                  </View>
                </View>
                <Text className="text-gray-500 text-xs mt-2">
                  You'll get your stake back + rewards if you complete the challenge
                </Text>
              </View>

              {/* Summary Card */}
              <View className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="document-text-outline" size={18} color="#EC4899" />
                  <Text className="text-gray-700 font-bold text-base ml-2">Challenge Summary</Text>
                </View>
                <SummaryRow label="Activity" value={selectedActivity?.name} />
                <SummaryRow label="Target" value={`${targetDistance || '0'} ${selectedActivity?.unit}`} />
                <SummaryRow label="Duration" value={`${duration} days`} />
                <SummaryRow label="Stake" value={`${stakeAmount || '0'} ETH`} />
              </View>

              {/* Create Button */}
              <TouchableOpacity
                className="bg-pink-600 py-4 rounded-xl shadow-sm border border-pink-700"
                onPress={handleCreateChallenge}
                disabled={isCreating}
                activeOpacity={0.8}
              >
                {isCreating ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator color="white" size="small" />
                    <Text className="text-white font-bold text-base ml-2">Creating Challenge...</Text>
                  </View>
                ) : (
                  <Text className="text-white font-bold text-base text-center">
                    Create Challenge
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Info Card */}
            <View 
              className="bg-white rounded-2xl p-5 border border-gray-100"
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
                <Text className="text-gray-900 font-bold text-base ml-2">How It Works</Text>
              </View>
              <View className="space-y-2">
                <InfoItem 
                  icon={<MaterialIcons name="lock" size={16} color="#EC4899" />}
                  text="Your stake is locked in a smart contract" 
                />
                <InfoItem 
                  icon={<MaterialIcons name="flag" size={16} color="#EC4899" />}
                  text="Complete your target within the duration" 
                />
                <InfoItem 
                  icon={<FontAwesome5 name="strava" size={16} color="#EC4899" />}
                  text="Connect Strava to verify your activities" 
                />
                <InfoItem 
                  icon={<FontAwesome5 name="coins" size={16} color="#EC4899" />}
                  text="Get your stake back + rewards upon completion" 
                />
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Summary Row Component
function SummaryRow({ label, value }) {
  return (
    <View className="flex-row justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
      <Text className="text-gray-600 text-sm">{label}</Text>
      <Text className="text-gray-900 font-bold text-sm">{value}</Text>
    </View>
  );
}

// Info Item Component
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