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

  // Calculate optimal number of labels based on data length
  const getOptimalLabels = () => {
    if (!data || data.length <= 7) {
      return data?.map(item => {
        const date = new Date(item.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }) || [];
    }
    
    // For longer datasets, show fewer labels with better spacing
    const step = Math.ceil(data.length / 4); // Show max 4 labels
    return data.map((item, index) => {
      if (index % step === 0 || index === data.length - 1) {
        const date = new Date(item.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }
      return '';
    });
  };

  // Calculate proper Y-axis values with better range
  const getYAxisValues = () => {
    if (!data || data.length === 0) return { min: 0, max: 100, segments: 4 };
    
    const values = data.map(item => Number(item.value) || 0);
    let minValue = Math.min(...values);
    let maxValue = Math.max(...values);
    
    // If all values are the same, create a reasonable range
    if (minValue === maxValue) {
      minValue = Math.max(0, minValue - minValue * 0.1);
      maxValue = maxValue + maxValue * 0.1;
    }
    
    // Add some padding to the range
    const range = maxValue - minValue;
    const padding = range * 0.1;
    
    return {
      min: Math.max(0, minValue - padding),
      max: maxValue + padding,
      segments: 4
    };
  };

  if (isLoading) {
    return (
      <Animated.View 
        style={{ opacity: animatedValue }} 
        className="bg-pink-50/90 backdrop-blur-xl rounded-3xl p-5 shadow-xl border border-pink-100"
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="h-6 w-32 bg-pink-200 rounded-lg animate-pulse" />
          <View className="h-8 w-20 bg-pink-200 rounded-lg animate-pulse" />
        </View>
        <View className="h-40 bg-pink-100 rounded-2xl animate-pulse" />
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
        className="bg-pink-50/90 backdrop-blur-xl rounded-3xl p-5 shadow-xl border border-pink-100"
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-gray-800 font-bold text-xl">{title}</Text>
          {onRefresh && (
            <TouchableOpacity onPress={onRefresh} className="p-2">
              <Text className="text-2xl">🔄</Text>
            </TouchableOpacity>
          )}
        </View>
        <View className="h-40 items-center justify-center bg-pink-100/30 rounded-2xl">
          <Text className="text-4xl mb-2">📊</Text>
          <Text className="text-gray-500 text-base font-medium">No data available</Text>
          <Text className="text-gray-400 text-sm mt-1">Check back later for updates</Text>
        </View>
      </Animated.View>
    );
  }

  const chartData = {
    labels: getOptimalLabels(),
    datasets: [
      {
        data: data.map(item => Number(item.value) || 0),
        color: (opacity = 1) => color,
        strokeWidth: 3,
      },
    ],
  };

  const yAxisConfig = getYAxisValues();

  const chartConfig = {
    backgroundColor: '#fdf2f8',
    backgroundGradientFrom: '#fdf2f8',
    backgroundGradientTo: '#fdf2f8',
    decimalPlaces: 0,
    color: (opacity = 1) => color,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { 
      r: '0', // Completely remove dots
    },
    propsForBackgroundLines: { 
      strokeDasharray: '5,5', 
      stroke: '#FBCFE8', 
      strokeWidth: 1 
    },
    propsForLabels: {
      fontSize: 9, // Smaller font for better fit
      fontWeight: '500',
    },
    formatYLabel: (yLabel) => {
      const value = Number(yLabel);
      
      // Handle very small numbers
      if (value < 1 && value > 0) {
        return value.toFixed(1);
      }
      
      // Handle whole numbers
      if (Math.abs(value - Math.round(value)) < 0.001) {
        return Math.round(value).toString();
      }
      
      // For larger numbers, use compact format
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}k`;
      }
      
      return value.toFixed(0);
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
      className="bg-pink-50/90 backdrop-blur-xl rounded-3xl p-5 shadow-xl border border-pink-100"
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
          <TouchableOpacity onPress={onRefresh} className="p-2 rounded-full bg-pink-100/50">
            <Text className="text-lg">🔄</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Chart */}
      <View className="relative">
        <LineChart
          data={chartData}
          width={Math.max(screenWidth - 100, 280)} // More padding for labels
          height={height}
          chartConfig={chartConfig}
          bezier
          style={{ 
            marginVertical: 8, 
            borderRadius: 16,
            backgroundColor: '#fdf2f8',
            marginLeft: -10, // Adjust left margin for better label spacing
          }}
          withDots={false}
          withShadow={false}
          withInnerLines={false}
          withOuterLines={true}
          fromZero={false}
          segments={yAxisConfig.segments}
          // Use chart kit's internal y-axis range calculation
          yLabelsOffset={10}
          xLabelsOffset={-5}
        />
        
        {/* Subtle pink gradient overlay */}
        <LinearGradient
          colors={['#fdf2f820', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="absolute inset-0 rounded-2xl"
          pointerEvents="none"
        />
      </View>

      {/* Stats Row */}
      {showStats && stats && (
        <View className="flex-row justify-between mt-4 pt-4 border-t border-pink-100">
          <View className="items-center">
            <Text className="text-gray-500 text-xs font-medium">Current</Text>
            <Text className="text-gray-800 font-bold text-lg">{stats.current.toLocaleString()}</Text>
          </View>
          <View className="items-center">
            <Text className="text-gray-500 text-xs font-medium">Max</Text>
            <Text className="text-gray-800 font-bold text-lg">{stats.max.toLocaleString()}</Text>
          </View>
          <View className="items-center">
            <Text className="text-gray-500 text-xs font-medium">Min</Text>
            <Text className="text-gray-800 font-bold text-lg">{stats.min.toLocaleString()}</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

export default TrendChart;