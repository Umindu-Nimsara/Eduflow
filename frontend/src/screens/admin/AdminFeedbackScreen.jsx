import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';

const PRIMARY = '#6C63FF';

const FeedbackCard = ({ feedback, onDelete }) => {
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Ionicons
        key={i}
        name={i < rating ? 'star' : 'star-outline'}
        size={16}
        color="#FFB347"
      />
    ));
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardCourse} numberOfLines={1}>
            {feedback.courseId?.title || 'Unknown Course'}
          </Text>
          <View style={styles.ratingRow}>
            {renderStars(feedback.rating)}
            <Text style={styles.ratingText}>{feedback.rating}/5</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: '#43C67820' }]}>
          <Text style={[styles.statusText, { color: '#43C678' }]}>
            Published
          </Text>
        </View>
      </View>

      {feedback.comment && (
        <Text style={styles.cardContent} numberOfLines={4}>{feedback.comment}</Text>
      )}

      {feedback.instructorReply && (
        <View style={styles.replyBox}>
          <Text style={styles.replyLabel}>Instructor Reply:</Text>
          <Text style={styles.replyText}>{feedback.instructorReply}</Text>
        </View>
      )}

      <View style={styles.cardMeta}>
        <View style={{ flex: 1 }}>
          <Text style={styles.metaText}>
            <Ionicons name="person" size={12} /> {feedback.userId?.name || 'Unknown'}
          </Text>
          <Text style={styles.metaText}>
            <Ionicons name="time" size={12} /> {new Date(feedback.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FF6584' }]}
          onPress={() => onDelete(feedback._id)}
        >
          <Ionicons name="trash-outline" size={16} color="#fff" />
          <Text style={styles.actionBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const AdminFeedbackScreen = ({ navigation }) => {
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, approved

  useEffect(() => {
    fetchFeedback();
  }, [filter]);

  const fetchFeedback = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const params = filter !== 'all' ? `?filter=${filter}` : '';
      const res = await api.get(`${ENDPOINTS.FEEDBACK}/admin/all${params}`);
      
      setFeedback(res.data.data);
      setStats(res.data.stats);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Feedback',
      'Are you sure you want to delete this feedback? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`${ENDPOINTS.FEEDBACK}/${id}`);
              Alert.alert('Success', 'Feedback deleted successfully');
              fetchFeedback();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete feedback');
            }
          }
        }
      ]
    );
  };

  if (loading) return <LoadingSpinner text="Loading feedback..." />;
  if (error) return <ErrorView message={error} onRetry={fetchFeedback} />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Feedback Management</Text>
          <Text style={styles.headerSub}>Manage course feedback & reviews</Text>
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
            <Text style={[styles.statValue, { color: '#43C678' }]}>{stats.totalApproved}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="star" size={20} color="#FFB347" />
              <Text style={[styles.statValue, { color: '#FFB347' }]}>{stats.avgRating}</Text>
            </View>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All Feedback</Text>
        </TouchableOpacity>
      </View>

      {/* Feedback List */}
      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchFeedback(true)} colors={[PRIMARY]} />
        }
      >
        {feedback.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbox-ellipses-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No feedback found</Text>
          </View>
        ) : (
          feedback.map((item) => (
            <FeedbackCard
              key={item._id}
              feedback={item}
              onDelete={handleDelete}
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
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12,
    alignItems: 'center', elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: PRIMARY },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4 },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  filterTab: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', elevation: 2,
  },
  filterTabActive: { backgroundColor: PRIMARY },
  filterText: { fontSize: 14, fontWeight: '600', color: '#666' },
  filterTextActive: { color: '#fff' },
  list: { flex: 1, paddingHorizontal: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  cardCourse: { fontSize: 15, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, fontWeight: '600', color: '#666', marginLeft: 4 },
  statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardContent: { fontSize: 14, color: '#666', marginBottom: 12, lineHeight: 20 },
  replyBox: {
    backgroundColor: '#F5F5F5', borderRadius: 8, padding: 12, marginBottom: 12,
    borderLeftWidth: 3, borderLeftColor: PRIMARY,
  },
  replyLabel: { fontSize: 12, fontWeight: '600', color: PRIMARY, marginBottom: 4 },
  replyText: { fontSize: 13, color: '#666', lineHeight: 18 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metaText: { fontSize: 12, color: '#888', marginBottom: 4 },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 8, gap: 6,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
});

export default AdminFeedbackScreen;
