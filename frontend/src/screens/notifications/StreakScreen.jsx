import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../../services/notificationService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import colors from '../../constants/colors';

const StreakScreen = () => {
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchStreak();
  }, []);

  const fetchStreak = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getMyStreak();
      setStreak(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load streak');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStreak = async () => {
    try {
      setUpdating(true);
      await notificationService.updateStreak();
      fetchStreak();
      Alert.alert('Success', 'Streak updated! Keep it up! 🔥');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update streak');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchStreak} />;
  }

  const currentStreak = streak?.currentStreak || 0;
  const longestStreak = streak?.longestStreak || 0;
  const lastActivityDate = streak?.lastActivityDate 
    ? new Date(streak.lastActivityDate).toLocaleDateString()
    : 'Never';

  const getStreakLevel = (days) => {
    if (days >= 30) return { level: 'Legend', color: colors.danger, icon: 'flame' };
    if (days >= 14) return { level: 'Master', color: colors.warning, icon: 'star' };
    if (days >= 7) return { level: 'Champion', color: colors.primary, icon: 'trophy' };
    if (days >= 3) return { level: 'Rising', color: colors.success, icon: 'trending-up' };
    return { level: 'Beginner', color: colors.textSecondary, icon: 'rocket' };
  };

  const streakLevel = getStreakLevel(currentStreak);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="flame" size={80} color={colors.danger} />
        <Text style={styles.headerTitle}>Your Learning Streak</Text>
        <Text style={styles.headerSubtitle}>Keep learning every day!</Text>
      </View>

      <View style={styles.streakCard}>
        <View style={styles.currentStreakContainer}>
          <Text style={styles.streakNumber}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
        </View>

        <View style={[styles.levelBadge, { backgroundColor: streakLevel.color + '20' }]}>
          <Ionicons name={streakLevel.icon} size={20} color={streakLevel.color} />
          <Text style={[styles.levelText, { color: streakLevel.color }]}>
            {streakLevel.level}
          </Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="trophy" size={32} color={colors.warning} />
          <Text style={styles.statValue}>{longestStreak}</Text>
          <Text style={styles.statLabel}>Longest Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={32} color={colors.primary} />
          <Text style={styles.statValue}>{lastActivityDate}</Text>
          <Text style={styles.statLabel}>Last Activity</Text>
        </View>
      </View>

      <View style={styles.milestones}>
        <Text style={styles.milestonesTitle}>Streak Milestones</Text>
        {[
          { days: 3, label: 'Rising Star', icon: 'trending-up', color: colors.success },
          { days: 7, label: 'Champion', icon: 'trophy', color: colors.primary },
          { days: 14, label: 'Master', icon: 'star', color: colors.warning },
          { days: 30, label: 'Legend', icon: 'flame', color: colors.danger },
        ].map((milestone) => (
          <View 
            key={milestone.days} 
            style={[
              styles.milestoneItem,
              currentStreak >= milestone.days && styles.milestoneItemAchieved
            ]}
          >
            <View style={[
              styles.milestoneIcon,
              { backgroundColor: milestone.color + '20' }
            ]}>
              <Ionicons 
                name={milestone.icon} 
                size={24} 
                color={milestone.color} 
              />
            </View>
            <View style={styles.milestoneInfo}>
              <Text style={styles.milestoneLabel}>{milestone.label}</Text>
              <Text style={styles.milestoneDays}>{milestone.days} days</Text>
            </View>
            {currentStreak >= milestone.days && (
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            )}
          </View>
        ))}
      </View>

      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>💡 Tips to Maintain Your Streak</Text>
        <Text style={styles.tipText}>• Complete at least one lesson daily</Text>
        <Text style={styles.tipText}>• Take a quiz or submit an assignment</Text>
        <Text style={styles.tipText}>• Participate in discussions</Text>
        <Text style={styles.tipText}>• Watch course videos</Text>
      </View>

      <TouchableOpacity
        style={[styles.updateButton, updating && styles.updateButtonDisabled]}
        onPress={handleUpdateStreak}
        disabled={updating}
      >
        <Ionicons name="refresh" size={20} color={colors.white} />
        <Text style={styles.updateButtonText}>
          {updating ? 'Updating...' : 'Update Streak'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.white,
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  streakCard: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currentStreakContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  streakNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: colors.danger,
  },
  streakLabel: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 4,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  milestones: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  milestonesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    opacity: 0.5,
  },
  milestoneItemAchieved: {
    opacity: 1,
  },
  milestoneIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  milestoneDays: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tipsCard: {
    backgroundColor: colors.primary + '10',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 24,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginLeft: 8,
  },
});

export default StreakScreen;
