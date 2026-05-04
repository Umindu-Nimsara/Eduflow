import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { assessmentService } from '../../services/assessmentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';
import colors from '../../constants/colors';

const QuizListScreen = ({ navigation, route }) => {
  // courseId is optional - if not provided, show all quizzes
  const courseId = route.params?.courseId || null;
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuizzes();
  }, [courseId]);

  const fetchQuizzes = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await assessmentService.getAllQuizzes(1, 50, courseId);
      setQuizzes(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderQuizCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Quiz', { quizId: item._id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="document-text" size={24} color={colors.primary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          {item.description ? (
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          ) : null}
          {item.courseId?.title ? (
            <Text style={styles.courseName} numberOfLines={1}>
              <Ionicons name="book-outline" size={12} color={colors.primary} /> {item.courseId.title}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>{item.timeLimit || item.duration || 0} min</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="trophy-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>Pass: {item.passingScore}%</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="star-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>{item.totalMarks} marks</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchQuizzes} />;
  }

  return (
    <View style={styles.container}>
      {!courseId && (
        <View style={styles.headerBanner}>
          <Ionicons name="help-circle" size={20} color={colors.primary} />
          <Text style={styles.headerBannerText}>All available quizzes</Text>
        </View>
      )}
      <FlatList
        data={quizzes}
        renderItem={renderQuizCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchQuizzes(true)}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            message={courseId ? "No quizzes for this course yet" : "No quizzes available"}
            icon="document-text-outline"
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
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContent: {
    padding: 16,
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
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  courseName: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
});

export default QuizListScreen;
