import React, { useContext } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';

const PRIMARY = '#6C63FF';

const QuickAction = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={26} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const InstructorDashboardScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [refreshing, setRefreshing] = React.useState(false);
  const [stats, setStats] = React.useState({
    totalCourses: 0,
    totalStudents: 0,
    avgRating: 0.0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [recentEnrollments, setRecentEnrollments] = React.useState([]);
  const [topCourses, setTopCourses] = React.useState([]);

  const firstName = (user?.name || 'Instructor').split(' ')[0];

  React.useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Fetch instructor stats from API
      const response = await fetch(`http://10.214.148.69:5000/api/instructors/${user.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalCourses: data.data?.totalCourses || 0,
          totalStudents: data.data?.totalStudents || 0,
          avgRating: data.data?.avgRating || 0.0,
          totalRevenue: data.data?.totalRevenue || 0,
        });
      }

      // Fetch recent enrollments
      await fetchRecentEnrollments();
      
      // Fetch top courses
      await fetchTopCourses();
    } catch (err) {
      console.log('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRecentEnrollments = async () => {
    try {
      // Fetch instructor's courses
      const coursesRes = await fetch(`http://10.214.148.69:5000/api/instructors/${user.id}/courses`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        const courses = coursesData.data || [];
        
        // Fetch enrollments for each course
        const allEnrollments = [];
        for (const course of courses.slice(0, 5)) { // Check first 5 courses
          try {
            const enrollRes = await fetch(`http://10.214.148.69:5000/api/enrollments?courseId=${course._id}`, {
              headers: {
                'Authorization': `Bearer ${user.token}`,
              },
            });
            
            if (enrollRes.ok) {
              const enrollData = await enrollRes.json();
              const enrollments = enrollData.data || [];
              
              enrollments.forEach(enroll => {
                allEnrollments.push({
                  ...enroll,
                  courseName: course.title,
                  courseCategory: course.category,
                });
              });
            }
          } catch (err) {
            console.log('Failed to fetch enrollments for course:', course._id);
          }
        }

        // Sort by enrollment date and get recent 5
        const recent = allEnrollments
          .sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
          .slice(0, 5);
        
        setRecentEnrollments(recent);
      }
    } catch (err) {
      console.log('Failed to fetch recent enrollments:', err);
    }
  };

  const fetchTopCourses = async () => {
    try {
      // Fetch instructor's courses
      const coursesRes = await fetch(`http://10.214.148.69:5000/api/instructors/${user.id}/courses`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        const courses = coursesData.data || [];
        
        // Fetch enrollment count for each course
        const coursesWithStats = await Promise.all(
          courses.map(async (course) => {
            try {
              const enrollRes = await fetch(`http://10.214.148.69:5000/api/enrollments?courseId=${course._id}`, {
                headers: {
                  'Authorization': `Bearer ${user.token}`,
                },
              });
              
              if (enrollRes.ok) {
                const enrollData = await enrollRes.json();
                const enrollments = enrollData.data || [];
                
                // Calculate completion rate
                const completedCount = enrollments.filter(e => e.completionPercentage === 100).length;
                const completionRate = enrollments.length > 0 
                  ? (completedCount / enrollments.length * 100).toFixed(0)
                  : 0;
                
                return {
                  ...course,
                  studentCount: enrollments.length,
                  completionRate: parseInt(completionRate),
                };
              }
              
              return {
                ...course,
                studentCount: 0,
                completionRate: 0,
              };
            } catch (err) {
              return {
                ...course,
                studentCount: 0,
                completionRate: 0,
              };
            }
          })
        );
        
        // Sort by student count and get top 5
        const top = coursesWithStats
          .sort((a, b) => b.studentCount - a.studentCount)
          .slice(0, 5);
        
        setTopCourses(top);
      }
    } catch (err) {
      console.log('Failed to fetch top courses:', err);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  const onRefresh = () => {
    fetchStats(true);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          colors={[PRIMARY]} 
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back, {firstName}! 👋</Text>
          <Text style={styles.subGreeting}>Here's your teaching overview</Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Instructor</Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Courses')}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconCircle, { backgroundColor: '#6C63FF20' }]}>
              <Ionicons name="book" size={28} color="#6C63FF" />
            </View>
            <Text style={[styles.statValue, { color: '#6C63FF' }]}>
              {stats.totalCourses}
            </Text>
            <Text style={styles.statLabel}>Courses</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Courses')}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconCircle, { backgroundColor: '#43C67820' }]}>
              <Ionicons name="people" size={28} color="#43C678" />
            </View>
            <Text style={[styles.statValue, { color: '#43C678' }]}>
              {stats.totalStudents}
            </Text>
            <Text style={styles.statLabel}>Students</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={styles.statCard}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconCircle, { backgroundColor: '#FFB34720' }]}>
              <Ionicons name="star" size={28} color="#FFB347" />
            </View>
            <Text style={[styles.statValue, { color: '#FFB347' }]}>
              {stats.avgRating.toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconCircle, { backgroundColor: '#FF658420' }]}>
              <Ionicons name="cash" size={28} color="#FF6584" />
            </View>
            <Text style={[styles.statValue, { color: '#FF6584' }]}>
              Rs. {stats.totalRevenue.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Revenue (LKR)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <QuickAction 
            icon="add-circle-outline" 
            color={PRIMARY} 
            label="New Course" 
            onPress={() => navigation.navigate('CreateCourse')} 
          />
          <QuickAction 
            icon="clipboard-outline" 
            color="#FF6584" 
            label="Assessments" 
            onPress={() => navigation.navigate('AssessmentManagement')} 
          />
          <QuickAction 
            icon="document-text-outline" 
            color="#43C678" 
            label="Add Quiz" 
            onPress={() => navigation.navigate('AddQuiz')} 
          />
          <QuickAction 
            icon="document-attach-outline" 
            color="#FFB347" 
            label="Assignment" 
            onPress={() => navigation.navigate('AddAssignment')} 
          />
          <QuickAction 
            icon="play-circle-outline" 
            color="#3B82F6" 
            label="Add Lesson" 
            onPress={() => navigation.navigate('Courses')} 
          />
          <QuickAction 
            icon="checkmark-done-outline" 
            color="#9C27B0" 
            label="Submissions" 
            onPress={() => navigation.navigate('InstructorSubmissions')} 
          />
          <QuickAction 
            icon="chatbubbles-outline" 
            color="#26D0CE" 
            label="Discussions" 
            onPress={() => navigation.navigate('DiscussionBoard')} 
          />
        </View>
      </View>

      {/* Recent Enrollments */}
      {recentEnrollments.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Enrollments</Text>
            <Text style={styles.enrollmentCount}>
              {recentEnrollments.length} this week
            </Text>
          </View>
          
          <View style={styles.enrollmentsList}>
            {recentEnrollments.map((enrollment, index) => (
              <View key={index} style={styles.enrollmentItem}>
                <View style={styles.enrollmentIcon}>
                  <Ionicons name="person-circle" size={40} color={PRIMARY} />
                </View>
                <View style={styles.enrollmentInfo}>
                  <Text style={styles.enrollmentName}>
                    {enrollment.userId?.name || 'Student'}
                  </Text>
                  <Text style={styles.enrollmentCourse} numberOfLines={1}>
                    {enrollment.courseName}
                  </Text>
                </View>
                <Text style={styles.enrollmentTime}>
                  {getTimeAgo(enrollment.enrolledAt)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Top Performing Courses */}
      {topCourses.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Performing Courses</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Courses')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.topCoursesList}>
            {topCourses.map((course, index) => (
              <TouchableOpacity
                key={course._id}
                style={styles.topCourseCard}
                onPress={() => navigation.navigate('InstructorCourseDetail', { courseId: course._id })}
                activeOpacity={0.8}
              >
                <View style={styles.topCourseHeader}>
                  <View style={[
                    styles.rankBadge,
                    { backgroundColor: index === 0 ? '#FFD70020' : index === 1 ? '#C0C0C020' : index === 2 ? '#CD7F3220' : PRIMARY + '20' }
                  ]}>
                    <Text style={[
                      styles.rankText,
                      { color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : PRIMARY }
                    ]}>
                      #{index + 1}
                    </Text>
                  </View>
                  <View style={styles.topCourseInfo}>
                    <Text style={styles.topCourseTitle} numberOfLines={1}>
                      {course.title}
                    </Text>
                    <Text style={styles.topCourseCategory}>{course.category}</Text>
                  </View>
                </View>
                
                <View style={styles.topCourseStats}>
                  <View style={styles.topCourseStat}>
                    <Ionicons name="people" size={16} color="#43C678" />
                    <Text style={styles.topCourseStatText}>
                      {course.studentCount} {course.studentCount === 1 ? 'student' : 'students'}
                    </Text>
                  </View>
                  <View style={styles.topCourseStat}>
                    <Ionicons name="checkmark-circle" size={16} color="#FFB347" />
                    <Text style={styles.topCourseStatText}>
                      {course.completionRate}% completion
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: PRIMARY,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  subGreeting: { fontSize: 13, color: '#ffffff99', marginTop: 2 },
  roleBadge: { backgroundColor: '#ffffff30', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  roleText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  
  // Stats Cards
  statsContainer: { 
    paddingHorizontal: 16, 
    paddingTop: 20,
    paddingBottom: 8,
  },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  statIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  
  section: { marginHorizontal: 16, marginBottom: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  enrollmentCount: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY,
  },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionCard: {
    width: '31%', 
    backgroundColor: '#fff', 
    borderRadius: 12,
    padding: 14, 
    alignItems: 'center', 
    marginBottom: 10,
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, 
    shadowRadius: 4,
  },
  actionIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  actionLabel: { 
    fontSize: 11, 
    fontWeight: '600', 
    color: '#1a1a2e', 
    textAlign: 'center' 
  },
  
  // Enrollments styles
  enrollmentsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  enrollmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  enrollmentIcon: {
    marginRight: 12,
  },
  enrollmentInfo: {
    flex: 1,
  },
  enrollmentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  enrollmentCourse: {
    fontSize: 13,
    color: '#888',
  },
  enrollmentTime: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  
  // Top Courses styles
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY,
  },
  topCoursesList: {
    gap: 10,
  },
  topCourseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  topCourseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  topCourseInfo: {
    flex: 1,
  },
  topCourseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  topCourseCategory: {
    fontSize: 12,
    color: '#888',
  },
  topCourseStats: {
    flexDirection: 'row',
    gap: 16,
  },
  topCourseStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topCourseStatText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
});

export default InstructorDashboardScreen;
