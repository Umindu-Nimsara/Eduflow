import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Switch, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIMARY = '#6C63FF';

const NotificationPreferencesScreen = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Notification preferences
  const [newEnrollment, setNewEnrollment] = useState(true);
  const [newSubmission, setNewSubmission] = useState(true);
  const [newQuestion, setNewQuestion] = useState(true);
  const [courseDeadline, setCourseDeadline] = useState(true);
  const [assignmentDue, setAssignmentDue] = useState(true);
  const [lowProgress, setLowProgress] = useState(true);
  const [inactiveStudent, setInactiveStudent] = useState(true);
  const [newReview, setNewReview] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Notification methods
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem('notificationPreferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        setNewEnrollment(prefs.newEnrollment ?? true);
        setNewSubmission(prefs.newSubmission ?? true);
        setNewQuestion(prefs.newQuestion ?? true);
        setCourseDeadline(prefs.courseDeadline ?? true);
        setAssignmentDue(prefs.assignmentDue ?? true);
        setLowProgress(prefs.lowProgress ?? true);
        setInactiveStudent(prefs.inactiveStudent ?? true);
        setNewReview(prefs.newReview ?? true);
        setSystemUpdates(prefs.systemUpdates ?? false);
        setMarketingEmails(prefs.marketingEmails ?? false);
        setPushNotifications(prefs.pushNotifications ?? true);
        setEmailNotifications(prefs.emailNotifications ?? true);
        setSmsNotifications(prefs.smsNotifications ?? false);
      }
    } catch (err) {
      console.error('Load preferences error:', err);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const prefs = {
        newEnrollment,
        newSubmission,
        newQuestion,
        courseDeadline,
        assignmentDue,
        lowProgress,
        inactiveStudent,
        newReview,
        systemUpdates,
        marketingEmails,
        pushNotifications,
        emailNotifications,
        smsNotifications,
      };
      await AsyncStorage.setItem('notificationPreferences', JSON.stringify(prefs));
      Alert.alert('Success', 'Notification preferences saved!');
    } catch (err) {
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const PreferenceItem = ({ icon, title, description, value, onValueChange, color = PRIMARY }) => (
    <View style={styles.preferenceItem}>
      <View style={[styles.preferenceIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.preferenceContent}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        <Text style={styles.preferenceDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#ddd', true: color + '60' }}
        thumbColor={value ? color : '#f4f3f4'}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Student Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Student Activity</Text>
          <PreferenceItem
            icon="person-add"
            title="New Enrollment"
            description="When a student enrolls in your course"
            value={newEnrollment}
            onValueChange={setNewEnrollment}
            color="#43C678"
          />
          <PreferenceItem
            icon="document-text"
            title="New Submission"
            description="When a student submits an assignment"
            value={newSubmission}
            onValueChange={setNewSubmission}
            color="#3B82F6"
          />
          <PreferenceItem
            icon="help-circle"
            title="New Question"
            description="When a student posts a question"
            value={newQuestion}
            onValueChange={setNewQuestion}
            color="#FFB347"
          />
        </View>

        {/* Deadlines & Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deadlines & Reminders</Text>
          <PreferenceItem
            icon="calendar"
            title="Course Deadline"
            description="Remind me about upcoming course deadlines"
            value={courseDeadline}
            onValueChange={setCourseDeadline}
            color="#FF6584"
          />
          <PreferenceItem
            icon="time"
            title="Assignment Due"
            description="Remind me when assignments are due"
            value={assignmentDue}
            onValueChange={setAssignmentDue}
            color="#EF4444"
          />
        </View>

        {/* Student Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Student Progress</Text>
          <PreferenceItem
            icon="trending-down"
            title="Low Progress Alert"
            description="Alert me when students are falling behind"
            value={lowProgress}
            onValueChange={setLowProgress}
            color="#EF4444"
          />
          <PreferenceItem
            icon="moon"
            title="Inactive Student"
            description="Notify me about inactive students (7+ days)"
            value={inactiveStudent}
            onValueChange={setInactiveStudent}
            color="#888"
          />
        </View>

        {/* Feedback & Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feedback & Reviews</Text>
          <PreferenceItem
            icon="star"
            title="New Review"
            description="When students leave course reviews"
            value={newReview}
            onValueChange={setNewReview}
            color="#FFB347"
          />
        </View>

        {/* System */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System & Marketing</Text>
          <PreferenceItem
            icon="notifications"
            title="System Updates"
            description="Platform updates and new features"
            value={systemUpdates}
            onValueChange={setSystemUpdates}
            color="#26D0CE"
          />
          <PreferenceItem
            icon="mail"
            title="Marketing Emails"
            description="Tips, best practices, and promotions"
            value={marketingEmails}
            onValueChange={setMarketingEmails}
            color="#8B5CF6"
          />
        </View>

        {/* Notification Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Methods</Text>
          <PreferenceItem
            icon="phone-portrait"
            title="Push Notifications"
            description="Receive notifications on your device"
            value={pushNotifications}
            onValueChange={setPushNotifications}
            color={PRIMARY}
          />
          <PreferenceItem
            icon="mail-outline"
            title="Email Notifications"
            description="Receive notifications via email"
            value={emailNotifications}
            onValueChange={setEmailNotifications}
            color="#3B82F6"
          />
          <PreferenceItem
            icon="chatbubble"
            title="SMS Notifications"
            description="Receive notifications via SMS"
            value={smsNotifications}
            onValueChange={setSmsNotifications}
            color="#43C678"
          />
        </View>

        {/* Save Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={savePreferences}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Save Preferences</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  preferenceContent: { flex: 1 },
  preferenceTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginBottom: 2 },
  preferenceDescription: { fontSize: 12, color: '#888' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 8 },
});

export default NotificationPreferencesScreen;
