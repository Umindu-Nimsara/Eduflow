import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const PRIMARY = '#6C63FF';

const ManageQuizzesScreen = ({ route, navigation }) => {
  const { courseId } = route.params;
  const [quizzes,    setQuizzes]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchQuizzes(); }, []);

  const fetchQuizzes = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const res = await api.get(`${ENDPOINTS.QUIZZES}?courseId=${courseId}`);
      setQuizzes(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleDelete = (quizId, title) => {
    Alert.alert('Delete Quiz', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`${ENDPOINTS.QUIZZES}/${quizId}`);
          setQuizzes(prev => prev.filter(q => q._id !== quizId));
        } catch (err) { Alert.alert('Error', 'Failed to delete quiz'); }
      }},
    ]);
  };

  const handleTogglePublish = async (quiz) => {
    try {
      await api.put(`${ENDPOINTS.QUIZZES}/${quiz._id}`, { isPublished: !quiz.isPublished });
      setQuizzes(prev => prev.map(q => q._id === quiz._id ? { ...q, isPublished: !q.isPublished } : q));
    } catch (err) { Alert.alert('Error', 'Failed to update quiz'); }
  };

  const renderQuiz = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Ionicons name="document-text" size={22} color={PRIMARY} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>
            {item.timeLimit} min · Pass: {item.passingScore}% · {item.totalMarks} marks
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.isPublished ? '#43C67820' : '#FFB34720' }]}>
          <Text style={[styles.statusText, { color: item.isPublished ? '#43C678' : '#FFB347' }]}>
            {item.isPublished ? 'Live' : 'Draft'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('CreateQuiz', { quizId: item._id, courseId })}
        >
          <Ionicons name="help-circle-outline" size={15} color={PRIMARY} />
          <Text style={[styles.actionText, { color: PRIMARY }]}>Questions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleTogglePublish(item)}
        >
          <Ionicons name={item.isPublished ? 'eye-off-outline' : 'checkmark-circle-outline'} size={15} color="#43C678" />
          <Text style={[styles.actionText, { color: '#43C678' }]}>
            {item.isPublished ? 'Unpublish' : 'Publish'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleDelete(item._id, item.title)}
        >
          <Ionicons name="trash-outline" size={15} color="#EF4444" />
          <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={quizzes}
        keyExtractor={item => item._id}
        renderItem={renderQuiz}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchQuizzes(true)} colors={[PRIMARY]} />}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="No quizzes yet"
            description="Create your first quiz for this course"
            actionLabel="Create Quiz"
            onAction={() => navigation.navigate('CreateQuiz', { courseId })}
          />
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateQuiz', { courseId })}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  list:      { padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconCircle:  { width: 40, height: 40, borderRadius: 20, backgroundColor: PRIMARY + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  info:        { flex: 1 },
  title:       { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  meta:        { fontSize: 12, color: '#888', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText:  { fontSize: 11, fontWeight: '700' },
  actions:     { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  actionBtn:   { flexDirection: 'row', alignItems: 'center' },
  actionText:  { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8,
  },
});

export default ManageQuizzesScreen;
