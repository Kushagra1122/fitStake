import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useWeb3 } from "../context/Web3Context";
import { getUserChallenges } from "../services/contract";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function Home({ navigation }) {
  const { account, disconnectWallet, getProvider } = useWeb3();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const [activeChallengesCount, setActiveChallengesCount] = useState(0);
  const [totalStaked, setTotalStaked] = useState("0");

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

    loadUserStats();
  }, [account]);

  const loadUserStats = async () => {
    if (!account) return;
    try {
      const provider = getProvider();
      const userChallenges = await getUserChallenges(provider, account);
      const activeChallenges = userChallenges.filter(
        (c) => !c.finalized && !c.hasWithdrawn
      );
      setActiveChallengesCount(activeChallenges.length);

      const total = activeChallenges.reduce(
        (sum, c) => sum + parseFloat(c.stakeAmount || "0"),
        0
      );
      setTotalStaked(total.toFixed(4));
    } catch (error) {
      console.error("Error loading user stats:", error);
    }
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
    navigation.navigate("ConnectWallet");
  };

  const backgroundInterpolate = scrollY.interpolate({
    inputRange: [0, height * 0.3, height * 0.6],
    outputRange: [
      "rgba(255,255,255,0)",
      "rgba(255,235,238,0.4)",
      "rgba(255,220,225,0.8)",
    ],
    extrapolate: "clamp",
  });

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <LinearGradient
        colors={["#ffffff", "#fdf2f8", "#ffffff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="pt-16 pb-5 px-6 shadow-sm border-b border-pink-100"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-pink-600 text-sm font-medium mb-1">
              Welcome back
            </Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text className="text-gray-900 font-bold text-2xl mr-3">
                  {account
                    ? `${account.slice(0, 6)}...${account.slice(-4)}`
                    : "User"}
                </Text>
                <View className="bg-white px-3 py-1.5 rounded-full border border-pink-200 shadow-sm">
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 bg-pink-500 rounded-full mr-2" />
                    <Text className="text-pink-700 text-xs font-semibold">
                      Connected
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                className="w-10 h-10 bg-white rounded-xl border border-pink-200 items-center justify-center shadow-sm"
                activeOpacity={0.8}
                onPress={handleDisconnect}
              >
                <Ionicons name="log-out-outline" size={20} color="#EC4899" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Body */}
      <View className="flex-1">
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: backgroundInterpolate,
          }}
        />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            {
              useNativeDriver: false,
            }
          )}
          scrollEventThrottle={16}
        >
          <View className="px-6 pt-8">
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              {/* Stats */}
              <View className="flex-row mb-8">
                <StatCard
                  title="Active Challenges"
                  value={activeChallengesCount.toString()}
                  subtitle="In Progress"
                  icon={
                    <FontAwesome5 name="running" size={20} color="#3B82F6" />
                  }
                />
                <View className="w-4" />
                <StatCard
                  title="Total Staked"
                  value={`${totalStaked} ETH`}
                  subtitle="Amount Locked"
                  icon={
                    <FontAwesome5 name="ethereum" size={20} color="#10B981" />
                  }
                />
              </View>

              {/* Dashboard */}
              <View
                className="bg-white rounded-2xl p-7 mb-8 border border-gray-100"
                style={Platform.select({
                  ios: {
                    shadowColor: "#000",
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 6 },
                  },
                  android: { elevation: 5 },
                })}
              >
                <Text className="text-3xl font-extrabold text-gray-900 mb-3">
                  FitStake Dashboard
                </Text>
                <Text className="text-gray-600 text-base leading-7 mb-8">
                  Create fitness challenges, stake cryptocurrency, and achieve
                  your health goals with blockchain-powered accountability.
                </Text>

                <View className="space-y-5">
                  <FeatureCard
                    icon={
                      <Ionicons name="person-outline" size={22} color="white" />
                    }
                    title="Profile Management"
                    description="View and manage your personal fitness profile"
                    gradient={["#4B5563", "#374151"]}
                    onPress={() => navigation.navigate("Profile")}
                  />
                  <View/>
                  <FeatureCard
                    icon={
                      <Ionicons name="trophy-outline" size={22} color="white" />
                    }
                    title="Create Challenge"
                    description="Set fitness goals and stake cryptocurrency"
                    gradient={["#8B5CF6", "#7C3AED"]}
                    onPress={() => navigation.navigate("CreateChallenge")}
                  />
                  <View/>
                  <FeatureCard
                    icon={
                      <FontAwesome5
                        name="hands-helping"
                        size={18}
                        color="white"
                      />
                    }
                    title="Join Challenge"
                    description="Browse and participate in community challenges"
                    gradient={["#3B82F6", "#2563EB"]}
                    onPress={() => navigation.navigate("JoinChallenge")}
                  />
                  <View/>
                  <FeatureCard
                    icon={
                      <Ionicons
                        name="stats-chart-outline"
                        size={22}
                        color="white"
                      />
                    }
                    title="My Challenges"
                    description="Monitor progress and track your active goals"
                    gradient={["#10B981", "#059669"]}
                    onPress={() => navigation.navigate("MyChallenges")}
                  />
                  <View/>
                  <FeatureCard
                    icon={
                      <MaterialIcons
                        name="sports-football"
                        size={22}
                        color="white"
                      />
                    }
                    title="Connect Strava"
                    description="Integrate your fitness tracking application"
                    gradient={["#F59E0B", "#D97706"]}
                    onPress={() => navigation.navigate("ConnectStrava")}
                  />
                </View>
              </View>

              {/* How It Works (Original Style Restored) */}
              <View className="rounded-2xl p-7">
                <View className="flex-row items-center mb-6">
                  <Ionicons
                    name="help-circle-outline"
                    size={24}
                    color="#374151"
                  />
                  <Text className="text-gray-900 text-xl font-bold ml-3">
                    How It Works
                  </Text>
                </View>
                <View className="space-y-5">
                  <Step
                    number="1"
                    title="Create Challenge"
                    description="Define fitness goals and stake crypto"
                    icon={<Feather name="target" size={16} color="white" />}
                  />
                  <Step
                    number="2"
                    title="Track Workouts"
                    description="Log activities via Strava integration"
                    icon={
                      <Ionicons
                        name="fitness-outline"
                        size={16}
                        color="white"
                      />
                    }
                  />
                  <Step
                    number="3"
                    title="Smart Verification"
                    description="Blockchain verifies your progress automatically"
                    icon={
                      <MaterialIcons name="verified" size={16} color="white" />
                    }
                  />
                  <Step
                    number="4"
                    title="Earn Rewards"
                    description="Complete goals to reclaim stake and earn rewards"
                    icon={<FontAwesome5 name="award" size={16} color="white" />}
                  />
                </View>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function StatCard({ title, value, subtitle, icon }) {
  return (
    <View
      className="flex-1 bg-white rounded-2xl p-6 border border-gray-100"
      style={Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOpacity: 0.01,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
        },
        android: { elevation: 4 },
      })}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="w-10 h-10 bg-blue-50 rounded-lg items-center justify-center">
          {icon}
        </View>
      </View>
      <Text className="text-gray-900 font-bold text-2xl mb-1">{value}</Text>
      <Text className="text-gray-700 font-semibold text-sm mb-1">{title}</Text>
      <Text className="text-gray-400 text-xs">{subtitle}</Text>
    </View>
  );
}

function FeatureCard({ icon, title, description, gradient, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="bg-white rounded-xl p-5 flex-row items-center border border-gray-100"
      style={Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        },
        android: { elevation: 3 },
      })}
    >
      <LinearGradient
        colors={gradient}
        className="w-12 h-12 rounded-xl items-center justify-center mr-4"
      >
        {icon}
      </LinearGradient>
      <View className="flex-1">
        <Text className="text-gray-900 font-bold text-base mb-1.5">
          {title}
        </Text>
        <Text className="text-gray-500 text-sm leading-5">{description}</Text>
      </View>
      <View className="bg-gray-100 w-8 h-8 rounded-full items-center justify-center">
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}

function Step({ number, title, description, icon }) {
  return (
    <View className="flex-row items-start">
      <View className="bg-blue-500 w-7 h-7 rounded-full items-center justify-center mr-4 mt-0.5 flex-row">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-gray-800 font-normal text-sm mb-1">{title}</Text>
        <Text className="text-gray-500 text-xs leading-5">{description}</Text>
      </View>
    </View>
  );
}
