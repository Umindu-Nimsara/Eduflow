import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';

const PRIMARY = '#6C63FF';

const SectionBtn = ({ icon, label, color, count, onPress }) => (
  <TouchableOpacity style={styles.sectionBtn} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.sectionBtnIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <View style={styles.sectionBtnInfo}>
      <Text style={styles.sectionBtnLabel}>{label}</Text>
      {count !== undefined && <Text style={styles.sectionBtnCount}>{count} items</Text>}
    </View>
    <Ionicons name="chevron-forward" size={18} color="#ccc" />
  </TouchableOpacity>
);

const InstructorCourseDetailScreen = ({ route, navigation }) => {
  const { courseId } = route.params;
  const [course,     setCourse]     = useState(null);
  const [lessons,    setLessons]    = useState([]);
  const [quizzes,    setQuizzes]    = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);

  useEffect(() => { 
    fetchAll(); 
    
    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAll();
    });
    
    return unsubscribe;
  }, [courseId, navigation]);

  const fetchAll = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Add timestamp to bypass cache
      const timestamp = new Date().getTime();
      const [courseRes, lessonsRes, quizzesRes, assignmentsRes] = await Promise.all([
        api.get(`${ENDPOINTS.COURSES}/${courseId}?_t=${timestamp}`),
        api.get(`${ENDPOINTS.COURSES}/${courseId}/lessons?_t=${timestamp}`),
        api.get(`${ENDPOINTS.QUIZZES}?courseId=${courseId}&_t=${timestamp}`),
        api.get(`${ENDPOINTS.ASSIGNMENTS}?courseId=${courseId}&_t=${timestamp}`),
      ]);

      setCourse(courseRes.data.data);
      setLessons(lessonsRes.data.data || []);
      setQuizzes(quizzesRes.data.data || []);
      setAssignments(assignmentsRes.data.data || []);

      // Fetch certificates
      try {
        const certRes = await api.get(`${ENDPOINTS.CERTIFICATES}/course/${courseId}`);
        setCertificates(certRes.data.data || []);
      } catch (err) {
        setCertificates([]);
      }

      // Fetch submissions for all assignments
      const assignmentsList = assignmentsRes.data.data || [];
      const allSubmissions = [];
      for (const assignment of assignmentsList) {
        try {
          const subRes = await api.get(`${ENDPOINTS.SUBMISSIONS}/assignment/${assignment._id}`);
          const subs = subRes.data.data || [];
          allSubmissions.push(...subs);
        } catch (err) {
          console.log('Failed to fetch submissions for assignment:', assignment._id);
        }
      }
      setSubmissions(allSubmissions);

      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteLesson = (lessonId, title) => {
    Alert.alert('Delete Lesson', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`${ENDPOINTS.LESSONS}/${lessonId}`);
            setLessons(prev => prev.filter(l => l._id !== lessonId));
          } catch (err) {
            Alert.alert('Error', 'Failed to delete lesson');
          }
        },
      },
    ]);
  };

  const handleTogglePublish = async (newValue) => {
    try {
      const response = await api.put(`${ENDPOINTS.COURSES}/${courseId}/publish`, {
        isPublished: newValue
      });
      
      setCourse(prev => ({ ...prev, isPublished: newValue }));
      
      Alert.alert(
        'Success',
        newValue ? 'Course published! Students can now enroll.' : 'Course unpublished. Students cannot enroll.'
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update course status');
      // Revert the switch if API call fails
      setCourse(prev => ({ ...prev, isPublished: !newValue }));
    }
  };

  if (loading) return <LoadingSpinner text="Loading course..." />;
  if (error)   return <ErrorView message={error} onRetry={fetchAll} />;
  if (!course) return <ErrorView message="Course not found" />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} colors={[PRIMARY]} />}
    >
      {/* Course header */}
      <View style={styles.header}>
        <Text style={styles.courseTitle}>{course.title}</Text>
        
        {/* Publish Toggle */}
        <View style={styles.publishToggle}>
          <View style={styles.publishInfo}>
            <Text style={styles.publishLabel}>
              {course.isPublished ? 'Published' : 'Draft'}
            </Text>
            <Text style={styles.publishHint}>
              {course.isPublished 
                ? 'Students can enroll' 
                : 'Only visible to you'}
            </Text>
          </View>
          <Switch
            value={course.isPublished || false}
            onValueChange={handleTogglePublish}
            trackColor={{ false: '#767577', true: '#43C678' }}
            thumbColor={course.isPublished ? '#fff' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
          />
        </View>
        
        <View style={styles.headerMeta}>
          <View style={[styles.statusBadge, { backgroundColor: course.isPublished ? '#43C67820' : '#FFB34720' }]}>
            <Text style={[styles.statusText, { color: course.isPublished ? '#43C678' : '#FFB347' }]}>
              {course.isPublished ? '● Published' : '○ Draft'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditCourse', { courseId, course })}
          >
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Management sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Content Management</Text>

        <SectionBtn
          icon="play-circle-outline" color={PRIMARY}
          label="Lessons" count={lessons.length}
          onPress={() => navigation.navigate('ManageLessons', { courseId, lessons })}
        />
        <SectionBtn
          icon="document-text-outline" color="#43C678"
          label="Quizzes" count={quizzes.length}
          onPress={() => navigation.navigate('ManageQuizzes', { courseId, quizzes })}
        />
        <SectionBtn
          icon="document-attach-outline" color="#FFB347"
          label="Assignments" count={assignments.length}
          onPress={() => navigation.navigate('ManageAssignments', { courseId, assignments })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Student Management</Text>

        <SectionBtn
          icon="people-outline" color="#FF6584"
          label="Enrolled Students"
          onPress={() => navigation.navigate('CourseStudents', { courseId })}
        />
        
        {/* Certificates with count and notice */}
        <SectionBtn
          icon="ribbon-outline" color="#10B981"
          label="Certificates"
          count={certificates.length}
          onPress={() => navigation.navigate('CertificateManagement', { 
            courseId, 
            courseName: course.title 
          })}
        />
        {certificates.length === 0 && (
          <View style={styles.noticeBox}>
            <Ionicons name="information-circle-outline" size={16} color="#888" />
            <Text style={styles.noticeText}>No certificates issued yet</Text>
          </View>
        )}
        
        {/* Submissions with count and notice */}
        <SectionBtn
          icon="checkmark-done-outline" color="#9C88FF"
          label="Submissions to Review"
          count={submissions.filter(s => !s.isGraded).length}
          onPress={() => navigation.navigate('InstructorSubmissions', { courseId })}
        />
        {assignments.length === 0 ? (
          <View style={styles.noticeBox}>
            <Ionicons name="information-circle-outline" size={16} color="#888" />
            <Text style={styles.noticeText}>Create assignments to receive submissions</Text>
          </View>
        ) : submissions.length === 0 ? (
          <View style={styles.noticeBox}>
            <Ionicons name="information-circle-outline" size={16} color="#888" />
            <Text style={styles.noticeText}>No submissions yet</Text>
          </View>
        ) : null}
        
        <SectionBtn
          icon="chatbubbles-outline" color="#26D0CE"
          label="Discussions"
          onPress={() => navigation.navigate('DiscussionBoard', { courseId })}
        />
        <SectionBtn
          icon="videocam-outline" color="#8B5CF6"
          label="Live Classes"
          onPress={() => navigation.navigate('LiveClassScheduler', { 
            courseId, 
            courseName: course.title 
          })}
        />
        <SectionBtn
          icon="star-outline" color="#FFB347"
          label="Student Feedback"
          onPress={() => navigation.navigate('Feedback', { 
            courseId,
            instructorId: course?.instructorId 
          })}
        />
      </View>

      {/* Course Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Course Settings</Text>

        <SectionBtn
          icon="notifications-outline" color="#EF4444"
          label="Announcements"
          onPress={() => navigation.navigate('CreateAnnouncement')}
        />
        <SectionBtn
          icon="download-outline" color="#059669"
          label="Export Course Data"
          onPress={() => navigation.navigate('ExportCourseData', { 
            courseId,
            courseName: course.title 
          })}
        />
      </View>

      {/* Lessons list preview */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Lessons ({lessons.length})</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('CreateLesson', { courseId })}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Add Lesson</Text>
          </TouchableOpacity>
        </View>

        {lessons.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No lessons yet. Add your first lesson!</Text>
          </View>
        ) : (
          lessons.map((lesson, index) => (
            <View key={lesson._id} style={styles.lessonRow}>
              <View style={styles.lessonNum}>
                <Text style={styles.lessonNumText}>{index + 1}</Text>
              </View>
              <View style={styles.lessonInfo}>
                <Text style={styles.lessonTitle} numberOfLines={1}>{lesson.title}</Text>
                <Text style={styles.lessonMeta}>{lesson.duration || 0} min</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('EditLesson', { lessonId: lesson._id, lesson })}
                style={styles.lessonAction}
              >
                <Ionicons name="create-outline" size={18} color="#FFB347" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteLesson(lesson._id, lesson.title)}
                style={styles.lessonAction}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F5F5F5' },
  header:      { backgroundColor: PRIMARY, padding: 20 },
  courseTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  publishToggle: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  publishInfo: { flex: 1 },
  publishLabel: { fontSize: 15, fontWeight: '600', color: '#fff' },
  publishHint: { fontSize: 12, color: '#fff', opacity: 0.8, marginTop: 2 },
  headerMeta:  { flexDirection: 'row', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
  statusText:  { fontSize: 12, fontWeight: '700' },
  editBtn:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff30', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editBtnText: { fontSize: 13, fontWeight: '600', color: '#fff', marginLeft: 4 },
  section:     { marginHorizontal: 16, marginTop: 16 },
  sectionRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 10 },
  addBtn:      { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addBtnText:  { fontSize: 12, fontWeight: '600', color: '#fff', marginLeft: 4 },
  sectionBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 10, padding: 14, marginBottom: 8,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3,
  },
  sectionBtnIcon:  { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sectionBtnInfo:  { flex: 1 },
  sectionBtnLabel: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  sectionBtnCount: { fontSize: 12, color: '#888', marginTop: 2 },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    borderLeftWidth: 3,
    borderLeftColor: '#FFB347',
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    marginLeft: 4,
  },
  noticeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  lessonRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 10, padding: 12, marginBottom: 8,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3,
  },
  lessonNum:     { width: 30, height: 30, borderRadius: 15, backgroundColor: PRIMARY + '20', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  lessonNumText: { fontSize: 13, fontWeight: 'bold', color: PRIMARY },
  lessonInfo:    { flex: 1 },
  lessonTitle:   { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  lessonMeta:    { fontSize: 12, color: '#888', marginTop: 2 },
  lessonAction:  { padding: 6 },
  emptyBox:      { backgroundColor: '#fff', borderRadius: 10, padding: 20, alignItems: 'center' },
  emptyText:     { fontSize: 14, color: '#888' },
});

export default InstructorCourseDetailScreen;
