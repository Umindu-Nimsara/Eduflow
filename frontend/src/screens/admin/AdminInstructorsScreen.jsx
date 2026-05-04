import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';

const PRIMARY = '#6C63FF';

const AdminInstructorsScreen = ({ navigation }) => {
  const [instructors, setInstructors] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState(null);

  useEffect(() => { fetchInstructors(); }, []);

  const fetchInstructors = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const res = await api.get(ENDPOINTS.INSTRUCTORS);
      setInstructors(res.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load instructors');
    } finally { setLoading(false); setRefreshing(false); }
  };

  const handleVerify = async (instructorId, isVerified) => {
    try {
      await api.put(`${ENDPOINTS.INSTRUCTORS}/${instructorId}/verify`, { isVerified: !isVerified });
      setInstructors(prev => prev.map(i => i._id === instructorId ? { ...i, isVerified: !isVerified } : i));
    } catch (err) { Alert.alert('Error', 'Failed to update verification'); }
  };

  const handleDelete = (instructorId, name) => {
    Alert.alert('Delete Instructor', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`${ENDPOINTS.INSTRUCTORS}/${instructorId}`);
          setInstructors(prev => prev.filter(i => i._id !== instructorId));
        } catch (err) { Alert.alert('Error', 'Failed to delete instructor'); }
      }},
    ]);
  };

  const renderInstructor = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.userId?.name || 'I').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.userId?.name || 'Instructor'}</Text>
          <Text style={styles.email}>{item.userId?.email}</Text>
          {item.expertise?.length > 0 && <Text style={styles.expertise}>{item.expertise.slice(0, 2).join(', ')}</Text>}
        </View>
        <View style={[styles.verifiedBadge, { backgroundColor: item.isVerified ? '#43C67820' : '#FFB34720' }]}>
          <Text style={[styles.verifiedText, { color: item.isVerified ? '#43C678' : '#FFB347' }]}>
            {item.isVerified ? '✓ Verified' : 'Pending'}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleVerify(item._id, item.isVerified)}>
          <Ionicons name={item.isVerified ? 'close-circle-outline' : 'checkmark-circle-outline'} size={15} color={item.isVerified ? '#FFB347' : '#43C678'} />
          <Text style={[styles.actionText, { color: item.isVerified ? '#FFB347' : '#43C678' }]}>{item.isVerified ? 'Unverify' : 'Verify'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AdminUserDetail', { userId: item.userId?._id })}>
          <Ionicons name="eye-outline" size={15} color={PRIMARY} />
          <Text style={[styles.actionText, { color: PRIMARY }]}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item._id, item.userId?.name)}>
          <Ionicons name="trash-outline" size={15} color="#EF4444" />
          <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorView message={error} onRetry={fetchInstructors} />;

  return (
    <FlatList
      style={styles.container}
      data={instructors}
      keyExtractor={item => item._id}
      renderItem={renderInstructor}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchInstructors(true)} colors={[PRIMARY]} />}
      ListEmptyComponent={<EmptyState icon="briefcase-outline" title="No instructors found" />}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  list:      { padding: 16 },
  card:      { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: PRIMARY + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: PRIMARY },
  info:      { flex: 1 },
  name:      { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  email:     { fontSize: 12, color: '#888', marginTop: 2 },
  expertise: { fontSize: 11, color: '#aaa', marginTop: 2 },
  verifiedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  verifiedText:  { fontSize: 11, fontWeight: '700' },
  actions:   { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
});

export default AdminInstructorsScreen;
