import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
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

const CompletedCoursesScreen = ({ navigation }) => {
  const [completedCourses, setCompletedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompletedCourses();
  }, []);

  const fetchCompletedCourses = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Get all enrollments and filter completed ones (100%)
      const response = await analyticsService.getMyEnrollments(1, 100);
      const allEnrollments = response.data || [];
      
      // Filter only 100% completed courses
      const completed = allEnrollments.filter(
        enrollment => (enrollment.progress || enrollment.completionPercentage || 0) === 100
      );
      
      setCompletedCourses(completed);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load completed courses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderCompletedCourseCard = ({ item }) => {
    const course = item.course || item.courseId || {};
    const courseIdValue = course._id || item.courseId;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('CourseDetail', {
          courseId: courseIdValue,
          isEnrolled: true,
        })}
      >
        {course.thumbnail ? (
          <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
            <Ionicons name="book-outline" size={40} color={colors.textLight} />
          </View>
        )}

        <View style={styles.cardContent}>
          {/* Completed Badge */}
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#43C678" />
            <Text style={styles.completedText}>Completed</Text>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {course.title || 'Course'}
          </Text>

          {course.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{course.category}</Text>
            </View>
          )}

          <View style={styles.cardFooter}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.infoText}>
                Enrolled: {new Date(item.enrolledAt).toLocaleDateString()}
              </Text>
            </View>

            {item.completedAt && (
              <View style={styles.infoRow}>
                <Ionicons name="trophy-outline" size={14} color="#FFB347" />
                <Text style={styles.infoText}>
                  Completed: {new Date(item.completedAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Certificate')}
            >
              <Ionicons name="ribbon-outline" size={18} color="#6C63FF" />
              <Text style={styles.actionBtnText}>Certificate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary]}
              onPress={() => navigation.navigate('Feedback', { courseId: courseIdValue })}
            >
              <Ionicons name="star-outline" size={18} color="#FFB347" />
              <Text style={styles.actionBtnText}>Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorView message={error} onRetry={fetchCompletedCourses} />;

  return (
    <View style={styles.container}>
      {/* Summary Header */}
      {completedCourses.length > 0 && (
        <View style={styles.summaryHeader}>
          <View style={styles.summaryIcon}>
            <Ionicons name="trophy" size={32} color="#FFB347" />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryValue}>{completedCourses.length}</Text>
            <Text style={styles.summaryLabel}>
              Course{completedCourses.length !== 1 ? 's' : ''} Completed
            </Text>
          </View>
          <View style={styles.celebrationIcon}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
          </View>
        </View>
      )}

      <FlatList
        data={completedCourses}
        renderItem={renderCompletedCourseCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchCompletedCourses(true)}
            colors={['#43C678']}
          />
        }
        ListEmptyComponent={
          <EmptyState
            message="You haven't completed any courses yet"
            icon="school-outline"
            description="Keep learning to complete your first course!"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  summaryHeader: {
    backgroundColor: '#43C67815',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#43C67830',
  },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#43C678',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    marginTop: 2,
  },
  celebrationIcon: {
    marginLeft: 12,
  },
  celebrationEmoji: {
    fontSize: 32,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: '#43C67820',
  },
  thumbnail: {
    width: '100%',
    height: 140,
    backgroundColor: colors.gray[100],
  },
  placeholderThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 16,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#43C67820',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  completedText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#43C678',
    marginLeft: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#6C63FF20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C63FF',
  },
  cardFooter: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#6C63FF10',
    borderRadius: 8,
    marginRight: 8,
  },
  actionBtnSecondary: {
    backgroundColor: '#FFB34710',
    marginRight: 0,
    marginLeft: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 6,
  },
});

export default CompletedCoursesScreen;
