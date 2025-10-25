import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWeb3 } from '../context/Web3Context';
import { useStrava } from '../context/StravaContext';
import { ethers } from 'ethers';
import { useNavigation } from '@react-navigation/native';
import envioService from '../services/envioService';

const Profile = () => {
  const navigation = useNavigation();
  const { account, getProvider, isConnected: walletConnected } = useWeb3();
  const { 
    isConnected: stravaConnected, 
    getAthleteProfile, 
    getRecentActivities,
    fetchAllStravaData,
    getDataSummary 
  } = useStrava();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState('0.0');
  const [walletAddress, setWalletAddress] = useState('');
  const [challengeStats, setChallengeStats] = useState({
    created: 0,
    participated: 0,
    active: 0,
    won: 0,
    totalWinnings: '0.0',
  });
  const [athlete, setAthlete] = useState(null);
  const [stravaStats, setStravaStats] = useState({
    recentActivities: [],
    totalDistance: 0,
    avgSpeed: 0,
    maxSpeed: 0,
    totalActivities: 0,
  });

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

    loadProfileData();
  }, [account]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      // Load wallet data
      if (account && walletConnected) {
        await loadWalletData();
        await loadChallengeStats();
      }
      
      // Load Strava data
      if (stravaConnected) {
        await loadStravaData();
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWalletData = async () => {
    try {
      setWalletAddress(account);
      const provider = getProvider();
      const balanceWei = await provider.getBalance(account);
      const balanceEth = ethers.formatEther(balanceWei);
      setBalance(parseFloat(balanceEth).toFixed(4));
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

  const loadChallengeStats = async () => {
    try {
      // Fetch all challenges created by this user
      const allChallenges = await envioService.getAllChallenges();
      const createdChallenges = allChallenges.ChallengerContract_ChallengeCreated?.filter(
        c => c.creator.toLowerCase() === account.toLowerCase()
      ) || [];
      
      // Fetch all challenges user joined
      const joinedData = await envioService.getUserJoined({ user: account });
      const joinedChallenges = joinedData.ChallengerContract_UserJoined || [];
      
      // Fetch winnings
      const winningsData = await envioService.getWinningsDistributed({ user: account });
      const winnings = winningsData.ChallengerContract_WinningsDistributed || [];
      
      // Count active challenges (non-finalized)
      const activeCount = joinedChallenges.filter(j => {
        const challenge = allChallenges.ChallengerContract_ChallengeCreated?.find(
          c => c.challengeId === j.challengeId
        );
        return challenge && !challenge.finalized;
      }).length;
      
      // Calculate total winnings
      const totalWinnings = winnings.reduce((sum, w) => {
        return sum + parseFloat(ethers.formatEther(w.amount || '0'));
      }, 0);
      
      setChallengeStats({
        created: createdChallenges.length,
        participated: joinedChallenges.length,
        active: activeCount,
        won: winnings.length,
        totalWinnings: totalWinnings.toFixed(4),
      });
    } catch (error) {
      console.error('Error loading challenge stats:', error);
    }
  };

  const loadStravaData = async () => {
    try {
      const [profile, activities] = await Promise.all([
        getAthleteProfile(),
        getRecentActivities(1, 10),
      ]);
      
      setAthlete(profile);
      
      if (activities && activities.length > 0) {
        const totalDistance = activities.reduce((sum, a) => sum + (a.distance || 0), 0);
        const speeds = activities
          .filter(a => a.average_speed)
          .map(a => a.average_speed);
        const avgSpeed = speeds.length > 0 
          ? speeds.reduce((sum, s) => sum + s, 0) / speeds.length 
          : 0;
        const maxSpeed = Math.max(...activities.map(a => a.max_speed || 0));
        
        setStravaStats({
          recentActivities: activities.slice(0, 5),
          totalDistance,
          avgSpeed,
          maxSpeed,
          totalActivities: activities.length,
        });
      }
    } catch (error) {
      console.error('Error loading Strava data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  const formatAddress = (address) => {
    if (!address) return 'Not Connected';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatDistance = (meters) => {
    return (meters / 1000).toFixed(2);
  };

  const formatSpeed = (mps) => {
    return (mps * 3.6).toFixed(1);
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1 items-center justify-center"
      >
        <ActivityIndicator size="large" color="#fff" />
        <Text className="text-white text-base mt-3">Loading profile...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        <View className="px-6 pt-16">
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            {/* Header */}
            <View className="mb-8 items-center">
              <View className="bg-white/20 backdrop-blur-xl rounded-full p-6 mb-6 shadow-lg">
                <Text className="text-6xl">👤</Text>
              </View>
              <Text className="text-4xl font-black text-white mb-3 text-center">
                Profile
              </Text>
              {athlete && (
                <Text className="text-white/90 text-center text-lg font-bold">
                  {athlete.firstname} {athlete.lastname}
                </Text>
              )}
            </View>

            {/* Wallet Section */}
            {walletConnected && (
              <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl mb-6">
                <View className="flex-row items-center justify-between mb-5">
                  <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                    Wallet Information
                  </Text>
                  <View className="bg-green-500/20 px-3 py-1.5 rounded-full border border-green-500/30">
                    <Text className="text-green-700 text-xs font-bold">● Connected</Text>
                  </View>
                </View>

                <InfoRow label="Address" value={formatAddress(walletAddress)} />
                <InfoRow label="Balance" value={`${balance} ETH`} icon="💰" />
              </View>
            )}

            {/* Challenge Statistics */}
            {walletConnected && (
              <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl mb-6">
                <View className="flex-row items-center justify-between mb-5">
                  <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                    Challenge Statistics
                  </Text>
                  <Text className="text-purple-600 text-2xl">🏆</Text>
                </View>

                <StatCard icon="🎯" label="Created" value={challengeStats.created} />
                <StatCard icon="🏃" label="Participated" value={challengeStats.participated} />
                <StatCard icon="⚡" label="Active" value={challengeStats.active} />
                <StatCard icon="💰" label="Won" value={challengeStats.won} />
                <InfoRow 
                  label="Total Winnings" 
                  value={`${challengeStats.totalWinnings} ETH`} 
                  highlight 
                />
              </View>
            )}

            {/* Strava Section */}
            {stravaConnected && athlete && (
              <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl mb-6">
                <View className="flex-row items-center justify-between mb-5">
                  <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                    Strava Profile
                  </Text>
                  <View className="bg-orange-500/20 px-3 py-1.5 rounded-full border border-orange-500/30">
                    <Text className="text-orange-700 text-xs font-bold">● Connected</Text>
                  </View>
                </View>

                <View className="bg-gradient-to-r from-orange-50 to-red-50 p-5 rounded-2xl mb-4">
                  <Text className="text-gray-900 font-black text-2xl mb-2">
                    {athlete.firstname} {athlete.lastname}
                  </Text>
                  {athlete.username && (
                    <Text className="text-orange-600 font-bold text-base mb-2">
                      @{athlete.username}
                    </Text>
                  )}
                  {athlete.city && athlete.country && (
                    <Text className="text-gray-500 text-sm">
                      📍 {athlete.city}, {athlete.country}
                    </Text>
                  )}
                </View>

                {/* Strava Stats */}
                {stravaStats.totalActivities > 0 && (
                  <View className="border-t border-gray-200 pt-4 mt-2">
                    <Text className="text-gray-700 font-bold text-sm mb-3">📊 Recent Activity Stats:</Text>
                    
                    <InfoRow 
                      label="Total Distance (Last 10)" 
                      value={`${formatDistance(stravaStats.totalDistance)} km`} 
                    />
                    <InfoRow 
                      label="Average Speed" 
                      value={`${formatSpeed(stravaStats.avgSpeed)} km/h`} 
                    />
                    <InfoRow 
                      label="Max Speed" 
                      value={`${formatSpeed(stravaStats.maxSpeed)} km/h`} 
                    />
                    <InfoRow 
                      label="Activities Tracked" 
                      value={stravaStats.totalActivities} 
                    />
                  </View>
                )}
              </View>
            )}

            {/* Recent Activities List */}
            {stravaConnected && stravaStats.recentActivities.length > 0 && (
              <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl mb-6">
                <Text className="text-gray-900 font-bold text-lg mb-4">
                  Recent Activities 🏃
                </Text>

                <View className="space-y-3">
                  {stravaStats.recentActivities.map((activity, index) => (
                    <ActivityCard key={activity.id} activity={activity} index={index} />
                  ))}
                </View>
              </View>
            )}

            {/* Not Connected States */}
            {!walletConnected && !stravaConnected && (
              <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl mb-6">
                <Text className="text-gray-700 font-bold text-center mb-4">
                  Connect Your Accounts
                </Text>
                <Text className="text-gray-500 text-sm text-center mb-4">
                  Connect your wallet and Strava account to see your full profile
                </Text>
                <TouchableOpacity
                  className="bg-purple-600 px-6 py-3 rounded-xl"
                  onPress={() => navigation.navigate('ConnectWallet')}
                >
                  <Text className="text-white font-bold text-center">Connect Wallet</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Back Button */}
            <TouchableOpacity
              className="bg-white/10 backdrop-blur-xl px-8 py-4 rounded-2xl border border-white/20 mt-6"
              onPress={() => navigation.goBack()}
            >
              <Text className="text-white/80 font-bold text-base text-center">
                ← Back
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

function InfoRow({ label, value, icon, highlight }) {
  return (
    <View className={`flex-row items-center justify-between py-3 border-b border-gray-200 ${highlight ? 'bg-green-50 px-3 rounded-lg' : ''}`}>
      <View className="flex-row items-center flex-1">
        {icon && <Text className="text-lg mr-2">{icon}</Text>}
        <Text className={`text-gray-700 font-semibold text-sm ${highlight ? 'font-bold' : ''}`}>
          {label}
        </Text>
      </View>
      <Text className={`text-gray-900 font-bold text-sm ${highlight ? 'text-green-700' : ''}`}>
        {value}
      </Text>
    </View>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-200">
      <View className="flex-row items-center">
        <Text className="text-2xl mr-3">{icon}</Text>
        <Text className="text-gray-700 font-semibold text-sm">{label}</Text>
      </View>
      <Text className="text-purple-600 font-black text-lg">{value}</Text>
    </View>
  );
}

function ActivityCard({ activity, index }) {
  const formatDistance = (distance) => {
    return (distance / 1000).toFixed(2);
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getActivityIcon = (type) => {
    const icons = {
      'Run': '🏃',
      'Ride': '🚴',
      'Walk': '🚶',
      'Swim': '🏊',
      'Hike': '🥾',
      'Workout': '💪',
    };
    return icons[type] || '🏃';
  };

  return (
    <View className="bg-gray-50 p-4 rounded-xl mb-2 border border-gray-200">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="text-base mr-2">{getActivityIcon(activity.type)}</Text>
            <Text className="text-gray-900 font-bold text-base flex-1" numberOfLines={1}>
              {activity.name}
            </Text>
          </View>
          <Text className="text-gray-500 text-xs">
            {new Date(activity.start_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
        </View>
      </View>
      
      <View className="flex-row items-center justify-between pt-2 border-t border-gray-200">
        <View className="flex-row items-center">
          <View className="bg-blue-100 px-3 py-1 rounded-full mr-2">
            <Text className="text-blue-700 text-xs font-bold">
              {formatDistance(activity.distance)} km
            </Text>
          </View>
          <View className="bg-purple-100 px-3 py-1 rounded-full">
            <Text className="text-purple-700 text-xs font-bold">
              {formatDuration(activity.moving_time)}
            </Text>
          </View>
        </View>
        {activity.average_speed && (
          <Text className="text-gray-500 text-xs">
            ⚡ {(activity.average_speed * 3.6).toFixed(1)} km/h
          </Text>
        )}
      </View>
    </View>
  );
}

export default Profile; 