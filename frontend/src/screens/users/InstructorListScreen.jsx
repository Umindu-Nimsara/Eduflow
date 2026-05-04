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
import { instructorService } from '../../services/instructorService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';
import colors from '../../constants/colors';

const InstructorListScreen = ({ navigation }) => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      } else {
        setLoading(true);
      }

      const response = await instructorService.getAllInstructors(isRefresh ? 1 : page, 10);
      
      if (isRefresh) {
        setInstructors(response.data);
      } else {
        setInstructors(prev => page === 1 ? response.data : [...prev, ...response.data]);
      }

      setHasMore(response.pagination.currentPage < response.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load instructors');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchInstructors();
    }
  };

  const renderInstructorCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('InstructorProfile', { instructorId: item._id })}
    >
      <View style={styles.cardContent}>
        {item.profilePhoto ? (
          <Image source={{ uri: item.profilePhoto }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={30} color={colors.textLight} />
          </View>
        )}
        
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.userId?.name}</Text>
            {item.isVerified && (
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            )}
          </View>
          
          {item.expertise && item.expertise.length > 0 && (
            <Text style={styles.expertise} numberOfLines={1}>
              {item.expertise.join(', ')}
            </Text>
          )}
          
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Ionicons name="book-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.statText}>{item.totalCourses} courses</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.statText}>{item.totalStudents} students</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="star" size={16} color={colors.warning} />
              <Text style={styles.statText}>{item.rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && page === 1) {
    return <LoadingSpinner />;
  }

  if (error && instructors.length === 0) {
    return <ErrorView message={error} onRetry={fetchInstructors} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={instructors}
        renderItem={renderInstructorCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchInstructors(true)}
            colors={[colors.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={<EmptyState message="No instructors found" icon="people-outline" />}
        ListFooterComponent={
          loading && page > 1 ? (
            <View style={styles.footerLoader}>
              <LoadingSpinner size="small" />
            </View>
          ) : null
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
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
  },
  avatarPlaceholder: {
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 6,
  },
  expertise: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 4,
  },
  statText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  footerLoader: {
    paddingVertical: 20,
  },
});

export default InstructorListScreen;
