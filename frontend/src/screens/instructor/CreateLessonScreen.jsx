import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

const PRIMARY = '#6C63FF';

const CreateLessonScreen = ({ route, navigation }) => {
  const { user } = useContext(AuthContext);
  const preselectedCourseId = route.params?.courseId || '';

  const [courses,      setCourses]      = useState([]);
  const [courseId,     setCourseId]     = useState(preselectedCourseId);
  const [title,        setTitle]        = useState('');
  const [content,      setContent]      = useState('');
  const [videoUrl,     setVideoUrl]     = useState('');
  const [duration,     setDuration]     = useState('');
  const [orderIndex,   setOrderIndex]   = useState('');
  const [videoFile,    setVideoFile]    = useState(null);
  const [pdfFile,      setPdfFile]      = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => { fetchMyCourses(); }, []);

  const fetchMyCourses = async () => {
    try {
      setLoadingCourses(true);
      const res = await api.get(`${ENDPOINTS.COURSES}/instructor/${user.id}`);
      const data = res.data.data || [];
      setCourses(data);
      if (!preselectedCourseId && data.length > 0) setCourseId(data[0]._id);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        setVideoFile(result.assets[0]);
        setVideoUrl(''); // Clear URL if file picked
      } else if (result.type === 'success') {
        setVideoFile(result);
        setVideoUrl('');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword',
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        setPdfFile(result.assets[0]);
      } else if (result.type === 'success') {
        setPdfFile(result);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const uploadFile = async (file, folder) => {
    const formData = new FormData();
    formData.append('video', {
      uri:  file.uri,
      type: file.mimeType || 'application/octet-stream',
      name: file.name || 'upload',
    });
    const res = await api.post(`${ENDPOINTS.LESSON_UPLOAD_VIDEO}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data?.url || '';
  };

  const handleCreate = async () => {
    if (!courseId)     { Alert.alert('Error', 'Please select a course'); return; }
    if (!title.trim()) { Alert.alert('Error', 'Lesson title is required'); return; }

    try {
      setLoading(true);
      let finalVideoUrl = videoUrl.trim();
      let pdfUrl = '';

      // Upload video file if selected - TO BACKEND
      if (videoFile) {
        setUploading(true);
        setUploadProgress(0);
        try {
          console.log('=== VIDEO UPLOAD START (Backend) ===');
          console.log('Video file:', {
            uri: videoFile.uri,
            name: videoFile.name,
            type: videoFile.mimeType,
            size: videoFile.size
          });
          
          // Upload to backend
          const formData = new FormData();
          formData.append('video', {
            uri: videoFile.uri,
            type: videoFile.mimeType || 'video/mp4',
            name: videoFile.name || 'video.mp4',
          });
          
          const result = await api.post(ENDPOINTS.LESSON_UPLOAD_VIDEO, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 600000, // 10 minutes for large video files
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                console.log('Upload progress:', progress + '%');
                setUploadProgress(progress);
              }
            }
          });
          
          console.log('Upload result:', result.data);
          finalVideoUrl = result.data.data?.url || '';
          console.log('Final video URL:', finalVideoUrl);
          
          if (!finalVideoUrl) {
            throw new Error('Upload succeeded but no URL returned');
          }
          
        } catch (uploadErr) {
          console.error('=== VIDEO UPLOAD ERROR ===');
          console.error('Error:', uploadErr);
          
          const errorMsg = uploadErr.error || uploadErr.message || 'Unknown error';
          Alert.alert('Upload Error', `Failed to upload video: ${errorMsg}\n\nPlease try a URL instead.`);
          setLoading(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      // Upload PDF if selected - TO BACKEND
      if (pdfFile) {
        try {
          console.log('=== PDF UPLOAD START (Backend) ===');
          console.log('PDF file:', {
            uri: pdfFile.uri,
            name: pdfFile.name,
            type: pdfFile.mimeType,
            size: pdfFile.size
          });
          
          const formData = new FormData();
          formData.append('document', {
            uri: pdfFile.uri,
            type: pdfFile.mimeType || 'application/pdf',
            name: pdfFile.name || 'document.pdf',
          });
          
          const result = await api.post(ENDPOINTS.LESSON_UPLOAD_DOCUMENT, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 120000, // 2 minutes for documents
          });
          
          console.log('PDF upload result:', result.data);
          pdfUrl = result.data.data?.url || '';
        } catch (uploadErr) {
          console.warn('PDF upload failed, continuing without PDF:', uploadErr);
        }
      }

      // Create lesson with uploaded URLs
      await api.post(ENDPOINTS.LESSONS, {
        courseId,
        title:      title.trim(),
        content:    content.trim(),
        videoUrl:   finalVideoUrl,
        pdfUrl,
        duration:   parseInt(duration) || 0,
        orderIndex: parseInt(orderIndex) || 0,
      });

      Alert.alert('✅ Lesson Added!', `"${title}" has been added to the course.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error('Lesson creation error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to create lesson');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>

        {/* Course selector */}
        <Text style={styles.label}>Select Course *</Text>
        {loadingCourses ? (
          <ActivityIndicator color={PRIMARY} style={{ marginVertical: 12 }} />
        ) : courses.length === 0 ? (
          <View style={styles.alertBox}>
            <Ionicons name="alert-circle-outline" size={18} color="#FFB347" />
            <Text style={styles.alertText}>No courses found. Create a course first.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
            {courses.map(course => (
              <TouchableOpacity
                key={course._id}
                style={[styles.pill, courseId === course._id && styles.pillActive]}
                onPress={() => setCourseId(course._id)}
              >
                <Text style={[styles.pillText, courseId === course._id && styles.pillTextActive]} numberOfLines={1}>
                  {course.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={styles.label}>Lesson Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Introduction to React Native"
          placeholderTextColor="#aaa"
        />

        {/* Video section */}
        <Text style={styles.label}>Video Content</Text>
        <View style={styles.mediaSection}>
          {/* Video URL */}
          <TextInput
            style={[styles.input, { marginBottom: 8 }]}
            value={videoUrl}
            onChangeText={(t) => { setVideoUrl(t); if (t) setVideoFile(null); }}
            placeholder="Paste YouTube/Vimeo URL..."
            placeholderTextColor="#aaa"
            autoCapitalize="none"
            keyboardType="url"
          />
          <Text style={styles.orText}>— OR upload video file —</Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickVideo}>
            <Ionicons name="videocam-outline" size={22} color={PRIMARY} />
            <Text style={styles.uploadBtnText}>
              {videoFile ? videoFile.name : 'Choose Video File'}
            </Text>
            {videoFile && (
              <TouchableOpacity onPress={() => setVideoFile(null)}>
                <Ionicons name="close-circle" size={18} color="#EF4444" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          {videoFile && (
            <Text style={styles.fileSize}>{formatSize(videoFile.size)}</Text>
          )}
        </View>

        {/* PDF section */}
        <Text style={styles.label}>PDF / Document (Optional)</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickPdf}>
          <Ionicons name="document-text-outline" size={22} color="#FF6584" />
          <Text style={[styles.uploadBtnText, { color: '#FF6584' }]}>
            {pdfFile ? pdfFile.name : 'Attach PDF or Document'}
          </Text>
          {pdfFile && (
            <TouchableOpacity onPress={() => setPdfFile(null)}>
              <Ionicons name="close-circle" size={18} color="#EF4444" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        {pdfFile && (
          <Text style={styles.fileSize}>{formatSize(pdfFile.size)}</Text>
        )}

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Duration (min)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              placeholder="30"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Order</Text>
            <TextInput
              style={styles.input}
              value={orderIndex}
              onChangeText={setOrderIndex}
              placeholder="1"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.label}>Notes / Content</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={content}
          onChangeText={setContent}
          placeholder="Lesson notes, key points..."
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.btn, (loading || !courseId) && styles.btnDisabled]}
          onPress={handleCreate}
          disabled={loading || !courseId}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.btnText}>
                {uploading ? `Uploading... ${uploadProgress}%` : 'Creating...'}
              </Text>
            </View>
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.btnText}>Add Lesson</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F5F5F5' },
  form:       { padding: 16 },
  label:      { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    fontSize: 15, color: '#1a1a2e', borderWidth: 1, borderColor: '#eee',
  },
  textArea:   { height: 120 },
  row:        { flexDirection: 'row', justifyContent: 'space-between' },
  halfField:  { width: '48%' },
  pillScroll: { marginBottom: 4 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff',
    marginRight: 8, maxWidth: 180,
  },
  pillActive:     { backgroundColor: PRIMARY, borderColor: PRIMARY },
  pillText:       { fontSize: 13, color: '#888' },
  pillTextActive: { color: '#fff', fontWeight: '600' },
  alertBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFB34715', borderRadius: 10, padding: 12, marginBottom: 4,
  },
  alertText:  { fontSize: 13, color: '#888', marginLeft: 8, flex: 1 },
  mediaSection: { marginBottom: 4 },
  orText:     { fontSize: 12, color: '#aaa', textAlign: 'center', marginVertical: 8 },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: PRIMARY,
    borderStyle: 'dashed', borderRadius: 10, padding: 14, marginBottom: 4,
  },
  uploadBtnText: { flex: 1, fontSize: 14, color: PRIMARY, marginLeft: 10 },
  fileSize:   { fontSize: 11, color: '#888', marginBottom: 4, marginLeft: 4 },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 15, marginTop: 24,
  },
  btnDisabled: { opacity: 0.5 },
  btnText:     { fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 8 },
});

export default CreateLessonScreen;
