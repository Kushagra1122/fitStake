import { StatusBar } from "expo-status-bar";
import {
  Text,
  View,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import { useWeb3 } from "../context/Web3Context";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function ConnectWallet() {
  const {
    account,
    chainId,
    isConnecting,
    connectWallet,
    disconnectWallet,
    isConnected,
  } = useWeb3();
  const navigation = useNavigation();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
  }, []);

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      Alert.alert(
        "Connection Failed",
        error.message || "Failed to connect wallet. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      "Disconnect Wallet?",
      "Are you sure you want to disconnect your wallet?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              await disconnectWallet();
            } catch (error) {
              Alert.alert("Error", "Failed to disconnect wallet");
            }
          },
        },
      ]
    );
  };

  const handleContinue = () => {
    navigation.navigate("Home");
  };

  const getChainName = (id) => {
    const chains = {
      1: "Ethereum Mainnet",
      11155111: "Sepolia Testnet",
      137: "Polygon",
      10: "Optimism",
    };
    return chains[id] || `Chain ID: ${id}`;
  };

  const getChainColor = (id) => {
    const colors = {
      1: "#627EEA",
      11155111: "#7B3FE4",
      137: "#8247E5",
      10: "#FF0420",
    };
    return colors[id] || "#6366F1";
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(255,235,238,0.4)",
          opacity: fadeAnim,
        }}
      />

      <View
        className="flex-1 px-6"
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            width: "100%",
          }}
        >
          {/* Hero Section - always on top */}
          <View className="items-center mb-8">
            <View className="mb-6">
              <Image
                source={require("../assets/final_icon.png")}
                style={{ width: 100, height: 100 }}
                resizeMode="contain"
              />
            </View>
            <Text className="text-gray-900 text-3xl font-extrabold mb-3 text-center">
              Welcome to FitStake
            </Text>
            <Text className="text-gray-600 text-base text-center leading-7 max-w-xs">
              Stake cryptocurrency, commit to fitness goals, and earn rewards
              for completing challenges.
            </Text>
          </View>
          {/* Loading State */}
          {isConnecting ? (
            <View className="items-center justify-center py-10">
              <Image
                source={require("../assets/main_loading.gif")}
                style={{ width: 200, height: 200 }}
                resizeMode="contain"
              />
              <Text className="text-gray-600 text-base font-semibold mt-4">
                Connecting to your wallet...
              </Text>
            </View>
          ) : isConnected && account ? (
            <View className="w-full">
              {/* Connected Wallet Card */}
              <View className="bg-white rounded-2xl p-7 mb-6 border border-gray-100 shadow-sm">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-gray-700 text-sm font-semibold uppercase tracking-wider">
                    Connected Wallet
                  </Text>
                  <View className="bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                      <Text className="text-green-700 text-xs font-semibold">
                        Connected
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="bg-gray-50 p-5 rounded-xl mb-6 border border-gray-200">
                  <Text className="text-gray-500 text-xs mb-2 font-semibold uppercase tracking-wide">
                    Address
                  </Text>
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3 border border-gray-300">
                      <Ionicons name="wallet" size={20} color="#374151" />
                    </View>
                    <Text className="text-gray-900 font-black text-2xl tracking-wider">
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </Text>
                  </View>
                </View>

                {chainId && (
                  <View className="flex-row items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <View
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: getChainColor(chainId) }}
                    />
                    <View className="flex-1">
                      <Text className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">
                        Network
                      </Text>
                      <Text className="font-bold text-base text-gray-900">
                        {getChainName(chainId)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View className="space-y-3">
                <TouchableOpacity
                  className="bg-gray-900 px-6 py-4 rounded-xl border border-gray-900"
                  onPress={handleContinue}
                  activeOpacity={0.9}
                >
                  <Text className="text-white font-bold text-lg text-center">
                    Continue to Dashboard
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-white px-6 py-4 rounded-xl border border-gray-300"
                  onPress={handleDisconnect}
                  activeOpacity={0.8}
                >
                  <Text className="text-gray-700 font-semibold text-center">
                    Disconnect Wallet
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="w-full items-center">
              {/* How It Works */}
              <View className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100 w-full">
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
                <View className="space-y-4">
                  <Step
                    number="1"
                    title="Connect Wallet"
                    description="Link your crypto wallet to get started"
                    icon={
                      <Ionicons name="wallet-outline" size={16} color="white" />
                    }
                  />
                  <Step
                    number="2"
                    title="Create Challenge"
                    description="Set fitness goals and stake cryptocurrency"
                    icon={
                      <Ionicons name="trophy-outline" size={16} color="white" />
                    }
                  />
                  <Step
                    number="3"
                    title="Track Progress"
                    description="Connect Strava to automatically verify workouts"
                    icon={
                      <Ionicons
                        name="fitness-outline"
                        size={16}
                        color="white"
                      />
                    }
                  />
                  <Step
                    number="4"
                    title="Earn Rewards"
                    description="Complete goals to reclaim stake and earn rewards"
                    icon={
                      <Ionicons name="ribbon-outline" size={16} color="white" />
                    }
                  />
                </View>
              </View>

              {/* Connect Button */}
              <TouchableOpacity
                className="bg-gray-900 px-6 py-5 rounded-xl border border-gray-900"
                onPress={handleConnect}
                disabled={isConnecting}
                activeOpacity={0.9}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="wallet-outline" size={20} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Connect Wallet
                  </Text>
                </View>
              </TouchableOpacity>

              <Text className="text-gray-400 text-center text-xs mt-4">
                Supports MetaMask, WalletConnect & more
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

function Step({ number, title, description, icon }) {
  return (
    <View className="flex-row items-start">
      <View className="bg-gray-900 w-7 h-7 rounded-full items-center justify-center mr-4 mt-0.5 flex-row">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-gray-800 font-semibold text-sm mb-1">
          {title}
        </Text>
        <Text className="text-gray-500 text-xs leading-5">{description}</Text>
      </View>
    </View>
  );
}
