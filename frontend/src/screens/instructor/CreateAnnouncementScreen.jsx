import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import { AuthContext } from '../../context/AuthContext';

const PRIMARY = '#6C63FF';

const CreateAnnouncementScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [title,       setTitle]       = useState('');
  const [content,     setContent]     = useState('');
  const [targetRole,  setTargetRole]  = useState('all');
  const [courseId,    setCourseId]    = useState('');
  const [courses,     setCourses]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const isInstructor = user?.role === 'instructor';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isInstructor) {
      fetchInstructorCourses();
    }
  }, []);

  const fetchInstructorCourses = async () => {
    try {
      setLoadingCourses(true);
      const res = await api.get(`${ENDPOINTS.COURSES}/instructor/${user.id}`);
      const data = res.data.data || [];
      setCourses(data);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      Alert.alert('Error', 'Failed to load your courses');
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) { 
      Alert.alert('Error', 'Title and content are required'); 
      return; 
    }

    if (isInstructor && !courseId) {
      Alert.alert('Error', 'Please select a course for the announcement');
      return;
    }

    try {
      setLoading(true);
      const payload = { 
        title: title.trim(), 
        content: content.trim(), 
        targetRole 
      };

      // Add courseId for instructors or if admin selected a course
      if (courseId) {
        payload.courseId = courseId;
      }

      await api.post(ENDPOINTS.ANNOUNCEMENTS, payload);
      Alert.alert('Success', 'Announcement published!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create announcement');
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Title *</Text>
        <TextInput 
          style={styles.input} 
          value={title} 
          onChangeText={setTitle} 
          placeholder="Announcement title" 
          placeholderTextColor="#aaa" 
        />

        <Text style={styles.label}>Content *</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          value={content} 
          onChangeText={setContent} 
          placeholder="Write your announcement..." 
          placeholderTextColor="#aaa" 
          multiline 
          numberOfLines={6} 
          textAlignVertical="top" 
        />

        {isInstructor && (
          <>
            <Text style={styles.label}>Select Course *</Text>
            {loadingCourses ? (
              <Text style={styles.loadingText}>Loading courses...</Text>
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={courseId}
                  onValueChange={(value) => setCourseId(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select a course" value="" />
                  {courses.map(course => (
                    <Picker.Item 
                      key={course._id} 
                      label={course.title} 
                      value={course._id} 
                    />
                  ))}
                </Picker>
              </View>
            )}
          </>
        )}

        {isAdmin && (
          <>
            <Text style={styles.label}>Target Audience</Text>
            <View style={styles.priorityRow}>
              {[
                { value: 'all', label: 'Everyone' },
                { value: 'student', label: 'Students' },
                { value: 'instructor', label: 'Instructors' }
              ].map(option => (
                <TouchableOpacity 
                  key={option.value} 
                  style={[styles.priorityPill, targetRole === option.value && styles.priorityPillActive]} 
                  onPress={() => setTargetRole(option.value)}
                >
                  <Text style={[styles.priorityText, targetRole === option.value && styles.priorityTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity 
          style={[styles.btn, loading && { opacity: 0.6 }]} 
          onPress={handleCreate} 
          disabled={loading}
        >
          <Ionicons name="megaphone-outline" size={20} color="#fff" />
          <Text style={styles.btnText}>
            {loading ? 'Publishing...' : 'Publish Announcement'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F5F5F5' },
  form:         { padding: 16 },
  label:        { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
  input:        { backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 15, color: '#1a1a2e', borderWidth: 1, borderColor: '#eee' },
  textArea:     { height: 140 },
  pickerContainer: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#eee', marginBottom: 8 },
  picker:       { height: 50 },
  loadingText:  { fontSize: 14, color: '#888', fontStyle: 'italic', marginBottom: 8 },
  priorityRow:  { flexDirection: 'row', flexWrap: 'wrap' },
  priorityPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', marginRight: 8, marginBottom: 8 },
  priorityPillActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  priorityText: { fontSize: 13, color: '#888' },
  priorityTextActive: { color: '#fff', fontWeight: '600' },
  btn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 15, marginTop: 24 },
  btnText:      { fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 8 },
});

export default CreateAnnouncementScreen;
