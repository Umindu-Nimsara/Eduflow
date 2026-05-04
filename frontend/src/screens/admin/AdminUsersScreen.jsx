import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';

const PRIMARY = '#6C63FF';

const ROLE_COLORS = {
  student:    { bg: '#6C63FF20', text: '#6C63FF' },
  instructor: { bg: '#43C67820', text: '#43C678' },
  admin:      { bg: '#FF658420', text: '#FF6584' },
};

const AdminUsersScreen = ({ navigation }) => {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page,       setPage]       = useState(1);
  const [hasMore,    setHasMore]    = useState(true);

  useEffect(() => { fetchUsers(1); }, [roleFilter]);

  const fetchUsers = async (pageNum = 1, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);

      const params = { page: pageNum, limit: 20 };
      if (roleFilter !== 'all') params.role = roleFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get(ENDPOINTS.USERS, { params });
      const data = res.data.data || [];

      if (pageNum === 1) setUsers(data);
      else setUsers(prev => [...prev, ...data]);

      setHasMore(res.data.pagination?.currentPage < res.data.pagination?.totalPages);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchUsers(1);
  };

  const handleDelete = (userId, name) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to permanently delete "${name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`${ENDPOINTS.USERS}/${userId}`);
              setUsers(prev => prev.filter(u => u._id !== userId));
              Alert.alert('Deleted', 'User deleted successfully');
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const handleSuspend = (userId, name, isSuspended) => {
    Alert.alert(
      isSuspended ? 'Activate User' : 'Suspend User',
      `${isSuspended ? 'Activate' : 'Suspend'} account for "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isSuspended ? 'Activate' : 'Suspend',
          style: isSuspended ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await api.put(`${ENDPOINTS.USERS}/${userId}`, { isSuspended: !isSuspended });
              setUsers(prev => prev.map(u =>
                u._id === userId ? { ...u, isSuspended: !isSuspended } : u
              ));
            } catch (err) {
              Alert.alert('Error', 'Failed to update user status');
            }
          },
        },
      ]
    );
  };

  const handleRoleChange = (userId, name, currentRole) => {
    const roles = ['student', 'instructor', 'admin'].filter(r => r !== currentRole);
    Alert.alert(
      'Change Role',
      `Change role for "${name}" to:`,
      [
        ...roles.map(role => ({
          text: role.charAt(0).toUpperCase() + role.slice(1),
          onPress: async () => {
            try {
              await api.put(`${ENDPOINTS.USERS}/${userId}`, { role });
              setUsers(prev => prev.map(u =>
                u._id === userId ? { ...u, role } : u
              ));
            } catch (err) {
              Alert.alert('Error', 'Failed to change role');
            }
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderUser = ({ item }) => {
    const roleColor = ROLE_COLORS[item.role] || ROLE_COLORS.student;
    const initials  = (item.name || 'U').charAt(0).toUpperCase();

    return (
      <View style={[styles.card, item.isSuspended && styles.cardSuspended]}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: roleColor.text + '30' }]}>
            <Text style={[styles.avatarText, { color: roleColor.text }]}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{item.name}</Text>
              {item.isSuspended && (
                <View style={styles.suspendedBadge}>
                  <Text style={styles.suspendedText}>Suspended</Text>
                </View>
              )}
            </View>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.userDate}>
              Joined {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: roleColor.bg }]}>
            <Text style={[styles.roleText, { color: roleColor.text }]}>{item.role}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('AdminUserDetail', { userId: item._id, user: item })}
          >
            <Ionicons name="eye-outline" size={15} color={PRIMARY} />
            <Text style={[styles.actionText, { color: PRIMARY }]}>View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleRoleChange(item._id, item.name, item.role)}
          >
            <Ionicons name="swap-horizontal-outline" size={15} color="#9C88FF" />
            <Text style={[styles.actionText, { color: '#9C88FF' }]}>Role</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleSuspend(item._id, item.name, item.isSuspended)}
          >
            <Ionicons name={item.isSuspended ? 'checkmark-circle-outline' : 'close-circle-outline'} size={15} color="#FFB347" />
            <Text style={[styles.actionText, { color: '#FFB347' }]}>
              {item.isSuspended ? 'Activate' : 'Suspend'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleDelete(item._id, item.name)}
          >
            <Ionicons name="trash-outline" size={15} color="#EF4444" />
            <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && users.length === 0) return <LoadingSpinner text="Loading users..." />;
  if (error && users.length === 0)   return <ErrorView message={error} onRetry={() => fetchUsers(1)} />;

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color="#aaa" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); fetchUsers(1); }}>
            <Ionicons name="close-circle" size={16} color="#aaa" />
          </TouchableOpacity>
        )}
      </View>

      {/* Role filter */}
      <View style={styles.filterBar}>
        {['all', 'student', 'instructor', 'admin'].map(role => (
          <TouchableOpacity
            key={role}
            style={[styles.filterPill, roleFilter === role && styles.filterPillActive]}
            onPress={() => setRoleFilter(role)}
          >
            <Text style={[styles.filterText, roleFilter === role && styles.filterTextActive]}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={users}
        keyExtractor={item => item._id}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchUsers(1, true)} colors={[PRIMARY]} />}
        onEndReached={() => { if (hasMore) { const next = page + 1; setPage(next); fetchUsers(next); } }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={<EmptyState icon="people-outline" title="No users found" description="Try adjusting your search or filters" />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F5F5F5' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    margin: 16, marginBottom: 8, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1a1a2e' },
  filterBar:   { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 },
  filterPill:  { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', marginRight: 8 },
  filterPillActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  filterText:  { fontSize: 12, color: '#888', fontWeight: '500' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  list:        { padding: 16, paddingTop: 8 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  cardSuspended: { opacity: 0.7, borderLeftWidth: 3, borderLeftColor: '#EF4444' },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar:      { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText:  { fontSize: 18, fontWeight: 'bold' },
  userInfo:    { flex: 1 },
  nameRow:     { flexDirection: 'row', alignItems: 'center' },
  userName:    { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginRight: 6 },
  userEmail:   { fontSize: 12, color: '#888', marginTop: 2 },
  userDate:    { fontSize: 11, color: '#aaa', marginTop: 2 },
  roleBadge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleText:    { fontSize: 11, fontWeight: '700' },
  suspendedBadge: { backgroundColor: '#EF444420', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  suspendedText:  { fontSize: 10, fontWeight: '700', color: '#EF4444' },
  actions:     { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  actionBtn:   { flexDirection: 'row', alignItems: 'center' },
  actionText:  { fontSize: 12, fontWeight: '600', marginLeft: 4 },
});

export default AdminUsersScreen;
