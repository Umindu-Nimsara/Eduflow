import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const PRIMARY = '#6C63FF';

const AdminReportsScreen = () => {
  const [reports,    setReports]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const res = await api.get(ENDPOINTS.REPORTS);
      setReports(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleResolve = async (reportId) => {
    try {
      await api.put(`${ENDPOINTS.REPORTS}/${reportId}`, { status: 'resolved' });
      setReports(prev => prev.map(r => r._id === reportId ? { ...r, status: 'resolved' } : r));
    } catch (err) { Alert.alert('Error', 'Failed to resolve report'); }
  };

  const renderReport = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: item.status === 'resolved' ? '#43C67820' : '#FF658420' }]}>
          <Text style={[styles.typeText, { color: item.status === 'resolved' ? '#43C678' : '#FF6584' }]}>{item.status || 'pending'}</Text>
        </View>
        <Text style={styles.reason}>{item.reason}</Text>
      </View>
      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      {item.status !== 'resolved' && (
        <TouchableOpacity style={styles.resolveBtn} onPress={() => handleResolve(item._id)}>
          <Ionicons name="checkmark-circle-outline" size={15} color="#43C678" />
          <Text style={styles.resolveBtnText}>Mark Resolved</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <FlatList
      style={styles.container}
      data={reports}
      keyExtractor={item => item._id}
      renderItem={renderReport}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchReports(true)} colors={[PRIMARY]} />}
      ListEmptyComponent={<EmptyState icon="flag-outline" title="No reports" description="No content reports at this time" />}
    />
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F5F5F5' },
  list:        { padding: 16 },
  card:        { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  typeBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 10 },
  typeText:    { fontSize: 11, fontWeight: '700' },
  reason:      { fontSize: 14, fontWeight: '600', color: '#1a1a2e', flex: 1 },
  description: { fontSize: 13, color: '#888', marginBottom: 6 },
  date:        { fontSize: 11, color: '#aaa', marginBottom: 8 },
  resolveBtn:  { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end' },
  resolveBtnText: { fontSize: 13, fontWeight: '600', color: '#43C678', marginLeft: 4 },
});

export default AdminReportsScreen;
