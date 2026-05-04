import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { discussionService } from '../../services/discussionService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';
import colors from '../../constants/colors';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

const FeedbackScreen = ({ route }) => {
  const { courseId, instructorId } = route.params;
  const { user } = useContext(AuthContext);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null);

  const isInstructor = user?.role === 'instructor' && user?.id === instructorId;

  useEffect(() => {
    fetchFeedbacks();
  }, [courseId]);

  const fetchFeedbacks = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await discussionService.getCourseFeedback(courseId, 1, 50);
      // API returns { success: true, data: { feedback: [...], avgRating: ..., totalReviews: ... } }
      const feedbackData = response.data?.feedback || response.data || [];
      setFeedbacks(feedbackData);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    try {
      setSubmitting(true);
      
      if (editMode && editingFeedback) {
        // Update existing feedback
        await api.put(`${ENDPOINTS.FEEDBACK}/${editingFeedback._id}`, {
          rating,
          comment: comment.trim(),
        });
        Alert.alert('Success', 'Feedback updated successfully!');
      } else {
        // Create new feedback
        await discussionService.createFeedback({
          courseId,
          rating,
          comment: comment.trim(),
        });
        Alert.alert('Success', 'Feedback submitted successfully!');
      }

      setModalVisible(false);
      setRating(0);
      setComment('');
      setEditMode(false);
      setEditingFeedback(null);
      fetchFeedbacks();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (feedback) => {
    setSelectedFeedback(feedback);
    setReplyText(feedback.instructorReply || '');
    setReplyModalVisible(true);
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }

    try {
      setSubmitting(true);
      await api.put(`${ENDPOINTS.FEEDBACK}/${selectedFeedback._id}/reply`, {
        reply: replyText.trim(),
      });

      Alert.alert('Success', 'Reply added successfully!');
      setReplyModalVisible(false);
      setSelectedFeedback(null);
      setReplyText('');
      fetchFeedbacks();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFeedback = (feedbackId) => {
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
              await api.delete(`${ENDPOINTS.FEEDBACK}/${feedbackId}`);
              Alert.alert('Success', 'Feedback deleted successfully');
              fetchFeedbacks();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete feedback');
            }
          },
        },
      ]
    );
  };

  const handleEditFeedback = (feedback) => {
    setEditMode(true);
    setEditingFeedback(feedback);
    setRating(feedback.rating);
    setComment(feedback.comment);
    setModalVisible(true);
  };

  const renderStars = (rating, onPress = null) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress && onPress(star)}
            disabled={!onPress}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={onPress ? 32 : 16}
              color={colors.warning}
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderFeedbackCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={colors.white} />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.userId?.name || 'Anonymous'}</Text>
            <Text style={styles.timestamp}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {renderStars(item.rating)}
          {isInstructor && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleReply(item)}
              >
                <Ionicons name="chatbubble-outline" size={18} color="#6C63FF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteFeedback(item._id)}
              >
                <Ionicons name="trash-outline" size={18} color="#FF6584" />
              </TouchableOpacity>
            </View>
          )}
          {!isInstructor && item.userId?._id === user?.id && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditFeedback(item)}
              >
                <Ionicons name="create-outline" size={18} color="#6C63FF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteFeedback(item._id)}
              >
                <Ionicons name="trash-outline" size={18} color="#FF6584" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.comment}>{item.comment}</Text>
      
      {item.instructorReply && (
        <View style={styles.replyContainer}>
          <View style={styles.replyHeader}>
            <Ionicons name="arrow-undo" size={16} color="#6C63FF" />
            <Text style={styles.replyLabel}>Instructor Reply</Text>
            {item.repliedAt && (
              <Text style={styles.replyTime}>
                {new Date(item.repliedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
          <Text style={styles.replyText}>{item.instructorReply}</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchFeedbacks} />;
  }

  const averageRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : '0.0';

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <View style={styles.ratingDisplay}>
          <Text style={styles.averageRating}>{averageRating}</Text>
          {renderStars(Math.round(parseFloat(averageRating)))}
          <Text style={styles.ratingCount}>
            Based on {feedbacks.length} review{feedbacks.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <FlatList
        data={feedbacks}
        renderItem={renderFeedbackCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchFeedbacks(true)}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState 
            message={isInstructor ? "No feedback yet" : "No feedback yet. Be the first to review!"} 
            icon="star-outline"
          />
        }
      />

      {!isInstructor && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      )}

      {/* Submit Feedback Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode ? 'Edit Your Review' : 'Rate this Course'}
              </Text>
              <TouchableOpacity onPress={() => {
                setModalVisible(false);
                setEditMode(false);
                setEditingFeedback(null);
                setRating(0);
                setComment('');
              }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Your Rating</Text>
              {renderStars(rating, setRating)}

              <Text style={styles.label}>Your Review</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Share your experience with this course..."
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.charCount}>{comment.length}/500</Text>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitFeedback}
                disabled={submitting}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? 'Submitting...' : (editMode ? 'Update Feedback' : 'Submit Feedback')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reply Modal */}
      <Modal
        visible={replyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReplyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedFeedback?.instructorReply ? 'Edit Reply' : 'Reply to Feedback'}
              </Text>
              <TouchableOpacity onPress={() => setReplyModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Your Reply</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Write your reply to this feedback..."
                value={replyText}
                onChangeText={setReplyText}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.charCount}>{replyText.length}/500</Text>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitReply}
                disabled={submitting}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? 'Submitting...' : 'Submit Reply'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  summaryCard: {
    backgroundColor: colors.white,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ratingDisplay: {
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  star: {
    marginHorizontal: 2,
  },
  ratingCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    padding: 6,
    marginLeft: 8,
  },
  comment: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  replyContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#6C63FF10',
    padding: 12,
    borderRadius: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C63FF',
    marginLeft: 6,
    flex: 1,
  },
  replyTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  replyText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 16,
  },
  textArea: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
});

export default FeedbackScreen;
