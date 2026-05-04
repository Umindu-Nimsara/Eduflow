import React, { useState, useEffect, useContext } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Switch, Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";

const PRIMARY = "#6C63FF";
const DIFF_COLORS = { Easy: "#43C678", Medium: "#FFB347", Hard: "#EF4444" };
const LABELS = ["A", "B", "C", "D"];

const FieldError = ({ msg }) =>
  msg ? <Text style={styles.fieldError}>{msg}</Text> : null;

const StepDots = ({ current, total }) => (
  <View style={styles.dotsRow}>
    {Array.from({ length: total }).map((_, i) => (
      <View key={i} style={[styles.dot, i < current && styles.dotFilled, i === current - 1 && styles.dotActive]} />
    ))}
  </View>
);

const AddQuizScreen = ({ route, navigation }) => {
  const { user } = useContext(AuthContext);
  const preselectedCourseId = route.params?.courseId || "";

  const [step, setStep] = useState(1);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Step 1 state
  const [courseId, setCourseId] = useState(preselectedCourseId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState("70");
  const [timeLimit, setTimeLimit] = useState("30");
  const [numQuestions, setNumQuestions] = useState("5");
  const [difficulty, setDifficulty] = useState("Medium");
  const [attemptsAllowed, setAttemptsAllowed] = useState("3");
  const [unlimitedAttempts, setUnlimitedAttempts] = useState(false);
  const [errors, setErrors] = useState({});

  // Step 2 state
  const [currentQ, setCurrentQ] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [createdQuizId, setCreatedQuizId] = useState(null);
  const [savingQuiz, setSavingQuiz] = useState(false);

  // Step 3 state
  const [publishing, setPublishing] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

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

  const makeQuestion = () => ({
    questionText: "", options: ["", "", "", ""],
    correctAnswer: 0, marks: 1, explanation: "",
  });

  const validateStep1 = () => {
    const e = {};
    if (!courseId) e.courseId = "Please select a course";
    if (!title.trim()) e.title = "Quiz title is required";
    const n = parseInt(numQuestions);
    if (!n || n < 1 || n > 50) e.numQuestions = "Enter a number between 1 and 50";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleStep1Next = async () => {
    if (!validateStep1()) return;
    try {
      setSavingQuiz(true);
      const totalMarks = parseInt(numQuestions) * 1;
      const res = await api.post(ENDPOINTS.QUIZZES, {
        courseId, title: title.trim(), description: description.trim(),
        passingScore: parseFloat(passingScore) || 70,
        timeLimit: parseInt(timeLimit) || 30,
        totalMarks,
        difficulty,
        attemptsAllowed: unlimitedAttempts ? 999 : parseInt(attemptsAllowed) || 3,
      });
      setCreatedQuizId(res.data.data._id);
      const qs = Array.from({ length: parseInt(numQuestions) }, makeQuestion);
      setQuestions(qs);
      setCurrentQ(0);
      setStep(2);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to create quiz");
    } finally { setSavingQuiz(false); }
  };

  const updateCurrentQ = (field, value) => {
    setQuestions(prev => prev.map((q, i) => i === currentQ ? { ...q, [field]: value } : q));
  };

  const updateOption = (optIdx, text) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== currentQ) return q;
      const opts = [...q.options];
      opts[optIdx] = text;
      return { ...q, options: opts };
    }));
  };

  const saveCurrentAndGo = async (nextIdx) => {
    const q = questions[currentQ];
    if (!q.questionText.trim()) {
      Alert.alert("Required", "Please enter the question text");
      return;
    }
    const filled = q.options.filter(o => o.trim() !== "");
    if (filled.length < 2) {
      Alert.alert("Required", "Please fill at least 2 options");
      return;
    }
    try {
      await api.post(ENDPOINTS.QUESTIONS, {
        quizId: createdQuizId,
        questionText: q.questionText.trim(),
        options: q.options.filter(o => o.trim() !== ""),
        correctAnswer: Math.min(q.correctAnswer, filled.length - 1),
        marks: q.marks || 1,
        explanation: q.explanation || "",
      });
      if (nextIdx >= questions.length) {
        setStep(3);
      } else {
        setCurrentQ(nextIdx);
      }
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to save question");
    }
  };

  const handlePublish = async (publish) => {
    try {
      setPublishing(true);
      const totalMarks = questions.reduce((s, q) => s + (q.marks || 1), 0);
      await api.put(`${ENDPOINTS.QUIZZES}/${createdQuizId}`, {
        isPublished: publish, totalMarks,
      });
      setSuccessModal(true);
    } catch (err) {
      Alert.alert("Error", "Failed to publish quiz");
    } finally { setPublishing(false); }
  };

  const courseName = courses.find(c => c._id === courseId)?.title || "";
  const q = questions[currentQ] || makeQuestion();
  const totalQ = questions.length;
  const progress = totalQ > 0 ? ((currentQ + 1) / totalQ) * 100 : 0;

  // ── STEP 1 ────────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, styles.stepBadgeActive]}><Text style={styles.stepBadgeText}>1</Text></View>
            <View style={styles.stepLine} />
            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>2</Text></View>
            <View style={styles.stepLine} />
            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>3</Text></View>
          </View>
          <Text style={styles.stepTitle}>Quiz Details</Text>

          <Text style={styles.label}>Select Course *</Text>
          {loadingCourses ? <ActivityIndicator color={PRIMARY} style={{ marginVertical: 12 }} /> : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
              {courses.map(c => (
                <TouchableOpacity key={c._id}
                  style={[styles.pill, courseId === c._id && styles.pillActive]}
                  onPress={() => { setCourseId(c._id); setErrors(p => ({ ...p, courseId: "" })); }}
                  onLongPress={() => Alert.alert("Course", c.title)}
                >
                  <Text style={[styles.pillText, courseId === c._id && styles.pillTextActive]} numberOfLines={1}>
                    {c.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          <FieldError msg={errors.courseId} />

          <Text style={styles.label}>Quiz Title *</Text>
          <TextInput style={[styles.input, errors.title && styles.inputError]}
            value={title} onChangeText={t => { setTitle(t); setErrors(p => ({ ...p, title: "" })); }}
            placeholder="e.g. Chapter 1 Quiz" placeholderTextColor="#aaa" />
          <FieldError msg={errors.title} />

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description}
            onChangeText={setDescription} placeholder="Brief description..." placeholderTextColor="#aaa"
            multiline numberOfLines={3} textAlignVertical="top" />

          <Text style={styles.label}>Difficulty Level</Text>
          <View style={styles.diffRow}>
            {["Easy", "Medium", "Hard"].map(d => (
              <TouchableOpacity key={d}
                style={[styles.diffPill, difficulty === d && { backgroundColor: DIFF_COLORS[d], borderColor: DIFF_COLORS[d] }]}
                onPress={() => setDifficulty(d)}>
                <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Passing Score (%)</Text>
              <TextInput style={styles.input} value={passingScore} onChangeText={setPassingScore}
                placeholder="70" placeholderTextColor="#aaa" keyboardType="numeric" />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Time Limit (min)</Text>
              <TextInput style={styles.input} value={timeLimit} onChangeText={setTimeLimit}
                placeholder="30" placeholderTextColor="#aaa" keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Number of Questions</Text>
              <TextInput style={[styles.input, errors.numQuestions && styles.inputError]}
                value={numQuestions} onChangeText={t => { setNumQuestions(t); setErrors(p => ({ ...p, numQuestions: "" })); }}
                placeholder="5" placeholderTextColor="#aaa" keyboardType="numeric" />
              <FieldError msg={errors.numQuestions} />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Attempts Allowed</Text>
              <TextInput style={[styles.input, unlimitedAttempts && styles.inputDisabled]}
                value={unlimitedAttempts ? "∞" : attemptsAllowed}
                onChangeText={setAttemptsAllowed}
                placeholder="3" placeholderTextColor="#aaa" keyboardType="numeric"
                editable={!unlimitedAttempts} />
            </View>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Unlimited Attempts</Text>
            <Switch value={unlimitedAttempts} onValueChange={setUnlimitedAttempts}
              trackColor={{ false: "#ddd", true: PRIMARY + "60" }}
              thumbColor={unlimitedAttempts ? PRIMARY : "#f4f3f4"} />
          </View>

          <TouchableOpacity
            style={[styles.btn, (savingQuiz || !courseId || !title.trim()) && styles.btnDisabled]}
            onPress={handleStep1Next} disabled={savingQuiz || !courseId || !title.trim()}>
            {savingQuiz ? <ActivityIndicator color="#fff" size="small" /> : (
              <><Ionicons name="arrow-forward-circle-outline" size={20} color="#fff" />
                <Text style={styles.btnText}>Next: Add Questions</Text></>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ── STEP 2 ────────────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <View style={styles.container}>
        <View style={styles.step2Header}>
          <Text style={styles.step2Title}>Add Questions ({currentQ + 1} of {totalQ})</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
          <View style={styles.form}>
            <View style={styles.questionCard}>
              <Text style={styles.questionNum}>Question {currentQ + 1}</Text>

              <Text style={styles.label}>Question Text *</Text>
              <TextInput style={[styles.input, styles.textArea]}
                value={q.questionText}
                onChangeText={t => updateCurrentQ("questionText", t)}
                placeholder="Enter your question here..." placeholderTextColor="#aaa"
                multiline numberOfLines={3} textAlignVertical="top" />

              <Text style={styles.label}>Options — tap letter to mark correct</Text>
              {q.options.map((opt, i) => (
                <TouchableOpacity key={i} style={[styles.optRow, q.correctAnswer === i && styles.optRowCorrect]}
                  onPress={() => updateCurrentQ("correctAnswer", i)}>
                  <View style={[styles.optBadge, q.correctAnswer === i && styles.optBadgeCorrect]}>
                    <Text style={[styles.optBadgeText, q.correctAnswer === i && styles.optBadgeTextCorrect]}>
                      {LABELS[i]}
                    </Text>
                  </View>
                  <TextInput style={styles.optInput} value={opt}
                    onChangeText={t => updateOption(i, t)}
                    placeholder={`Option ${LABELS[i]}...`} placeholderTextColor="#aaa" />
                  {q.correctAnswer === i && <Ionicons name="checkmark-circle" size={20} color="#43C678" />}
                </TouchableOpacity>
              ))}

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Marks</Text>
                  <TextInput style={styles.input} value={q.marks?.toString() || "1"}
                    onChangeText={t => updateCurrentQ("marks", parseInt(t) || 1)}
                    placeholder="1" placeholderTextColor="#aaa" keyboardType="numeric" />
                </View>
              </View>

              <Text style={styles.label}>Explanation (optional)</Text>
              <TextInput style={[styles.input, { height: 70 }]}
                value={q.explanation} onChangeText={t => updateCurrentQ("explanation", t)}
                placeholder="Explain why this answer is correct..." placeholderTextColor="#aaa"
                multiline textAlignVertical="top" />
            </View>

            {currentQ < totalQ - 1 ? (
              <TouchableOpacity style={styles.btn} onPress={() => saveCurrentAndGo(currentQ + 1)}>
                <Ionicons name="arrow-forward-circle-outline" size={20} color="#fff" />
                <Text style={styles.btnText}>Save & Next Question</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.btn, { backgroundColor: "#43C678" }]}
                onPress={() => saveCurrentAndGo(totalQ)}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.btnText}>Save & Finish</Text>
              </TouchableOpacity>
            )}

            {currentQ > 0 && (
              <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentQ(currentQ - 1)}>
                <Ionicons name="arrow-back-outline" size={16} color={PRIMARY} />
                <Text style={styles.backBtnText}>Previous Question</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        <StepDots current={currentQ + 1} total={totalQ} />
      </View>
    );
  }

  // ── STEP 3 ────────────────────────────────────────────────────────────────
  const totalMarks = questions.reduce((s, q) => s + (q.marks || 1), 0);
  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.stepHeader}>
          <View style={[styles.stepBadge, styles.stepBadgeDone]}><Ionicons name="checkmark" size={14} color="#fff" /></View>
          <View style={[styles.stepLine, styles.stepLineDone]} />
          <View style={[styles.stepBadge, styles.stepBadgeDone]}><Ionicons name="checkmark" size={14} color="#fff" /></View>
          <View style={[styles.stepLine, styles.stepLineDone]} />
          <View style={[styles.stepBadge, styles.stepBadgeActive]}><Text style={styles.stepBadgeText}>3</Text></View>
        </View>
        <Text style={styles.stepTitle}>Review & Publish</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{title}</Text>
          <Text style={styles.summaryMeta}>📚 {courseName}</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}><Text style={styles.summaryVal}>{totalQ}</Text><Text style={styles.summaryLbl}>Questions</Text></View>
            <View style={styles.summaryItem}><Text style={styles.summaryVal}>{totalMarks}</Text><Text style={styles.summaryLbl}>Total Marks</Text></View>
            <View style={styles.summaryItem}><Text style={styles.summaryVal}>{timeLimit}m</Text><Text style={styles.summaryLbl}>Time Limit</Text></View>
            <View style={styles.summaryItem}><Text style={styles.summaryVal}>{passingScore}%</Text><Text style={styles.summaryLbl}>Pass Score</Text></View>
          </View>
          <View style={[styles.diffPill, { backgroundColor: DIFF_COLORS[difficulty] + "20", borderColor: DIFF_COLORS[difficulty], alignSelf: "flex-start", marginTop: 8 }]}>
            <Text style={[styles.diffText, { color: DIFF_COLORS[difficulty] }]}>{difficulty}</Text>
          </View>
        </View>

        <Text style={styles.label}>Questions Preview</Text>
        {questions.map((q, i) => (
          <View key={i} style={styles.reviewQ}>
            <Text style={styles.reviewQNum}>Q{i + 1}: {q.questionText || "(empty)"}</Text>
            <Text style={styles.reviewQMeta}>{q.marks} mark{q.marks !== 1 ? "s" : ""} · Correct: {LABELS[q.correctAnswer]}</Text>
          </View>
        ))}

        <TouchableOpacity style={[styles.btn, { backgroundColor: "#43C678", marginTop: 24 }]}
          onPress={() => handlePublish(true)} disabled={publishing}>
          {publishing ? <ActivityIndicator color="#fff" size="small" /> : (
            <><Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.btnText}>Publish Quiz</Text></>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnOutline, { marginTop: 10 }]}
          onPress={() => handlePublish(false)} disabled={publishing}>
          <Text style={[styles.btnText, { color: PRIMARY }]}>Save as Draft</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={successModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="checkmark-circle" size={64} color="#43C678" />
            <Text style={styles.successTitle}>Quiz Published!</Text>
            <Text style={styles.successSub}>{totalQ} questions · {totalMarks} marks</Text>
            <TouchableOpacity style={styles.btn} onPress={() => { setSuccessModal(false); navigation.goBack(); }}>
              <Text style={styles.btnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  form: { padding: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#555", marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: "#fff", borderRadius: 10, padding: 14, fontSize: 15, color: "#1a1a2e", borderWidth: 1, borderColor: "#eee" },
  inputError: { borderColor: "#EF4444" },
  inputDisabled: { backgroundColor: "#f5f5f5", color: "#aaa" },
  textArea: { height: 90 },
  fieldError: { fontSize: 12, color: "#EF4444", marginTop: 4 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  halfField: { width: "48%" },
  pillScroll: { marginBottom: 4 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#ddd", backgroundColor: "#fff", marginRight: 8, maxWidth: 160 },
  pillActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  pillText: { fontSize: 13, color: "#888" },
  pillTextActive: { color: "#fff", fontWeight: "600" },
  diffRow: { flexDirection: "row", marginBottom: 4 },
  diffPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#ddd", backgroundColor: "#fff", marginRight: 8 },
  diffText: { fontSize: 13, color: "#888" },
  diffTextActive: { color: "#fff", fontWeight: "600" },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 14, marginTop: 12 },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  stepHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  stepBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#ddd", justifyContent: "center", alignItems: "center" },
  stepBadgeActive: { backgroundColor: PRIMARY },
  stepBadgeDone: { backgroundColor: "#43C678" },
  stepBadgeText: { fontSize: 13, fontWeight: "bold", color: "#fff" },
  stepLine: { flex: 1, height: 2, backgroundColor: "#ddd", marginHorizontal: 8 },
  stepLineDone: { backgroundColor: "#43C678" },
  stepTitle: { fontSize: 20, fontWeight: "bold", color: "#1a1a2e", marginBottom: 16 },
  step2Header: { backgroundColor: "#fff", padding: 16, borderBottomWidth: 1, borderBottomColor: "#eee" },
  step2Title: { fontSize: 17, fontWeight: "bold", color: "#1a1a2e", marginBottom: 8 },
  progressBg: { height: 6, backgroundColor: "#eee", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: PRIMARY, borderRadius: 3 },
  questionCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  questionNum: { fontSize: 16, fontWeight: "bold", color: PRIMARY, marginBottom: 8 },
  optRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f9f9f9", borderRadius: 8, padding: 8, marginBottom: 6, borderWidth: 1, borderColor: "#eee" },
  optRowCorrect: { backgroundColor: "#43C67810", borderColor: "#43C678" },
  optBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#ddd", justifyContent: "center", alignItems: "center", marginRight: 8 },
  optBadgeCorrect: { backgroundColor: "#43C678" },
  optBadgeText: { fontSize: 12, fontWeight: "bold", color: "#888" },
  optBadgeTextCorrect: { color: "#fff" },
  optInput: { flex: 1, fontSize: 14, color: "#1a1a2e", padding: 4 },
  dotsRow: { flexDirection: "row", justifyContent: "center", paddingVertical: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#eee" },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#ddd", marginHorizontal: 4 },
  dotFilled: { backgroundColor: "#43C678" },
  dotActive: { backgroundColor: PRIMARY, width: 14, height: 14, borderRadius: 7 },
  summaryCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  summaryTitle: { fontSize: 18, fontWeight: "bold", color: "#1a1a2e", marginBottom: 4 },
  summaryMeta: { fontSize: 13, color: "#888", marginBottom: 12 },
  summaryGrid: { flexDirection: "row", justifyContent: "space-around" },
  summaryItem: { alignItems: "center" },
  summaryVal: { fontSize: 20, fontWeight: "bold", color: PRIMARY },
  summaryLbl: { fontSize: 11, color: "#888", marginTop: 2 },
  reviewQ: { backgroundColor: "#fff", borderRadius: 10, padding: 12, marginBottom: 8 },
  reviewQNum: { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  reviewQMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 15, marginTop: 12 },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 16, fontWeight: "bold", color: "#fff", marginLeft: 8 },
  btnOutline: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: PRIMARY },
  backBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  backBtnText: { fontSize: 14, color: PRIMARY, marginLeft: 6 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalCard: { backgroundColor: "#fff", borderRadius: 20, padding: 28, alignItems: "center", width: "100%" },
  successTitle: { fontSize: 22, fontWeight: "bold", color: "#1a1a2e", marginTop: 12, marginBottom: 8 },
  successSub: { fontSize: 14, color: "#888", marginBottom: 20 },
});

export default AddQuizScreen;
