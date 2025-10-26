import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';

const TrendChart = ({ 
  data, 
  title, 
  color = '#667eea', 
  height = 200, 
  animated = true, 
  delay = 0,
  showStats = true,
  isLoading = false,
  onRefresh
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const slideValue = useRef(new Animated.Value(30)).current;
  const { width: screenWidth = 300 } = Dimensions.get('window') || {};
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(slideValue, {
          toValue: 0,
          duration: 800,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animated, delay]);

  const getStats = () => {
    if (!data || data.length === 0) return null;
    
    const values = data.map(item => Number(item.value) || 0);
    const current = values[values.length - 1];
    const previous = values[values.length - 2] || current;
    const change = ((current - previous) / previous) * 100;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    return {
      current,
      change: isNaN(change) ? 0 : change,
      max,
      min,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
    };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <Animated.View 
        style={{ opacity: animatedValue }} 
        className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 shadow-xl border border-gray-100"
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="h-6 w-32 bg-gray-200 rounded-lg animate-pulse" />
          <View className="h-8 w-20 bg-gray-200 rounded-lg animate-pulse" />
        </View>
        <View className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      </Animated.View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Animated.View 
        style={{ 
          opacity: animatedValue,
          transform: [{ translateY: slideValue }]
        }} 
        className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 shadow-xl border border-gray-100"
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-gray-800 font-bold text-xl">{title}</Text>
          {onRefresh && (
            <TouchableOpacity onPress={onRefresh} className="p-2">
              <Text className="text-2xl">🔄</Text>
            </TouchableOpacity>
          )}
        </View>
        <View className="h-40 items-center justify-center bg-gray-50 rounded-2xl">
          <Text className="text-4xl mb-2">📊</Text>
          <Text className="text-gray-500 text-base font-medium">No data available</Text>
          <Text className="text-gray-400 text-sm mt-1">Check back later for updates</Text>
        </View>
      </Animated.View>
    );
  }

  const chartData = {
    labels: data.map(item => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        data: data.map(item => Number(item.value) || 0),
        color: (opacity = 1) => color,
        strokeWidth: 4,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1) => color,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { 
      r: '6', 
      strokeWidth: '3', 
      stroke: color,
      fill: '#ffffff'
    },
    propsForBackgroundLines: { 
      strokeDasharray: '5,5', 
      stroke: '#E5E7EB', 
      strokeWidth: 1 
    },
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '➡️';
  };

  const getTrendColor = (trend) => {
    if (trend === 'up') return '#10b981';
    if (trend === 'down') return '#ef4444';
    return '#6b7280';
  };

  return (
    <Animated.View 
      style={{ 
        opacity: animatedValue,
        transform: [{ translateY: slideValue }]
      }} 
      className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 shadow-xl border border-gray-100"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-gray-800 font-bold text-xl">{title}</Text>
          {stats && (
            <View className="flex-row items-center mt-1">
              <Text className="text-xs mr-1">{getTrendIcon(stats.trend)}</Text>
              <Text 
                className="text-sm font-semibold"
                style={{ color: getTrendColor(stats.trend) }}
              >
                {stats.change > 0 ? '+' : ''}{stats.change.toFixed(1)}%
              </Text>
            </View>
          )}
        </View>
        {onRefresh && (
          <TouchableOpacity onPress={onRefresh} className="p-2 rounded-full bg-gray-100">
            <Text className="text-lg">🔄</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Chart */}
      <View className="relative">
        <LineChart
          data={chartData}
          width={screenWidth - 100}
          height={height}
          chartConfig={chartConfig}
          bezier
          style={{ marginVertical: 8, borderRadius: 16 }}
          withDots
          withShadow={false}
          withInnerLines={false}
          withOuterLines={true}
        />
        
        {/* Gradient overlay for better visual appeal */}
        <LinearGradient
          colors={[`${color}20`, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="absolute inset-0 rounded-2xl"
          pointerEvents="none"
        />
      </View>

      {/* Stats Row */}
      {showStats && stats && (
        <View className="flex-row justify-between mt-4 pt-4 border-t border-gray-100">
          <View className="items-center">
            <Text className="text-gray-500 text-xs font-medium">Current</Text>
            <Text className="text-gray-800 font-bold text-lg">{stats.current}</Text>
          </View>
          <View className="items-center">
            <Text className="text-gray-500 text-xs font-medium">Max</Text>
            <Text className="text-gray-800 font-bold text-lg">{stats.max}</Text>
          </View>
          <View className="items-center">
            <Text className="text-gray-500 text-xs font-medium">Min</Text>
            <Text className="text-gray-800 font-bold text-lg">{stats.min}</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

export default TrendChart;
