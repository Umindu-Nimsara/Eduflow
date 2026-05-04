import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { analyticsService } from '../../services/analyticsService';
import CourseCard from '../../components/common/CourseCard';

const PRIMARY = '#6C63FF';

// ── Greeting helper ───────────────────────────────────────────────────────────
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const getDateString = () => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month:   'long',
    day:     'numeric',
  });
};

// ── Daily motivation quotes ──────────────────────────────────────────────────
const MOTIVATION_QUOTES = [
  "Success is the sum of small efforts repeated day in and day out",
  "The expert in anything was once a beginner",
  "Education is the passport to the future",
  "Learning is a treasure that will follow its owner everywhere",
  "The beautiful thing about learning is that no one can take it away from you",
  "Don't watch the clock; do what it does. Keep going",
  "Your only limit is you. Believe in yourself and you will succeed",
];

const getDailyQuote = () => {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return MOTIVATION_QUOTES[dayOfYear % MOTIVATION_QUOTES.length];
};

// ── Feature grid items ────────────────────────────────────────────────────────
const FEATURES = [
  { name: 'Courses',         title: 'All Courses',     icon: 'library-outline',      color: '#6C63FF' },
  { name: 'My Learning',     title: 'My Learning',     icon: 'school-outline',       color: '#FF6584' },
  { name: 'Analytics',       title: 'Analytics',       icon: 'bar-chart-outline',    color: '#43C678' },
  { name: 'Progress',        title: 'Progress',        icon: 'trending-up-outline',  color: '#FFB347' },
  { name: 'Certificate',     title: 'Certificates',    icon: 'ribbon-outline',       color: '#26D0CE' },
  { name: 'DiscussionBoard', title: 'Discussions',     icon: 'chatbubbles-outline',  color: '#FD79A8' },
  { name: 'QuizList',        title: 'Quizzes',         icon: 'help-circle-outline',  color: '#9C88FF' },
  { name: 'Badges',          title: 'My Badges',       icon: 'trophy-outline',       color: '#FF9F43' },
];

