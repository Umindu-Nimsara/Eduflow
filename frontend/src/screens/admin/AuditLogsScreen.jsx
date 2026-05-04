import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput, Modal
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
const INFO = '#3B82F6';

const AuditLogsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    startDate: null,
    endDate: null,
    userId: ''
  });

  const actions = [
    { id: '', label: 'All Actions' },
    { id: 'create', label: 'Create', color: SUCCESS },
    { id: 'update', label: 'Update', color: INFO },
    { id: 'delete', label: 'Delete', color: DANGER },
    { id: 'login', label: 'Login', color: PRIMARY },
    { id: 'logout', label: 'Logout', color: '#888' },
    { id: 'view', label: 'View', color: '#888' }
  ];

  const resourceTypes = [
    { id: '', label: 'All Resources' },
    { id: 'User', label: 'User' },
    { id: 'Course', label: 'Course' },
    { id: 'Lesson', label: 'Lesson' },
    { id: 'Quiz', label: 'Quiz' },
    { id: 'Assignment', label: 'Assignment' },
    { id: 'Enrollment', label: 'Enrollment' },
    { id: 'Certificate', label: 'Certificate' }
  ];

  useEffect(() => {
    fetchData();
  }, [page, filters]);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: isRefresh ? 1 : page,
        limit: 20
      });

      if (filters.action) params.append('action', filters.action);
      if (filters.resourceType) params.append('resourceType', filters.resourceType);
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.userId) params.append('userId', filters.userId);

      const [logsRes, statsRes] = await Promise.all([
        api.get(`/audit-logs?${params.toString()}`),
        api.get('/audit-logs/stats')
      ]);

      setLogs(logsRes.data.data || []);
      setTotalPages(logsRes.data.pages || 1);
      setStats(statsRes.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getActionColor = (action) => {
    const actionObj = actions.find(a => a.id === action);
    return actionObj?.color || '#888';
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'create': return 'add-circle';
      case 'update': return 'create';
      case 'delete': return 'trash';
      case 'login': return 'log-in';
      case 'logout': return 'log-out';
      case 'view': return 'eye';
      default: return 'ellipse';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const applyFilters = () => {
    setFilterModalVisible(false);
    setPage(1);
    fetchData();
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      resourceType: '',
      startDate: null,
      endDate: null,
      userId: ''
    });
    setFilterModalVisible(false);
    setPage(1);
  };

  if (loading && !refreshing) return <LoadingSpinner text="Loading audit logs..." />;
  if (error) return <ErrorView message={error} onRetry={fetchData} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Audit Logs</Text>
          <Text style={styles.headerSubtitle}>System activity tracking</Text>
        </View>
        <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
          <Ionicons name="filter" size={24} color="#fff" />
        </TouchableOpacity>
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
            <Text style={styles.statsTitle}>Activity Overview</Text>
            <View style={styles.statsGrid}>
              {stats.byAction.slice(0, 4).map((stat) => (
                <View key={stat._id} style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: getActionColor(stat._id) + '20' }]}>
                    <Ionicons name={getActionIcon(stat._id)} size={20} color={getActionColor(stat._id)} />
                  </View>
                  <Text style={styles.statValue}>{stat.count}</Text>
                  <Text style={styles.statLabel}>{stat._id}</Text>
                </View>
              ))}
            </View>

            {stats.byResource.length > 0 && (
              <>
                <Text style={styles.subsectionTitle}>Top Resources</Text>
                <View style={styles.resourceList}>
                  {stats.byResource.slice(0, 5).map((stat) => (
                    <View key={stat._id} style={styles.resourceItem}>
                      <Text style={styles.resourceName}>{stat._id}</Text>
                      <View style={styles.resourceBadge}>
                        <Text style={styles.resourceCount}>{stat.count}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Text style={styles.sectionSubtitle}>{logs.length} logs</Text>
          </View>

          {logs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No audit logs found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
            </View>
          ) : (
            logs.map((log) => (
              <View key={log._id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View style={[styles.actionBadge, { backgroundColor: getActionColor(log.action) }]}>
                    <Ionicons name={getActionIcon(log.action)} size={16} color="#fff" />
                    <Text style={styles.actionText}>{log.action}</Text>
                  </View>
                  <Text style={styles.timestamp}>{formatTimestamp(log.createdAt)}</Text>
                </View>

                <View style={styles.logContent}>
                  <View style={styles.logRow}>
                    <Ionicons name="person-outline" size={16} color="#888" />
                    <Text style={styles.logLabel}>User:</Text>
                    <Text style={styles.logValue}>
                      {log.userId?.name || 'Unknown'} ({log.userId?.role || 'N/A'})
                    </Text>
                  </View>

                  <View style={styles.logRow}>
                    <Ionicons name="cube-outline" size={16} color="#888" />
                    <Text style={styles.logLabel}>Resource:</Text>
                    <Text style={styles.logValue}>{log.resourceType}</Text>
                  </View>

                  {log.resourceId && (
                    <View style={styles.logRow}>
                      <Ionicons name="key-outline" size={16} color="#888" />
                      <Text style={styles.logLabel}>ID:</Text>
                      <Text style={[styles.logValue, styles.monospace]}>
                        {log.resourceId.substring(0, 8)}...
                      </Text>
                    </View>
                  )}

                  {log.ipAddress && (
                    <View style={styles.logRow}>
                      <Ionicons name="globe-outline" size={16} color="#888" />
                      <Text style={styles.logLabel}>IP:</Text>
                      <Text style={styles.logValue}>{log.ipAddress}</Text>
                    </View>
                  )}

                  {log.details && (
                    <View style={styles.detailsContainer}>
                      <Text style={styles.detailsLabel}>Details:</Text>
                      <Text style={styles.detailsText}>{log.details}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}

          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
                onPress={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <Ionicons name="chevron-back" size={20} color={page === 1 ? '#ccc' : PRIMARY} />
              </TouchableOpacity>

              <Text style={styles.pageText}>
                Page {page} of {totalPages}
              </Text>

              <TouchableOpacity
                style={[styles.pageButton, page === totalPages && styles.pageButtonDisabled]}
                onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <Ionicons name="chevron-forward" size={20} color={page === totalPages ? '#ccc' : PRIMARY} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filter Logs</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.filterLabel}>Action Type</Text>
            <View style={styles.filterChips}>
              {actions.map(action => (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.filterChip,
                    filters.action === action.id && styles.filterChipActive
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, action: action.id }))}
                >
                  <Text style={[
                    styles.filterChipText,
                    filters.action === action.id && styles.filterChipTextActive
                  ]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Resource Type</Text>
            <View style={styles.filterChips}>
              {resourceTypes.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.filterChip,
                    filters.resourceType === type.id && styles.filterChipActive
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, resourceType: type.id }))}
                >
                  <Text style={[
                    styles.filterChipText,
                    filters.resourceType === type.id && styles.filterChipTextActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>User ID (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter user ID"
              value={filters.userId}
              onChangeText={(text) => setFilters(prev => ({ ...prev, userId: text }))}
            />

            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: PRIMARY,
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: { marginRight: 12 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  
  statsCard: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16, elevation: 3 },
  statsTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, textTransform: 'capitalize' },
  
  subsectionTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginTop: 8, marginBottom: 12 },
  resourceList: { gap: 8 },
  resourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resourceName: { fontSize: 13, color: '#1a1a2e', fontWeight: '500' },
  resourceBadge: { backgroundColor: PRIMARY + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  resourceCount: { fontSize: 12, fontWeight: '600', color: PRIMARY },
  
  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  sectionSubtitle: { fontSize: 13, color: '#888' },
  
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#888', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#aaa', marginTop: 8 },
  
  logCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  actionText: { fontSize: 12, fontWeight: '600', color: '#fff', textTransform: 'uppercase' },
  timestamp: { fontSize: 12, color: '#888' },
  
  logContent: { gap: 8 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logLabel: { fontSize: 13, fontWeight: '600', color: '#888', minWidth: 70 },
  logValue: { fontSize: 13, color: '#1a1a2e', flex: 1 },
  monospace: { fontFamily: 'monospace' },
  
  detailsContainer: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  detailsLabel: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 4 },
  detailsText: { fontSize: 12, color: '#666', lineHeight: 18 },
  
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 16,
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  pageButtonDisabled: { opacity: 0.5 },
  pageText: { fontSize: 14, fontWeight: '500', color: '#1a1a2e' },
  
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
  clearText: { fontSize: 14, fontWeight: '600', color: DANGER },
  modalContent: { flex: 1, padding: 16 },
  
  filterLabel: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 8, marginTop: 16 },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  filterChipText: { fontSize: 13, fontWeight: '500', color: '#1a1a2e' },
  filterChipTextActive: { color: '#fff' },
  
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1a1a2e',
  },
  
  applyButton: {
    backgroundColor: PRIMARY,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    elevation: 2,
  },
  applyButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});

export default AuditLogsScreen;
