import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { discussionService } from '../../services/discussionService';
import colors from '../../constants/colors';

const AddDiscussionScreen = ({ navigation, route }) => {
  const { courseId } = route.params;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Please enter content');
      return;
    }

    try {
      setSubmitting(true);
      await discussionService.createDiscussion({
        courseId,
        title: title.trim(),
        content: content.trim(),
      });

      Alert.alert('Success', 'Discussion posted successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to post discussion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter discussion title"
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />
          <Text style={styles.charCount}>{title.length}/200</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Content</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Share your thoughts, ask questions, or start a conversation..."
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text style={styles.charCount}>{content.length}/2000</Text>
        </View>

        <View style={styles.guidelinesBox}>
          <Text style={styles.guidelinesTitle}>Discussion Guidelines</Text>
          <Text style={styles.guidelinesText}>
            • Be respectful and constructive{'\n'}
            • Stay on topic{'\n'}
            • No spam or self-promotion{'\n'}
            • Help others learn
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Posting...' : 'Post Discussion'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    minHeight: 200,
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  guidelinesBox: {
    backgroundColor: colors.primary + '10',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  guidelinesText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
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

export default AddDiscussionScreen;
