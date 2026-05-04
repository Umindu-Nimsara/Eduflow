import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { assessmentService } from '../../services/assessmentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import colors from '../../constants/colors';

const AssignmentDetailScreen = ({ navigation, route }) => {
  const { assignmentId } = route.params;
  const { user } = useContext(AuthContext);
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssignmentDetails();
  }, [assignmentId]);

  const fetchAssignmentDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch assignment details
      const assignmentRes = await assessmentService.getAssignmentById(assignmentId);
      setAssignment(assignmentRes.data);

      // Fetch user's submission for this assignment
      try {
        const submissionsRes = await assessmentService.getMySubmissions(user.id);
        const userSubmission = submissionsRes.data.find(
          sub => sub.assignmentId?._id === assignmentId || sub.assignmentId === assignmentId
        );
        if (userSubmission) {
          setSubmission(userSubmission);
        }
      } catch (subErr) {
        console.log('No submission found:', subErr.message);
      }

      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    navigation.navigate('SubmitAssignment', { 
      assignmentId: assignment._id,
      assignmentTitle: assignment.title 
    });
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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchAssignmentDetails} />;
  }

  const statusColor = getStatusColor(assignment.dueDate);
  const statusText = getStatusText(assignment.dueDate);
  const isOverdue = new Date(assignment.dueDate) < new Date();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{assignment.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Ionicons name="time-outline" size={16} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Due Date</Text>
              <Text style={styles.infoValue}>
                {new Date(assignment.dueDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="trophy-outline" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Max Score</Text>
              <Text style={styles.infoValue}>{assignment.maxScore} points</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{assignment.description}</Text>
      </View>

      {assignment.instructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instructions}>{assignment.instructions}</Text>
        </View>
      )}

      {submission ? (
        <View style={styles.submissionCard}>
          <View style={styles.submissionHeader}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.submissionTitle}>Your Submission</Text>
          </View>

          <View style={styles.submissionInfo}>
            <View style={styles.submissionRow}>
              <Text style={styles.submissionLabel}>Submitted:</Text>
              <Text style={styles.submissionValue}>
                {new Date(submission.submittedAt).toLocaleString()}
              </Text>
            </View>

            <View style={styles.submissionRow}>
              <Text style={styles.submissionLabel}>Status:</Text>
              <View style={[
                styles.submissionStatusBadge,
                { backgroundColor: submission.isGraded ? colors.success + '20' : colors.warning + '20' }
              ]}>
                <Text style={[
                  styles.submissionStatusText,
                  { color: submission.isGraded ? colors.success : colors.warning }
                ]}>
                  {submission.isGraded ? 'Graded' : 'Pending Review'}
                </Text>
              </View>
            </View>

            {submission.isGraded && submission.grade !== undefined && (
              <View style={styles.submissionRow}>
                <Text style={styles.submissionLabel}>Score:</Text>
                <Text style={styles.scoreValue}>
                  {submission.grade} / {assignment.totalMarks || assignment.maxScore}
                </Text>
              </View>
            )}

            {submission.feedback && (
              <View style={styles.feedbackContainer}>
                <Text style={styles.feedbackLabel}>Instructor Feedback:</Text>
                <Text style={styles.feedbackText}>{submission.feedback}</Text>
              </View>
            )}

            {submission.submissionUrl && (
              <View style={styles.submissionRow}>
                <Text style={styles.submissionLabel}>Submitted Link:</Text>
                <TouchableOpacity 
                  onPress={() => {
                    // Open link in browser
                    const url = submission.submissionUrl;
                    if (url) {
                      Alert.alert(
                        'Open Link',
                        url,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Open', 
                            onPress: () => {
                              // You can use Linking.openURL(url) here
                              console.log('Opening:', url);
                            }
                          },
                        ]
                      );
                    }
                  }}
                >
                  <Text style={styles.linkText} numberOfLines={1}>
                    {submission.submissionUrl}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {!submission.isGraded && !isOverdue && (
            <TouchableOpacity
              style={styles.resubmitButton}
              onPress={handleSubmit}
            >
              <Ionicons name="refresh" size={20} color={colors.primary} />
              <Text style={styles.resubmitButtonText}>Resubmit Assignment</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.actionContainer}>
          {isOverdue ? (
            <View style={styles.overdueNotice}>
              <Ionicons name="alert-circle" size={24} color={colors.danger} />
              <Text style={styles.overdueText}>
                This assignment is overdue. Late submissions may not be accepted.
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitButton, isOverdue && styles.submitButtonDisabled]}
            onPress={handleSubmit}
          >
            <Ionicons name="cloud-upload-outline" size={20} color={colors.white} />
            <Text style={styles.submitButtonText}>Submit Assignment</Text>
          </TouchableOpacity>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  infoCard: {
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    marginLeft: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  instructions: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  submissionCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  submissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  submissionInfo: {
    gap: 12,
  },
  submissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submissionLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  submissionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  submissionStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  submissionStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  feedbackContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  resubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
  },
  resubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  actionContainer: {
    padding: 16,
  },
  overdueNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger + '20',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  overdueText: {
    flex: 1,
    fontSize: 14,
    color: colors.danger,
    marginLeft: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginLeft: 8,
  },
  linkText: {
    fontSize: 13,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});

export default AssignmentDetailScreen;
