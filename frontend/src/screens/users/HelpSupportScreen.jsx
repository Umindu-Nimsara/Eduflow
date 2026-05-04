import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';

const HelpSupportScreen = ({ navigation }) => {
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  const faqData = [
    {
      id: 1,
      question: 'How do I enroll in a course?',
      answer: 'To enroll in a course, browse the course catalog, select a course you\'re interested in, and tap the "Enroll" button. Some courses may be free while others require payment.'
    },
    {
      id: 2,
      question: 'Can I download videos for offline viewing?',
      answer: 'Yes! You can download course videos for offline viewing. Look for the download icon next to each video lesson. Downloaded content will be available in your device storage.'
    },
    {
      id: 3,
      question: 'How do I track my learning progress?',
      answer: 'Your learning progress is automatically tracked as you complete lessons and quizzes. You can view your progress in the "My Learning" tab and detailed analytics in your profile.'
    },
    {
      id: 4,
      question: 'What happens if I fail a quiz?',
      answer: 'Don\'t worry! You can retake quizzes multiple times. Your highest score will be recorded. Review the course material and try again when you\'re ready.'
    },
    {
      id: 5,
      question: 'How do I get a certificate?',
      answer: 'Certificates are automatically generated when you complete 100% of a course, including all lessons, quizzes, and assignments. You can view and download your certificates from your profile.'
    },
    {
      id: 6,
      question: 'Can I access courses on multiple devices?',
      answer: 'Yes! Your account syncs across all devices. You can start learning on your phone and continue on your tablet or computer using the same login credentials.'
    },
    {
      id: 7,
      question: 'How do I reset my password?',
      answer: 'On the login screen, tap "Forgot Password" and enter your email address. You\'ll receive a password reset link via email. Follow the instructions to create a new password.'
    },
    {
      id: 8,
      question: 'Are there any system requirements?',
      answer: 'The app works on most modern devices. For the best experience, ensure you have a stable internet connection and the latest version of the app installed.'
    }
  ];

  const contactOptions = [
    {
      id: 1,
      title: 'Email Support',
      description: 'Get help via email',
      icon: 'mail-outline',
      action: () => Linking.openURL('mailto:support@elearning.com?subject=Help Request'),
    },
    {
      id: 2,
      title: 'Phone Support',
      description: '+94 11 234 5678',
      icon: 'call-outline',
      action: () => Linking.openURL('tel:+94112345678'),
    },
    {
      id: 3,
      title: 'Live Chat',
      description: 'Chat with our support team',
      icon: 'chatbubble-outline',
      action: () => Alert.alert('Coming Soon', 'Live chat will be available soon!'),
    },
    {
      id: 4,
      title: 'WhatsApp',
      description: 'Message us on WhatsApp',
      icon: 'logo-whatsapp',
      action: () => Linking.openURL('https://wa.me/94112345678'),
    }
  ];

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const submitFeedback = () => {
    if (feedbackText.trim()) {
      Alert.alert(
        'Feedback Submitted',
        'Thank you for your feedback! We\'ll review it and get back to you soon.',
        [{ text: 'OK', onPress: () => setFeedbackText('') }]
      );
    } else {
      Alert.alert('Error', 'Please enter your feedback before submitting.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionItem}
            onPress={() => Alert.alert('Coming Soon', 'User guide will be available soon!')}
          >
            <Ionicons name="book-outline" size={32} color={colors.primary} />
            <Text style={styles.quickActionText}>User Guide</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionItem}
            onPress={() => Alert.alert('Coming Soon', 'Video tutorials will be available soon!')}
          >
            <Ionicons name="play-circle-outline" size={32} color={colors.primary} />
            <Text style={styles.quickActionText}>Video Tutorials</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionItem}
            onPress={() => Linking.openURL('https://elearning.com/troubleshooting')}
          >
            <Ionicons name="build-outline" size={32} color={colors.primary} />
            <Text style={styles.quickActionText}>Troubleshooting</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* FAQ Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqData.map((faq) => (
          <View key={faq.id} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.faqQuestion}
              onPress={() => toggleFAQ(faq.id)}
            >
              <Text style={styles.faqQuestionText}>{faq.question}</Text>
              <Ionicons
                name={expandedFAQ === faq.id ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
            {expandedFAQ === faq.id && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>{faq.answer}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Contact Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Support</Text>
        {contactOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.contactItem}
            onPress={option.action}
          >
            <Ionicons name={option.icon} size={24} color={colors.primary} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{option.title}</Text>
              <Text style={styles.contactDescription}>{option.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Feedback Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Send Feedback</Text>
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackLabel}>
            Help us improve! Share your thoughts, suggestions, or report issues.
          </Text>
          <TextInput
            style={styles.feedbackInput}
            placeholder="Type your feedback here..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            value={feedbackText}
            onChangeText={setFeedbackText}
            textAlignVertical="top"
          />
          <TouchableOpacity style={styles.submitButton} onPress={submitFeedback}>
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <View style={styles.appInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version:</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Updated:</Text>
            <Text style={styles.infoValue}>April 30, 2026</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Support Hours:</Text>
            <Text style={styles.infoValue}>Mon-Fri, 9 AM - 6 PM</Text>
          </View>
        </View>
      </View>

      {/* Emergency Contact */}
      <View style={styles.emergencySection}>
        <Ionicons name="warning-outline" size={24} color={colors.warning} />
        <View style={styles.emergencyText}>
          <Text style={styles.emergencyTitle}>Need Immediate Help?</Text>
          <Text style={styles.emergencyDescription}>
            For urgent technical issues, call our 24/7 helpline: +94 11 999 8888
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  section: {
    backgroundColor: colors.white,
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  quickActionItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionText: {
    fontSize: 12,
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 16,
  },
  faqAnswer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.background,
  },
  faqAnswerText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 16,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  contactDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  feedbackContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  feedbackLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
    minHeight: 100,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  appInfo: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  emergencySection: {
    backgroundColor: colors.warning + '10',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  emergencyText: {
    flex: 1,
    marginLeft: 12,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.warning,
  },
  emergencyDescription: {
    fontSize: 14,
    color: colors.text,
    marginTop: 4,
  },
});

export default HelpSupportScreen;