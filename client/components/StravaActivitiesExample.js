import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useStrava } from '../context/StravaContext';

const StravaActivitiesExample = () => {
  const { 
    isConnected, 
    getActivities, 
    getRecentActivities, 
    getAllActivities,
    isLoading 
  } = useStrava();
  
  const [activities, setActivities] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Load initial activities
  useEffect(() => {
    if (isConnected) {
      loadInitialActivities();
    }
  }, [isConnected]);

  const loadInitialActivities = async () => {
    try {
      const recentActivities = await getRecentActivities(1, 30);
      setActivities(recentActivities);
      setCurrentPage(1);
      setHasMore(recentActivities.length === 30);
    } catch (error) {
      console.error('Error loading activities:', error);
      Alert.alert('Error', 'Failed to load activities');
    }
  };

  const loadMoreActivities = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const moreActivities = await getActivities(nextPage, 30);
      
      if (moreActivities.length === 0) {
        setHasMore(false);
      } else {
        setActivities(prev => [...prev, ...moreActivities]);
        setCurrentPage(nextPage);
        setHasMore(moreActivities.length === 30);
      }
    } catch (error) {
      console.error('Error loading more activities:', error);
      Alert.alert('Error', 'Failed to load more activities');
    } finally {
      setLoadingMore(false);
    }
  };

  const loadAllActivities = async () => {
    try {
      Alert.alert(
        'Load All Activities',
        'This will fetch all your activities. This may take a while.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Load All',
            onPress: async () => {
              const allActivities = await getAllActivities(
                (progress) => {
                  console.log(`Loaded page ${progress.page}, total: ${progress.totalFetched}`);
                },
                10 // Limit to 10 pages for demo
              );
              setActivities(allActivities);
              setHasMore(false);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error loading all activities:', error);
      Alert.alert('Error', 'Failed to load all activities');
    }
  };

  const renderActivity = ({ item }) => (
    <View style={styles.activityItem}>
      <Text style={styles.activityName}>{item.name}</Text>
      <Text style={styles.activityDetails}>
        {item.type} • {Math.round(item.distance / 1000)}km • {Math.round(item.moving_time / 60)}min
      </Text>
      <Text style={styles.activityDate}>
        {new Date(item.start_date).toLocaleDateString()}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#667eea" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Please connect to Strava first</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.message}>Loading activities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Strava Activities</Text>
        <Text style={styles.subtitle}>
          {activities.length} activities loaded
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={loadInitialActivities}
        >
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={loadAllActivities}
        >
          <Text style={styles.buttonText}>Load All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={loadMoreActivities}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  activityItem: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  activityDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  activityDate: {
    fontSize: 12,
    color: '#999',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  footerText: {
    marginLeft: 10,
    color: '#666',
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
});

export default StravaActivitiesExample;
