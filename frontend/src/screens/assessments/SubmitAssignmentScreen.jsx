import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

const PRIMARY = '#6C63FF';

const SubmitAssignmentScreen = ({ navigation, route }) => {
  const { assignmentId, assignmentTitle } = route.params;
  const [content,     setContent]     = useState('');
  const [file,        setFile]        = useState(null);
  const [docLink,     setDocLink]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword',
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
               'image/*', 'text/*'],
        copyToCacheDirectory: true,
      });

      // Expo SDK 49+ returns assets array
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFile(result.assets[0]);
      } else if (result.type === 'success') {
        // Older SDK
        setFile(result);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !file && !docLink.trim()) {
      Alert.alert('Error', 'Please write your answer, attach a file, or provide a Google Doc link');
      return;
    }

    Alert.alert(
      'Submit Assignment',
      'Are you sure you want to submit? You can resubmit before the deadline.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: doSubmit },
      ]
    );
  };

  const doSubmit = async () => {
    try {
      setSubmitting(true);
      console.log('=== ASSIGNMENT SUBMISSION START ===');
      console.log('Assignment ID:', assignmentId);
      console.log('Content:', content.substring(0, 50));
      console.log('File:', file ? { name: file.name, size: file.size, type: file.mimeType } : 'No file');

      let fileUrl = '';

      // If file exists, upload to backend first
      if (file) {
        console.log('Uploading file to backend...');
        try {
          const formData = new FormData();
          formData.append('file', {
            uri: file.uri,
            type: file.mimeType || 'application/octet-stream',
            name: file.name || 'submission',
          });
          
          const uploadResponse = await api.post('/files/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 120000, // 2 minutes for large files
          });
          
          fileUrl = uploadResponse.data.data?.url || '';
          console.log('File uploaded to backend:', fileUrl);
        } catch (uploadErr) {
          console.error('Backend upload error:', uploadErr);
          Alert.alert('Upload Error', 'Failed to upload file. Please try again.');
          setSubmitting(false);
          return;
        }
      }

      // Submit assignment with file URL
      const payload = {
        assignmentId,
        submissionText: content.trim() || undefined,
        submissionUrl: fileUrl || docLink.trim() || undefined,
      };

      console.log('Sending request to:', ENDPOINTS.SUBMISSIONS);
      console.log('Payload:', payload);
      
      const response = await api.post(ENDPOINTS.SUBMISSIONS, payload);
      
      console.log('Submission response:', response.data);

      Alert.alert('✅ Submitted!', 'Your assignment has been submitted successfully.', [
        { text: 'OK', onPress: () => {
          // Navigate back to assignment detail to show submission status
          navigation.navigate('AssignmentDetail', { assignmentId });
        }},
      ]);
    } catch (err) {
      console.error('=== ASSIGNMENT SUBMISSION ERROR ===');
      console.error('Error:', err);
      console.error('Response:', err.response?.data);
      console.error('Status:', err.response?.status);
      console.error('Message:', err.message);
      
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Assignment title */}
      {assignmentTitle && (
        <View style={styles.titleBox}>
          <Ionicons name="document-attach" size={20} color={PRIMARY} />
          <Text style={styles.titleText}>{assignmentTitle}</Text>
        </View>
      )}

      {/* Text answer */}
      <View style={styles.section}>
        <Text style={styles.label}>Your Answer</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Write your answer here..."
          placeholderTextColor="#aaa"
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
        />
      </View>

      {/* File attachment */}
      <View style={styles.section}>
        <Text style={styles.label}>Attach File (PDF, Word, Image)</Text>
        <TouchableOpacity style={styles.fileBtn} onPress={handlePickDocument}>
          <Ionicons name="cloud-upload-outline" size={28} color={PRIMARY} />
          <Text style={styles.fileBtnText}>
            {file ? 'Change File' : 'Choose File'}
          </Text>
          <Text style={styles.fileBtnSub}>PDF, DOC, DOCX, Images</Text>
        </TouchableOpacity>

        {file && (
          <View style={styles.filePreview}>
            <Ionicons
              name={file.mimeType?.includes('pdf') ? 'document-text' : 'document'}
              size={28}
              color={PRIMARY}
            />
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
              <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
            </View>
            <TouchableOpacity onPress={() => setFile(null)} style={styles.removeFile}>
              <Ionicons name="close-circle" size={22} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Google Doc Link */}
      <View style={styles.section}>
        <Text style={styles.label}>Or Provide Google Doc Link</Text>
        <View style={styles.linkInputContainer}>
          <Ionicons name="link-outline" size={20} color="#888" style={styles.linkIcon} />
          <TextInput
            style={styles.linkInput}
            placeholder="Paste Google Doc link here..."
            placeholderTextColor="#aaa"
            value={docLink}
            onChangeText={setDocLink}
            autoCapitalize="none"
            keyboardType="url"
          />
          {docLink.length > 0 && (
            <TouchableOpacity onPress={() => setDocLink('')} style={styles.clearLink}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.linkHint}>
          Share your Google Doc with "Anyone with the link can view"
        </Text>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={18} color={PRIMARY} />
        <Text style={styles.infoText}>
          You can submit text, file, or Google Doc link. You can resubmit before the deadline.
        </Text>
      </View>

      {/* Submit button */}
      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
            <Text style={styles.submitBtnText}>Submit Assignment</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  titleBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    marginBottom: 16, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3,
  },
  titleText: { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginLeft: 10, flex: 1 },
  section:   { marginBottom: 20 },
  label:     { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginBottom: 8 },
  textArea: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee',
    borderRadius: 10, padding: 14, fontSize: 15, color: '#1a1a2e', minHeight: 180,
  },
  fileBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderWidth: 2, borderColor: PRIMARY,
    borderStyle: 'dashed', borderRadius: 10, paddingVertical: 24,
  },
  fileBtnText: { fontSize: 16, fontWeight: '600', color: PRIMARY, marginTop: 6 },
  fileBtnSub:  { fontSize: 12, color: '#888', marginTop: 4 },
  filePreview: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    marginTop: 10, borderWidth: 1, borderColor: '#eee',
  },
  fileInfo:   { flex: 1, marginLeft: 12 },
  fileName:   { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  fileSize:   { fontSize: 12, color: '#888', marginTop: 2 },
  removeFile: { padding: 4 },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: PRIMARY + '10', borderRadius: 10, padding: 12, marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 13, color: PRIMARY, marginLeft: 8, lineHeight: 18 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 16, marginBottom: 32,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 8 },
  
  // Google Doc Link styles
  linkInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  linkIcon: {
    marginRight: 8,
  },
  linkInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1a1a2e',
  },
  clearLink: {
    padding: 4,
  },
  linkHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
    fontStyle: 'italic',
  },
});

export default SubmitAssignmentScreen;
