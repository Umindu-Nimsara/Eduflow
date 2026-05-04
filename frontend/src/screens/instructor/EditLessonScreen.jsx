import React, { useState, useEffect } from "react";
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

const EditLessonScreen = ({ route, navigation }) => {
  const { lessonId, courseId } = route.params || {};

  const [loading,      setLoading]      = useState(true);
  const [lessonType,   setLessonType]   = useState("video");
  const [title,        setTitle]        = useState("");
  const [description,  setDescription]  = useState("");
  const [orderIndex,   setOrderIndex]   = useState("1");
  const [freePreview,  setFreePreview]  = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");
  const [currentPdfUrl,   setCurrentPdfUrl]   = useState("");
  const [replacing,    setReplacing]    = useState(false);
  const [newFile,      setNewFile]      = useState(null);
  const [newFileUrl,   setNewFileUrl]   = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);

  useEffect(() => {
    loadLesson();
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 16 }} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      ),
    });
  }, []);

  const loadLesson = async () => {
    try {
      const res = await api.get(`${ENDPOINTS.LESSONS}/${lessonId}`);
      const l = res.data.data;
      setTitle(l.title || "");
      setDescription(l.description || "");
      setOrderIndex(String(l.orderIndex || 1));
      setFreePreview(l.freePreview || false);
      setCurrentVideoUrl(l.videoUrl || "");
      setCurrentPdfUrl(l.pdfUrl || "");
      setLessonType(l.videoUrl ? "video" : "pdf");
    } catch (err) {
      Alert.alert("Error", "Failed to load lesson");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Lesson", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            setDeleting(true);
            await api.delete(`${ENDPOINTS.LESSONS}/${lessonId}`);
            navigation.goBack();
          } catch (err) {
            Alert.alert("Error", "Failed to delete lesson");
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const pickReplacement = async () => {
    if (lessonType === "video") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        videoMaxDuration: 3600,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        if (asset.fileSize && !validateFileSize(asset.fileSize, MAX_VIDEO_MB)) {
          Alert.alert("File too large", `Video must be under ${MAX_VIDEO_MB}MB`);
          return;
        }
        setNewFile(asset);
        uploadReplacement(asset, "video");
      }
    } else {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
      const asset = result.assets?.[0] || (result.type === "success" ? result : null);
      if (!asset) return;
      if (asset.size && !validateFileSize(asset.size, MAX_PDF_MB)) {
        Alert.alert("File too large", `PDF must be under ${MAX_PDF_MB}MB`);
        return;
      }
      setNewFile(asset);
      uploadReplacement(asset, "pdf");
    }
  };

  const uploadReplacement = async (asset, type) => {
    setUploadStatus("uploading");
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        type: asset.mimeType || (type === "video" ? "video/mp4" : "application/pdf"),
        name: asset.fileName || asset.name || "file",
      });
      
      const endpoint = type === "video" ? '/lessons/upload-video' : '/lessons/upload-document';
      const result = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes for large files
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      });
      
      setNewFileUrl(result.data.data?.url || "");
      setUploadStatus("done");
    } catch (err) {
      setUploadStatus("error");
      Alert.alert("Upload failed", err.response?.data?.message || "Try again");
    }
  };

  const handleUpdate = async () => {
    if (!title.trim()) { Alert.alert("Error", "Title is required"); return; }
    try {
      setSaving(true);
      const updateData = {
        title: title.trim(),
        description: description.trim(),
        orderIndex: parseInt(orderIndex) || 1,
        freePreview,
      };
      if (newFileUrl) {
        if (lessonType === "video") updateData.videoUrl = newFileUrl;
        else updateData.pdfUrl = newFileUrl;
      }
      await api.put(`${ENDPOINTS.LESSONS}/${lessonId}`, updateData);
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to update lesson");
    } finally {
      setSaving(false);
    }
  };

  if (loading || deleting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>{deleting ? "Deleting..." : "Loading..."}</Text>
      </View>
    );
  }

  const currentFile = lessonType === "video" ? currentVideoUrl : currentPdfUrl;
  const fileName = currentFile ? currentFile.split("/").pop() : "";

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>

        {/* Title */}
        <Text style={styles.label}>Lesson Title *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle}
          placeholder="Lesson title" placeholderTextColor="#aaa" />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description}
          onChangeText={setDescription} placeholder="What will students learn..."
          placeholderTextColor="#aaa" multiline numberOfLines={3} textAlignVertical="top" />

        {/* Order */}
        <Text style={styles.label}>Order Index</Text>
        <TextInput style={[styles.input, { width: 100 }]} value={orderIndex}
          onChangeText={setOrderIndex} keyboardType="numeric" />

        {/* Current file */}
        {currentFile && !replacing && (
          <View>
            <Text style={styles.label}>Current {lessonType === "video" ? "Video" : "PDF"}</Text>
            <View style={styles.currentFileBox}>
              <Ionicons
                name={lessonType === "video" ? "videocam" : "document-text"}
                size={28} color={lessonType === "video" ? "#3B82F6" : "#EF4444"}
              />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{fileName || "Current file"}</Text>
                <Text style={styles.fileSub}>Tap "Replace" to upload a new file</Text>
              </View>
              <TouchableOpacity style={styles.replaceBtn} onPress={() => setReplacing(true)}>
                <Text style={styles.replaceBtnText}>Replace</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Replace file section */}
        {replacing && (
          <View>
            <Text style={styles.label}>New {lessonType === "video" ? "Video" : "PDF"}</Text>
            {!newFile ? (
              <TouchableOpacity style={styles.uploadArea} onPress={pickReplacement}>
                <Ionicons name={lessonType === "video" ? "videocam-outline" : "document-text-outline"} size={36} color={PRIMARY} />
                <Text style={styles.uploadTitle}>Tap to select new file</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.filePreview}>
                <Ionicons name={lessonType === "video" ? "videocam" : "document-text"} size={28}
                  color={lessonType === "video" ? "#3B82F6" : "#EF4444"} />
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {newFile.fileName || newFile.name || "file"}
                  </Text>
                </View>
                {uploadStatus !== "uploading" && (
                  <TouchableOpacity onPress={() => { setNewFile(null); setNewFileUrl(""); setUploadStatus("idle"); }}>
                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            )}
            {uploadStatus !== "idle" && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {uploadStatus === "uploading" ? `Uploading... ${uploadProgress}%` :
                   uploadStatus === "done"      ? "✓ Uploaded!" : "✗ Failed"}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.cancelReplaceBtn} onPress={() => { setReplacing(false); setNewFile(null); setNewFileUrl(""); setUploadStatus("idle"); }}>
              <Text style={styles.cancelReplaceText}>Cancel Replace</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Free preview */}
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>Free Preview</Text>
            <Text style={styles.toggleSub}>Students can watch without enrolling</Text>
          </View>
          <Switch value={freePreview} onValueChange={setFreePreview}
            trackColor={{ false: "#ddd", true: PRIMARY + "60" }}
            thumbColor={freePreview ? PRIMARY : "#f4f3f4"} />
        </View>

        {/* Update button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleUpdate} disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" size="small" /> : (
            <><Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Update Lesson</Text></>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#F5F5F5" },
  center:      { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#888" },
  form:        { padding: 16 },
  label:       { fontSize: 14, fontWeight: "600", color: "#555", marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: "#fff", borderRadius: 10, padding: 14,
    fontSize: 15, color: "#1a1a2e", borderWidth: 1, borderColor: "#eee",
  },
  textArea:    { height: 90 },
  currentFileBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#eee",
  },
  fileInfo:    { flex: 1, marginLeft: 12 },
  fileName:    { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  fileSub:     { fontSize: 12, color: "#888", marginTop: 2 },
  fileSize:    { fontSize: 12, color: "#888", marginTop: 2 },
  replaceBtn:  { backgroundColor: PRIMARY + "15", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  replaceBtnText: { fontSize: 13, fontWeight: "600", color: PRIMARY },
  uploadArea: {
    height: 160, borderWidth: 2, borderColor: PRIMARY, borderStyle: "dashed",
    borderRadius: 12, justifyContent: "center", alignItems: "center", backgroundColor: PRIMARY + "05",
  },
  uploadTitle: { fontSize: 14, fontWeight: "600", color: PRIMARY, marginTop: 8 },
  filePreview: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#eee",
  },
  progressContainer: { marginTop: 10 },
  progressBg:  { height: 6, backgroundColor: "#eee", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: PRIMARY, borderRadius: 3 },
  progressText: { fontSize: 12, color: "#888", marginTop: 4 },
  cancelReplaceBtn: { paddingVertical: 10, alignItems: "center" },
  cancelReplaceText: { fontSize: 13, color: "#888" },
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
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText:     { fontSize: 16, fontWeight: "bold", color: "#fff", marginLeft: 8 },
});

export default EditLessonScreen;
