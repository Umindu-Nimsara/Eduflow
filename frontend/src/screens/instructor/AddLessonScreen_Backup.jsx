import React, { useState, useEffect, useContext } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Switch, Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";
import { formatFileSize, validateFileSize } from "../../utils/fileUpload";

const PRIMARY = "#6C63FF";
const MAX_VIDEO_MB = 500;
const MAX_PDF_MB   = 50;

const AddLessonScreen = ({ route, navigation }) => {
  const { courseId, lessonCount = 0 } = route.params || {};

  const [lessonType,   setLessonType]   = useState("video"); // "video" | "pdf"
  const [uploadMethod, setUploadMethod] = useState("url"); // "url" | "file"
  const [title,        setTitle]        = useState("");
  const [description,  setDescription]  = useState("");
  const [orderIndex,   setOrderIndex]   = useState(String(lessonCount + 1));
  const [freePreview,  setFreePreview]  = useState(false);

  // Video state
  const [videoFile,    setVideoFile]    = useState(null);
  const [videoUrl,     setVideoUrl]     = useState("");
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoStatus,  setVideoStatus]  = useState("idle"); // idle|uploading|done|error

  // PDF state
  const [pdfFile,      setPdfFile]      = useState(null);
  const [pdfUrl,       setPdfUrl]       = useState("");
  const [pdfProgress,  setPdfProgress]  = useState(0);
  const [pdfStatus,    setPdfStatus]    = useState("idle");

  const [saving,       setSaving]       = useState(false);

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your media library");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 3600,
      quality: 1,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      if (asset.fileSize && !validateFileSize(asset.fileSize, MAX_VIDEO_MB)) {
        Alert.alert("File too large", `Video must be under ${MAX_VIDEO_MB}MB`);
        return;
      }
      setVideoFile(asset);
      uploadVideo(asset);
    }
  };

  const uploadVideo = async (asset) => {
    setVideoStatus("uploading");
    setVideoProgress(0);
    try {
      console.log('Starting video upload to backend...', asset.uri);
      
      // Upload to backend
      const formData = new FormData();
      formData.append('video', {
        uri: asset.uri,
        type: asset.mimeType || "video/mp4",
        name: asset.fileName || "video.mp4",
      });
      
      const result = await api.post(ENDPOINTS.LESSON_UPLOAD_VIDEO, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes for large files
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log('Upload progress:', progress + '%');
            setVideoProgress(progress);
          }
        }
      });
      
      console.log('Video upload result:', result.data);
      const videoUrl = result.data.data?.url || "";
      console.log('Setting videoUrl to:', videoUrl);
      setVideoUrl(videoUrl);
      setVideoStatus("done");
      Alert.alert("Success", "Video uploaded successfully!");
    } catch (err) {
      console.error('Video upload error:', err);
      setVideoStatus("error");
      Alert.alert("Upload failed", err.error || "Could not upload video. Try again.");
    }
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    const asset = result.assets?.[0] || (result.type === "success" ? result : null);
    if (!asset) return;
    if (asset.size && !validateFileSize(asset.size, MAX_PDF_MB)) {
      Alert.alert("File too large", `PDF must be under ${MAX_PDF_MB}MB`);
      return;
    }
    setPdfFile(asset);
    uploadPdf(asset);
  };

  const uploadPdf = async (asset) => {
    setPdfStatus("uploading");
    setPdfProgress(0);
    try {
      console.log('Starting PDF upload to backend...', asset);
      
      // Upload to backend
      const formData = new FormData();
      formData.append('document', {
        uri: asset.uri,
        type: "application/pdf",
        name: asset.name || "document.pdf",
      });
      
      const result = await api.post(ENDPOINTS.LESSON_UPLOAD_DOCUMENT, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes for documents
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log('Upload progress:', progress + '%');
            setPdfProgress(progress);
          }
        }
      });
      
      console.log('PDF upload result:', result.data);
      const pdfUrl = result.data.data?.url || "";
      console.log('Setting pdfUrl to:', pdfUrl);
      setPdfUrl(pdfUrl);
      setPdfStatus("done");
      Alert.alert("Success", "PDF uploaded successfully!");
    } catch (err) {
      console.error('PDF upload error:', err);
      setPdfStatus("error");
      Alert.alert("Upload failed", err.error || "Could not upload PDF. Try again.");
    }
  };

  const canSave = title.trim().length > 0 && (
    (lessonType === "video" && (
      (uploadMethod === "url" && videoUrl.trim().length > 0) ||
      (uploadMethod === "file" && videoStatus === "done")
    )) ||
    (lessonType === "pdf" && (
      (uploadMethod === "url" && pdfUrl.trim().length > 0) ||
      (uploadMethod === "file" && pdfStatus === "done")
    ))
  );

  const handleSave = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      console.log('=== SAVING LESSON ===');
      console.log('courseId from route.params:', courseId);
      console.log('videoUrl:', videoUrl);
      console.log('pdfUrl:', pdfUrl);
      console.log('lessonType:', lessonType);
      
      const lessonData = {
        courseId,
        title:       title.trim(),
        description: description.trim(),
        videoUrl:    lessonType === "video" ? videoUrl : "",
        pdfUrl:      lessonType === "pdf"   ? pdfUrl   : "",
        duration:    0,
        orderIndex:  parseInt(orderIndex) || lessonCount + 1,
        freePreview,
      };
      
      console.log('Lesson data being sent:', JSON.stringify(lessonData, null, 2));
      
      const response = await api.post(ENDPOINTS.LESSONS, lessonData);
      console.log('Lesson created response:', JSON.stringify(response.data, null, 2));
      
      // Navigate back immediately
      navigation.goBack();
      
      // Show success message
      setTimeout(() => {
        Alert.alert("Success", "Lesson created successfully!");
      }, 500);
    } catch (err) {
      console.error('Save lesson error:', err);
      console.error('Error response:', err.response?.data);
      Alert.alert("Error", err.response?.data?.message || "Failed to save lesson");
    } finally {
      setSaving(false);
    }
  };

  const ProgressBar = ({ progress, status }) => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {status === "uploading" ? `Uploading... ${progress}%` :
         status === "done"      ? "✓ Uploaded successfully!" :
         status === "error"     ? "✗ Upload failed" : ""}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>

        {/* Type selector */}
        <Text style={styles.label}>Lesson Type</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeCard, lessonType === "video" && styles.typeCardActive]}
            onPress={() => setLessonType("video")}
          >
            <Text style={styles.typeIcon}>🎬</Text>
            <Text style={[styles.typeTitle, lessonType === "video" && styles.typeTitleActive]}>Video Lesson</Text>
            <Text style={styles.typeSub}>MP4, MOV, AVI</Text>
            <Text style={styles.typeSub}>Max {MAX_VIDEO_MB}MB</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeCard, lessonType === "pdf" && styles.typeCardActive]}
            onPress={() => setLessonType("pdf")}
          >
            <Text style={styles.typeIcon}>📄</Text>
            <Text style={[styles.typeTitle, lessonType === "pdf" && styles.typeTitleActive]}>PDF Lesson</Text>
            <Text style={styles.typeSub}>PDF document</Text>
            <Text style={styles.typeSub}>Max {MAX_PDF_MB}MB</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.label}>Lesson Title *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle}
          placeholder="e.g. Introduction to Variables" placeholderTextColor="#aaa" />

        {/* Description */}
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description}
          onChangeText={setDescription} placeholder="What will students learn..."
          placeholderTextColor="#aaa" multiline numberOfLines={3} textAlignVertical="top" />

        {/* Order */}
        <Text style={styles.label}>Order Index</Text>
        <TextInput style={[styles.input, { width: 100 }]} value={orderIndex}
          onChangeText={setOrderIndex} keyboardType="numeric" placeholderTextColor="#aaa" />

        {/* Video upload */}
        {lessonType === "video" && (
          <View>
            <Text style={styles.label}>Video File *</Text>
            {!videoFile ? (
              <TouchableOpacity style={styles.uploadArea} onPress={pickVideo}>
                <Ionicons name="videocam-outline" size={40} color={PRIMARY} />
                <Text style={styles.uploadTitle}>Tap to upload video</Text>
                <Text style={styles.uploadSub}>MP4, MOV, AVI · Max {MAX_VIDEO_MB}MB</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.filePreview}>
                <Ionicons name="videocam" size={32} color="#3B82F6" />
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {videoFile.fileName || videoFile.name || "video.mp4"}
                  </Text>
                  <Text style={styles.fileSize}>
                    {videoFile.fileSize ? formatFileSize(videoFile.fileSize) : ""}
                  </Text>
                </View>
                {videoStatus !== "uploading" && (
                  <TouchableOpacity onPress={() => { setVideoFile(null); setVideoUrl(""); setVideoStatus("idle"); }}>
                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            )}
            {videoStatus !== "idle" && <ProgressBar progress={videoProgress} status={videoStatus} />}
            {videoStatus === "error" && (
              <TouchableOpacity style={styles.retryBtn} onPress={() => videoFile && uploadVideo(videoFile)}>
                <Ionicons name="refresh-outline" size={16} color={PRIMARY} />
                <Text style={styles.retryText}>Retry Upload</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* PDF upload */}
        {lessonType === "pdf" && (
          <View>
            <Text style={styles.label}>PDF File *</Text>
            {!pdfFile ? (
              <TouchableOpacity style={[styles.uploadArea, { height: 160 }]} onPress={pickPdf}>
                <Ionicons name="document-text-outline" size={40} color="#EF4444" />
                <Text style={styles.uploadTitle}>Tap to upload PDF</Text>
                <Text style={styles.uploadSub}>Max file size: {MAX_PDF_MB}MB</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.filePreview}>
                <Ionicons name="document-text" size={32} color="#EF4444" />
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>{pdfFile.name || "document.pdf"}</Text>
                  <Text style={styles.fileSize}>{pdfFile.size ? formatFileSize(pdfFile.size) : ""}</Text>
                </View>
                {pdfStatus !== "uploading" && (
                  <TouchableOpacity onPress={() => { setPdfFile(null); setPdfUrl(""); setPdfStatus("idle"); }}>
                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            )}
            {pdfStatus !== "idle" && <ProgressBar progress={pdfProgress} status={pdfStatus} />}
            {pdfStatus === "error" && (
              <TouchableOpacity style={styles.retryBtn} onPress={() => pdfFile && uploadPdf(pdfFile)}>
                <Ionicons name="refresh-outline" size={16} color={PRIMARY} />
                <Text style={styles.retryText}>Retry Upload</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Free preview toggle */}
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>Free Preview</Text>
            <Text style={styles.toggleSub}>Students can watch without enrolling</Text>
          </View>
          <Switch value={freePreview} onValueChange={setFreePreview}
            trackColor={{ false: "#ddd", true: PRIMARY + "60" }}
            thumbColor={freePreview ? PRIMARY : "#f4f3f4"} />
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, (!canSave || saving) && styles.saveBtnDisabled]}
          onPress={handleSave} disabled={!canSave || saving}
        >
          {saving ? <ActivityIndicator color="#fff" size="small" /> : (
            <><Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Save Lesson</Text></>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#F5F5F5" },
  form:       { padding: 16 },
  label:      { fontSize: 14, fontWeight: "600", color: "#555", marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: "#fff", borderRadius: 10, padding: 14,
    fontSize: 15, color: "#1a1a2e", borderWidth: 1, borderColor: "#eee",
  },
  textArea:   { height: 90 },
  typeRow:    { flexDirection: "row", justifyContent: "space-between" },
  typeCard: {
    width: "48%", backgroundColor: "#fff", borderRadius: 12, padding: 16,
    alignItems: "center", borderWidth: 2, borderColor: "#eee",
  },
  typeCardActive: { borderColor: PRIMARY, backgroundColor: PRIMARY + "08" },
  typeIcon:       { fontSize: 28, marginBottom: 6 },
  typeTitle:      { fontSize: 14, fontWeight: "700", color: "#888", marginBottom: 4 },
  typeTitleActive: { color: PRIMARY },
  typeSub:        { fontSize: 11, color: "#aaa", textAlign: "center" },
  uploadArea: {
    height: 200, borderWidth: 2, borderColor: PRIMARY, borderStyle: "dashed",
    borderRadius: 12, justifyContent: "center", alignItems: "center",
    backgroundColor: PRIMARY + "05",
  },
  uploadTitle: { fontSize: 15, fontWeight: "600", color: PRIMARY, marginTop: 10 },
  uploadSub:   { fontSize: 12, color: "#888", marginTop: 4 },
  filePreview: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#eee",
  },
  fileInfo:    { flex: 1, marginLeft: 12 },
  fileName:    { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  fileSize:    { fontSize: 12, color: "#888", marginTop: 2 },
  progressContainer: { marginTop: 10 },
  progressBg:  { height: 6, backgroundColor: "#eee", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: PRIMARY, borderRadius: 3 },
  progressText: { fontSize: 12, color: "#888", marginTop: 4 },
  retryBtn:    { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  retryText:   { fontSize: 13, color: PRIMARY, marginLeft: 6, fontWeight: "600" },
  toggleRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 12, padding: 16, marginTop: 16,
  },
  toggleLabel: { fontSize: 15, fontWeight: "600", color: "#1a1a2e" },
  toggleSub:   { fontSize: 12, color: "#888", marginTop: 2 },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 16, marginTop: 24, marginBottom: 32,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText:     { fontSize: 16, fontWeight: "bold", color: "#fff", marginLeft: 8 },
});

export default AddLessonScreen;
