import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';

const PRIMARY = '#6C63FF';

const AnnouncementCard = ({ announcement, onEdit, onDelete, onToggleActive }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{announcement.title}</Text>
        <Text style={styles.cardMeta}>
          By: {announcement.createdBy?.name || 'Unknown'} • {new Date(announcement.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: announcement.isActive ? '#43C67820' : '#FF658420' }]}>
        <Text style={[styles.badgeText, { color: announcement.isActive ? '#43C678' : '#FF6584' }]}>
          {announcement.isActive ? 'Active' : 'Inactive'}
        </Text>
      </View>
    </View>

    <Text style={styles.cardContent} numberOfLines={3}>{announcement.content}</Text>

    <View style={styles.cardFooter}>
      <View style={styles.tagContainer}>
        <View style={[styles.tag, { backgroundColor: PRIMARY + '20' }]}>
          <Text style={[styles.tagText, { color: PRIMARY }]}>
            {announcement.targetRole === 'all' ? 'All Users' : announcement.targetRole.charAt(0).toUpperCase() + announcement.targetRole.slice(1)}
          </Text>
        </View>
        {announcement.courseId && (
          <View style={[styles.tag, { backgroundColor: '#FFB34720' }]}>
            <Text style={[styles.tagText, { color: '#FFB347' }]}>
              {announcement.courseId.title || 'Course'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onToggleActive(announcement)} style={styles.actionBtn}>
          <Ionicons name={announcement.isActive ? 'eye-off-outline' : 'eye-outline'} size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onEdit(announcement)} style={styles.actionBtn}>
          <Ionicons name="create-outline" size={20} color={PRIMARY} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(announcement._id)} style={styles.actionBtn}>
          <Ionicons name="trash-outline" size={20} color="#FF6584" />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const AdminAnnouncementsScreen = ({ navigation }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetRole: 'all',
    isActive: true,
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      console.log('Fetching announcements from:', `${ENDPOINTS.ANNOUNCEMENTS}/admin/all`);
      const res = await api.get(`${ENDPOINTS.ANNOUNCEMENTS}/admin/all`);
      console.log('Announcements response:', res.data);
      
      setAnnouncements(res.data.data);
      setError(null);
    } catch (err) {
      console.error('Fetch announcements error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreate = () => {
    setEditingAnnouncement(null);
    setFormData({ title: '', content: '', targetRole: 'all', isActive: true });
    setModalVisible(true);
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      targetRole: announcement.targetRole,
      isActive: announcement.isActive,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      if (editingAnnouncement) {
        await api.put(`${ENDPOINTS.ANNOUNCEMENTS}/${editingAnnouncement._id}`, formData);
        Alert.alert('Success', 'Announcement updated successfully');
      } else {
        await api.post(ENDPOINTS.ANNOUNCEMENTS, formData);
        Alert.alert('Success', 'Announcement created successfully');
      }
      setModalVisible(false);
      fetchAnnouncements();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save announcement');
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Announcement',
      'Are you sure you want to delete this announcement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`${ENDPOINTS.ANNOUNCEMENTS}/${id}`);
              Alert.alert('Success', 'Announcement deleted successfully');
              fetchAnnouncements();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete announcement');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (announcement) => {
    try {
      await api.put(`${ENDPOINTS.ANNOUNCEMENTS}/${announcement._id}`, {
        ...announcement,
        isActive: !announcement.isActive,
      });
      Alert.alert('Success', `Announcement ${!announcement.isActive ? 'activated' : 'deactivated'} successfully`);
      fetchAnnouncements();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update announcement');
    }
  };

  if (loading) return <LoadingSpinner text="Loading announcements..." />;
  if (error) return <ErrorView message={error} onRetry={fetchAnnouncements} />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Announcements</Text>
          <Text style={styles.headerSub}>{announcements.length} total</Text>
        </View>
        <TouchableOpacity onPress={handleCreate} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchAnnouncements(true)} colors={[PRIMARY]} />
        }
      >
        {announcements.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No announcements yet</Text>
            <TouchableOpacity onPress={handleCreate} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Create First Announcement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement._id}
              announcement={announcement}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Enter announcement title"
                maxLength={100}
              />

              <Text style={styles.label}>Content *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.content}
                onChangeText={(text) => setFormData({ ...formData, content: text })}
                placeholder="Enter announcement content"
                multiline
                numberOfLines={6}
                maxLength={2000}
              />

              <Text style={styles.label}>Target Audience</Text>
              <View style={styles.radioGroup}>
                {['all', 'student', 'instructor'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={styles.radioOption}
                    onPress={() => setFormData({ ...formData, targetRole: role })}
                  >
                    <View style={styles.radio}>
                      {formData.targetRole === role && <View style={styles.radioSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>
                      {role === 'all' ? 'All Users' : role.charAt(0).toUpperCase() + role.slice(1) + 's'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Active</Text>
                <TouchableOpacity
                  onPress={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  style={[styles.switch, formData.isActive && styles.switchActive]}
                >
                  <View style={[styles.switchThumb, formData.isActive && styles.switchThumbActive]} />
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>
                  {editingAnnouncement ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: PRIMARY, padding: 16, flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 12, color: '#ffffff99', marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff30', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 12, padding: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 },
  cardMeta: { fontSize: 12, color: '#888' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardContent: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tagContainer: { flexDirection: 'row', gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 11, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 16, marginBottom: 24 },
  emptyBtn: { backgroundColor: PRIMARY, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: '#00000050', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  modalBody: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 8 },
  input: { backgroundColor: '#f8f8f8', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 16, borderWidth: 1, borderColor: '#eee' },
  textArea: { height: 120, textAlignVertical: 'top' },
  radioGroup: { marginBottom: 16 },
  radioOption: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: PRIMARY, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  radioSelected: { width: 10, height: 10, borderRadius: 5, backgroundColor: PRIMARY },
  radioLabel: { fontSize: 14, color: '#555' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  switch: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#ddd', padding: 2 },
  switchActive: { backgroundColor: PRIMARY },
  switchThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  switchThumbActive: { transform: [{ translateX: 22 }] },
  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#eee', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#555' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: PRIMARY, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

export default AdminAnnouncementsScreen;
