import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, Modal, TextInput
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

const GoalSettingScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'academic',
    targetDate: new Date(),
    priority: 'medium',
    milestones: []
  });

  const [newMilestone, setNewMilestone] = useState('');

  const categories = [
    { id: 'academic', label: 'Academic', icon: 'school', color: PRIMARY },
    { id: 'personal', label: 'Personal', icon: 'person', color: '#FF6B6B' },
    { id: 'health', label: 'Health', icon: 'fitness', color: SUCCESS },
    { id: 'career', label: 'Career', icon: 'briefcase', color: '#FFB347' },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal', color: '#888' }
  ];

  const priorities = [
    { id: 'low', label: 'Low', color: '#888' },
    { id: 'medium', label: 'Medium', color: WARNING },
    { id: 'high', label: 'High', color: DANGER }
  ];

  const statuses = [
    { id: 'all', label: 'All' },
    { id: 'not-started', label: 'Not Started' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' }
  ];

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const statusParam = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const [goalsRes, statsRes] = await Promise.all([
        api.get(`/goals/my-goals${statusParam}`),
        api.get('/goals/stats')
      ]);

      setGoals(goalsRes.data.data || []);
      setStats(statsRes.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load goals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    try {
      const payload = {
        ...formData,
        milestones: formData.milestones.map(m => ({ title: m, completed: false }))
      };

      if (editingGoal) {
        await api.put(`/goals/${editingGoal._id}`, payload);
        Alert.alert('Success', 'Goal updated!');
      } else {
        await api.post('/goals', payload);
        Alert.alert('Success', 'Goal created!');
      }

      resetForm();
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save goal');
    }
  };

  const resetForm = () => {
    setModalVisible(false);
    setEditingGoal(null);
    setFormData({
      title: '',
      description: '',
      category: 'academic',
      targetDate: new Date(),
      priority: 'medium',
      milestones: []
    });
    setNewMilestone('');
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      targetDate: new Date(goal.targetDate),
      priority: goal.priority,
      milestones: goal.milestones.map(m => m.title)
    });
    setModalVisible(true);
  };

  const handleDelete = (goalId) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/goals/${goalId}`);
              Alert.alert('Success', 'Goal deleted');
              fetchData();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete goal');
            }
          }
        }
      ]
    );
  };

  const toggleMilestone = async (goalId, milestoneId) => {
    try {
      await api.put(`/goals/${goalId}/milestones/${milestoneId}/toggle`);
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to update milestone');
    }
  };

  const addMilestone = () => {
    if (newMilestone.trim()) {
      setFormData(prev => ({
        ...prev,
        milestones: [...prev.milestones, newMilestone.trim()]
      }));
      setNewMilestone('');
    }
  };

  const removeMilestone = (index) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return SUCCESS;
      case 'in-progress': return PRIMARY;
      case 'not-started': return '#888';
      default: return '#888';
    }
  };

  const getPriorityColor = (priority) => {
    return priorities.find(p => p.id === priority)?.color || '#888';
  };

  const getCategoryIcon = (category) => {
    return categories.find(c => c.id === category)?.icon || 'ellipsis-horizontal';
  };

  const getCategoryColor = (category) => {
    return categories.find(c => c.id === category)?.color || '#888';
  };

  if (loading) return <LoadingSpinner text="Loading goals..." />;
  if (error) return <ErrorView message={error} onRetry={fetchData} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Goal Setting</Text>
        <Text style={styles.headerSubtitle}>Track your learning goals</Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            colors={[PRIMARY]}
          />
        }
      >
        {stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Progress</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total Goals</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: SUCCESS }]}>{stats.completed}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: PRIMARY }]}>{stats.inProgress}</Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: DANGER }]}>{stats.overdue}</Text>
                <Text style={styles.statLabel}>Overdue</Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${stats.averageProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(stats.averageProgress)}% Average Progress</Text>
            </View>
          </View>
        )}

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {statuses.map(status => (
              <TouchableOpacity
                key={status.id}
                style={[
                  styles.filterChip,
                  filterStatus === status.id && styles.filterChipActive
                ]}
                onPress={() => setFilterStatus(status.id)}
              >
                <Text style={[
                  styles.filterLabel,
                  filterStatus === status.id && styles.filterLabelActive
                ]}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Create New Goal</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          {goals.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="flag-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No goals yet</Text>
              <Text style={styles.emptySubtext}>Create your first goal to get started!</Text>
            </View>
          ) : (
            goals.map((goal) => (
              <View key={goal._id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={styles.goalHeaderLeft}>
                    <Ionicons
                      name={getCategoryIcon(goal.category)}
                      size={24}
                      color={getCategoryColor(goal.category)}
                    />
                    <View style={styles.goalTitleContainer}>
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                      <Text style={styles.goalCategory}>{goal.category}</Text>
                    </View>
                  </View>
                  <View style={styles.goalActions}>
                    <TouchableOpacity onPress={() => handleEdit(goal)}>
                      <Ionicons name="create-outline" size={20} color={PRIMARY} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(goal._id)}>
                      <Ionicons name="trash-outline" size={20} color={DANGER} />
                    </TouchableOpacity>
                  </View>
                </View>

                {goal.description && (
                  <Text style={styles.goalDescription}>{goal.description}</Text>
                )}

                <View style={styles.goalMeta}>
                  <View style={[styles.badge, { backgroundColor: getStatusColor(goal.status) + '20' }]}>
                    <Text style={[styles.badgeText, { color: getStatusColor(goal.status) }]}>
                      {goal.status.replace('-', ' ')}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: getPriorityColor(goal.priority) + '20' }]}>
                    <Text style={[styles.badgeText, { color: getPriorityColor(goal.priority) }]}>
                      {goal.priority} priority
                    </Text>
                  </View>
                  <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={14} color="#888" />
                    <Text style={styles.dateText}>
                      {new Date(goal.targetDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${goal.progress}%` }]} />
                  </View>
                  <Text style={styles.progressPercentage}>{goal.progress}%</Text>
                </View>

                {goal.milestones && goal.milestones.length > 0 && (
                  <View style={styles.milestonesContainer}>
                    <Text style={styles.milestonesTitle}>Milestones:</Text>
                    {goal.milestones.map((milestone) => (
                      <TouchableOpacity
                        key={milestone._id}
                        style={styles.milestoneItem}
                        onPress={() => toggleMilestone(goal._id, milestone._id)}
                      >
                        <Ionicons
                          name={milestone.completed ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={milestone.completed ? SUCCESS : '#888'}
                        />
                        <Text style={[
                          styles.milestoneText,
                          milestone.completed && styles.milestoneCompleted
                        ]}>
                          {milestone.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={resetForm}
      >
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={resetForm}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingGoal ? 'Edit Goal' : 'Create Goal'}
            </Text>
            <TouchableOpacity onPress={handleSubmit}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Goal Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter goal title"
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your goal"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryContainer}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    formData.category === cat.id && { backgroundColor: cat.color + '20', borderColor: cat.color }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                >
                  <Ionicons name={cat.icon} size={20} color={cat.color} />
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.priorityContainer}>
              {priorities.map(pri => (
                <TouchableOpacity
                  key={pri.id}
                  style={[
                    styles.priorityChip,
                    formData.priority === pri.id && { backgroundColor: pri.color + '20', borderColor: pri.color }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, priority: pri.id }))}
                >
                  <Text style={[
                    styles.priorityLabel,
                    formData.priority === pri.id && { color: pri.color }
                  ]}>
                    {pri.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Target Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={PRIMARY} />
              <Text style={styles.dateButtonText}>
                {formData.targetDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={formData.targetDate}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setFormData(prev => ({ ...prev, targetDate: selectedDate }));
                  }
                }}
              />
            )}

            <Text style={styles.inputLabel}>Milestones</Text>
            <View style={styles.milestoneInputContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Add a milestone"
                value={newMilestone}
                onChangeText={setNewMilestone}
              />
              <TouchableOpacity style={styles.addMilestoneButton} onPress={addMilestone}>
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {formData.milestones.map((milestone, index) => (
              <View key={index} style={styles.milestoneChip}>
                <Text style={styles.milestoneChipText}>{milestone}</Text>
                <TouchableOpacity onPress={() => removeMilestone(index)}>
                  <Ionicons name="close-circle" size={20} color={DANGER} />
                </TouchableOpacity>
              </View>
            ))}
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
  
  statsCard: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16, elevation: 3 },
  statsTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  
  progressBarContainer: { marginTop: 8 },
  progressBar: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: PRIMARY, borderRadius: 4 },
  progressText: { fontSize: 12, color: '#888', marginTop: 4, textAlign: 'center' },
  
  filterContainer: { paddingHorizontal: 16, marginBottom: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  filterLabel: { fontSize: 14, fontWeight: '500', color: '#1a1a2e' },
  filterLabelActive: { color: '#fff' },
  
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    gap: 8,
  },
  addButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  
  section: { padding: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#888', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#aaa', marginTop: 8 },
  
  goalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  goalHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  goalTitleContainer: { flex: 1 },
  goalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' },
  goalCategory: { fontSize: 12, color: '#888', marginTop: 2, textTransform: 'capitalize' },
  goalActions: { flexDirection: 'row', gap: 12 },
  goalDescription: { fontSize: 14, color: '#666', marginBottom: 12, lineHeight: 20 },
  
  goalMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  dateContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 12, color: '#888' },
  
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  progressPercentage: { fontSize: 12, fontWeight: '600', color: PRIMARY, minWidth: 35 },
  
  milestonesContainer: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  milestonesTitle: { fontSize: 13, fontWeight: '600', color: '#1a1a2e', marginBottom: 8 },
  milestoneItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  milestoneText: { fontSize: 13, color: '#1a1a2e', flex: 1 },
  milestoneCompleted: { textDecorationLine: 'line-through', color: '#888' },
  
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
  
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1a1a2e',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 6,
  },
  categoryLabel: { fontSize: 13, fontWeight: '500', color: '#1a1a2e' },
  
  priorityContainer: { flexDirection: 'row', gap: 8 },
  priorityChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  priorityLabel: { fontSize: 14, fontWeight: '500', color: '#1a1a2e' },
  
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
  dateButtonText: { fontSize: 14, color: '#1a1a2e' },
  
  milestoneInputContainer: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addMilestoneButton: {
    backgroundColor: PRIMARY,
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  milestoneChipText: { fontSize: 13, color: '#1a1a2e', flex: 1 },
});

export default GoalSettingScreen;
