import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analyticsService } from '../../services/analyticsService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';
import colors from '../../constants/colors';

const PRIMARY = '#6C63FF';

// ── Tab options ───────────────────────────────────────────────────────────────
const TABS = ['All', 'In Progress', 'Completed'];

// ── Compact course card ───────────────────────────────────────────────────────
const EnrollmentCard = ({ item, onPress, onProgressPress }) => {
  const course   = item.course || item.courseId || {};
  const courseId = course._id || item.courseId;
  const progress = item.progress || item.completionPercentage || 0;
  const isCompleted = progress === 100;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Thumbnail */}
      {course.thumbnail ? (
        <Image source={{ uri: course.thumbnail }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Ionicons name="book" size={26} color="#fff" />
        </View>
      )}

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {course.title || 'Course'}
        </Text>

        {course.category && (
          <Text style={styles.cardCategory}>{course.category}</Text>
        )}

        {/* Progress bar */}
        <View style={styles.progressBg}>
          <View style={[
            styles.progressFill,
            { width: `${progress}%`, backgroundColor: isCompleted ? '#43C678' : PRIMARY }
          ]} />
        </View>

        {/* Progress text + date */}
        <View style={styles.cardMeta}>
          <Text style={styles.progressText}>
            {isCompleted ? '✓ Completed' : `${progress}%`}
          </Text>
          <Text style={styles.enrolledDate}>
            {new Date(item.enrolledAt).toLocaleDateString('en-GB')}
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.continueBtn} onPress={onPress}>
            <Ionicons name="play-circle-outline" size={15} color="#fff" />
            <Text style={styles.continueBtnText}>
              {isCompleted ? 'Review' : 'Continue'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.progressBtn} onPress={onProgressPress}>
            <Ionicons name="analytics-outline" size={16} color={PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
const EnrollmentScreen = ({ navigation }) => {
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [error,          setError]          = useState(null);
  const [activeTab,      setActiveTab]      = useState('All');
  const [search,         setSearch]         = useState('');

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await analyticsService.getMyEnrollments(1, 100);
      setAllEnrollments(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load enrollments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── Filter by tab + search ────────────────────────────────────────────────
  const getFilteredList = () => {
    let list = [...allEnrollments];

    // Tab filter
    if (activeTab === 'In Progress') {
      list = list.filter(e => {
        const pct = e.progress || e.completionPercentage || 0;
        return pct > 0 && pct < 100;
      });
    } else if (activeTab === 'Completed') {
      list = list.filter(e => (e.progress || e.completionPercentage || 0) === 100);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => {
        const course = e.course || e.courseId || {};
        return (course.title || '').toLowerCase().includes(q);
      });
    }

    return list;
  };

  // ── Summary stats ─────────────────────────────────────────────────────────
  const total      = allEnrollments.length;
  const inProgress = allEnrollments.filter(e => {
    const p = e.progress || e.completionPercentage || 0;
    return p > 0 && p < 100;
  }).length;
  const completed  = allEnrollments.filter(
    e => (e.progress || e.completionPercentage || 0) === 100
  ).length;

  // ── Empty state per tab ───────────────────────────────────────────────────
  const getEmptyState = () => {
    switch (activeTab) {
      case 'In Progress':
        return {
          icon: 'play-circle-outline',
          title: 'No courses in progress',
          description: 'Start a course to see it here',
          actionLabel: 'Browse Courses',
          onAction: () => navigation.navigate('Courses'),
        };
      case 'Completed':
        return {
          icon: 'trophy-outline',
          title: 'No completed courses yet',
          description: 'Keep learning — you\'re almost there! 💪',
          actionLabel: '',
          onAction: null,
        };
      default:
        return {
          icon: 'school-outline',
          title: 'No enrolled courses yet',
          description: 'Browse courses and start your learning journey',
          actionLabel: 'Browse Courses',
          onAction: () => navigation.navigate('Courses'),
        };
    }
  };

  if (loading) return <LoadingSpinner text="Loading your courses..." />;
  if (error)   return <ErrorView message={error} onRetry={fetchEnrollments} />;

  const filtered  = getFilteredList();
  const emptyInfo = getEmptyState();

  return (
    <View style={styles.container}>
      {/* ── Summary strip ── */}
      <View style={styles.summaryStrip}>
        <TouchableOpacity style={styles.summaryItem} onPress={() => setActiveTab('All')}>
          <Text style={styles.summaryValue}>{total}</Text>
          <Text style={styles.summaryLabel}>Enrolled</Text>
        </TouchableOpacity>
        <View style={styles.summaryDivider} />
        <TouchableOpacity style={styles.summaryItem} onPress={() => setActiveTab('In Progress')}>
          <Text style={[styles.summaryValue, { color: PRIMARY }]}>{inProgress}</Text>
          <Text style={styles.summaryLabel}>In Progress</Text>
        </TouchableOpacity>
        <View style={styles.summaryDivider} />
        <TouchableOpacity style={styles.summaryItem} onPress={() => setActiveTab('Completed')}>
          <Text style={[styles.summaryValue, { color: '#43C678' }]}>{completed}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color="#aaa" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your courses..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color="#aaa" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Course list ── */}
      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchEnrollments(true)}
            colors={[PRIMARY]}
          />
        }
        renderItem={({ item }) => {
          const course   = item.course || item.courseId || {};
          const courseId = course._id || item.courseId;
          return (
            <EnrollmentCard
              item={item}
              onPress={() => navigation.navigate('CourseDetail', {
                courseId,
                isEnrolled: true,
              })}
              onProgressPress={() => navigation.navigate('Progress', { courseId })}
            />
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon={emptyInfo.icon}
            title={emptyInfo.title}
            description={emptyInfo.description}
            actionLabel={emptyInfo.actionLabel}
            onAction={emptyInfo.onAction}
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

  // Summary strip
  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginVertical: 4,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1a1a2e',
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888',
  },
  tabTextActive: {
    color: PRIMARY,
    fontWeight: '700',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: PRIMARY,
    borderRadius: 2,
  },

  // List
  listContent: {
    padding: 16,
    paddingTop: 12,
  },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    minHeight: 110,
  },
  thumb: {
    width: 80,
    minHeight: 110,
    backgroundColor: '#E8E8F0',
  },
  thumbPlaceholder: {
    backgroundColor: PRIMARY + 'CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a2e',
    lineHeight: 18,
    marginBottom: 2,
  },
  cardCategory: {
    fontSize: 11,
    color: '#888',
    marginBottom: 6,
  },
  progressBg: {
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
  },
  enrolledDate: {
    fontSize: 11,
    color: '#aaa',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    borderRadius: 8,
    paddingVertical: 7,
    marginRight: 8,
  },
  continueBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  progressBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EnrollmentScreen;
