import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#6C63FF';

const TEMPLATES = [
  {
    id: 'essay',
    title: 'Essay Assignment',
    icon: 'document-text',
    color: '#3B82F6',
    description: 'Long-form written assignment',
    defaultTitle: 'Essay: [Topic]',
    defaultDescription: 'Write a comprehensive essay on the given topic. Your essay should be well-structured with an introduction, body paragraphs, and conclusion.\n\nRequirements:\n- Minimum 500 words\n- Include citations\n- Original work only',
    totalMarks: 100,
    duration: 7, // days
  },
  {
    id: 'project',
    title: 'Project Assignment',
    icon: 'folder',
    color: '#43C678',
    description: 'Practical project work',
    defaultTitle: 'Project: [Project Name]',
    defaultDescription: 'Complete the project as per the specifications provided.\n\nDeliverables:\n- Project files\n- Documentation\n- Presentation (if required)\n\nEvaluation Criteria:\n- Functionality\n- Code quality\n- Documentation',
    totalMarks: 100,
    duration: 14,
  },
  {
    id: 'research',
    title: 'Research Paper',
    icon: 'search',
    color: '#FFB347',
    description: 'Academic research assignment',
    defaultTitle: 'Research Paper: [Topic]',
    defaultDescription: 'Conduct research and write a paper on the assigned topic.\n\nRequirements:\n- Abstract\n- Literature review\n- Methodology\n- Results and discussion\n- References (APA format)\n\nLength: 2000-3000 words',
    totalMarks: 100,
    duration: 21,
  },
  {
    id: 'presentation',
    title: 'Presentation',
    icon: 'easel',
    color: '#FF6584',
    description: 'Oral presentation assignment',
    defaultTitle: 'Presentation: [Topic]',
    defaultDescription: 'Prepare and deliver a presentation on the given topic.\n\nRequirements:\n- Slides (10-15 slides)\n- Duration: 10-15 minutes\n- Q&A session\n\nSubmit:\n- Presentation slides (PDF/PPT)\n- Speaker notes',
    totalMarks: 50,
    duration: 7,
  },
  {
    id: 'lab',
    title: 'Lab Report',
    icon: 'flask',
    color: '#26D0CE',
    description: 'Laboratory work report',
    defaultTitle: 'Lab Report: [Experiment Name]',
    defaultDescription: 'Complete the lab experiment and submit a detailed report.\n\nReport Structure:\n- Objective\n- Materials and methods\n- Observations\n- Results\n- Discussion\n- Conclusion',
    totalMarks: 50,
    duration: 3,
  },
  {
    id: 'case-study',
    title: 'Case Study',
    icon: 'briefcase',
    color: '#8B5CF6',
    description: 'Analyze a real-world case',
    defaultTitle: 'Case Study: [Case Name]',
    defaultDescription: 'Analyze the provided case study and answer the questions.\n\nYour analysis should include:\n- Problem identification\n- Analysis of key issues\n- Proposed solutions\n- Recommendations\n\nLength: 1000-1500 words',
    totalMarks: 75,
    duration: 7,
  },
  {
    id: 'coding',
    title: 'Coding Assignment',
    icon: 'code-slash',
    color: '#F59E0B',
    description: 'Programming task',
    defaultTitle: 'Coding: [Task Name]',
    defaultDescription: 'Complete the coding assignment as per specifications.\n\nRequirements:\n- Working code\n- Comments and documentation\n- Test cases\n- README file\n\nSubmit as ZIP file or GitHub link',
    totalMarks: 100,
    duration: 7,
  },
  {
    id: 'quiz-homework',
    title: 'Practice Problems',
    icon: 'calculator',
    color: '#EF4444',
    description: 'Problem-solving exercises',
    defaultTitle: 'Practice Problems: [Topic]',
    defaultDescription: 'Solve the following problems and submit your solutions.\n\nInstructions:\n- Show all work\n- Explain your reasoning\n- Submit as PDF\n\nProblems:\n1. [Problem 1]\n2. [Problem 2]\n3. [Problem 3]',
    totalMarks: 30,
    duration: 3,
  },
];

const AssignmentTemplatesScreen = ({ route, navigation }) => {
  const { courseId } = route.params || {};

  const handleSelectTemplate = (template) => {
    Alert.alert(
      template.title,
      'Use this template for your assignment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use Template',
          onPress: () => {
            navigation.navigate('CreateAssignment', {
              courseId,
              template: {
                title: template.defaultTitle,
                description: template.defaultDescription,
                totalMarks: template.totalMarks,
                dueDate: new Date(Date.now() + template.duration * 24 * 60 * 60 * 1000),
              },
            });
          },
        },
      ]
    );
  };

  const renderTemplate = (template) => (
    <TouchableOpacity
      key={template.id}
      style={styles.card}
      onPress={() => handleSelectTemplate(template)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: template.color + '20' }]}>
        <Ionicons name={template.icon} size={32} color={template.color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{template.title}</Text>
        <Text style={styles.cardDescription}>{template.description}</Text>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="star-outline" size={14} color="#888" />
            <Text style={styles.metaText}>{template.totalMarks} marks</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#888" />
            <Text style={styles.metaText}>{template.duration} days</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Assignment Templates</Text>
          <Text style={styles.headerSub}>Choose a template to get started quickly</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Quick Start */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Start Templates</Text>
          {TEMPLATES.slice(0, 4).map(renderTemplate)}
        </View>

        {/* More Templates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More Templates</Text>
          {TEMPLATES.slice(4).map(renderTemplate)}
        </View>

        {/* Custom */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.customCard}
            onPress={() => navigation.navigate('CreateAssignment', { courseId })}
          >
            <View style={[styles.iconContainer, { backgroundColor: PRIMARY + '20' }]}>
              <Ionicons name="create-outline" size={32} color={PRIMARY} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Start from Scratch</Text>
              <Text style={styles.cardDescription}>Create a custom assignment without a template</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={PRIMARY} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  headerSub: { fontSize: 13, color: '#888', marginTop: 4 },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  customCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY + '10',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: PRIMARY,
    borderStyle: 'dashed',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  cardDescription: { fontSize: 12, color: '#888', marginBottom: 8 },
  cardMeta: { flexDirection: 'row' },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  metaText: { fontSize: 11, color: '#888', marginLeft: 4 },
});

export default AssignmentTemplatesScreen;
