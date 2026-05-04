import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';

const PRIMARY = '#6C63FF';
const SUCCESS = '#43C678';
const WARNING = '#FFB347';
const DANGER = '#EF4444';

const StudentPerformanceReportScreen = ({ route, navigation }) => {
  const { courseId, courseName, studentId, studentName } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, [courseId, studentId]);

  const fetchReportData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Fetch all data in parallel
      const [progressRes, quizzesRes, assignmentsRes, attendanceRes] = await Promise.all([
        api.get(`${ENDPOINTS.PROGRESS}?courseId=${courseId}&userId=${studentId}`),
        api.get(`${ENDPOINTS.QUIZZES}?courseId=${courseId}`),
        api.get(`${ENDPOINTS.ASSIGNMENTS}?courseId=${courseId}`),
        api.get(`/attendance/student/${studentId}/course/${courseId}`)
      ]);

      // Calculate statistics
      const progress = progressRes.data.data?.[0] || {};
      const quizzes = quizzesRes.data.data || [];
      const assignments = assignmentsRes.data.data || [];
      const attendance = attendanceRes.data.data || [];

      // Get quiz attempts
      const quizAttempts = [];
      for (const quiz of quizzes) {
        try {
          const attemptsRes = await api.get(`/quizzes/${quiz._id}/attempts?userId=${studentId}`);
          if (attemptsRes.data.data && attemptsRes.data.data.length > 0) {
            quizAttempts.push(...attemptsRes.data.data);
          }
        } catch (err) {
          console.log('Error fetching quiz attempts:', err);
        }
      }

      // Get assignment submissions
      const submissions = [];
      for (const assignment of assignments) {
        try {
          const submissionsRes = await api.get(`${ENDPOINTS.SUBMISSIONS}?assignmentId=${assignment._id}&userId=${studentId}`);
          if (submissionsRes.data.data && submissionsRes.data.data.length > 0) {
            submissions.push(...submissionsRes.data.data);
          }
        } catch (err) {
          console.log('Error fetching submissions:', err);
        }
      }

      // Calculate quiz average
      const quizScores = quizAttempts.map(a => (a.score / a.totalMarks) * 100);
      const quizAverage = quizScores.length > 0
        ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length
        : 0;

      // Calculate assignment average
      const assignmentScores = submissions
        .filter(s => s.grade !== undefined && s.grade !== null)
        .map(s => (s.grade / s.totalMarks) * 100);
      const assignmentAverage = assignmentScores.length > 0
        ? assignmentScores.reduce((a, b) => a + b, 0) / assignmentScores.length
        : 0;

      // Calculate attendance rate
      const attendanceRecords = attendance.map(a => a.record).filter(r => r);
      const presentCount = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
      const attendanceRate = attendanceRecords.length > 0
        ? (presentCount / attendanceRecords.length) * 100
        : 0;

      // Overall grade (weighted average)
      const overallGrade = (
        (progress.completionPercentage || 0) * 0.2 +
        quizAverage * 0.3 +
        assignmentAverage * 0.4 +
        attendanceRate * 0.1
      );

      setReportData({
        progress,
        quizzes: quizAttempts,
        assignments: submissions,
        attendance: attendanceRecords,
        statistics: {
          completionRate: progress.completionPercentage || 0,
          quizAverage,
          assignmentAverage,
          attendanceRate,
          overallGrade,
          totalQuizzes: quizAttempts.length,
          totalAssignments: submissions.length,
          totalAttendance: attendanceRecords.length
        }
      });

      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade >= 80) return SUCCESS;
    if (grade >= 60) return WARNING;
    return DANGER;
  };

  const getGradeLetter = (grade) => {
    if (grade >= 90) return 'A';
    if (grade >= 80) return 'B';
    if (grade >= 70) return 'C';
    if (grade >= 60) return 'D';
    return 'F';
  };

  const handleShareReport = async () => {
    if (!reportData) return;

    const { statistics } = reportData;
    const reportText = `
Student Performance Report
Course: ${courseName}
Student: ${studentName}

Overall Grade: ${statistics.overallGrade.toFixed(1)}% (${getGradeLetter(statistics.overallGrade)})

Breakdown:
- Course Completion: ${statistics.completionRate.toFixed(1)}%
- Quiz Average: ${statistics.quizAverage.toFixed(1)}%
- Assignment Average: ${statistics.assignmentAverage.toFixed(1)}%
- Attendance Rate: ${statistics.attendanceRate.toFixed(1)}%

Total Quizzes: ${statistics.totalQuizzes}
Total Assignments: ${statistics.totalAssignments}
Total Classes: ${statistics.totalAttendance}
    `.trim();

    try {
      await Share.share({
        message: reportText,
        title: 'Student Performance Report'
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to share report');
    }
  };

  if (loading) return <LoadingSpinner text="Generating report..." />;
  if (error) return <ErrorView message={error} onRetry={fetchReportData} />;
  if (!reportData) return <ErrorView message="No data available" />;

  const { statistics } = reportData;
  const overallColor = getGradeColor(statistics.overallGrade);
  const overallLetter = getGradeLetter(statistics.overallGrade);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchReportData(true)}
          colors={[PRIMARY]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{studentName}</Text>
        <Text style={styles.headerSubtitle}>{courseName}</Text>
      </View>

      {/* Overall Grade Card */}
      <View style={[styles.overallCard, { borderColor: overallColor }]}>
        <View style={styles.overallGradeContainer}>
          <Text style={[styles.overallGrade, { color: overallColor }]}>
            {statistics.overallGrade.toFixed(1)}%
          </Text>
          <View style={[styles.gradeBadge, { backgroundColor: overallColor }]}>
            <Text style={styles.gradeLetter}>{overallLetter}</Text>
          </View>
        </View>
        <Text style={styles.overallLabel}>Overall Performance</Text>
      </View>

      {/* Statistics Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={32} color={SUCCESS} />
          <Text style={styles.statValue}>{statistics.completionRate.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Completion</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="document-text" size={32} color={PRIMARY} />
          <Text style={styles.statValue}>{statistics.quizAverage.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Quiz Avg</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="clipboard" size={32} color={WARNING} />
          <Text style={styles.statValue}>{statistics.assignmentAverage.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Assignment Avg</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={32} color="#EC4899" />
          <Text style={styles.statValue}>{statistics.attendanceRate.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Attendance</Text>
        </View>
      </View>

      {/* Detailed Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detailed Breakdown</Text>

        {/* Quizzes */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownHeader}>
            <Ionicons name="document-text" size={20} color={PRIMARY} />
            <Text style={styles.breakdownTitle}>Quizzes ({statistics.totalQuizzes})</Text>
          </View>
          <View style={styles.breakdownContent}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Average Score:</Text>
              <Text style={[styles.breakdownValue, { color: getGradeColor(statistics.quizAverage) }]}>
                {statistics.quizAverage.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Completed:</Text>
              <Text style={styles.breakdownValue}>{statistics.totalQuizzes}</Text>
            </View>
          </View>
        </View>

        {/* Assignments */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownHeader}>
            <Ionicons name="clipboard" size={20} color={WARNING} />
            <Text style={styles.breakdownTitle}>Assignments ({statistics.totalAssignments})</Text>
          </View>
          <View style={styles.breakdownContent}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Average Score:</Text>
              <Text style={[styles.breakdownValue, { color: getGradeColor(statistics.assignmentAverage) }]}>
                {statistics.assignmentAverage.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Submitted:</Text>
              <Text style={styles.breakdownValue}>{statistics.totalAssignments}</Text>
            </View>
          </View>
        </View>

        {/* Attendance */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownHeader}>
            <Ionicons name="calendar" size={20} color="#EC4899" />
            <Text style={styles.breakdownTitle}>Attendance ({statistics.totalAttendance})</Text>
          </View>
          <View style={styles.breakdownContent}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Attendance Rate:</Text>
              <Text style={[styles.breakdownValue, { color: getGradeColor(statistics.attendanceRate) }]}>
                {statistics.attendanceRate.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Total Sessions:</Text>
              <Text style={styles.breakdownValue}>{statistics.totalAttendance}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: PRIMARY }]}
          onPress={handleShareReport}
        >
          <Ionicons name="share-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Share Report</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: SUCCESS }]}
          onPress={() => Alert.alert('Export', 'Export feature coming soon')}
        >
          <Ionicons name="download-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Export PDF</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: PRIMARY, padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  
  overallCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 3,
    borderWidth: 3,
  },
  overallGradeContainer: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  overallGrade: { fontSize: 48, fontWeight: 'bold' },
  gradeBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeLetter: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  overallLabel: { fontSize: 16, color: '#888', marginTop: 12 },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12 },
  
  breakdownCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  breakdownHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  breakdownTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  breakdownContent: { gap: 8 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLabel: { fontSize: 14, color: '#666' },
  breakdownValue: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  
  actionsContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    elevation: 2,
    gap: 8,
  },
  actionButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

export default StudentPerformanceReportScreen;
