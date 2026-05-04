import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { discussionService } from '../../services/discussionService';
import colors from '../../constants/colors';

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam or misleading', icon: 'alert-circle' },
  { id: 'harassment', label: 'Harassment or hate speech', icon: 'warning' },
  { id: 'inappropriate', label: 'Inappropriate content', icon: 'eye-off' },
  { id: 'copyright', label: 'Copyright violation', icon: 'document-text' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

const ReportScreen = ({ navigation, route }) => {
  const { contentType, contentId } = route.params;
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description');
      return;
    }

    try {
      setSubmitting(true);
      await discussionService.createReport({
        contentType,
        contentId,
        reason: selectedReason,
        description: description.trim(),
      });

      Alert.alert(
        'Report Submitted',
        'Thank you for helping us maintain a safe community. We will review your report.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="flag" size={48} color={colors.danger} />
        <Text style={styles.title}>Report Content</Text>
        <Text style={styles.subtitle}>
          Help us understand what's wrong with this content
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Reason for reporting</Text>
        {REPORT_REASONS.map((reason) => (
          <TouchableOpacity
            key={reason.id}
            style={[
              styles.reasonButton,
              selectedReason === reason.id && styles.reasonButtonSelected,
            ]}
            onPress={() => setSelectedReason(reason.id)}
          >
            <Ionicons
              name={reason.icon}
              size={24}
              color={selectedReason === reason.id ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.reasonText,
                selectedReason === reason.id && styles.reasonTextSelected,
              ]}
            >
              {reason.label}
            </Text>
            <View style={styles.radioOuter}>
              {selectedReason === reason.id && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Additional details</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Please provide more information about why you're reporting this content..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.charCount}>{description.length}/500</Text>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.infoText}>
          Reports are confidential. The content creator will not know who reported it.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitButtonText}>
          {submitting ? 'Submitting...' : 'Submit Report'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  reasonButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  reasonText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  reasonTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  textArea: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
    marginLeft: 8,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: colors.danger,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
});

export default ReportScreen;
