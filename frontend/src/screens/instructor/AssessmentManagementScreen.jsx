import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';

const PRIMARY = '#6C63FF';

const AssessmentCard = ({ assessment, type, onPress, onDelete }) => {
  const isQuiz = type === 'quiz';
  const icon = isQuiz ? 'document-text' : 'document-attach';
  const color = isQuiz ? '#43C678' : '#FFB347';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.cardTitle} numberOfLines={2}>{assessment.title}</Text>
          <Text style={styles.cardCourse} numberOfLines={1}>
            {assessment.courseId?.title || 'Unknown Course'}
          </Text>
        </View>
        {isQuiz && assessment.isPublished !== undefined && (
          <View style={[styles.statusBadge, { backgroundColor: assessment.isPublished ? '#43C67820' : '#FFB34720' }]}>
            <Text style={[styles.statusText, { color: assessment.isPublished ? '#43C678' : '#FFB347' }]}>
              {assessment.isPublished ? 'Published' : 'Draft'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="trophy" size={14} color="#666" />
          <Text style={styles.metaText}>{assessment.totalMarks || 0} marks</Text>
        </View>
        {isQuiz && assessment.timeLimit && (
          <View style={styles.metaItem}>
            <Ionicons name="time" size={14} color="#666" />
            <Text style={styles.metaText}>{assessment.timeLimit} min</Text>
          </View>
        )}
        {!isQuiz && assessment.dueDate && (
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={14} color="#666" />
            <Text style={styles.metaText}>
              Due: {new Date(assessment.dueDate).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: PRIMARY }]}
          onPress={onPress}
        >
          <Ionicons name="eye-outline" size={16} color="#fff" />
          <Text style={styles.actionBtnText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FF6584' }]}
          onPress={() => onDelete(assessment._id, type)}
        >
          <Ionicons name="trash-outline" size={16} color="#fff" />
          <Text style={styles.actionBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const AssessmentManagementScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState({ totalQuizzes: 0, totalAssignments: 0, totalSubmissions: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('quizzes'); // quizzes, assignments
  const [loadingProgress, setLoadingProgress] = useState('');

  useEffect(() => {
    if (user) {
      console.log('User available, fetching assessments...');
      fetchAssessments();
    } else {
      console.log('Waiting for user...');
    }
  }, [user]);

  useEffect(() => {
    // Timeout to prevent infinite loading - increased to 30 seconds for many courses
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout - checking if data was loaded');
        // Only show error if no data was loaded at all
        if (quizzes.length === 0 && assignments.length === 0 && !error) {
          console.log('No data loaded after timeout, showing error');
          setLoading(false);
          setError('Loading took too long. Please try again.');
        } else if (quizzes.length > 0 || assignments.length > 0) {
          // Data was loaded, just stop loading spinner
          console.log('Data was loaded, stopping spinner');
          setLoading(false);
        }
      }
    }, 30000); // 30 second timeout for 112 courses

    return () => clearTimeout(timeout);
  }, [loading, quizzes.length, assignments.length, error]);

  const fetchAssessments = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const userId = user._id || user.id;
      console.log('Fetching assessments for instructor:', userId);

      if (!userId) {
        setError('User ID not found. Please log in again.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch instructor's courses first (add timestamp to prevent caching)
      const timestamp = Date.now();
      setLoadingProgress('Loading courses...');
      const coursesRes = await api.get(`${ENDPOINTS.INSTRUCTORS}/${userId}/courses?t=${timestamp}`);
      const allCourses = coursesRes.data.data || [];
      
      // Load all courses (optimized to ~22 courses)
      const courses = allCourses;
      
      console.log(`Instructor has ${allCourses.length} courses, loading all assessments`);

      if (courses.length === 0) {
        setQuizzes([]);
        setAssignments([]);
        setStats({ totalQuizzes: 0, totalAssignments: 0, totalSubmissions: 0 });
        setError(null);
        setLoading(false);
        setRefreshing(false);
        setLoadingProgress('');
        return;
      }

      // Fetch quizzes and assignments for all courses
      const allQuizzes = [];
      const allAssignments = [];

      setLoadingProgress(`Loading assessments from ${courses.length} courses...`);

      for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        setLoadingProgress(`Checking course ${i + 1}/${courses.length}: ${course.title}`);
        
        try {
          // Fetch quizzes (add timestamp to prevent caching)
          const quizzesRes = await api.get(`${ENDPOINTS.QUIZZES}?courseId=${course._id}&t=${timestamp}`);
          const courseQuizzes = quizzesRes.data.data || [];
          console.log(`Course ${course.title}: ${courseQuizzes.length} quizzes`);
          courseQuizzes.forEach(quiz => {
            allQuizzes.push({ ...quiz, courseId: course });
          });

          // Fetch assignments (add timestamp to prevent caching)
          const assignmentsRes = await api.get(`${ENDPOINTS.ASSIGNMENTS}?courseId=${course._id}&t=${timestamp}`);
          const courseAssignments = assignmentsRes.data.data || [];
          console.log(`Course ${course.title}: ${courseAssignments.length} assignments`);
          courseAssignments.forEach(assignment => {
            allAssignments.push({ ...assignment, courseId: course });
          });
        } catch (err) {
          console.log('Error fetching assessments for course:', course._id, err.message);
        }
      }

      console.log('Total quizzes:', allQuizzes.length);
      console.log('Total assignments:', allAssignments.length);

      setQuizzes(allQuizzes);
      setAssignments(allAssignments);
      setStats({
        totalQuizzes: allQuizzes.length,
        totalAssignments: allAssignments.length,
        totalSubmissions: 0, // Can be calculated from submissions API
      });
      setError(null);
      setLoadingProgress('');
    } catch (err) {
      console.error('Error in fetchAssessments:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load assessments');
      setLoadingProgress('');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingProgress('');
    }
  };

  const handleDelete = (id, type) => {
    Alert.alert(
      `Delete ${type === 'quiz' ? 'Quiz' : 'Assignment'}`,
      'Are you sure you want to delete this? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const endpoint = type === 'quiz' ? ENDPOINTS.QUIZZES : ENDPOINTS.ASSIGNMENTS;
              await api.delete(`${endpoint}/${id}`);
              Alert.alert('Success', `${type === 'quiz' ? 'Quiz' : 'Assignment'} deleted successfully`);
              fetchAssessments();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
            }
          }
        }
      ]
    );
  };

  const handleViewQuiz = (quiz) => {
    // Navigate to quiz detail or edit screen
    navigation.navigate('ManageQuizzes', { courseId: quiz.courseId._id });
  };

  const handleViewAssignment = (assignment) => {
    // Navigate to assignment detail screen
    navigation.navigate('AssignmentDetail', { assignmentId: assignment._id });
  };

  if (!user) return <LoadingSpinner text="Loading user..." />;
  if (loading) return <LoadingSpinner text={loadingProgress || "Loading assessments..."} />;
  if (error) return <ErrorView message={error} onRetry={fetchAssessments} />;

  const displayItems = activeTab === 'quizzes' ? quizzes : assignments;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Assessment Management</Text>
          <Text style={styles.headerSub}>Manage quizzes & assignments</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="document-text" size={24} color="#43C678" />
          <Text style={[styles.statValue, { color: '#43C678' }]}>{stats.totalQuizzes}</Text>
          <Text style={styles.statLabel}>Quizzes</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="document-attach" size={24} color="#FFB347" />
          <Text style={[styles.statValue, { color: '#FFB347' }]}>{stats.totalAssignments}</Text>
          <Text style={styles.statLabel}>Assignments</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-done" size={24} color={PRIMARY} />
          <Text style={[styles.statValue, { color: PRIMARY }]}>{stats.totalSubmissions}</Text>
          <Text style={styles.statLabel}>Submissions</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'quizzes' && styles.tabActive]}
          onPress={() => setActiveTab('quizzes')}
        >
          <Ionicons name="document-text" size={20} color={activeTab === 'quizzes' ? '#fff' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'quizzes' && styles.tabTextActive]}>
            Quizzes ({stats.totalQuizzes})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'assignments' && styles.tabActive]}
          onPress={() => setActiveTab('assignments')}
        >
          <Ionicons name="document-attach" size={20} color={activeTab === 'assignments' ? '#fff' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'assignments' && styles.tabTextActive]}>
            Assignments ({stats.totalAssignments})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: activeTab === 'quizzes' ? '#43C678' : '#FFB347' }]}
          onPress={() => navigation.navigate(activeTab === 'quizzes' ? 'AddQuiz' : 'AddAssignment')}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.createBtnText}>
            Create {activeTab === 'quizzes' ? 'Quiz' : 'Assignment'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchAssessments(true)} colors={[PRIMARY]} />
        }
      >
        {displayItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name={activeTab === 'quizzes' ? 'document-text-outline' : 'document-attach-outline'}
              size={64}
              color="#ccc"
            />
            <Text style={styles.emptyText}>
              No {activeTab === 'quizzes' ? 'quizzes' : 'assignments'} found
            </Text>
            <Text style={styles.emptySubText}>
              Create your first {activeTab === 'quizzes' ? 'quiz' : 'assignment'} to get started
            </Text>
          </View>
        ) : (
          displayItems.map((item) => (
            <AssessmentCard
              key={item._id}
              assessment={item}
              type={activeTab === 'quizzes' ? 'quiz' : 'assignment'}
              onPress={() => activeTab === 'quizzes' ? handleViewQuiz(item) : handleViewAssignment(item)}
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
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16,
    alignItems: 'center', elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  statValue: { fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, gap: 8,
    elevation: 2,
  },
  tabActive: { backgroundColor: PRIMARY },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#fff' },
  
  actionButtonsContainer: { paddingHorizontal: 16, marginBottom: 12 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 12, gap: 8, elevation: 3,
  },
  createBtnText: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  
  list: { flex: 1, paddingHorizontal: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  typeIcon: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 },
  cardCourse: { fontSize: 13, color: '#666' },
  statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#666', fontWeight: '500' },
  
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 8, gap: 6,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#999', marginTop: 12 },
  emptySubText: { fontSize: 14, color: '#bbb', marginTop: 4, textAlign: 'center' },
});

export default AssessmentManagementScreen;
