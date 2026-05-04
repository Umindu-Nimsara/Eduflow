import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';

const PRIMARY = '#6C63FF';
const GOLD = '#FFD700';
const SILVER = '#C0C0C0';
const BRONZE = '#CD7F32';

const LeaderboardScreen = ({ route, navigation }) => {
  const { courseId, courseName } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [viewMode, setViewMode] = useState('course'); // 'course' or 'global'

  useEffect(() => {
    fetchLeaderboard();
  }, [courseId, viewMode]);

  const fetchLeaderboard = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const endpoint = viewMode === 'global' 
        ? '/leaderboard/global'
        : `/leaderboard/course/${courseId}`;

      const [leaderboardRes, statsRes] = await Promise.all([
        api.get(endpoint),
        courseId ? api.get(`/leaderboard/course/${courseId}/my-stats`) : Promise.resolve({ data: { data: null } })
      ]);

      setLeaderboard(leaderboardRes.data.data || []);
      setMyStats(statsRes.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getRankColor = (rank) => {
    if (rank === 1) return GOLD;
    if (rank === 2) return SILVER;
    if (rank === 3) return BRONZE;
    return PRIMARY;
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return 'trophy';
    if (rank === 2) return 'medal';
    if (rank === 3) return 'ribbon';
    return 'star';
  };

  const renderLeaderboardItem = ({ item, index }) => {
    const rank = index + 1;
    const rankColor = getRankColor(rank);
    const rankIcon = getRankIcon(rank);
    const isMe = viewMode === 'course' && item.userId?._id === myStats?.userId;

    return (
      <View style={[styles.leaderboardCard, isMe && styles.myCard]}>
        <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
          <Ionicons name={rankIcon} size={20} color="#fff" />
          <Text style={styles.rankText}>{rank}</Text>
        </View>

        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>
            {item.userId?.name?.charAt(0).toUpperCase() || item._id?.name?.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.userId?.name || item._id?.name}
            {isMe && <Text style={styles.meText}> (You)</Text>}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="flame" size={14} color="#FF6B6B" />
              <Text style={styles.statText}>{item.streak?.current || 0} day streak</Text>
            </View>
          </View>
        </View>

        <View style={styles.pointsContainer}>
          <Text style={styles.pointsValue}>{item.points || item.totalPoints || 0}</Text>
          <Text style={styles.pointsLabel}>points</Text>
        </View>
      </View>
    );
  };

  if (loading) return <LoadingSpinner text="Loading leaderboard..." />;
  if (error) return <ErrorView message={error} onRetry={fetchLeaderboard} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {viewMode === 'global' ? 'Global Leaderboard' : courseName}
        </Text>
        <Text style={styles.headerSubtitle}>Top Performers</Text>
      </View>

      {myStats && viewMode === 'course' && (
        <View style={styles.myStatsCard}>
          <View style={styles.myStatsHeader}>
            <Text style={styles.myStatsTitle}>Your Stats</Text>
            <View style={[styles.rankBadge, { backgroundColor: PRIMARY }]}>
              <Text style={styles.rankText}>#{myStats.rank || '?'}</Text>
            </View>
          </View>
          <View style={styles.myStatsGrid}>
            <View style={styles.myStatItem}>
              <Ionicons name="trophy" size={24} color={GOLD} />
              <Text style={styles.myStatValue}>{myStats.points || 0}</Text>
              <Text style={styles.myStatLabel}>Points</Text>
            </View>
            <View style={styles.myStatItem}>
              <Ionicons name="flame" size={24} color="#FF6B6B" />
              <Text style={styles.myStatValue}>{myStats.streak?.current || 0}</Text>
              <Text style={styles.myStatLabel}>Day Streak</Text>
            </View>
            <View style={styles.myStatItem}>
              <Ionicons name="checkmark-circle" size={24} color="#43C678" />
              <Text style={styles.myStatValue}>{myStats.stats?.quizzesCompleted || 0}</Text>
              <Text style={styles.myStatLabel}>Quizzes</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'course' && styles.toggleButtonActive]}
          onPress={() => setViewMode('course')}
        >
          <Text style={[styles.toggleText, viewMode === 'course' && styles.toggleTextActive]}>
            Course
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'global' && styles.toggleButtonActive]}
          onPress={() => setViewMode('global')}
        >
          <Text style={[styles.toggleText, viewMode === 'global' && styles.toggleTextActive]}>
            Global
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item, index) => item._id || index.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchLeaderboard(true)}
            colors={[PRIMARY]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No rankings yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: PRIMARY, padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  
  myStatsCard: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16, elevation: 3 },
  myStatsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  myStatsTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' },
  myStatsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  myStatItem: { alignItems: 'center' },
  myStatValue: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginTop: 8 },
  myStatLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  
  toggleContainer: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: '#fff', borderRadius: 12, padding: 4, elevation: 2 },
  toggleButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  toggleButtonActive: { backgroundColor: PRIMARY },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#888' },
  toggleTextActive: { color: '#fff' },
  
  listContainer: { padding: 16 },
  leaderboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
  },
  myCard: { borderWidth: 2, borderColor: PRIMARY },
  
  rankBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: { fontSize: 14, fontWeight: 'bold', color: '#fff', marginTop: 2 },
  
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: PRIMARY },
  
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginBottom: 4 },
  meText: { fontSize: 13, fontWeight: '500', color: PRIMARY },
  statsRow: { flexDirection: 'row', gap: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: '#888' },
  
  pointsContainer: { alignItems: 'flex-end' },
  pointsValue: { fontSize: 20, fontWeight: 'bold', color: PRIMARY },
  pointsLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#888', marginTop: 16 },
});

export default LeaderboardScreen;
