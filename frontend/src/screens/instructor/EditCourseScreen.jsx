import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

const PRIMARY = '#6C63FF';
const CATEGORIES = ['Sinhala','Tamil','English','Mathematics','Science','History','Geography','Civic Education','Buddhism','Christianity','Hinduism','Islam','Health & Physical Education','ICT','Art','Music','Dancing','Drama'];

const EditCourseScreen = ({ route, navigation }) => {
  const { courseId, course } = route.params;
  const [title,       setTitle]       = useState(course?.title || '');
  const [description, setDescription] = useState(course?.description || '');
  const [category,    setCategory]    = useState(course?.category || '');
  const [price,       setPrice]       = useState(course?.price?.toString() || '0');
  const [deadline,    setDeadline]    = useState(course?.deadline ? new Date(course.deadline) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading,     setLoading]     = useState(false);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
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

  const handleUpdate = async () => {
    if (!title.trim() || !description.trim() || !category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    try {
      setLoading(true);
      await api.put(`${ENDPOINTS.COURSES}/${courseId}`, {
        title: title.trim(), description: description.trim(),
        category, price: parseFloat(price) || 0,
        deadline: deadline ? deadline.toISOString() : null,
      });
      Alert.alert('Success', 'Course updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Course Title *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Enter course title" placeholderTextColor="#aaa" />
        <Text style={styles.label}>Description *</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Describe your course..." placeholderTextColor="#aaa" multiline numberOfLines={5} textAlignVertical="top" />
        <Text style={styles.label}>Category *</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} style={[styles.catPill, category === cat && styles.catPillActive]} onPress={() => setCategory(cat)}>
              <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Price (LKR)</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="0.00" placeholderTextColor="#aaa" keyboardType="decimal-pad" />
        
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
        
        <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleUpdate} disabled={loading}>
          <Ionicons name="save-outline" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  form:      { padding: 16 },
  label:     { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
  input:     { backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 15, color: '#1a1a2e', borderWidth: 1, borderColor: '#eee' },
  textArea:  { height: 120 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  catPill:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', margin: 4 },
  catPillActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  catText:   { fontSize: 12, color: '#888' },
  catTextActive: { color: '#fff', fontWeight: '600' },
  datePickerBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#eee',
  },
  datePickerText: { flex: 1, fontSize: 15, color: '#1a1a2e', marginLeft: 10 },
  clearDateBtn: { marginLeft: 8 },
  saveBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#43C678', borderRadius: 12, paddingVertical: 15, marginTop: 24 },
  saveBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 8 },
});

export default EditCourseScreen;
