import React, { useState, useEffect, useContext } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, TextInput, Modal, ActivityIndicator, Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";

const PRIMARY = "#6C63FF";

// ── Relative time helper ──────────────────────────────────────────────────────
const timeAgo = (date) => {
  const secs = Math.floor((new Date() - new Date(date)) / 1000);
  if (secs < 60) return "Just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
};

// ── Main screen ───────────────────────────────────────────────────────────────
const GradeSubmissionsScreen = ({ route, navigation }) => {
  const { user } = useContext(AuthContext);
  // Accept courseId OR assignmentId from navigation params
  const { courseId, assignmentId: paramAssignmentId } = route.params || {};

  const [assignments,    setAssignments]    = useState([]);
  const [selectedAssId,  setSelectedAssId]  = useState(paramAssignmentId || null);
  const [selectedAss,    setSelectedAss]    = useState(null);
  const [submissions,    setSubmissions]    = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [error,          setError]          = useState(null);
  const [activeTab,      setActiveTab]      = useState("All");
  const [showAssModal,   setShowAssModal]   = useState(false);

  // Grade modal state
  const [gradeModal,  setGradeModal]  = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [grade,       setGrade]       = useState("");
  const [feedback,    setFeedback]    = useState("");
  const [submitting,  setSubmitting]  = useState(false);

  useEffect(() => {
    if (paramAssignmentId) {
      // Direct navigation with assignmentId
      loadSubmissions(paramAssignmentId);
    } else if (courseId) {
      // Load assignments for this course, then let user pick
      loadAssignments(courseId);
    } else {
      // No params - load all instructor assignments
      loadAllAssignments();
    }
  }, []);

  const loadAllAssignments = async () => {
    try {
      setLoading(true);
      // Get instructor courses first
      const coursesRes = await api.get(`${ENDPOINTS.COURSES}/instructor/${user.id}`);
      const courses = coursesRes.data.data || [];
      const allAssignments = [];
      for (const c of courses) {
        try {
          const assRes = await api.get(`${ENDPOINTS.ASSIGNMENTS}?courseId=${c._id}`);
          const ass = (assRes.data.data || []).map(a => ({ ...a, courseName: c.title }));
          allAssignments.push(...ass);
        } catch (e) { /* skip */ }
      }
      setAssignments(allAssignments);
      if (allAssignments.length > 0) {
        setShowAssModal(true);
      } else {
        setError("No assignments found. Create an assignment first.");
      }
    } catch (err) {
      setError("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async (cId) => {
    try {
      setLoading(true);
      const res = await api.get(`${ENDPOINTS.ASSIGNMENTS}?courseId=${cId}`);
      const data = res.data.data || [];
      setAssignments(data);
      if (data.length === 1) {
        // Auto-select if only one
        setSelectedAssId(data[0]._id);
        setSelectedAss(data[0]);
        await loadSubmissions(data[0]._id);
      } else if (data.length > 1) {
        setShowAssModal(true);
        setLoading(false);
      } else {
        setError("No assignments found for this course.");
        setLoading(false);
      }
    } catch (err) {
      setError("Failed to load assignments");
      setLoading(false);
    }
  };

  const loadSubmissions = async (assId, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Get assignment details
      const assRes = await api.get(`${ENDPOINTS.ASSIGNMENTS}/${assId}`);
      setSelectedAss(assRes.data.data);
      setSelectedAssId(assId);

      // Get submissions for this assignment
      let subs = [];
      try {
        const subRes = await api.get(`${ENDPOINTS.SUBMISSIONS}/assignment/${assId}`);
        subs = subRes.data.data || [];
      } catch (subErr) {
        // If 403/404, it just means no submissions yet - not an error
        if (subErr.response?.status === 403 || subErr.response?.status === 404) {
          console.log('No submissions found for this assignment');
          subs = [];
        } else {
          // Real error - rethrow
          throw subErr;
        }
      }
      
      setSubmissions(subs);
    } catch (err) {
      // Only show error for real failures, not empty submissions
      const errorMsg = err.response?.data?.message || "Failed to load submissions";
      if (!errorMsg.includes("Access denied") && !errorMsg.includes("not authorized")) {
        setError(errorMsg);
      } else {
        // Access denied likely means no submissions - just show empty state
        console.log('Access issue, showing empty state');
        setSubmissions([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openGradeModal = (sub) => {
    setSelected(sub);
    setGrade(sub.grade?.toString() || "");
    setFeedback(sub.feedback || "");
    setGradeModal(true);
  };

  const submitGrade = async () => {
    const g = parseFloat(grade);
    const maxMarks = selectedAss?.totalMarks || 100;
    if (isNaN(g) || g < 0 || g > maxMarks) {
      Alert.alert("Invalid", `Grade must be between 0 and ${maxMarks}`);
      return;
    }
    try {
      setSubmitting(true);
      await api.put(`${ENDPOINTS.SUBMISSIONS}/${selected._id}/grade`, {
        grade: g, feedback: feedback.trim(),
      });
      setSubmissions(prev => prev.map(s =>
        s._id === selected._id ? { ...s, grade: g, feedback: feedback.trim(), isGraded: true } : s
      ));
      setGradeModal(false);
      Alert.alert("✅ Graded!", `${selected.userId?.name || "Student"} received ${g}/${maxMarks}`);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to submit grade");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filtered submissions ──────────────────────────────────────────────────
  const filtered = submissions.filter(s => {
    if (activeTab === "Pending") return !s.isGraded;
    if (activeTab === "Graded")  return s.isGraded;
    return true;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const total   = submissions.length;
  const graded  = submissions.filter(s => s.isGraded).length;
  const pending = total - graded;
  const avgScore = graded > 0
    ? Math.round(submissions.filter(s => s.isGraded).reduce((sum, s) => sum + (s.grade || 0), 0) / graded)
    : 0;

  // ── Render submission card ────────────────────────────────────────────────
  const renderCard = ({ item }) => {
    const name    = item.userId?.name || "Student";
    const initial = name.charAt(0).toUpperCase();
    const maxMarks = selectedAss?.totalMarks || 100;
    const scoreColor = item.isGraded
      ? (item.grade / maxMarks >= 0.5 ? "#43C678" : "#EF4444")
      : "#FFB347";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: PRIMARY + "20" }]}>
            <Text style={[styles.avatarText, { color: PRIMARY }]}>{initial}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.studentName}>{name}</Text>
            <Text style={styles.submittedAt}>
              Submitted {timeAgo(item.submittedAt || item.createdAt)}
            </Text>
            {item.submissionText && (
              <Text style={styles.submissionPreview} numberOfLines={1}>
                {item.submissionText}
              </Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: scoreColor + "20" }]}>
            {item.isGraded
              ? <Text style={[styles.statusText, { color: scoreColor }]}>{item.grade}/{maxMarks}</Text>
              : <Text style={[styles.statusText, { color: "#FFB347" }]}>Pending</Text>
            }
          </View>
        </View>

        {item.submissionUrl && (
          <TouchableOpacity style={styles.fileRow}
            onPress={() => Linking.openURL(item.submissionUrl).catch(() => Alert.alert("Error", "Cannot open file"))}>
            <Ionicons name="document-text-outline" size={16} color={PRIMARY} />
            <Text style={styles.fileLink}>View Submitted File</Text>
            <Ionicons name="open-outline" size={14} color={PRIMARY} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.gradeBtn, item.isGraded && styles.gradeBtnDone]}
          onPress={() => openGradeModal(item)}>
          <Ionicons name={item.isGraded ? "create-outline" : "checkmark-circle-outline"} size={16} color="#fff" />
          <Text style={styles.gradeBtnText}>{item.isGraded ? "Update Grade" : "View & Grade"}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading && !refreshing) return <LoadingSpinner text="Loading submissions..." />;

  // ── Error state ───────────────────────────────────────────────────────────
  if (error && !showAssModal) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorMsg}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => {
          setError(null);
          if (courseId) loadAssignments(courseId);
          else loadAllAssignments();
        }}>
          <Ionicons name="refresh-outline" size={18} color="#fff" />
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Assignment name header */}
      {selectedAss && (
        <View style={styles.assHeader}>
          <View style={styles.assHeaderLeft}>
            <Text style={styles.assTitle} numberOfLines={1}>{selectedAss.title}</Text>
            <Text style={styles.assMeta}>Due: {new Date(selectedAss.dueDate).toLocaleDateString()} · {selectedAss.totalMarks} marks</Text>
          </View>
          <TouchableOpacity style={styles.changeBtn} onPress={() => setShowAssModal(true)}>
            <Text style={styles.changeBtnText}>Change</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats strip */}
      {selectedAssId && (
        <View style={styles.statsStrip}>
          <View style={styles.statItem}><Text style={styles.statVal}>{total}</Text><Text style={styles.statLbl}>Total</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={[styles.statVal, { color: "#43C678" }]}>{graded}</Text><Text style={styles.statLbl}>Graded</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={[styles.statVal, { color: "#FFB347" }]}>{pending}</Text><Text style={styles.statLbl}>Pending</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={[styles.statVal, { color: PRIMARY }]}>{avgScore}%</Text><Text style={styles.statLbl}>Avg Score</Text></View>
        </View>
      )}

      {/* Filter tabs */}
      {selectedAssId && (
        <View style={styles.tabBar}>
          {["All", "Pending", "Graded"].map(tab => (
            <TouchableOpacity key={tab} style={styles.tab} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              {activeTab === tab && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Submissions list */}
      {selectedAssId ? (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderCard}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadSubmissions(selectedAssId, true)} colors={[PRIMARY]} />}
          ListEmptyComponent={
            graded === total && total > 0
              ? <View style={styles.allGradedBox}>
                  <Ionicons name="trophy" size={56} color="#FFB347" />
                  <Text style={styles.allGradedTitle}>All submissions graded! ��</Text>
                  <Text style={styles.allGradedSub}>Great work reviewing all {total} submissions.</Text>
                </View>
              : <EmptyState icon="document-text-outline" title="No submissions yet"
                  description="Students haven't submitted this assignment yet" />
          }
        />
      ) : (
        !showAssModal && (
          <EmptyState icon="document-attach-outline" title="Select an Assignment"
            description="Tap below to choose which assignment to grade"
            actionLabel="Choose Assignment"
            onAction={() => setShowAssModal(true)} />
        )
      )}

      {/* Assignment picker modal */}
      <Modal visible={showAssModal} transparent animationType="slide" onRequestClose={() => setShowAssModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAssModal(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Assignment</Text>
            {assignments.length === 0
              ? <Text style={styles.noAssText}>No assignments found.</Text>
              : assignments.map(a => (
                <TouchableOpacity key={a._id} style={styles.assOption}
                  onPress={() => {
                    setShowAssModal(false);
                    loadSubmissions(a._id);
                  }}>
                  <View style={styles.assOptionLeft}>
                    <Text style={styles.assOptionTitle}>{a.title}</Text>
                    {a.courseName && <Text style={styles.assOptionCourse}>{a.courseName}</Text>}
                    <Text style={styles.assOptionMeta}>Due: {new Date(a.dueDate).toLocaleDateString()} · {a.totalMarks} marks</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>
              ))
            }
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Grade modal */}
      <Modal visible={gradeModal} transparent animationType="slide" onRequestClose={() => setGradeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.gradeSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Grade Submission</Text>

            <View style={styles.gradeStudentRow}>
              <View style={[styles.avatar, { backgroundColor: PRIMARY + "20" }]}>
                <Text style={[styles.avatarText, { color: PRIMARY }]}>
                  {(selected?.userId?.name || "S").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.gradeStudentName}>{selected?.userId?.name || "Student"}</Text>
                <Text style={styles.gradeSubmittedAt}>
                  Submitted {selected ? timeAgo(selected.submittedAt || selected.createdAt) : ""}
                </Text>
              </View>
            </View>

            {selected?.submissionText && (
              <View style={styles.submissionTextBox}>
                <Text style={styles.submissionTextLabel}>Submission:</Text>
                <Text style={styles.submissionTextContent} numberOfLines={4}>
                  {selected.submissionText}
                </Text>
              </View>
            )}

            {selected?.submissionUrl && (
              <TouchableOpacity style={styles.fileRow}
                onPress={() => Linking.openURL(selected.submissionUrl).catch(() => {})}>
                <Ionicons name="document-text-outline" size={18} color={PRIMARY} />
                <Text style={styles.fileLink}>Open Submitted File</Text>
                <Ionicons name="open-outline" size={14} color={PRIMARY} />
              </TouchableOpacity>
            )}

            <Text style={styles.gradeLabel}>
              Grade (0 – {selectedAss?.totalMarks || 100}) *
            </Text>
            <TextInput style={styles.gradeInput} value={grade} onChangeText={setGrade}
              placeholder={`0 – ${selectedAss?.totalMarks || 100}`} placeholderTextColor="#aaa"
              keyboardType="numeric" />

            <Text style={styles.gradeLabel}>Feedback (optional)</Text>
            <TextInput style={[styles.gradeInput, styles.feedbackInput]}
              value={feedback} onChangeText={setFeedback}
              placeholder="Write feedback for the student..."
              placeholderTextColor="#aaa" multiline numberOfLines={4} textAlignVertical="top" />

            <View style={styles.gradeActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setGradeModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitGradeBtn} onPress={submitGrade} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.submitGradeBtnText}>Submit Grade</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, backgroundColor: "#F5F5F5" },
  errorTitle: { fontSize: 22, fontWeight: "bold", color: "#1a1a2e", marginTop: 12, marginBottom: 8 },
  errorMsg: { fontSize: 14, color: "#888", textAlign: "center", marginBottom: 24 },
  retryBtn: { flexDirection: "row", alignItems: "center", backgroundColor: PRIMARY, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryBtnText: { fontSize: 15, fontWeight: "600", color: "#fff", marginLeft: 6 },
  assHeader: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 14, borderBottomWidth: 1, borderBottomColor: "#eee" },
  assHeaderLeft: { flex: 1 },
  assTitle: { fontSize: 15, fontWeight: "bold", color: "#1a1a2e" },
  assMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  changeBtn: { backgroundColor: PRIMARY + "15", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  changeBtnText: { fontSize: 13, fontWeight: "600", color: PRIMARY },
  statsStrip: { flexDirection: "row", backgroundColor: "#fff", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#eee" },
  statItem: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 20, fontWeight: "bold", color: "#1a1a2e" },
  statLbl: { fontSize: 11, color: "#888", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "#eee", marginVertical: 4 },
  tabBar: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12, position: "relative" },
  tabText: { fontSize: 13, fontWeight: "500", color: "#888" },
  tabTextActive: { color: PRIMARY, fontWeight: "700" },
  tabUnderline: { position: "absolute", bottom: 0, left: "20%", right: "20%", height: 3, backgroundColor: PRIMARY, borderRadius: 2 },
  list: { padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: "bold" },
  cardInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: "700", color: "#1a1a2e" },
  submittedAt: { fontSize: 12, color: "#888", marginTop: 2 },
  submissionPreview: { fontSize: 12, color: "#aaa", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: "700" },
  fileRow: { flexDirection: "row", alignItems: "center", backgroundColor: PRIMARY + "10", borderRadius: 8, padding: 10, marginBottom: 10 },
  fileLink: { flex: 1, fontSize: 13, fontWeight: "600", color: PRIMARY, marginLeft: 8 },
  gradeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: PRIMARY, borderRadius: 8, paddingVertical: 10 },
  gradeBtnDone: { backgroundColor: "#43C678" },
  gradeBtnText: { fontSize: 13, fontWeight: "600", color: "#fff", marginLeft: 6 },
  allGradedBox: { alignItems: "center", paddingVertical: 60 },
  allGradedTitle: { fontSize: 18, fontWeight: "bold", color: "#1a1a2e", marginTop: 16, marginBottom: 8 },
  allGradedSub: { fontSize: 14, color: "#888", textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32, maxHeight: "80%" },
  gradeSheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  modalHandle: { width: 40, height: 4, backgroundColor: "#ddd", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#1a1a2e", marginBottom: 16 },
  noAssText: { fontSize: 14, color: "#888", textAlign: "center", paddingVertical: 20 },
  assOption: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  assOptionLeft: { flex: 1 },
  assOptionTitle: { fontSize: 15, fontWeight: "600", color: "#1a1a2e" },
  assOptionCourse: { fontSize: 12, color: PRIMARY, marginTop: 2 },
  assOptionMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  gradeStudentRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  gradeStudentName: { fontSize: 15, fontWeight: "700", color: "#1a1a2e", marginLeft: 12 },
  gradeSubmittedAt: { fontSize: 12, color: "#888", marginLeft: 12, marginTop: 2 },
  submissionTextBox: { backgroundColor: "#f9f9f9", borderRadius: 8, padding: 12, marginBottom: 14 },
  submissionTextLabel: { fontSize: 12, fontWeight: "600", color: "#888", marginBottom: 4 },
  submissionTextContent: { fontSize: 14, color: "#1a1a2e", lineHeight: 20 },
  gradeLabel: { fontSize: 14, fontWeight: "600", color: "#555", marginBottom: 6, marginTop: 12 },
  gradeInput: { backgroundColor: "#f9f9f9", borderRadius: 10, padding: 14, fontSize: 15, color: "#1a1a2e", borderWidth: 1, borderColor: "#eee" },
  feedbackInput: { height: 100, marginBottom: 4 },
  gradeActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1, borderColor: "#ddd", alignItems: "center", marginRight: 8 },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#888" },
  submitGradeBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, backgroundColor: "#43C678", alignItems: "center" },
  submitGradeBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
});

export default GradeSubmissionsScreen;
