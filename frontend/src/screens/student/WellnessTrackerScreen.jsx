import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';

const PRIMARY = '#6C63FF';
const SUCCESS = '#43C678';
const WARNING = '#FFB347';
const DANGER = '#EF4444';

const WellnessTrackerScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [checks, setChecks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [formData, setFormData] = useState({
    stressLevel: 5,
    mood: 'okay',
    sleepHours: 7,
    studyHours: 4,
    factors: [],
    needsSupport: false
  });

  const moods = [
    { id: 'excellent', label: 'Excellent', icon: 'happy', color: SUCCESS },
    { id: 'good', label: 'Good', icon: 'happy-outline', color: '#43C678' },
    { id: 'okay', label: 'Okay', icon: 'remove-circle-outline', color: WARNING },
    { id: 'bad', label: 'Bad', icon: 'sad-outline', color: '#FF6B6B' },
    { id: 'terrible', label: 'Terrible', icon: 'sad', color: DANGER }
  ];

  const factors = [
    { id: 'exams', label: 'Exams', icon: 'school' },
    { id: 'assignments', label: 'Assignments', icon: 'document-text' },
    { id: 'personal', label: 'Personal', icon: 'person' },
    { id: 'health', label: 'Health', icon: 'fitness' },
    { id: 'family', label: 'Family', icon: 'people' },
    { id: 'social', label: 'Social', icon: 'chatbubbles' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [statsRes, checksRes] = await Promise.all([
        api.get('/wellness/my-stats'),
        api.get('/wellness/my-checks?limit=10')
      ]);

      setStats(statsRes.data.data);
      setChecks(checksRes.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load wellness data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await api.post('/wellness', formData);
      Alert.alert('Success', 'Wellness check recorded!');
      setModalVisible(false);
      setFormData({
        stressLevel: 5,
        mood: 'okay',
        sleepHours: 7,
        studyHours: 4,
        factors: [],
        needsSupport: false
      });
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to record wellness check');
    }
  };

  const toggleFactor = (factorId) => {
    setFormData(prev => ({
      ...prev,
      factors: prev.factors.includes(factorId)
        ? prev.factors.filter(f => f !== factorId)
        : [...prev.factors, factorId]
    }));
  };

  const getStressColor = (level) => {
    if (level <= 3) return SUCCESS;
    if (level <= 6) return WARNING;
    return DANGER;
  };

  if (loading) return <LoadingSpinner text="Loading wellness data..." />;
  if (error) return <ErrorView message={error} onRetry={fetchData} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wellness Tracker</Text>
        <Text style={styles.headerSubtitle}>Track your mental health</Text>
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
          <>
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Your Averages (Last 30 days)</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Ionicons name="alert-circle" size={32} color={getStressColor(stats.averageStress)} />
                  <Text style={styles.statValue}>{stats.averageStress.toFixed(1)}/10</Text>
                  <Text style={styles.statLabel}>Stress Level</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="moon" size={32} color={PRIMARY} />
                  <Text style={styles.statValue}>{stats.averageSleep.toFixed(1)}h</Text>
                  <Text style={styles.statLabel}>Sleep</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="book" size={32} color={SUCCESS} />
                  <Text style={styles.statValue}>{stats.averageStudy.toFixed(1)}h</Text>
                  <Text style={styles.statLabel}>Study Time</Text>
                </View>
              </View>
            </View>

            {stats.needsSupportCount > 0 && (
              <View style={styles.alertCard}>
                <Ionicons name="warning" size={24} color={WARNING} />
                <Text style={styles.alertText}>
                  You've indicated needing support {stats.needsSupportCount} time(s). 
                  Consider talking to a counselor.
                </Text>
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          style={styles.checkInButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.checkInButtonText}>New Wellness Check-in</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Check-ins</Text>
          {checks.map((check) => (
            <View key={check._id} style={styles.checkCard}>
              <View style={styles.checkHeader}>
                <Text style={styles.checkDate}>
                  {new Date(check.createdAt).toLocaleDateString()}
                </Text>
                <View style={[styles.stressBadge, { backgroundColor: getStressColor(check.stressLevel) }]}>
                  <Text style={styles.stressBadgeText}>Stress: {check.stressLevel}/10</Text>
                </View>
              </View>
              <View style={styles.checkDetails}>
                <View style={styles.checkDetail}>
                  <Ionicons name="happy" size={16} color="#888" />
                  <Text style={styles.checkDetailText}>{check.mood}</Text>
                </View>
                <View style={styles.checkDetail}>
                  <Ionicons name="moon" size={16} color="#888" />
                  <Text style={styles.checkDetailText}>{check.sleepHours}h sleep</Text>
                </View>
                <View style={styles.checkDetail}>
                  <Ionicons name="book" size={16} color="#888" />
                  <Text style={styles.checkDetailText}>{check.studyHours}h study</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

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
            <Text style={styles.modalTitle}>Wellness Check-in</Text>
            <TouchableOpacity onPress={handleSubmit}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>How stressed are you? ({formData.stressLevel}/10)</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={formData.stressLevel}
              onValueChange={(value) => setFormData(prev => ({ ...prev, stressLevel: value }))}
              minimumTrackTintColor={getStressColor(formData.stressLevel)}
              maximumTrackTintColor="#ddd"
            />

            <Text style={styles.inputLabel}>How are you feeling?</Text>
            <View style={styles.moodContainer}>
              {moods.map(mood => (
                <TouchableOpacity
                  key={mood.id}
                  style={[
                    styles.moodButton,
                    formData.mood === mood.id && { backgroundColor: mood.color + '20', borderColor: mood.color }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, mood: mood.id }))}
                >
                  <Ionicons name={mood.icon} size={24} color={mood.color} />
                  <Text style={styles.moodLabel}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Sleep Hours: {formData.sleepHours}h</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={12}
              step={0.5}
              value={formData.sleepHours}
              onValueChange={(value) => setFormData(prev => ({ ...prev, sleepHours: value }))}
              minimumTrackTintColor={PRIMARY}
              maximumTrackTintColor="#ddd"
            />

            <Text style={styles.inputLabel}>Study Hours: {formData.studyHours}h</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={12}
              step={0.5}
              value={formData.studyHours}
              onValueChange={(value) => setFormData(prev => ({ ...prev, studyHours: value }))}
              minimumTrackTintColor={SUCCESS}
              maximumTrackTintColor="#ddd"
            />

            <Text style={styles.inputLabel}>Stress Factors</Text>
            <View style={styles.factorsContainer}>
              {factors.map(factor => (
                <TouchableOpacity
                  key={factor.id}
                  style={[
                    styles.factorChip,
                    formData.factors.includes(factor.id) && styles.factorChipActive
                  ]}
                  onPress={() => toggleFactor(factor.id)}
                >
                  <Ionicons
                    name={factor.icon}
                    size={16}
                    color={formData.factors.includes(factor.id) ? '#fff' : PRIMARY}
                  />
                  <Text style={[
                    styles.factorLabel,
                    formData.factors.includes(factor.id) && styles.factorLabelActive
                  ]}>
                    {factor.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.supportCheckbox}
              onPress={() => setFormData(prev => ({ ...prev, needsSupport: !prev.needsSupport }))}
            >
              <Ionicons
                name={formData.needsSupport ? 'checkbox' : 'square-outline'}
                size={24}
                color={DANGER}
              />
              <Text style={styles.supportLabel}>I need support</Text>
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
  
  statsCard: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16, elevation: 3 },
  statsTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WARNING + '20',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  alertText: { flex: 1, fontSize: 13, color: '#1a1a2e', lineHeight: 18 },
  
  checkInButton: {
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
  checkInButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12 },
  checkCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  checkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  checkDate: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  stressBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  stressBadgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  checkDetails: { flexDirection: 'row', gap: 16 },
  checkDetail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  checkDetailText: { fontSize: 13, color: '#888', textTransform: 'capitalize' },
  
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
  slider: { width: '100%', height: 40 },
  
  moodContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    minWidth: 80,
  },
  moodLabel: { fontSize: 12, fontWeight: '500', color: '#1a1a2e', marginTop: 4 },
  
  factorsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  factorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: PRIMARY,
    gap: 6,
  },
  factorChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  factorLabel: { fontSize: 13, fontWeight: '500', color: PRIMARY },
  factorLabelActive: { color: '#fff' },
  
  supportCheckbox: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 8 },
  supportLabel: { fontSize: 14, fontWeight: '500', color: '#1a1a2e' },
});

export default WellnessTrackerScreen;
