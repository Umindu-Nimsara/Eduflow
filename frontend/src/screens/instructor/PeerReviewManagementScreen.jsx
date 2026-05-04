import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';

const PRIMARY = '#6C63FF';
const SUCCESS = '#43C678';
const WARNING = '#FFB347';

const PeerReviewManagementScreen = ({ route, navigation }) => {
  const { assignmentId, assignmentTitle } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchReviews();
  }, [assignmentId]);

  const fetchReviews = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await api.get(`/peer-reviews/assignment/${assignmentId}`);
      setReviews(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load peer reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (reviewId) => {
    try {
      await api.put(`/peer-reviews/${reviewId}/approve`);
      Alert.alert('Success', 'Peer review approved!');
      fetchReviews();
    } catch (err) {
      Alert.alert('Error', 'Failed to approve review');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return SUCCESS;
      case 'submitted': return WARNING;
      case 'pending': return '#888';
      default: return '#888';
    }
  };

  const renderReview = ({ item }) => {
    const statusColor = getStatusColor(item.status);

    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewerInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.reviewerId?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.reviewerName}>{item.reviewerId?.name}</Text>
              <Text style={styles.revieweeText}>
                Reviewed: {item.revieweeId?.name}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Overall Score:</Text>
          <Text style={styles.scoreValue}>{item.overallScore}%</Text>
        </View>

        {item.strengths && (
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackLabel}>Strengths:</Text>
            <Text style={styles.feedbackText}>{item.strengths}</Text>
          </View>
        )}

        {item.improvements && (
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackLabel}>Improvements:</Text>
            <Text style={styles.feedbackText}>{item.improvements}</Text>
          </View>
        )}

        {item.status === 'submitted' && (
          <TouchableOpacity
            style={styles.approveButton}
            onPress={() => handleApprove(item._id)}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.approveButtonText}>Approve Review</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) return <LoadingSpinner text="Loading peer reviews..." />;
  if (error) return <ErrorView message={error} onRetry={fetchReviews} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{assignmentTitle}</Text>
        <Text style={styles.headerSubtitle}>Peer Review Management</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{reviews.length}</Text>
          <Text style={styles.statLabel}>Total Reviews</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {reviews.filter(r => r.status === 'approved').length}
          </Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {reviews.filter(r => r.status === 'submitted').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      <FlatList
        data={reviews}
        renderItem={renderReview}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchReviews(true)}
            colors={[PRIMARY]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No peer reviews yet</Text>
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
  
  statsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: PRIMARY },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  
  listContainer: { padding: 16 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reviewerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: PRIMARY },
  reviewerName: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  revieweeText: { fontSize: 12, color: '#888', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600', color: '#fff', textTransform: 'capitalize' },
  
  scoreContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  scoreLabel: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  scoreValue: { fontSize: 20, fontWeight: 'bold', color: SUCCESS },
  
  feedbackSection: { marginBottom: 8 },
  feedbackLabel: { fontSize: 13, fontWeight: '600', color: '#1a1a2e', marginBottom: 4 },
  feedbackText: { fontSize: 13, color: '#666', lineHeight: 18 },
  
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SUCCESS,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  approveButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#888', marginTop: 16 },
});

export default PeerReviewManagementScreen;
