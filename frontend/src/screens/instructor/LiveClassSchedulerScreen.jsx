import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, Modal, TextInput, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';

const PRIMARY = '#6C63FF';
const SUCCESS = '#43C678';
const WARNING = '#FFB347';
const DANGER = '#EF4444';

const LiveClassSchedulerScreen = ({ route, navigation }) => {
  const { courseId, courseName } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const [liveClasses, setLiveClasses] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledDate: new Date(),
    duration: '60',
    meetingLink: '',
    meetingId: '',
    meetingPassword: '',
    platform: 'zoom',
    maxParticipants: '100'
  });

  const platforms = [
    { id: 'zoom', label: 'Zoom', icon: 'videocam', color: '#2D8CFF' },
    { id: 'google-meet', label: 'Google Meet', icon: 'logo-google', color: '#34A853' },
    { id: 'microsoft-teams', label: 'MS Teams', icon: 'people', color: '#5B5FC7' },
    { id: 'other', label: 'Other', icon: 'link', color: '#6B7280' }
  ];

  useEffect(() => {
    fetchLiveClasses();
  }, [courseId]);

  const fetchLiveClasses = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [allRes, upcomingRes] = await Promise.all([
        api.get(`/live-classes/course/${courseId}`),
        api.get(`/live-classes/course/${courseId}?upcoming=true`)
      ]);

      setLiveClasses(allRes.data.data || []);
      setUpcomingClasses(upcomingRes.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load live classes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openCreateModal = () => {
    setEditingClass(null);
    setFormData({
      title: '',
      description: '',
      scheduledDate: new Date(),
      duration: '60',
      meetingLink: '',
      meetingId: '',
      meetingPassword: '',
      platform: 'zoom',
      maxParticipants: '100'
    });
    setModalVisible(true);
  };

  const openEditModal = (liveClass) => {
    setEditingClass(liveClass);
    setFormData({
      title: liveClass.title,
      description: liveClass.description || '',
      scheduledDate: new Date(liveClass.scheduledDate),
      duration: liveClass.duration.toString(),
      meetingLink: liveClass.meetingLink || '',
      meetingId: liveClass.meetingId || '',
      meetingPassword: liveClass.meetingPassword || '',
      platform: liveClass.platform,
      maxParticipants: liveClass.maxParticipants.toString()
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!formData.meetingLink.trim()) {
      Alert.alert('Error', 'Please enter a meeting link');
      return;
    }

    try {
      const data = {
        courseId,
        title: formData.title,
        description: formData.description,
        scheduledDate: formData.scheduledDate,
        duration: parseInt(formData.duration),
        meetingLink: formData.meetingLink,
        meetingId: formData.meetingId,
        meetingPassword: formData.meetingPassword,
        platform: formData.platform,
        maxParticipants: parseInt(formData.maxParticipants)
      };

      if (editingClass) {
        await api.put(`/live-classes/${editingClass._id}`, data);
        Alert.alert('Success', 'Live class updated successfully!');
      } else {
        await api.post('/live-classes', data);
        Alert.alert('Success', 'Live class scheduled successfully!');
      }

      setModalVisible(false);
      fetchLiveClasses();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save live class');
    }
  };

  const handleDelete = (liveClass) => {
    Alert.alert(
      'Delete Live Class',
      `Delete "${liveClass.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/live-classes/${liveClass._id}`);
              Alert.alert('Success', 'Live class deleted');
              fetchLiveClasses();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete live class');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return PRIMARY;
      case 'live': return SUCCESS;
      case 'completed': return '#6B7280';
      case 'cancelled': return DANGER;
      default: return '#888';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return 'calendar';
      case 'live': return 'radio-button-on';
      case 'completed': return 'checkmark-circle';
      case 'cancelled': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderLiveClass = (liveClass) => {
    const statusColor = getStatusColor(liveClass.status);
    const statusIcon = getStatusIcon(liveClass.status);
    const platform = platforms.find(p => p.id === liveClass.platform);

    return (
      <View key={liveClass._id} style={styles.classCard}>
        <View style={styles.classHeader}>
          <View style={[styles.platformIcon, { backgroundColor: platform.color + '20' }]}>
            <Ionicons name={platform.icon} size={24} color={platform.color} />
          </View>
          <View style={styles.classInfo}>
            <Text style={styles.classTitle}>{liveClass.title}</Text>
            <Text style={styles.classPlatform}>{platform.label}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Ionicons name={statusIcon} size={14} color="#fff" />
            <Text style={styles.statusText}>{liveClass.status}</Text>
          </View>
        </View>

        {liveClass.description && (
          <Text style={styles.classDescription} numberOfLines={2}>
            {liveClass.description}
          </Text>
        )}

        <View style={styles.classDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{formatDate(liveClass.scheduledDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {formatTime(liveClass.scheduledDate)} ({liveClass.duration} min)
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {liveClass.attendees?.length || 0} / {liveClass.maxParticipants}
            </Text>
          </View>
        </View>

        <View style={styles.classActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: PRIMARY }]}
            onPress={() => Alert.alert('Meeting Link', liveClass.meetingLink)}
          >
            <Ionicons name="link-outline" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Link</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: WARNING }]}
            onPress={() => openEditModal(liveClass)}
          >
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: DANGER }]}
            onPress={() => handleDelete(liveClass)}
          >
            <Ionicons name="trash-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return <LoadingSpinner text="Loading live classes..." />;
  if (error) return <ErrorView message={error} onRetry={fetchLiveClasses} />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{courseName}</Text>
        <Text style={styles.headerSubtitle}>Live Class Scheduler</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{upcomingClasses.length}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{liveClasses.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Schedule Button */}
      <TouchableOpacity
        style={styles.scheduleButton}
        onPress={openCreateModal}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.scheduleButtonText}>Schedule Live Class</Text>
      </TouchableOpacity>

      {/* Live Classes List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchLiveClasses(true)}
            colors={[PRIMARY]}
          />
        }
      >
        {liveClasses.length > 0 ? (
          liveClasses.map(renderLiveClass)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="videocam-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No live classes scheduled</Text>
            <Text style={styles.emptySubtext}>Schedule your first live class</Text>
          </View>
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
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
            <Text style={styles.modalTitle}>
              {editingClass ? 'Edit Live Class' : 'Schedule Live Class'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Physics Chapter 5 Review"
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Brief description of the class"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Platform *</Text>
            <View style={styles.platformContainer}>
              {platforms.map(platform => (
                <TouchableOpacity
                  key={platform.id}
                  style={[
                    styles.platformOption,
                    formData.platform === platform.id && {
                      backgroundColor: platform.color + '20',
                      borderColor: platform.color
                    }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, platform: platform.id }))}
                >
                  <Ionicons name={platform.icon} size={20} color={platform.color} />
                  <Text style={styles.platformLabel}>{platform.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Scheduled Date & Time *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={PRIMARY} />
              <Text style={styles.dateButtonText}>
                {formatDate(formData.scheduledDate)} at {formatTime(formData.scheduledDate)}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={formData.scheduledDate}
                mode="datetime"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setFormData(prev => ({ ...prev, scheduledDate: selectedDate }));
                  }
                }}
              />
            )}

            <Text style={styles.inputLabel}>Duration (minutes) *</Text>
            <TextInput
              style={styles.input}
              placeholder="60"
              value={formData.duration}
              onChangeText={(text) => setFormData(prev => ({ ...prev, duration: text }))}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Meeting Link *</Text>
            <TextInput
              style={styles.input}
              placeholder="https://zoom.us/j/..."
              value={formData.meetingLink}
              onChangeText={(text) => setFormData(prev => ({ ...prev, meetingLink: text }))}
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Meeting ID (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="123 456 7890"
              value={formData.meetingId}
              onChangeText={(text) => setFormData(prev => ({ ...prev, meetingId: text }))}
            />

            <Text style={styles.inputLabel}>Meeting Password (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={formData.meetingPassword}
              onChangeText={(text) => setFormData(prev => ({ ...prev, meetingPassword: text }))}
              secureTextEntry
            />

            <Text style={styles.inputLabel}>Max Participants</Text>
            <TextInput
              style={styles.input}
              placeholder="100"
              value={formData.maxParticipants}
              onChangeText={(text) => setFormData(prev => ({ ...prev, maxParticipants: text }))}
              keyboardType="numeric"
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
  
  statsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: PRIMARY },
  statLabel: { fontSize: 13, color: '#888', marginTop: 4 },
  
  scheduleButton: {
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
  scheduleButtonText: { fontSize: 15, fontWeight: '600', color: '#fff', marginLeft: 8 },
  
  listContainer: { flex: 1, paddingHorizontal: 16 },
  classCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  classHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  classInfo: { flex: 1 },
  classTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 2 },
  classPlatform: { fontSize: 13, color: '#888' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: { fontSize: 11, fontWeight: '600', color: '#fff', textTransform: 'capitalize' },
  
  classDescription: { fontSize: 14, color: '#666', marginBottom: 12 },
  
  classDetails: { marginBottom: 12, gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: '#666' },
  
  classActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#888', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#aaa', marginTop: 4 },
  
  // Modal styles
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
  
  platformContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  platformOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 6,
  },
  platformLabel: { fontSize: 13, fontWeight: '500', color: '#1a1a2e' },
  
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  dateButtonText: { fontSize: 15, color: '#1a1a2e' },
});

export default LiveClassSchedulerScreen;
