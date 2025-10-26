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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
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
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

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
  const scrollY = useRef(new Animated.Value(0)).current;
  
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
    console.log('🚀 [Profile] Component mounted');
    console.log('📱 [Profile] Initial state:', {
      walletConnected,
      stravaConnected,
      account: account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not connected',
    });
    
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
      console.log('🔄 [Auto-refresh] Refreshing dashboard data...');
      loadDashboardData(true); // Silent refresh
    }, 30000);
    setAutoRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
      console.log('🧹 [Profile] Component unmounted, cleanup complete');
    };
  }, [account]);

  const loadDashboardData = async (silent = false) => {
    try {
      console.log('🔄 [Dashboard] Loading dashboard data...');
      const startTime = Date.now();
      
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

      const loadTime = Date.now() - startTime;
      console.log(`⏱️ [Dashboard] Data fetched in ${loadTime}ms`);

      const result = {
        protocolMetrics: protocolMetrics.status === 'fulfilled' ? protocolMetrics.value : null,
        activityFeed: activityFeed.status === 'fulfilled' ? activityFeed.value : [],
        leaderboard: leaderboard.status === 'fulfilled' ? leaderboard.value : null,
        historicalTrends: historicalTrends.status === 'fulfilled' ? historicalTrends.value : [],
        challengeAnalytics: challengeAnalytics.status === 'fulfilled' ? challengeAnalytics.value : null,
      };

      console.log('📊 [Dashboard] Data summary:', {
        metrics: protocolMetrics.status === 'fulfilled' ? '✅' : '❌',
        activityFeed: activityFeed.status === 'fulfilled' ? `✅ (${result.activityFeed.length} items)` : '❌',
        leaderboard: leaderboard.status === 'fulfilled' ? '✅' : '❌',
        trends: historicalTrends.status === 'fulfilled' ? `✅ (${result.historicalTrends.length} days)` : '❌',
        analytics: challengeAnalytics.status === 'fulfilled' ? '✅' : '❌',
      });

      setDashboardData(result);
      setLastRefresh(Date.now());
      
      if (!silent) {
        console.log('✅ [Dashboard] Dashboard data loaded successfully');
      }
    } catch (error) {
      console.error('❌ [Dashboard] Error loading dashboard data:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
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
      console.log('🔍 [Profile] Loading all Envio data and calculating stats for account:', account);
      const startTime = Date.now();
      
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

      const loadTime = Date.now() - startTime;
      console.log(`⏱️ [Profile] Data loaded in ${loadTime}ms`);
      console.log('📊 [Profile] All Envio data loaded:', {
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
      console.log('🔍 [Profile] Calculating challenge stats for account:', account);
      
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
      
      console.log('✅ [Profile] Enhanced challenge stats calculated:', stats);
      console.log('📈 [Profile] Performance metrics:', {
        created: stats.created,
        participated: stats.participated,
        active: stats.active,
        won: stats.won,
        totalWinnings: stats.totalWinnings,
        tasksCompleted: stats.tasksCompleted,
      });
      setChallengeStats(stats);
      setDataLoaded(prev => ({ ...prev, challenges: true }));

    } catch (error) {
      console.error('❌ [Profile] Error loading challenge data and stats:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
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
      console.log('🔐 [Wallet] Loading wallet data...');
      const startTime = Date.now();
      setWalletAddress(account);
      const provider = getProvider();
      const balanceWei = await provider.getBalance(account);
      const balanceEth = ethers.formatEther(balanceWei);
      setBalance(parseFloat(balanceEth).toFixed(4));
      
      const loadTime = Date.now() - startTime;
      console.log(`⏱️ [Wallet] Data loaded in ${loadTime}ms`);
      console.log('💼 [Wallet] Balance:', balanceEth, 'ETH');
      console.log('✅ [Wallet] Wallet data loaded successfully');
      
      setDataLoaded(prev => ({ ...prev, wallet: true }));
    } catch (error) {
      console.error('❌ [Wallet] Error loading wallet data:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
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
      console.log('🏃 [Strava] Loading Strava data...');
      const startTime = Date.now();
      
      const [profile, activities] = await Promise.all([
        getAthleteProfile().catch(error => {
          console.warn('⚠️ [Strava] Error fetching Strava profile:', error);
          return null;
        }),
        getRecentActivities(1, 10).catch(error => {
          console.warn('⚠️ [Strava] Error fetching Strava activities:', error);
          return [];
        }),
      ]);
      
      const loadTime = Date.now() - startTime;
      console.log(`⏱️ [Strava] Data loaded in ${loadTime}ms`);
      console.log('👤 [Strava] Profile loaded:', profile ? profile.firstname : 'No profile');
      console.log('🏃 [Strava] Activities loaded:', activities?.length || 0);
      
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
        
        console.log('✅ [Strava] Stats calculated:', stats);
        setStravaStats(stats);
      } else {
        console.log('⚠️ [Strava] No Strava activities found');
        setStravaStats({
          recentActivities: [],
          totalDistance: 0,
          avgSpeed: 0,
          maxSpeed: 0,
          totalActivities: 0,
        });
      }
      setDataLoaded(prev => ({ ...prev, strava: true }));
      console.log('✅ [Strava] Strava data loaded successfully');
    } catch (error) {
      console.error('❌ [Strava] Error loading Strava data:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
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
    console.log('🔄 [Refresh] Starting refresh...');
    const startTime = Date.now();
    setRefreshing(true);
    
    try {
      await Promise.all([
        loadProfileData(),
        loadDashboardData(true) // Silent dashboard reload
      ]);
      
      const refreshTime = Date.now() - startTime;
      console.log(`✅ [Refresh] Refresh completed in ${refreshTime}ms`);
    } catch (error) {
      console.error('❌ [Refresh] Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
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

  // Use historical trends data from dashboard
  const getHistoricalData = () => {
    if (dashboardData.historicalTrends && dashboardData.historicalTrends.length > 0) {
      return dashboardData.historicalTrends.map(item => ({
        date: item.date,
        value: item.tasksCompleted || 0,
      }));
    }
    return [];
  };

  // Tab render functions
  const renderPersonalTab = () => {
    const historicalData = getHistoricalData();
    const successRate = challengeStats.participated > 0 
      ? ((challengeStats.won / challengeStats.participated) * 100).toFixed(1) 
      : '0.0';
    
    return (
      <View className="space-y-4">
        {/* Hero Stats */}
        <View className="flex-row space-x-3">
          <View className="flex-1">
            <LiveStatsCard
              title="Total Winnings"
              value={`${challengeStats.totalWinnings} ETH`}
              subtitle="All time earnings"
              icon="💰"
              color="#10b981"
              delay={0}
              onPress={() => console.log('💰 Winnings pressed')}
            />
          </View>
          <View className="flex-1">
            <LiveStatsCard
              title="Success Rate"
              value={`${successRate}%`}
              subtitle="Challenge win rate"
              icon="🎯"
              color="#667eea"
              delay={100}
              onPress={() => console.log('🎯 Success rate pressed')}
            />
          </View>
        </View>

        {/* Performance Trend Chart */}
        <TrendChart
          data={historicalData}
          title="Weekly Activity Trends"
          color="#8b5cf6"
          height={220}
          delay={200}
          showStats={true}
          isLoading={loading}
        />

        {/* Performance Grid */}
        <View className="flex-row space-x-3">
          <View className="flex-1">
            <LiveStatsCard
              title="Challenges"
              value={challengeStats.participated}
              subtitle="Total joined"
              icon="🏃"
              color="#f59e0b"
              delay={300}
            />
          </View>
          <View className="flex-1">
            <LiveStatsCard
              title="Tasks Completed"
              value={challengeStats.tasksCompleted}
              subtitle="Achievements"
              icon="✅"
              color="#10b981"
              delay={400}
            />
          </View>
        </View>

        {/* Distance & Duration Stats */}
        <View className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
          <Text className="text-gray-800 font-bold text-xl mb-4">📊 Performance Metrics</Text>
          
          <View className="flex-row justify-between mb-4">
            <View className="flex-1 items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
              <Text className="text-blue-600 text-xs font-semibold mb-2 uppercase tracking-wide">Distance</Text>
              <Text className="text-blue-900 font-black text-3xl mb-1">{challengeStats.totalDistanceCompleted} km</Text>
              <Text className="text-blue-600 text-xs">Total completed</Text>
            </View>
            
            <View className="w-4" />
            
            <View className="flex-1 items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
              <Text className="text-purple-600 text-xs font-semibold mb-2 uppercase tracking-wide">Duration</Text>
              <Text className="text-purple-900 font-black text-3xl mb-1">{challengeStats.totalDurationCompleted}</Text>
              <Text className="text-purple-600 text-xs">Active time</Text>
            </View>
          </View>

          <View className="bg-gray-50 rounded-2xl p-4">
            <Text className="text-gray-700 text-sm font-semibold mb-2">Average Performance</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-600 text-xs">Distance per task</Text>
              <Text className="text-gray-900 font-bold">{challengeStats.averageDistancePerTask} km</Text>
            </View>
          </View>
        </View>

        {/* Strava Integration */}
        {stravaConnected && stravaStats && (
          <View className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-800 font-bold text-xl">🏃 Strava Integration</Text>
              <View className="bg-green-100 px-3 py-1 rounded-full">
                <Text className="text-green-700 text-xs font-bold">Connected</Text>
              </View>
            </View>
            
            <View className="flex-row justify-between">
              <View className="flex-1 items-center">
                <Text className="text-gray-600 text-xs font-medium">Activities</Text>
                <Text className="text-gray-900 font-black text-2xl mt-1">{stravaStats.totalActivities}</Text>
              </View>
              <View className="flex-1 items-center border-l border-r border-gray-200">
                <Text className="text-gray-600 text-xs font-medium">Distance</Text>
                <Text className="text-gray-900 font-black text-2xl mt-1">{formatDistance(stravaStats.totalDistance)} km</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-gray-600 text-xs font-medium">Avg Speed</Text>
                <Text className="text-gray-900 font-black text-2xl mt-1">{formatSpeed(stravaStats.avgSpeed)} km/h</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderSystemTab = () => {
    // Use historical trends data for challenges created
    const systemTrendsData = dashboardData.historicalTrends ? 
      dashboardData.historicalTrends.map(item => ({
        date: item.date,
        value: item.challengesCreated || 0,
      })) : [];

    return (
      <View className="space-y-4">
        {/* Protocol Health */}
        <ProtocolHealthIndicator
          metrics={dashboardData.protocolMetrics}
          delay={0}
          showDetails={true}
        />

        {/* System Stats Grid */}
        <View className="flex-row space-x-3">
          <View className="flex-1">
            <LiveStatsCard
              title="Total Volume"
              value={`${dashboardData.protocolMetrics?.totalVolumeStaked || '0.00'} ETH`}
              subtitle="Volume staked"
              icon="💎"
              color="#10b981"
              delay={100}
              onPress={() => console.log('💎 Volume pressed')}
            />
          </View>
          <View className="flex-1">
            <LiveStatsCard
              title="Active Users"
              value={dashboardData.protocolMetrics?.uniqueUsers || 0}
              subtitle="Unique participants"
              icon="👥"
              color="#667eea"
              delay={200}
              onPress={() => console.log('👥 Users pressed')}
            />
          </View>
        </View>

        {/* Additional Metrics */}
        <View className="flex-row space-x-3">
          <View className="flex-1">
            <LiveStatsCard
              title="Total Challenges"
              value={dashboardData.protocolMetrics?.totalChallenges || 0}
              subtitle="All time"
              icon="🎯"
              color="#f59e0b"
              delay={300}
            />
          </View>
          <View className="flex-1">
            <LiveStatsCard
              title="Success Rate"
              value={`${dashboardData.protocolMetrics?.successRate || '0.0'}%`}
              subtitle="Completion rate"
              icon="📈"
              color="#ef4444"
              delay={400}
            />
          </View>
        </View>

        {/* Activity Feed */}
        <View className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-800 font-bold text-xl">📡 Live Activity Feed</Text>
            <TouchableOpacity className="bg-gray-100 px-3 py-1.5 rounded-full">
              <Text className="text-gray-600 text-xs font-semibold">Refresh</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
            {dashboardData.activityFeed.length > 0 ? (
              dashboardData.activityFeed.slice(0, 5).map((activity, index) => (
                <ActivityFeedItem
                  key={activity.id || index}
                  activity={activity}
                  index={index}
                  animated={true}
                  showActions={false}
                />
              ))
            ) : (
              <View className="items-center justify-center py-8">
                <Text className="text-gray-400 text-4xl mb-2">📭</Text>
                <Text className="text-gray-500 text-sm text-center">No recent activity</Text>
                <Text className="text-gray-400 text-xs text-center mt-1">Check back later</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* System Trends Chart */}
        <TrendChart
          data={systemTrendsData}
          title="Challenge Creation Trends (Last 30 Days)"
          color="#10b981"
          height={220}
          delay={300}
          showStats={true}
          isLoading={loading}
        />
      </View>
    );
  };

  const renderLeaderboardTab = () => {
    // Use real data from dashboardData.leaderboard
    const topWinners = dashboardData.leaderboard?.topWinners || [];
    const mostActive = dashboardData.leaderboard?.mostActive || [];

    return (
      <View className="space-y-4">
        {/* Leaderboard Header */}
        <View className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-800 font-bold text-2xl">🏆 Leaderboard</Text>
            <TouchableOpacity className="bg-gray-100 px-3 py-1.5 rounded-full">
              <Text className="text-gray-600 text-xs font-semibold">View All</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-gray-500 text-sm">See how you rank against other users</Text>
        </View>

        {/* Top Winners */}
        <View className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-800 font-bold text-xl">💰 Top Winners</Text>
            <View className="bg-yellow-100 px-3 py-1 rounded-full">
              <Text className="text-yellow-700 text-xs font-bold">🏅 Earnings</Text>
            </View>
          </View>
          
          {topWinners.length > 0 ? (
            topWinners.map((user, index) => (
              <LeaderboardCard
                key={`winner-${user.address}-${index}`}
                user={user}
                rank={user.rank}
                metric="ETH"
                value={user.totalWinnings?.toFixed(4) || '0.0000'}
                subtitle="Total winnings"
                isCurrentUser={user.address.toLowerCase() === account?.toLowerCase()}
                delay={index * 100}
              />
            ))
          ) : (
            <View className="items-center justify-center py-8">
              <Text className="text-gray-400 text-4xl mb-2">🥈</Text>
              <Text className="text-gray-500 text-sm text-center">No winners yet</Text>
              <Text className="text-gray-400 text-xs text-center mt-1">Be the first to win!</Text>
            </View>
          )}
        </View>

        {/* Most Active */}
        <View className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-800 font-bold text-xl">⚡ Most Active</Text>
            <View className="bg-blue-100 px-3 py-1 rounded-full">
              <Text className="text-blue-700 text-xs font-bold">🔥 Tasks</Text>
            </View>
          </View>
          
          {mostActive.length > 0 ? (
            mostActive.map((user, index) => (
              <LeaderboardCard
                key={`active-${user.address}-${index}`}
                user={user}
                rank={user.rank}
                metric="Tasks"
                value={user.tasksCompleted || 0}
                subtitle={`${user.challengesJoined || 0} challenges joined`}
                isCurrentUser={user.address.toLowerCase() === account?.toLowerCase()}
                delay={index * 100}
              />
            ))
          ) : (
            <View className="items-center justify-center py-8">
              <Text className="text-gray-400 text-4xl mb-2">📊</Text>
              <Text className="text-gray-500 text-sm text-center">No activity yet</Text>
              <Text className="text-gray-400 text-xs text-center mt-1">Complete your first task!</Text>
            </View>
          )}
        </View>

        {/* Your Rankings */}
        <View className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl p-6 border border-purple-200">
          <Text className="text-gray-800 font-bold text-xl mb-4">📍 Your Rankings</Text>
          
          <View className="space-y-3">
            <View className="flex-row items-center justify-between bg-white/50 rounded-2xl p-4">
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">🥇</Text>
                <View>
                  <Text className="text-gray-700 font-semibold">Earnings Rank</Text>
                  <Text className="text-gray-500 text-sm">#{challengeStats.won > 0 ? 'Loading...' : 'Unranked'}</Text>
                </View>
              </View>
              <Text className="text-purple-700 font-bold text-lg">{challengeStats.won}</Text>
            </View>
            
            <View className="flex-row items-center justify-between bg-white/50 rounded-2xl p-4">
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">🏃</Text>
                <View>
                  <Text className="text-gray-700 font-semibold">Activity Rank</Text>
                  <Text className="text-gray-500 text-sm">#{challengeStats.tasksCompleted > 0 ? 'Loading...' : 'Unranked'}</Text>
                </View>
              </View>
              <Text className="text-blue-700 font-bold text-lg">{challengeStats.tasksCompleted}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderAnalyticsTab = () => {
    // Use real difficulty distribution data
    const difficultyData = dashboardData.challengeAnalytics?.summary?.difficultyDistribution ? 
      Object.entries(dashboardData.challengeAnalytics.summary.difficultyDistribution).map(([difficulty, count]) => ({
        name: difficulty,
        value: count,
        color: difficulty === 'Easy' ? '#10b981' : difficulty === 'Medium' ? '#f59e0b' : '#ef4444'
      })) : [];

    return (
      <View className="space-y-4">
        {/* Analytics Header */}
        <View className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
          <Text className="text-gray-800 font-bold text-2xl mb-2">📊 Analytics Dashboard</Text>
          <Text className="text-gray-500 text-sm">Detailed insights into challenge performance</Text>
        </View>

        {/* Key Metrics */}
        <View className="flex-row space-x-3">
          <View className="flex-1">
            <LiveStatsCard
              title="Avg Completion"
              value={`${dashboardData.challengeAnalytics?.summary?.avgCompletionRate || '0.0'}%`}
              subtitle="Success rate"
              icon="📊"
              color="#8b5cf6"
              delay={100}
            />
          </View>
          <View className="flex-1">
            <LiveStatsCard
              title="Avg Stake"
              value={`${dashboardData.challengeAnalytics?.summary?.avgStakeAmount || '0.0000'} ETH`}
              subtitle="Per challenge"
              icon="💎"
              color="#f59e0b"
              delay={200}
            />
          </View>
        </View>

        {/* Challenge Difficulty Distribution */}
        <ComparisonChart
          data={difficultyData}
          title="Challenge Difficulty Distribution"
          height={240}
          delay={300}
          showLegend={true}
          showStats={true}
        />

        {/* Additional Analytics Grid */}
        <View className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
          <Text className="text-gray-800 font-bold text-xl mb-4">📈 Performance Insights</Text>
          
          <View className="space-y-3">
            <View className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-600 text-xs font-semibold mb-1 uppercase tracking-wide">Total Volume Staked</Text>
                  <Text className="text-gray-800 font-black text-2xl">
                    {dashboardData.protocolMetrics?.totalVolumeStaked || '0.00'} ETH
                  </Text>
                </View>
                <Text className="text-3xl">💎</Text>
              </View>
            </View>

            <View className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-600 text-xs font-semibold mb-1 uppercase tracking-wide">Total Winnings Distributed</Text>
                  <Text className="text-gray-800 font-black text-2xl">
                    {dashboardData.protocolMetrics?.totalWinningsDistributed || '0.00'} ETH
                  </Text>
                </View>
                <Text className="text-3xl">💰</Text>
              </View>
            </View>

            <View className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-4 border border-orange-100">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-600 text-xs font-semibold mb-1 uppercase tracking-wide">Active Challenges</Text>
                  <Text className="text-gray-800 font-black text-2xl">
                    {dashboardData.protocolMetrics?.activeChallenges || 0}
                  </Text>
                </View>
                <Text className="text-3xl">⚡</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Challenge Analytics Table */}
        <View className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-800 font-bold text-xl">📋 Recent Challenges</Text>
            <TouchableOpacity className="bg-gray-100 px-3 py-1.5 rounded-full">
              <Text className="text-gray-600 text-xs font-semibold">View All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
            {dashboardData.challengeAnalytics?.challenges?.length > 0 ? (
              dashboardData.challengeAnalytics.challenges.slice(0, 5).map((challenge, index) => (
                <View key={challenge.challengeId || index} className="bg-gray-50 rounded-2xl p-4 mb-3 border border-gray-100">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-gray-900 font-bold text-base">Challenge #{challenge.challengeId}</Text>
                    <View className={`px-3 py-1 rounded-full ${
                      challenge.difficulty === 'Easy' ? 'bg-green-100' :
                      challenge.difficulty === 'Medium' ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      <Text className={`text-xs font-bold ${
                        challenge.difficulty === 'Easy' ? 'text-green-700' :
                        challenge.difficulty === 'Medium' ? 'text-yellow-700' : 'text-red-700'
                      }`}>
                        {challenge.difficulty}
                      </Text>
                    </View>
                  </View>
                  
                  <Text className="text-gray-600 text-sm mb-3" numberOfLines={2}>
                    {challenge.description || 'Challenge description'}
                  </Text>
                  
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <Ionicons name="people-outline" size={14} color="#6b7280" />
                      <Text className="text-gray-600 text-xs ml-1">{challenge.participantCount || 0} participants</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="checkmark-circle-outline" size={14} color="#6b7280" />
                      <Text className="text-gray-600 text-xs ml-1">{challenge.completionRate || '0'}% complete</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center justify-center py-8">
                <Text className="text-gray-400 text-4xl mb-2">📊</Text>
                <Text className="text-gray-500 text-sm text-center">No challenge data available</Text>
                <Text className="text-gray-400 text-xs text-center mt-1">Create your first challenge!</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  // Show loading only if we're still loading essential data
  const isLoading = loading && !(dataLoaded.wallet && dataLoaded.challenges && dataLoaded.strava);

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EC4899" />
          <Text className="text-gray-900 text-base mt-3 font-semibold">Loading your dashboard...</Text>
          <Text className="text-gray-500 text-sm mt-1">Please wait a moment</Text>
        </View>
      </View>
    );
  }

  // Tab navigation component
  const TabButton = ({ tab, label, icon, isActive, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-1 items-center py-3 px-2 rounded-xl mx-1 ${
        isActive ? 'bg-pink-50 border border-pink-200' : 'bg-transparent'
      }`}
    >
      {icon}
      <Text className={`font-bold text-xs mt-1 ${isActive ? 'text-pink-600' : 'text-gray-500'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Render tab content
  const renderTabContent = () => {
    console.log('🔄 [UI] Rendering tab content for:', activeTab);
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

  const backgroundInterpolate = scrollY.interpolate({
    inputRange: [0, 200, 400],
    outputRange: ['rgba(255,255,255,0)', 'rgba(255,235,238,0.4)', 'rgba(255,220,225,0.8)'],
    extrapolate: 'clamp',
  });

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#ffffff', '#fdf2f8', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="pt-16 pb-5 px-6 shadow-sm border-b border-pink-100"
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-pink-600 text-sm font-medium mb-1">
                Your Dashboard
              </Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Text className="text-gray-900 font-bold text-2xl mr-3">
                    {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'User'}
                  </Text>
                  <View className="bg-white px-3 py-1.5 rounded-full border border-pink-200 shadow-sm">
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 bg-pink-500 rounded-full mr-2" />
                      <Text className="text-pink-700 text-xs font-semibold">
                        {walletConnected ? 'Connected' : 'Disconnected'}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  className="w-10 h-10 bg-white rounded-xl border border-pink-200 items-center justify-center shadow-sm"
                  activeOpacity={0.8}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="arrow-back" size={20} color="#EC4899" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>
      
      <View className="flex-1">
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: backgroundInterpolate,
          }}
        />
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EC4899" />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          <View className="px-6 pt-8">
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }}
            >

              {/* Tab Navigation */}
              <View className="flex-row mb-6 bg-white rounded-2xl p-2 shadow-sm border border-gray-100"
                    style={Platform.select({
                      ios: {
                        shadowColor: "#000",
                        shadowOpacity: 0.05,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 2 },
                      },
                      android: { elevation: 2 },
                    })}
              >
                <TabButton
                  tab="personal"
                  label="Personal"
                  icon={<Ionicons name="person-outline" size={20} color={activeTab === 'personal' ? '#EC4899' : '#9CA3AF'} />}
                  isActive={activeTab === 'personal'}
                  onPress={() => setActiveTab('personal')}
                />
                <TabButton
                  tab="system"
                  label="System"
                  icon={<Ionicons name="globe-outline" size={20} color={activeTab === 'system' ? '#EC4899' : '#9CA3AF'} />}
                  isActive={activeTab === 'system'}
                  onPress={() => setActiveTab('system')}
                />
                <TabButton
                  tab="leaderboard"
                  label="Leaders"
                  icon={<MaterialIcons name="emoji-events" size={20} color={activeTab === 'leaderboard' ? '#EC4899' : '#9CA3AF'} />}
                  isActive={activeTab === 'leaderboard'}
                  onPress={() => setActiveTab('leaderboard')}
                />
                <TabButton
                  tab="analytics"
                  label="Analytics"
                  icon={<Ionicons name="stats-chart-outline" size={20} color={activeTab === 'analytics' ? '#EC4899' : '#9CA3AF'} />}
                  isActive={activeTab === 'analytics'}
                  onPress={() => setActiveTab('analytics')}
                />
              </View>

              {/* Tab Content */}
              {renderTabContent()}
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default Profile;