import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const ActivityFeedItem = ({ 
  activity, 
  index = 0,
  animated = true,
  onPress,
  showActions = true
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const slideValue = useRef(new Animated.Value(50)).current;
  const scaleValue = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 600,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideValue, {
          toValue: 0,
          duration: 600,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 100,
          friction: 8,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animated, index]);

  const getActivityIcon = (type) => {
    const icons = {
      'challenge_created': '🎯',
      'task_completed': '✅',
      'winnings_distributed': '💰',
      'user_joined': '👥',
    };
    return icons[type] || '📝';
  };

  const getActivityColor = (type) => {
    const colors = {
      'challenge_created': '#667eea',
      'task_completed': '#10b981',
      'winnings_distributed': '#f59e0b',
      'user_joined': '#8b5cf6',
    };
    return colors[type] || '#6b7280';
  };

  const getActivityText = (activity) => {
    const { type, data } = activity;
    
    switch (type) {
      case 'challenge_created':
        return `New challenge created: "${data.description.substring(0, 30)}..."`;
      case 'task_completed':
        return `Task completed: ${(parseInt(data.distance) / 1000).toFixed(2)} km`;
      case 'winnings_distributed':
        return `Winnings distributed: ${parseFloat(data.amount).toFixed(4)} ETH`;
      case 'user_joined':
        return `User joined challenge #${data.challengeId}`;
      default:
        return 'Activity recorded';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'Unknown';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getActivityGradient = (type) => {
    const gradients = {
      'challenge_created': ['#667eea', '#764ba2'],
      'task_completed': ['#10b981', '#059669'],
      'winnings_distributed': ['#f59e0b', '#d97706'],
      'user_joined': ['#8b5cf6', '#7c3aed'],
    };
    return gradients[type] || ['#6b7280', '#4b5563'];
  };

  const handlePress = () => {
    if (onPress) {
      // Add haptic feedback here if available
      onPress(activity);
    }
  };

  return (
    <Animated.View
      style={{
        opacity: animatedValue,
        transform: [
          { translateY: slideValue },
          { scale: scaleValue }
        ],
      }}
    >
      <TouchableOpacity 
        onPress={handlePress}
        activeOpacity={0.7}
        className="mb-3"
      >
        <View className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-gray-100 overflow-hidden">
          {/* Gradient accent bar */}
          <LinearGradient
            colors={getActivityGradient(activity.type)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="absolute top-0 left-0 right-0 h-1"
          />
          
          <View className="flex-row items-start">
            {/* Icon with enhanced styling */}
            <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4 shadow-sm" 
                  style={{ backgroundColor: getActivityColor(activity.type) + '15' }}>
              <Text className="text-xl">{getActivityIcon(activity.type)}</Text>
            </View>
            
            <View className="flex-1">
              {/* Main content */}
              <Text className="text-gray-900 font-bold text-base mb-2 leading-5">
                {getActivityText(activity)}
              </Text>
              
              {/* User and time info */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
                  <Text className="text-gray-600 text-sm font-medium">
                    {formatAddress(activity.data.user || activity.data.creator || activity.data.winner)}
                  </Text>
                </View>
                <Text className="text-gray-500 text-sm font-medium">
                  {formatTime(activity.timestamp)}
                </Text>
              </View>
              
              {/* Activity-specific badges */}
              {activity.type === 'task_completed' && (
                <View className="flex-row items-center space-x-2">
                  <View className="bg-green-100 px-3 py-1.5 rounded-full">
                    <Text className="text-green-700 text-sm font-bold">
                      🏃‍♂️ {(parseInt(activity.data.distance) / 1000).toFixed(2)} km
                    </Text>
                  </View>
                  <View className="bg-blue-100 px-3 py-1.5 rounded-full">
                    <Text className="text-blue-700 text-sm font-bold">
                      ⏱️ {Math.floor(parseInt(activity.data.duration) / 60)}m
                    </Text>
                  </View>
                </View>
              )}
              
              {activity.type === 'winnings_distributed' && (
                <View className="bg-gradient-to-r from-yellow-100 to-orange-100 px-3 py-1.5 rounded-full self-start">
                  <Text className="text-yellow-800 text-sm font-bold">
                    💰 +{parseFloat(activity.data.amount).toFixed(4)} ETH
                  </Text>
                </View>
              )}

              {activity.type === 'challenge_created' && (
                <View className="bg-purple-100 px-3 py-1.5 rounded-full self-start">
                  <Text className="text-purple-700 text-sm font-bold">
                    🎯 Challenge Created
                  </Text>
                </View>
              )}

              {activity.type === 'user_joined' && (
                <View className="bg-indigo-100 px-3 py-1.5 rounded-full self-start">
                  <Text className="text-indigo-700 text-sm font-bold">
                    👥 Joined Challenge
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Action buttons */}
          {showActions && (
            <View className="flex-row justify-end mt-3 pt-3 border-t border-gray-100">
              <TouchableOpacity className="px-3 py-1.5 bg-gray-100 rounded-full mr-2">
                <Text className="text-gray-600 text-xs font-medium">View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity className="px-3 py-1.5 bg-blue-100 rounded-full">
                <Text className="text-blue-600 text-xs font-medium">Share</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ActivityFeedItem;
