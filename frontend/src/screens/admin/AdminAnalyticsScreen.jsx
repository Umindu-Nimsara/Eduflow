import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';

const { width } = Dimensions.get('window');
const PRIMARY = '#6C63FF';

// ── Metric Card ──────────────────────────────────────────────────────────────
const MetricCard = ({ icon, color, value, label, change, onPress }) => (
  <TouchableOpacity style={styles.metricCard} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.metricTop}>
      <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      {change !== undefined && (
        <View style={[styles.changeBadge, { backgroundColor: change >= 0 ? '#43C67820' : '#FF658420' }]}>
          <Ionicons 
            name={change >= 0 ? 'trending-up' : 'trending-down'} 
            size={12} 
            color={change >= 0 ? '#43C678' : '#FF6584'} 
          />
          <Text style={[styles.changeText, { color: change >= 0 ? '#43C678' : '#FF6584' }]}>
            {Math.abs(change)}%
          </Text>
        </View>
      )}
    </View>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </TouchableOpacity>
);

// ── Simple Bar Chart ─────────────────────────────────────────────────────────
const SimpleBarChart = ({ data, title, color = PRIMARY }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.emptyChart}>
          <Ionicons name="bar-chart-outline" size={40} color="#ccc" />
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chart}>
        {data.map((item, index) => (
          <View key={index} style={styles.barWrapper}>
            <View style={styles.barContainer}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: color 
                  }
                ]} 
              />
            </View>
            <Text style={styles.barLabel}>{item.label}</Text>
            <Text style={styles.barValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ── Top Item Card ────────────────────────────────────────────────────────────
const TopItemCard = ({ rank, title, value, subtitle, icon, color }) => (
  <View style={styles.topItem}>
    <View style={[styles.rankBadge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.rankText, { color }]}>#{rank}</Text>
    </View>
    <View style={styles.topItemContent}>
      <Text style={styles.topItemTitle} numberOfLines={1}>{title}</Text>
      <Text style={styles.topItemSubtitle}>{subtitle}</Text>
    </View>
    <View style={styles.topItemRight}>
      <Text style={[styles.topItemValue, { color }]}>{value}</Text>
      <Ionicons name={icon} size={16} color={color} />
    </View>
  </View>
);

// ── Main Component ───────────────────────────────────────────────────────────
const AdminAnalyticsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Analytics data
  const [overview, setOverview] = useState(null);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [topCourses, setTopCourses] = useState([]);
  const [topInstructors, setTopInstructors] = useState([]);
  const [engagementMetrics, setEngagementMetrics] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Fetch all analytics data
      const [overviewRes, weeklyActivityRes, userGrowthRes] = await Promise.all([
        api.get(`${ENDPOINTS.ANALYTICS}/overview`),
        api.get(`${ENDPOINTS.ANALYTICS}/weekly-activity`),
        api.get(`${ENDPOINTS.ANALYTICS}/user-growth`)
      ]);

      const overviewData = overviewRes.data.data;
      setOverview(overviewData);

      // Set real weekly activity data
      setWeeklyActivity(weeklyActivityRes.data.data || []);

      // Set real user growth data
      setUserGrowth(userGrowthRes.data.data || []);

      // Get top courses
      const coursesRes = await api.get(`${ENDPOINTS.COURSES}?limit=100`);
      const courses = coursesRes.data.data || [];
      const topCoursesData = courses
        .sort((a, b) => (b.totalStudents || 0) - (a.totalStudents || 0))
        .slice(0, 5);
      setTopCourses(topCoursesData);

      // Get top instructors from instructor profiles
      const instructorsRes = await api.get(`${ENDPOINTS.INSTRUCTORS}`);
      const instructorsData = instructorsRes.data.data || [];
      const topInstructorsData = instructorsData
        .sort((a, b) => (b.totalStudents || 0) - (a.totalStudents || 0))
        .slice(0, 5);
      setTopInstructors(topInstructorsData);

      // Calculate engagement metrics
      const engagement = {
        avgCoursesPerStudent: overviewData.totalStudents > 0 
          ? (overviewData.totalEnrollments / overviewData.totalStudents).toFixed(1)
          : 0,
        avgStudentsPerCourse: overviewData.totalCourses > 0
          ? (overviewData.totalEnrollments / overviewData.totalCourses).toFixed(1)
          : 0,
        courseCompletionRate: overviewData.totalEnrollments > 0
          ? ((overviewData.completedEnrollments || 0) / overviewData.totalEnrollments * 100).toFixed(1)
          : 0,
        activeUserRate: overviewData.totalUsers > 0
          ? ((overviewData.weeklyActiveUsers || 0) / overviewData.totalUsers * 100).toFixed(1)
          : 0,
      };
      setEngagementMetrics(engagement);

      setError(null);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading analytics..." />;
  if (error) return <ErrorView message={error} onRetry={fetchAnalytics} />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={() => fetchAnalytics(true)} 
          colors={[PRIMARY]} 
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>System Analytics</Text>
          <Text style={styles.headerSub}>Comprehensive platform insights</Text>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <MetricCard 
            icon="people" 
            color={PRIMARY} 
            value={overview?.totalUsers || 0}
            label="Total Users"
            change={12}
          />
          <MetricCard 
            icon="trending-up" 
            color="#43C678" 
            value={overview?.weeklyActiveUsers || 0}
            label="Weekly Active"
            change={8}
          />
          <MetricCard 
            icon="school" 
            color="#FFB347" 
            value={overview?.totalEnrollments || 0}
            label="Enrollments"
            change={15}
          />
          <MetricCard 
            icon="cash" 
            color="#FF6584" 
            value={`Rs. ${(overview?.totalRevenue || 0).toLocaleString()}`}
            label="Revenue (LKR)"
            change={-3}
          />
        </View>
      </View>

      {/* Weekly Activity Chart */}
      <SimpleBarChart 
        data={weeklyActivity}
        title="Weekly Platform Activity"
        color={PRIMARY}
      />

      {/* User Growth Chart */}
      <SimpleBarChart 
        data={userGrowth}
        title="New User Registrations (Last 7 Days)"
        color="#43C678"
      />

      {/* Engagement Metrics */}
      {engagementMetrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Engagement Metrics</Text>
          <View style={styles.engagementGrid}>
            <View style={styles.engagementCard}>
              <Text style={styles.engagementValue}>{engagementMetrics.avgCoursesPerStudent}</Text>
              <Text style={styles.engagementLabel}>Avg Courses/Student</Text>
            </View>
            <View style={styles.engagementCard}>
              <Text style={styles.engagementValue}>{engagementMetrics.avgStudentsPerCourse}</Text>
              <Text style={styles.engagementLabel}>Avg Students/Course</Text>
            </View>
            <View style={styles.engagementCard}>
              <Text style={styles.engagementValue}>{engagementMetrics.courseCompletionRate}%</Text>
              <Text style={styles.engagementLabel}>Completion Rate</Text>
            </View>
            <View style={styles.engagementCard}>
              <Text style={styles.engagementValue}>{engagementMetrics.activeUserRate}%</Text>
              <Text style={styles.engagementLabel}>Active User Rate</Text>
            </View>
          </View>
        </View>
      )}

      {/* Top Courses */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Performing Courses</Text>
        {topCourses.length > 0 ? (
          topCourses.map((course, index) => (
            <TopItemCard
              key={course._id}
              rank={index + 1}
              title={course.title}
              subtitle={course.instructorId?.name || 'Unknown Instructor'}
              value={course.totalStudents || 0}
              icon="people"
              color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : PRIMARY}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No courses available</Text>
        )}
      </View>

      {/* Top Instructors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Instructors</Text>
        {topInstructors.length > 0 ? (
          topInstructors.map((instructor, index) => (
            <TopItemCard
              key={instructor._id}
              rank={index + 1}
              title={instructor.userId?.name || 'Unknown'}
              subtitle={`${instructor.totalCourses || 0} courses`}
              value={instructor.totalStudents || 0}
              icon="school"
              color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#43C678'}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No instructors available</Text>
        )}
      </View>

      {/* Platform Health */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Platform Health</Text>
        <View style={styles.healthCard}>
          <View style={styles.healthItem}>
            <Ionicons name="checkmark-circle" size={20} color="#43C678" />
            <Text style={styles.healthText}>
              {overview?.publishedCourses || 0} Published Courses
            </Text>
          </View>
          <View style={styles.healthItem}>
            <Ionicons name="time" size={20} color="#FFB347" />
            <Text style={styles.healthText}>
              {(overview?.totalCourses || 0) - (overview?.publishedCourses || 0)} Draft Courses
            </Text>
          </View>
          <View style={styles.healthItem}>
            <Ionicons name="people" size={20} color={PRIMARY} />
            <Text style={styles.healthText}>
              {overview?.totalInstructors || 0} Active Instructors
            </Text>
          </View>
          <View style={styles.healthItem}>
            <Ionicons name="school" size={20} color="#43C678" />
            <Text style={styles.healthText}>
              {overview?.totalStudents || 0} Active Students
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 32 }} />
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
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSub: {
    fontSize: 14,
    color: '#ffffff99',
    marginTop: 4,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    margin: '1%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  metricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#888',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barContainer: {
    width: '80%',
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
  },
  barValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a1a2e',
    marginTop: 2,
  },
  emptyChart: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  engagementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  engagementCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: '1%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  engagementValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PRIMARY,
    marginBottom: 4,
  },
  engagementLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  topItemContent: {
    flex: 1,
  },
  topItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  topItemSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  topItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  topItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  healthCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  healthText: {
    fontSize: 14,
    color: '#1a1a2e',
    marginLeft: 12,
  },
});

export default AdminAnalyticsScreen;
