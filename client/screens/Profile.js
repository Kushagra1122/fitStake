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
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWeb3 } from '../context/Web3Context';
import { useStrava } from '../context/StravaContext';
import { ethers } from 'ethers';
import { useNavigation } from '@react-navigation/native';
import * as envioService from '../services/envioService';
import {
  LiveStatsCard,
  TrendChart,
  ActivityFeedItem,
  LeaderboardCard,
  ComparisonChart,
  ProtocolHealthIndicator,
} from '../components/Dashboard';

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
    totalDistanceCompleted: '0.00',
    totalDurationCompleted: '0m',
    tasksCompleted: 0,
    averageDistancePerTask: '0.00',
    totalChallengesInSystem: 0,
    finalizedChallengesCount: 0,
    recentTasks: []
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

  // Individual state for each Envio service data
  const [envioData, setEnvioData] = useState({
    allChallenges: [],
    userJoined: [],
    finalizedChallenges: [],
    completedTasks: [],
    winningsDistributed: [],
    profileData: null
  });

  // Dashboard state
  const [activeTab, setActiveTab] = useState('personal');
  const [dashboardData, setDashboardData] = useState({
    protocolMetrics: null,
    activityFeed: [],
    leaderboard: null,
    historicalTrends: [],
    challengeAnalytics: null,
  });
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(null);

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
    loadDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData(true); // Silent refresh
    }, 30000);
    setAutoRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [account]);

  const loadDashboardData = async (silent = false) => {
    try {
      console.log('🔄 Loading dashboard data...');
      
      const [
        protocolMetrics,
        activityFeed,
        leaderboard,
        historicalTrends,
        challengeAnalytics
      ] = await Promise.allSettled([
        envioService.getProtocolMetrics(),
        envioService.getActivityFeed(20),
        envioService.getLeaderboard(),
        envioService.getHistoricalTrends(30),
        envioService.getChallengeAnalytics()
      ]);

      setDashboardData({
        protocolMetrics: protocolMetrics.status === 'fulfilled' ? protocolMetrics.value : null,
        activityFeed: activityFeed.status === 'fulfilled' ? activityFeed.value : [],
        leaderboard: leaderboard.status === 'fulfilled' ? leaderboard.value : null,
        historicalTrends: historicalTrends.status === 'fulfilled' ? historicalTrends.value : [],
        challengeAnalytics: challengeAnalytics.status === 'fulfilled' ? challengeAnalytics.value : null,
      });

      setLastRefresh(Date.now());
      
      if (!silent) {
        console.log('✅ Dashboard data loaded successfully');
      }
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    }
  };

  const loadProfileData = async () => {
    setLoading(true);
    try {
      // Reset data loaded state
      setDataLoaded({ wallet: false, challenges: false, strava: false });
      
      // Load wallet data
      if (account && walletConnected) {
        await loadWalletData();
        await loadChallengeDataAndStats(); // Load all Envio data and calculate stats in one function
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

  // Load all Envio data and calculate challenge stats in one function
  const loadChallengeDataAndStats = async () => {
    try {
      console.log('🔍 Loading all Envio data and calculating stats for account:', account);
      
      // Load all data in parallel for better performance
      const [
        allChallenges,
        userJoined,
        finalizedChallenges,
        completedTasks,
        winningsDistributed,
        profileData
      ] = await Promise.all([
        envioService.getAllChallenges(10).catch(error => {
          console.warn('Error loading all challenges:', error);
          return { Challengercc_ChallengeCreated: [] };
        }),
        envioService.getUserJoined({ limit: 10 }).catch(error => {
          console.warn('Error loading user joined:', error);
          return { Challengercc_UserJoined: [] };
        }),
        envioService.getFinalizedChallenges(10).catch(error => {
          console.warn('Error loading finalized challenges:', error);
          return { Challengercc_ChallengeFinalized: [] };
        }),
        envioService.getTaskCompleted({ limit: 10 }).catch(error => {
          console.warn('Error loading completed tasks:', error);
          return { Challengercc_TaskCompleted: [] };
        }),
        envioService.getWinningsDistributed({ limit: 10 }).catch(error => {
          console.warn('Error loading winnings:', error);
          return { Challengercc_WinningsDistributed: [] };
        }),
        envioService.getProfileData(account, 10).catch(error => {
          console.warn('Error loading profile data:', error);
          return { challenges: [], joined: [], tasks: [], winnings: [] };
        })
      ]);

      // Extract data arrays
      const allChallengesArray = allChallenges.Challengercc_ChallengeCreated || [];
      const userJoinedArray = userJoined.Challengercc_UserJoined || [];
      const finalizedChallengesArray = finalizedChallenges.Challengercc_ChallengeFinalized || [];
      const completedTasksArray = completedTasks.Challengercc_TaskCompleted || [];
      const winningsDistributedArray = winningsDistributed.Challengercc_WinningsDistributed || [];

      console.log('📊 All Envio data loaded:', {
        allChallenges: allChallengesArray.length,
        userJoined: userJoinedArray.length,
        finalizedChallenges: finalizedChallengesArray.length,
        completedTasks: completedTasksArray.length,
        winningsDistributed: winningsDistributedArray.length,
        profileData: profileData ? 'loaded' : 'failed'
      });

      // Update envioData state
      setEnvioData({
        allChallenges: allChallengesArray,
        userJoined: userJoinedArray,
        finalizedChallenges: finalizedChallengesArray,
        completedTasks: completedTasksArray,
        winningsDistributed: winningsDistributedArray,
        profileData
      });

      // Calculate challenge stats immediately from loaded data (not from state)
      console.log('🔍 Calculating challenge stats for account:', account);
      
      // Process challenges created by user
      const createdChallenges = allChallengesArray.filter(
        c => c.creator && c.creator.toLowerCase() === account.toLowerCase()
      );
      
      // Process joined challenges
      const joinedChallenges = userJoinedArray;
      
      // Process completed tasks
      const userCompletedTasks = completedTasksArray.filter(
        task => task.user && task.user.toLowerCase() === account.toLowerCase()
      );
      
      // Process winnings
      const userWinnings = winningsDistributedArray.filter(
        win => win.winner && win.winner.toLowerCase() === account.toLowerCase()
      );
      
      // Count active challenges (non-finalized)
      const finalizedChallengeIds = new Set(
        finalizedChallengesArray.map(f => f.challengeId?.toString())
      );
      
      const activeCount = joinedChallenges.filter(j => {
        return j.challengeId && !finalizedChallengeIds.has(j.challengeId.toString());
      }).length;
      
      // Calculate total winnings from winnings array
      const totalWinnings = userWinnings.reduce((sum, w) => {
        try {
          return sum + parseFloat(ethers.formatEther(w.amount || '0'));
        } catch (e) {
          console.warn('Error parsing winning amount:', w.amount);
          return sum;
        }
      }, 0);
      
      // Calculate performance metrics from completed tasks
      const totalDistanceCompleted = userCompletedTasks.reduce((sum, task) => {
        return sum + (parseInt(task.distance) || 0);
      }, 0);
      
      const totalDurationCompleted = userCompletedTasks.reduce((sum, task) => {
        return sum + (parseInt(task.duration) || 0);
      }, 0);
      
      const stats = {
        created: createdChallenges.length,
        participated: joinedChallenges.length,
        active: activeCount,
        won: userWinnings.length,
        totalWinnings: totalWinnings.toFixed(4),
        // Performance metrics
        totalDistanceCompleted: (totalDistanceCompleted / 1000).toFixed(2), // Convert to km
        totalDurationCompleted: formatDuration(totalDurationCompleted),
        tasksCompleted: userCompletedTasks.length,
        averageDistancePerTask: userCompletedTasks.length > 0 
          ? (totalDistanceCompleted / userCompletedTasks.length / 1000).toFixed(2) 
          : '0.00',
        // Additional stats from individual queries
        totalChallengesInSystem: allChallengesArray.length,
        finalizedChallengesCount: finalizedChallengesArray.length,
        recentTasks: userCompletedTasks.slice(0, 3) // Show recent tasks
      };
      
      console.log('✅ Enhanced challenge stats calculated:', stats);
      setChallengeStats(stats);
      setDataLoaded(prev => ({ ...prev, challenges: true }));

    } catch (error) {
      console.error('❌ Error loading challenge data and stats:', error);
      // Set empty data on error
      setEnvioData({
        allChallenges: [],
        userJoined: [],
        finalizedChallenges: [],
        completedTasks: [],
        winningsDistributed: [],
        profileData: null
      });
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
        totalChallengesInSystem: 0,
        finalizedChallengesCount: 0,
        recentTasks: []
      });
      setDataLoaded(prev => ({ ...prev, challenges: true }));
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


  // Function to test all Envio services (similar to your test function)
  const testEnvioServices = async () => {
    try {
      console.log("=== Testing All Envio Services ===");
      
      const results = await Promise.all([
        envioService.getAllChallenges(5),
        envioService.getUserJoined({ limit: 5 }),
        envioService.getFinalizedChallenges(5),
        envioService.getTaskCompleted({ limit: 5 }),
        envioService.getWinningsDistributed({ limit: 5 }),
        envioService.getProfileData(account, 5)
      ]);

      const [
        challenges,
        joined,
        finalized,
        tasks,
        winnings,
        profile
      ] = results;

      console.log("✅ All Envio services tested successfully:");
      console.log("All Challenges:", challenges.Challengercc_ChallengeCreated?.length || 0);
      console.log("User Joined:", joined.Challengercc_UserJoined?.length || 0);
      console.log("Finalized Challenges:", finalized.Challengercc_ChallengeFinalized?.length || 0);
      console.log("Completed Tasks:", tasks.Challengercc_TaskCompleted?.length || 0);
      console.log("Winnings Distributed:", winnings.Challengercc_WinningsDistributed?.length || 0);
      console.log("Profile Data:", profile ? 'loaded' : 'failed');

      Alert.alert(
        "Envio Services Test",
        `All services working! Found:
        • ${challenges.Challengercc_ChallengeCreated?.length || 0} challenges
        • ${joined.Challengercc_UserJoined?.length || 0} joined
        • ${finalized.Challengercc_ChallengeFinalized?.length || 0} finalized
        • ${tasks.Challengercc_TaskCompleted?.length || 0} tasks
        • ${winnings.Challengercc_WinningsDistributed?.length || 0} winnings`
      );

    } catch (error) {
      console.error("❌ Envio services test failed:", error);
      Alert.alert("Test Failed", "Could not connect to Envio services");
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
    await Promise.all([
      loadProfileData(),
      loadDashboardData()
    ]);
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

  // Tab render functions
  const renderPersonalTab = () => (
    <View className="space-y-4">
      {/* Hero Stats */}
      <View className="flex-row space-x-3">
        <View className="flex-1">
          <LiveStatsCard
            title="Total Winnings"
            value={`${challengeStats.totalWinnings} ETH`}
            subtitle="All time"
            icon="💰"
            color="#10b981"
            delay={0}
          />
        </View>
        <View className="flex-1">
          <LiveStatsCard
            title="Success Rate"
            value={`${challengeStats.participated > 0 ? ((challengeStats.won / challengeStats.participated) * 100).toFixed(1) : '0.0'}%`}
            subtitle="Win ratio"
            icon="🎯"
            color="#667eea"
            delay={100}
          />
        </View>
      </View>

      {/* Performance Chart */}
      <TrendChart
        data={dashboardData.historicalTrends.map(item => ({
          date: item.date,
          value: item.tasksCompleted
        }))}
        title="Task Completions Over Time"
        color="#8b5cf6"
        delay={200}
      />

      {/* Personal Stats Grid */}
      <View className="flex-row space-x-3">
        <View className="flex-1">
          <LiveStatsCard
            title="Challenges"
            value={challengeStats.participated}
            subtitle="Participated"
            icon="🏃"
            color="#f59e0b"
            delay={300}
          />
              </View>
        <View className="flex-1">
          <LiveStatsCard
            title="Distance"
            value={`${challengeStats.totalDistanceCompleted} km`}
            subtitle="Completed"
            icon="📏"
            color="#ef4444"
            delay={400}
          />
        </View>
            </View>

      {/* Strava Integration */}
      {stravaConnected && (
        <View className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-lg">
          <Text className="text-gray-700 font-bold text-lg mb-3">🏃 Strava Integration</Text>
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-gray-600 text-sm">Recent Activities</Text>
              <Text className="text-gray-900 font-bold text-lg">{stravaStats.totalActivities}</Text>
                  </View>
            <View>
              <Text className="text-gray-600 text-sm">Total Distance</Text>
              <Text className="text-gray-900 font-bold text-lg">{formatDistance(stravaStats.totalDistance)} km</Text>
                </View>
            <View>
              <Text className="text-gray-600 text-sm">Avg Speed</Text>
              <Text className="text-gray-900 font-bold text-lg">{formatSpeed(stravaStats.avgSpeed)} km/h</Text>
            </View>
          </View>
              </View>
            )}
                </View>
  );

  const renderSystemTab = () => (
    <View className="space-y-4">
      {/* Protocol Health */}
      <ProtocolHealthIndicator
        metrics={dashboardData.protocolMetrics}
        delay={0}
      />

      {/* System Stats Grid */}
      <View className="flex-row space-x-3">
        <View className="flex-1">
          <LiveStatsCard
            title="Total Volume"
            value={`${dashboardData.protocolMetrics?.totalVolumeStaked || '0.0000'} ETH`}
            subtitle="Staked"
            icon="💎"
            color="#10b981"
            delay={100}
                  />
                </View>
        <View className="flex-1">
          <LiveStatsCard
            title="Active Users"
            value={dashboardData.protocolMetrics?.uniqueUsers || 0}
            subtitle="Unique"
            icon="👥"
            color="#667eea"
            delay={200}
                  />
                </View>
                      </View>

      {/* Activity Feed */}
      <View className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-lg">
        <Text className="text-gray-700 font-bold text-lg mb-3">📡 Live Activity Feed</Text>
        <ScrollView style={{ maxHeight: 300 }}>
          {dashboardData.activityFeed.length > 0 ? (
            dashboardData.activityFeed.map((activity, index) => (
              <ActivityFeedItem
                key={activity.id}
                activity={activity}
                index={index}
                animated={true}
              />
            ))
          ) : (
            <Text className="text-gray-500 text-sm text-center py-4">
              No recent activity
                    </Text>
                )}
        </ScrollView>
              </View>

      {/* System Trends */}
      <TrendChart
        data={dashboardData.historicalTrends.map(item => ({
          date: item.date,
          value: item.challengesCreated
        }))}
        title="Challenge Creation Trends"
        color="#10b981"
        delay={300}
      />
                  </View>
  );

  const renderLeaderboardTab = () => (
    <View className="space-y-4">
      {/* Top Winners */}
      <View className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-lg">
        <Text className="text-gray-700 font-bold text-lg mb-3">🏆 Top Winners</Text>
        {dashboardData.leaderboard?.topWinners?.length > 0 ? (
          dashboardData.leaderboard.topWinners.map((user, index) => (
            <LeaderboardCard
              key={user.address}
              user={user}
              rank={user.rank}
              metric="ETH Won"
              value={user.totalWinnings.toFixed(4)}
              isCurrentUser={user.address.toLowerCase() === account?.toLowerCase()}
              delay={index * 100}
            />
          ))
        ) : (
          <Text className="text-gray-500 text-sm text-center py-4">
            No winners yet
                            </Text>
                          )}
                      </View>
                      
      {/* Most Active */}
      <View className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-lg">
        <Text className="text-gray-700 font-bold text-lg mb-3">⚡ Most Active</Text>
        {dashboardData.leaderboard?.mostActive?.length > 0 ? (
          dashboardData.leaderboard.mostActive.map((user, index) => (
            <LeaderboardCard
              key={user.address}
              user={user}
              rank={user.rank}
              metric="Tasks"
              value={user.tasksCompleted}
              subtitle={`${user.challengesJoined} challenges`}
              isCurrentUser={user.address.toLowerCase() === account?.toLowerCase()}
              delay={index * 100}
            />
          ))
        ) : (
          <Text className="text-gray-500 text-sm text-center py-4">
            No activity yet
                        </Text>
                      )}
                        </View>
                          </View>
  );

  const renderAnalyticsTab = () => (
    <View className="space-y-4">
      {/* Challenge Difficulty Distribution */}
      <ComparisonChart
        data={dashboardData.challengeAnalytics?.summary?.difficultyDistribution ? 
          Object.entries(dashboardData.challengeAnalytics.summary.difficultyDistribution).map(([difficulty, count]) => ({
            name: difficulty,
            value: count,
            color: difficulty === 'Easy' ? '#10b981' : difficulty === 'Medium' ? '#f59e0b' : '#ef4444'
          })) : []
        }
        title="Challenge Difficulty Distribution"
        delay={0}
      />

      {/* Analytics Stats */}
      <View className="flex-row space-x-3">
        <View className="flex-1">
          <LiveStatsCard
            title="Avg Completion"
            value={`${dashboardData.challengeAnalytics?.summary?.avgCompletionRate || '0.0'}%`}
            subtitle="Success Rate"
            icon="📊"
            color="#8b5cf6"
            delay={100}
          />
        </View>
        <View className="flex-1">
          <LiveStatsCard
            title="Avg Stake"
            value={`${dashboardData.challengeAnalytics?.summary?.avgStakeAmount || '0.0000'} ETH`}
            subtitle="Per Challenge"
            icon="💎"
            color="#f59e0b"
            delay={200}
                        />
                      </View>
                      </View>

      {/* Challenge Analytics Table */}
      <View className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-lg">
        <Text className="text-gray-700 font-bold text-lg mb-3">📋 Challenge Analytics</Text>
        <ScrollView style={{ maxHeight: 300 }}>
          {dashboardData.challengeAnalytics?.challenges?.length > 0 ? (
            dashboardData.challengeAnalytics.challenges.map((challenge, index) => (
              <View key={challenge.challengeId} className="bg-gray-50 p-3 rounded-lg mb-2">
                            <Text className="text-gray-900 font-semibold text-sm mb-1">
                  Challenge #{challenge.challengeId}
                            </Text>
                <Text className="text-gray-600 text-xs mb-2" numberOfLines={2}>
                  {challenge.description}
                </Text>
                <View className="flex-row justify-between">
                            <Text className="text-gray-500 text-xs">
                    {challenge.participantCount} participants
                            </Text>
                  <Text className="text-gray-500 text-xs">
                    {challenge.completionRate}% completion
                  </Text>
                  <Text className={`text-xs font-bold ${
                    challenge.difficulty === 'Easy' ? 'text-green-600' :
                    challenge.difficulty === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {challenge.difficulty}
                  </Text>
                              </View>
                          </View>
            ))
                ) : (
            <Text className="text-gray-500 text-sm text-center py-4">
              No challenge data available
                    </Text>
                )}
        </ScrollView>
              </View>
    </View>
  );

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
        <Text className="text-white text-base mt-3">Loading dashboard...</Text>
      </LinearGradient>
    );
  }

  // Tab navigation component
  const TabButton = ({ tab, label, icon, isActive, onPress }) => (
                <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      className={`flex-1 items-center py-3 px-2 rounded-lg mx-1 ${
        isActive ? 'bg-white/20' : 'bg-white/5'
      }`}
    >
      <Text className="text-2xl mb-1">{icon}</Text>
      <Text className={`text-white font-bold text-xs ${isActive ? 'text-white' : 'text-white/70'}`}>
        {label}
      </Text>
                </TouchableOpacity>
  );

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalTab();
      case 'system':
        return renderSystemTab();
      case 'leaderboard':
        return renderLeaderboardTab();
      case 'analytics':
        return renderAnalyticsTab();
      default:
        return renderPersonalTab();
    }
  };

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
            <View className="mb-6 items-center">
              <View className="bg-white/20 backdrop-blur-xl rounded-full p-6 mb-4 shadow-lg">
                <Text className="text-6xl">📊</Text>
              </View>
              <Text className="text-4xl font-black text-white mb-2 text-center">
                Web3 Dashboard
              </Text>
              {athlete && (
                <Text className="text-white/90 text-center text-lg font-bold">
                  {athlete.firstname} {athlete.lastname}
                </Text>
              )}
              <Text className="text-white/70 text-center text-sm">
                Powered by Envio HyperIndex
              </Text>
            </View>

            {/* Tab Navigation */}
            <View className="flex-row mb-6 bg-white/10 backdrop-blur-xl rounded-2xl p-2">
              <TabButton
                tab="personal"
                label="Personal"
                icon="👤"
                isActive={activeTab === 'personal'}
                onPress={() => setActiveTab('personal')}
              />
              <TabButton
                tab="system"
                label="System"
                icon="🌐"
                isActive={activeTab === 'system'}
                onPress={() => setActiveTab('system')}
              />
              <TabButton
                tab="leaderboard"
                label="Leaders"
                icon="🏆"
                isActive={activeTab === 'leaderboard'}
                onPress={() => setActiveTab('leaderboard')}
              />
              <TabButton
                tab="analytics"
                label="Analytics"
                icon="📈"
                isActive={activeTab === 'analytics'}
                onPress={() => setActiveTab('analytics')}
              />
            </View>

            {/* Tab Content */}
            {renderTabContent()}

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

export default Profile;