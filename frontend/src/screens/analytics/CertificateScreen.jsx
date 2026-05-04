import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analyticsService } from '../../services/analyticsService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';
import colors from '../../constants/colors';

const CertificateScreen = ({ navigation }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await analyticsService.getMyCertificates();
      setCertificates(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load certificates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleShare = async (certificate) => {
    try {
      await Share.share({
        message: `I've completed ${certificate.course.title} and earned a certificate! Certificate ID: ${certificate.certificateId}`,
        title: 'My Certificate',
      });
    } catch (err) {
      console.error('Error sharing certificate:', err);
    }
  };

  const handleDownload = async (certificateId) => {
    try {
      Alert.alert('Download', 'Certificate download feature coming soon!');
      // In production, implement actual download functionality
      // const blob = await analyticsService.downloadCertificate(certificateId);
    } catch (err) {
      Alert.alert('Error', 'Failed to download certificate');
    }
  };

  const renderCertificateCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="ribbon" size={32} color={colors.primary} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.certificateId}>ID: {item.certificateId}</Text>
          <Text style={styles.issueDate}>
            Issued: {new Date(item.issuedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.course.title}</Text>
        <Text style={styles.description}>
          This certifies that you have successfully completed the course
        </Text>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>{item.student.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="school-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>{item.course.instructor?.name || 'Instructor'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              Completed: {new Date(item.completionDate).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleShare(item)}
        >
          <Ionicons name="share-social-outline" size={20} color={colors.primary} />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
        <View style={styles.actionDivider} />
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDownload(item._id)}
        >
          <Ionicons name="download-outline" size={20} color={colors.primary} />
          <Text style={styles.actionButtonText}>Download</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchCertificates} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={certificates}
        renderItem={renderCertificateCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchCertificates(true)}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState 
            message="You haven't earned any certificates yet" 
            icon="ribbon-outline"
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
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary + '30',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.primary + '10',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  certificateId: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  issueDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
  },
  actionDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
});

export default CertificateScreen;
