import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../../services/notificationService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';
import colors from '../../constants/colors';

const AnnouncementScreen = ({ navigation }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await notificationService.getAllAnnouncements(1, 50);
      setAnnouncements(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getTargetRoleDisplay = (targetRole) => {
    switch (targetRole) {
      case 'student':
        return 'Students';
      case 'instructor':
        return 'Instructors';
      case 'all':
      default:
        return 'Everyone';
    }
  };

  const renderAnnouncementCard = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AnnouncementDetail', { announcementId: item._id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconBadge}>
            <Ionicons name="megaphone" size={16} color={colors.primary} />
          </View>
          <Text style={styles.timestamp}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.content} numberOfLines={3}>{item.content}</Text>

        <View style={styles.audienceBadge}>
          <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.audienceText}>
            For: {getTargetRoleDisplay(item.targetRole)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchAnnouncements} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={announcements}
        renderItem={renderAnnouncementCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAnnouncements(true)}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState 
            message="No announcements yet" 
            icon="megaphone-outline"
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
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  audienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  audienceText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
    textTransform: 'capitalize',
  },
});

export default AnnouncementScreen;
