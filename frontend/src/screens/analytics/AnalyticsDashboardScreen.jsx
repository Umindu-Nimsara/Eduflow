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
import { VictoryPie, VictoryBar, VictoryChart, VictoryAxis, VictoryLegend } from 'victory-native';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import colors from '../../constants/colors';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

const AnalyticsDashboardScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [instructorStats, setInstructorStats] = useState(null);
  const [instructorCourses, setInstructorCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      if (!user) return;

      if (user.role === 'instructor') {
        // Fetch instructor-specific data
        const [statsRes, coursesRes] = await Promise.all([
          api.get(`${ENDPOINTS.INSTRUCTORS}/${user.id}/stats`).catch(() => ({ data: { data: {} } })),
          api.get(`${ENDPOINTS.INSTRUCTORS}/${user.id}/courses`).catch(() => ({ data: { data: [] } })),
        ]);

        setInstructorStats(statsRes.data.data || {});
        setInstructorCourses(coursesRes.data.data || []);
      } else {
        // Fetch student data from available endpoints
        const [enrollmentsRes, certificatesRes, streakRes, quizAttemptsRes, submissionsRes] = await Promise.all([
          api.get(`${ENDPOINTS.ENROLLMENTS}/${user.id}`).catch(() => ({ data: { data: [] } })),
          api.get(`${ENDPOINTS.CERTIFICATES}/my-certificates`).catch(() => ({ data: { data: [] } })),
          api.get(`${ENDPOINTS.STREAKS}/my-streak`).catch(() => ({ data: { data: { currentStreak: 0 } } })),
          api.get(`${ENDPOINTS.QUIZZES}/my-attempts`).catch(() => ({ data: { data: [] } })),
          api.get(`${ENDPOINTS.SUBMISSIONS}/my-submissions`).catch(() => ({ data: { data: [] } })),
        ]);

        const enrollmentsData = enrollmentsRes.data.data || [];
        const certificatesData = certificatesRes.data.data || [];
        const submissionsData = submissionsRes.data.data || [];
        const streakData = streakRes.data.data || { currentStreak: 0 };
        const quizAttemptsData = quizAttemptsRes.data.data || [];

        // Fetch progress for all enrolled courses
        const allProgress = [];
        for (const enrollment of enrollmentsData) {
          try {
            const courseId = enrollment.courseId?._id || enrollment.courseId;
            if (courseId) {
              const progressRes = await api.get(`${ENDPOINTS.PROGRESS}/course/${courseId}`);
              const courseProgress = progressRes.data.data || [];
              allProgress.push(...courseProgress);
            }
          } catch (err) {
            // Skip if progress fetch fails for a course
            console.log('Failed to fetch progress for course:', err);
          }
        }

        // Calculate analytics from available data
        const completedCourses = enrollmentsData.filter(e => e.completionPercentage === 100).length;
        
        // Build analytics object
        const calculatedAnalytics = {
          enrolledCourses: enrollmentsData.length,
          completedCourses: completedCourses,
          certificates: certificatesData.length,
          currentStreak: streakData.currentStreak || 0,
          recentActivity: []
        };

        // Build recent activity from progress data (last 10 items)
        const recentProgress = allProgress
          .filter(p => p.completed)
          .sort((a, b) => new Date(b.lastWatchedAt) - new Date(a.lastWatchedAt))
          .slice(0, 10);

        calculatedAnalytics.recentActivity = recentProgress.map(p => ({
          type: 'lesson',
          title: p.lessonId?.title || 'Lesson',
          date: p.lastWatchedAt,
        }));

        // Add quiz attempts to recent activity
        const recentQuizzes = quizAttemptsData
          .sort((a, b) => new Date(b.attemptedAt || b.createdAt) - new Date(a.attemptedAt || a.createdAt))
          .slice(0, 5)
          .map(q => ({
            type: 'quiz',
            title: q.quizId?.title || 'Quiz',
            date: q.attemptedAt || q.createdAt,
            score: q.percentage || 0,
          }));

        // Add assignment submissions to recent activity
        const recentSubmissions = submissionsData
          .sort((a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt))
          .slice(0, 5)
          .map(s => ({
            type: 'assignment',
            title: s.assignmentId?.title || 'Assignment',
            date: s.submittedAt || s.createdAt,
            status: s.status || 'submitted',
          }));

        // Combine and sort all activities
        calculatedAnalytics.recentActivity = [...calculatedAnalytics.recentActivity, ...recentQuizzes, ...recentSubmissions]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 10);

        setAnalytics(calculatedAnalytics);
        setEnrollments(enrollmentsData);

        // Build weekly data from progress and quiz attempts
        const weeklyActivity = buildWeeklyActivity(allProgress, quizAttemptsData);
        setWeeklyData(weeklyActivity);
      }
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const buildWeeklyActivity = (progressData, quizAttemptsData = []) => {
    const today = new Date();
    const progressActivity = [];
    const quizActivity = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];

      // Count completed lessons on this date
      const lessonCount = progressData.filter(p => {
        if (!p.lastWatchedAt || !p.completed) return false;
        const progressDate = new Date(p.lastWatchedAt);
        progressDate.setHours(0, 0, 0, 0);
        const progressDateStr = progressDate.toISOString().split('T')[0];
        return progressDateStr === dateStr;
      }).length;

      progressActivity.push({ _id: dateStr, count: lessonCount });

      // Count quiz attempts on this date
      const quizCount = quizAttemptsData.filter(q => {
        if (!q.attemptedAt && !q.createdAt) return false;
        const attemptDate = new Date(q.attemptedAt || q.createdAt);
        attemptDate.setHours(0, 0, 0, 0);
        const attemptDateStr = attemptDate.toISOString().split('T')[0];
        return attemptDateStr === dateStr;
      }).length;

      quizActivity.push({ _id: dateStr, count: quizCount });
    }

    return { progressActivity, quizActivity };
  };

  const prepareWeeklyChartData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const weekData = [];

    // If no weekly data loaded yet, return empty data
    if (!weeklyData) {
      return days.map(day => ({ x: day, y: 0 }));
    }

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
      const dayName = days[dayIndex];

      const lessonActivity = weeklyData?.progressActivity?.find(a => a._id === dateStr);
      const quizActivity = weeklyData?.quizActivity?.find(a => a._id === dateStr);
      // Combine lessons + quizzes for total daily activity
      const total = (lessonActivity?.count || 0) + (quizActivity?.count || 0);

      weekData.push({ x: dayName, y: total });
    }

    return weekData;
  };

  const hasWeeklyActivity = () => {
    const data = prepareWeeklyChartData();
    return data.some(d => d.y > 0);
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorView message={error} onRetry={fetchAllData} />;
  if (!user) return <LoadingSpinner />;

  const isInstructor = user.role === 'instructor';
  const weeklyChartData = prepareWeeklyChartData();
  const weeklyHasData = hasWeeklyActivity();

  // Top 3 courses for progress section
  const topCourses = enrollments.slice(0, 3);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchAllData(true)}
          colors={['#6C63FF']}
        />
      }
    >
      {/* Header Stats - 2x2 Grid */}
      {isInstructor ? (
        // Instructor Stats Cards
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#43C67820' }]}>
              <Ionicons name="people-outline" size={26} color="#43C678" />
            </View>
            <Text style={[styles.statValue, { color: '#43C678' }]}>
              {instructorStats?.totalStudents || 0}
            </Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#6C63FF20' }]}>
              <Ionicons name="cash-outline" size={26} color="#6C63FF" />
            </View>
            <Text style={[styles.statValue, { color: '#6C63FF' }]}>
              ${instructorStats?.totalRevenue || 0}
            </Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#FFB34720' }]}>
              <Ionicons name="star" size={26} color="#FFB347" />
            </View>
            <Text style={[styles.statValue, { color: '#FFB347' }]}>
              {(instructorStats?.avgRating || 0).toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#FF658420' }]}>
              <Ionicons name="time-outline" size={26} color="#FF6584" />
            </View>
            <Text style={[styles.statValue, { color: '#FF6584' }]}>
              {instructorStats?.pendingSubmissions || 0}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Student Stats Cards
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('My Learning')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#6C63FF20' }]}>
              <Ionicons name="school" size={26} color="#6C63FF" />
            </View>
            <Text style={[styles.statValue, { color: '#6C63FF' }]}>
              {analytics?.enrolledCourses || 0}
            </Text>
            <Text style={styles.statLabel}>Enrolled</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('CompletedCourses')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#43C67820' }]}>
              <Ionicons name="checkmark-circle" size={26} color="#43C678" />
            </View>
            <Text style={[styles.statValue, { color: '#43C678' }]}>
              {analytics?.completedCourses || 0}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('Certificate')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#FFB34720' }]}>
              <Ionicons name="ribbon" size={26} color="#FFB347" />
            </View>
            <Text style={[styles.statValue, { color: '#FFB347' }]}>
              {analytics?.certificates || 0}
            </Text>
            <Text style={styles.statLabel}>Certificates</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('Streak')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#FF658420' }]}>
              <Ionicons name="flame" size={26} color="#FF6584" />
            </View>
            <Text style={[styles.statValue, { color: '#FF6584' }]}>
              {analytics?.currentStreak || 0}
            </Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Weekly Activity Chart - always show */}
      {!isInstructor && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Activity</Text>
          {weeklyHasData ? (
            <>
              <VictoryChart
                height={220}
                width={350}
                padding={{ top: 20, bottom: 45, left: 45, right: 30 }}
                domainPadding={{ x: 25 }}
              >
                <VictoryAxis
                  style={{
                    axis: { stroke: colors.border },
                    tickLabels: { fontSize: 12, fill: colors.textSecondary, padding: 5 },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  tickFormat={(t) => (Number.isInteger(t) ? String(t) : '')}
                  tickCount={4}
                  style={{
                    axis: { stroke: colors.border },
                    tickLabels: { fontSize: 12, fill: colors.textSecondary },
                    grid: { stroke: colors.border, strokeDasharray: '3,3' },
                  }}
                />
                <VictoryBar
                  data={weeklyChartData}
                  style={{ data: { fill: '#6C63FF' } }}
                  barWidth={20}
                  cornerRadius={{ top: 4 }}
                />
              </VictoryChart>
              <Text style={styles.chartCaption}>Lessons & quizzes completed per day</Text>
            </>
          ) : (
            <View style={styles.weeklyEmpty}>
              <Ionicons name="bar-chart-outline" size={48} color={colors.textLight} />
              <Text style={styles.weeklyEmptyTitle}>No activity this week</Text>
              <Text style={styles.weeklyEmptyText}>
                Complete lessons or quizzes to see your activity here
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Course Performance - Instructor Only */}
      {isInstructor && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Course Performance</Text>
          {instructorCourses.length > 0 ? (
            <>
              {instructorCourses.slice(0, 5).map((course, index) => (
                <View key={course._id || index} style={styles.coursePerformanceRow}>
                  <View style={styles.coursePerformanceInfo}>
                    <Text style={styles.coursePerformanceTitle} numberOfLines={1}>
                      {course.title}
                    </Text>
                    <View style={styles.coursePerformanceStats}>
                      <Text style={styles.coursePerformanceStudents}>
                        {course.totalStudents || 0} students
                      </Text>
                      <Text style={styles.coursePerformanceRating}>
                        ★ {(course.rating || course.avgRating || 0).toFixed(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
              <TouchableOpacity
                style={styles.viewAllCoursesButton}
                onPress={() => navigation.navigate('Courses')}
              >
                <Text style={styles.viewAllCoursesText}>View All Courses</Text>
                <Ionicons name="arrow-forward" size={16} color="#6C63FF" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyCoursesContainer}>
              <Ionicons name="school-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyCoursesTitle}>No courses yet</Text>
              <TouchableOpacity
                style={styles.createCourseButton}
                onPress={() => navigation.navigate('Main', { 
                  screen: 'Courses'
                })}
              >
                <Text style={styles.createCourseButtonText}>Go to My Courses</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Recent Activity Feed */}
      {!isInstructor && analytics?.recentActivity && analytics.recentActivity.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {analytics.recentActivity.map((activity, index) => {
            const getActivityColor = (type) => {
              switch(type) {
                case 'quiz': return '#43C678';
                case 'assignment': return '#FF9800';
                default: return '#6C63FF';
              }
            };
            
            const getActivityIcon = (type) => {
              switch(type) {
                case 'quiz': return 'checkmark-circle';
                case 'assignment': return 'document-text';
                default: return 'play-circle';
              }
            };
            
            return (
            <View key={index} style={styles.activityItem}>
              <View style={[
                styles.activityIcon,
                { backgroundColor: getActivityColor(activity.type) + '20' }
              ]}>
                <Ionicons
                  name={getActivityIcon(activity.type)}
                  size={20}
                  color={getActivityColor(activity.type)}
                />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle} numberOfLines={1}>
                  {activity.title}
                </Text>
                <Text style={styles.activityTime}>{getTimeAgo(activity.date)}</Text>
              </View>
              {activity.score !== undefined && (
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{activity.score}%</Text>
                </View>
              )}
              {activity.status && activity.type === 'assignment' && (
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: activity.status === 'graded' ? '#43C67820' : '#FF980020' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: activity.status === 'graded' ? '#43C678' : '#FF9800' }
                  ]}>
                    {activity.status}
                  </Text>
                </View>
              )}
            </View>
            );
          })}
        </View>
      )}

      {/* My Courses Progress */}
      {!isInstructor && topCourses.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Courses Progress</Text>
            {enrollments.length > 3 && (
              <TouchableOpacity onPress={() => navigation.navigate('Progress')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>
          {topCourses.map((item, index) => {
            const course = item.course || item.courseId || {};
            const progress = item.progress || item.completionPercentage || 0;
            return (
              <View key={index} style={styles.courseProgressItem}>
                <Text style={styles.courseProgressTitle} numberOfLines={1}>
                  {course.title || 'Course'}
                </Text>
                <View style={styles.progressRow}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${progress}%`, backgroundColor: progress === 100 ? '#43C678' : '#6C63FF' },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressPercent}>{progress}%</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Instructor Top Courses */}
      {isInstructor && analytics?.topCourses && analytics.topCourses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Performing Courses</Text>
          {analytics.topCourses.map((course, index) => (
            <View key={course._id || index} style={styles.courseRow}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle} numberOfLines={1}>
                  {course.title}
                </Text>
                <Text style={styles.courseStats}>
                  {course.totalStudents || 0} students • {(course.rating || course.avgRating || 0).toFixed(1)} ★
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Empty State for No Data */}
      {!isInstructor && enrollments.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No Analytics Yet</Text>
          <Text style={styles.emptyText}>
            Enroll in courses and start learning to see your analytics!
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Courses')}
          >
            <Text style={styles.emptyButtonText}>Browse Courses</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.white,
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
    color: colors.textSecondary,
    fontWeight: '500',
  },
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
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
    color: colors.text,
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
  },
  chartCaption: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  weeklyEmpty: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  weeklyEmptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  weeklyEmptyText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  coursePerformanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  coursePerformanceInfo: {
    flex: 1,
  },
  coursePerformanceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  coursePerformanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coursePerformanceStudents: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 12,
  },
  coursePerformanceRating: {
    fontSize: 12,
    color: '#FFB347',
    fontWeight: '600',
  },
  viewAllCoursesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
  },
  viewAllCoursesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
    marginRight: 4,
  },
  emptyCoursesContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyCoursesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 16,
  },
  createCourseButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createCourseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  scoreBadge: {
    backgroundColor: '#43C67820',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#43C678',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  courseProgressItem: {
    marginBottom: 16,
  },
  courseProgressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
    minWidth: 40,
    textAlign: 'right',
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6C63FF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  courseStats: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
});

export default AnalyticsDashboardScreen;
