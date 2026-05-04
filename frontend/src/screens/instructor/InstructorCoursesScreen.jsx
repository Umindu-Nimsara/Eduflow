import React, { useState, useEffect, useContext } from 'react';
import { formatCoursePrice } from '../../utils/priceFormatter';
import {
  View, Text, FlatList, TouchableOpacity,
  Image, StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';

const PRIMARY = '#6C63FF';

const InstructorCoursesScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [courses,    setCourses]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      // Use courses endpoint with instructor filter - user.id is the instructorId in Course model
      const res = await api.get(`${ENDPOINTS.COURSES}/instructor/${user.id}`);
      setCourses(res.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (courseId, title) => {
    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`${ENDPOINTS.COURSES}/${courseId}`);
              setCourses(prev => prev.filter(c => c._id !== courseId));
              Alert.alert('Deleted', 'Course deleted successfully');
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const handlePublishToggle = async (course) => {
    try {
      await api.put(`${ENDPOINTS.COURSES}/${course._id}`, {
        isPublished: !course.isPublished,
      });
      setCourses(prev => prev.map(c =>
        c._id === course._id ? { ...c, isPublished: !c.isPublished } : c
      ));
    } catch (err) {
      Alert.alert('Error', 'Failed to update course status');
    }
  };

  const renderCourse = ({ item }) => (
    <View style={styles.card}>
      {item.thumbnail ? (
        <Image source={{ uri: item.thumbnail }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Ionicons name="book" size={28} color="#fff" />
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.isPublished ? '#43C67820' : '#FFB34720' }]}>
            <Text style={[styles.statusText, { color: item.isPublished ? '#43C678' : '#FFB347' }]}>
              {item.isPublished ? 'Published' : 'Draft'}
            </Text>
          </View>
        </View>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.price}>{formatCoursePrice(item)}</Text>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('InstructorCourseDetail', { courseId: item._id })}
          >
            <Ionicons name="eye-outline" size={16} color={PRIMARY} />
            <Text style={[styles.actionText, { color: PRIMARY }]}>Manage</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('ManageLessons', { courseId: item._id, courseTitle: item.title })}
          >
            <Ionicons name="play-circle-outline" size={16} color="#43C678" />
            <Text style={[styles.actionText, { color: '#43C678' }]}>Lessons</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('EditCourse', { courseId: item._id, course: item })}
          >
            <Ionicons name="create-outline" size={16} color="#FFB347" />
            <Text style={[styles.actionText, { color: '#FFB347' }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleDelete(item._id, item.title)}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
            <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) return <LoadingSpinner text="Loading your courses..." />;
  if (error)   return <ErrorView message={error} onRetry={fetchCourses} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={courses}
        keyExtractor={item => item._id}
        renderItem={renderCourse}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchCourses(true)} colors={[PRIMARY]} />}
        ListEmptyComponent={
          <EmptyState
            icon="book-outline"
            title="No courses yet"
            description="Create your first course to start teaching"
            actionLabel="Create Course"
            onAction={() => navigation.navigate('CreateCourse')}
          />
        }
      />
      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateCourse')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  list:      { padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, marginBottom: 16,
    overflow: 'hidden', elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8,
  },
  thumb:            { width: '100%', height: 140, backgroundColor: '#E8E8F0' },
  thumbPlaceholder: { backgroundColor: PRIMARY + 'CC', justifyContent: 'center', alignItems: 'center' },
  cardContent:  { padding: 14 },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  title:        { flex: 1, fontSize: 15, fontWeight: 'bold', color: '#1a1a2e', marginRight: 8 },
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText:   { fontSize: 11, fontWeight: '700' },
  category:     { fontSize: 12, color: '#888', marginBottom: 4 },
  price:        { fontSize: 14, fontWeight: 'bold', color: PRIMARY, marginBottom: 12 },
  actions:      { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  actionBtn:    { flexDirection: 'row', alignItems: 'center' },
  actionText:   { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8,
  },
});

export default InstructorCoursesScreen;
