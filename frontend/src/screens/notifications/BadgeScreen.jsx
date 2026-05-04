import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../../services/notificationService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import colors from '../../constants/colors';

const BadgeScreen = () => {
  const [myBadges, setMyBadges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [myBadgesRes, allBadgesRes] = await Promise.all([
        notificationService.getMyBadges(),
        notificationService.getAllBadges(),
      ]);

      setMyBadges(myBadgesRes.data);
      setAllBadges(allBadgesRes.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load badges');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getBadgeIcon = (type) => {
    switch (type) {
      case 'course_completion':
        return 'school';
      case 'quiz_master':
        return 'document-text';
      case 'assignment_ace':
        return 'document-attach';
      case 'discussion_contributor':
        return 'chatbubbles';
      case 'streak_warrior':
        return 'flame';
      case 'early_bird':
        return 'sunny';
      case 'night_owl':
        return 'moon';
      default:
        return 'trophy';
    }
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case 'course_completion':
        return colors.success;
      case 'quiz_master':
        return colors.primary;
      case 'assignment_ace':
        return colors.warning;
      case 'discussion_contributor':
        return colors.info;
      case 'streak_warrior':
        return colors.danger;
      default:
        return colors.primary;
    }
  };

  const isEarned = (badgeId) => {
    return myBadges.some(mb => mb.badge._id === badgeId);
  };

  const getEarnedDate = (badgeId) => {
    const earned = myBadges.find(mb => mb.badge._id === badgeId);
    return earned ? new Date(earned.earnedAt).toLocaleDateString() : null;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchBadges} />;
  }

  const earnedCount = myBadges.length;
  const totalCount = allBadges.length;
  const progressPercentage = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchBadges(true)}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.header}>
        <Ionicons name="trophy" size={64} color={colors.warning} />
        <Text style={styles.headerTitle}>Achievement Badges</Text>
        <Text style={styles.headerSubtitle}>
          {earnedCount} of {totalCount} badges earned
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
      </View>

      {earnedCount > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Earned Badges</Text>
          <View style={styles.badgesGrid}>
            {myBadges.map((item) => {
              const badge = item.badge;
              const badgeColor = getBadgeColor(badge.type);
              return (
                <View key={item._id} style={styles.badgeCard}>
                  <View style={[styles.badgeIcon, { backgroundColor: badgeColor + '20' }]}>
                    <Ionicons 
                      name={getBadgeIcon(badge.type)} 
                      size={32} 
                      color={badgeColor} 
                    />
                  </View>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                  <Text style={styles.badgeDescription} numberOfLines={2}>
                    {badge.description}
                  </Text>
                  <Text style={styles.earnedDate}>
                    Earned: {getEarnedDate(badge._id)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {earnedCount > 0 ? '🔒 Locked Badges' : '🎯 Available Badges'}
        </Text>
        <View style={styles.badgesGrid}>
          {allBadges
            .filter(badge => !isEarned(badge._id))
            .map((badge) => {
              const badgeColor = getBadgeColor(badge.type);
              return (
                <View key={badge._id} style={[styles.badgeCard, styles.badgeCardLocked]}>
                  <View style={[styles.badgeIcon, styles.badgeIconLocked]}>
                    <Ionicons 
                      name={getBadgeIcon(badge.type)} 
                      size={32} 
                      color={colors.textLight} 
                    />
                  </View>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                  <Text style={styles.badgeDescription} numberOfLines={2}>
                    {badge.description}
                  </Text>
                  <View style={styles.criteriaContainer}>
                    <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.criteriaText}>
                      {badge.criteria}
                    </Text>
                  </View>
                </View>
              );
            })}
        </View>
      </View>

      {earnedCount === 0 && (
        <View style={styles.motivationCard}>
          <Ionicons name="rocket" size={48} color={colors.primary} />
          <Text style={styles.motivationTitle}>Start Your Journey!</Text>
          <Text style={styles.motivationText}>
            Complete courses, ace quizzes, and participate in discussions to earn badges!
          </Text>
        </View>
      )}
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
    marginBottom: 16,
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  badgeCardLocked: {
    opacity: 0.6,
  },
  badgeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeIconLocked: {
    backgroundColor: colors.gray[100],
  },
  badgeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  earnedDate: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
  },
  criteriaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  criteriaText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  motivationCard: {
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
  motivationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default BadgeScreen;
