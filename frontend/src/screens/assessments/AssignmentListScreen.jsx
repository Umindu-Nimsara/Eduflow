import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { assessmentService } from '../../services/assessmentService';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';
import colors from '../../constants/colors';

const AssignmentListScreen = ({ navigation, route }) => {
  const { courseId } = route.params || {};
  const { user } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, [courseId]);

  const fetchAssignments = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await assessmentService.getAllAssignments(1, 50, courseId);
      setAssignments(response.data);

      // Fetch user's submissions
      try {
        const subRes = await api.get(`${ENDPOINTS.SUBMISSIONS}/my-submissions`);
        setSubmissions(subRes.data.data || []);
      } catch (subErr) {
        console.log('Failed to fetch submissions:', subErr.message);
        setSubmissions([]);
      }

      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getSubmissionStatus = (assignmentId) => {
    const submission = submissions.find(
      sub => sub.assignmentId?._id === assignmentId || sub.assignmentId === assignmentId
    );
    return submission;
  };

  const getStatusColor = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return colors.danger;
    if (daysLeft <= 3) return colors.warning;
    return colors.success;
  };

  const getStatusText = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return 'Overdue';
    if (daysLeft === 0) return 'Due Today';
    if (daysLeft === 1) return 'Due Tomorrow';
    return `${daysLeft} days left`;
  };

  const renderAssignmentCard = ({ item }) => {
    const statusColor = getStatusColor(item.dueDate);
    const statusText = getStatusText(item.dueDate);
    const submission = getSubmissionStatus(item._id);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AssignmentDetail', { assignmentId: item._id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-attach" size={24} color={colors.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              Due: {new Date(item.dueDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.pointsContainer}>
            <Ionicons name="trophy" size={16} color={colors.primary} />
            <Text style={styles.pointsText}>{item.totalMarks || item.maxScore} points</Text>
          </View>
          
          {submission && (
            <View style={[
              styles.submissionBadge,
              { backgroundColor: submission.isGraded ? colors.success + '20' : colors.warning + '20' }
            ]}>
              <Ionicons 
                name={submission.isGraded ? 'checkmark-circle' : 'time'} 
                size={14} 
                color={submission.isGraded ? colors.success : colors.warning} 
              />
              <Text style={[
                styles.submissionText,
                { color: submission.isGraded ? colors.success : colors.warning }
              ]}>
                {submission.isGraded ? `Graded: ${submission.grade}/${item.totalMarks || item.maxScore}` : 'Submitted'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchAssignments} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={assignments}
        renderItem={renderAssignmentCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAssignments(true)}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={<EmptyState message="No assignments available" icon="document-attach-outline" />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  submissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  submissionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default AssignmentListScreen;
