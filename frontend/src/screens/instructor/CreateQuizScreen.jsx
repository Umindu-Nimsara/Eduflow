import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

const PRIMARY = '#6C63FF';

// ── Question editor with dynamic options (2-5) ────────────────────────────────
const QuestionEditor = ({ index, question, onChange, onRemove }) => {
  const addOption = () => {
    if (question.options.length >= 5) return;
    onChange({ ...question, options: [...question.options, ''] });
  };

  const removeOption = (i) => {
    if (question.options.length <= 2) {
      Alert.alert('Minimum', 'At least 2 options required');
      return;
    }
    const newOptions = question.options.filter((_, idx) => idx !== i);
    // If removed option was correct, reset to 0
    const newCorrect = question.correctAnswer >= newOptions.length ? 0 : question.correctAnswer;
    onChange({ ...question, options: newOptions, correctAnswer: newCorrect });
  };

  const updateOption = (i, text) => {
    const newOptions = [...question.options];
    newOptions[i] = text;
    onChange({ ...question, options: newOptions });
  };

  const LABELS = ['A', 'B', 'C', 'D', 'E'];

  return (
    <View style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionNum}>Q{index + 1}</Text>
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.questionInput}
        value={question.questionText}
        onChangeText={t => onChange({ ...question, questionText: t })}
        placeholder="Enter question text..."
        placeholderTextColor="#aaa"
        multiline
      />

      <Text style={styles.optionsLabel}>
        Options — tap label to mark correct answer
      </Text>

      {question.options.map((opt, i) => (
        <View key={i} style={styles.optionRow}>
          <TouchableOpacity
            style={[styles.optionBadge, question.correctAnswer === i && styles.optionBadgeCorrect]}
            onPress={() => onChange({ ...question, correctAnswer: i })}
          >
            <Text style={[styles.optionBadgeText, question.correctAnswer === i && styles.optionBadgeTextCorrect]}>
              {LABELS[i]}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.optionInput, question.correctAnswer === i && styles.optionInputCorrect]}
            value={opt}
            onChangeText={t => updateOption(i, t)}
            placeholder={`Option ${LABELS[i]}...`}
            placeholderTextColor="#aaa"
          />

          {question.options.length > 2 && (
            <TouchableOpacity onPress={() => removeOption(i)} style={styles.removeOptionBtn}>
              <Ionicons name="close-circle" size={18} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* Add option button */}
      {question.options.length < 5 && (
        <TouchableOpacity style={styles.addOptionBtn} onPress={addOption}>
          <Ionicons name="add-circle-outline" size={16} color="#888" />
          <Text style={styles.addOptionText}>Add Option ({question.options.length}/5)</Text>
        </TouchableOpacity>
      )}

      {/* Marks */}
      <View style={styles.marksRow}>
        <Text style={styles.marksLabel}>Marks for this question:</Text>
        <TextInput
          style={styles.marksInput}
          value={question.marks?.toString() || ''}
          onChangeText={t => onChange({ ...question, marks: parseInt(t) || 0 })}
          placeholder="10"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
        />
      </View>
    </View>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
const CreateQuizScreen = ({ route, navigation }) => {
  const { user } = useContext(AuthContext);
  const preselectedCourseId = route.params?.courseId || '';
  // If editing existing quiz, quizId is passed
  const existingQuizId = route.params?.quizId || null;

  const [step,         setStep]         = useState(existingQuizId ? 2 : 1);
  const [courses,      setCourses]      = useState([]);
  const [courseId,     setCourseId]     = useState(preselectedCourseId);
  const [title,        setTitle]        = useState('');
  const [description,  setDescription]  = useState('');
  const [passingScore, setPassingScore] = useState('70');
  const [timeLimit,    setTimeLimit]    = useState('30');
  const [questions,    setQuestions]    = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(!existingQuizId);
  const [createdQuizId, setCreatedQuizId] = useState(existingQuizId);

  useEffect(() => {
    if (!existingQuizId) {
      fetchMyCourses();
    } else {
      // Load existing quiz questions
      loadExistingQuiz();
    }
  }, []);

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

  const loadExistingQuiz = async () => {
    try {
      setLoading(true);
      const [quizRes, questionsRes] = await Promise.all([
        api.get(`${ENDPOINTS.QUIZZES}/${existingQuizId}`),
        api.get(`${ENDPOINTS.QUIZZES}/${existingQuizId}/questions`).catch(() => ({ data: { data: [] } })),
      ]);

      const quiz = quizRes.data.data;
      setTitle(quiz.title || '');
      setDescription(quiz.description || '');
      setPassingScore(quiz.passingScore?.toString() || '70');
      setTimeLimit(quiz.timeLimit?.toString() || '30');

      // Convert existing questions to editor format
      const existingQs = (questionsRes.data.data || []).map(q => ({
        _id:           q._id,
        questionText:  q.questionText,
        options:       Array.isArray(q.options) ? q.options : ['', '', '', ''],
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
        marks:         q.marks || 10,
      }));

      setQuestions(existingQs.length > 0 ? existingQs : [newQuestion()]);
    } catch (err) {
      Alert.alert('Error', 'Failed to load quiz');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const newQuestion = () => ({
    questionText:  '',
    options:       ['', '', '', ''],  // Start with 4 options
    correctAnswer: 0,
    marks:         10,
  });

  const addQuestion = () => {
    if (questions.length >= 50) {
      Alert.alert('Limit', 'Maximum 50 questions per quiz');
      return;
    }
    setQuestions(prev => [...prev, newQuestion()]);
  };

  const updateQuestion = (index, updated) => {
    setQuestions(prev => prev.map((q, i) => i === index ? updated : q));
  };

  const removeQuestion = (index) => {
    Alert.alert('Remove Question', 'Remove this question?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        setQuestions(prev => prev.filter((_, i) => i !== index));
      }},
    ]);
  };

  // Step 1: Create quiz
  const handleCreateQuiz = async () => {
    if (!courseId)     { Alert.alert('Error', 'Please select a course'); return; }
    if (!title.trim()) { Alert.alert('Error', 'Quiz title is required'); return; }

    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0) || 100;

    try {
      setLoading(true);
      const res = await api.post(ENDPOINTS.QUIZZES, {
        courseId,
        title:        title.trim(),
        description:  description.trim(),
        passingScore: parseFloat(passingScore) || 70,
        timeLimit:    parseInt(timeLimit) || 30,
        totalMarks,
      });
      setCreatedQuizId(res.data.data._id);
      setStep(2);
      if (questions.length === 0) setQuestions([newQuestion()]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Save all questions
  const handleSaveQuestions = async () => {
    if (questions.length === 0) {
      Alert.alert('Error', 'Add at least one question');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        Alert.alert('Error', `Question ${i + 1} text is empty`);
        return;
      }
      const filledOptions = q.options.filter(o => o.trim() !== '');
      if (filledOptions.length < 2) {
        Alert.alert('Error', `Question ${i + 1} needs at least 2 options`);
        return;
      }
    }

    try {
      setLoading(true);

      for (const q of questions) {
        const filledOptions = q.options.filter(o => o.trim() !== '');
        const correctIndex  = Math.min(q.correctAnswer, filledOptions.length - 1);

        if (q._id) {
          // Update existing question
          await api.put(`${ENDPOINTS.QUESTIONS}/${q._id}`, {
            questionText:  q.questionText.trim(),
            options:       filledOptions,
            correctAnswer: correctIndex,
            marks:         q.marks || 10,
          });
        } else {
          // Create new question
          await api.post(ENDPOINTS.QUESTIONS, {
            quizId:        createdQuizId,
            questionText:  q.questionText.trim(),
            options:       filledOptions,
            correctAnswer: correctIndex,
            marks:         q.marks || 10,
          });
        }
      }

      // Update total marks and publish
      const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
      await api.put(`${ENDPOINTS.QUIZZES}/${createdQuizId}`, {
        isPublished: true,
        totalMarks,
      });

      Alert.alert(
        '✅ Quiz Published!',
        `"${title}" with ${questions.length} questions is now live.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save questions');
    } finally {
      setLoading(false);
    }
  };

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  if (loading && existingQuizId && step === 2) {
    return <ActivityIndicator color={PRIMARY} style={{ flex: 1, marginTop: 40 }} />;
  }

  // ── Step 1: Quiz Details ──────────────────────────────────────────────────
  if (step === 1) {
    return (
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepDotActive]}><Text style={styles.stepDotText}>1</Text></View>
            <View style={styles.stepLine} />
            <View style={styles.stepDot}><Text style={styles.stepDotText}>2</Text></View>
          </View>
          <Text style={styles.stepTitle}>Quiz Details</Text>

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

          <Text style={styles.label}>Quiz Title *</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Chapter 1 Quiz" placeholderTextColor="#aaa" />

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Brief description..." placeholderTextColor="#aaa" multiline numberOfLines={3} textAlignVertical="top" />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Passing Score (%)</Text>
              <TextInput style={styles.input} value={passingScore} onChangeText={setPassingScore} placeholder="70" placeholderTextColor="#aaa" keyboardType="numeric" />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Time Limit (min)</Text>
              <TextInput style={styles.input} value={timeLimit} onChangeText={setTimeLimit} placeholder="30" placeholderTextColor="#aaa" keyboardType="numeric" />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, (loading || !courseId || !title.trim()) && styles.btnDisabled]}
            onPress={handleCreateQuiz}
            disabled={loading || !courseId || !title.trim()}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <Ionicons name="arrow-forward-circle-outline" size={20} color="#fff" />
                <Text style={styles.btnText}>Next: Add Questions</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ── Step 2: Questions ─────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepDotDone]}><Ionicons name="checkmark" size={14} color="#fff" /></View>
          <View style={[styles.stepLine, styles.stepLineDone]} />
          <View style={[styles.stepDot, styles.stepDotActive]}><Text style={styles.stepDotText}>2</Text></View>
        </View>
        <Text style={styles.stepTitle}>
          {existingQuizId ? 'Edit Questions' : 'Add Questions'}
        </Text>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>{title || 'Quiz'}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryItem}>📝 {questions.length} questions</Text>
            <Text style={styles.summaryItem}>⭐ {totalMarks} marks</Text>
            <Text style={styles.summaryItem}>⏱ {timeLimit} min</Text>
            <Text style={styles.summaryItem}>✅ Pass: {passingScore}%</Text>
          </View>
        </View>

        {/* Questions */}
        {questions.map((q, i) => (
          <QuestionEditor
            key={i}
            index={i}
            question={q}
            onChange={(updated) => updateQuestion(i, updated)}
            onRemove={() => removeQuestion(i)}
          />
        ))}

        {/* Add question */}
        <TouchableOpacity style={styles.addQuestionBtn} onPress={addQuestion}>
          <Ionicons name="add-circle-outline" size={22} color={PRIMARY} />
          <Text style={styles.addQuestionText}>Add Question ({questions.length}/50)</Text>
        </TouchableOpacity>

        {/* Save & Publish */}
        <TouchableOpacity
          style={[styles.btn, (loading || questions.length === 0) && styles.btnDisabled]}
          onPress={handleSaveQuestions}
          disabled={loading || questions.length === 0}
        >
          {loading ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.btnText}>
                {existingQuizId ? 'Save Changes' : 'Save & Publish Quiz'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {!existingQuizId && (
          <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.skipBtnText}>Save without questions (add later)</Text>
          </TouchableOpacity>
        )}
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
  textArea:   { height: 90 },
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
  alertText: { fontSize: 13, color: '#888', marginLeft: 8, flex: 1 },

  // Step indicator
  stepRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center',
  },
  stepDotActive: { backgroundColor: PRIMARY },
  stepDotDone:   { backgroundColor: '#43C678' },
  stepDotText:   { fontSize: 13, fontWeight: 'bold', color: '#fff' },
  stepLine:      { flex: 1, height: 2, backgroundColor: '#ddd', marginHorizontal: 8 },
  stepLineDone:  { backgroundColor: '#43C678' },
  stepTitle:     { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 16 },

  // Summary
  summaryBox:   { backgroundColor: PRIMARY + '10', borderRadius: 12, padding: 14, marginBottom: 16 },
  summaryTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 8 },
  summaryRow:   { flexDirection: 'row', flexWrap: 'wrap' },
  summaryItem:  { fontSize: 12, color: '#555', marginRight: 12, marginBottom: 4 },

  // Question card
  questionCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  questionNum:    { fontSize: 15, fontWeight: 'bold', color: PRIMARY },
  removeBtn:      { padding: 4 },
  questionInput: {
    backgroundColor: '#f9f9f9', borderRadius: 8, padding: 12,
    fontSize: 14, color: '#1a1a2e', borderWidth: 1, borderColor: '#eee',
    marginBottom: 12, minHeight: 60,
  },
  optionsLabel: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 8 },
  optionRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  optionBadge: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  optionBadgeCorrect:     { backgroundColor: '#43C678' },
  optionBadgeText:        { fontSize: 12, fontWeight: 'bold', color: '#888' },
  optionBadgeTextCorrect: { color: '#fff' },
  optionInput: {
    flex: 1, backgroundColor: '#f9f9f9', borderRadius: 8, padding: 10,
    fontSize: 14, color: '#1a1a2e', borderWidth: 1, borderColor: '#eee',
  },
  optionInputCorrect: { borderColor: '#43C678', backgroundColor: '#43C67808' },
  removeOptionBtn:    { padding: 6, marginLeft: 4 },
  addOptionBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 4, marginBottom: 8,
  },
  addOptionText: { fontSize: 13, color: '#888', marginLeft: 6 },
  marksRow:      { flexDirection: 'row', alignItems: 'center', marginTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 8 },
  marksLabel:    { fontSize: 13, color: '#888', flex: 1 },
  marksInput: {
    backgroundColor: '#f9f9f9', borderRadius: 8, padding: 8,
    fontSize: 14, color: '#1a1a2e', borderWidth: 1, borderColor: '#eee',
    width: 70, textAlign: 'center',
  },

  // Add question
  addQuestionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderWidth: 2, borderColor: PRIMARY,
    borderStyle: 'dashed', borderRadius: 12, paddingVertical: 14, marginBottom: 16,
  },
  addQuestionText: { fontSize: 15, fontWeight: '600', color: PRIMARY, marginLeft: 8 },

  // Buttons
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 15, marginBottom: 12,
  },
  btnDisabled: { opacity: 0.5 },
  btnText:     { fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 8 },
  skipBtn:     { alignItems: 'center', paddingVertical: 12, marginBottom: 24 },
  skipBtnText: { fontSize: 14, color: '#888' },
});

export default CreateQuizScreen;
