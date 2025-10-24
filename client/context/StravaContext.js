import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import stravaService from '../services/stravaService';

const StravaContext = createContext();

export const useStrava = () => {
  const context = useContext(StravaContext);
  if (!context) {
    throw new Error('useStrava must be used within a StravaProvider');
  }
  return context;
};

// Storage keys
const STRAVA_ACCESS_TOKEN_KEY = 'strava_access_token';
const STRAVA_REFRESH_TOKEN_KEY = 'strava_refresh_token';
const STRAVA_TOKEN_EXPIRY_KEY = 'strava_token_expiry';

// Strava API configuration
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

export const StravaProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load stored tokens on mount
  useEffect(() => {
    loadStoredTokens();
  }, []);

  const loadStoredTokens = async () => {
    try {
      const [storedAccessToken, storedRefreshToken, storedExpiry] = await Promise.all([
        AsyncStorage.getItem(STRAVA_ACCESS_TOKEN_KEY),
        AsyncStorage.getItem(STRAVA_REFRESH_TOKEN_KEY),
        AsyncStorage.getItem(STRAVA_TOKEN_EXPIRY_KEY),
      ]);

      if (storedAccessToken && storedRefreshToken && storedExpiry) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        setTokenExpiry(parseInt(storedExpiry));
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error loading stored tokens:', error);
    }
  };

  const saveTokens = async (accessToken, refreshToken, expiresAt) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STRAVA_ACCESS_TOKEN_KEY, accessToken),
        AsyncStorage.setItem(STRAVA_REFRESH_TOKEN_KEY, refreshToken),
        AsyncStorage.setItem(STRAVA_TOKEN_EXPIRY_KEY, expiresAt.toString()),
      ]);
      
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      setTokenExpiry(expiresAt);
      setIsConnected(true);
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw error;
    }
  };

  const clearTokens = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STRAVA_ACCESS_TOKEN_KEY),
        AsyncStorage.removeItem(STRAVA_REFRESH_TOKEN_KEY),
        AsyncStorage.removeItem(STRAVA_TOKEN_EXPIRY_KEY),
      ]);
      
      setAccessToken(null);
      setRefreshToken(null);
      setTokenExpiry(null);
      setIsConnected(false);
    } catch (error) {
      console.error('Error clearing tokens:', error);
      throw error;
    }
  };

  const isTokenExpired = (expiry) => {
    if (!expiry) return true;
    return Date.now() >= expiry * 1000;
  };

  const refreshAccessToken = async () => {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(STRAVA_TOKEN_URL, {
        client_id: process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID,
        client_secret: process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });

      const { access_token, refresh_token, expires_at } = response.data;
      await saveTokens(access_token, refresh_token, expires_at);
      
      return access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await clearTokens();
      throw new Error('Failed to refresh access token');
    }
  };

  const getValidAccessToken = async () => {
    if (!accessToken) {
      throw new Error('Not connected to Strava');
    }

    if (isTokenExpired(tokenExpiry)) {
      return await refreshAccessToken();
    }

    return accessToken;
  };

  // Generic API call with automatic token refresh
  const makeApiCall = async (endpoint, options = {}) => {
    setIsLoading(true);
    try {
      const token = await getValidAccessToken();
      
      const response = await axios({
        url: `${STRAVA_API_BASE}${endpoint}`,
        method: options.method || 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        params: options.params,
        data: options.data,
      });

      return response.data;
    } catch (error) {
      console.error('API call failed:', error);
      if (error.response?.status === 401) {
        // Token might be invalid, try to refresh
        try {
          const newToken = await refreshAccessToken();
          const response = await axios({
            url: `${STRAVA_API_BASE}${endpoint}`,
            method: options.method || 'GET',
            headers: {
              'Authorization': `Bearer ${newToken}`,
              ...options.headers,
            },
            params: options.params,
            data: options.data,
          });
          return response.data;
        } catch (refreshError) {
          console.error('Token refresh failed during API call:', refreshError);
          throw refreshError;
        }
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get athlete profile
  const getAthleteProfile = async () => {
    return await makeApiCall('/athlete');
  };

  // Get activities with pagination
  const getActivities = async (page = 1, perPage = 30, before = null, after = null) => {
    const params = {
      page,
      per_page: perPage,
    };

    if (before) params.before = before;
    if (after) params.after = after;

    return await makeApiCall('/athlete/activities', { params });
  };

  // Get a specific activity
  const getActivity = async (activityId) => {
    return await makeApiCall(`/activities/${activityId}`);
  };

  // Get activity streams (detailed data)
  const getActivityStreams = async (activityId, keys = ['time', 'distance', 'latlng', 'altitude', 'velocity_smooth', 'heartrate', 'cadence', 'watts', 'temp', 'moving', 'grade_smooth']) => {
    const params = {
      keys: keys.join(','),
      key_by_type: true,
    };

    return await makeApiCall(`/activities/${activityId}/streams`, { params });
  };

  // Get activities by date range
  const getActivitiesByDateRange = async (startDate, endDate, page = 1, perPage = 30) => {
    const after = Math.floor(new Date(startDate).getTime() / 1000);
    const before = Math.floor(new Date(endDate).getTime() / 1000);
    
    return await getActivities(page, perPage, before, after);
  };

  // Get recent activities (last 30 days)
  const getRecentActivities = async (page = 1, perPage = 30) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return await getActivitiesByDateRange(thirtyDaysAgo.toISOString(), new Date().toISOString(), page, perPage);
  };

  // Get all activities with automatic pagination
  const getAllActivities = async (onProgress = null, maxPages = null) => {
    const allActivities = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && (!maxPages || page <= maxPages)) {
      try {
        const activities = await getActivities(page, 200); // Use max per page
        
        if (activities.length === 0) {
          hasMore = false;
        } else {
          allActivities.push(...activities);
          
          if (onProgress) {
            onProgress({
              page,
              totalFetched: allActivities.length,
              currentPageActivities: activities.length,
            });
          }
          
          page++;
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        hasMore = false;
      }
    }

    return allActivities;
  };

  // Connect Strava (called from OAuth flow)
  const connectStrava = async (accessToken, refreshToken, expiresAt) => {
    await saveTokens(accessToken, refreshToken, expiresAt);
  };

  // Disconnect Strava
  const disconnectStrava = async () => {
    await clearTokens();
  };

  // Fetch comprehensive Strava data
  const fetchAllStravaData = async (options = {}) => {
    try {
      const token = await getValidAccessToken();
      const athleteProfile = await getAthleteProfile();
      
      const comprehensiveData = await stravaService.fetchAllStravaData(
        token, 
        athleteProfile.id, 
        options
      );
      
      return comprehensiveData;
    } catch (error) {
      console.error('Error fetching comprehensive Strava data:', error);
      throw error;
    }
  };

  // Get data summary
  const getDataSummary = (data) => {
    return stravaService.getDataSummary(data);
  };

  // Fetch specific data types
  const fetchAthleteSegments = async () => {
    try {
      const token = await getValidAccessToken();
      const athleteProfile = await getAthleteProfile();
      return await stravaService.fetchAthleteSegments(token, athleteProfile.id);
    } catch (error) {
      console.error('Error fetching athlete segments:', error);
      throw error;
    }
  };

  const fetchAthleteRoutes = async () => {
    try {
      const token = await getValidAccessToken();
      const athleteProfile = await getAthleteProfile();
      return await stravaService.fetchAthleteRoutes(token, athleteProfile.id);
    } catch (error) {
      console.error('Error fetching athlete routes:', error);
      throw error;
    }
  };

  const fetchAthleteClubs = async () => {
    try {
      const token = await getValidAccessToken();
      const athleteProfile = await getAthleteProfile();
      return await stravaService.fetchAthleteClubs(token, athleteProfile.id);
    } catch (error) {
      console.error('Error fetching athlete clubs:', error);
      throw error;
    }
  };

  const fetchAthleteGear = async () => {
    try {
      const token = await getValidAccessToken();
      const athleteProfile = await getAthleteProfile();
      return await stravaService.fetchAthleteGear(token, athleteProfile.id);
    } catch (error) {
      console.error('Error fetching athlete gear:', error);
      throw error;
    }
  };

  const fetchActivityDetails = async (activityId) => {
    try {
      const token = await getValidAccessToken();
      return await stravaService.fetchActivityDetails(token, activityId);
    } catch (error) {
      console.error('Error fetching activity details:', error);
      throw error;
    }
  };

  const value = {
    // State
    isConnected,
    isLoading,
    
    // Token management
    connectStrava,
    disconnectStrava,
    getValidAccessToken,
    
    // Basic API methods
    getAthleteProfile,
    getActivities,
    getActivity,
    getActivityStreams,
    getActivitiesByDateRange,
    getRecentActivities,
    getAllActivities,
    makeApiCall,
    
    // Comprehensive data methods
    fetchAllStravaData,
    getDataSummary,
    fetchAthleteSegments,
    fetchAthleteRoutes,
    fetchAthleteClubs,
    fetchAthleteGear,
    fetchActivityDetails,
  };

  return (
    <StravaContext.Provider value={value}>
      {children}
    </StravaContext.Provider>
  );
};
