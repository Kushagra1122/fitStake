import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Animated, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LiveStatsCard from './LiveStatsCard';
import TrendChart from './TrendChart';
import ActivityFeedItem from './ActivityFeedItem';
import LeaderboardCard from './LeaderboardCard';
import ComparisonChart from './ComparisonChart';
import ProtocolHealthIndicator from './ProtocolHealthIndicator';

const DashboardLayout = ({
  stats = {},
  trends = {},
  activities = [],
  leaderboard = [],
  comparisonData = [],
  healthMetrics = {},
  isLoading = false,
  onRefresh,
  onStatsPress,
  onActivityPress,
  onLeaderboardPress,
  showPersonalTab = true,
  showSystemTab = true,
  showLeaderboardTab = true,
  showAnalyticsTab = true
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setRefreshing(false);
  };

  const QuickStatsGrid = () => (
    <View className="flex-row flex-wrap justify-between mb-6">
      <View className="w-[48%] mb-4">
        <LiveStatsCard
          title="Active Challenges"
          value={stats.activeChallenges || '0'}
          subtitle="Currently running"
          icon="🎯"
          color="#667eea"
          trend="up"
          trendValue="+12%"
          animated={true}
          delay={0}
          onPress={() => onStatsPress?.('challenges')}
          isLoading={isLoading}
        />
      </View>
      <View className="w-[48%] mb-4">
        <LiveStatsCard
          title="Total Staked"
          value={`${stats.totalStaked || '0.0'} ETH`}
          subtitle="In active challenges"
          icon="💰"
          color="#10b981"
          trend="up"
          trendValue="+8.5%"
          animated={true}
          delay={100}
          onPress={() => onStatsPress?.('staked')}
          isLoading={isLoading}
        />
      </View>
      <View className="w-[48%] mb-4">
        <LiveStatsCard
          title="Success Rate"
          value={`${stats.successRate || '0'}%`}
          subtitle="Completion rate"
          icon="📈"
          color="#f59e0b"
          trend="up"
          trendValue="+3.2%"
          animated={true}
          delay={200}
          onPress={() => onStatsPress?.('success')}
          isLoading={isLoading}
        />
      </View>
      <View className="w-[48%] mb-4">
        <LiveStatsCard
          title="Active Users"
          value={stats.activeUsers || '0'}
          subtitle="Currently participating"
          icon="👥"
          color="#8b5cf6"
          trend="up"
          trendValue="+15%"
          animated={true}
          delay={300}
          onPress={() => onStatsPress?.('users')}
          isLoading={isLoading}
        />
      </View>
    </View>
  );

  const ChartsSection = () => (
    <View className="mb-6">
      <View className="mb-4">
        <TrendChart
          data={trends.challenges || []}
          title="Challenge Activity"
          color="#667eea"
          height={200}
          animated={true}
          delay={400}
          showStats={true}
          isLoading={isLoading}
          onRefresh={onRefresh}
        />
      </View>
      
      <View className="mb-4">
        <ComparisonChart
          data={comparisonData}
          title="Challenge Distribution"
          height={200}
          animated={true}
          delay={500}
          showLegend={true}
          showStats={true}
          isLoading={isLoading}
          onRefresh={onRefresh}
        />
      </View>
    </View>
  );

  const ActivitySection = () => (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-gray-800 font-bold text-xl">Recent Activity</Text>
        <TouchableOpacity className="p-2 rounded-full bg-gray-100">
          <Text className="text-gray-600 text-sm font-medium">View All</Text>
        </TouchableOpacity>
      </View>
      
      {activities.length > 0 ? (
        <View>
          {activities.slice(0, 5).map((activity, index) => (
            <ActivityFeedItem
              key={activity.id || index}
              activity={activity}
              index={index}
              animated={true}
              onPress={onActivityPress}
              showActions={true}
            />
          ))}
        </View>
      ) : (
        <View className="bg-gray-50 rounded-2xl p-8 items-center">
          <Text className="text-4xl mb-3">📝</Text>
          <Text className="text-gray-500 text-base font-medium">No recent activity</Text>
          <Text className="text-gray-400 text-sm mt-1">Activities will appear here</Text>
        </View>
      )}
    </View>
  );

  const LeaderboardSection = () => (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-gray-800 font-bold text-xl">Top Performers</Text>
        <TouchableOpacity className="p-2 rounded-full bg-gray-100">
          <Text className="text-gray-600 text-sm font-medium">View All</Text>
        </TouchableOpacity>
      </View>
      
      {leaderboard.length > 0 ? (
        <View>
          {leaderboard.slice(0, 5).map((user, index) => (
            <LeaderboardCard
              key={user.address || index}
              user={user}
              rank={index + 1}
              metric="Points"
              value={user.points || '0'}
              subtitle={`${user.challengesCompleted || 0} challenges`}
              isCurrentUser={user.isCurrentUser || false}
              animated={true}
              delay={600 + index * 100}
              onPress={onLeaderboardPress}
              showBadge={true}
            />
          ))}
        </View>
      ) : (
        <View className="bg-gray-50 rounded-2xl p-8 items-center">
          <Text className="text-4xl mb-3">🏆</Text>
          <Text className="text-gray-500 text-base font-medium">No leaderboard data</Text>
          <Text className="text-gray-400 text-sm mt-1">Complete challenges to appear here</Text>
        </View>
      )}
    </View>
  );

  const HealthSection = () => (
    <View className="mb-6">
      <ProtocolHealthIndicator
        metrics={healthMetrics}
        animated={true}
        delay={800}
        onRefresh={onRefresh}
        showDetails={true}
      />
    </View>
  );

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-gray-800 font-black text-3xl mb-2">Dashboard</Text>
          <Text className="text-gray-600 text-base">
            Track your fitness journey and challenge performance
          </Text>
        </View>

        {/* Quick Stats Grid */}
        <QuickStatsGrid />

        {/* Charts Section */}
        <ChartsSection />

        {/* Activity Section */}
        <ActivitySection />

        {/* Leaderboard Section */}
        <LeaderboardSection />

        {/* Health Section */}
        <HealthSection />

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </Animated.View>
  );
};

export default DashboardLayout;
