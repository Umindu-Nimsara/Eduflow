import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../constants/api';
import colors from '../../constants/colors';

const CertificateManagementScreen = ({ route, navigation }) => {
  const { courseId, courseName } = route.params;
  const { token } = useContext(AuthContext);
  const [certificates, setCertificates] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    navigation.setOptions({ title: `Certificates - ${courseName}` });
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch certificates
      const certResponse = await axios.get(`${API_URL}/certificates/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCertificates(certResponse.data.data || []);

      // Fetch enrolled students - Fixed endpoint
      const enrollResponse = await axios.get(`${API_URL}/enrollments?courseId=${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(enrollResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays instead of showing error
      setCertificates([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const issueCertificate = async (userId, userName) => {
    Alert.alert(
      'Issue Certificate',
      `Issue certificate to ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Issue',
          onPress: async () => {
            try {
              await axios.post(
                `${API_URL}/certificates/issue`,
                { userId, courseId },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert('Success', 'Certificate issued successfully');
              fetchData();
            } catch (error) {
              console.error('Error issuing certificate:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to issue certificate');
            }
          }
        }
      ]
    );
  };

  const revokeCertificate = (certificateId, userName) => {
    Alert.alert(
      'Revoke Certificate',
      `Revoke certificate for ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/certificates/${certificateId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Success', 'Certificate revoked successfully');
              fetchData();
            } catch (error) {
              console.error('Error revoking certificate:', error);
              Alert.alert('Error', 'Failed to revoke certificate');
            }
          }
        }
      ]
    );
  };

  const openIssueModal = () => {
    // Filter students who don't have certificates
    const certificateUserIds = certificates.map(cert => cert.userId._id);
    const eligibleStudents = students.filter(
      enrollment => !certificateUserIds.includes(enrollment.userId._id)
    );

    if (eligibleStudents.length === 0) {
      Alert.alert('Info', 'All enrolled students already have certificates');
      return;
    }

    setModalVisible(true);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderCertificate = ({ item }) => (
    <View style={styles.certificateCard}>
      <View style={styles.certificateHeader}>
        <View style={styles.studentInfo}>
          {item.userId.profilePicture ? (
            <Image
              source={{ uri: item.userId.profilePicture }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {item.userId.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.studentDetails}>
            <Text style={styles.studentName}>{item.userId.name}</Text>
            <Text style={styles.studentEmail}>{item.userId.email}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.revokeButton}
          onPress={() => revokeCertificate(item._id, item.userId.name)}
        >
          <Ionicons name="close-circle" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.certificateInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>Issued: {formatDate(item.issuedAt)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="ribbon-outline" size={16} color={colors.success} />
          <Text style={[styles.infoText, styles.successText]}>Certificate Active</Text>
        </View>
      </View>

      <View style={styles.certificateId}>
        <Text style={styles.certificateIdLabel}>Certificate ID:</Text>
        <Text style={styles.certificateIdValue}>
          CERT-{item._id.slice(-8).toUpperCase()}
        </Text>
      </View>
    </View>
  );

  const renderStudentForIssue = ({ item }) => {
    const certificateUserIds = certificates.map(cert => cert.userId._id);
    const hasCertificate = certificateUserIds.includes(item.userId._id);

    if (hasCertificate) return null;

    return (
      <TouchableOpacity
        style={styles.studentCard}
        onPress={() => issueCertificate(item.userId._id, item.userId.name)}
      >
        <View style={styles.studentInfo}>
          {item.userId.profilePicture ? (
            <Image
              source={{ uri: item.userId.profilePicture }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {item.userId.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.studentDetails}>
            <Text style={styles.studentName}>{item.userId.name}</Text>
            <Text style={styles.studentEmail}>{item.userId.email}</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${item.completionPercentage || 0}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {item.completionPercentage || 0}% Complete
              </Text>
            </View>
          </View>
        </View>
        <Ionicons name="add-circle" size={32} color={colors.primary} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{certificates.length}</Text>
            <Text style={styles.statLabel}>Issued</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{students.length}</Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {students.length - certificates.length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.issueButton} onPress={openIssueModal}>
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.issueButtonText}>Issue Certificate</Text>
        </TouchableOpacity>
      </View>

      {certificates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎓</Text>
          <Text style={styles.emptyTitle}>No Certificates Issued</Text>
          <Text style={styles.emptyText}>
            Issue certificates to students who complete the course
          </Text>
          <TouchableOpacity style={styles.startButton} onPress={openIssueModal}>
            <Text style={styles.startButtonText}>Issue First Certificate</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={certificates}
          renderItem={renderCertificate}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Issue Certificate Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Issue Certificate</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={students.filter(
              s =>
                s.userId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.userId.email.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            renderItem={renderStudentForIssue}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.modalListContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyTitle}>All Done!</Text>
                <Text style={styles.emptyText}>
                  All eligible students have certificates
                </Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background
  },
  header: {
    backgroundColor: colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16
  },
  statBox: {
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4
  },
  issueButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8
  },
  issueButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  },
  listContainer: {
    padding: 16
  },
  certificateCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: colors.success
  },
  certificateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12
  },
  avatarPlaceholder: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold'
  },
  studentDetails: {
    flex: 1
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4
  },
  studentEmail: {
    fontSize: 14,
    color: colors.textSecondary
  },
  revokeButton: {
    padding: 4
  },
  certificateInfo: {
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8
  },
  successText: {
    color: colors.success,
    fontWeight: '600'
  },
  certificateId: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  certificateIdLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  certificateIdValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: 'bold',
    fontFamily: 'monospace'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  startButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    marginLeft: 8
  },
  modalListContainer: {
    padding: 16
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  progressContainer: {
    marginTop: 8
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary
  }
});

export default CertificateManagementScreen;
