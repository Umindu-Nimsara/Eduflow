import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';

const PRIMARY = '#6C63FF';

const DiscussionCard = ({ discussion, onDelete, onPin }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={styles.cardTitle} numberOfLines={2}>{discussion.title}</Text>
          {discussion.isPinned && (
            <View style={styles.pinnedBadge}>
              <Ionicons name="pin" size={12} color="#FF6584" />
            </View>
          )}
        </View>
        <Text style={styles.cardCourse} numberOfLines={1}>
          {discussion.courseId?.title || 'Unknown Course'}
        </Text>
      </View>
    </View>

    <Text style={styles.cardContent} numberOfLines={3}>{discussion.content}</Text>

    <View style={styles.cardMeta}>
      <View style={{ flex: 1 }}>
        <Text style={styles.metaText}>
          <Ionicons name="person" size={12} /> {discussion.userId?.name || 'Unknown'}
        </Text>
        <Text style={styles.metaText}>
          <Ionicons name="time" size={12} /> {new Date(discussion.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={14} color="#FF6584" />
          <Text style={styles.statText}>{discussion.likes?.length || 0}</Text>
        </View>
      </View>
    </View>

    <View style={styles.cardActions}>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: discussion.isPinned ? '#FFB347' : PRIMARY }]}
        onPress={() => onPin(discussion._id, discussion.isPinned)}
      >
        <Ionicons name={discussion.isPinned ? "pin-outline" : "pin"} size={16} color="#fff" />
        <Text style={styles.actionBtnText}>{discussion.isPinned ? 'Unpin' : 'Pin'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: '#FF6584' }]}
        onPress={() => onDelete(discussion._id)}
      >
        <Ionicons name="trash-outline" size={16} color="#fff" />
        <Text style={styles.actionBtnText}>Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const AdminDiscussionsScreen = ({ navigation }) => {
  const [discussions, setDiscussions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const fetchDiscussions = async (isRefresh = false, searchQuery = '') => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const params = searchQuery ? `?search=${searchQuery}` : '';
      const res = await api.get(`${ENDPOINTS.DISCUSSIONS}/admin/all${params}`);
      
      setDiscussions(res.data.data);
      setStats(res.data.stats);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load discussions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    fetchDiscussions(false, search);
  };

  const handlePin = async (id, isPinned) => {
    try {
      await api.put(`${ENDPOINTS.DISCUSSIONS}/${id}/pin`);
      Alert.alert('Success', isPinned ? 'Discussion unpinned' : 'Discussion pinned');
      fetchDiscussions();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update discussion');
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Discussion',
      'Are you sure you want to delete this discussion? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`${ENDPOINTS.DISCUSSIONS}/${id}`);
              Alert.alert('Success', 'Discussion deleted successfully');
              fetchDiscussions();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete discussion');
            }
          }
        }
      ]
    );
  };

  if (loading) return <LoadingSpinner text="Loading discussions..." />;
  if (error) return <ErrorView message={error} onRetry={fetchDiscussions} />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Discussion Management</Text>
          <Text style={styles.headerSub}>Manage all course discussions</Text>
        </View>
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#FF6584' }]}>{stats.totalPinned}</Text>
            <Text style={styles.statLabel}>Pinned</Text>
          </View>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search discussions..."
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Discussions List */}
      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchDiscussions(true, search)} colors={[PRIMARY]} />
        }
      >
        {discussions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No discussions found</Text>
          </View>
        ) : (
          discussions.map((discussion) => (
            <DiscussionCard
              key={discussion._id}
              discussion={discussion}
              onDelete={handleDelete}
              onPin={handlePin}
            />
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: PRIMARY, padding: 20, flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: '#ffffff99', marginTop: 2 },
  statsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16,
    alignItems: 'center', elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: PRIMARY },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  searchContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, paddingHorizontal: 12, elevation: 2,
  },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 14 },
  searchBtn: {
    backgroundColor: PRIMARY, borderRadius: 12, width: 48, height: 48,
    justifyContent: 'center', alignItems: 'center', elevation: 2,
  },
  list: { flex: 1, paddingHorizontal: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', flex: 1 },
  pinnedBadge: {
    backgroundColor: '#FFE5EA', borderRadius: 12, paddingHorizontal: 8,
    paddingVertical: 4, marginLeft: 8,
  },
  cardCourse: { fontSize: 13, color: PRIMARY, marginTop: 2 },
  cardContent: { fontSize: 14, color: '#666', marginBottom: 12, lineHeight: 20 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metaText: { fontSize: 12, color: '#888', marginBottom: 4 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: '#666', fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 8, gap: 6,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
});

export default AdminDiscussionsScreen;
