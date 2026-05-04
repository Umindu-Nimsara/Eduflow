import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';

const QuizResultScreen = ({ navigation, route }) => {
  const { attemptData } = route.params;

  // Safety checks
  if (!attemptData || !attemptData.quiz) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.danger} />
          <Text style={styles.errorText}>Quiz result data not available</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Courses')}
          >
            <Text style={styles.primaryButtonText}>Back to Courses</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const passed = attemptData.score >= (attemptData.quiz.passingScore || 0);
  const correctAnswers = attemptData.answers ? attemptData.answers.filter(a => a.isCorrect).length : 0;
  const totalQuestions = attemptData.answers ? attemptData.answers.length : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, passed ? styles.iconSuccess : styles.iconFail]}>
          <Ionicons
            name={passed ? 'checkmark-circle' : 'close-circle'}
            size={80}
            color={passed ? colors.success : colors.danger}
          />
        </View>
        <Text style={styles.resultTitle}>
          {passed ? 'Congratulations!' : 'Keep Trying!'}
        </Text>
        <Text style={styles.resultSubtitle}>
          {passed ? 'You passed the quiz' : 'You did not pass this time'}
        </Text>
      </View>

      <View style={styles.scoreCard}>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreText}>{attemptData.score}%</Text>
          <Text style={styles.scoreLabel}>Your Score</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
          <Text style={styles.statValue}>{correctAnswers}</Text>
          <Text style={styles.statLabel}>Correct</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="close-circle-outline" size={24} color={colors.danger} />
          <Text style={styles.statValue}>{totalQuestions - correctAnswers}</Text>
          <Text style={styles.statLabel}>Incorrect</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="trophy-outline" size={24} color={colors.primary} />
          <Text style={styles.statValue}>{attemptData.quiz.passingScore}%</Text>
          <Text style={styles.statLabel}>Passing</Text>
        </View>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>Quiz Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Quiz Title:</Text>
          <Text style={styles.detailValue}>{attemptData.quiz.title}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Questions:</Text>
          <Text style={styles.detailValue}>{totalQuestions}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time Taken:</Text>
          <Text style={styles.detailValue}>
            {Math.floor(attemptData.timeTaken / 60)}m {attemptData.timeTaken % 60}s
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Completed:</Text>
          <Text style={styles.detailValue}>
            {new Date(attemptData.completedAt).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.answersSection}>
        <Text style={styles.answersTitle}>Answer Review</Text>
        {attemptData.answers.map((answer, index) => (
          <View key={index} style={styles.answerCard}>
            <View style={styles.answerHeader}>
              <Text style={styles.answerNumber}>Question {index + 1}</Text>
              <Ionicons
                name={answer.isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={24}
                color={answer.isCorrect ? colors.success : colors.danger}
              />
            </View>
            <Text style={styles.answerQuestion}>{answer.question.questionText}</Text>
            <View style={styles.answerOptions}>
              <View style={styles.answerOption}>
                <Text style={styles.answerOptionLabel}>Your Answer:</Text>
                <Text style={[
                  styles.answerOptionText,
                  !answer.isCorrect && styles.answerWrong
                ]}>
                  {answer.question.options[answer.selectedOption]}
                </Text>
              </View>
              {!answer.isCorrect && (
                <View style={styles.answerOption}>
                  <Text style={styles.answerOptionLabel}>Correct Answer:</Text>
                  <Text style={[styles.answerOptionText, styles.answerCorrect]}>
                    {answer.question.options[answer.question.correctOption]}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Courses')}
        >
          <Text style={styles.primaryButtonText}>Back to Courses</Text>
        </TouchableOpacity>
        {!passed && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.replace('Quiz', { quizId: attemptData.quiz._id })}
          >
            <Text style={styles.secondaryButtonText}>Retry Quiz</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: colors.text,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  header: {
    backgroundColor: colors.white,
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconContainer: {
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  scoreCard: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scoreCircle: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
  },
  scoreLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  detailsCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  answersSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  answersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  answerCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  answerNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  answerQuestion: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  answerOptions: {
    gap: 8,
  },
  answerOption: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  answerOptionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  answerOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  answerWrong: {
    color: colors.danger,
  },
  answerCorrect: {
    color: colors.success,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
});

export default QuizResultScreen;
