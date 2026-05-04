import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PRIMARY = '#6C63FF';
const SUCCESS = '#43C678';
const INFO = '#3B82F6';

const DataExportScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [exportData, setExportData] = useState(null);

  const exportOptions = [
    {
      id: 'user-data',
      title: 'My Complete Data',
      description: 'Export all your personal data including enrollments, progress, quiz attempts, assignments, and certificates',
      icon: 'person-circle',
      color: PRIMARY,
      endpoint: '/data-export/my-data'
    },
    {
      id: 'enrollments',
      title: 'Course Enrollments',
      description: 'List of all courses you are enrolled in with enrollment dates',
      icon: 'school',
      color: INFO,
      included: ['Course titles', 'Enrollment dates', 'Status']
    },
    {
      id: 'progress',
      title: 'Learning Progress',
      description: 'Your progress across all courses including completion percentages',
      icon: 'trending-up',
      color: SUCCESS,
      included: ['Completion percentages', 'Completed lessons', 'Last accessed dates']
    },
    {
      id: 'assessments',
      title: 'Quiz & Assignment Results',
      description: 'All your quiz attempts and assignment submissions with grades',
      icon: 'document-text',
      color: '#FFB347',
      included: ['Quiz scores', 'Assignment grades', 'Submission dates']
    },
    {
      id: 'certificates',
      title: 'Certificates',
      description: 'All certificates you have earned',
      icon: 'ribbon',
      color: '#EF4444',
      included: ['Certificate IDs', 'Issue dates', 'Course names']
    }
  ];

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await api.get('/data-export/my-data');
      const data = response.data.data;
      setExportData(data);

      // Format data as readable text
      const formattedData = formatExportData(data);

      Alert.alert(
        'Export Complete',
        'Your data has been exported. Would you like to share it?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share',
            onPress: () => shareData(formattedData)
          },
          {
            text: 'View',
            onPress: () => navigation.navigate('DataPreview', { data })
          }
        ]
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const formatExportData = (data) => {
    let text = '=== MY LEARNING DATA EXPORT ===\n\n';
    text += `Export Date: ${new Date(data.exportDate).toLocaleString()}\n\n`;
    
    text += '--- USER INFORMATION ---\n';
    text += `Name: ${data.user.name}\n`;
    text += `Email: ${data.user.email}\n`;
    text += `Role: ${data.user.role}\n`;
    text += `Member Since: ${new Date(data.user.createdAt).toLocaleDateString()}\n\n`;
    
    text += '--- STATISTICS ---\n';
    text += `Total Enrollments: ${data.statistics.totalEnrollments}\n`;
    text += `Total Quizzes: ${data.statistics.totalQuizzes}\n`;
    text += `Total Assignments: ${data.statistics.totalAssignments}\n`;
    text += `Total Certificates: ${data.statistics.totalCertificates}\n`;
    text += `Average Quiz Score: ${data.statistics.averageQuizScore.toFixed(1)}%\n\n`;
    
    if (data.enrollments.length > 0) {
      text += '--- COURSE ENROLLMENTS ---\n';
      data.enrollments.forEach((e, i) => {
        text += `${i + 1}. ${e.course} (${e.status})\n`;
        text += `   Enrolled: ${new Date(e.enrolledAt).toLocaleDateString()}\n`;
      });
      text += '\n';
    }
    
    if (data.progress.length > 0) {
      text += '--- LEARNING PROGRESS ---\n';
      data.progress.forEach((p, i) => {
        text += `${i + 1}. ${p.course}\n`;
        text += `   Completion: ${p.completionPercentage}%\n`;
        text += `   Completed Lessons: ${p.completedLessons}\n`;
      });
      text += '\n';
    }
    
    if (data.quizAttempts.length > 0) {
      text += '--- QUIZ ATTEMPTS ---\n';
      data.quizAttempts.forEach((q, i) => {
        text += `${i + 1}. ${q.quiz}\n`;
        text += `   Score: ${q.score}/${q.totalMarks} (${q.percentage}%)\n`;
        text += `   Date: ${new Date(q.completedAt).toLocaleDateString()}\n`;
      });
      text += '\n';
    }
    
    if (data.assignments.length > 0) {
      text += '--- ASSIGNMENTS ---\n';
      data.assignments.forEach((a, i) => {
        text += `${i + 1}. ${a.assignment}\n`;
        text += `   Grade: ${a.grade}/${a.totalMarks}\n`;
        text += `   Submitted: ${new Date(a.submittedAt).toLocaleDateString()}\n`;
      });
      text += '\n';
    }
    
    if (data.certificates.length > 0) {
      text += '--- CERTIFICATES ---\n';
      data.certificates.forEach((c, i) => {
        text += `${i + 1}. ${c.course}\n`;
        text += `   Certificate ID: ${c.certificateId}\n`;
        text += `   Issued: ${new Date(c.issuedAt).toLocaleDateString()}\n`;
      });
      text += '\n';
    }
    
    return text;
  };

  const shareData = async (formattedData) => {
    try {
      await Share.share({
        message: formattedData,
        title: 'My Learning Data Export'
      });
    } catch (err) {
      console.error('Error sharing data:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Exporting your data..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Data Export</Text>
          <Text style={styles.headerSubtitle}>Download your learning data</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={INFO} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>About Data Export</Text>
            <Text style={styles.infoText}>
              You can export all your personal data from the platform. This includes your profile information, 
              course enrollments, learning progress, quiz results, assignment submissions, and certificates.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Included</Text>
          {exportOptions.map((option) => (
            <View key={option.id} style={styles.optionCard}>
              <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                <Ionicons name={option.icon} size={28} color={option.color} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
                {option.included && (
                  <View style={styles.includedContainer}>
                    {option.included.map((item, index) => (
                      <View key={index} style={styles.includedItem}>
                        <Ionicons name="checkmark-circle" size={14} color={SUCCESS} />
                        <Text style={styles.includedText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <View style={styles.privacyCard}>
            <View style={styles.privacyItem}>
              <Ionicons name="shield-checkmark" size={20} color={SUCCESS} />
              <Text style={styles.privacyText}>Your data is encrypted and secure</Text>
            </View>
            <View style={styles.privacyItem}>
              <Ionicons name="lock-closed" size={20} color={SUCCESS} />
              <Text style={styles.privacyText}>Only you can access your exported data</Text>
            </View>
            <View style={styles.privacyItem}>
              <Ionicons name="time" size={20} color={SUCCESS} />
              <Text style={styles.privacyText}>Data is generated in real-time</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
          <Ionicons name="download" size={24} color="#fff" />
          <Text style={styles.exportButtonText}>Export My Data</Text>
        </TouchableOpacity>

        <View style={styles.noteCard}>
          <Ionicons name="alert-circle-outline" size={20} color="#888" />
          <Text style={styles.noteText}>
            The export will include all data up to the current moment. You can export your data 
            at any time and as many times as you need.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: PRIMARY,
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: { marginRight: 12 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  
  content: { flex: 1 },
  
  infoCard: {
    flexDirection: 'row',
    backgroundColor: INFO + '10',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoTextContainer: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginBottom: 6 },
  infoText: { fontSize: 13, color: '#666', lineHeight: 18 },
  
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12 },
  
  optionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 },
  optionDescription: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 8 },
  
  includedContainer: { marginTop: 4 },
  includedItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  includedText: { fontSize: 12, color: '#888' },
  
  privacyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2 },
  privacyItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  privacyText: { fontSize: 14, color: '#1a1a2e', flex: 1 },
  
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    gap: 8,
  },
  exportButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  
  noteCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  noteText: { flex: 1, fontSize: 12, color: '#888', lineHeight: 18 },
});

export default DataExportScreen;
