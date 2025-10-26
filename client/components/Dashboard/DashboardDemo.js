import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  LiveStatsCard,
  TrendChart,
  ActivityFeedItem,
  LeaderboardCard,
  ComparisonChart,
  DashboardLayout,
  ProtocolHealthIndicator
} from '../components/Dashboard';

// Example usage of the enhanced dashboard components
const DashboardDemo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for demonstration
  const mockStats = {
    activeChallenges: 12,
    totalStaked: '2.45',
    successRate: 87,
    activeUsers: 156
  };

  const mockTrends = {
    challenges: [
      { date: '2024-01-01', value: 5 },
      { date: '2024-01-02', value: 8 },
      { date: '2024-01-03', value: 12 },
      { date: '2024-01-04', value: 15 },
      { date: '2024-01-05', value: 18 },
      { date: '2024-01-06', value: 22 },
      { date: '2024-01-07', value: 25 }
    ]
  };

  const mockActivities = [
    {
      id: 1,
      type: 'task_completed',
      timestamp: Date.now() / 1000 - 3600, // 1 hour ago
      data: {
        user: '0x1234...5678',
        distance: '5000',
        duration: '1800'
      }
    },
    {
      id: 2,
      type: 'challenge_created',
      timestamp: Date.now() / 1000 - 7200, // 2 hours ago
      data: {
        creator: '0xabcd...efgh',
        description: 'Run 10km in under 45 minutes'
      }
    },
    {
      id: 3,
      type: 'winnings_distributed',
      timestamp: Date.now() / 1000 - 10800, // 3 hours ago
      data: {
        winner: '0x9876...5432',
        amount: '0.15'
      }
    }
  ];

  const mockLeaderboard = [
    {
      address: '0x1234...5678',
      points: 1250,
      challengesCompleted: 8,
      isCurrentUser: true
    },
    {
      address: '0xabcd...efgh',
      points: 1180,
      challengesCompleted: 7,
      isCurrentUser: false
    },
    {
      address: '0x9876...5432',
      points: 1050,
      challengesCompleted: 6,
      isCurrentUser: false
    }
  ];

  const mockComparisonData = [
    { name: 'Running', value: 45, color: '#10b981' },
    { name: 'Cycling', value: 30, color: '#3b82f6' },
    { name: 'Swimming', value: 15, color: '#06b6d4' },
    { name: 'Other', value: 10, color: '#8b5cf6' }
  ];

  const mockHealthMetrics = {
    totalChallenges: 156,
    activeChallenges: 23,
    successRate: 87.5,
    uniqueUsers: 89
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  const handleStatsPress = (type) => {
    console.log(`Stats pressed: ${type}`);
    // Navigate to detailed stats view
  };

  const handleActivityPress = (activity) => {
    console.log('Activity pressed:', activity);
    // Navigate to activity details
  };

  const handleLeaderboardPress = (user) => {
    console.log('Leaderboard user pressed:', user);
    // Navigate to user profile
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <ScrollView className="flex-1">
        <View className="px-4 pt-12 pb-4">
          <Text className="text-white text-3xl font-black mb-2">Enhanced Dashboard</Text>
          <Text className="text-white/80 text-base mb-6">
            Modern UI/UX with improved animations and interactions
          </Text>

          {/* Individual Component Examples */}
          <View className="mb-6">
            <Text className="text-white text-xl font-bold mb-4">Live Stats Cards</Text>
            <View className="flex-row flex-wrap justify-between">
              <View className="w-[48%] mb-4">
                <LiveStatsCard
                  title="Active Challenges"
                  value="12"
                  subtitle="Currently running"
                  icon="🎯"
                  color="#667eea"
                  trend="up"
                  trendValue="+12%"
                  animated={true}
                  delay={0}
                  onPress={() => handleStatsPress('challenges')}
                />
              </View>
              <View className="w-[48%] mb-4">
                <LiveStatsCard
                  title="Total Staked"
                  value="2.45 ETH"
                  subtitle="In active challenges"
                  icon="💰"
                  color="#10b981"
                  trend="up"
                  trendValue="+8.5%"
                  animated={true}
                  delay={100}
                  onPress={() => handleStatsPress('staked')}
                />
              </View>
            </View>
          </View>

          {/* Trend Chart Example */}
          <View className="mb-6">
            <Text className="text-white text-xl font-bold mb-4">Trend Chart</Text>
            <TrendChart
              data={mockTrends.challenges}
              title="Challenge Activity"
              color="#667eea"
              height={200}
              animated={true}
              delay={200}
              showStats={true}
              isLoading={isLoading}
              onRefresh={handleRefresh}
            />
          </View>

          {/* Activity Feed Example */}
          <View className="mb-6">
            <Text className="text-white text-xl font-bold mb-4">Activity Feed</Text>
            {mockActivities.map((activity, index) => (
              <ActivityFeedItem
                key={activity.id}
                activity={activity}
                index={index}
                animated={true}
                onPress={handleActivityPress}
                showActions={true}
              />
            ))}
          </View>

          {/* Leaderboard Example */}
          <View className="mb-6">
            <Text className="text-white text-xl font-bold mb-4">Leaderboard</Text>
            {mockLeaderboard.map((user, index) => (
              <LeaderboardCard
                key={user.address}
                user={user}
                rank={index + 1}
                metric="Points"
                value={user.points}
                subtitle={`${user.challengesCompleted} challenges`}
                isCurrentUser={user.isCurrentUser}
                animated={true}
                delay={300 + index * 100}
                onPress={handleLeaderboardPress}
                showBadge={true}
              />
            ))}
          </View>

          {/* Comparison Chart Example */}
          <View className="mb-6">
            <Text className="text-white text-xl font-bold mb-4">Comparison Chart</Text>
            <ComparisonChart
              data={mockComparisonData}
              title="Activity Distribution"
              height={200}
              animated={true}
              delay={400}
              showLegend={true}
              showStats={true}
              isLoading={isLoading}
              onRefresh={handleRefresh}
            />
          </View>

          {/* Protocol Health Example */}
          <View className="mb-6">
            <Text className="text-white text-xl font-bold mb-4">Protocol Health</Text>
            <ProtocolHealthIndicator
              metrics={mockHealthMetrics}
              animated={true}
              delay={500}
              onRefresh={handleRefresh}
              showDetails={true}
            />
          </View>

          {/* Full Dashboard Layout Example */}
          <View className="mb-6">
            <Text className="text-white text-xl font-bold mb-4">Complete Dashboard Layout</Text>
            <View className="bg-white/10 backdrop-blur-xl rounded-3xl p-4">
              <Text className="text-white text-sm mb-2">
                The DashboardLayout component combines all components into a cohesive dashboard:
              </Text>
              <Text className="text-white/80 text-xs">
                • Responsive grid layout for stats cards{'\n'}
                • Integrated charts with loading states{'\n'}
                • Activity feed with interactive elements{'\n'}
                • Leaderboard with ranking visuals{'\n'}
                • Health indicator with progress rings{'\n'}
                • Pull-to-refresh functionality{'\n'}
                • Smooth animations and transitions
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default DashboardDemo;
