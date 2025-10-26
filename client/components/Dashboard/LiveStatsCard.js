import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const LiveStatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = '#667eea', 
  animated = true,
  delay = 0,
  onPress,
  trend,
  trendValue,
  isLoading = false
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
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

  // Pulse animation for loading state
  useEffect(() => {
    if (isLoading) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [isLoading]);

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

  const CardContent = () => (
    <LinearGradient
      colors={[color, `${color}CC`, `${color}99`]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-3xl p-5 shadow-xl border border-white/10"
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <Text className="text-white/90 text-xs font-bold uppercase tracking-widest mb-1">
            {title}
          </Text>
          {trend && trendValue && (
            <View className="flex-row items-center">
              <Text className="text-xs mr-1">{getTrendIcon(trend)}</Text>
              <Text 
                className="text-xs font-semibold"
                style={{ color: getTrendColor(trend) }}
              >
                {trendValue}
              </Text>
            </View>
          )}
        </View>
        <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
          <Text className="text-2xl">{icon}</Text>
        </View>
      </View>
      
      <View className="mb-2">
        {isLoading ? (
          <View className="h-8 bg-white/20 rounded-lg animate-pulse" />
        ) : (
          <Text className="text-white text-3xl font-black tracking-tight">
            {value}
          </Text>
        )}
      </View>
      
      {subtitle && (
        <Text className="text-white/80 text-sm font-semibold">
          {subtitle}
        </Text>
      )}
      
      {/* Subtle glow effect */}
      <View 
        className="absolute inset-0 rounded-3xl"
        style={{
          backgroundColor: `${color}20`,
          opacity: 0.3,
        }}
      />
    </LinearGradient>
  );

  return (
    <Animated.View
      style={{
        opacity: animatedValue,
        transform: [
          { scale: scaleValue },
          { scale: pulseValue }
        ],
      }}
    >
      {onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
          <CardContent />
        </TouchableOpacity>
      ) : (
        <CardContent />
      )}
    </Animated.View>
  );
};

export default LiveStatsCard;
