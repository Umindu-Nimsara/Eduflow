import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import colors from '../../constants/colors';
import api from '../../services/api';

const LeaderboardScreen = () => {
  const { user } = useContext(AuthContext);
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeframe, setTimeframe] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const fetchLeaderboard = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await api.get(`/gamification/leaderboard?timeframe=${timeframe}&limit=50`);
      setLeaderboard(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getRankMedal = (rank) => {
    if (rank === 1) return { icon: 'trophy', color: '#FFD700' };
    if (rank === 2) return { icon: 'medal', color: '#C0C0C0' };
    if (rank === 3) return { icon: 'medal', color: '#CD7F32' };
    return { icon: 'person-circle-outline', color: colors.textSecondary };
  };

  const renderLeaderboardItem = ({ item, index }) => {
    const rank = index + 1;
    const medal = getRankMedal(rank);
    const isCurrentUser = item.userId?._id === user?.id;

    return (
      <View style={[styles.leaderboardItem, isCurrentUser && styles.currentUserItem]}>
        <View style={styles.rankContainer}>
          {rank <= 3 ? (
            <Ionicons name={medal.icon} size={32} color={medal.color} />
          ) : (
            <Text style={styles.rankText}>#{rank}</Text>
          )}
        </View>

        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color={colors.white} />
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, isCurrentUser && styles.currentUserText]}>
              {item.userId?.name || 'Unknown User'}
              {isCurrentUser && ' (You)'}
            </Text>
            <View style={styles.userStats}>
              <Text style={styles.levelBadge}>Lv. {item.level}</Text>
              <Text style={styles.rankBadge}>{item.rank}</Text>
            </View>
          </View>
        </View>

        <View style={styles.pointsContainer}>
          <Ionicons name="star" size={20} color="#FFD700" />
          <Text style={styles.pointsText}>{item.totalPoints.toLocaleString()}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchLeaderboard} />;
  }

  return (
    <View style={styles.container}>
      {/* Timeframe Selector */}
      <View style={styles.timeframeContainer}>
        <TouchableOpacity
          style={[styles.timeframeButton, timeframe === 'all' && styles.activeTimeframe]}
          onPress={() => setTimeframe('all')}
        >
          <Text style={[styles.timeframeText, timeframe === 'all' && styles.activeTimeframeText]}>
            All Time
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeframeButton, timeframe === 'month' && styles.activeTimeframe]}
          onPress={() => setTimeframe('month')}
        >
          <Text style={[styles.timeframeText, timeframe === 'month' && styles.activeTimeframeText]}>
            This Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeframeButton, timeframe === 'week' && styles.activeTimeframe]}
          onPress={() => setTimeframe('week')}
        >
          <Text style={[styles.timeframeText, timeframe === 'week' && styles.activeTimeframeText]}>
            This Week
          </Text>
        </TouchableOpacity>
      </View>

      {/* Leaderboard List */}
      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchLeaderboard(true)}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No rankings yet</Text>
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
  timeframeContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.white,
    gap: 8,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  activeTimeframe: {
    backgroundColor: colors.primary,
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  activeTimeframeText: {
    color: colors.white,
  },
  listContent: {
    padding: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  currentUserItem: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  currentUserText: {
    color: colors.primary,
  },
  userStats: {
    flexDirection: 'row',
    gap: 8,
  },
  levelBadge: {
    fontSize: 12,
    color: colors.white,
    backgroundColor: '#6C63FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontWeight: '600',
  },
  rankBadge: {
    fontSize: 12,
    color: colors.white,
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontWeight: '600',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD70020',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
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

export default LeaderboardScreen;
