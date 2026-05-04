import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analyticsService } from '../../services/analyticsService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';

const PRIMARY = '#6C63FF';

// ── Animated progress bar ─────────────────────────────────────────────────────
const AnimatedBar = ({ pct = 0, color = PRIMARY }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct / 100,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.barBg}>
      <Animated.View style={[styles.barFill, { width, backgroundColor: color }]} />
    </View>
  );
};

// ── Course progress card ──────────────────────────────────────────────────────
const ProgressCard = ({ item, onPress }) => {
  const course   = item.course || item.courseId || {};
  const courseId = course._id || item.courseId;
  const pct      = item.completionPercentage || item.progress || 0;
  const isCompleted = pct === 100;
  const barColor = isCompleted ? '#43C678' : pct >= 50 ? '#FFB347' : PRIMARY;

  return (
    <View style={styles.card}>
      {/* Card header */}
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: barColor + '20' }]}>
          <Ionicons name="book" size={22} color={barColor} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {course.title || 'Course'}
          </Text>
          {course.category && (
            <Text style={styles.cardCategory}>{course.category}</Text>
          )}
        </View>
        {/* Percentage badge */}
        <View style={[styles.pctBadge, { backgroundColor: barColor }]}>
          <Text style={styles.pctText}>{pct}%</Text>
        </View>
      </View>

      {/* Animated progress bar */}
      <AnimatedBar pct={pct} color={barColor} />

      {/* Lesson breakdown */}
      <View style={styles.lessonRow}>
        <Ionicons name="book-outline" size={13} color="#888" />
        <Text style={styles.lessonText}>
          {isCompleted
            ? 'All lessons completed ✓'
            : `${Math.round((pct / 100) * (course.totalLessons || 0))} of ${course.totalLessons || 0} lessons completed`}
        </Text>
      </View>

      {/* Enrolled date + Continue button */}
      <View style={styles.cardFooter}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={13} color="#aaa" />
          <Text style={styles.dateText}>
            {new Date(item.enrolledAt).toLocaleDateString('en-GB')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.continueBtn, isCompleted && styles.reviewBtn]}
          onPress={onPress}
        >
          <Ionicons
            name={isCompleted ? 'checkmark-circle-outline' : 'play-circle-outline'}
            size={14}
            color="#fff"
          />
          <Text style={styles.continueBtnText}>
            {isCompleted ? 'Review' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Motivational banner ───────────────────────────────────────────────────────
const MotivationBanner = ({ avgProgress, hasCompleted }) => {
  let icon, message, bg;

  if (hasCompleted) {
    icon    = '🎉';
    message = 'Amazing! You completed a course!';
    bg      = '#43C67815';
  } else if (avgProgress >= 50) {
    icon    = '🔥';
    message = 'Almost there! Keep it up!';
    bg      = '#FFB34715';
  } else {
    icon    = '💪';
    message = 'Keep going! You\'re making progress!';
    bg      = PRIMARY + '15';
  }

  return (
    <View style={[styles.motivationBanner, { backgroundColor: bg }]}>
      <Text style={styles.motivationEmoji}>{icon}</Text>
      <Text style={styles.motivationText}>{message}</Text>
    </View>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
const ProgressScreen = ({ route, navigation }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await analyticsService.getMyEnrollments(1, 100);
      setEnrollments(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load progress');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading progress..." />;
  if (error)   return <ErrorView message={error} onRetry={fetchProgress} />;

  // ── Summary stats ─────────────────────────────────────────────────────────
  const total      = enrollments.length;
  const completed  = enrollments.filter(e => (e.completionPercentage || e.progress || 0) === 100).length;
  const inProgress = enrollments.filter(e => {
    const p = e.completionPercentage || e.progress || 0;
    return p > 0 && p < 100;
  }).length;
  const avgProgress = total > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.completionPercentage || e.progress || 0), 0) / total)
    : 0;

  return (
    <View style={styles.container}>
      <FlatList
        data={enrollments}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchProgress(true)}
            colors={[PRIMARY]}
          />
        }
        ListHeaderComponent={
          <>
            {/* ── Summary card ── */}
            {total > 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Overall Progress</Text>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: PRIMARY }]}>{total}</Text>
                    <Text style={styles.summaryLabel}>Enrolled</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: '#FFB347' }]}>{inProgress}</Text>
                    <Text style={styles.summaryLabel}>In Progress</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: '#43C678' }]}>{completed}</Text>
                    <Text style={styles.summaryLabel}>Completed</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: '#FF6584' }]}>{avgProgress}%</Text>
                    <Text style={styles.summaryLabel}>Avg</Text>
                  </View>
                </View>

                {/* Overall avg bar */}
                <View style={styles.avgBarRow}>
                  <Text style={styles.avgBarLabel}>Average completion</Text>
                  <Text style={styles.avgBarPct}>{avgProgress}%</Text>
                </View>
                <AnimatedBar pct={avgProgress} color={avgProgress >= 50 ? '#FFB347' : PRIMARY} />
              </View>
            )}

            {/* ── Section title ── */}
            {total > 0 && (
              <Text style={styles.sectionTitle}>Your Courses</Text>
            )}
          </>
        }
        renderItem={({ item }) => {
          const course   = item.course || item.courseId || {};
          const courseId = course._id || item.courseId;
          return (
            <ProgressCard
              item={item}
              onPress={() => navigation.navigate('CourseDetail', {
                courseId,
                isEnrolled: true,
              })}
            />
          );
        }}
        ListFooterComponent={
          total > 0 ? (
            <>
              {/* ── Motivational banner ── */}
              <MotivationBanner avgProgress={avgProgress} hasCompleted={completed > 0} />

              {/* ── Explore more ── */}
              <View style={styles.exploreCard}>
                <Ionicons name="compass-outline" size={32} color={PRIMARY} />
                <Text style={styles.exploreTitle}>Explore More Courses</Text>
                <Text style={styles.exploreText}>
                  Discover new skills and expand your knowledge
                </Text>
                <TouchableOpacity
                  style={styles.exploreBtn}
                  onPress={() => navigation.navigate('Courses')}
                >
                  <Text style={styles.exploreBtnText}>Browse Courses</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="trending-up-outline"
            title="No progress yet"
            description="Enroll in courses and start learning to track your progress here"
            actionLabel="Browse Courses"
            onAction={() => navigation.navigate('Courses')}
          />
        }
      />
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContent: {
    padding: 16,
  },

  // Summary card
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 3,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#eee',
  },
  avgBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  avgBarLabel: {
    fontSize: 12,
    color: '#888',
  },
  avgBarPct: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a2e',
  },

  // Section title
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 12,
  },

  // Progress bar
  barBg: {
    height: 10,
    backgroundColor: '#E8E8E8',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },

  // Course card
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    lineHeight: 20,
    marginBottom: 2,
  },
  cardCategory: {
    fontSize: 12,
    color: '#888',
  },
  pctBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  pctText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Lesson row
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lessonText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 6,
  },

  // Card footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#aaa',
    marginLeft: 4,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  reviewBtn: {
    backgroundColor: '#43C678',
  },
  continueBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },

  // Motivation banner
  motivationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  motivationEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  motivationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    flex: 1,
  },

  // Explore card
  exploreCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  exploreTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginTop: 12,
    marginBottom: 6,
  },
  exploreText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
  },
  exploreBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  exploreBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ProgressScreen;
