import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  Platform,
  Linking,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useStrava } from "../context/StravaContext";
import stravaService from "../services/stravaService";

// Constants
const ANIMATION_CONFIG = {
  FADE_DURATION: 600,
  SPRING_TENSION: 30,
  SPRING_FRICTION: 8,
};

const SHADOW_STYLE = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 4 },
});

const ConnectStrava = () => {
  const navigation = useNavigation();
  const {
    isConnected,
    connectStrava,
    disconnectStrava,
    getAthleteProfile,
    getRecentActivities,
    fetchAllStravaData,
    getDataSummary,
    fetchAthleteSegments,
    fetchAthleteRoutes,
    fetchAthleteClubs,
    fetchAthleteGear,
  } = useStrava();

  // State management
  const [state, setState] = useState({
    loading: false,
    connected: false,
    athlete: null,
    checkingConnection: true,
    activities: [],
    showActivities: false,
    comprehensiveData: null,
    showComprehensiveData: false,
    testResults: {},
  });

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Initialize animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_CONFIG.FADE_DURATION,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: ANIMATION_CONFIG.SPRING_TENSION,
        friction: ANIMATION_CONFIG.SPRING_FRICTION,
        useNativeDriver: true,
      }),
    ]).start();

    checkConnection();
  }, []);

  // Handle OAuth callback from deep link
  useEffect(() => {
    const handleDeepLinkCallback = async (url) => {
      if (!url) return;

      try {
        const urlObj = new URL(url.replace("fitstake://", "http://"));
        const success = urlObj.searchParams.get("success");
        const error = urlObj.searchParams.get("error");

        if (error) {
          showAlert("Connection Failed", decodeURIComponent(error));
          updateState({ loading: false });
          return;
        }

        if (success === "true") {
          await checkConnection();
        }
      } catch (error) {
        // Silent error handling
      }
    };

    const handleUrl = ({ url }) => handleDeepLinkCallback(url);

    Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener("url", handleUrl);

    return () => subscription?.remove();
  }, []);

  // Helper functions
  const updateState = useCallback((updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const showAlert = useCallback((title, message, buttons) => {
    Alert.alert(title, message, buttons);
  }, []);

  const checkConnection = async () => {
    try {
      const connected = isConnected;
      updateState({ connected });

      if (connected) {
        const athleteData = await getAthleteProfile();
        updateState({ athlete: athleteData });
      }
    } catch (error) {
      // Silent error handling
    } finally {
      updateState({ checkingConnection: false });
    }
  };

  const handleConnect = async () => {
    try {
      updateState({ loading: true });
      const result = await stravaService.connectStrava();

      if (result.success) {
        await connectStrava(
          result.accessToken,
          result.refreshToken,
          result.expiresAt
        );

        updateState({
          connected: true,
          athlete: result.athlete,
        });

        showAlert(
          "Success! 🎉",
          `Connected as ${result.athlete.firstname} ${result.athlete.lastname}`,
          [{ text: "Continue", onPress: () => navigation.navigate("Home") }]
        );
      } else {
        showAlert(
          "Connection Failed",
          result.error || "Unable to connect to Strava. Please try again."
        );
      }
    } catch (error) {
      showAlert("Error", "Failed to connect to Strava. Please try again.");
    } finally {
      updateState({ loading: false });
    }
  };

  const handleDisconnect = () => {
    showAlert(
      "Disconnect Strava",
      "Are you sure you want to disconnect your Strava account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              await disconnectStrava();
              updateState({
                connected: false,
                athlete: null,
                activities: [],
                showActivities: false,
                comprehensiveData: null,
                showComprehensiveData: false,
                testResults: {},
              });
              showAlert(
                "Disconnected",
                "Your Strava account has been disconnected"
              );
            } catch (error) {
              showAlert("Error", "Failed to disconnect. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleRefreshProfile = async () => {
    try {
      updateState({
        loading: true,
        testResults: { ...state.testResults, profile: "loading" },
      });

      const profile = await getAthleteProfile();

      updateState({
        athlete: profile,
        testResults: { ...state.testResults, profile: "success" },
      });

      showAlert("Success! 🎉", "Profile refreshed successfully!");
    } catch (error) {
      updateState({ testResults: { ...state.testResults, profile: "error" } });
      showAlert("Error", "Failed to refresh profile: " + error.message);
    } finally {
      updateState({ loading: false });
    }
  };

  const handleGetActivities = async () => {
    try {
      updateState({
        loading: true,
        testResults: { ...state.testResults, activities: "loading" },
      });

      const activitiesData = await getRecentActivities(1, 30);

      updateState({
        activities: activitiesData || [],
        showActivities: true,
        testResults: { ...state.testResults, activities: "success" },
      });

      showAlert(
        "Success! 🎉",
        `Fetched ${activitiesData?.length || 0} activities`
      );
    } catch (error) {
      updateState({
        testResults: { ...state.testResults, activities: "error" },
      });
      showAlert("Error", "Failed to fetch activities: " + error.message);
    } finally {
      updateState({ loading: false });
    }
  };

  const handleFetchAllData = async () => {
    try {
      updateState({
        loading: true,
        testResults: { ...state.testResults, comprehensive: "loading" },
      });

      const allData = await fetchAllStravaData({
        includeActivities: true,
        includeDetailedActivities: false,
        maxActivities: 100,
        includeSegments: true,
        includeRoutes: true,
        includeClubs: true,
        includeGear: true,
        includeStats: true,
        includeZones: true,
      });

      // Log all data received from Strava
      console.log("=== STRAVA DATA FETCHED ===");
      console.log("Full Data Object:", JSON.stringify(allData, null, 2));
      console.log("Activities:", allData.data?.activities?.length);
      console.log("Segments:", allData.data?.segments?.length);
      console.log("Routes:", allData.data?.routes?.length);
      console.log("Clubs:", allData.data?.clubs?.length);
      console.log("Gear:", allData.data?.gear?.length);
      console.log("Stats:", allData.data?.stats);
      console.log("Athlete:", allData.data?.athlete);

      updateState({
        comprehensiveData: allData,
        showComprehensiveData: true,
        testResults: { ...state.testResults, comprehensive: "success" },
      });

      const summary = getDataSummary(allData.data);

      showAlert(
        "Comprehensive Data Fetched! 🎉",
        `Fetched:\n• ${summary.activities.total} activities\n• ${summary.segments.total} segments\n• ${summary.routes.total} routes\n• ${summary.clubs.total} clubs\n• ${summary.gear.bikes.length} bikes\n• ${summary.gear.shoes.length} shoes`
      );
    } catch (error) {
      updateState({
        testResults: { ...state.testResults, comprehensive: "error" },
      });
      showAlert(
        "Error",
        "Failed to fetch comprehensive data: " + error.message
      );
    } finally {
      updateState({ loading: false });
    }
  };

  const handleFetchSegments = async () => {
    try {
      updateState({
        loading: true,
        testResults: { ...state.testResults, segments: "loading" },
      });

      const segments = await fetchAthleteSegments();

      updateState({
        testResults: { ...state.testResults, segments: "success" },
      });
      showAlert("Success! 🎉", `Fetched ${segments.length} segments`);
    } catch (error) {
      updateState({ testResults: { ...state.testResults, segments: "error" } });
      showAlert("Error", "Failed to fetch segments: " + error.message);
    } finally {
      updateState({ loading: false });
    }
  };

  const handleFetchRoutes = async () => {
    try {
      updateState({
        loading: true,
        testResults: { ...state.testResults, routes: "loading" },
      });

      const routes = await fetchAthleteRoutes();

      updateState({ testResults: { ...state.testResults, routes: "success" } });
      showAlert("Success! 🎉", `Fetched ${routes.length} routes`);
    } catch (error) {
      updateState({ testResults: { ...state.testResults, routes: "error" } });
      showAlert("Error", "Failed to fetch routes: " + error.message);
    } finally {
      updateState({ loading: false });
    }
  };

  const handleFetchClubs = async () => {
    try {
      updateState({
        loading: true,
        testResults: { ...state.testResults, clubs: "loading" },
      });

      const clubs = await fetchAthleteClubs();

      updateState({ testResults: { ...state.testResults, clubs: "success" } });
      showAlert("Success! 🎉", `Fetched ${clubs.length} clubs`);
    } catch (error) {
      updateState({ testResults: { ...state.testResults, clubs: "error" } });
      showAlert("Error", "Failed to fetch clubs: " + error.message);
    } finally {
      updateState({ loading: false });
    }
  };

  const handleFetchGear = async () => {
    try {
      updateState({
        loading: true,
        testResults: { ...state.testResults, gear: "loading" },
      });

      const gear = await fetchAthleteGear();

      const bikes = gear.filter(
        (item) => item.resource_state === 3 && item.frame_type === 1
      );
      const shoes = gear.filter(
        (item) => item.resource_state === 3 && item.frame_type === 4
      );

      updateState({ testResults: { ...state.testResults, gear: "success" } });
      showAlert(
        "Success! 🎉",
        `Fetched ${bikes.length} bikes and ${shoes.length} shoes`
      );
    } catch (error) {
      updateState({ testResults: { ...state.testResults, gear: "error" } });
      showAlert("Error", "Failed to fetch gear: " + error.message);
    } finally {
      updateState({ loading: false });
    }
  };

  const handleContinue = () => {
    navigation.navigate("Home");
  };

  // Loading state
  if (state.checkingConnection) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#667eea" />
        <Text className="text-gray-600 text-base mt-3 font-semibold">
          Checking connection...
        </Text>
      </View>
    );
  }

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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-white rounded-xl border border-pink-200 items-center justify-center shadow-sm"
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#EC4899" />
          </TouchableOpacity>

          <View className="flex-1 mx-4">
            <Text className="text-gray-900 font-bold text-2xl text-center">
              Connect Strava
            </Text>
            <Text className="text-pink-600 text-sm font-medium mt-1 text-center">
              {state.connected
                ? "Connected to Strava"
                : "Sync your fitness data"}
            </Text>
          </View>

          {state.connected && (
            <View className="bg-white px-3 py-1.5 rounded-full border border-green-200 shadow-sm">
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <Text className="text-green-700 text-xs font-semibold">
                  Active
                </Text>
              </View>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Body */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className="px-6 pt-6"
        >
          {state.connected && state.athlete ? (
            <>
              <ConnectedView
                athlete={state.athlete}
                onContinue={handleContinue}
                onDisconnect={handleDisconnect}
              />

              {/* Fetch Data Button */}
              <View
                className="bg-white rounded-2xl p-6 mb-6 border border-gray-100"
                style={SHADOW_STYLE}
              >
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 bg-orange-50 rounded-xl items-center justify-center mr-3">
                    <MaterialIcons name="analytics" size={22} color="#EC4899" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-bold text-lg">
                      Strava Analytics
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      Complete profile & stats
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleFetchAllData}
                  disabled={state.loading}
                  className="bg-pink-600 px-6 py-4 rounded-xl flex-row items-center justify-center shadow-sm"
                  activeOpacity={0.8}
                >
                  {state.loading ? (
                    <>
                      <ActivityIndicator color="white" size="small" />
                      <Text className="text-white font-bold text-base ml-2">
                        Fetching...
                      </Text>
                    </>
                  ) : (
                    <>
                      <MaterialIcons name="download" size={20} color="white" />
                      <Text className="text-white font-bold text-base ml-2">
                        Fetch All Strava Data
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                <Text className="text-gray-500 text-xs mt-3 text-center">
                  Get your complete profile, activities, segments, and stats
                </Text>
              </View>

              {/* Comprehensive Data */}
              {state.showComprehensiveData && state.comprehensiveData && (
                <>
                  {/* Enhanced Profile Display */}
                  {state.comprehensiveData.data?.athlete && (
                    <View
                      className="bg-white rounded-2xl p-6 mb-6 border border-gray-100"
                      style={SHADOW_STYLE}
                    >
                      <View className="mt-4 pt-4 border-t border-gray-100">
                        <View className="flex-row justify-between">
                          <View className="bg-gray-50 px-3 py-2 rounded-lg">
                            <Text className="text-gray-600 text-xs font-semibold mb-1">
                              Member Since
                            </Text>
                            <Text className="text-gray-900 font-bold text-sm">
                              {new Date(
                                state.comprehensiveData.data.athlete.created_at
                              ).getFullYear()}
                            </Text>
                          </View>
                          {state.comprehensiveData.data.athlete
                            .athlete_type && (
                            <View className="bg-gray-50 px-3 py-2 rounded-lg">
                              <Text className="text-gray-600 text-xs font-semibold mb-1">
                                Athlete Type
                              </Text>
                              <Text className="text-gray-900 font-bold text-sm capitalize">
                                {state.comprehensiveData.data.athlete
                                  .athlete_type === 1
                                  ? "Runner"
                                  : "Cyclist"}
                              </Text>
                            </View>
                          )}
                          {state.comprehensiveData.data.athlete
                            .badge_type_id !== undefined && (
                            <View className="bg-gray-50 px-3 py-2 rounded-lg">
                              <Text className="text-gray-600 text-xs font-semibold mb-1">
                                Badge
                              </Text>
                              <Text className="text-gray-900 font-bold text-sm">
                                {state.comprehensiveData.data.athlete
                                  .badge_type_id > 0
                                  ? "⭐"
                                  : "—"}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  )}

                  <View
                    className="bg-white rounded-2xl p-6 mb-8 border border-gray-100"
                    style={SHADOW_STYLE}
                  >
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center mr-3">
                          <MaterialIcons
                            name="bar-chart"
                            size={20}
                            color="#3B82F6"
                          />
                        </View>
                        <Text className="text-gray-900 font-bold text-lg">
                          Activity Summary
                        </Text>
                      </View>
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => {
                            console.log("=== RAW DATA DUMP ===");
                            console.log(
                              JSON.stringify(state.comprehensiveData, null, 2)
                            );
                            showAlert(
                              "Data Logged",
                              "Check console for raw data"
                            );
                          }}
                          className="bg-blue-100 px-3 py-2 rounded-full"
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="code-outline"
                            size={18}
                            color="#3B82F6"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            updateState({ showComprehensiveData: false })
                          }
                          className="bg-gray-100 px-3 py-2 rounded-full"
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="eye-off-outline"
                            size={18}
                            color="#6B7280"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <ComprehensiveDataDisplay data={state.comprehensiveData} />
                  </View>
                </>
              )}
            </>
          ) : (
            <DisconnectedView
              loading={state.loading}
              onConnect={handleConnect}
            />
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

// Connected State Component
const ConnectedView = ({ athlete, onContinue, onDisconnect }) => (
  <View
    className="bg-white rounded-2xl p-6 mb-6 border border-gray-100"
    style={SHADOW_STYLE}
  >
    <View className="items-center mb-6">
      <View className="w-20 h-20 rounded-full items-center justify-center overflow-hidden bg-gray-100 border-2 border-gray-200">
        {athlete.profile_medium || athlete.profile ? (
          <Image
            source={{ uri: athlete.profile_medium || athlete.profile }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Image
            source={require("../assets/final_icon.png")}
            className="w-full h-full"
            style={{ resizeMode: "contain" }}
          />
        )}
      </View>
      <Text className="text-gray-900 font-bold text-xl mt-3 mb-1">
        {athlete.firstname} {athlete.lastname}
      </Text>
      {athlete.city && athlete.country && (
        <View className="flex-row items-center mt-2">
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text className="text-gray-600 text-sm ml-1">
            {athlete.city}, {athlete.country}
          </Text>
        </View>
      )}
      {athlete.state && (
        <Text className="text-gray-500 text-xs mt-1">{athlete.state}</Text>
      )}
    </View>

    <View className="flex-row items-center justify-between pt-5 border-t border-gray-100">
      <TouchableOpacity
        className="bg-pink-600 px-6 py-3 rounded-xl flex-1 mr-2 shadow-sm"
        onPress={onContinue}
        activeOpacity={0.8}
      >
        <Text className="text-white font-bold text-center text-sm">
          Continue to Home
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="bg-gray-50 px-6 py-3 rounded-xl border border-gray-200"
        onPress={onDisconnect}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={20} color="#6B7280" />
      </TouchableOpacity>
    </View>
  </View>
);

// Disconnected State Component
const DisconnectedView = ({ loading, onConnect }) => (
  <>
    <View
      className="bg-white rounded-2xl p-6 mb-6 border border-gray-100"
      style={SHADOW_STYLE}
    >
      <View className="items-center mb-6">
        <View className="w-20 h-20 rounded-full items-center justify-center mb-4 overflow-hidden bg-gray-100 border-2 border-gray-200">
          <Image
            source={require("../assets/final_icon.png")}
            className="w-full h-full"
            style={{ resizeMode: "contain" }}
          />
        </View>
        <Text className="text-gray-900 font-bold text-2xl mb-2 text-center">
          Connect to Strava
        </Text>
        <Text className="text-gray-600 text-sm text-center leading-5 px-2">
          Link your Strava account to track fitness activities and verify
          challenge completion automatically.
        </Text>
      </View>

      <View className="space-y-3 mb-6">
        <FeatureCard
          icon={<Ionicons name="fitness-outline" size={20} color="white" />}
          title="Automatic Activity Tracking"
          description="Your workouts sync automatically"
          gradient={["#4B5563", "#374151"]}
        />
        <FeatureCard
          icon={<MaterialIcons name="verified" size={20} color="white" />}
          title="Challenge Verification"
          description="Proof of completion without manual submission"
          gradient={["#8B5CF6", "#7C3AED"]}
        />
        <FeatureCard
          icon={<Ionicons name="trophy-outline" size={20} color="white" />}
          title="Earn Rewards"
          description="Complete challenges and earn crypto rewards"
          gradient={["#10B981", "#059669"]}
        />
      </View>

      <TouchableOpacity
        className="bg-pink-600 px-6 py-4 rounded-xl shadow-sm"
        onPress={onConnect}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <View className="flex-row items-center justify-center">
            <ActivityIndicator color="white" size="small" />
            <Text className="text-white font-bold text-base ml-2">
              Connecting...
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center justify-center">
            <Text className="text-white font-bold text-base mr-2">
              Connect with Strava
            </Text>
            <Ionicons name="arrow-forward" size={18} color="white" />
          </View>
        )}
      </TouchableOpacity>
    </View>

    <PrivacySection />
  </>
);

// Privacy Section Component
const PrivacySection = () => (
  <View
    className="bg-white rounded-2xl p-6 border border-gray-100"
    style={SHADOW_STYLE}
  >
    <View className="flex-row items-center mb-4">
      <Ionicons name="shield-checkmark-outline" size={22} color="#374151" />
      <Text className="text-gray-900 text-lg font-bold ml-3">
        Privacy & Security
      </Text>
    </View>
    <View className="space-y-2">
      <InfoRow
        icon={<Ionicons name="checkmark-circle" size={16} color="#10B981" />}
        text="Read-only access to your profile"
      />
      <InfoRow
        icon={<Ionicons name="checkmark-circle" size={16} color="#10B981" />}
        text="Activity data (runs, rides, etc.)"
      />
      <InfoRow
        icon={<Ionicons name="checkmark-circle" size={16} color="#10B981" />}
        text="Activity details for verification"
      />
      <Text className="text-gray-500 text-xs mt-4 italic">
        We never post to Strava without your permission
      </Text>
    </View>
  </View>
);

// Feature Card Component
const FeatureCard = ({ icon, title, description, gradient }) => (
  <View
    className="bg-white rounded-xl p-4 flex-row items-center border border-gray-100"
    style={Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    })}
  >
    <LinearGradient
      colors={gradient}
      className="w-12 h-12 rounded-xl items-center justify-center mr-4"
    >
      {icon}
    </LinearGradient>
    <View className="flex-1">
      <Text className="text-gray-900 font-bold text-sm mb-1">{title}</Text>
      <Text className="text-gray-500 text-xs leading-4">{description}</Text>
    </View>
  </View>
);

// Info Row Component
const InfoRow = ({ icon, text }) => (
  <View className="flex-row items-center">
    <View className="mr-3">{icon}</View>
    <Text className="text-gray-700 text-sm flex-1 leading-5">{text}</Text>
  </View>
);

// Comprehensive Data Display Component
const ComprehensiveDataDisplay = ({ data }) => {
  const safeData = data?.data || {};

  console.log("=== DISPLAYING DATA ===");
  console.log("Safe Data:", safeData);

  // Extract clubs from athlete if available
  const clubs = safeData.athlete?.clubs || safeData.clubs || [];

  const summary = {
    activities: {
      total: Array.isArray(safeData.activities)
        ? safeData.activities.length
        : 0,
      types: Array.isArray(safeData.activities)
        ? safeData.activities.reduce((acc, activity) => {
            acc[activity.type] = (acc[activity.type] || 0) + 1;
            return acc;
          }, {})
        : {},
      totalDistance: Array.isArray(safeData.activities)
        ? safeData.activities.reduce(
            (sum, activity) => sum + (activity.distance || 0),
            0
          )
        : 0,
      totalTime: Array.isArray(safeData.activities)
        ? safeData.activities.reduce(
            (sum, activity) => sum + (activity.moving_time || 0),
            0
          )
        : 0,
      elevationGain: Array.isArray(safeData.activities)
        ? safeData.activities.reduce(
            (sum, activity) => sum + (activity.total_elevation_gain || 0),
            0
          )
        : 0,
      avgSpeed:
        Array.isArray(safeData.activities) && safeData.activities.length > 0
          ? safeData.activities.reduce(
              (sum, activity) => sum + (activity.average_speed || 0),
              0
            ) / safeData.activities.length
          : 0,
      totalKudos: Array.isArray(safeData.activities)
        ? safeData.activities.reduce(
            (sum, activity) => sum + (activity.kudos_count || 0),
            0
          )
        : 0,
      totalComments: Array.isArray(safeData.activities)
        ? safeData.activities.reduce(
            (sum, activity) => sum + (activity.comment_count || 0),
            0
          )
        : 0,
      maxElevation:
        Array.isArray(safeData.activities) && safeData.activities.length > 0
          ? Math.max(...safeData.activities.map((a) => a.elev_high || 0))
          : 0,
      avgElevation:
        Array.isArray(safeData.activities) && safeData.activities.length > 0
          ? safeData.activities.reduce(
              (sum, activity) =>
                sum +
                ((activity.elev_high || 0) + (activity.elev_low || 0)) / 2,
              0
            ) / safeData.activities.length
          : 0,
    },
    segments: {
      total: Array.isArray(safeData.segments) ? safeData.segments.length : 0,
    },
    routes: {
      total: Array.isArray(safeData.routes) ? safeData.routes.length : 0,
    },
    clubs: {
      total: clubs.length,
      list: clubs,
    },
    gear: {
      bikes: Array.isArray(safeData.gear)
        ? safeData.gear.filter(
            (item) => item.resource_state === 3 && item.frame_type === 1
          )
        : [],
      shoes: Array.isArray(safeData.gear)
        ? safeData.gear.filter(
            (item) => item.resource_state === 3 && item.frame_type === 4
          )
        : [],
    },
  };

  const formatDistance = (meters) => {
    if (!meters) return "0 km";
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatElevation = (meters) => {
    if (!meters) return "0m";
    return `${Math.round(meters)}m`;
  };

  const formatSpeed = (metersPerSecond) => {
    if (!metersPerSecond) return "0 km/h";
    return `${(metersPerSecond * 3.6).toFixed(2)} km/h`;
  };

  const getActivityTypeEmoji = (type) => {
    const types = {
      Run: "🏃",
      Ride: "🚴",
      Swim: "🏊",
      Walk: "🚶",
      Workout: "💪",
      Hike: "🥾",
      EBikeRide: "⚡",
      VirtualRide: "🎮",
      WeightTraining: "🏋️",
      Yoga: "🧘",
    };
    return types[type] || "🏃";
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View className="space-y-4">
        {/* Main Stats Cards */}

        <View className="flex-row flex-wrap justify-between gap-2">
          {/* Activities Card */}
          <LinearGradient
            colors={["#4F46E5", "#6366F1"]}
            start={[0, 0]}
            end={[1, 1]}
            className="p-4 rounded-2xl flex-1 min-w-[48%] shadow-md"
          >
            <View className="flex-row items-center mb-3">
              <Text className="text-white font-bold text-base ml-3">
                Activities
              </Text>
            </View>
            <Text className="text-white font-black text-3xl mb-1">
              {summary.activities.total}
            </Text>
            <Text className="text-white/80 text-xs">Total workouts</Text>
          </LinearGradient>

          {/* Segments Card */}
          <LinearGradient
            colors={["#9333EA", "#C084FC"]}
            start={[0, 0]}
            end={[1, 1]}
            className="p-4 rounded-2xl flex-1 min-w-[48%] shadow-md"
          >
            <View className="flex-row items-center mb-3">
              <Text className="text-white font-bold text-base ml-3">
                Segments
              </Text>
            </View>
            <Text className="text-white font-black text-3xl mb-1">
              {summary.segments.total}
            </Text>
            <Text className="text-white/80 text-xs">Starred segments</Text>
          </LinearGradient>
        </View>

        {/* Engagement Stats */}
        {(summary.activities.totalKudos > 0 ||
          summary.activities.totalComments > 0) && (
          <View className="flex-row gap-2">
            {summary.activities.totalKudos > 0 && (
              <View className="flex-1 bg-pink-50 p-3 rounded-xl border border-pink-100">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="heart" size={18} color="#EC4899" />
                  <Text className="text-pink-600 text-xs font-semibold ml-1">
                    Total Kudos
                  </Text>
                </View>
                <Text className="text-pink-900 font-bold text-xl">
                  {summary.activities.totalKudos}
                </Text>
              </View>
            )}
            {summary.activities.totalComments > 0 && (
              <View className="flex-1 bg-blue-50 p-3 rounded-xl border border-blue-100">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="chatbubble" size={18} color="#3B82F6" />
                  <Text className="text-blue-600 text-xs font-semibold ml-1">
                    Total Comments
                  </Text>
                </View>
                <Text className="text-blue-900 font-bold text-xl">
                  {summary.activities.totalComments}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Detailed Activity Stats */}
        <View className="bg-white rounded-xl p-4 border border-gray-200">
          <View className="flex-row items-center mb-3">
            <Ionicons name="stats-chart" size={20} color="#3B82F6" />
            <Text className="text-gray-900 font-bold text-base ml-2">
              Activity Statistics
            </Text>
          </View>

          <View className="space-y-2">
            <StatRow
              icon="map-outline"
              label="Total Distance"
              value={formatDistance(summary.activities.totalDistance)}
              color="#3B82F6"
            />
            <StatRow
              icon="time-outline"
              label="Total Time"
              value={formatDuration(summary.activities.totalTime)}
              color="#10B981"
            />
            <StatRow
              icon="trending-up-outline"
              label="Elevation Gain"
              value={formatElevation(summary.activities.elevationGain)}
              color="#F59E0B"
            />
            <StatRow
              icon="speedometer-outline"
              label="Avg Speed"
              value={formatSpeed(summary.activities.avgSpeed)}
              color="#8B5CF6"
            />
            {summary.activities.maxElevation > 0 && (
              <StatRow
                icon="trending-up"
                label="Max Elevation"
                value={formatElevation(summary.activities.maxElevation)}
                color="#DC2626"
              />
            )}
          </View>
        </View>

        {/* Activity Types Breakdown */}
        {Object.keys(summary.activities.types).length > 0 && (
          <View className="bg-white rounded-xl p-4 border border-gray-200">
            <View className="flex-row items-center mb-3">
              <MaterialIcons name="category" size={20} color="#EC4899" />
              <Text className="text-gray-900 font-bold text-base ml-2">
                Activity Types
              </Text>
            </View>
            <View className="space-y-2">
              {Object.entries(summary.activities.types).map(([type, count]) => (
                <View
                  key={type}
                  className="flex-row items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
                >
                  <View className="flex-row items-center flex-1">
                    <Text className="text-xl mr-2">
                      {getActivityTypeEmoji(type)}
                    </Text>
                    <Text className="text-gray-700 font-medium text-sm">
                      {type}
                    </Text>
                  </View>
                  <Text className="text-gray-900 font-bold text-sm">
                    {count}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Clubs List */}
        {summary.clubs.list && summary.clubs.list.length > 0 && (
          <View className="bg-white rounded-xl p-4 border border-gray-200">
            <View className="flex-row items-center mb-3">
              <Ionicons name="people" size={20} color="#F59E0B" />
              <Text className="text-gray-900 font-bold text-base ml-2">
                Clubs ({summary.clubs.total})
              </Text>
            </View>
            <View className="space-y-2">
              {summary.clubs.list.map((club, index) => (
                <View
                  key={club.id || index}
                  className="bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-200"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-gray-900 font-bold text-sm">
                        {club.name}
                      </Text>
                      {club.city && club.state && (
                        <Text className="text-gray-600 text-xs mt-1">
                          {club.city}, {club.state}
                        </Text>
                      )}
                      {club.sport_type && (
                        <Text className="text-gray-500 text-xs mt-1 capitalize">
                          {club.localized_sport_type || club.sport_type}
                        </Text>
                      )}
                    </View>
                    {club.member_count !== undefined && (
                      <View className="bg-orange-100 px-2 py-1 rounded">
                        <Text className="text-orange-700 text-xs font-bold">
                          {club.member_count} members
                        </Text>
                      </View>
                    )}
                  </View>
                  {club.verified && (
                    <View className="flex-row items-center mt-2">
                      <MaterialIcons
                        name="verified"
                        size={14}
                        color="#10B981"
                      />
                      <Text className="text-green-700 text-xs ml-1">
                        Verified Club
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Additional Resources */}
        <View className="flex-row flex-wrap gap-2">
          <View className="bg-green-50 p-4 rounded-xl flex-1 min-w-[48%] border border-green-100">
            <MaterialIcons name="route" size={24} color="#10B981" />
            <Text className="text-gray-900 font-bold text-lg mt-2">
              {summary.routes.total}
            </Text>
            <Text className="text-gray-600 text-xs mt-1">Saved Routes</Text>
          </View>

          {summary.clubs.total > 0 && (
            <View className="bg-yellow-50 p-4 rounded-xl flex-1 min-w-[48%] border border-yellow-100">
              <Ionicons name="people" size={24} color="#F59E0B" />
              <Text className="text-gray-900 font-bold text-lg mt-2">
                {summary.clubs.total}
              </Text>
              <Text className="text-gray-600 text-xs mt-1">
                Club Memberships
              </Text>
            </View>
          )}
        </View>

        {/* Heart Rate Zones */}
        {safeData.zones?.heart_rate?.zones &&
          Array.isArray(safeData.zones.heart_rate.zones) &&
          safeData.zones.heart_rate.zones.length > 0 && (
            <View className="bg-white rounded-xl p-4 border border-gray-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="pulse" size={20} color="#DC2626" />
                <Text className="text-gray-900 font-bold text-base ml-2">
                  Heart Rate Zones
                </Text>
              </View>
              <View className="space-y-2">
                {safeData.zones.heart_rate.zones.map((zone, index) => (
                  <View
                    key={index}
                    className="bg-red-50 px-3 py-2 rounded-lg border border-red-100"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-red-700 font-bold text-sm">
                        Zone {index + 1}
                      </Text>
                      <Text className="text-red-900 text-sm font-semibold">
                        {zone.min}-{zone.max > 0 ? zone.max : "∞"} bpm
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
              {safeData.zones.heart_rate.custom_zones && (
                <Text className="text-gray-500 text-xs mt-2 italic text-center">
                  Custom zones configured
                </Text>
              )}
            </View>
          )}

        {/* Gear */}
        {(summary.gear.bikes.length > 0 || summary.gear.shoes.length > 0) && (
          <View className="bg-white rounded-xl p-4 border border-gray-200">
            <View className="flex-row items-center mb-3">
              <FontAwesome5 name="toolbox" size={20} color="#F97316" />
              <Text className="text-gray-900 font-bold text-base ml-2">
                Gear
              </Text>
            </View>
            <View className="flex-row gap-3">
              {summary.gear.bikes.length > 0 && (
                <View className="flex-1 bg-orange-50 px-3 py-2 rounded-lg border border-orange-100">
                  <Text className="text-orange-700 font-bold text-2xl">
                    {summary.gear.bikes.length}
                  </Text>
                  <Text className="text-orange-600 text-xs">Bikes</Text>
                </View>
              )}
              {summary.gear.shoes.length > 0 && (
                <View className="flex-1 bg-orange-50 px-3 py-2 rounded-lg border border-orange-100">
                  <Text className="text-orange-700 font-bold text-2xl">
                    {summary.gear.shoes.length}
                  </Text>
                  <Text className="text-orange-600 text-xs">Shoes</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Recent Activities */}
        {Array.isArray(safeData.activities) &&
          safeData.activities.length > 0 && (
            <View className="bg-white rounded-xl p-4 border border-gray-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="time-outline" size={20} color="#6366F1" />
                <Text className="text-gray-900 font-bold text-base ml-2">
                  Recent Activities
                </Text>
              </View>
              <View className="space-y-3">
                {safeData.activities.slice(0, 3).map((activity, index) => (
                  <View
                    key={activity.id || index}
                    className="bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-200"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1 mr-2">
                        <Text className="text-gray-900 font-bold text-sm">
                          {activity.name}
                        </Text>
                        <Text className="text-gray-600 text-xs mt-1">
                          {new Date(
                            activity.start_date_local
                          ).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text className="text-xl">
                        {getActivityTypeEmoji(activity.type)}
                      </Text>
                    </View>
                    <View className="flex-row flex-wrap gap-2">
                      <View className="bg-blue-50 px-2 py-1 rounded">
                        <Text className="text-blue-700 text-xs font-semibold">
                          {formatDistance(activity.distance)}
                        </Text>
                      </View>
                      <View className="bg-green-50 px-2 py-1 rounded">
                        <Text className="text-green-700 text-xs font-semibold">
                          {formatDuration(activity.moving_time)}
                        </Text>
                      </View>
                      {activity.total_elevation_gain > 0 && (
                        <View className="bg-orange-50 px-2 py-1 rounded">
                          <Text className="text-orange-700 text-xs font-semibold">
                            {formatElevation(activity.total_elevation_gain)}
                          </Text>
                        </View>
                      )}
                      {activity.kudos_count > 0 && (
                        <View className="flex-row items-center bg-pink-50 px-2 py-1 rounded">
                          <Ionicons name="heart" size={12} color="#EC4899" />
                          <Text className="text-pink-700 text-xs font-semibold ml-1">
                            {activity.kudos_count}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
              {safeData.activities.length > 3 && (
                <Text className="text-gray-500 text-xs mt-3 text-center">
                  +{safeData.activities.length - 3} more activities
                </Text>
              )}
            </View>
          )}

        {/* Recent Stats */}
        {safeData.stats && !safeData.stats.message && (
          <View className="bg-white rounded-xl p-4 border border-gray-200">
            <View className="flex-row items-center mb-3">
              <Ionicons name="trending-up" size={20} color="#6366F1" />
              <Text className="text-gray-900 font-bold text-base ml-2">
                Recent 4 Weeks
              </Text>
            </View>

            {safeData.stats.recent_run_totals && (
              <View className="mb-3 pb-3 border-b border-gray-100">
                <Text className="text-gray-700 font-semibold text-sm mb-2 flex-row items-center">
                  🏃 Running Totals
                </Text>
                <View className="flex-row gap-2">
                  <View className="flex-1 bg-blue-50 px-2 py-1.5 rounded">
                    <Text className="text-blue-600 text-xs">Count</Text>
                    <Text className="text-blue-900 font-bold text-sm">
                      {safeData.stats.recent_run_totals.count}
                    </Text>
                  </View>
                  <View className="flex-1 bg-green-50 px-2 py-1.5 rounded">
                    <Text className="text-green-600 text-xs">Distance</Text>
                    <Text className="text-green-900 font-bold text-sm">
                      {formatDistance(
                        safeData.stats.recent_run_totals.distance
                      )}
                    </Text>
                  </View>
                  <View className="flex-1 bg-purple-50 px-2 py-1.5 rounded">
                    <Text className="text-purple-600 text-xs">Time</Text>
                    <Text className="text-purple-900 font-bold text-sm">
                      {formatDuration(
                        safeData.stats.recent_run_totals.moving_time
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {safeData.stats.recent_ride_totals && (
              <View>
                <Text className="text-gray-700 font-semibold text-sm mb-2">
                  🚴 Riding Totals
                </Text>
                <View className="flex-row gap-2">
                  <View className="flex-1 bg-blue-50 px-2 py-1.5 rounded">
                    <Text className="text-blue-600 text-xs">Count</Text>
                    <Text className="text-blue-900 font-bold text-sm">
                      {safeData.stats.recent_ride_totals.count}
                    </Text>
                  </View>
                  <View className="flex-1 bg-green-50 px-2 py-1.5 rounded">
                    <Text className="text-green-600 text-xs">Distance</Text>
                    <Text className="text-green-900 font-bold text-sm">
                      {formatDistance(
                        safeData.stats.recent_ride_totals.distance
                      )}
                    </Text>
                  </View>
                  <View className="flex-1 bg-purple-50 px-2 py-1.5 rounded">
                    <Text className="text-purple-600 text-xs">Time</Text>
                    <Text className="text-purple-900 font-bold text-sm">
                      {formatDuration(
                        safeData.stats.recent_ride_totals.moving_time
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// StatRow component for displaying individual stats
const StatRow = ({ icon, label, value, color }) => (
  <View className="flex-row items-center justify-between bg-gray-50 px-3 py-2.5 rounded-lg">
    <View className="flex-row items-center flex-1">
      <Ionicons name={icon} size={18} color={color} />
      <Text className="text-gray-700 font-medium text-sm ml-2">{label}</Text>
    </View>
    <Text className="text-gray-900 font-bold text-sm">{value}</Text>
  </View>
);

export default ConnectStrava;
