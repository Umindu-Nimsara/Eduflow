import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';

const PRIMARY = '#6C63FF';

const StatCard = ({ icon, color, value, label, onPress }) => (
  <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const AdminAction = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={16} color="#ccc" />
  </TouchableOpacity>
);

const AdminDashboardScreen = ({ navigation }) => {
  const [overview,   setOverview]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);

  useEffect(() => { fetchOverview(); }, []);

  const fetchOverview = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await api.get(`${ENDPOINTS.ANALYTICS}/overview`);
      setOverview(res.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load overview');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading admin dashboard..." />;
  if (error)   return <ErrorView message={error} onRetry={fetchOverview} />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchOverview(true)} colors={[PRIMARY]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSub}>Platform Overview</Text>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <StatCard icon="people"       color={PRIMARY}   value={overview?.totalUsers       || 0} label="Total Users"    onPress={() => navigation.navigate('Users')} />
        <StatCard icon="book"         color="#43C678"   value={overview?.totalCourses     || 0} label="Total Courses"  onPress={() => navigation.navigate('Courses')} />
        <StatCard icon="school"       color="#FFB347"   value={overview?.totalEnrollments || 0} label="Enrollments"    onPress={() => {}} />
        <StatCard icon="cash"         color="#FF6584"   value={`Rs. ${Math.round(overview?.totalRevenue || 0).toLocaleString()}`} label="Revenue (LKR)" onPress={() => {}} />
        <StatCard icon="person"       color="#9C88FF"   value={overview?.totalStudents    || 0} label="Students"       onPress={() => navigation.navigate('Users')} />
        <StatCard icon="briefcase"    color="#26D0CE"   value={overview?.totalInstructors || 0} label="Instructors"    onPress={() => navigation.navigate('AdminInstructors')} />
        <StatCard icon="checkmark-circle" color="#43C678" value={overview?.publishedCourses || 0} label="Published"   onPress={() => {}} />
        <StatCard icon="pulse"        color="#FF9F43"   value={overview?.weeklyActiveUsers || 0} label="Weekly Active" onPress={() => {}} />
      </View>

      {/* Admin Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Management</Text>
        <AdminAction icon="people-outline"      color={PRIMARY}   label="User Management"        onPress={() => navigation.navigate('Users')} />
        <AdminAction icon="briefcase-outline"   color="#43C678"   label="Instructor Management"  onPress={() => navigation.navigate('AdminInstructors')} />
        <AdminAction icon="book-outline"        color="#FFB347"   label="Course Management"      onPress={() => navigation.navigate('Courses')} />
        <AdminAction icon="chatbubbles-outline" color="#9C88FF"   label="Discussion Management"  onPress={() => navigation.navigate('AdminDiscussions')} />
        <AdminAction icon="star-outline"        color="#26D0CE"   label="Feedback Management"    onPress={() => navigation.navigate('AdminFeedback')} />
        <AdminAction icon="flag-outline"        color="#FF6584"   label="Content Reports"        onPress={() => navigation.navigate('AdminReports')} />
        <AdminAction icon="megaphone-outline"   color="#FF9F43"   label="Announcements"          onPress={() => navigation.navigate('AdminAnnouncements')} />
        <AdminAction icon="notifications-outline" color="#9C88FF" label="Notifications"          onPress={() => navigation.navigate('AdminNotifications')} />
        <AdminAction icon="document-text-outline" color="#6C63FF" label="Admin Logs"             onPress={() => navigation.navigate('AdminLogs')} />
        <AdminAction icon="analytics-outline"  color="#43C678"   label="System Analytics"       onPress={() => navigation.navigate('AdminAnalytics')} />
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F5F5F5' },
  header:       { backgroundColor: PRIMARY, padding: 20 },
  headerTitle:  { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub:    { fontSize: 13, color: '#ffffff99', marginTop: 2 },
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', padding: 12 },
  statCard: {
    width: '48%', backgroundColor: '#fff', borderRadius: 12,
    padding: 14, margin: '1%', alignItems: 'center',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8,
  },
  statIcon:  { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#888', textAlign: 'center' },
  section:   { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12 },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 14, marginBottom: 8,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  actionIcon:  { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1a1a2e' },
});

export default AdminDashboardScreen;
