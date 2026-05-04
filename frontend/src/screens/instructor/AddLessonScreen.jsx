import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
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
  const [module,       setModule]       = useState("");
  const [orderIndex,   setOrderIndex]   = useState(String(lessonCount + 1));
  const [freePreview,  setFreePreview]  = useState(false);

  // Video state
  const [videoFile,    setVideoFile]    = useState(null);
  const [videoUrl,     setVideoUrl]     = useState("");
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoStatus,  setVideoStatus]  = useState("idle");

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
      const formData = new FormData();
      formData.append('video', {
        uri: asset.uri,
        type: asset.mimeType || "video/mp4",
        name: asset.fileName || "video.mp4",
      });
      
      const result = await api.post(ENDPOINTS.LESSON_UPLOAD_VIDEO, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000, // 10 minutes timeout for large video uploads
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setVideoProgress(progress);
          }
        }
      });
      
      const videoUrl = result.data.data?.url || "";
      setVideoUrl(videoUrl);
      setVideoStatus("done");
      Alert.alert("Success", "Video uploaded successfully!");
    } catch (err) {
      console.error('Video upload error:', err);
      setVideoStatus("error");
      
      let errorMsg = "Could not upload video.";
      if (err.code === 'ECONNABORTED') {
        errorMsg = "Upload timed out. Please try a smaller video or check your connection.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      Alert.alert("Upload Failed", `${errorMsg}\n\nYou can also try using a URL instead.`);
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
      const formData = new FormData();
      formData.append('document', {
        uri: asset.uri,
        type: "application/pdf",
        name: asset.name || "document.pdf",
      });
      
      const result = await api.post(ENDPOINTS.LESSON_UPLOAD_DOCUMENT, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setPdfProgress(progress);
          }
        }
      });
      
      const pdfUrl = result.data.data?.url || "";
      setPdfUrl(pdfUrl);
      setPdfStatus("done");
      Alert.alert("Success", "PDF uploaded successfully!");
    } catch (err) {
      console.error('PDF upload error:', err);
      setPdfStatus("error");
      Alert.alert("Upload failed", "Could not upload PDF. Try using URL instead.");
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
      
      const lessonData = {
        courseId,
        title:       title.trim(),
        description: description.trim(),
        module:      module.trim(),
        videoUrl:    lessonType === "video" ? videoUrl : "",
        pdfUrl:      lessonType === "pdf"   ? pdfUrl   : "",
        duration:    0,
        orderIndex:  parseInt(orderIndex) || lessonCount + 1,
        freePreview,
      };
      
      await api.post(ENDPOINTS.LESSONS, lessonData);
      navigation.goBack();
      setTimeout(() => {
        Alert.alert("Success", "Lesson created successfully!");
      }, 500);
    } catch (err) {
      console.error('Save lesson error:', err);
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
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeCard, lessonType === "pdf" && styles.typeCardActive]}
            onPress={() => setLessonType("pdf")}
          >
            <Text style={styles.typeIcon}>📄</Text>
            <Text style={[styles.typeTitle, lessonType === "pdf" && styles.typeTitleActive]}>PDF Lesson</Text>
          </TouchableOpacity>
        </View>

        {/* Upload method selector */}
        <Text style={styles.label}>Upload Method</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.methodCard, uploadMethod === "url" && styles.methodCardActive]}
            onPress={() => setUploadMethod("url")}
          >
            <Ionicons name="link" size={24} color={uploadMethod === "url" ? PRIMARY : "#888"} />
            <Text style={[styles.methodTitle, uploadMethod === "url" && styles.methodTitleActive]}>
              Use URL
            </Text>
            <Text style={styles.methodSub}>YouTube, Drive, etc.</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodCard, uploadMethod === "file" && styles.methodCardActive]}
            onPress={() => setUploadMethod("file")}
          >
            <Ionicons name="cloud-upload" size={24} color={uploadMethod === "file" ? PRIMARY : "#888"} />
            <Text style={[styles.methodTitle, uploadMethod === "file" && styles.methodTitleActive]}>
              Upload File
            </Text>
            <Text style={styles.methodSub}>From device</Text>
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

        {/* Module/Section */}
        <Text style={styles.label}>Module/Section (optional)</Text>
        <TextInput style={styles.input} value={module} onChangeText={setModule}
          placeholder="e.g. Week 1, Introduction, Chapter 1" placeholderTextColor="#aaa" />
        <Text style={styles.hint}>
          💡 Group lessons into modules for better organization
        </Text>

        {/* Order */}
        <Text style={styles.label}>Order Index</Text>
        <TextInput style={[styles.input, { width: 100 }]} value={orderIndex}
          onChangeText={setOrderIndex} keyboardType="numeric" placeholderTextColor="#aaa" />

        {/* Video URL or Upload */}
        {lessonType === "video" && (
          <View>
            {uploadMethod === "url" ? (
              <>
                <Text style={styles.label}>Video URL *</Text>
                <TextInput
                  style={styles.input}
                  value={videoUrl}
                  onChangeText={(text) => {
                    setVideoUrl(text);
                    setVideoStatus(text.trim() ? "done" : "idle");
                  }}
                  placeholder="https://youtube.com/watch?v=... or direct video URL"
                  placeholderTextColor="#aaa"
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <Text style={styles.hint}>
                  💡 Supported platforms:{'\n'}
                  • YouTube: https://youtube.com/watch?v=...{'\n'}
                  • Google Drive: https://drive.google.com/file/d/...{'\n'}
                  • Dropbox: https://dropbox.com/s/...{'\n'}
                  • Direct video: https://example.com/video.mp4
                </Text>
              </>
            ) : (
              <>
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
              </>
            )}
          </View>
        )}

        {/* PDF URL or Upload */}
        {lessonType === "pdf" && (
          <View>
            {uploadMethod === "url" ? (
              <>
                <Text style={styles.label}>PDF URL *</Text>
                <TextInput
                  style={styles.input}
                  value={pdfUrl}
                  onChangeText={(text) => {
                    setPdfUrl(text);
                    setPdfStatus(text.trim() ? "done" : "idle");
                  }}
                  placeholder="https://drive.google.com/... or direct PDF URL"
                  placeholderTextColor="#aaa"
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <Text style={styles.hint}>
                  💡 Supports: Google Drive, Dropbox, or direct PDF links
                </Text>
              </>
            ) : (
              <>
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
              </>
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
  hint: {
    fontSize: 12, color: "#888", marginTop: 6, fontStyle: "italic",
  },
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
  methodCard: {
    width: "48%", backgroundColor: "#fff", borderRadius: 12, padding: 14,
    alignItems: "center", borderWidth: 2, borderColor: "#eee",
  },
  methodCardActive: { borderColor: PRIMARY, backgroundColor: PRIMARY + "08" },
  methodTitle:      { fontSize: 13, fontWeight: "700", color: "#888", marginTop: 6 },
  methodTitleActive: { color: PRIMARY },
  methodSub:        { fontSize: 11, color: "#aaa", marginTop: 2 },
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
