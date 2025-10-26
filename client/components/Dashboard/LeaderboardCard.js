import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const LeaderboardCard = ({ 
  user, 
  rank, 
  metric, 
  value, 
  subtitle,
  isCurrentUser = false,
  animated = true,
  delay = 0,
  onPress,
  showBadge = true
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const slideValue = useRef(new Animated.Value(30)).current;
  const scaleValue = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 600,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.timing(slideValue, {
          toValue: 0,
          duration: 600,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 100,
          friction: 8,
          delay: delay,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animated, delay]);

  const getRankColor = (rank) => {
    if (rank === 1) return '#ffd700'; // Gold
    if (rank === 2) return '#c0c0c0'; // Silver
    if (rank === 3) return '#cd7f32'; // Bronze
    return '#6b7280'; // Gray
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankGradient = (rank) => {
    if (rank === 1) return ['#ffd700', '#ffed4e'];
    if (rank === 2) return ['#c0c0c0', '#e5e7eb'];
    if (rank === 3) return ['#cd7f32', '#d97706'];
    return ['#6b7280', '#4b5563'];
  };

  const formatAddress = (address) => {
    if (!address) return 'Unknown';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handlePress = () => {
    if (onPress) {
      onPress(user);
    }
  };

  const CardContent = () => (
    <View 
      className={`rounded-2xl p-5 shadow-lg border overflow-hidden ${
        isCurrentUser 
          ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200' 
          : 'bg-white/95 backdrop-blur-xl border-gray-100'
      }`}
    >
      {/* Rank indicator with gradient */}
      <View className="absolute top-0 right-0 w-16 h-16">
        <LinearGradient
          colors={getRankGradient(rank)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-full h-full rounded-bl-2xl"
        />
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-white font-black text-lg">
            {getRankIcon(rank)}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-4">
          {/* Enhanced rank badge */}
          <View 
            className="w-12 h-12 rounded-2xl items-center justify-center mr-4 shadow-sm"
            style={{ backgroundColor: getRankColor(rank) + '20' }}
          >
            <Text 
              className="text-lg font-black"
              style={{ color: getRankColor(rank) }}
            >
              {getRankIcon(rank)}
            </Text>
          </View>
          
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className={`font-bold text-base ${isCurrentUser ? 'text-purple-700' : 'text-gray-900'}`}>
                {formatAddress(user.address)}
              </Text>
              {isCurrentUser && (
                <View className="ml-2 bg-purple-200 px-2 py-0.5 rounded-full">
                  <Text className="text-purple-700 text-xs font-bold">YOU</Text>
                </View>
              )}
            </View>
            {subtitle && (
              <Text className="text-gray-500 text-sm font-medium">
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        
        <View className="items-end">
          <Text className={`font-black text-2xl ${isCurrentUser ? 'text-purple-600' : 'text-gray-900'}`}>
            {value}
          </Text>
          <Text className="text-gray-500 text-sm font-medium">
            {metric}
          </Text>
        </View>
      </View>
      
      {/* Current user highlight */}
      {isCurrentUser && (
        <View className="mt-3 pt-3 border-t border-purple-200">
          <View className="flex-row items-center justify-center">
            <Text className="text-purple-600 text-sm font-bold mr-2">👑</Text>
            <Text className="text-purple-600 text-sm font-bold">Your Position</Text>
          </View>
        </View>
      )}

      {/* Progress bar for top performers */}
      {rank <= 3 && (
        <View className="mt-3 pt-3 border-t border-gray-100">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-gray-500 text-xs">Performance</Text>
            <Text className="text-gray-700 text-xs font-semibold">
              {rank === 1 ? '100%' : rank === 2 ? '95%' : '90%'}
            </Text>
          </View>
          <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <View 
              className="h-full rounded-full"
              style={{ 
                width: rank === 1 ? '100%' : rank === 2 ? '95%' : '90%',
                backgroundColor: getRankColor(rank)
              }}
            />
          </View>
        </View>
      )}
    </View>
  );

  return (
    <Animated.View
      style={{
        opacity: animatedValue,
        transform: [
          { translateX: slideValue },
          { scale: scaleValue }
        ],
      }}
    >
      {onPress ? (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8} className="mb-3">
          <CardContent />
        </TouchableOpacity>
      ) : (
        <View className="mb-3">
          <CardContent />
        </View>
      )}
    </Animated.View>
  );
};

export default LeaderboardCard;
