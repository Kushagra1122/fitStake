import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const ProgressRing = ({ 
  progress, 
  size = 80, 
  strokeWidth = 8, 
  color = '#667eea',
  backgroundColor = '#E5E7EB',
  animated = true,
  delay = 0,
  showPercentage = true
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        delay: delay,
        useNativeDriver: false,
      }).start();
    }
  }, [animated, delay]);

  // Pulse animation for high scores
  useEffect(() => {
    if (progress >= 80) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [progress]);

  const animatedStrokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, strokeDashoffset],
  });

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ scale: pulseValue }] }}>
      {/* Background circle */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor,
          position: 'absolute',
        }}
      />
      
      {/* Progress circle */}
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          borderTopColor: color,
          borderRightColor: color,
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          transform: [{ rotate: '-90deg' }],
          position: 'absolute',
        }}
      />
      
      {/* Center content */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {showPercentage && (
          <Text className="text-gray-700 font-black text-lg">
            {Math.round(progress)}%
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const ProtocolHealthIndicator = ({ 
  metrics, 
  animated = true,
  delay = 0,
  onRefresh,
  showDetails = true
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const slideValue = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.timing(slideValue, {
          toValue: 0,
          duration: 600,
          delay: delay,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animated, delay]);

  const getHealthScore = () => {
    if (!metrics) return 0;
    
    const { totalChallenges, activeChallenges, successRate, uniqueUsers } = metrics;
    
    let score = 0;
    
    // Activity score (0-40 points)
    if (totalChallenges > 0) score += Math.min(40, (totalChallenges / 10) * 40);
    
    // Engagement score (0-30 points)
    if (uniqueUsers > 0) score += Math.min(30, (uniqueUsers / 5) * 30);
    
    // Success rate score (0-30 points)
    score += Math.min(30, parseFloat(successRate) * 0.3);
    
    return Math.min(100, Math.max(0, score));
  };

  const healthScore = getHealthScore();
  
  const getHealthColor = (score) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#f59e0b'; // Yellow
    if (score >= 40) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getHealthStatus = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const getHealthIcon = (score) => {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    if (score >= 40) return '🟠';
    return '🔴';
  };

  const getHealthGradient = (score) => {
    if (score >= 80) return ['#10b981', '#059669'];
    if (score >= 60) return ['#f59e0b', '#d97706'];
    if (score >= 40) return ['#f97316', '#ea580c'];
    return ['#ef4444', '#dc2626'];
  };

  const MetricItem = ({ label, value, icon, color = '#6b7280' }) => (
    <View className="flex-row items-center justify-between py-2">
      <View className="flex-row items-center">
        <Text className="text-lg mr-2">{icon}</Text>
        <Text className="text-gray-600 text-sm font-medium">{label}</Text>
      </View>
      <Text className="text-gray-900 font-bold text-sm">{value}</Text>
    </View>
  );

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
          <Text className="text-gray-800 font-bold text-xl">Protocol Health</Text>
          <Text className="text-gray-500 text-sm mt-1">
            System performance overview
          </Text>
        </View>
        {onRefresh && (
          <TouchableOpacity onPress={onRefresh} className="p-2 rounded-full bg-gray-100">
            <Text className="text-lg">🔄</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Health Score Circle */}
      <View className="items-center mb-6">
        <View className="relative">
          <ProgressRing
            progress={healthScore}
            size={120}
            strokeWidth={12}
            color={getHealthColor(healthScore)}
            animated={animated}
            delay={delay + 200}
          />
          
          {/* Status badge */}
          <View className="absolute -bottom-2 -right-2">
            <LinearGradient
              colors={getHealthGradient(healthScore)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-8 h-8 rounded-full items-center justify-center"
            >
              <Text className="text-white text-sm">{getHealthIcon(healthScore)}</Text>
            </LinearGradient>
          </View>
        </View>
        
        <Text className="text-gray-800 font-bold text-xl mt-3">
          {getHealthStatus(healthScore)}
        </Text>
        <Text className="text-gray-500 text-sm">
          Health Score: {healthScore.toFixed(0)}/100
        </Text>
      </View>
      
      {/* Metrics Grid */}
      {showDetails && (
        <View className="space-y-1">
          <MetricItem 
            label="Total Challenges" 
            value={metrics?.totalChallenges || 0}
            icon="🎯"
            color="#667eea"
          />
          <MetricItem 
            label="Active Users" 
            value={metrics?.uniqueUsers || 0}
            icon="👥"
            color="#8b5cf6"
          />
          <MetricItem 
            label="Success Rate" 
            value={`${metrics?.successRate || '0.0'}%`}
            icon="📈"
            color="#10b981"
          />
          <MetricItem 
            label="Active Challenges" 
            value={metrics?.activeChallenges || 0}
            icon="⚡"
            color="#f59e0b"
          />
        </View>
      )}

      {/* Health Status Bar */}
      <View className="mt-4 pt-4 border-t border-gray-100">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-600 text-sm font-medium">Overall Health</Text>
          <Text className="text-gray-800 text-sm font-bold">
            {getHealthStatus(healthScore)}
          </Text>
        </View>
        <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <LinearGradient
            colors={getHealthGradient(healthScore)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="h-full rounded-full"
            style={{ width: `${healthScore}%` }}
          />
        </View>
      </View>
    </Animated.View>
  );
};

export { ProgressRing, ProtocolHealthIndicator };
