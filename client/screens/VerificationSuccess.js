import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function VerificationSuccess({ route, navigation }) {
  const { challenge, activity, transactionHash, etherscanUrl, blockNumber, completionStatus } = route.params;

  const handleViewOnEtherscan = () => {
    if (etherscanUrl) {
      Linking.openURL(etherscanUrl);
    } else {
      Alert.alert('Error', 'Etherscan URL not available');
    }
  };

  const handleBackToChallenges = () => {
    navigation.navigate('MyChallenges');
  };

  const formatDistance = (distance) => {
    return (distance / 1000).toFixed(2);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else {
      return `${minutes}m ${secs}s`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Header */}
        <View style={styles.header}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
          </View>
          <Text style={styles.title}>{completionStatus || 'Challenge Completed! 🎉'}</Text>
          <Text style={styles.subtitle}>
            Your run has been verified and the challenge marked as complete on-chain.
          </Text>
        </View>

        {/* Challenge Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Challenge Details</Text>
          <View style={styles.detailCard}>
            <Text style={styles.challengeName}>{challenge.name}</Text>
            <Text style={styles.challengeDescription}>{challenge.description}</Text>
            <View style={styles.challengeStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Target Distance</Text>
                <Text style={styles.statValue}>{formatDistance(challenge.targetDistance)} km</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Stake Amount</Text>
                <Text style={styles.statValue}>{challenge.stakeAmount} ETH</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Activity Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verified Activity</Text>
          <View style={styles.detailCard}>
            <Text style={styles.activityName}>{activity.name}</Text>
            <View style={styles.activityStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>{formatDistance(activity.distance)} km</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>{formatTime(activity.moving_time || activity.elapsed_time)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Type</Text>
                <Text style={styles.statValue}>{activity.type}</Text>
              </View>
            </View>
            <Text style={styles.activityDate}>
              {new Date(activity.start_date).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Transaction Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Blockchain Transaction</Text>
          <View style={styles.detailCard}>
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>Transaction Hash:</Text>
              <Text style={styles.transactionHash} numberOfLines={1} ellipsizeMode="middle">
                {transactionHash}
              </Text>
            </View>
            {blockNumber && (
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Block Number:</Text>
                <Text style={styles.transactionValue}>{blockNumber}</Text>
              </View>
            )}
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>Status:</Text>
              <Text style={[styles.transactionValue, styles.successStatus]}>✅ Confirmed</Text>
            </View>
            <TouchableOpacity 
              style={styles.etherscanButton}
              onPress={handleViewOnEtherscan}
            >
              <Ionicons name="open-outline" size={20} color="#3B82F6" />
              <Text style={styles.etherscanButtonText}>View on Etherscan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleBackToChallenges}
          >
            <Text style={styles.primaryButtonText}>Back to My Challenges</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  successIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  challengeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  challengeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  activityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  activityDate: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  transactionHash: {
    fontSize: 12,
    color: '#3B82F6',
    flex: 2,
    textAlign: 'right',
  },
  transactionValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  successStatus: {
    color: '#10B981',
  },
  etherscanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF4FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  etherscanButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    marginLeft: 8,
  },
  actions: {
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
