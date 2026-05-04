import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PRIMARY = '#6C63FF';

const AdminUserDetailScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [userData, setUserData] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { fetchUser(); }, [userId]);

  const fetchUser = async () => {
    try {
      const res = await api.get(`${ENDPOINTS.USERS}/${userId}`);
      setUserData(res.data.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load user details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!userData) return null;

  const { user, profile } = userData;
  const ROLE_COLORS = { student: '#6C63FF', instructor: '#43C678', admin: '#FF6584' };
  const roleColor = ROLE_COLORS[user.role] || PRIMARY;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: roleColor + '30' }]}>
          <Text style={[styles.avatarText, { color: roleColor }]}>
            {(user.name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleColor + '20' }]}>
          <Text style={[styles.roleText, { color: roleColor }]}>{user.role}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Info</Text>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>User ID</Text><Text style={styles.infoValue}>{user._id}</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>Joined</Text><Text style={styles.infoValue}>{new Date(user.createdAt).toLocaleDateString()}</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>Status</Text><Text style={[styles.infoValue, { color: user.isSuspended ? '#EF4444' : '#43C678' }]}>{user.isSuspended ? 'Suspended' : 'Active'}</Text></View>
        {profile?.bio && <View style={styles.infoRow}><Text style={styles.infoLabel}>Bio</Text><Text style={styles.infoValue}>{profile.bio}</Text></View>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Coming Soon', 'Email user feature coming soon')}>
          <Ionicons name="mail-outline" size={20} color={PRIMARY} />
          <Text style={[styles.actionText, { color: PRIMARY }]}>Send Email</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            Alert.alert(user.isSuspended ? 'Activate' : 'Suspend', `${user.isSuspended ? 'Activate' : 'Suspend'} this user?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Confirm', onPress: async () => {
                await api.put(`${ENDPOINTS.USERS}/${userId}`, { isSuspended: !user.isSuspended });
                fetchUser();
              }},
            ]);
          }}
        >
          <Ionicons name={user.isSuspended ? 'checkmark-circle-outline' : 'close-circle-outline'} size={20} color="#FFB347" />
          <Text style={[styles.actionText, { color: '#FFB347' }]}>{user.isSuspended ? 'Activate Account' : 'Suspend Account'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            Alert.alert('Delete User', 'Permanently delete this user?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: async () => {
                await api.delete(`${ENDPOINTS.USERS}/${userId}`);
                navigation.goBack();
              }},
            ]);
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F5F5F5' },
  header:      { backgroundColor: '#fff', alignItems: 'center', padding: 24, marginBottom: 16 },
  avatar:      { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText:  { fontSize: 32, fontWeight: 'bold' },
  name:        { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 },
  email:       { fontSize: 14, color: '#888', marginBottom: 10 },
  roleBadge:   { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12 },
  roleText:    { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  section:     { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12 },
  infoRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoLabel:   { fontSize: 13, color: '#888' },
  infoValue:   { fontSize: 13, fontWeight: '600', color: '#1a1a2e', flex: 1, textAlign: 'right' },
  actionBtn:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  actionText:  { fontSize: 15, fontWeight: '500', marginLeft: 12 },
});

export default AdminUserDetailScreen;
