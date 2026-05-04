import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../constants/api';
import colors from '../../constants/colors';

const DiscussionModerationScreen = ({ route, navigation }) => {
  const { courseId, courseName } = route.params;
  const { token } = useContext(AuthContext);
  const [discussions, setDiscussions] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, pinned, reported
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: `Moderation - ${courseName}` });
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch discussions
      const discussionsRes = await axios.get(`${API_URL}/discussions/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 }
      });
      setDiscussions(discussionsRes.data.data);

      // Fetch reports for this course's discussions
      const reportsRes = await axios.get(`${API_URL}/reports`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: 'pending' }
      });
      
      // Filter reports for discussions in this course
      const discussionIds = discussionsRes.data.data.map(d => d._id);
      const courseReports = reportsRes.data.data.filter(
        r => r.targetModel === 'Discussion' && discussionIds.includes(r.targetId)
      );
      setReports(courseReports);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load discussions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const togglePin = async (discussionId, currentPinStatus) => {
    try {
      await axios.put(
        `${API_URL}/discussions/${discussionId}/pin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setDiscussions(prev =>
        prev.map(d =>
          d._id === discussionId ? { ...d, isPinned: !currentPinStatus } : d
        )
      );
      
      Alert.alert('Success', currentPinStatus ? 'Discussion unpinned' : 'Discussion pinned');
    } catch (error) {
      console.error('Error toggling pin:', error);
      Alert.alert('Error', 'Failed to update discussion');
    }
  };

  const deleteDiscussion = (discussionId, title) => {
    Alert.alert(
      'Delete Discussion',
      `Delete "${title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/discussions/${discussionId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setDiscussions(prev => prev.filter(d => d._id !== discussionId));
              Alert.alert('Success', 'Discussion deleted');
            } catch (error) {
              console.error('Error deleting discussion:', error);
              Alert.alert('Error', 'Failed to delete discussion');
            }
          }
        }
      ]
    );
  };

  const viewDiscussionDetails = (discussion) => {
    setSelectedDiscussion(discussion);
    setModalVisible(true);
  };

  const resolveReport = async (reportId) => {
    try {
      await axios.put(
        `${API_URL}/reports/${reportId}`,
        { status: 'resolved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReports(prev => prev.filter(r => r._id !== reportId));
      Alert.alert('Success', 'Report resolved');
    } catch (error) {
      console.error('Error resolving report:', error);
      Alert.alert('Error', 'Failed to resolve report');
    }
  };

  const dismissReport = async (reportId) => {
    try {
      await axios.put(
        `${API_URL}/reports/${reportId}`,
        { status: 'dismissed' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReports(prev => prev.filter(r => r._id !== reportId));
      Alert.alert('Success', 'Report dismissed');
    } catch (error) {
      console.error('Error dismissing report:', error);
      Alert.alert('Error', 'Failed to dismiss report');
    }
  };

  const getFilteredDiscussions = () => {
    switch (activeTab) {
      case 'pinned':
        return discussions.filter(d => d.isPinned);
      case 'reported':
        const reportedIds = reports.map(r => r.targetId);
        return discussions.filter(d => reportedIds.includes(d._id));
      default:
        return discussions;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderDiscussion = ({ item }) => {
    const reportCount = reports.filter(r => r.targetId === item._id).length;

    return (
      <TouchableOpacity
        style={[
          styles.discussionCard,
          item.isPinned && styles.pinnedCard,
          reportCount > 0 && styles.reportedCard
        ]}
        onPress={() => viewDiscussionDetails(item)}
      >
        <View style={styles.discussionHeader}>
          <View style={styles.discussionTitleContainer}>
            {item.isPinned && (
              <Ionicons name="pin" size={16} color={colors.primary} style={styles.pinIcon} />
            )}
            <Text style={styles.discussionTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
          {reportCount > 0 && (
            <View style={styles.reportBadge}>
              <Ionicons name="flag" size={14} color={colors.white} />
              <Text style={styles.reportCount}>{reportCount}</Text>
            </View>
          )}
        </View>

        <Text style={styles.discussionContent} numberOfLines={2}>
          {item.content}
        </Text>

        <View style={styles.discussionMeta}>
          <Text style={styles.metaText}>
            By {item.userId?.name || 'Unknown'} • {formatDate(item.createdAt)}
          </Text>
          <View style={styles.discussionStats}>
            <View style={styles.statItem}>
              <Ionicons name="heart-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.statText}>{item.likes?.length || 0}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, item.isPinned && styles.actionButtonActive]}
            onPress={() => togglePin(item._id, item.isPinned)}
          >
            <Ionicons
              name={item.isPinned ? 'pin' : 'pin-outline'}
              size={18}
              color={item.isPinned ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.actionButtonText,
                item.isPinned && styles.actionButtonTextActive
              ]}
            >
              {item.isPinned ? 'Unpin' : 'Pin'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate('DiscussionDetail', { discussionId: item._id })
            }
          >
            <Ionicons name="eye-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => deleteDiscussion(item._id, item.title)}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderReport = ({ item }) => {
    const discussion = discussions.find(d => d._id === item.targetId);

    return (
      <View style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <Ionicons name="flag" size={20} color={colors.error} />
          <Text style={styles.reportTitle}>Reported Discussion</Text>
        </View>

        {discussion && (
          <View style={styles.reportedContent}>
            <Text style={styles.reportedTitle}>{discussion.title}</Text>
            <Text style={styles.reportedText} numberOfLines={2}>
              {discussion.content}
            </Text>
          </View>
        )}

        <View style={styles.reportInfo}>
          <Text style={styles.reportReason}>Reason: {item.reason}</Text>
          <Text style={styles.reportMeta}>
            Reported by {item.reportedBy?.name || 'User'} on {formatDate(item.createdAt)}
          </Text>
        </View>

        <View style={styles.reportActions}>
          <TouchableOpacity
            style={[styles.reportButton, styles.viewButton]}
            onPress={() => discussion && viewDiscussionDetails(discussion)}
          >
            <Text style={styles.viewButtonText}>View Discussion</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reportButton, styles.resolveButton]}
            onPress={() => resolveReport(item._id)}
          >
            <Text style={styles.resolveButtonText}>Resolve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reportButton, styles.dismissButton]}
            onPress={() => dismissReport(item._id)}
          >
            <Text style={styles.dismissButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const filteredDiscussions = getFilteredDiscussions();

  return (
    <View style={styles.container}>
      {/* Stats Header */}
      <View style={styles.statsHeader}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{discussions.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {discussions.filter(d => d.isPinned).length}
          </Text>
          <Text style={styles.statLabel}>Pinned</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: colors.error }]}>
            {reports.length}
          </Text>
          <Text style={styles.statLabel}>Reported</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All ({discussions.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pinned' && styles.activeTab]}
          onPress={() => setActiveTab('pinned')}
        >
          <Text style={[styles.tabText, activeTab === 'pinned' && styles.activeTabText]}>
            Pinned ({discussions.filter(d => d.isPinned).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reported' && styles.activeTab]}
          onPress={() => setActiveTab('reported')}
        >
          <Text style={[styles.tabText, activeTab === 'reported' && styles.activeTabText]}>
            Reported ({reports.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'reported' && reports.length > 0 ? (
        <FlatList
          data={reports}
          renderItem={renderReport}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <FlatList
          data={filteredDiscussions}
          renderItem={renderDiscussion}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>No Discussions</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'pinned'
                  ? 'No pinned discussions yet'
                  : activeTab === 'reported'
                  ? 'No reported discussions'
                  : 'No discussions in this course'}
              </Text>
            </View>
          }
        />
      )}

      {/* Discussion Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedDiscussion && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Discussion Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Title</Text>
                <Text style={styles.modalText}>{selectedDiscussion.title}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Content</Text>
                <Text style={styles.modalText}>{selectedDiscussion.content}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Posted By</Text>
                <Text style={styles.modalText}>
                  {selectedDiscussion.userId?.name || 'Unknown'}
                </Text>
                <Text style={styles.modalSubtext}>
                  {formatDate(selectedDiscussion.createdAt)}
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Engagement</Text>
                <Text style={styles.modalText}>
                  {selectedDiscussion.likes?.length || 0} likes
                </Text>
              </View>

              {selectedDiscussion.isPinned && (
                <View style={styles.pinnedBadge}>
                  <Ionicons name="pin" size={20} color={colors.primary} />
                  <Text style={styles.pinnedBadgeText}>Pinned Discussion</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPinButton]}
                onPress={() => {
                  togglePin(selectedDiscussion._id, selectedDiscussion.isPinned);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalPinButtonText}>
                  {selectedDiscussion.isPinned ? 'Unpin' : 'Pin'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDeleteButton]}
                onPress={() => {
                  setModalVisible(false);
                  deleteDiscussion(selectedDiscussion._id, selectedDiscussion.title);
                }}
              >
                <Text style={styles.modalDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background
  },
  statsHeader: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  statBox: {
    flex: 1,
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  activeTab: {
    borderBottomColor: colors.primary
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600'
  },
  listContainer: {
    padding: 16
  },
  discussionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  pinnedCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary
  },
  reportedCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error
  },
  discussionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  discussionTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  pinIcon: {
    marginRight: 8
  },
  discussionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1
  },
  reportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8
  },
  reportCount: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4
  },
  discussionContent: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
    lineHeight: 20
  },
  discussionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary
  },
  discussionStats: {
    flexDirection: 'row'
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: colors.background
  },
  actionButtonActive: {
    backgroundColor: colors.primary + '20'
  },
  actionButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500'
  },
  actionButtonTextActive: {
    color: colors.primary
  },
  reportCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 8
  },
  reportedContent: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  reportedTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4
  },
  reportedText: {
    fontSize: 14,
    color: colors.textSecondary
  },
  reportInfo: {
    marginBottom: 12
  },
  reportReason: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4
  },
  reportMeta: {
    fontSize: 12,
    color: colors.textSecondary
  },
  reportActions: {
    flexDirection: 'row'
  },
  reportButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4
  },
  viewButton: {
    backgroundColor: colors.primary
  },
  viewButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600'
  },
  resolveButton: {
    backgroundColor: colors.success
  },
  resolveButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600'
  },
  dismissButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border
  },
  dismissButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 64
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text
  },
  modalContent: {
    flex: 1,
    padding: 16
  },
  modalSection: {
    marginBottom: 24
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  modalText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24
  },
  modalSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    padding: 12,
    borderRadius: 8
  },
  pinnedBadgeText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4
  },
  modalPinButton: {
    backgroundColor: colors.primary
  },
  modalPinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white
  },
  modalDeleteButton: {
    backgroundColor: colors.error
  },
  modalDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white
  }
});

export default DiscussionModerationScreen;
