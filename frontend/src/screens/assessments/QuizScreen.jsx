import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { assessmentService } from '../../services/assessmentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import colors from '../../constants/colors';

const QuizScreen = ({ navigation, route }) => {
  const { quizId } = route.params;
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (!quizStarted || !quiz || !quiz.questions || quiz.questions.length === 0) {
      return; // Don't start timer until quiz is loaded
    }

    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      // Time's up - auto submit
      handleSubmit();
    }
  }, [timeLeft, quiz, quizStarted]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await assessmentService.getQuizById(quizId);
      console.log('Quiz response:', response);
      
      // Response structure: { success: true, data: quiz }
      const quizData = response.data || response;
      console.log('Quiz data:', quizData);
      
      if (!quizData || !quizData.questions) {
        throw new Error('Invalid quiz data structure');
      }
      
      setQuiz(quizData);
      const duration = (quizData.timeLimit || quizData.duration || 30) * 60;
      setTimeLeft(duration);
      setQuizStarted(true); // Mark quiz as started
      setError(null);
    } catch (err) {
      console.error('Quiz fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId, optionIndex) => {
    setAnswers({
      ...answers,
      [questionId]: optionIndex,
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      Alert.alert('Error', 'Quiz data not available');
      return;
    }

    const answeredCount = Object.keys(answers).length;
    if (answeredCount < quiz.questions.length) {
      Alert.alert(
        'Incomplete Quiz',
        `You have answered ${answeredCount} out of ${quiz.questions.length} questions. Submit anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', onPress: submitQuiz },
        ]
      );
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    try {
      setSubmitting(true);
      const formattedAnswers = quiz.questions.map((q) => ({
        questionId:    q._id,
        selectedOption: answers[q._id] !== undefined ? answers[q._id] : -1,
      }));

      const timeTaken = (quiz.timeLimit * 60) - timeLeft;
      const response = await assessmentService.submitQuizAttempt(quizId, formattedAnswers, timeTaken);
      navigation.replace('QuizResult', { attemptData: response.data });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit quiz');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchQuiz} />;
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return <ErrorView message="Quiz data not available" onRetry={fetchQuiz} />;
  }

  const question = quiz.questions[currentQuestion];
  
  if (!question) {
    return <ErrorView message="Question not found" onRetry={fetchQuiz} />;
  }
  
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.questionCount}>
            Question {currentQuestion + 1} of {quiz.questions.length}
          </Text>
          <View style={[styles.timer, timeLeft < 60 && styles.timerWarning]}>
            <Ionicons name="time-outline" size={16} color={timeLeft < 60 ? colors.danger : colors.primary} />
            <Text style={[styles.timerText, timeLeft < 60 && styles.timerTextWarning]}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.questionText}>{question.questionText}</Text>

        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                answers[question._id] === index && styles.optionSelected,
              ]}
              onPress={() => handleSelectAnswer(question._id, index)}
            >
              <View style={[
                styles.optionRadio,
                answers[question._id] === index && styles.optionRadioSelected,
              ]}>
                {answers[question._id] === index && (
                  <View style={styles.optionRadioInner} />
                )}
              </View>
              <Text style={[
                styles.optionText,
                answers[question._id] === index && styles.optionTextSelected,
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, currentQuestion === 0 && styles.navButtonDisabled]}
          onPress={() => setCurrentQuestion(currentQuestion - 1)}
          disabled={currentQuestion === 0}
        >
          <Ionicons name="chevron-back" size={24} color={currentQuestion === 0 ? colors.textLight : colors.primary} />
          <Text style={[styles.navButtonText, currentQuestion === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        {currentQuestion === quiz.questions.length - 1 ? (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setCurrentQuestion(currentQuestion + 1)}
          >
            <Text style={styles.navButtonText}>Next</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.white,
    paddingBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.gray[100],
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  questionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timerWarning: {
    backgroundColor: colors.danger + '20',
  },
  timerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 4,
  },
  timerTextWarning: {
    color: colors.danger,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 24,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioSelected: {
    borderColor: colors.primary,
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  navButtonTextDisabled: {
    color: colors.textLight,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
});

export default QuizScreen;
