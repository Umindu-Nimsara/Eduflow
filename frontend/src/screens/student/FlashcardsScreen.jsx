import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, Modal, TextInput, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';

const PRIMARY = '#6C63FF';
const SUCCESS = '#43C678';
const DANGER = '#EF4444';

const FlashcardsScreen = ({ route, navigation }) => {
  const { courseId, courseName } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    front: '',
    back: '',
    difficulty: 'medium'
  });

  const flipAnimation = new Animated.Value(0);

  useEffect(() => {
    fetchFlashcards();
  }, [courseId]);

  const fetchFlashcards = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await api.get(`/flashcards/course/${courseId}`);
      setFlashcards(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load flashcards');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.front.trim() || !formData.back.trim()) {
      Alert.alert('Error', 'Please fill both sides');
      return;
    }

    try {
      await api.post('/flashcards', {
        courseId,
        ...formData
      });

      Alert.alert('Success', 'Flashcard created!');
      setModalVisible(false);
      setFormData({ front: '', back: '', difficulty: 'medium' });
      fetchFlashcards();
    } catch (err) {
      Alert.alert('Error', 'Failed to create flashcard');
    }
  };

  const flipCard = () => {
    Animated.spring(flipAnimation, {
      toValue: isFlipped ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = async (isCorrect) => {
    if (flashcards.length === 0) return;

    try {
      await api.post(`/flashcards/${flashcards[currentIndex]._id}/answer`, {
        isCorrect
      });

      nextCard();
    } catch (err) {
      console.log('Error recording answer:', err);
      nextCard();
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    flipAnimation.setValue(0);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const previousCard = () => {
    setIsFlipped(false);
    flipAnimation.setValue(0);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  if (loading) return <LoadingSpinner text="Loading flashcards..." />;
  if (error) return <ErrorView message={error} onRetry={fetchFlashcards} />;

  const currentCard = flashcards[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{courseName}</Text>
        <Text style={styles.headerSubtitle}>Flashcards</Text>
      </View>

      {flashcards.length > 0 ? (
        <>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {currentIndex + 1} / {flashcards.length}
            </Text>
          </View>

          <View style={styles.cardContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={flipCard}
              style={styles.cardTouchable}
            >
              <Animated.View
                style={[
                  styles.card,
                  styles.cardFront,
                  { transform: [{ rotateY: frontInterpolate }] },
                  !isFlipped && styles.cardVisible
                ]}
              >
                <Text style={styles.cardLabel}>Question</Text>
                <Text style={styles.cardText}>{currentCard?.front}</Text>
                <View style={styles.tapHint}>
                  <Ionicons name="hand-left" size={20} color="#888" />
                  <Text style={styles.tapHintText}>Tap to flip</Text>
                </View>
              </Animated.View>

              <Animated.View
                style={[
                  styles.card,
                  styles.cardBack,
                  { transform: [{ rotateY: backInterpolate }] },
                  isFlipped && styles.cardVisible
                ]}
              >
                <Text style={styles.cardLabel}>Answer</Text>
                <Text style={styles.cardText}>{currentCard?.back}</Text>
              </Animated.View>
            </TouchableOpacity>
          </View>

          {isFlipped && (
            <View style={styles.answerButtons}>
              <TouchableOpacity
                style={[styles.answerButton, { backgroundColor: DANGER }]}
                onPress={() => handleAnswer(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
                <Text style={styles.answerButtonText}>Wrong</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.answerButton, { backgroundColor: SUCCESS }]}
                onPress={() => handleAnswer(true)}
              >
                <Ionicons name="checkmark" size={24} color="#fff" />
                <Text style={styles.answerButtonText}>Correct</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.navigation}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={previousCard}
            >
              <Ionicons name="chevron-back" size={24} color={PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={nextCard}
            >
              <Ionicons name="chevron-forward" size={24} color={PRIMARY} />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="albums-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No flashcards yet</Text>
          <Text style={styles.emptySubtext}>Create your first flashcard!</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Flashcard</Text>
            <TouchableOpacity onPress={handleCreate}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Front (Question) *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter question or term..."
              value={formData.front}
              onChangeText={(text) => setFormData(prev => ({ ...prev, front: text }))}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Back (Answer) *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter answer or definition..."
              value={formData.back}
              onChangeText={(text) => setFormData(prev => ({ ...prev, back: text }))}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Difficulty</Text>
            <View style={styles.difficultyContainer}>
              {['easy', 'medium', 'hard'].map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.difficultyButton,
                    formData.difficulty === level && styles.difficultyButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, difficulty: level }))}
                >
                  <Text style={[
                    styles.difficultyText,
                    formData.difficulty === level && styles.difficultyTextActive
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: PRIMARY, padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  
  progressContainer: { alignItems: 'center', paddingVertical: 16 },
  progressText: { fontSize: 16, fontWeight: '600', color: '#888' },
  
  cardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  cardTouchable: { width: '100%', height: 300 },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    backfaceVisibility: 'hidden',
  },
  cardFront: {},
  cardBack: {},
  cardVisible: { zIndex: 1 },
  cardLabel: { fontSize: 14, fontWeight: '600', color: PRIMARY, marginBottom: 20, textTransform: 'uppercase' },
  cardText: { fontSize: 20, fontWeight: '600', color: '#1a1a2e', textAlign: 'center', lineHeight: 28 },
  tapHint: { position: 'absolute', bottom: 20, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tapHintText: { fontSize: 13, color: '#888' },
  
  answerButtons: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  answerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  answerButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  
  navigation: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, paddingBottom: 20 },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  
  createButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#888', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#aaa', marginTop: 4 },
  
  modalContainer: { flex: 1, backgroundColor: '#F5F5F5' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  modalSaveText: { fontSize: 16, fontWeight: '600', color: PRIMARY },
  modalContent: { padding: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1a1a2e',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  
  difficultyContainer: { flexDirection: 'row', gap: 8 },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  difficultyButtonActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  difficultyText: { fontSize: 14, fontWeight: '600', color: '#888' },
  difficultyTextActive: { color: '#fff' },
});

export default FlashcardsScreen;
