import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

const PRIMARY = '#6C63FF';

const InactiveStudentsScreen = ({ navigation }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState(7); // Days inactive

  useEffect(() => {
    fetchInactiveStudents();
  }, [filter]);

  const fetchInactiveStudents = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Get all enrollments
      const res = await api.get(ENDPOINTS.ENROLLMENTS);
      const allEnrollments = res.data.data || [];

      // Filter inactive students (no activity in X days)
      const now = new Date();
      const inactive = allEnrollments.filter(enrollment => {
        if (!enrollment.lastActivityDate) return true; // Never active
        const lastActivity = new Date(enrollment.lastActivityDate);
        const daysSince = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
        return daysSince >= filter;
      });

      setStudents(inactive);
    } catch (err) {
      console.error('Fetch inactive students error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getDaysInactive = (lastActivityDate) => {
    if (!lastActivityDate) return 'Never active';
    const now = new Date();
    const lastActivity = new Date(lastActivityDate);
    const days = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
    return `${days} days ago`;
  };

  const renderStudent = ({ item }) => {
    const student = item.userId || {};
    const course = item.courseId || {};
    const initial = (student.name || 'S').charAt(0).toUpperCase();
    const daysInactive = getDaysInactive(item.lastActivityDate);

    return (
      <View style={styles.card}>
        <View style={[styles.avatar, { backgroundColor: '#EF444420' }]}>
          <Text style={[styles.avatarText, { color: '#EF4444' }]}>{initial}</Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{student.name || 'Unknown'}</Text>
          <Text style={styles.courseName}>{course.title || 'Course'}</Text>
          <View style={styles.inactiveRow}>
            <Ionicons name="time-outline" size={14} color="#EF4444" />
            <Text style={styles.inactiveText}>{daysInactive}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.messageBtn}
          onPress={() => {
            // TODO: Navigate to message screen
            alert('Message feature coming soon!');
          }}
        >
          <Ionicons name="mail-outline" size={20} color={PRIMARY} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Loading inactive students...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Inactive for:</Text>
        {[7, 14, 30].map(days => (
          <TouchableOpacity
            key={days}
            style={[styles.filterPill, filter === days && styles.filterPillActive]}
            onPress={() => setFilter(days)}
          >
            <Text style={[styles.filterText, filter === days && styles.filterTextActive]}>
              {days}+ days
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsCard}>
        <Ionicons name="alert-circle" size={32} color="#EF4444" />
        <View style={styles.statsInfo}>
          <Text style={styles.statsValue}>{students.length}</Text>
          <Text style={styles.statsLabel}>Inactive Students</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={students}
        keyExtractor={(item) => item._id}
        renderItem={renderStudent}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchInactiveStudents(true)}
            colors={[PRIMARY]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#43C678" />
            <Text style={styles.emptyTitle}>All students are active! 🎉</Text>
            <Text style={styles.emptySub}>
              No students have been inactive for {filter}+ days
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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginRight: 12 },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  filterPillActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  filterText: { fontSize: 12, color: '#888' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  statsInfo: { marginLeft: 16 },
  statsValue: { fontSize: 28, fontWeight: 'bold', color: '#EF4444' },
  statsLabel: { fontSize: 13, color: '#888', marginTop: 2 },
  list: { padding: 16, paddingTop: 0 },
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
  courseName: { fontSize: 12, color: '#888', marginBottom: 4 },
  inactiveRow: { flexDirection: 'row', alignItems: 'center' },
  inactiveText: { fontSize: 12, color: '#EF4444', marginLeft: 4, fontWeight: '600' },
  messageBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: { fontSize: 14, color: '#888', textAlign: 'center' },
});

export default InactiveStudentsScreen;
