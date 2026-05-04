import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

const PRIMARY = '#6C63FF';

const BatchEnrollmentScreen = ({ route, navigation }) => {
  const { courseId, courseTitle } = route.params || {};
  const [emails, setEmails] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [results, setResults] = useState(null);

  const handleBatchEnroll = async () => {
    const emailList = emails
      .split('\n')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (emailList.length === 0) {
      Alert.alert('Error', 'Please enter at least one email address');
      return;
    }

    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailList.filter(e => !emailRegex.test(e));
    
    if (invalidEmails.length > 0) {
      Alert.alert(
        'Invalid Emails',
        `The following emails are invalid:\n${invalidEmails.join('\n')}`
      );
      return;
    }

    try {
      setEnrolling(true);
      const response = await api.post(`${ENDPOINTS.ENROLLMENTS}/batch`, {
        courseId,
        emails: emailList,
      });

      const { successful, failed } = response.data.data;
      
      setResults({
        successful: successful || [],
        failed: failed || [],
      });

      if (failed.length === 0) {
        Alert.alert(
          'Success!',
          `${successful.length} student(s) enrolled successfully!`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          'Partial Success',
          `${successful.length} enrolled, ${failed.length} failed`
        );
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to enroll students');
    } finally {
      setEnrolling(false);
    }
  };

  const exampleEmails = `student1@example.com
student2@example.com
student3@example.com`;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="people" size={32} color={PRIMARY} />
          </View>
          <Text style={styles.headerTitle}>Batch Enrollment</Text>
          <Text style={styles.headerSub}>
            Enroll multiple students at once for: {courseTitle}
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>📝 Instructions:</Text>
          <Text style={styles.instructionsText}>
            • Enter one email address per line{'\n'}
            • Students will be automatically enrolled{'\n'}
            • They will receive a notification{'\n'}
            • Invalid emails will be skipped
          </Text>
        </View>

        {/* Email Input */}
        <Text style={styles.label}>Student Email Addresses *</Text>
        <TextInput
          style={styles.textArea}
          value={emails}
          onChangeText={setEmails}
          placeholder={exampleEmails}
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={10}
          textAlignVertical="top"
        />
        <Text style={styles.hint}>
          {emails.split('\n').filter(e => e.trim()).length} email(s) entered
        </Text>

        {/* Quick Add Buttons */}
        <View style={styles.quickAddSection}>
          <Text style={styles.quickAddTitle}>Quick Add:</Text>
          <View style={styles.quickAddButtons}>
            <TouchableOpacity
              style={styles.quickAddBtn}
              onPress={() => {
                const sample = `student${Date.now()}@example.com`;
                setEmails(emails ? `${emails}\n${sample}` : sample);
              }}
            >
              <Ionicons name="add-circle-outline" size={16} color={PRIMARY} />
              <Text style={styles.quickAddBtnText}>Add Sample</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAddBtn}
              onPress={() => setEmails('')}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={[styles.quickAddBtnText, { color: '#EF4444' }]}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results */}
        {results && (
          <View style={styles.resultsBox}>
            <Text style={styles.resultsTitle}>Enrollment Results:</Text>
            
            {results.successful.length > 0 && (
              <View style={styles.resultSection}>
                <View style={styles.resultHeader}>
                  <Ionicons name="checkmark-circle" size={20} color="#43C678" />
                  <Text style={[styles.resultHeaderText, { color: '#43C678' }]}>
                    Successful ({results.successful.length})
                  </Text>
                </View>
                {results.successful.map((email, index) => (
                  <Text key={index} style={styles.resultEmail}>✓ {email}</Text>
                ))}
              </View>
            )}

            {results.failed.length > 0 && (
              <View style={styles.resultSection}>
                <View style={styles.resultHeader}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                  <Text style={[styles.resultHeaderText, { color: '#EF4444' }]}>
                    Failed ({results.failed.length})
                  </Text>
                </View>
                {results.failed.map((item, index) => (
                  <View key={index} style={styles.failedItem}>
                    <Text style={styles.resultEmail}>✗ {item.email}</Text>
                    <Text style={styles.failedReason}>{item.reason}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Enroll Button */}
        <TouchableOpacity
          style={[styles.enrollBtn, enrolling && { opacity: 0.6 }]}
          onPress={handleBatchEnroll}
          disabled={enrolling || !emails.trim()}
        >
          {enrolling ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="people" size={20} color="#fff" />
              <Text style={styles.enrollBtnText}>Enroll Students</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16 },
  header: { alignItems: 'center', marginBottom: 24 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PRIMARY + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 8 },
  headerSub: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 20 },
  instructionsBox: {
    backgroundColor: '#FFF9E6',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE5A3',
  },
  instructionsTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 8 },
  instructionsText: { fontSize: 13, color: '#666', lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#eee',
    minHeight: 200,
    fontFamily: 'monospace',
  },
  hint: { fontSize: 12, color: '#888', marginTop: 6, marginBottom: 16 },
  quickAddSection: { marginBottom: 20 },
  quickAddTitle: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
  quickAddButtons: { flexDirection: 'row' },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  quickAddBtnText: { fontSize: 13, color: PRIMARY, marginLeft: 6, fontWeight: '600' },
  resultsBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  resultsTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginBottom: 12 },
  resultSection: { marginBottom: 16 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  resultHeaderText: { fontSize: 14, fontWeight: '600', marginLeft: 6 },
  resultEmail: { fontSize: 13, color: '#555', marginLeft: 26, marginBottom: 4 },
  failedItem: { marginLeft: 26, marginBottom: 8 },
  failedReason: { fontSize: 11, color: '#EF4444', marginTop: 2 },
  enrollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
  },
  enrollBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 8 },
});

export default BatchEnrollmentScreen;
