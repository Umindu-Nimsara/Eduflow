import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VictoryBar, VictoryChart, VictoryAxis } from 'victory-native';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

const PRIMARY = '#6C63FF';

const StatCard = ({ icon, color, value, label }) => (
  <View style={styles.statCard}>
    <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={26} color={color} />
    </View>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const InstructorAnalyticsScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    publishedCourses: 0,
    draftCourses: 0,
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Fetch instructor's courses
      const coursesRes = await api.get(`${ENDPOINTS.INSTRUCTORS}/${user.id}/courses`);
      const coursesData = coursesRes.data.data || [];
      setCourses(coursesData);

      // Calculate basic stats from courses
      let totalStudents = 0;
      let publishedCount = 0;
      let draftCount = 0;

      for (const course of coursesData) {
        if (course.isPublished) {
          publishedCount++;
        } else {
          draftCount++;
        }

        // Try to get enrollments for each course
        try {
          const enrollRes = await api.get(`${ENDPOINTS.ENROLLMENTS}?courseId=${course._id}`);
          const enrollments = enrollRes.data.data || [];
          totalStudents += enrollments.length;
        } catch (err) {
          // If enrollment endpoint fails, use course's totalStudents if available
          totalStudents += course.totalStudents || 0;
        }
      }

      setStats({
        totalCourses: coursesData.length,
        totalStudents,
        publishedCourses: publishedCount,
        draftCourses: draftCount,
      });

      // Build weekly activity data (mock data for now - can be replaced with real API)
      const weeklyActivity = buildWeeklyActivity();
      setWeeklyData(weeklyActivity);

      // Build recent activity (enrollments, submissions, etc.)
      const activity = await buildRecentActivity(coursesData);
      setRecentActivity(activity);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      // Set empty data on error
      setCourses([]);
      setStats({
        totalCourses: 0,
        totalStudents: 0,
        publishedCourses: 0,
        draftCourses: 0,
      });
      setWeeklyData([]);
      setRecentActivity([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const buildWeeklyActivity = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const weekData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
      const dayName = days[dayIndex];

      // Mock data - in real app, fetch from API
      const activity = Math.floor(Math.random() * 20) + 5;
      weekData.push({ x: dayName, y: activity });
    }

    return weekData;
  };

  const buildRecentActivity = async (coursesData) => {
    const activities = [];
    
    // Get recent submissions
    try {
      const submissionsRes = await api.get(`${ENDPOINTS.SUBMISSIONS}`);
      const submissions = submissionsRes.data.data || [];
      
      submissions.slice(0, 5).forEach(sub => {
        activities.push({
          type: 'submission',
          title: 'New submission received',
          course: sub.assignmentId?.title || 'Assignment',
          time: sub.submittedAt,
          icon: 'document-text',
          color: '#FFB347',
        });
      });
    } catch (err) {
      console.log('Failed to fetch submissions');
    }

    // Sort by time and return top 10
    return activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) return <LoadingSpinner text="Loading analytics..." />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchData(true)}
          colors={[PRIMARY]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics Overview</Text>
        <Text style={styles.headerSubtitle}>Your teaching statistics</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="book"
          color={PRIMARY}
          value={stats.totalCourses}
          label="Total Courses"
        />
        <StatCard
          icon="people"
          color="#43C678"
          value={stats.totalStudents}
          label="Total Students"
        />
        <StatCard
          icon="checkmark-circle"
          color="#FFB347"
          value={stats.publishedCourses}
          label="Published"
        />
        <StatCard
          icon="document"
          color="#FF6584"
          value={stats.draftCourses}
          label="Drafts"
        />
      </View>

      {/* Courses List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Activity</Text>
        <Text style={styles.sectionSubtitle}>Student engagement over the past 7 days</Text>
        
        <View style={styles.chartContainer}>
          {weeklyData.length > 0 ? (
            <>
              <VictoryChart
                height={220}
                width={350}
                padding={{ top: 20, bottom: 45, left: 45, right: 30 }}
                domainPadding={{ x: 25 }}
              >
                <VictoryAxis
                  style={{
                    axis: { stroke: '#E5E7EB' },
                    tickLabels: { fontSize: 12, fill: '#6B7280', padding: 5 },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  tickFormat={(t) => (Number.isInteger(t) ? String(t) : '')}
                  tickCount={4}
                  style={{
                    axis: { stroke: '#E5E7EB' },
                    tickLabels: { fontSize: 12, fill: '#6B7280' },
                    grid: { stroke: '#E5E7EB', strokeDasharray: '3,3' },
                  }}
                />
                <VictoryBar
                  data={weeklyData}
                  style={{ data: { fill: PRIMARY } }}
                  barWidth={20}
                  cornerRadius={{ top: 4 }}
                />
              </VictoryChart>
              <Text style={styles.chartCaption}>
                Total student activities (enrollments, submissions, quiz attempts)
              </Text>
            </>
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="bar-chart-outline" size={48} color="#ddd" />
              <Text style={styles.emptyChartText}>No activity data yet</Text>
            </View>
          )}
        </View>
      </View>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Text style={styles.sectionSubtitle}>Latest updates from your courses</Text>
          
          <View style={styles.activityList}>
            {recentActivity.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
                  <Ionicons name={activity.icon} size={20} color={activity.color} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityCourse}>{activity.course}</Text>
                </View>
                <Text style={styles.activityTime}>{getTimeAgo(activity.time)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Insights</Text>
        <Text style={styles.sectionSubtitle}>Key metrics at a glance</Text>
        
        <View style={styles.insightCard}>
          <View style={styles.insightRow}>
            <Ionicons name="trending-up" size={24} color="#43C678" />
            <View style={styles.insightText}>
              <Text style={styles.insightValue}>{stats.publishedCourses}</Text>
              <Text style={styles.insightLabel}>Active Courses</Text>
            </View>
          </View>
          <Text style={styles.insightDescription}>
            You have {stats.publishedCourses} published courses reaching {stats.totalStudents} students
          </Text>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightRow}>
            <Ionicons name="people" size={24} color={PRIMARY} />
            <View style={styles.insightText}>
              <Text style={styles.insightValue}>
                {stats.totalStudents > 0 ? (stats.totalStudents / stats.publishedCourses).toFixed(1) : 0}
              </Text>
              <Text style={styles.insightLabel}>Avg Students per Course</Text>
            </View>
          </View>
          <Text style={styles.insightDescription}>
            {stats.totalStudents > 0 
              ? 'Great engagement! Keep creating quality content.'
              : 'Start promoting your courses to attract students.'}
          </Text>
        </View>

        {stats.draftCourses > 0 && (
          <View style={styles.insightCard}>
            <View style={styles.insightRow}>
              <Ionicons name="document-outline" size={24} color="#FFB347" />
              <View style={styles.insightText}>
                <Text style={styles.insightValue}>{stats.draftCourses}</Text>
                <Text style={styles.insightLabel}>Draft Courses</Text>
              </View>
            </View>
            <Text style={styles.insightDescription}>
              You have {stats.draftCourses} draft course{stats.draftCourses > 1 ? 's' : ''}. Publish them to reach more students!
            </Text>
          </View>
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: PRIMARY,
    padding: 20,
    paddingTop: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffff99',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    margin: '1%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY,
  },
  
  // Chart styles
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    alignItems: 'center',
  },
  chartCaption: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyChartText: {
    fontSize: 14,
    color: '#888',
    marginTop: 12,
  },
  
  // Activity styles
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  activityCourse: {
    fontSize: 12,
    color: '#888',
  },
  activityTime: {
    fontSize: 12,
    color: '#888',
  },
  
  // Insight styles
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightText: {
    marginLeft: 12,
  },
  insightValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  insightLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  insightDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default InstructorAnalyticsScreen;
