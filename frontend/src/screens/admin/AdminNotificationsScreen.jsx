import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, Modal, TextInput, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';

const PRIMARY = '#6C63FF';

const NOTIFICATION_TYPES = [
  { value: 'course_update', label: 'Course Update', icon: 'book', color: '#43C678' },
  { value: 'quiz_result', label: 'Quiz Result', icon: 'checkmark-circle', color: '#FFB347' },
  { value: 'assignment_graded', label: 'Assignment Graded', icon: 'document-text', color: '#9C88FF' },
  { value: 'discussion_reply', label: 'Discussion Reply', icon: 'chatbubbles', color: '#26D0CE' },
  { value: 'enrollment_confirmed', label: 'Enrollment Confirmed', icon: 'school', color: '#43C678' },
  { value: 'certificate_issued', label: 'Certificate Issued', icon: 'ribbon', color: '#FFB347' },
  { value: 'announcement', label: 'Announcement', icon: 'megaphone', color: '#FF6584' },
];

const NotificationCard = ({ notification, onDelete }) => {
  const typeInfo = NOTIFICATION_TYPES.find(t => t.value === notification.type) || NOTIFICATION_TYPES[0];
  
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: typeInfo.color + '20' }]}>
          <Ionicons name={typeInfo.icon} size={20} color={typeInfo.color} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.cardTitle}>{notification.title}</Text>
          <Text style={styles.cardUser}>
            To: {notification.userId?.name || 'Unknown'} ({notification.userId?.email || 'N/A'})
          </Text>
          <Text style={styles.cardMeta}>
            {new Date(notification.createdAt).toLocaleString()} • {typeInfo.label}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: notification.isRead ? '#43C67820' : '#FFB34720' }]}>
          <Text style={[styles.statusText, { color: notification.isRead ? '#43C678' : '#FFB347' }]}>
            {notification.isRead ? 'Read' : 'Unread'}
          </Text>
        </View>
      </View>

      <Text style={styles.cardMessage}>{notification.message}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.cardId}>ID: {notification._id.slice(-8)}</Text>
        <TouchableOpacity onPress={() => onDelete(notification._id)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color="#FF6584" />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const AdminNotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [userSearchVisible, setUserSearchVisible] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, unread: 0 });
  const [formData, setFormData] = useState({
    userId: '',
    userName: '',
    title: '',
    message: '',
    type: 'announcement',
  });

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, []);

  const fetchNotifications = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      console.log('Fetching notifications from:', `${ENDPOINTS.NOTIFICATIONS}/admin/all`);
      const res = await api.get(`${ENDPOINTS.NOTIFICATIONS}/admin/all`);
      console.log('Notifications response:', res.data);
      
      setNotifications(res.data.data);
      setStats({ total: res.data.pagination.total, unread: res.data.unreadTotal });
      setError(null);
    } catch (err) {
      console.error('Fetch notifications error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get(ENDPOINTS.USERS);
      setUsers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleCreate = () => {
    setFormData({ userId: '', userName: '', title: '', message: '', type: 'announcement' });
    setModalVisible(true);
  };

  const handleSelectUser = (user) => {
    setFormData({ ...formData, userId: user._id, userName: user.name });
    setUserSearchVisible(false);
    setUserSearch('');
  };

  const handleSave = async () => {
    if (!formData.userId || !formData.title.trim() || !formData.message.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await api.post(`${ENDPOINTS.NOTIFICATIONS}/admin/create`, {
        userId: formData.userId,
        title: formData.title,
        message: formData.message,
        type: formData.type,
      });
      Alert.alert('Success', 'Notification created successfully');
      setModalVisible(false);
      fetchNotifications();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create notification');
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`${ENDPOINTS.NOTIFICATIONS}/${id}`);
              Alert.alert('Success', 'Notification deleted successfully');
              fetchNotifications();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete notification');
            }
          },
        },
      ]
    );
  };

  const handleBulkDelete = () => {
    Alert.alert(
      'Bulk Delete',
      'Delete all read notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const readIds = notifications.filter(n => n.isRead).map(n => n._id);
              if (readIds.length === 0) {
                Alert.alert('Info', 'No read notifications to delete');
                return;
              }
              await api.delete(`${ENDPOINTS.NOTIFICATIONS}/admin/bulk-delete`, { data: { notificationIds: readIds } });
              Alert.alert('Success', `${readIds.length} notifications deleted`);
              fetchNotifications();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete notifications');
            }
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) return <LoadingSpinner text="Loading notifications..." />;
  if (error) return <ErrorView message={error} onRetry={fetchNotifications} />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSub}>{stats.total} total • {stats.unread} unread</Text>
        </View>
        <TouchableOpacity onPress={handleBulkDelete} style={styles.bulkBtn}>
          <Ionicons name="trash" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCreate} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchNotifications(true)} colors={[PRIMARY]} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <TouchableOpacity onPress={handleCreate} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Create First Notification</Text>
            </TouchableOpacity>
          </View>
        ) : (
          notifications.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onDelete={handleDelete}
            />
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Notification</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Select User *</Text>
              <TouchableOpacity
                style={styles.userSelector}
                onPress={() => setUserSearchVisible(true)}
              >
                <Text style={formData.userName ? styles.userSelected : styles.userPlaceholder}>
                  {formData.userName || 'Tap to select user'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#888" />
              </TouchableOpacity>

              <Text style={styles.label}>Notification Type *</Text>
              <View style={styles.typeGrid}>
                {NOTIFICATION_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeCard,
                      formData.type === type.value && { borderColor: type.color, borderWidth: 2 }
                    ]}
                    onPress={() => setFormData({ ...formData, type: type.value })}
                  >
                    <Ionicons name={type.icon} size={24} color={type.color} />
                    <Text style={styles.typeLabel}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Enter notification title"
                maxLength={100}
              />

              <Text style={styles.label}>Message *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.message}
                onChangeText={(text) => setFormData({ ...formData, message: text })}
                placeholder="Enter notification message"
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* User Search Modal */}
      <Modal visible={userSearchVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select User</Text>
              <TouchableOpacity onPress={() => setUserSearchVisible(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#888" />
              <TextInput
                style={styles.searchInput}
                value={userSearch}
                onChangeText={setUserSearch}
                placeholder="Search by name or email"
              />
            </View>

            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userItem}
                  onPress={() => handleSelectUser(item)}
                >
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                  </View>
                  <View style={[styles.roleBadge, { backgroundColor: PRIMARY + '20' }]}>
                    <Text style={[styles.roleText, { color: PRIMARY }]}>{item.role}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
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
  bulkBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffffff30', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff30', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 12, padding: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 },
  cardUser: { fontSize: 13, color: '#555', marginBottom: 2 },
  cardMeta: { fontSize: 11, color: '#888' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '600' },
  cardMessage: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardId: { fontSize: 11, color: '#aaa' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deleteBtnText: { fontSize: 13, color: '#FF6584', fontWeight: '600' },
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
  userSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: 8, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#eee' },
  userSelected: { fontSize: 14, color: '#1a1a2e', fontWeight: '500' },
  userPlaceholder: { fontSize: 14, color: '#aaa' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeCard: { width: '31%', backgroundColor: '#f8f8f8', borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  typeLabel: { fontSize: 10, color: '#555', marginTop: 6, textAlign: 'center' },
  input: { backgroundColor: '#f8f8f8', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 16, borderWidth: 1, borderColor: '#eee' },
  textArea: { height: 100, textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#eee', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#555' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: PRIMARY, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8f8', margin: 20, marginTop: 0, padding: 12, borderRadius: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  userAvatarText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  userName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 2 },
  userEmail: { fontSize: 12, color: '#888' },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  roleText: { fontSize: 11, fontWeight: '600' },
});

export default AdminNotificationsScreen;
