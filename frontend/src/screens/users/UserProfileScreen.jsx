import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { analyticsService } from '../../services/analyticsService';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PRIMARY = '#6C63FF';

// ── Section header ────────────────────────────────────────────────────────────
const SectionHeader = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

// ── Menu item ─────────────────────────────────────────────────────────────────
const MenuItem = ({ icon, label, onPress, danger = false, badge = null }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIconCircle, danger && styles.menuIconCircleDanger]}>
      <Ionicons name={icon} size={20} color={danger ? '#EF4444' : PRIMARY} />
    </View>
    <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
    {badge ? (
      <View style={styles.menuBadge}>
        <Text style={styles.menuBadgeText}>{badge}</Text>
      </View>
    ) : (
      <Ionicons name="chevron-forward" size={18} color="#ccc" />
    )}
  </TouchableOpacity>
);

// ── Main screen ───────────────────────────────────────────────────────────────
const UserProfileScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);

  const [profile,      setProfile]      = useState(null);
  const [stats,        setStats]        = useState({ courses: 0, certificates: 0, streak: 0 });
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    // Fetch announcement count when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAnnouncementCount();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchAnnouncementCount = async () => {
    try {
      const response = await api.get('/announcements', { params: { page: 1, limit: 100 } });
      const announcements = response.data.data || [];
      setAnnouncementCount(announcements.length);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    }
  };

  const fetchAll = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);

      const role = user?.role || 'student';

      if (role === 'student') {
        const [profileRes, analyticsRes] = await Promise.all([
          userService.getUserById(user.id).catch(() => null),
          analyticsService.getStudentAnalytics().catch(() => null),
        ]);
        if (profileRes) setProfile(profileRes.data?.profile || null);
        if (analyticsRes) {
          setStats({
            courses:      analyticsRes.data?.enrolledCourses  || 0,
            certificates: analyticsRes.data?.certificates     || 0,
            streak:       analyticsRes.data?.currentStreak    || 0,
          });
        }
      } else if (role === 'instructor') {
        const [profileRes, analyticsRes] = await Promise.all([
          userService.getUserById(user.id).catch(() => null),
          analyticsService.getInstructorAnalytics().catch(() => null),
        ]);
        if (profileRes) setProfile(profileRes.data?.profile || null);
        if (analyticsRes) {
          setStats({
            courses:  analyticsRes.data?.totalCourses   || 0,
            students: analyticsRes.data?.totalStudents  || 0,
            rating:   analyticsRes.data?.averageRating ? analyticsRes.data.averageRating.toFixed(1) : '0.0',
          });
        }
      } else {
        // Admin
        const profileRes = await userService.getUserById(user.id).catch(() => null);
        if (profileRes) setProfile(profileRes.data?.profile || null);
      }

      // Fetch announcement count
      await fetchAnnouncementCount();
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── Logout with confirmation ──────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  if (loading) return <LoadingSpinner text="Loading profile..." />;

  const avatarUri = profile?.profilePhoto || null;
  const initials  = (user?.name || 'U').charAt(0).toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchAll(true)}
          colors={[PRIMARY]}
        />
      }
    >
      {/* ── Purple banner ── */}
      <View style={styles.banner} />

      {/* ── Avatar overlapping banner ── */}
      <View style={styles.avatarWrapper}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => navigation.navigate('EditProfile')}
          activeOpacity={0.85}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          {/* Camera overlay */}
          <View style={styles.cameraOverlay}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Name / email / role ── */}
      <View style={styles.nameSection}>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role}</Text>
        </View>
      </View>

      {/* ── Stats row ── */}
      <View style={styles.statsRow}>
        {user?.role === 'student' && (
          <>
            <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('My Learning')}>
              <Text style={styles.statValue}>{stats.courses}</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Certificate')}>
              <Text style={styles.statValue}>{stats.certificates}</Text>
              <Text style={styles.statLabel}>Certificates</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Streak')}>
              <Text style={[styles.statValue, { color: '#FF6584' }]}>{stats.streak}</Text>
              <Text style={styles.statLabel}>Day Streak 🔥</Text>
            </TouchableOpacity>
          </>
        )}
        {user?.role === 'instructor' && (
          <>
            <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Courses')}>
              <Text style={[styles.statValue, { color: '#6C63FF' }]}>{stats.courses}</Text>
              <Text style={styles.statLabel}>My Courses</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Analytics')}>
              <Text style={[styles.statValue, { color: '#43C678' }]}>{stats.students || 0}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Analytics')}>
              <Text style={[styles.statValue, { color: '#FFB347' }]}>{stats.rating || '0.0'}</Text>
              <Text style={styles.statLabel}>Avg Rating ⭐</Text>
            </TouchableOpacity>
          </>
        )}
        {user?.role === 'admin' && (
          <>
            <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Users')}>
              <Text style={[styles.statValue, { color: '#6C63FF' }]}>{stats.courses}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Courses')}>
              <Text style={[styles.statValue, { color: '#43C678' }]}>{stats.certificates}</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('AdminLogs')}>
              <Text style={[styles.statValue, { color: '#FF6584' }]}>Admin</Text>
              <Text style={styles.statLabel}>Full Access</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ── LEARNING section ── */}
      <View style={styles.menuSection}>
        <SectionHeader title="LEARNING" />
        <MenuItem
          icon="person-outline"
          label="Edit Profile"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <MenuItem
          icon="analytics-outline"
          label="Analytics Dashboard"
          onPress={() => navigation.navigate('Analytics')}
        />
        {/* Student-only items */}
        {user?.role === 'student' && (
          <>
            <MenuItem
              icon="ribbon-outline"
              label="My Certificates"
              onPress={() => navigation.navigate('Certificate')}
            />
            <MenuItem
              icon="trending-up-outline"
              label="My Progress"
              onPress={() => navigation.navigate('Progress')}
            />
          </>
        )}
        {/* Instructor-only items */}
        {user?.role === 'instructor' && (
          <>
            <MenuItem
              icon="book-outline"
              label="My Courses"
              onPress={() => navigation.navigate('Courses')}
            />
            <MenuItem
              icon="checkmark-done-outline"
              label="Student Submissions"
              onPress={() => navigation.navigate('InstructorSubmissions')}
            />
          </>
        )}
      </View>

      {/* ── ENGAGEMENT section ── */}
      <View style={styles.menuSection}>
        <SectionHeader title="ENGAGEMENT" />
        <MenuItem
          icon="megaphone-outline"
          label="Announcements"
          badge={announcementCount > 0 ? announcementCount : null}
          onPress={() => navigation.navigate('Announcements')}
        />
        {/* Student-only engagement */}
        {user?.role === 'student' && (
          <>
            <MenuItem
              icon="flame-outline"
              label="Learning Streak"
              onPress={() => navigation.navigate('Streak')}
            />
            <MenuItem
              icon="trophy-outline"
              label="My Badges"
              onPress={() => navigation.navigate('Badges')}
            />
          </>
        )}
        {/* Instructor engagement */}
        {user?.role === 'instructor' && (
          <MenuItem
            icon="chatbubbles-outline"
            label="Discussions"
            onPress={() => navigation.navigate('InstructorDiscussions')}
          />
        )}
        {/* Admin engagement */}
        {user?.role === 'admin' && (
          <>
            <MenuItem
              icon="people-outline"
              label="User Management"
              onPress={() => navigation.navigate('Users')}
            />
            <MenuItem
              icon="flag-outline"
              label="Content Reports"
              onPress={() => navigation.navigate('AdminReports')}
            />
          </>
        )}
      </View>

      {/* ── ACCOUNT section ── */}
      <View style={styles.menuSection}>
        <SectionHeader title="ACCOUNT" />
        <MenuItem
          icon="settings-outline"
          label="Settings"
          onPress={() => navigation.navigate('Settings')}
        />
        <MenuItem
          icon="headset-outline"
          label="Help & Support"
          onPress={() => navigation.navigate('HelpSupport')}
        />
        <MenuItem
          icon="log-out-outline"
          label="Logout"
          onPress={handleLogout}
          danger
        />
      </View>

      {/* Bottom padding */}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // Banner
  banner: {
    height: 120,
    backgroundColor: PRIMARY,
  },

  // Avatar
  avatarWrapper: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },

  // Name section
  nameSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: PRIMARY + '20',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: PRIMARY,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginVertical: 4,
  },

  // Menu sections
  menuSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#aaa',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    backgroundColor: '#fafafa',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PRIMARY + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuIconCircleDanger: {
    backgroundColor: '#EF444415',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a2e',
    fontWeight: '500',
  },
  menuLabelDanger: {
    color: '#EF4444',
  },
  menuBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  menuBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default UserProfileScreen;
