import React, { useContext, useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import colors from '../constants/colors';

// Student screens
import CourseListScreen from '../screens/courses/CourseListScreen';
import EnrollmentScreen from '../screens/analytics/EnrollmentScreen';
import AnalyticsDashboardScreen from '../screens/analytics/AnalyticsDashboardScreen';
import GamificationDashboardScreen from '../screens/gamification/GamificationDashboardScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Instructor screens
import InstructorDashboardScreen from '../screens/instructor/InstructorDashboardScreen';
import InstructorCoursesScreen from '../screens/instructor/InstructorCoursesScreen';
import InstructorAnalyticsScreen from '../screens/instructor/InstructorAnalyticsScreen';

// Admin screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen';

const Tab = createBottomTabNavigator();
const PRIMARY = '#6C63FF';

// ── Notification bell ─────────────────────────────────────────────────────────
const NotificationBell = ({ navigation, unreadCount }) => (
  <TouchableOpacity
    style={styles.bellButton}
    onPress={() => navigation.navigate('NotificationList')}
  >
    <Ionicons name="notifications-outline" size={24} color={colors.white} />
    {unreadCount > 0 && <View style={styles.badge} />}
  </TouchableOpacity>
);

// ── Announcement bell ─────────────────────────────────────────────────────────
const AnnouncementBell = ({ navigation, announcementCount }) => (
  <TouchableOpacity
    style={styles.bellButton}
    onPress={() => navigation.navigate('Announcements')}
  >
    <Ionicons name="megaphone-outline" size={24} color={colors.white} />
    {announcementCount > 0 && (
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{announcementCount > 99 ? '99+' : announcementCount}</Text>
      </View>
    )}
  </TouchableOpacity>
);

// ── Common screen options ─────────────────────────────────────────────────────
const commonOptions = (navigation, unreadCount, announcementCount) => ({
  headerShown: true,
  headerStyle: { backgroundColor: PRIMARY },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: 'bold' },
  headerRight: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <AnnouncementBell navigation={navigation} announcementCount={announcementCount} />
      <NotificationBell navigation={navigation} unreadCount={unreadCount} />
    </View>
  ),
});

// ── Main navigator ────────────────────────────────────────────────────────────
const TabNavigator = () => {
  const { user } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const [announcementCount, setAnnouncementCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    fetchAnnouncementCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchAnnouncementCount();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      if (!user) return;
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data?.count || 0);
    } catch (err) { /* silent */ }
  };

  const fetchAnnouncementCount = async () => {
    try {
      if (!user) return;
      const response = await notificationService.getAllAnnouncements(1, 100);
      const announcements = response.data || [];
      setAnnouncementCount(announcements.length);
    } catch (err) { /* silent */ }
  };

  const role = user?.role || 'student';

  // ── INSTRUCTOR tabs ───────────────────────────────────────────────────────
  if (role === 'instructor') {
    return (
      <Tab.Navigator
        screenOptions={({ route, navigation }) => ({
          ...commonOptions(navigation, unreadCount, announcementCount),
          tabBarActiveTintColor: PRIMARY,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              Dashboard:  focused ? 'grid'              : 'grid-outline',
              Courses:    focused ? 'book'              : 'book-outline',
              Analytics:  focused ? 'analytics'         : 'analytics-outline',
              Profile:    focused ? 'person'            : 'person-outline',
            };
            return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Dashboard"  component={InstructorDashboardScreen} options={{ title: 'Dashboard' }} />
        <Tab.Screen name="Courses"    component={InstructorCoursesScreen}   options={{ title: 'My Courses' }} />
        <Tab.Screen name="Analytics"  component={InstructorAnalyticsScreen} options={{ title: 'Analytics' }} />
        <Tab.Screen name="Profile"    component={ProfileScreen}         options={{ title: 'Profile' }} />
      </Tab.Navigator>
    );
  }

  // ── ADMIN tabs ────────────────────────────────────────────────────────────
  if (role === 'admin') {
    return (
      <Tab.Navigator
        screenOptions={({ route, navigation }) => ({
          ...commonOptions(navigation, unreadCount, announcementCount),
          tabBarActiveTintColor: PRIMARY,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              Dashboard:  focused ? 'grid'              : 'grid-outline',
              Users:      focused ? 'people'            : 'people-outline',
              Courses:    focused ? 'book'              : 'book-outline',
              Analytics:  focused ? 'analytics'         : 'analytics-outline',
              Profile:    focused ? 'person'            : 'person-outline',
            };
            return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Dashboard"  component={AdminDashboardScreen}     options={{ title: 'Admin' }} />
        <Tab.Screen name="Users"      component={AdminUsersScreen}         options={{ title: 'Users' }} />
        <Tab.Screen name="Courses"    component={CourseListScreen}         options={{ title: 'Courses' }} />
        <Tab.Screen name="Analytics"  component={AdminAnalyticsScreen}     options={{ title: 'Analytics' }} />
        <Tab.Screen name="Profile"    component={ProfileScreen}        options={{ title: 'Profile' }} />
      </Tab.Navigator>
    );
  }

  // ── STUDENT tabs (default) ────────────────────────────────────────────────
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        ...commonOptions(navigation, unreadCount, announcementCount),
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Courses:      focused ? 'book'      : 'book-outline',
            'My Learning': focused ? 'school'   : 'school-outline',
            Gamification: focused ? 'trophy'    : 'trophy-outline',
            Analytics:    focused ? 'analytics' : 'analytics-outline',
            Profile:      focused ? 'person'    : 'person-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Courses"       component={CourseListScreen}              options={{ title: 'Courses' }} />
      <Tab.Screen name="My Learning"   component={EnrollmentScreen}              options={{ title: 'My Learning' }} />
      <Tab.Screen name="Gamification"  component={GamificationDashboardScreen}   options={{ title: 'Rewards' }} />
      <Tab.Screen name="Analytics"     component={AnalyticsDashboardScreen}      options={{ title: 'Analytics' }} />
      <Tab.Screen name="Profile"       component={ProfileScreen}                 options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  bellButton: {
    marginRight: 16,
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: PRIMARY,
  },
  countBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  countText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
});

export default TabNavigator;
