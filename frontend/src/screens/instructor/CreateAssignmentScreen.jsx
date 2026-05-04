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

const CreateAssignmentScreen = ({ route, navigation }) => {
  const { user } = useContext(AuthContext);
  const preselectedCourseId = route.params?.courseId || '';

  const [courses,     setCourses]     = useState([]);
  const [courseId,    setCourseId]    = useState(preselectedCourseId);
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [dueDate,     setDueDate]     = useState('');
  const [totalMarks,  setTotalMarks]  = useState('100');
  const [loading,     setLoading]     = useState(false);
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

  // Build a default due date 14 days from now
  const getDefaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  };

  const handleCreate = async () => {
    if (!courseId)        { Alert.alert('Error', 'Please select a course'); return; }
    if (!title.trim())    { Alert.alert('Error', 'Assignment title is required'); return; }
    if (!description.trim()) { Alert.alert('Error', 'Description is required'); return; }

    const finalDueDate = dueDate.trim() || getDefaultDueDate();

    // Validate date format
    if (isNaN(Date.parse(finalDueDate))) {
      Alert.alert('Error', 'Invalid date format. Use YYYY-MM-DD');
      return;
    }

    try {
      setLoading(true);
      await api.post(ENDPOINTS.ASSIGNMENTS, {
        courseId,
        title:       title.trim(),
        description: description.trim(),
        dueDate:     new Date(finalDueDate).toISOString(),
        totalMarks:  parseFloat(totalMarks) || 100,
      });
      Alert.alert('✅ Assignment Created!', `"${title}" has been created.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>

        {/* Course selector */}
        <Text style={styles.label}>Select Course *</Text>
        {loadingCourses ? (
          <ActivityIndicator color={PRIMARY} style={{ marginVertical: 12 }} />
        ) : courses.length === 0 ? (
          <View style={styles.noCourseBox}>
            <Ionicons name="alert-circle-outline" size={20} color="#FFB347" />
            <Text style={styles.noCourseText}>No courses found. Create a course first.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courseScroll}>
            {courses.map(course => (
              <TouchableOpacity
                key={course._id}
                style={[styles.coursePill, courseId === course._id && styles.coursePillActive]}
                onPress={() => setCourseId(course._id)}
              >
                <Text style={[styles.coursePillText, courseId === course._id && styles.coursePillTextActive]} numberOfLines={1}>
                  {course.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={styles.label}>Assignment Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Build a Todo App"
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>Instructions *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what students need to do..."
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder={getDefaultDueDate()}
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Total Marks</Text>
            <TextInput
              style={styles.input}
              value={totalMarks}
              onChangeText={setTotalMarks}
              placeholder="100"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btn, (loading || !courseId) && styles.btnDisabled]}
          onPress={handleCreate}
          disabled={loading || !courseId}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.btnText}>Create Assignment</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  form:      { padding: 16 },
  label:     { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    fontSize: 15, color: '#1a1a2e', borderWidth: 1, borderColor: '#eee',
  },
  textArea:  { height: 120 },
  row:       { flexDirection: 'row', justifyContent: 'space-between' },
  halfField: { width: '48%' },
  courseScroll: { marginBottom: 4 },
  coursePill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff',
    marginRight: 8, maxWidth: 180,
  },
  coursePillActive:     { backgroundColor: PRIMARY, borderColor: PRIMARY },
  coursePillText:       { fontSize: 13, color: '#888' },
  coursePillTextActive: { color: '#fff', fontWeight: '600' },
  noCourseBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFB34715', borderRadius: 10, padding: 12, marginBottom: 4,
  },
  noCourseText: { fontSize: 13, color: '#888', marginLeft: 8, flex: 1 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 15, marginTop: 24,
  },
  btnDisabled: { opacity: 0.5 },
  btnText:     { fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 8 },
});

export default CreateAssignmentScreen;
