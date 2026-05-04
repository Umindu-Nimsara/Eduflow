import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import { exportToCSV, formatStudentDataForExport } from '../../utils/exportHelper';

const PRIMARY = '#6C63FF';

const CourseStudentsScreen = ({ route, navigation }) => {
  const { courseId, courseTitle } = route.params || {};
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = students.filter(s =>
        s.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchQuery, students]);

  const fetchStudents = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await api.get(`${ENDPOINTS.ENROLLMENTS}?courseId=${courseId}`);
      const enrollments = res.data.data || [];
      setStudents(enrollments);
      setFilteredStudents(enrollments);
    } catch (err) {
      console.error('Fetch students error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#43C678';
    if (progress >= 50) return '#FFB347';
    return '#EF4444';
  };

  const renderStudent = ({ item }) => {
    const student = item.userId || {};
    const progress = item.progress || 0;
    const initial = (student.name || 'S').charAt(0).toUpperCase();
    const progressColor = getProgressColor(progress);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('StudentProgressDetail', {
          studentId: student._id,
          studentName: student.name,
          courseId,
        })}
      >
        <View style={[styles.avatar, { backgroundColor: PRIMARY + '20' }]}>
          <Text style={[styles.avatarText, { color: PRIMARY }]}>{initial}</Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{student.name || 'Unknown'}</Text>
          <Text style={styles.studentEmail}>{student.email || ''}</Text>
          <View style={styles.progressBar}>
            <View style={styles.progressBg}>
              <View
                style={[styles.progressFill, { width: `${progress}%`, backgroundColor: progressColor }]}
              />
            </View>
            <Text style={[styles.progressText, { color: progressColor }]}>{progress}%</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{courseTitle || 'Course'}</Text>
          <Text style={styles.headerSub}>{students.length} Enrolled Students</Text>
        </View>
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={async () => {
            const formatted = formatStudentDataForExport(students);
            await exportToCSV(formatted, `students_${courseId}_${Date.now()}.csv`);
          }}
        >
          <Ionicons name="download-outline" size={20} color={PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search students..."
          placeholderTextColor="#aaa"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{students.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#43C678' }]}>
            {students.filter(s => (s.progress || 0) >= 80).length}
          </Text>
          <Text style={styles.statLabel}>High Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>
            {students.filter(s => (s.progress || 0) < 30).length}
          </Text>
          <Text style={styles.statLabel}>Need Help</Text>
        </View>
      </View>

      {/* Student List */}
      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item._id}
        renderItem={renderStudent}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchStudents(true)} colors={[PRIMARY]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ddd" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No students found' : 'No students enrolled yet'}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery ? 'Try a different search term' : 'Students will appear here once they enroll'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#888' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  headerSub: { fontSize: 13, color: '#888', marginTop: 4 },
  exportBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#1a1a2e' },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: PRIMARY },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4 },
  list: { padding: 16, paddingTop: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: 'bold' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  studentEmail: { fontSize: 12, color: '#888', marginBottom: 8 },
  progressBar: { flexDirection: 'row', alignItems: 'center' },
  progressBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: '600', width: 35, textAlign: 'right' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#888', textAlign: 'center' },
});

export default CourseStudentsScreen;
