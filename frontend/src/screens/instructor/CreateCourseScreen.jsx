import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Image, Switch, Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { ENDPOINTS, API_URL } from '../../constants/api';

const PRIMARY = '#6C63FF';
const CATEGORIES = [
  'Sinhala', 'Tamil', 'English', 'Mathematics',
  'Science', 'History', 'Geography', 'Civic Education',
  'Buddhism', 'Christianity', 'Hinduism', 'Islam',
  'Health & Physical Education', 'ICT', 'Art', 'Music', 'Dancing', 'Drama',
];

// ── Inline error ──────────────────────────────────────────────────────────────
const FieldError = ({ msg }) =>
  msg ? <Text style={styles.fieldError}>{msg}</Text> : null;

// ── Main screen ───────────────────────────────────────────────────────────────
const CreateCourseScreen = ({ navigation }) => {
  // Form state
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState('');
  const [price,       setPrice]       = useState('');
  const [isFree,      setIsFree]      = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [deadline,    setDeadline]    = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Media state - Using same pattern as video upload
  const [thumbnailFile,    setThumbnailFile]    = useState(null);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [thumbnailStatus,  setThumbnailStatus]  = useState('idle'); // idle|uploading|done|error
  const [thumbnailUrl,     setThumbnailUrl]     = useState('');

  // Validation errors
  const [errors, setErrors] = useState({});

  // UI state
  const [loading,      setLoading]      = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [createdId,    setCreatedId]    = useState(null);

  // ── Thumbnail picker (Same pattern as video upload) ────────────────────────
  const pickThumbnail = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      
      // Validate file size (max 5MB)
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('File too large', 'Thumbnail must be under 5MB');
        return;
      }
      
      setThumbnailFile(asset);
      uploadThumbnail(asset);
    }
  };

  const uploadThumbnail = async (asset) => {
    setThumbnailStatus('uploading');
    setThumbnailProgress(0);
    try {
      console.log('=== THUMBNAIL UPLOAD START (Backend) ===');
      console.log('Asset URI:', asset.uri);
      console.log('Asset type:', asset.mimeType || asset.type);
      console.log('Asset name:', asset.fileName || asset.name);
      console.log('Asset size:', asset.fileSize);
      console.log('Endpoint:', ENDPOINTS.COURSE_UPLOAD);
      console.log('Full URL:', `${API_URL}${ENDPOINTS.COURSE_UPLOAD}`);
      
      // Upload to backend (same as video upload)
      const formData = new FormData();
      formData.append('thumbnail', {
        uri: asset.uri,
        type: asset.mimeType || asset.type || 'image/jpeg',
        name: asset.fileName || asset.name || `thumbnail_${Date.now()}.jpg`,
      });
      
      console.log('FormData created, calling API...');
      
      const result = await api.post(ENDPOINTS.COURSE_UPLOAD, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes (same as video)
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log('Upload progress:', progress + '%');
            setThumbnailProgress(progress);
          }
        }
      });
      
      console.log('Upload response:', result.data);
      const thumbnailUrl = result.data.data?.url || '';
      console.log('Setting thumbnailUrl to:', thumbnailUrl);
      setThumbnailUrl(thumbnailUrl);
      setThumbnailStatus('done');
      Alert.alert('Success', 'Thumbnail uploaded successfully!');
      console.log('=== THUMBNAIL UPLOAD SUCCESS ===');
    } catch (err) {
      console.error('=== THUMBNAIL UPLOAD ERROR ===');
      console.error('Error:', err);
      console.error('Error message:', err.message);
      console.error('Error code:', err.code);
      console.error('Error response:', err.response?.data);
      setThumbnailStatus('error');
      Alert.alert('Upload failed', err.response?.data?.message || err.message || 'Could not upload thumbnail. Try again.');
    }
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!title.trim() || title.trim().length < 5)
      e.title = 'Title must be at least 5 characters';
    if (!description.trim() || description.trim().length < 20)
      e.description = 'Description must be at least 20 characters';
    if (!category)
      e.category = 'Please select a category';
    if (!isFree && (isNaN(parseFloat(price)) || parseFloat(price) < 0))
      e.price = 'Enter a valid price or toggle Free';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Date picker handler ─────────────────────────────────────────────────────
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS
    if (selectedDate) {
      setDeadline(selectedDate);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // ── Create course ───────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await api.post(ENDPOINTS.COURSES, {
        title:       title.trim(),
        description: description.trim(),
        category,
        price:       isFree ? 0 : parseFloat(price) || 0,
        thumbnail:   thumbnailUrl,
        isPublished,
        deadline:    deadline ? deadline.toISOString() : null,
      });
      setCreatedId(res.data.data._id);
      setSuccessModal(true);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = title.trim().length >= 5 && description.trim().length >= 20 && !!category;

  const ProgressBar = ({ progress, status }) => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {status === 'uploading' ? `Uploading... ${progress}%` :
         status === 'done'      ? '✓ Uploaded successfully!' :
         status === 'error'     ? '✗ Upload failed' : ''}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.form}>

          {/* ── Thumbnail ── */}
          <Text style={styles.label}>Course Thumbnail</Text>
          {!thumbnailFile ? (
            <TouchableOpacity style={styles.thumbArea} onPress={pickThumbnail}>
              <Ionicons name="camera-outline" size={40} color={PRIMARY} />
              <Text style={styles.uploadTitle}>Tap to upload thumbnail</Text>
              <Text style={styles.uploadSub}>16:9 ratio · Max 5MB</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.filePreview}>
              <Image source={{ uri: thumbnailFile.uri }} style={styles.thumbPreview} resizeMode="cover" />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {thumbnailFile.fileName || thumbnailFile.name || 'thumbnail.jpg'}
                </Text>
                {thumbnailFile.fileSize && (
                  <Text style={styles.fileSize}>
                    {(thumbnailFile.fileSize / 1024 / 1024).toFixed(2)} MB
                  </Text>
                )}
              </View>
              {thumbnailStatus !== 'uploading' && (
                <TouchableOpacity onPress={() => { setThumbnailFile(null); setThumbnailUrl(''); setThumbnailStatus('idle'); }}>
                  <Ionicons name="close-circle" size={22} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          )}
          {thumbnailStatus !== 'idle' && <ProgressBar progress={thumbnailProgress} status={thumbnailStatus} />}
          {thumbnailStatus === 'error' && (
            <TouchableOpacity style={styles.retryBtn} onPress={() => thumbnailFile && uploadThumbnail(thumbnailFile)}>
              <Ionicons name="refresh-outline" size={16} color={PRIMARY} />
              <Text style={styles.retryText}>Retry Upload</Text>
            </TouchableOpacity>
          )}

          {/* ── Title ── */}
          <Text style={styles.label}>Course Title *</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            value={title}
            onChangeText={t => { setTitle(t); if (errors.title) setErrors(p => ({ ...p, title: '' })); }}
            placeholder="Enter course title (min 5 chars)"
            placeholderTextColor="#aaa"
          />
          <FieldError msg={errors.title} />

          {/* ── Description ── */}
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea, errors.description && styles.inputError]}
            value={description}
            onChangeText={t => { setDescription(t); if (errors.description) setErrors(p => ({ ...p, description: '' })); }}
            placeholder="Describe your course... (min 20 chars)"
            placeholderTextColor="#aaa"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <FieldError msg={errors.description} />

          {/* ── Category ── */}
          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catPill, category === cat && styles.catPillActive]}
                onPress={() => { setCategory(cat); setErrors(p => ({ ...p, category: '' })); }}
              >
                <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FieldError msg={errors.category} />

          {/* ── Price ── */}
          <View style={styles.priceRow}>
            <View style={styles.priceLeft}>
              <Text style={styles.label}>Price (LKR)</Text>
              <TextInput
                style={[styles.input, (isFree || errors.price) && styles.inputDisabled]}
                value={isFree ? '0.00' : price}
                onChangeText={t => { setPrice(t); setErrors(p => ({ ...p, price: '' })); }}
                placeholder="0.00"
                placeholderTextColor="#aaa"
                keyboardType="decimal-pad"
                editable={!isFree}
              />
              <FieldError msg={errors.price} />
            </View>
            <View style={styles.priceRight}>
              <Text style={styles.label}>Free Course</Text>
              <Switch
                value={isFree}
                onValueChange={v => { setIsFree(v); if (v) setPrice('0'); }}
                trackColor={{ false: '#ddd', true: PRIMARY + '60' }}
                thumbColor={isFree ? PRIMARY : '#f4f3f4'}
              />
            </View>
          </View>

          {/* ── Deadline ── */}
          <Text style={styles.label}>Course Deadline (Optional)</Text>
          <TouchableOpacity 
            style={styles.datePickerBtn} 
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={PRIMARY} />
            <Text style={styles.datePickerText}>{formatDate(deadline)}</Text>
            {deadline && (
              <TouchableOpacity 
                onPress={() => setDeadline(null)}
                style={styles.clearDateBtn}
              >
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={deadline || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* ── Publish toggle ── */}
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Publish Immediately</Text>
              <Text style={styles.toggleSub}>
                {isPublished ? 'Course will be visible to students' : 'Save as draft'}
              </Text>
            </View>
            <Switch
              value={isPublished}
              onValueChange={setIsPublished}
              trackColor={{ false: '#ddd', true: PRIMARY + '60' }}
              thumbColor={isPublished ? PRIMARY : '#f4f3f4'}
            />
          </View>

          {/* ── Create button ── */}
          <TouchableOpacity
            style={[styles.createBtn, (!isFormValid || loading) && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.createBtnText}>Create Course</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Success Modal ── */}
      <Modal visible={successModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#43C678" />
            </View>
            <Text style={styles.successTitle}>Course Created!</Text>
            <Text style={styles.successSub}>
              Your course has been created as a draft.{"\n"}Now add lessons to complete your course.
            </Text>
            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.successBtnPrimary}
                onPress={() => {
                  setSuccessModal(false);
                  navigation.navigate('ManageLessons', {
                    courseId: createdId,
                    courseTitle: title.trim(),
                  });
                }}
              >
                <Text style={styles.successBtnPrimaryText}>Add Lessons Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.successBtnSecondary}
                onPress={() => { setSuccessModal(false); navigation.goBack(); }}
              >
                <Text style={styles.successBtnSecondaryText}>Do it Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  form:      { padding: 16 },
  label:     { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    fontSize: 15, color: '#1a1a2e', borderWidth: 1, borderColor: '#eee',
  },
  inputError:    { borderColor: '#EF4444' },
  inputDisabled: { backgroundColor: '#f5f5f5', color: '#aaa' },
  textArea:      { height: 120 },
  fieldError:    { fontSize: 12, color: '#EF4444', marginTop: 4, marginLeft: 2 },

  // Thumbnail
  thumbArea: {
    height: 200, borderWidth: 2, borderColor: PRIMARY, borderStyle: 'dashed',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    backgroundColor: PRIMARY + '05',
  },
  uploadTitle: { fontSize: 15, fontWeight: '600', color: PRIMARY, marginTop: 10 },
  uploadSub:   { fontSize: 12, color: '#888', marginTop: 4 },
  filePreview: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#eee',
  },
  thumbPreview: { width: 80, height: 45, borderRadius: 6, marginRight: 12 },
  fileInfo:    { flex: 1 },
  fileName:    { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  fileSize:    { fontSize: 12, color: '#888', marginTop: 2 },

  // Progress bar
  progressContainer: { marginTop: 10 },
  progressBg:  { height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: PRIMARY, borderRadius: 3 },
  progressText: { fontSize: 12, color: '#888', marginTop: 4 },
  retryBtn:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  retryText:   { fontSize: 13, color: PRIMARY, marginLeft: 6, fontWeight: '600' },

  // Category
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  catPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff',
    margin: 4,
  },
  catPillActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  catText:       { fontSize: 13, color: '#888' },
  catTextActive: { color: '#fff', fontWeight: '600' },

  // Price row
  priceRow:  { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 },
  priceLeft: { flex: 1, marginRight: 16 },
  priceRight: { alignItems: 'center', paddingTop: 8 },

  // Date picker
  datePickerBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#eee',
  },
  datePickerText: { flex: 1, fontSize: 15, color: '#1a1a2e', marginLeft: 10 },
  clearDateBtn: { marginLeft: 8 },

  // Toggle
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 16,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3,
  },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  toggleSub:   { fontSize: 12, color: '#888', marginTop: 2 },

  // Create button
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 16, marginTop: 24, marginBottom: 32,
  },
  createBtnDisabled: { opacity: 0.5 },
  createBtnText:     { fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 8 },

  // Success modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28,
    alignItems: 'center', width: '100%',
  },
  successIcon:  { marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 8 },
  successSub:   { fontSize: 14, color: '#888', marginBottom: 24, textAlign: 'center' },
  successActions: { width: '100%' },
  successBtnPrimary: {
    backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginBottom: 10,
  },
  successBtnPrimaryText:   { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  successBtnSecondary: {
    borderWidth: 1.5, borderColor: PRIMARY, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  successBtnSecondaryText: { fontSize: 15, fontWeight: '600', color: PRIMARY },
});

export default CreateCourseScreen;
