import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import colors from '../../constants/colors';
import api from '../../services/api';

const BadgesScreen = () => {
  const [allBadges, setAllBadges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [allBadgesRes, gamificationRes] = await Promise.all([
        api.get('/gamification/badges'),
        api.get('/gamification/me')
      ]);

      setAllBadges(allBadgesRes.data.data);
      setEarnedBadges(gamificationRes.data.data.badges);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load badges');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const isBadgeEarned = (badgeId) => {
    return earnedBadges.some(b => b.badgeId === badgeId);
  };

  const getEarnedDate = (badgeId) => {
    const badge = earnedBadges.find(b => b.badgeId === badgeId);
    return badge ? new Date(badge.earnedAt).toLocaleDateString() : null;
  };

  const renderBadgeItem = ({ item }) => {
    const earned = isBadgeEarned(item.id);
    const earnedDate = getEarnedDate(item.id);

    return (
      <View style={[styles.badgeCard, !earned && styles.lockedBadge]}>
        <View style={[styles.badgeIconContainer, !earned && styles.lockedIcon]}>
          <Ionicons 
            name={item.icon} 
            size={48} 
            color={earned ? '#FFD700' : colors.textSecondary} 
          />
        </View>
        
        <View style={styles.badgeInfo}>
          <Text style={[styles.badgeName, !earned && styles.lockedText]}>
            {item.name}
          </Text>
          <Text style={[styles.badgeDescription, !earned && styles.lockedText]}>
            {item.description}
          </Text>
          
          {earned ? (
            <View style={styles.earnedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#43C678" />
              <Text style={styles.earnedText}>Earned on {earnedDate}</Text>
            </View>
          ) : (
            <View style={styles.lockedBadge}>
              <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
              <Text style={styles.lockedBadgeText}>Not earned yet</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchBadges} />;
  }

  const earnedCount = earnedBadges.length;
  const totalCount = allBadges.length;
  const progressPercentage = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressTitle}>Your Progress</Text>
          <Text style={styles.progressCount}>
            {earnedCount} / {totalCount} Badges Earned
          </Text>
        </View>
        <View style={styles.progressCircle}>
          <Text style={styles.progressPercentage}>{Math.round(progressPercentage)}%</Text>
        </View>
      </View>

      {/* Badges List */}
      <FlatList
        data={allBadges}
        renderItem={renderBadgeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchBadges(true)}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="ribbon-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No badges available</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressHeader: {
    backgroundColor: colors.white,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  progressCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  listContent: {
    padding: 16,
  },
  badgeCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lockedBadge: {
    opacity: 0.6,
  },
  badgeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD70020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  lockedIcon: {
    backgroundColor: colors.border,
  },
  badgeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  lockedText: {
    color: colors.textSecondary,
  },
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#43C67820',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  earnedText: {
    fontSize: 12,
    color: '#43C678',
    fontWeight: '600',
    marginLeft: 6,
  },
  lockedBadgeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
});

export default BadgesScreen;
