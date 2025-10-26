import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useVincent } from '../context/VincentContext';
import * as WebBrowser from 'expo-web-browser';
import { uriContainsVincentJWT, decodeVincentJWTFromUri } from '@lit-protocol/vincent-app-sdk/dist/src/webAuthClient/internal/uriHelpers';

export default function VincentLogin() {
  const navigation = useNavigation();
  const { isAuthenticated, jwt, userInfo, login } = useVincent();
  const [isLoading, setIsLoading] = useState(false);

  // Manual JWT parsing fallback function
  const performManualJWTParsing = (url) => {
    setIsLoading(false);
    console.log('⚠️ Using manual JWT parsing (fallback)');
    
    const jwtMatch = url.match(/[?&]jwt=([^&]*)/);
    const pkpMatch = url.match(/[?&]pkpAddress=([^&]*)/);
    
    const jwtParam = jwtMatch ? decodeURIComponent(jwtMatch[1]) : null;
    const pkpAddress = pkpMatch ? decodeURIComponent(pkpMatch[1]) : null;
    
    if (jwtParam) {
      try {
        const parts = jwtParam.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const userInfo = {
            pkpAddress: pkpAddress || payload.pkpAddress || 'Unknown',
            ...payload
          };
          
          login(jwtParam, userInfo);
          Alert.alert('✅ Logged In (Manual)', `PKP: ${userInfo.pkpAddress}`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
        }
      } catch (e) {
        console.error('Manual parsing failed:', e);
        Alert.alert('Error', 'Failed to parse authentication token');
      }
    }
  };

  // Listen for deep link redirects
  useEffect(() => {
    const handleDeepLink = async (event) => {
      console.log('🔗 Deep link received:', event.url);
      const url = event.url;
      
      // Try SDK validation first
      if (url && uriContainsVincentJWT(url)) {
        setIsLoading(false);
        console.log('✅ URL contains Vincent JWT');
        
        try {
          const result = await decodeVincentJWTFromUri({
            uri: url,
            expectedAudience: 'fitstake://',
            requiredAppId: 9593630138
          });
          
          if (result) {
            console.log('✅ JWT decoded and verified by Vincent SDK');
            const userInfo = {
              pkpAddress: result.decodedJWT.pkpAddress,
              appId: result.decodedJWT.appId,
              exp: result.decodedJWT.exp
            };
            
            login(result.jwtStr, userInfo);
            Alert.alert('✅ Login Successful', `PKP: ${userInfo.pkpAddress}`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
            return;
          }
        } catch (e) {
          console.error('SDK validation failed:', e);
          
          // Show warning modal and attempt manual fallback
          Alert.alert(
            '⚠️ JWT Validation Warning',
            `Vincent SDK validation failed: ${e.message}\n\nAttempting manual sign-in as fallback.`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => {} },
              {
                text: 'Continue with Manual',
                onPress: () => performManualJWTParsing(url)
              }
            ]
          );
          return;
        }
      }
      
      // Direct manual parsing if no JWT detected by SDK
      if (url && url.includes('vincent-callback')) {
        performManualJWTParsing(url);
      }
    };

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink({ url });
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => subscription?.remove();
  }, [login, navigation]);

  const handleVincentLogin = async () => {
    setIsLoading(true);
    
    try {
      console.log('🚀 Starting Vincent login...');
      
      const VINCENT_APP_ID = '9593630138';
      const redirectUri = 'fitstake://vincent-callback';
      
      // Use correct Vincent URL format: /user/appId/{appId}/connect?redirectUri={redirectUri}
      const connectUrl = `https://dashboard.heyvincent.ai/user/appId/${VINCENT_APP_ID}/connect?redirectUri=${encodeURIComponent(redirectUri)}`;
      
      console.log('📱 Opening browser with correct Vincent URL...');
      console.log('URL:', connectUrl);
      
      // Open browser
      const result = await WebBrowser.openBrowserAsync(connectUrl);
      
      console.log('Browser closed, result:', result);
      
      if (result.type === 'cancel') {
        Alert.alert('Cancelled', 'Login was cancelled');
        setIsLoading(false);
      } else {
        Alert.alert(
          'Waiting for Redirect',
          'Please complete sign-in in the browser.\n\nThe app will receive the JWT automatically when you are redirected back.',
          [{ text: 'OK', onPress: () => setIsLoading(false) }]
        );
      }
    } catch (error) {
      console.error('Vincent login error:', error);
      Alert.alert('Error', error.message || 'Failed to open browser');
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <LinearGradient
        colors={['#ffffff', '#fdf2f8', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="pt-16 pb-5 px-6 shadow-sm border-b border-pink-100"
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-white rounded-xl border border-pink-200 items-center justify-center shadow-sm mr-4"
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#EC4899" />
          </TouchableOpacity>
          
          <Text className="text-gray-900 font-bold text-2xl">Vincent Login</Text>
        </View>
      </LinearGradient>

      {/* Body */}
      <View className="flex-1 justify-center px-6">
        {isAuthenticated ? (
          <View className="bg-white rounded-2xl p-6 border border-gray-100">
            <View className="items-center mb-4">
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            </View>
            
            <Text className="text-gray-900 font-bold text-xl text-center mb-2">
              Already Logged In
            </Text>
            
            <Text className="text-gray-600 text-center mb-4">
              PKP: {userInfo?.pkpAddress || 'Unknown'}
            </Text>
            
            {jwt && (
              <View className="bg-gray-100 rounded-xl p-3 mb-4">
                <Text className="text-xs font-mono text-gray-600">
                  JWT: {jwt.substring(0, 20)}...
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View className="bg-white rounded-2xl p-6 border border-gray-100">
            <View className="items-center mb-6">
              <Ionicons name="shield" size={64} color="#EC4899" />
            </View>
            
            <Text className="text-gray-900 font-bold text-xl text-center mb-2">
              Login with Vincent
            </Text>
            
            <Text className="text-gray-600 text-center mb-6">
              Sign in with Ethereum to enable gasless transactions using your PKP wallet
            </Text>
            
            <TouchableOpacity
              className="bg-gradient-to-r from-pink-500 to-purple-600 py-4 rounded-xl items-center"
              onPress={handleVincentLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View className="flex-row items-center">
                  <ActivityIndicator color="white" size="small" />
                  <Text className="font-bold ml-2">Logging in...</Text>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="logo-ethereum" size={24} color="white" />
                  <Text className="font-bold text-base ml-2">
                    Sign In with Ethereum
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            <Text className="text-gray-500 text-xs text-center mt-4">
              This will open your browser to complete the sign-in process
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

