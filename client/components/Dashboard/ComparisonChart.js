import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';

const ComparisonChart = ({ 
  data, 
  title, 
  height = 200,
  animated = true,
  delay = 0,
  showLegend = true,
  showStats = true,
  isLoading = false,
  onRefresh
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.9)).current;
  const screenWidth = Dimensions.get('window').width;
  const [selectedSegment, setSelectedSegment] = useState(null);

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 50,
          friction: 8,
          delay: delay,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animated, delay]);

  if (isLoading) {
    return (
      <Animated.View
        style={{
          opacity: animatedValue,
        }}
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
          transform: [{ scale: scaleValue }]
        }}
        className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 shadow-xl border border-gray-100"
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-gray-800 font-bold text-xl">{title}</Text>
          {onRefresh && (
            <TouchableOpacity onPress={onRefresh} className="p-2 rounded-full bg-gray-100">
              <Text className="text-lg">🔄</Text>
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

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData = data.map((item, index) => ({
    name: item.name,
    population: item.value,
    color: item.color || `hsl(${index * 60}, 70%, 50%)`,
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  }));

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    color: (opacity = 1) => `rgba(107, 126, 234, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 126, 234, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 12,
      fontWeight: 'bold',
    },
  };

  const getPercentage = (value) => {
    return ((value / total) * 100).toFixed(1);
  };

  const LegendItem = ({ item, index, isSelected }) => (
    <TouchableOpacity
      onPress={() => setSelectedSegment(isSelected ? null : index)}
      className={`flex-row items-center p-3 rounded-xl mb-2 ${
        isSelected ? 'bg-gray-100' : 'bg-transparent'
      }`}
      activeOpacity={0.7}
    >
      <View 
        className="w-4 h-4 rounded-full mr-3"
        style={{ backgroundColor: item.color }}
      />
      <View className="flex-1">
        <Text className="text-gray-800 font-semibold text-sm">{item.name}</Text>
        <Text className="text-gray-500 text-xs">
          {item.value} ({getPercentage(item.value)}%)
        </Text>
      </View>
      {isSelected && (
        <View className="w-6 h-6 rounded-full bg-blue-100 items-center justify-center">
          <Text className="text-blue-600 text-xs font-bold">✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Animated.View
      style={{
        opacity: animatedValue,
        transform: [{ scale: scaleValue }]
      }}
      className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 shadow-xl border border-gray-100"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-gray-800 font-bold text-xl">{title}</Text>
          <Text className="text-gray-500 text-sm mt-1">
            Total: {total} items
          </Text>
        </View>
        {onRefresh && (
          <TouchableOpacity onPress={onRefresh} className="p-2 rounded-full bg-gray-100">
            <Text className="text-lg">🔄</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="flex-row">
        {/* Chart */}
        <View className="flex-1">
          <PieChart
            data={chartData}
            width={screenWidth - 200}
            height={height}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 0]}
            absolute
          />
        </View>

        {/* Interactive Legend */}
        {showLegend && (
          <View className="w-32 ml-4">
            <Text className="text-gray-700 font-semibold text-sm mb-3">Breakdown</Text>
            {data.map((item, index) => (
              <LegendItem
                key={index}
                item={item}
                index={index}
                isSelected={selectedSegment === index}
              />
            ))}
          </View>
        )}
      </View>

      {/* Stats Row */}
      {showStats && (
        <View className="mt-4 pt-4 border-t border-gray-100">
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-gray-500 text-xs font-medium">Categories</Text>
              <Text className="text-gray-800 font-bold text-lg">{data.length}</Text>
            </View>
            <View className="items-center">
              <Text className="text-gray-500 text-xs font-medium">Largest</Text>
              <Text className="text-gray-800 font-bold text-lg">
                {Math.max(...data.map(d => d.value))}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-gray-500 text-xs font-medium">Average</Text>
              <Text className="text-gray-800 font-bold text-lg">
                {Math.round(total / data.length)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Selected segment details */}
      {selectedSegment !== null && (
        <View className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
          <Text className="text-blue-800 font-bold text-sm mb-1">
            {data[selectedSegment].name}
          </Text>
          <Text className="text-blue-600 text-sm">
            Value: {data[selectedSegment].value} ({getPercentage(data[selectedSegment].value)}%)
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

export default ComparisonChart;
