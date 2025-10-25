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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWeb3 } from '../context/Web3Context';
import { useStrava } from '../context/StravaContext';
import { ethers } from 'ethers';
import { useNavigation } from '@react-navigation/native';
import * as envioService from '../services/envioService';

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
  const [dataLoaded, setDataLoaded] = useState({
    wallet: false,
    challenges: false,
    strava: false
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
      // Reset data loaded state
      setDataLoaded({ wallet: false, challenges: false, strava: false });
      
      // Load wallet data
      if (account && walletConnected) {
        await loadWalletData();
        await loadChallengeStats();
      } else {
        setDataLoaded(prev => ({ ...prev, wallet: true, challenges: true }));
      }
      
      // Load Strava data
      if (stravaConnected) {
        await loadStravaData();
      } else {
        setDataLoaded(prev => ({ ...prev, strava: true }));
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      // Mark all as loaded even on error to prevent infinite loading
      setDataLoaded({ wallet: true, challenges: true, strava: true });
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
      setDataLoaded(prev => ({ ...prev, wallet: true }));
    } catch (error) {
      console.error('Error loading wallet data:', error);
      setDataLoaded(prev => ({ ...prev, wallet: true }));
    }
  };

  const loadChallengeStats = async () => {
    try {
      console.log('🔍 Loading challenge stats for account:', account);
      
      // Fetch comprehensive profile data with better error handling
      let profileData;
      try {
        profileData = await envioService.getProfileData(account);
        console.log('📊 Profile data received:', profileData);
      } catch (graphqlError) {
        console.warn('❌ GraphQL service unavailable, using fallback data');
        profileData = {
          challenges: [],
          joined: [],
          tasks: [],
          winnings: []
        };
      }
      
      // Process challenges created by user
      const createdChallenges = (profileData.challenges || []).filter(
        c => c.creator && c.creator.toLowerCase() === account.toLowerCase()
      );
      
      // Process joined challenges
      const joinedChallenges = (profileData.joined || []);
      
      // Process completed tasks
      const completedTasks = (profileData.tasks || []);
      
      // Process winnings
      const winnings = (profileData.winnings || []);
      
      // Get finalized challenges to determine active status
      let finalizedChallenges = { Challengercc_ChallengeFinalized: [] };
      try {
        finalizedChallenges = await envioService.getFinalizedChallenges();
      } catch (error) {
        console.warn('Could not fetch finalized challenges, assuming none');
      }
      
      const finalizedChallengeIds = new Set(
        (finalizedChallenges?.Challengercc_ChallengeFinalized || []).map(f => f.challengeId?.toString())
      );
      
      // Count active challenges (non-finalized)
      const activeCount = joinedChallenges.filter(j => {
        return j.challengeId && !finalizedChallengeIds.has(j.challengeId.toString());
      }).length;
      
      // Calculate total winnings from winnings array
      const totalWinnings = winnings.reduce((sum, w) => {
        try {
          return sum + parseFloat(ethers.formatEther(w.amount || '0'));
        } catch (e) {
          console.warn('Error parsing winning amount:', w.amount);
          return sum;
        }
      }, 0);
      
      // NEW: Calculate performance metrics from completed tasks
      const totalDistanceCompleted = completedTasks.reduce((sum, task) => {
        return sum + (parseInt(task.distance) || 0);
      }, 0);
      
      const totalDurationCompleted = completedTasks.reduce((sum, task) => {
        return sum + (parseInt(task.duration) || 0);
      }, 0);
      
      const stats = {
        created: createdChallenges.length,
        participated: joinedChallenges.length,
        active: activeCount,
        won: winnings.length,
        totalWinnings: totalWinnings.toFixed(4),
        // NEW: Add performance metrics
        totalDistanceCompleted: (totalDistanceCompleted / 1000).toFixed(2), // Convert to km
        totalDurationCompleted: formatDuration(totalDurationCompleted),
        tasksCompleted: completedTasks.length,
        averageDistancePerTask: completedTasks.length > 0 
          ? (totalDistanceCompleted / completedTasks.length / 1000).toFixed(2) 
          : '0.00',
      };
      
      console.log('✅ Challenge stats calculated:', stats);
      setChallengeStats(stats);
      setDataLoaded(prev => ({ ...prev, challenges: true }));
    } catch (error) {
      console.error('❌ Error loading challenge stats:', error);
      // Set default values on error
      setChallengeStats({
        created: 0,
        participated: 0,
        active: 0,
        won: 0,
        totalWinnings: '0.0',
        totalDistanceCompleted: '0.00',
        totalDurationCompleted: '0m',
        tasksCompleted: 0,
        averageDistancePerTask: '0.00',
      });
      setDataLoaded(prev => ({ ...prev, challenges: true }));
    }
  };

  const loadStravaData = async () => {
    try {
      console.log('🏃 Loading Strava data...');
      
      const [profile, activities] = await Promise.all([
        getAthleteProfile().catch(error => {
          console.warn('Error fetching Strava profile:', error);
          return null;
        }),
        getRecentActivities(1, 10).catch(error => {
          console.warn('Error fetching Strava activities:', error);
          return [];
        }),
      ]);
      
      console.log('👤 Strava profile loaded:', profile);
      console.log('🏃 Strava activities loaded:', activities?.length || 0);
      
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
        
        const stats = {
          recentActivities: activities.slice(0, 5),
          totalDistance,
          avgSpeed,
          maxSpeed,
          totalActivities: activities.length,
        };
        
        console.log('✅ Strava stats calculated:', stats);
        setStravaStats(stats);
      } else {
        console.log('⚠️ No Strava activities found');
        setStravaStats({
          recentActivities: [],
          totalDistance: 0,
          avgSpeed: 0,
          maxSpeed: 0,
          totalActivities: 0,
        });
      }
      setDataLoaded(prev => ({ ...prev, strava: true }));
    } catch (error) {
      console.error('❌ Error loading Strava data:', error);
      setStravaStats({
        recentActivities: [],
        totalDistance: 0,
        avgSpeed: 0,
        maxSpeed: 0,
        totalActivities: 0,
      });
      setDataLoaded(prev => ({ ...prev, strava: true }));
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

  // Helper function to format duration
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Show loading only if we're still loading essential data
  const isLoading = loading && !(dataLoaded.wallet && dataLoaded.challenges && dataLoaded.strava);

  if (isLoading) {
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

            {/* Challenge Statistics - Enhanced with Envio Data */}
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
                <StatCard icon="📊" label="Tasks Completed" value={challengeStats.tasksCompleted} />
                
                <InfoRow 
                  label="Total Winnings" 
                  value={`${challengeStats.totalWinnings} ETH`} 
                  highlight 
                />
                
                {/* NEW: Performance Metrics */}
                <View className="border-t border-gray-200 mt-4 pt-4">
                  <Text className="text-gray-700 font-bold text-sm mb-3">📈 Performance Metrics:</Text>
                  
                  <InfoRow 
                    label="Total Distance Completed" 
                    value={`${challengeStats.totalDistanceCompleted} km`} 
                    icon="📏"
                  />
                  <InfoRow 
                    label="Total Time Invested" 
                    value={challengeStats.totalDurationCompleted} 
                    icon="⏱️"
                  />
                  <InfoRow 
                    label="Avg Distance per Task" 
                    value={`${challengeStats.averageDistancePerTask} km`} 
                    icon="📊"
                  />
                </View>
                
                {challengeStats.created === 0 && challengeStats.participated === 0 && (
                  <View className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Text className="text-gray-500 text-sm text-center">
                      No challenge data found. Join or create your first challenge!
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Strava Section */}
            {stravaConnected && (
              <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl mb-6">
                <View className="flex-row items-center justify-between mb-5">
                  <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                    Strava Profile
                  </Text>
                  <View className="bg-orange-500/20 px-3 py-1.5 rounded-full border border-orange-500/30">
                    <Text className="text-orange-700 text-xs font-bold">● Connected</Text>
                  </View>
                </View>

                {athlete ? (
                  <>
                    {/* Athlete Profile Card */}
                    <View className="bg-gradient-to-r from-orange-50 to-red-50 p-5 rounded-2xl mb-4">
                      <View className="flex-row items-center mb-3">
                        {athlete.profile && (
                          <View className="w-16 h-16 rounded-full overflow-hidden mr-4 border-2 border-orange-200">
                            <Image 
                              source={{ uri: athlete.profile }} 
                              className="w-full h-full"
                              resizeMode="cover"
                            />
                          </View>
                        )}
                        <View className="flex-1">
                          <Text className="text-gray-900 font-black text-2xl mb-1">
                            {athlete.firstname} {athlete.lastname}
                          </Text>
                          {athlete.username && (
                            <Text className="text-orange-600 font-bold text-base mb-1">
                              @{athlete.username}
                            </Text>
                          )}
                          <Text className="text-gray-500 text-sm">
                            {athlete.athlete_type === 1 ? '🏃 Runner' : '🚴 Cyclist'}
                          </Text>
                        </View>
                      </View>
                      
                      {athlete.city && athlete.country && (
                        <Text className="text-gray-500 text-sm mb-2">
                          📍 {athlete.city}, {athlete.country}
                        </Text>
                      )}
                      
                      <View className="flex-row items-center justify-between mt-3">
                        <View className="flex-row items-center">
                          <Text className="text-gray-600 text-sm mr-4">
                            👥 {athlete.follower_count || 0} followers
                          </Text>
                          <Text className="text-gray-600 text-sm">
                            🤝 {athlete.friend_count || 0} friends
                          </Text>
                        </View>
                        {athlete.premium && (
                          <View className="bg-orange-500 px-2 py-1 rounded-full">
                            <Text className="text-white text-xs font-bold">PREMIUM</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Strava Stats */}
                    {stravaStats.totalActivities > 0 ? (
                      <View className="border-t border-gray-200 pt-4 mt-2">
                        <Text className="text-gray-700 font-bold text-sm mb-3">📊 Activity Statistics:</Text>
                        
                        <InfoRow 
                          label="Total Distance (Last 10)" 
                          value={`${formatDistance(stravaStats.totalDistance)} km`} 
                          icon="📏"
                        />
                        <InfoRow 
                          label="Average Speed" 
                          value={`${formatSpeed(stravaStats.avgSpeed)} km/h`} 
                          icon="⚡"
                        />
                        <InfoRow 
                          label="Max Speed" 
                          value={`${formatSpeed(stravaStats.maxSpeed)} km/h`} 
                          icon="🚀"
                        />
                        <InfoRow 
                          label="Activities Tracked" 
                          value={stravaStats.totalActivities} 
                          icon="🏃"
                        />
                      </View>
                    ) : (
                      <View className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <Text className="text-gray-500 text-sm text-center">
                          No Strava activities found. Start tracking your workouts!
                        </Text>
                      </View>
                    )}

                    {/* Clubs Section */}
                    {athlete.clubs && athlete.clubs.length > 0 && (
                      <View className="border-t border-gray-200 pt-4 mt-2">
                        <Text className="text-gray-700 font-bold text-sm mb-3">🏃‍♂️ Clubs:</Text>
                        {athlete.clubs.slice(0, 2).map((club, index) => (
                          <View key={club.id} className="bg-gray-50 p-3 rounded-lg mb-2">
                            <Text className="text-gray-900 font-semibold text-sm mb-1">
                              {club.name}
                            </Text>
                            <Text className="text-gray-500 text-xs">
                              {club.city}, {club.country} • {club.member_count} members
                            </Text>
                            {club.admin && (
                              <View className="bg-orange-100 px-2 py-1 rounded-full self-start mt-1">
                                <Text className="text-orange-700 text-xs font-bold">Admin</Text>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                ) : (
                  <View className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Text className="text-gray-500 text-sm text-center">
                      Could not load Strava profile data
                    </Text>
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
                  className="bg-purple-600 px-6 py-3 rounded-xl mb-3"
                  onPress={() => navigation.navigate('ConnectWallet')}
                >
                  <Text className="text-white font-bold text-center">Connect Wallet</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-orange-500 px-6 py-3 rounded-xl"
                  onPress={() => navigation.navigate('ConnectStrava')}
                >
                  <Text className="text-white font-bold text-center">Connect Strava</Text>
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

// ... (Keep the existing InfoRow, StatCard, and ActivityCard components the same)

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