import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
  FlatList,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStrava } from '../context/StravaContext';
import stravaService from '../services/stravaService';

const { width } = Dimensions.get('window');

const ConnectStrava = () => {
  const navigation = useNavigation();
  const { 
    isConnected, 
    connectStrava, 
    disconnectStrava, 
    getAthleteProfile, 
    getRecentActivities, 
    fetchAllStravaData,
    getDataSummary,
    fetchAthleteSegments,
    fetchAthleteRoutes,
    fetchAthleteClubs,
    fetchAthleteGear,
    isLoading 
  } = useStrava();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [athlete, setAthlete] = useState(null);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [activities, setActivities] = useState([]);
  const [showActivities, setShowActivities] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [comprehensiveData, setComprehensiveData] = useState(null);
  const [showComprehensiveData, setShowComprehensiveData] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  // Check if already connected on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Handle OAuth callback from deep link
  useEffect(() => {
    const handleDeepLinkCallback = async (url) => {
      if (!url) return;
      
      try {
        const urlObj = new URL(url.replace('fitstake://', 'http://'));
        const success = urlObj.searchParams.get('success');
        const error = urlObj.searchParams.get('error');
        
        if (error) {
          Alert.alert('Connection Failed', decodeURIComponent(error));
          setLoading(false);
          return;
        }
        
        if (success === 'true') {
          // The stravaService is already polling the server
        }
      } catch (parseError) {
        console.error('Error parsing deep link:', parseError);
      }
    };

    const handleUrl = ({ url }) => {
      handleDeepLinkCallback(url);
    };
    
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLinkCallback(url);
      }
    });

    const subscription = Linking.addEventListener('url', handleUrl);

    return () => {
      subscription?.remove();
    };
  }, []);

  const checkConnection = async () => {
    try {
      setConnected(isConnected);
      
      if (isConnected) {
        try {
          const athleteData = await getAthleteProfile();
          setAthlete(athleteData);
        } catch (error) {
          console.error('Error fetching athlete profile:', error);
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error.message);
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      const result = await stravaService.connectStrava();

      if (result.success) {
        // Connect to context with the tokens
        await connectStrava(result.accessToken, result.refreshToken, result.expiresAt);
        
        setConnected(true);
        setAthlete(result.athlete);
        
        Alert.alert(
          'Success! 🎉',
          `Connected as ${result.athlete.firstname} ${result.athlete.lastname}`,
          [
            {
              text: 'Continue',
              onPress: () => navigation.navigate('Home')
            }
          ]
        );
      } else {
        Alert.alert('Connection Failed', result.error || 'Failed to connect to Strava');
      }
    } catch (error) {
      console.error('Connect error:', error.message);
      Alert.alert('Error', error.message || 'Failed to connect to Strava. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Strava',
      'Are you sure you want to disconnect your Strava account?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel'
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectStrava();
              setConnected(false);
              setAthlete(null);
              setActivities([]);
              setShowActivities(false);
              setComprehensiveData(null);
              setShowComprehensiveData(false);
              setTestResults({});
              Alert.alert('Disconnected', 'Your Strava account has been disconnected');
            } catch (error) {
              console.error('Disconnect error:', error.message);
              Alert.alert('Error', 'Failed to disconnect');
            }
          }
        }
      ]
    );
  };

  const handleRefreshProfile = async () => {
    try {
      setLoading(true);
      setTestResults({ ...testResults, profile: 'loading' });
      
      const profile = await getAthleteProfile();
      
      setAthlete(profile);
      setTestResults({ ...testResults, profile: 'success' });
      
      Alert.alert('Success! 🎉', 'Profile refreshed successfully!');
    } catch (error) {
      console.error('Refresh profile error:', error.message);
      setTestResults({ ...testResults, profile: 'error' });
      Alert.alert('Error', 'Failed to refresh profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetActivities = async () => {
    try {
      setLoading(true);
      setTestResults({ ...testResults, activities: 'loading' });
      
      const activitiesData = await getRecentActivities(1, 30);
      
      setActivities(activitiesData || []);
      setShowActivities(true);
      setTestResults({ ...testResults, activities: 'success' });
      
      Alert.alert('Success! 🎉', `Fetched ${activitiesData?.length || 0} activities`);
    } catch (error) {
      console.error('Get activities error:', error.message);
      setTestResults({ ...testResults, activities: 'error' });
      Alert.alert('Error', 'Failed to fetch activities: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAllData = async () => {
    try {
      setLoading(true);
      setTestResults({ ...testResults, comprehensive: 'loading' });
      
      const allData = await fetchAllStravaData({
        includeActivities: true,
        includeDetailedActivities: false, // Set to true for detailed activity data
        maxActivities: 100,
        includeSegments: true,
        includeRoutes: true,
        includeClubs: true,
        includeGear: true,
        includeStats: true,
        includeZones: true
      });
      
      setComprehensiveData(allData);
      setShowComprehensiveData(true);
      setTestResults({ ...testResults, comprehensive: 'success' });
      
      const summary = getDataSummary(allData.data);
      
      Alert.alert(
        'Comprehensive Data Fetched! 🎉', 
        `Fetched:\n• ${summary.activities.total} activities\n• ${summary.segments.total} segments\n• ${summary.routes.total} routes\n• ${summary.clubs.total} clubs\n• ${summary.gear.bikes.length} bikes\n• ${summary.gear.shoes.length} shoes`
      );
    } catch (error) {
      console.error('Comprehensive data fetch error:', error.message);
      setTestResults({ ...testResults, comprehensive: 'error' });
      Alert.alert('Error', 'Failed to fetch comprehensive data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchSegments = async () => {
    try {
      setLoading(true);
      setTestResults({ ...testResults, segments: 'loading' });
      
      const segments = await fetchAthleteSegments();
      setTestResults({ ...testResults, segments: 'success' });
      
      Alert.alert('Success! 🎉', `Fetched ${segments.length} segments`);
    } catch (error) {
      console.error('Segments fetch error:', error.message);
      setTestResults({ ...testResults, segments: 'error' });
      Alert.alert('Error', 'Failed to fetch segments: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchRoutes = async () => {
    try {
      setLoading(true);
      setTestResults({ ...testResults, routes: 'loading' });
      
      const routes = await fetchAthleteRoutes();
      setTestResults({ ...testResults, routes: 'success' });
      
      Alert.alert('Success! 🎉', `Fetched ${routes.length} routes`);
    } catch (error) {
      console.error('Routes fetch error:', error.message);
      setTestResults({ ...testResults, routes: 'error' });
      Alert.alert('Error', 'Failed to fetch routes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchClubs = async () => {
    try {
      setLoading(true);
      setTestResults({ ...testResults, clubs: 'loading' });
      
      const clubs = await fetchAthleteClubs();
      setTestResults({ ...testResults, clubs: 'success' });
      
      Alert.alert('Success! 🎉', `Fetched ${clubs.length} clubs`);
    } catch (error) {
      console.error('Clubs fetch error:', error.message);
      setTestResults({ ...testResults, clubs: 'error' });
      Alert.alert('Error', 'Failed to fetch clubs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchGear = async () => {
    try {
      setLoading(true);
      setTestResults({ ...testResults, gear: 'loading' });
      
      const gear = await fetchAthleteGear();
      setTestResults({ ...testResults, gear: 'success' });
      
      const bikes = gear.filter(item => item.resource_state === 3 && item.frame_type === 1);
      const shoes = gear.filter(item => item.resource_state === 3 && item.frame_type === 4);
      
      Alert.alert('Success! 🎉', `Fetched ${bikes.length} bikes and ${shoes.length} shoes`);
    } catch (error) {
      console.error('Gear fetch error:', error.message);
      setTestResults({ ...testResults, gear: 'error' });
      Alert.alert('Error', 'Failed to fetch gear: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigation.navigate('Home');
  };

  if (checkingConnection) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1 items-center justify-center"
      >
        <ActivityIndicator size="large" color="#fff" />
        <Text className="text-white text-base mt-3">Checking connection...</Text>
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
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-16">
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            {/* Header Section */}
            <View className="mb-8 items-center">
              <View className="bg-white/20 backdrop-blur-xl rounded-full p-6 mb-6 shadow-lg">
                <Text className="text-6xl">🏃</Text>
              </View>
              <Text className="text-4xl font-black text-white mb-3 text-center">
                Connect to Strava
              </Text>
              <Text className="text-white/90 text-center text-base px-4">
                {connected
                  ? 'Your Strava account is connected!'
                  : 'Link your fitness tracking to unlock challenges'}
              </Text>
            </View>

            {/* Connection Status */}
            {connected && athlete && (
              <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl mb-6">
                <View className="flex-row items-center justify-between mb-5">
                  <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                    Connected Account
                  </Text>
                  <View className="bg-green-500/20 px-3 py-1.5 rounded-full border border-green-500/30">
                    <Text className="text-green-700 text-xs font-bold">● Active</Text>
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

                {/* Test API Buttons */}
                <View className="border-t border-gray-200 pt-4 mt-2">
                  <Text className="text-gray-700 font-bold text-sm mb-3">🧪 Test API Functions:</Text>
                  
                  <View className="space-y-2">
                    <TestButton
                      icon="👤"
                      label="Refresh Profile"
                      onPress={handleRefreshProfile}
                      status={testResults.profile}
                      disabled={loading}
                    />
                    
                    <TestButton
                      icon="🏃"
                      label="Get Activities"
                      onPress={handleGetActivities}
                      status={testResults.activities}
                      disabled={loading}
                    />

                    <TestButton
                      icon="📊"
                      label="Fetch ALL Data"
                      onPress={handleFetchAllData}
                      status={testResults.comprehensive}
                      disabled={loading}
                    />

                    <TestButton
                      icon="🏁"
                      label="Get Segments"
                      onPress={handleFetchSegments}
                      status={testResults.segments}
                      disabled={loading}
                    />

                    <TestButton
                      icon="🗺️"
                      label="Get Routes"
                      onPress={handleFetchRoutes}
                      status={testResults.routes}
                      disabled={loading}
                    />

                    <TestButton
                      icon="👥"
                      label="Get Clubs"
                      onPress={handleFetchClubs}
                      status={testResults.clubs}
                      disabled={loading}
                    />

                    <TestButton
                      icon="🚴"
                      label="Get Gear"
                      onPress={handleFetchGear}
                      status={testResults.gear}
                      disabled={loading}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Activities List */}
            {showActivities && activities.length > 0 && (
              <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-gray-900 font-bold text-lg">
                    Recent Activities 🏃
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowActivities(false)}
                    className="bg-gray-100 px-3 py-1 rounded-full"
                  >
                    <Text className="text-gray-600 text-xs font-bold">Hide</Text>
                  </TouchableOpacity>
                </View>

                <View className="space-y-3">
                  {activities.slice(0, 5).map((activity, index) => (
                    <ActivityCard key={activity.id} activity={activity} index={index} />
                  ))}
                </View>

                {activities.length > 5 && (
                  <Text className="text-gray-500 text-xs text-center mt-3">
                    Showing 5 of {activities.length} activities
                  </Text>
                )}
              </View>
            )}

            {/* Comprehensive Data Display */}
            {showComprehensiveData && comprehensiveData && (
              <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-gray-900 font-bold text-lg">
                    Comprehensive Strava Data 📊
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowComprehensiveData(false)}
                    className="bg-gray-100 px-3 py-1 rounded-full"
                  >
                    <Text className="text-gray-600 text-xs font-bold">Hide</Text>
                  </TouchableOpacity>
                </View>

                <ComprehensiveDataDisplay data={comprehensiveData} />
              </View>
            )}

            {/* Features - Only show if not connected */}
            {!connected && (
              <View className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 mb-6 border border-white/20">
                <FeatureItem icon="🏃" text="Track your fitness activities" />
                <FeatureItem icon="📊" text="Sync workout data automatically" />
                <FeatureItem icon="✅" text="Verify challenge completion" />
                <FeatureItem icon="🏆" text="Earn rewards for your efforts" />
              </View>
            )}

            {/* Action Buttons */}
            {!connected ? (
              <TouchableOpacity
                className="bg-white px-8 py-5 rounded-2xl shadow-2xl mb-3"
                onPress={handleConnect}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator color="#667eea" size="small" />
                    <Text className="text-purple-600 font-black text-lg ml-3">
                      Connecting...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-purple-600 font-black text-lg text-center tracking-wide">
                    Connect with Strava
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  className="bg-white px-8 py-5 rounded-2xl shadow-2xl mb-3"
                  onPress={handleContinue}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text className="text-purple-600 font-black text-lg text-center tracking-wide">
                    Continue to App →
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-white/10 backdrop-blur-xl px-8 py-4 rounded-2xl border border-white/20"
                  onPress={handleDisconnect}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text className="text-white/80 font-bold text-base text-center">
                    Disconnect
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Info Section */}
            <View className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 mt-6 border border-white/20">
              <Text className="text-white font-bold text-lg mb-4">
                🔒 What we access:
              </Text>
              <InfoItem text="Your profile information" />
              <InfoItem text="Activity data (runs, rides, etc.)" />
              <InfoItem text="Activity details (distance, duration, pace)" />
              <Text className="text-white/60 text-xs mt-4 italic">
                We will never post to Strava without your permission
              </Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

function FeatureItem({ icon, text }) {
  return (
    <View className="flex-row items-center mb-4 last:mb-0">
      <View className="bg-white/10 w-10 h-10 rounded-xl items-center justify-center mr-3">
        <Text className="text-2xl">{icon}</Text>
      </View>
      <Text className="text-white font-semibold text-base flex-1">{text}</Text>
    </View>
  );
}

function InfoItem({ text }) {
  return (
    <View className="flex-row items-center mb-3">
      <Text className="text-white/80 text-sm mr-2">•</Text>
      <Text className="text-white/80 text-sm flex-1">{text}</Text>
    </View>
  );
}

function TestButton({ icon, label, onPress, status, disabled }) {
  const getStatusColor = () => {
    if (status === 'loading') return 'bg-blue-50 border-blue-300';
    if (status === 'success') return 'bg-green-50 border-green-300';
    if (status === 'error') return 'bg-red-50 border-red-300';
    return 'bg-gray-50 border-gray-300';
  };

  const getStatusIcon = () => {
    if (status === 'loading') return '⏳';
    if (status === 'success') return '✅';
    if (status === 'error') return '❌';
    return '';
  };

  return (
    <TouchableOpacity
      className={`flex-row items-center justify-between p-3 rounded-xl border mb-2 ${getStatusColor()}`}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center flex-1">
        <Text className="text-xl mr-3">{icon}</Text>
        <Text className="text-gray-800 font-semibold text-sm">{label}</Text>
      </View>
      {status && (
        <Text className="text-base ml-2">{getStatusIcon()}</Text>
      )}
    </TouchableOpacity>
  );
}

function ComprehensiveDataDisplay({ data }) {
  // Safe data access with proper null checks
  const safeData = data?.data || {};
  
  const summary = {
    athlete: {
      name: `${safeData.athlete?.firstname || ''} ${safeData.athlete?.lastname || ''}`,
      username: safeData.athlete?.username,
      location: safeData.athlete?.city && safeData.athlete?.country 
        ? `${safeData.athlete.city}, ${safeData.athlete.country}` 
        : null,
      memberSince: safeData.athlete?.created_at,
      premium: safeData.athlete?.premium
    },
    activities: {
      total: Array.isArray(safeData.activities) ? safeData.activities.length : 0,
      types: Array.isArray(safeData.activities) ? safeData.activities.reduce((acc, activity) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1;
        return acc;
      }, {}) : {},
      totalDistance: Array.isArray(safeData.activities) ? safeData.activities.reduce((sum, activity) => sum + (activity.distance || 0), 0) : 0,
      totalTime: Array.isArray(safeData.activities) ? safeData.activities.reduce((sum, activity) => sum + (activity.moving_time || 0), 0) : 0
    },
    segments: {
      total: Array.isArray(safeData.segments) ? safeData.segments.length : 0
    },
    routes: {
      total: Array.isArray(safeData.routes) ? safeData.routes.length : 0
    },
    clubs: {
      total: Array.isArray(safeData.clubs) ? safeData.clubs.length : 0,
      names: Array.isArray(safeData.clubs) ? safeData.clubs.map(club => club.name) : []
    },
    gear: {
      bikes: Array.isArray(safeData.gear) ? safeData.gear.filter(item => item.resource_state === 3 && item.frame_type === 1) : [],
      shoes: Array.isArray(safeData.gear) ? safeData.gear.filter(item => item.resource_state === 3 && item.frame_type === 4) : []
    }
  };

  const formatDistance = (meters) => {
    return (meters / 1000).toFixed(2);
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <ScrollView className="max-h-96">
      {/* Athlete Info */}
      <View className="mb-4">
        <Text className="text-gray-800 font-bold text-base mb-2">👤 Athlete Profile</Text>
        <View className="bg-blue-50 p-3 rounded-lg">
          <Text className="text-gray-900 font-semibold">{summary.athlete.name}</Text>
          {summary.athlete.username && (
            <Text className="text-blue-600 text-sm">@{summary.athlete.username}</Text>
          )}
          {summary.athlete.location && (
            <Text className="text-gray-600 text-sm">📍 {summary.athlete.location}</Text>
          )}
          <Text className="text-gray-500 text-xs">
            Member since: {new Date(summary.athlete.memberSince).toLocaleDateString()}
          </Text>
          {summary.athlete.premium && (
            <Text className="text-yellow-600 text-xs font-bold">⭐ Premium Member</Text>
          )}
        </View>
      </View>

      {/* Activities Summary */}
      <View className="mb-4">
        <Text className="text-gray-800 font-bold text-base mb-2">🏃 Activities Summary</Text>
        <View className="bg-green-50 p-3 rounded-lg">
          <Text className="text-gray-900 font-semibold">Total Activities: {summary.activities.total}</Text>
          <Text className="text-gray-600 text-sm">
            Total Distance: {formatDistance(summary.activities.totalDistance)} km
          </Text>
          <Text className="text-gray-600 text-sm">
            Total Time: {formatDuration(summary.activities.totalTime)}
          </Text>
          
          {Object.keys(summary.activities.types).length > 0 && (
            <View className="mt-2">
              <Text className="text-gray-700 text-sm font-semibold">Activity Types:</Text>
              {Object.entries(summary.activities.types).map(([type, count]) => (
                <Text key={type} className="text-gray-600 text-xs ml-2">
                  • {type}: {count}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Segments */}
      <View className="mb-4">
        <Text className="text-gray-800 font-bold text-base mb-2">🏁 Segments</Text>
        <View className="bg-purple-50 p-3 rounded-lg">
          <Text className="text-gray-900 font-semibold">Starred Segments: {summary.segments.total}</Text>
          {summary.segments.total > 0 && (
            <Text className="text-gray-600 text-sm">
              {Array.isArray(safeData.segments) ? safeData.segments.slice(0, 3).map(segment => segment.name).join(', ') : ''}
              {summary.segments.total > 3 && '...'}
            </Text>
          )}
        </View>
      </View>

      {/* Routes */}
      <View className="mb-4">
        <Text className="text-gray-800 font-bold text-base mb-2">🗺️ Routes</Text>
        <View className="bg-orange-50 p-3 rounded-lg">
          <Text className="text-gray-900 font-semibold">Created Routes: {summary.routes.total}</Text>
          {summary.routes.total > 0 && (
            <Text className="text-gray-600 text-sm">
              {Array.isArray(safeData.routes) ? safeData.routes.slice(0, 3).map(route => route.name).join(', ') : ''}
              {summary.routes.total > 3 && '...'}
            </Text>
          )}
        </View>
      </View>

      {/* Clubs */}
      <View className="mb-4">
        <Text className="text-gray-800 font-bold text-base mb-2">👥 Clubs</Text>
        <View className="bg-yellow-50 p-3 rounded-lg">
          <Text className="text-gray-900 font-semibold">Club Memberships: {summary.clubs.total}</Text>
          {summary.clubs.names.length > 0 && (
            <Text className="text-gray-600 text-sm">
              {summary.clubs.names.slice(0, 3).join(', ')}
              {summary.clubs.names.length > 3 && '...'}
            </Text>
          )}
        </View>
      </View>

      {/* Gear */}
      <View className="mb-4">
        <Text className="text-gray-800 font-bold text-base mb-2">🚴 Gear</Text>
        <View className="bg-red-50 p-3 rounded-lg">
          <Text className="text-gray-900 font-semibold">Bikes: {summary.gear.bikes.length}</Text>
          {summary.gear.bikes.length > 0 && (
            <Text className="text-gray-600 text-sm">
              {summary.gear.bikes.slice(0, 2).map(bike => bike.name).join(', ')}
              {summary.gear.bikes.length > 2 && '...'}
            </Text>
          )}
          
          <Text className="text-gray-900 font-semibold mt-2">Shoes: {summary.gear.shoes.length}</Text>
          {summary.gear.shoes.length > 0 && (
            <Text className="text-gray-600 text-sm">
              {summary.gear.shoes.slice(0, 2).map(shoe => shoe.name).join(', ')}
              {summary.gear.shoes.length > 2 && '...'}
            </Text>
          )}
        </View>
      </View>

      {/* Stats */}
      {safeData.stats && (
        <View className="mb-4">
          <Text className="text-gray-800 font-bold text-base mb-2">📊 Statistics</Text>
          <View className="bg-indigo-50 p-3 rounded-lg">
            <Text className="text-gray-900 font-semibold">All Time Stats</Text>
            {safeData.stats.all_ride_totals && (
              <Text className="text-gray-600 text-sm">
                Total Rides: {safeData.stats.all_ride_totals.count} | 
                Distance: {formatDistance(safeData.stats.all_ride_totals.distance)} km
              </Text>
            )}
            {safeData.stats.all_run_totals && (
              <Text className="text-gray-600 text-sm">
                Total Runs: {safeData.stats.all_run_totals.count} | 
                Distance: {formatDistance(safeData.stats.all_run_totals.distance)} km
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Data Timestamp */}
      <View className="mt-4 pt-3 border-t border-gray-200">
        <Text className="text-gray-500 text-xs text-center">
          Data fetched: {new Date(data.timestamp).toLocaleString()}
        </Text>
      </View>
    </ScrollView>
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

export default ConnectStrava;