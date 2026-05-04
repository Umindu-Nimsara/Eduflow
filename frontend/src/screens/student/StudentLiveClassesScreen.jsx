import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';

const PRIMARY = '#6C63FF';
const SUCCESS = '#43C678';
const DANGER = '#EF4444';

const StudentLiveClassesScreen = ({ route, navigation }) => {
  const { courseId, courseName } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [pastClasses, setPastClasses] = useState([]);

  const platforms = {
    'zoom': { label: 'Zoom', icon: 'videocam', color: '#2D8CFF' },
    'google-meet': { label: 'Google Meet', icon: 'logo-google', color: '#34A853' },
    'microsoft-teams': { label: 'MS Teams', icon: 'people', color: '#5B5FC7' },
    'other': { label: 'Other', icon: 'link', color: '#6B7280' }
  };

  useEffect(() => {
    fetchLiveClasses();
  }, [courseId]);

  const fetchLiveClasses = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await api.get(`/live-classes/course/${courseId}`);
      const allClasses = response.data.data || [];

      const now = new Date();
      const upcoming = allClasses.filter(c => 
        new Date(c.scheduledDate) >= now && 
        (c.status === 'scheduled' || c.status === 'live')
      );
      const past = allClasses.filter(c => 
        new Date(c.scheduledDate) < now || 
        c.status === 'completed' || 
        c.status === 'cancelled'
      );

      setUpcomingClasses(upcoming);
      setPastClasses(past);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load live classes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleJoinClass = async (liveClass) => {
    if (!liveClass.meetingLink) {
      Alert.alert('Error', 'Meeting link not available');
      return;
    }

    // Show meeting details
    Alert.alert(
      liveClass.title,
      `Platform: ${platforms[liveClass.platform]?.label || 'Unknown'}\n\n` +
      (liveClass.meetingId ? `Meeting ID: ${liveClass.meetingId}\n` : '') +
      (liveClass.meetingPassword ? `Password: ${liveClass.meetingPassword}\n\n` : '\n') +
      'Would you like to join this class?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            try {
              // Record attendance
              await api.post(`/live-classes/${liveClass._id}/join`);
              
              // Open meeting link
              const supported = await Linking.canOpenURL(liveClass.meetingLink);
              if (supported) {
                await Linking.openURL(liveClass.meetingLink);
              } else {
                Alert.alert('Error', 'Cannot open meeting link');
              }
            } catch (err) {
              // If already joined, still open the link
              if (err.response?.status === 400) {
                const supported = await Linking.canOpenURL(liveClass.meetingLink);
                if (supported) {
                  await Linking.openURL(liveClass.meetingLink);
                }
              } else {
                Alert.alert('Error', err.response?.data?.message || 'Failed to join class');
              }
            }
          }
        }
      ]
    );
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

  const getTimeUntil = (date) => {
    const now = new Date();
    const scheduledDate = new Date(date);
    const diff = scheduledDate - now;
    
    if (diff < 0) return 'Started';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `in ${days}d ${hours}h`;
    if (hours > 0) return `in ${hours}h ${minutes}m`;
    if (minutes > 0) return `in ${minutes}m`;
    return 'Starting soon';
  };

  const isLive = (liveClass) => {
    return liveClass.status === 'live';
  };

  const isStartingSoon = (liveClass) => {
    const now = new Date();
    const scheduledDate = new Date(liveClass.scheduledDate);
    const diff = scheduledDate - now;
    return diff > 0 && diff < 15 * 60 * 1000; // 15 minutes
  };

  const renderLiveClass = (liveClass, isUpcoming = true) => {
    const platform = platforms[liveClass.platform] || platforms.other;
    const live = isLive(liveClass);
    const startingSoon = isStartingSoon(liveClass);

    return (
      <View key={liveClass._id} style={styles.classCard}>
        {/* Live Badge */}
        {live && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE NOW</Text>
          </View>
        )}
        
        {/* Starting Soon Badge */}
        {!live && startingSoon && (
          <View style={[styles.liveBadge, { backgroundColor: WARNING + '20' }]}>
            <Ionicons name="time" size={14} color={WARNING} />
            <Text style={[styles.liveText, { color: WARNING }]}>STARTING SOON</Text>
          </View>
        )}

        <View style={styles.classHeader}>
          <View style={[styles.platformIcon, { backgroundColor: platform.color + '20' }]}>
            <Ionicons name={platform.icon} size={28} color={platform.color} />
          </View>
          <View style={styles.classInfo}>
            <Text style={styles.classTitle}>{liveClass.title}</Text>
            <Text style={styles.classPlatform}>{platform.label}</Text>
          </View>
        </View>

        {liveClass.description && (
          <Text style={styles.classDescription} numberOfLines={2}>
            {liveClass.description}
          </Text>
        )}

        <View style={styles.classDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={18} color="#666" />
            <Text style={styles.detailText}>{formatDate(liveClass.scheduledDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={18} color="#666" />
            <Text style={styles.detailText}>
              {formatTime(liveClass.scheduledDate)} ({liveClass.duration} min)
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={18} color="#666" />
            <Text style={styles.detailText}>
              {liveClass.instructorId?.name || 'Instructor'}
            </Text>
          </View>
          {isUpcoming && (
            <View style={styles.detailRow}>
              <Ionicons name="hourglass-outline" size={18} color={PRIMARY} />
              <Text style={[styles.detailText, { color: PRIMARY, fontWeight: '600' }]}>
                {getTimeUntil(liveClass.scheduledDate)}
              </Text>
            </View>
          )}
        </View>

        {/* Meeting Info */}
        {liveClass.meetingId && (
          <View style={styles.meetingInfo}>
            <Text style={styles.meetingLabel}>Meeting ID:</Text>
            <Text style={styles.meetingValue}>{liveClass.meetingId}</Text>
          </View>
        )}

        {/* Join Button */}
        {isUpcoming && liveClass.status !== 'cancelled' && (
          <TouchableOpacity
            style={[
              styles.joinButton,
              live && styles.joinButtonLive,
              startingSoon && styles.joinButtonSoon
            ]}
            onPress={() => handleJoinClass(liveClass)}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={live ? "radio-button-on" : "videocam"} 
              size={20} 
              color="#fff" 
            />
            <Text style={styles.joinButtonText}>
              {live ? 'Join Now' : 'Join Class'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Status for past classes */}
        {!isUpcoming && (
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              liveClass.status === 'completed' && { backgroundColor: '#10B981' },
              liveClass.status === 'cancelled' && { backgroundColor: DANGER }
            ]}>
              <Text style={styles.statusText}>
                {liveClass.status === 'completed' ? '✓ Completed' : '✗ Cancelled'}
              </Text>
            </View>
            {liveClass.recordingUrl && (
              <TouchableOpacity
                style={styles.recordingButton}
                onPress={() => Linking.openURL(liveClass.recordingUrl)}
              >
                <Ionicons name="play-circle-outline" size={16} color={PRIMARY} />
                <Text style={styles.recordingText}>Watch Recording</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
        <Text style={styles.headerSubtitle}>Live Classes</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchLiveClasses(true)}
            colors={[PRIMARY]}
          />
        }
      >
        {/* Upcoming Classes */}
        {upcomingClasses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={20} color={PRIMARY} />
              <Text style={styles.sectionTitle}>Upcoming Classes</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{upcomingClasses.length}</Text>
              </View>
            </View>
            {upcomingClasses.map(liveClass => renderLiveClass(liveClass, true))}
          </View>
        )}

        {/* Past Classes */}
        {pastClasses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={20} color="#888" />
              <Text style={styles.sectionTitle}>Past Classes</Text>
              <View style={[styles.badge, { backgroundColor: '#88888820' }]}>
                <Text style={[styles.badgeText, { color: '#888' }]}>{pastClasses.length}</Text>
              </View>
            </View>
            {pastClasses.map(liveClass => renderLiveClass(liveClass, false))}
          </View>
        )}

        {/* Empty State */}
        {upcomingClasses.length === 0 && pastClasses.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="videocam-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No live classes scheduled</Text>
            <Text style={styles.emptySubtext}>
              Your instructor will schedule live classes here
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const WARNING = '#FFB347';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: PRIMARY, padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  
  scrollContainer: { flex: 1 },
  
  section: { padding: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', flex: 1 },
  badge: {
    backgroundColor: PRIMARY + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: PRIMARY },
  
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  
  liveBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SUCCESS + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 1,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SUCCESS,
  },
  liveText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: SUCCESS,
  },
  
  classHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  platformIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  classInfo: { flex: 1, paddingRight: 60 },
  classTitle: { fontSize: 17, fontWeight: '600', color: '#1a1a2e', marginBottom: 4 },
  classPlatform: { fontSize: 13, color: '#888' },
  
  classDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  
  classDetails: { marginBottom: 12, gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailText: { fontSize: 14, color: '#666' },
  
  meetingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  meetingLabel: { fontSize: 13, color: '#888', marginRight: 8 },
  meetingValue: { fontSize: 13, fontWeight: '600', color: '#1a1a2e' },
  
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  joinButtonLive: {
    backgroundColor: SUCCESS,
  },
  joinButtonSoon: {
    backgroundColor: WARNING,
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flex: 1,
    backgroundColor: '#6B7280',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  recordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY + '20',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  recordingText: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY,
  },
  
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#888',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default StudentLiveClassesScreen;
