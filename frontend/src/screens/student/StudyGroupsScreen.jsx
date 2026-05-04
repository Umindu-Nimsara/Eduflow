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

const StudyGroupsScreen = ({ route, navigation }) => {
  const { courseId, courseName } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxMembers: '10',
    isPrivate: false
  });

  useEffect(() => {
    fetchGroups();
  }, [courseId]);

  const fetchGroups = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [allRes, myRes] = await Promise.all([
        api.get(`/study-groups/course/${courseId}`),
        api.get('/study-groups/my-groups')
      ]);

      setGroups(allRes.data.data || []);
      setMyGroups(myRes.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load study groups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter group name');
      return;
    }

    try {
      await api.post('/study-groups', {
        courseId,
        ...formData,
        maxMembers: parseInt(formData.maxMembers)
      });

      Alert.alert('Success', 'Study group created!');
      setModalVisible(false);
      setFormData({ name: '', description: '', maxMembers: '10', isPrivate: false });
      fetchGroups();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create group');
    }
  };

  const handleJoin = async (groupId) => {
    try {
      await api.post(`/study-groups/${groupId}/join`);
      Alert.alert('Success', 'Joined study group!');
      fetchGroups();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to join group');
    }
  };

  const handleLeave = async (groupId) => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/study-groups/${groupId}/leave`);
              Alert.alert('Success', 'Left study group');
              fetchGroups();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to leave group');
            }
          }
        }
      ]
    );
  };

  const isMember = (group) => {
    return myGroups.some(g => g._id === group._id);
  };

  const renderGroup = ({ item }) => {
    const memberCount = item.members?.length || 0;
    const isFull = memberCount >= item.maxMembers;
    const joined = isMember(item);

    return (
      <View style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <View style={styles.groupIcon}>
            <Ionicons name="people" size={24} color={PRIMARY} />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupMembers}>
              {memberCount}/{item.maxMembers} members
            </Text>
          </View>
          {item.isPrivate && (
            <Ionicons name="lock-closed" size={20} color="#888" />
          )}
        </View>

        {item.description && (
          <Text style={styles.groupDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.groupFooter}>
          <Text style={styles.creatorText}>
            Created by {item.createdBy?.name}
          </Text>
          {joined ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
              onPress={() => handleLeave(item._id)}
            >
              <Text style={styles.actionButtonText}>Leave</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: isFull ? '#888' : SUCCESS }
              ]}
              onPress={() => handleJoin(item._id)}
              disabled={isFull}
            >
              <Text style={styles.actionButtonText}>
                {isFull ? 'Full' : 'Join'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) return <LoadingSpinner text="Loading study groups..." />;
  if (error) return <ErrorView message={error} onRetry={fetchGroups} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{courseName}</Text>
        <Text style={styles.headerSubtitle}>Study Groups</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{groups.length}</Text>
          <Text style={styles.statLabel}>Available Groups</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{myGroups.length}</Text>
          <Text style={styles.statLabel}>My Groups</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Create Study Group</Text>
      </TouchableOpacity>

      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchGroups(true)}
            colors={[PRIMARY]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No study groups yet</Text>
            <Text style={styles.emptySubtext}>Create the first group!</Text>
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
            <Text style={styles.modalTitle}>Create Study Group</Text>
            <TouchableOpacity onPress={handleCreate}>
              <Text style={styles.modalSaveText}>Create</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Group Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Physics Study Group"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What is this group about?"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Max Members</Text>
            <TextInput
              style={styles.input}
              placeholder="10"
              value={formData.maxMembers}
              onChangeText={(text) => setFormData(prev => ({ ...prev, maxMembers: text }))}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setFormData(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}
            >
              <Ionicons
                name={formData.isPrivate ? 'checkbox' : 'square-outline'}
                size={24}
                color={PRIMARY}
              />
              <Text style={styles.checkboxLabel}>Make this group private</Text>
            </TouchableOpacity>
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
  
  statsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: PRIMARY },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    elevation: 2,
  },
  createButtonText: { fontSize: 15, fontWeight: '600', color: '#fff', marginLeft: 8 },
  
  listContainer: { padding: 16 },
  groupCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PRIMARY + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  groupMembers: { fontSize: 13, color: '#888', marginTop: 2 },
  groupDescription: { fontSize: 14, color: '#666', marginBottom: 12 },
  groupFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  creatorText: { fontSize: 12, color: '#888' },
  actionButton: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  actionButtonText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  
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
  textArea: { height: 80, textAlignVertical: 'top' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  checkboxLabel: { fontSize: 14, color: '#1a1a2e', marginLeft: 8 },
});

export default StudyGroupsScreen;
