import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { discussionService } from '../../services/discussionService';
import { analyticsService } from '../../services/analyticsService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';
import colors from '../../constants/colors';

const DiscussionBoardScreen = ({ navigation, route }) => {
  // courseId is optional - if not provided, show discussions from all enrolled courses
  const courseId = route.params?.courseId || null;
  const { user } = useContext(AuthContext);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);

  useEffect(() => {
    if (courseId) {
      fetchDiscussions();
    } else {
      fetchAllDiscussions();
    }
  }, [courseId]);

  // When no courseId, fetch discussions from all enrolled courses (students) or instructor's courses (instructors)
  const fetchAllDiscussions = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      let ids = [];

      if (user.role === 'instructor') {
        // For instructors, get their courses
        const coursesRes = await discussionService.getInstructorCourses(user.id);
        const courses = coursesRes.data || [];
        ids = courses.map(c => c._id).filter(Boolean);
      } else {
        // For students, get enrolled courses
        const enrollmentRes = await analyticsService.getMyEnrollments(1, 50);
        const enrollments = enrollmentRes.data || [];
        ids = enrollments.map(e => e.courseId?._id || e.courseId).filter(Boolean);
      }
      
      setEnrolledCourseIds(ids);

      if (ids.length === 0) {
        setDiscussions([]);
        setError(null);
        return;
      }

      // Fetch discussions for each course (up to first 5 to avoid too many requests)
      const discussionPromises = ids.slice(0, 5).map(cId =>
        discussionService.getDiscussionsByCourse(cId, 1, 10).catch(() => ({ data: [] }))
      );
      const results = await Promise.all(discussionPromises);
      const allDiscussions = results.flatMap(r => r.data || []);

      // Sort by newest first
      allDiscussions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setDiscussions(allDiscussions);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load discussions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDiscussions = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await discussionService.getDiscussionsByCourse(courseId, 1, 50);
      setDiscussions(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load discussions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (courseId) fetchDiscussions(true);
    else fetchAllDiscussions(true);
  };

  const renderDiscussionCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DiscussionDetail', { discussionId: item._id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color={colors.white} />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.userId?.name || 'User'}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {item.isPinned && (
          <View style={styles.pinnedBadge}>
            <Ionicons name="pin" size={12} color={colors.white} />
            <Text style={styles.pinnedText}>Pinned</Text>
          </View>
        )}
      </View>

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.content} numberOfLines={3}>{item.content}</Text>

      {!courseId && item.courseId?.title && (
        <View style={styles.courseBadge}>
          <Ionicons name="book-outline" size={12} color={colors.primary} />
          <Text style={styles.courseBadgeText}>{item.courseId.title}</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.statText}>{item.replyCount || 0} replies</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons
            name={item.likes?.includes(user.id) ? 'heart' : 'heart-outline'}
            size={16}
            color={item.likes?.includes(user.id) ? colors.danger : colors.textSecondary}
          />
          <Text style={styles.statText}>{item.likes?.length || 0} likes</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorView message={error} onRetry={handleRefresh} />;

  return (
    <View style={styles.container}>
      {!courseId && (
        <View style={styles.headerBanner}>
          <Ionicons name="chatbubbles" size={18} color={colors.primary} />
          <Text style={styles.headerBannerText}>
            {user.role === 'instructor' ? 'Discussions from your courses' : 'Discussions from your enrolled courses'}
          </Text>
        </View>
      )}

      <FlatList
        data={discussions}
        renderItem={renderDiscussionCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            message={
              courseId
                ? 'No discussions yet. Start the conversation!'
                : 'No discussions found. Enroll in courses to see discussions.'
            }
            icon="chatbubbles-outline"
          />
        }
      />

      {courseId && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddDiscussion', { courseId })}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary + '30',
  },
  headerBannerText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pinnedText: {
    fontSize: 11,
    color: colors.white,
    marginLeft: 3,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  courseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 10,
  },
  courseBadgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default DiscussionBoardScreen;
