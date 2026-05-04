import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const PRIMARY = '#6C63FF';

const AdminLogsScreen = () => {
  const [logs,       setLogs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const res = await api.get(`${ENDPOINTS.ADMIN_LOGS}`);
      setLogs(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const renderLog = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark-outline" size={18} color={PRIMARY} />
        </View>
        <View style={styles.logInfo}>
          <Text style={styles.action}>{item.action}</Text>
          <Text style={styles.admin}>{item.adminId?.name || 'Admin'}</Text>
        </View>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
    </View>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <FlatList
      style={styles.container}
      data={logs}
      keyExtractor={item => item._id}
      renderItem={renderLog}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchLogs(true)} colors={[PRIMARY]} />}
      ListEmptyComponent={<EmptyState icon="document-text-outline" title="No logs yet" description="Admin activity will appear here" />}
    />
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F5F5F5' },
  list:       { padding: 16 },
  card:       { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: PRIMARY + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logInfo:    { flex: 1 },
  action:     { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  admin:      { fontSize: 12, color: '#888', marginTop: 2 },
  date:       { fontSize: 11, color: '#aaa' },
});

export default AdminLogsScreen;
