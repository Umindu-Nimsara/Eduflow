import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, Modal, TextInput, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';

const PRIMARY = '#6C63FF';
const SUCCESS = '#43C678';
const WARNING = '#FFB347';

const ForumScreen = ({ route, navigation }) => {
  const { courseId, courseName } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [posts, setPosts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general'
  });

  const categories = [
    { id: 'general', label: 'General', icon: 'chatbubbles', color: PRIMARY },
    { id: 'homework', label: 'Homework', icon: 'book', color: '#3B82F6' },
    { id: 'exam', label: 'Exam', icon: 'school', color: '#EF4444' },
    { id: 'doubt', label: 'Doubt', icon: 'help-circle', color: WARNING },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' }
  ];

  useEffect(() => {
    fetchPosts();
  }, [courseId]);

  const fetchPosts = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await api.get(`/forums/course/${courseId}`);
      setPosts(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load forum posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      await api.post('/forums', {
        courseId,
        ...formData
      });

      Alert.alert('Success', 'Post created!');
      setModalVisible(false);
      setFormData({ title: '', content: '', category: 'general' });
      fetchPosts();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create post');
    }
  };

  const getCategoryInfo = (categoryId) => {
    return categories.find(c => c.id === categoryId) || categories[0];
  };

  const renderPost = ({ item }) => {
    const category = getCategoryInfo(item.category);

    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() => navigation.navigate('ForumDetail', { postId: item._id })}
        activeOpacity={0.7}
      >
        {item.isPinned && (
          <View style={styles.pinnedBadge}>
            <Ionicons name="pin" size={14} color={WARNING} />
            <Text style={styles.pinnedText}>Pinned</Text>
          </View>
        )}

        <View style={styles.postHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
            <Ionicons name={category.icon} size={20} color={category.color} />
          </View>
          <View style={styles.postInfo}>
            <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.postAuthor}>
              by {item.authorId?.name} • {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <Text style={styles.postContent} numberOfLines={2}>
          {item.content}
        </Text>

        <View style={styles.postFooter}>
          <View style={styles.postStat}>
            <Ionicons name="eye-outline" size={16} color="#888" />
            <Text style={styles.postStatText}>{item.views || 0}</Text>
          </View>
          <View style={styles.postStat}>
            <Ionicons name="chatbubble-outline" size={16} color="#888" />
            <Text style={styles.postStatText}>{item.replies?.length || 0}</Text>
          </View>
          {item.isLocked && (
            <View style={styles.lockedBadge}>
              <Ionicons name="lock-closed" size={14} color="#888" />
              <Text style={styles.lockedText}>Locked</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <LoadingSpinner text="Loading forum..." />;
  if (error) return <ErrorView message={error} onRetry={fetchPosts} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{courseName}</Text>
        <Text style={styles.headerSubtitle}>Discussion Forum</Text>
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.createButtonText}>New Discussion</Text>
      </TouchableOpacity>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchPosts(true)}
            colors={[PRIMARY]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No discussions yet</Text>
            <Text style={styles.emptySubtext}>Start the first discussion!</Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Discussion</Text>
            <TouchableOpacity onPress={handleCreate}>
              <Text style={styles.modalSaveText}>Post</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="What's your question or topic?"
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
            />

            <Text style={styles.inputLabel}>Category *</Text>
            <View style={styles.categoryContainer}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    formData.category === cat.id && {
                      backgroundColor: cat.color + '20',
                      borderColor: cat.color
                    }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                >
                  <Ionicons name={cat.icon} size={18} color={cat.color} />
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Content *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your question or topic in detail..."
              value={formData.content}
              onChangeText={(text) => setFormData(prev => ({ ...prev, content: text }))}
              multiline
              numberOfLines={6}
            />
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: PRIMARY, padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 14,
    borderRadius: 12,
    elevation: 2,
  },
  createButtonText: { fontSize: 15, fontWeight: '600', color: '#fff', marginLeft: 8 },
  
  listContainer: { padding: 16 },
  postCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  pinnedBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4 },
  pinnedText: { fontSize: 12, fontWeight: '600', color: WARNING },
  
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  postInfo: { flex: 1 },
  postTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 4 },
  postAuthor: { fontSize: 12, color: '#888' },
  postContent: { fontSize: 14, color: '#666', marginBottom: 12, lineHeight: 20 },
  
  postFooter: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', gap: 16 },
  postStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postStatText: { fontSize: 13, color: '#888' },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', gap: 4 },
  lockedText: { fontSize: 12, color: '#888' },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#888', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#aaa', marginTop: 4 },
  
  modalContainer: { flex: 1, backgroundColor: '#F5F5F5' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  modalSaveText: { fontSize: 16, fontWeight: '600', color: PRIMARY },
  modalContent: { padding: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1a1a2e',
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 6,
  },
  categoryLabel: { fontSize: 13, fontWeight: '500', color: '#1a1a2e' },
});

export default ForumScreen;
