import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';

const PRIMARY = '#6C63FF';

const InstructorSubmissionsScreen = ({ route, navigation }) => {
  const courseId = route.params?.courseId || null;
  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState(null);
  const [gradeModal,  setGradeModal]  = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [grade,       setGrade]       = useState('');
  const [feedback,    setFeedback]    = useState('');

  useEffect(() => { 
    console.log('InstructorSubmissionsScreen mounted, courseId:', courseId);
    fetchSubmissions(); 
  }, []);

  useEffect(() => {
    // Timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Submissions loading timeout - setting loading to false');
        setLoading(false);
        if (!error && submissions.length === 0) {
          console.log('No submissions found after timeout');
        }
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  const fetchSubmissions = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      console.log('Fetching submissions for courseId:', courseId);

      // Get all assignments for this course, then get submissions
      const query = courseId ? `?courseId=${courseId}` : '';
      console.log('Fetching assignments with query:', query);
      const assignmentsRes = await api.get(`${ENDPOINTS.ASSIGNMENTS}${query}`);
      const assignments = assignmentsRes.data.data || [];
      console.log('Found assignments:', assignments.length);

      if (assignments.length === 0) {
        console.log('No assignments found');
        setSubmissions([]);
        setError(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Get submissions for each assignment
      const allSubmissions = [];
      for (const assignment of assignments) {
        try {
          console.log('Fetching submissions for assignment:', assignment._id);
          const subRes = await api.get(`${ENDPOINTS.SUBMISSIONS}/assignment/${assignment._id}`);
          const subs = (subRes.data.data || []).map(s => ({ 
            ...s, 
            assignmentTitle: assignment.title,
            assignmentId: assignment._id 
          }));
          console.log(`Found ${subs.length} submissions for assignment ${assignment.title}`);
          allSubmissions.push(...subs);
        } catch (e) { 
          console.log('Failed to fetch submissions for assignment:', assignment._id, e.message);
        }
      }

      console.log('Total submissions:', allSubmissions.length);
      setSubmissions(allSubmissions);
      setError(null);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError(err.response?.data?.message || 'Failed to load submissions');
      setSubmissions([]);
    } finally {
      console.log('Fetch complete, setting loading to false');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openGradeModal = (submission) => {
    setSelected(submission);
    setGrade(submission.grade?.toString() || '');
    setFeedback(submission.feedback || '');
    setGradeModal(true);
  };

  const submitGrade = async () => {
    if (!grade || isNaN(Number(grade))) {
      Alert.alert('Error', 'Please enter a valid grade');
      return;
    }
    try {
      await api.put(`${ENDPOINTS.SUBMISSIONS}/${selected._id}/grade`, {
        grade: Number(grade),
        feedback,
      });
      setSubmissions(prev => prev.map(s =>
        s._id === selected._id ? { ...s, grade: Number(grade), feedback, isGraded: true } : s
      ));
      setGradeModal(false);
      Alert.alert('Success', 'Grade submitted successfully');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit grade');
    }
  };

  const renderSubmission = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.studentAvatar}>
          <Text style={styles.studentInitial}>
            {(item.userId?.name || 'S').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.studentName}>{item.userId?.name || 'Student'}</Text>
          <Text style={styles.assignmentTitle} numberOfLines={1}>{item.assignmentTitle}</Text>
          <Text style={styles.submittedAt}>
            {new Date(item.submittedAt || item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.gradeBadge, { backgroundColor: item.isGraded ? '#43C67820' : '#FFB34720' }]}>
          <Text style={[styles.gradeText, { color: item.isGraded ? '#43C678' : '#FFB347' }]}>
            {item.isGraded ? `${item.grade}pts` : 'Pending'}
          </Text>
        </View>
      </View>

      {item.submissionText && (
        <Text style={styles.submissionText} numberOfLines={3}>{item.submissionText}</Text>
      )}

      {item.submissionUrl && (
        <View style={styles.linkContainer}>
          <Ionicons name="link-outline" size={16} color={PRIMARY} />
          <Text style={styles.linkLabel}>Link: </Text>
          <Text style={styles.linkText} numberOfLines={1}>{item.submissionUrl}</Text>
        </View>
      )}

      <View style={styles.cardActions}>
        {item.submissionUrl && (
          <TouchableOpacity 
            style={styles.viewBtn}
            onPress={() => {
              Alert.alert(
                'Submission Link',
                item.submissionUrl,
                [
                  { text: 'Close', style: 'cancel' },
                  { 
                    text: 'Copy', 
                    onPress: () => {
                      // Copy to clipboard
                      Alert.alert('Copied', 'Link copied to clipboard');
                    }
                  },
                ]
              );
            }}
          >
            <Ionicons name="link-outline" size={15} color={PRIMARY} />
            <Text style={styles.viewBtnText}>View Link</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.gradeBtn, item.isGraded && styles.gradeBtnDone]}
          onPress={() => openGradeModal(item)}
        >
          <Ionicons name={item.isGraded ? 'create-outline' : 'checkmark-circle-outline'} size={15} color="#fff" />
          <Text style={styles.gradeBtnText}>{item.isGraded ? 'Update Grade' : 'Grade'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <LoadingSpinner text="Loading submissions..." />;
  if (error)   return <ErrorView message={error} onRetry={fetchSubmissions} />;

  const pending  = submissions.filter(s => !s.isGraded).length;
  const graded   = submissions.filter(s => s.isGraded).length;

  return (
    <View style={styles.container}>
      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{submissions.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#FFB347' }]}>{pending}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#43C678' }]}>{graded}</Text>
          <Text style={styles.summaryLabel}>Graded</Text>
        </View>
      </View>

      <FlatList
        data={submissions}
        keyExtractor={item => item._id}
        renderItem={renderSubmission}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchSubmissions(true)} colors={[PRIMARY]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ddd" />
            <Text style={styles.emptyTitle}>No Submissions Yet</Text>
            <Text style={styles.emptyText}>
              {courseId 
                ? "No assignments found for this course. Create assignments first to receive submissions."
                : "Students haven't submitted any assignments yet. Check back later."}
            </Text>
            {courseId && (
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => navigation.navigate('ManageAssignments', { courseId })}
              >
                <Text style={styles.emptyButtonText}>Create Assignment</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Grade Modal */}
      <Modal visible={gradeModal} transparent animationType="slide" onRequestClose={() => setGradeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Grade Submission</Text>
            <Text style={styles.modalStudent}>{selected?.userId?.name}</Text>
            <Text style={styles.modalAssignment}>{selected?.assignmentTitle}</Text>

            <Text style={styles.inputLabel}>Grade (points)</Text>
            <TextInput
              style={styles.input}
              value={grade}
              onChangeText={setGrade}
              keyboardType="numeric"
              placeholder="Enter grade..."
              placeholderTextColor="#aaa"
            />

            <Text style={styles.inputLabel}>Feedback (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={4}
              placeholder="Write feedback for the student..."
              placeholderTextColor="#aaa"
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setGradeModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={submitGrade}>
                <Text style={styles.submitBtnText}>Submit Grade</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  summary: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  summaryItem:   { flex: 1, alignItems: 'center' },
  summaryValue:  { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e' },
  summaryLabel:  { fontSize: 11, color: '#888', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: '#eee', marginVertical: 4 },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  studentAvatar:  { width: 40, height: 40, borderRadius: 20, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  studentInitial: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  cardInfo:       { flex: 1 },
  studentName:    { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  assignmentTitle: { fontSize: 12, color: '#888', marginTop: 2 },
  submittedAt:    { fontSize: 11, color: '#aaa', marginTop: 2 },
  gradeBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  gradeText:      { fontSize: 12, fontWeight: '700' },
  submissionText: { fontSize: 13, color: '#555', lineHeight: 18, marginBottom: 10, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8 },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY + '10',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  linkLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginLeft: 4,
  },
  linkText: {
    flex: 1,
    fontSize: 12,
    color: PRIMARY,
    fontStyle: 'italic',
  },
  cardActions:    { flexDirection: 'row', justifyContent: 'flex-end' },
  viewBtn:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: PRIMARY, marginRight: 8 },
  viewBtnText:    { fontSize: 12, fontWeight: '600', color: PRIMARY, marginLeft: 4 },
  gradeBtn:       { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  gradeBtnDone:   { backgroundColor: '#43C678' },
  gradeBtnText:   { fontSize: 12, fontWeight: '600', color: '#fff', marginLeft: 4 },
  // Modal
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet:    { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  modalHandle:   { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle:    { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 },
  modalStudent:  { fontSize: 14, fontWeight: '600', color: PRIMARY, marginBottom: 2 },
  modalAssignment: { fontSize: 13, color: '#888', marginBottom: 16 },
  inputLabel:    { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input:         { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, color: '#1a1a2e', marginBottom: 14 },
  textArea:      { height: 100 },
  modalActions:  { flexDirection: 'row', justifyContent: 'space-between' },
  cancelBtn:     { flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', marginRight: 8 },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#888' },
  submitBtn:     { flex: 1, paddingVertical: 13, borderRadius: 10, backgroundColor: PRIMARY, alignItems: 'center' },
  submitBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default InstructorSubmissionsScreen;
