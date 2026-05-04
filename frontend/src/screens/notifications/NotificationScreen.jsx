import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../../services/notificationService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';
import colors from '../../constants/colors';

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('ModuleDashboard')}
        >
          <Ionicons name="menu" size={24} color={colors.white} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await notificationService.getMyNotifications(1, 50);
      setNotifications(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (err) {
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const handleDelete = async (notificationId) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationService.deleteNotification(notificationId);
              fetchNotifications();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete notification');
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'enrollment':
        return 'school';
      case 'assignment':
        return 'document-attach';
      case 'quiz':
        return 'document-text';
      case 'discussion':
        return 'chatbubbles';
      case 'announcement':
        return 'megaphone';
      case 'badge':
        return 'trophy';
      case 'certificate':
        return 'ribbon';
      default:
        return 'notifications';
    }
  };

  const renderNotificationCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.cardUnread]}
      onPress={() => handleMarkAsRead(item._id)}
      onLongPress={() => handleDelete(item._id)}
    >
      <View style={[styles.iconContainer, !item.isRead && styles.iconContainerUnread]}>
        <Ionicons 
          name={getNotificationIcon(item.type)} 
          size={24} 
          color={!item.isRead ? colors.primary : colors.textSecondary} 
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.isRead && styles.titleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.timestamp}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchNotifications} />;
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <View style={styles.header}>
          <Text style={styles.headerText}>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</Text>
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllButton}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderNotificationCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchNotifications(true)}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState 
            message="No notifications yet" 
            icon="notifications-outline"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  markAllButton: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardUnread: {
    backgroundColor: colors.primary + '08',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerUnread: {
    backgroundColor: colors.primary + '20',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  titleUnread: {
    fontWeight: 'bold',
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  headerButton: {
    padding: 8,
    marginHorizontal: 8,
  },
});

export default NotificationScreen;
