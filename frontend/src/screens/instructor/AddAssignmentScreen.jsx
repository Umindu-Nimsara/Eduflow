import React, { useState, useEffect, useContext } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Switch, Modal, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";

const PRIMARY = "#6C63FF";

const FieldError = ({ msg }) =>
  msg ? <Text style={styles.fieldError}>{msg}</Text> : null;

const AddAssignmentScreen = ({ route, navigation }) => {
  const { user } = useContext(AuthContext);
  const preselectedCourseId = route.params?.courseId || "";

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseId, setCourseId] = useState(preselectedCourseId);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [totalMarks, setTotalMarks] = useState("100");
  const [dueDate, setDueDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [briefFile, setBriefFile] = useState(null);
  const [briefUrl, setBriefUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [criteria, setCriteria] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [createdId, setCreatedId] = useState(null);

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const res = await api.get(`${ENDPOINTS.COURSES}/instructor/${user.id}`);
      const data = res.data.data || [];
      setCourses(data);
      if (!preselectedCourseId && data.length > 0) setCourseId(data[0]._id);
    } catch (e) { console.error(e); }
    finally { setLoadingCourses(false); }
  };

  const pickBriefFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });
      const asset = result.assets?.[0] || (result.type === "success" ? result : null);
      if (!asset) return;
      setBriefFile(asset);
      uploadBriefFile(asset);
    } catch (e) {
      Alert.alert("Error", "Failed to pick file");
    }
  };

  const uploadBriefFile = async (asset) => {
    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append("document", {
        uri: asset.uri,
        type: asset.mimeType || "application/pdf",
        name: asset.name || "brief.pdf",
      });
      const res = await api.post(`${ENDPOINTS.LESSONS}/upload-document`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setBriefUrl(res.data.data?.url || "");
    } catch (e) {
      Alert.alert("Upload failed", "Could not upload file. You can still create the assignment.");
    } finally {
      setUploadingFile(false);
    }
  };

  const addCriteria = () => {
    setCriteria(prev => [...prev, { name: "", marks: "" }]);
  };

  const updateCriteria = (i, field, value) => {
    setCriteria(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  };

  const removeCriteria = (i) => {
    setCriteria(prev => prev.filter((_, idx) => idx !== i));
  };

  const criteriaSum = criteria.reduce((s, c) => s + (parseInt(c.marks) || 0), 0);
  const totalMarksNum = parseInt(totalMarks) || 0;
  const breakdownMismatch = showBreakdown && criteria.length > 0 && criteriaSum !== totalMarksNum;

  const formatDate = (d) => {
    if (!d) return null;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const isWithin24h = (d) => {
    if (!d) return false;
    return (d - new Date()) < 24 * 60 * 60 * 1000;
  };

  const validate = () => {
    const e = {};
    if (!courseId) e.courseId = "Please select a course";
    if (!title.trim()) e.title = "Title is required";
    if (!instructions.trim() || instructions.trim().length < 10)
      e.instructions = "Instructions must be at least 10 characters";
    if (!dueDate) e.dueDate = "Due date is required";
    else if (dueDate <= new Date()) e.dueDate = "Due date must be in the future";
    if (!totalMarks || parseInt(totalMarks) < 1 || parseInt(totalMarks) > 1000)
      e.totalMarks = "Total marks must be between 1 and 1000";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const res = await api.post(ENDPOINTS.ASSIGNMENTS, {
        courseId,
        title: title.trim(),
        description: instructions.trim(),
        dueDate: dueDate.toISOString(),
        totalMarks: parseInt(totalMarks),
        attachmentUrl: briefUrl || undefined,
        marksBreakdown: showBreakdown && criteria.length > 0 ? criteria : undefined,
      });
      setCreatedId(res.data.data._id);
      setSuccessModal(true);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to create assignment");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle(""); setInstructions(""); setDueDate(null);
    setTotalMarks("100"); setBriefFile(null); setBriefUrl("");
    setCriteria([]); setShowBreakdown(false); setErrors({});
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.form}>

          {/* Course selector */}
          <Text style={styles.label}>Select Course *</Text>
          {loadingCourses ? <ActivityIndicator color={PRIMARY} style={{ marginVertical: 12 }} /> : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
              {courses.map(c => (
                <TouchableOpacity key={c._id}
                  style={[styles.pill, courseId === c._id && styles.pillActive]}
                  onPress={() => { setCourseId(c._id); setErrors(p => ({ ...p, courseId: "" })); }}>
                  <Text style={[styles.pillText, courseId === c._id && styles.pillTextActive]} numberOfLines={1}>
                    {c.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          <FieldError msg={errors.courseId} />

          {/* Title */}
          <Text style={styles.label}>Assignment Title *</Text>
          <TextInput style={[styles.input, errors.title && styles.inputError]}
            value={title} onChangeText={t => { setTitle(t); setErrors(p => ({ ...p, title: "" })); }}
            placeholder="e.g. Build a Todo App" placeholderTextColor="#aaa" />
          <FieldError msg={errors.title} />

          {/* Instructions */}
          <Text style={styles.label}>Instructions *</Text>
          <TextInput style={[styles.input, styles.textArea, errors.instructions && styles.inputError]}
            value={instructions}
            onChangeText={t => { setInstructions(t); setErrors(p => ({ ...p, instructions: "" })); }}
            placeholder="Describe what students need to do... (min 10 chars)"
            placeholderTextColor="#aaa" multiline numberOfLines={5} textAlignVertical="top" />
          <FieldError msg={errors.instructions} />

          {/* Brief file upload */}
          <Text style={styles.label}>Assignment Brief / Instructions File</Text>
          {briefFile ? (
            <View style={styles.filePreview}>
              <Ionicons name="document-text" size={28} color={PRIMARY} />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{briefFile.name}</Text>
                <Text style={styles.fileSize}>
                  {formatFileSize(briefFile.size)}
                  {uploadingFile ? "  Uploading..." : briefUrl ? "  ✓ Uploaded" : ""}
                </Text>
              </View>
              {uploadingFile
                ? <ActivityIndicator color={PRIMARY} size="small" />
                : <TouchableOpacity onPress={() => { setBriefFile(null); setBriefUrl(""); }}>
                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                  </TouchableOpacity>
              }
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadBtn} onPress={pickBriefFile}>
              <Ionicons name="attach-outline" size={22} color={PRIMARY} />
              <Text style={styles.uploadBtnText}>+ Attach PDF / DOC</Text>
            </TouchableOpacity>
          )}

          {/* Due date + Total marks row */}
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Due Date *</Text>
              <TouchableOpacity
                style={[styles.dateBtn, errors.dueDate && styles.inputError]}
                onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={18} color={dueDate ? "#1a1a2e" : "#aaa"} />
                <Text style={[styles.dateBtnText, !dueDate && styles.dateBtnPlaceholder]}>
                  {dueDate ? formatDate(dueDate) : "Select date"}
                </Text>
              </TouchableOpacity>
              {dueDate && isWithin24h(dueDate) && (
                <Text style={styles.dateWarning}>⚠ Due within 24 hours</Text>
              )}
              <FieldError msg={errors.dueDate} />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Total Marks</Text>
              <TextInput style={[styles.input, errors.totalMarks && styles.inputError]}
                value={totalMarks}
                onChangeText={t => { setTotalMarks(t); setErrors(p => ({ ...p, totalMarks: "" })); }}
                placeholder="100" placeholderTextColor="#aaa" keyboardType="numeric" />
              <FieldError msg={errors.totalMarks} />
            </View>
          </View>

          {/* Date picker */}
          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              minimumDate={new Date()}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selectedDate) {
                  setDueDate(selectedDate);
                  setErrors(p => ({ ...p, dueDate: "" }));
                }
              }}
            />
          )}

          {/* Marks breakdown */}
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Add Marks Breakdown</Text>
              <Text style={styles.toggleSub}>Define grading criteria</Text>
            </View>
            <Switch value={showBreakdown} onValueChange={setShowBreakdown}
              trackColor={{ false: "#ddd", true: PRIMARY + "60" }}
              thumbColor={showBreakdown ? PRIMARY : "#f4f3f4"} />
          </View>

          {showBreakdown && (
            <View style={styles.breakdownSection}>
              {criteria.map((c, i) => (
                <View key={i} style={styles.criteriaRow}>
                  <TextInput style={[styles.input, styles.criteriaName]}
                    value={c.name} onChangeText={t => updateCriteria(i, "name", t)}
                    placeholder="e.g. Code Quality" placeholderTextColor="#aaa" />
                  <TextInput style={[styles.input, styles.criteriaMarks]}
                    value={c.marks} onChangeText={t => updateCriteria(i, "marks", t)}
                    placeholder="30" placeholderTextColor="#aaa" keyboardType="numeric" />
                  <TouchableOpacity onPress={() => removeCriteria(i)} style={styles.criteriaRemove}>
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.addCriteriaBtn} onPress={addCriteria}>
                <Ionicons name="add-circle-outline" size={18} color={PRIMARY} />
                <Text style={styles.addCriteriaText}>+ Add Criteria</Text>
              </TouchableOpacity>

              {criteria.length > 0 && (
                <View style={[styles.breakdownSum, breakdownMismatch && styles.breakdownSumWarn]}>
                  <Text style={[styles.breakdownSumText, breakdownMismatch && styles.breakdownSumTextWarn]}>
                    Sum: {criteriaSum} / {totalMarksNum} marks
                    {breakdownMismatch ? "  ⚠ Must equal total marks" : "  ✓"}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Create button */}
          <TouchableOpacity
            style={[styles.createBtn, loading && styles.createBtnDisabled]}
            onPress={handleCreate} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : (
              <><Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.createBtnText}>Create Assignment</Text></>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success modal */}
      <Modal visible={successModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="checkmark-circle" size={64} color="#43C678" />
            <Text style={styles.successTitle}>Assignment Created!</Text>
            <Text style={styles.successSub}>Students can now submit their work.</Text>
            <TouchableOpacity style={styles.successBtnPrimary}
              onPress={() => { setSuccessModal(false); navigation.goBack(); }}>
              <Text style={styles.successBtnPrimaryText}>View Assignment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.successBtnSecondary}
              onPress={() => { setSuccessModal(false); resetForm(); }}>
              <Text style={styles.successBtnSecondaryText}>Create Another</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  form: { padding: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#555", marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: "#fff", borderRadius: 10, padding: 14, fontSize: 15, color: "#1a1a2e", borderWidth: 1, borderColor: "#eee" },
  inputError: { borderColor: "#EF4444" },
  textArea: { height: 120 },
  fieldError: { fontSize: 12, color: "#EF4444", marginTop: 4 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  halfField: { width: "48%" },
  pillScroll: { marginBottom: 4 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#ddd", backgroundColor: "#fff", marginRight: 8, maxWidth: 160 },
  pillActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  pillText: { fontSize: 13, color: "#888" },
  pillTextActive: { color: "#fff", fontWeight: "600" },
  uploadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderWidth: 1.5, borderColor: PRIMARY, borderStyle: "dashed", borderRadius: 10, paddingVertical: 14 },
  uploadBtnText: { fontSize: 14, fontWeight: "600", color: PRIMARY, marginLeft: 8 },
  filePreview: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#eee" },
  fileInfo: { flex: 1, marginLeft: 12 },
  fileName: { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  fileSize: { fontSize: 12, color: "#888", marginTop: 2 },
  dateBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#eee" },
  dateBtnText: { fontSize: 14, color: "#1a1a2e", marginLeft: 8, flex: 1 },
  dateBtnPlaceholder: { color: "#aaa" },
  dateWarning: { fontSize: 12, color: "#EF4444", marginTop: 4 },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 16, marginTop: 16 },
  toggleLabel: { fontSize: 15, fontWeight: "600", color: "#1a1a2e" },
  toggleSub: { fontSize: 12, color: "#888", marginTop: 2 },
  breakdownSection: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginTop: 8 },
  criteriaRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  criteriaName: { flex: 1, marginRight: 8, padding: 10 },
  criteriaMarks: { width: 70, padding: 10, textAlign: "center" },
  criteriaRemove: { padding: 6 },
  addCriteriaBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  addCriteriaText: { fontSize: 14, fontWeight: "600", color: PRIMARY, marginLeft: 6 },
  breakdownSum: { backgroundColor: "#43C67815", borderRadius: 8, padding: 10, marginTop: 4 },
  breakdownSumWarn: { backgroundColor: "#EF444415" },
  breakdownSumText: { fontSize: 13, fontWeight: "600", color: "#43C678" },
  breakdownSumTextWarn: { color: "#EF4444" },
  createBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 16, marginTop: 24, marginBottom: 32 },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { fontSize: 16, fontWeight: "bold", color: "#fff", marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalCard: { backgroundColor: "#fff", borderRadius: 20, padding: 28, alignItems: "center", width: "100%" },
  successTitle: { fontSize: 22, fontWeight: "bold", color: "#1a1a2e", marginTop: 12, marginBottom: 8 },
  successSub: { fontSize: 14, color: "#888", marginBottom: 24, textAlign: "center" },
  successBtnPrimary: { backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 14, alignItems: "center", width: "100%", marginBottom: 10 },
  successBtnPrimaryText: { fontSize: 15, fontWeight: "bold", color: "#fff" },
  successBtnSecondary: { borderWidth: 1.5, borderColor: PRIMARY, borderRadius: 10, paddingVertical: 14, alignItems: "center", width: "100%" },
  successBtnSecondaryText: { fontSize: 15, fontWeight: "600", color: PRIMARY },
});

export default AddAssignmentScreen;