// ── Main screen ───────────────────────────────────────────────────────────────
const ModuleDashboardScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);

  const [stats,       setStats]       = useState({ courses: 0, certificates: 0, streak: 0, completed: 0 });
  const [recentCourses, setRecentCourses] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);

      const [analyticsRes, enrollmentsRes] = await Promise.all([
        analyticsService.getStudentAnalytics().catch(() => null),
        analyticsService.getMyEnrollments(1, 10).catch(() => null),
      ]);

      if (analyticsRes) {
        setStats({
          courses:      analyticsRes.data?.enrolledCourses  || 0,
          certificates: analyticsRes.data?.certificates     || 0,
          streak:       analyticsRes.data?.currentStreak    || 0,
          completed:    analyticsRes.data?.completedCourses || 0,
        });
      }

      if (enrollmentsRes) {
        // Last 2 enrolled courses for "Continue Learning"
        const list = (enrollmentsRes.data || []).slice(0, 2);
        setRecentCourses(list);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const firstName = (user?.name || 'Learner').split(' ')[0];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchData(true)}
          colors={[PRIMARY]}
        />
      }
    >
      {/* ── Greeting header ── */}
      <View style={styles.greetingSection}>
        <View style={styles.greetingLeft}>
          <Text style={styles.greetingText}>
            {getGreeting()}, {firstName}! 👋
          </Text>
          <Text style={styles.dateText}>{getDateString()}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.85}
        >
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarInitial}>
              {firstName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Quick stats strip ── */}
      <View style={styles.statsStrip}>
        <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('My Learning')}>
          <Ionicons name="school-outline" size={20} color={PRIMARY} />
          <Text style={styles.statValue}>{stats.courses}</Text>
          <Text style={styles.statLabel}>Enrolled</Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('CompletedCourses')}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#43C678" />
          <Text style={[styles.statValue, { color: '#43C678' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Streak')}>
          <Ionicons name="flame-outline" size={20} color="#FF6584" />
          <Text style={[styles.statValue, { color: '#FF6584' }]}>{stats.streak}</Text>
          <Text style={styles.statLabel}>Streak 🔥</Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Certificate')}>
          <Ionicons name="ribbon-outline" size={20} color="#FFB347" />
          <Text style={[styles.statValue, { color: '#FFB347' }]}>{stats.certificates}</Text>
          <Text style={styles.statLabel}>Certs</Text>
        </TouchableOpacity>
      </View>

      {/* ── Daily Motivation Quote ── */}
      <View style={styles.motivationCard}>
        <View style={styles.motivationHeader}>
          <Ionicons name="bulb" size={24} color="#FFD700" />
          <Text style={styles.motivationTitle}>Daily Motivation</Text>
        </View>
        <Text style={styles.motivationQuote}>
          "{getDailyQuote()}"
        </Text>
        <Text style={styles.motivationAuthor}>- Keep Learning, Keep Growing 🌱</Text>
      </View>

      {/* ── Study Streak Challenge ── */}
      <View style={styles.streakChallengeCard}>
        <View style={styles.streakHeader}>
          <View>
            <Text style={styles.streakTitle}>Study Streak Challenge</Text>
            <Text style={styles.streakSubtitle}>Keep your learning momentum going!</Text>
          </View>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={32} color="#FF6584" />
            <Text style={styles.streakDays}>{stats.streak}</Text>
          </View>
        </View>
        
        <View style={styles.streakDaysContainer}>
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <View key={day} style={styles.streakDayBox}>
              <View style={[
                styles.streakDayCircle,
                day <= stats.streak && styles.streakDayActive
              ]}>
                {day <= stats.streak && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.streakDayLabel}>D{day}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.streakRewardBox}>
          <Ionicons name="gift" size={20} color="#FFB347" />
          <Text style={styles.streakRewardText}>
            {stats.streak >= 7 ? '🎉 7-Day Streak Unlocked!' : `${7 - stats.streak} more days to unlock reward!`}
          </Text>
        </View>
      </View>

      {/* ── Quick Actions ── */}
      <View style={styles.quickActionsCard}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('QuizList')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#9C88FF20' }]}>
              <Ionicons name="help-circle" size={28} color="#9C88FF" />
            </View>
            <Text style={styles.quickActionLabel}>Take Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Courses')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#6C63FF20' }]}>
              <Ionicons name="search" size={28} color="#6C63FF" />
            </View>
            <Text style={styles.quickActionLabel}>Find Course</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('DiscussionBoard')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FD79A820' }]}>
              <Ionicons name="chatbubbles" size={28} color="#FD79A8" />
            </View>
            <Text style={styles.quickActionLabel}>Ask Question</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Rewards')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FFD70020' }]}>
              <Ionicons name="trophy" size={28} color="#FFD700" />
            </View>
            <Text style={styles.quickActionLabel}>My Rewards</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Leaderboard Preview ── */}
      <View style={styles.leaderboardCard}>
        <View style={styles.leaderboardHeader}>
          <View>
            <Text style={styles.leaderboardTitle}>Top Learners This Week</Text>
            <Text style={styles.leaderboardSubtitle}>Compete with your peers!</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')}>
            <Text style={styles.viewAllLink}>View All →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.podiumContainer}>
          {/* 2nd Place */}
          <View style={styles.podiumItem}>
            <View style={[styles.podiumAvatar, { backgroundColor: '#C0C0C020' }]}>
              <Text style={styles.podiumInitial}>S</Text>
            </View>
            <View style={[styles.podiumRank, { backgroundColor: '#C0C0C0' }]}>
              <Text style={styles.podiumRankText}>2</Text>
            </View>
            <Text style={styles.podiumName}>Sarah</Text>
            <Text style={styles.podiumPoints}>850 pts</Text>
          </View>

          {/* 1st Place */}
          <View style={[styles.podiumItem, styles.podiumFirst]}>
            <Ionicons name="trophy" size={24} color="#FFD700" style={styles.crownIcon} />
            <View style={[styles.podiumAvatar, styles.podiumAvatarFirst, { backgroundColor: '#FFD70020' }]}>
              <Text style={styles.podiumInitial}>A</Text>
            </View>
            <View style={[styles.podiumRank, { backgroundColor: '#FFD700' }]}>
              <Text style={styles.podiumRankText}>1</Text>
            </View>
            <Text style={styles.podiumName}>Alex</Text>
            <Text style={styles.podiumPoints}>1,250 pts</Text>
          </View>

          {/* 3rd Place */}
          <View style={styles.podiumItem}>
            <View style={[styles.podiumAvatar, { backgroundColor: '#CD7F3220' }]}>
              <Text style={styles.podiumInitial}>M</Text>
            </View>
            <View style={[styles.podiumRank, { backgroundColor: '#CD7F32' }]}>
              <Text style={styles.podiumRankText}>3</Text>
            </View>
            <Text style={styles.podiumName}>Mike</Text>
            <Text style={styles.podiumPoints}>720 pts</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.joinLeaderboardButton}
          onPress={() => navigation.navigate('Leaderboard')}
        >
          <Text style={styles.joinLeaderboardText}>Join the Competition</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Feature grid ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Learning Features</Text>
        <View style={styles.grid}>
          {FEATURES.map((f, i) => (
            <TouchableOpacity
              key={i}
              style={styles.featureCard}
              onPress={() => navigation.navigate(f.name)}
              activeOpacity={0.8}
            >
              <View style={[styles.featureIconCircle, { backgroundColor: f.color + '20' }]}>
                <Ionicons name={f.icon} size={24} color={f.color} />
              </View>
              <Text style={styles.featureTitle}>{f.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Continue Learning ── */}
      {recentCourses.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Continue Learning</Text>
            <TouchableOpacity onPress={() => navigation.navigate('My Learning')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentCourses.map(item => {
            const course   = item.course || item.courseId || {};
            const courseId = course._id || item.courseId;
            const progress = item.progress || item.completionPercentage || 0;
            return (
              <CourseCard
                key={item._id}
                course={course}
                showProgress
                progress={progress}
                enrolledAt={item.enrolledAt}
                onPress={() => navigation.navigate('CourseDetail', {
                  courseId,
                  isEnrolled: true,
                })}
              />
            );
          })}
        </View>
      )}

      {/* ── Settings & Support ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => navigation.navigate('Settings')}
        >
          <View style={[styles.settingIcon, { backgroundColor: PRIMARY + '15' }]}>
            <Ionicons name="settings-outline" size={20} color={PRIMARY} />
          </View>
          <Text style={styles.settingLabel}>Settings</Text>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => navigation.navigate('HelpSupport')}
        >
          <View style={[styles.settingIcon, { backgroundColor: '#43C67815' }]}>
            <Ionicons name="headset-outline" size={20} color="#43C678" />
          </View>
          <Text style={styles.settingLabel}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={[styles.settingIcon, { backgroundColor: '#FFB34715' }]}>
            <Ionicons name="person-outline" size={20} color="#FFB347" />
          </View>
          <Text style={styles.settingLabel}>My Profile</Text>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // Greeting
  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  greetingLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#ffffff99',
  },
  avatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff60',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Stats strip
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 12,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginVertical: 4,
  },

  // Motivation Card
  motivationCard: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    backgroundColor: '#667eea',
  },
  motivationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  motivationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  motivationQuote: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#fff',
    lineHeight: 24,
    marginBottom: 8,
  },
  motivationAuthor: {
    fontSize: 13,
    color: '#ffffffcc',
    textAlign: 'right',
  },

  // Streak Challenge Card
  streakChallengeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  streakSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  streakBadge: {
    alignItems: 'center',
    backgroundColor: '#FF658420',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  streakDays: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6584',
    marginTop: 2,
  },
  streakDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  streakDayBox: {
    alignItems: 'center',
  },
  streakDayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  streakDayActive: {
    backgroundColor: '#43C678',
  },
  streakDayLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
  },
  streakRewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFB34715',
    padding: 12,
    borderRadius: 10,
  },
  streakRewardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFB347',
    marginLeft: 8,
  },

  // Quick Actions Card
  quickActionsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    alignItems: 'center',
    width: '23%',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a1a2e',
    textAlign: 'center',
  },

  // Leaderboard Card
  leaderboardCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  leaderboardSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  podiumItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    flex: 1,
  },
  podiumFirst: {
    marginTop: -20,
  },
  crownIcon: {
    marginBottom: 4,
  },
  podiumAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#eee',
  },
  podiumAvatarFirst: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderColor: '#FFD700',
    borderWidth: 3,
  },
  podiumInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  podiumRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  podiumRankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  podiumName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  podiumPoints: {
    fontSize: 11,
    color: '#888',
  },
  joinLeaderboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  joinLeaderboardText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Sections
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY,
  },

  // Feature grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  featureIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
    textAlign: 'center',
  },

  // Settings rows
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a2e',
  },
});

export default ModuleDashboardScreen;
