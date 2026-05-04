import React, { useContext, useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import colors from '../constants/colors';

// Import onboarding screen
import LandingScreen from '../screens/onboarding/LandingScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

// Import assessment screens
import QuizListScreen from '../screens/assessments/QuizListScreen';
import QuizScreen from '../screens/assessments/QuizScreen';
import QuizResultScreen from '../screens/assessments/QuizResultScreen';
import AssignmentListScreen from '../screens/assessments/AssignmentListScreen';
import AssignmentDetailScreen from '../screens/assessments/AssignmentDetailScreen';
import SubmitAssignmentScreen from '../screens/assessments/SubmitAssignmentScreen';

// Import analytics screens
import ProgressScreen from '../screens/analytics/ProgressScreen';
import CertificateScreen from '../screens/analytics/CertificateScreen';
import AnalyticsDashboardScreen from '../screens/analytics/AnalyticsDashboardScreen';
import CompletedCoursesScreen from '../screens/analytics/CompletedCoursesScreen';

// Import discussion screens
import DiscussionBoardScreen from '../screens/discussion/DiscussionBoardScreen';
import DiscussionDetailScreen from '../screens/discussion/DiscussionDetailScreen';
import AddDiscussionScreen from '../screens/discussion/AddDiscussionScreen';
import EditDiscussionScreen from '../screens/discussion/EditDiscussionScreen';
import FeedbackScreen from '../screens/discussion/FeedbackScreen';
import ReportScreen from '../screens/discussion/ReportScreen';

// Import notification screens
import NotificationScreen from '../screens/notifications/NotificationScreen';
import AnnouncementScreen from '../screens/notifications/AnnouncementScreen';
import StreakScreen from '../screens/notifications/StreakScreen';
import BadgeScreen from '../screens/notifications/BadgeScreen';

// Import gamification screens
import GamificationDashboardScreen from '../screens/gamification/GamificationDashboardScreen';
import GamificationLeaderboardScreen from '../screens/gamification/LeaderboardScreen';
import GamificationBadgesScreen from '../screens/gamification/BadgesScreen';

// Import other screens
import CourseDetailScreen from '../screens/courses/CourseDetailScreen';
import LessonScreen from '../screens/courses/LessonScreen';
import EditProfileScreen from '../screens/users/EditProfileScreen';
import InstructorListScreen from '../screens/users/InstructorListScreen';
import SettingsScreen from '../screens/users/SettingsScreen';
import HelpSupportScreen from '../screens/users/HelpSupportScreen';
import ModuleDashboardScreen from '../screens/dashboard/ModuleDashboardScreen';

// Import instructor screens
import InstructorCourseDetailScreen from '../screens/instructor/InstructorCourseDetailScreen';
import InstructorSubmissionsScreen from '../screens/instructor/InstructorSubmissionsScreen';
import ManageLessonsScreen from '../screens/instructor/ManageLessonsScreen';
import AddLessonScreen from '../screens/instructor/AddLessonScreen';
import EditLessonScreen from '../screens/instructor/EditLessonScreen';
import GradeSubmissionsScreen from '../screens/instructor/GradeSubmissionsScreen';
import CreateCourseScreen from '../screens/instructor/CreateCourseScreen';
import EditCourseScreen from '../screens/instructor/EditCourseScreen';
import CreateLessonScreen from '../screens/instructor/CreateLessonScreen';
import CreateQuizScreen from '../screens/instructor/CreateQuizScreen';
import AddQuizScreen from '../screens/instructor/AddQuizScreen';
import CreateAssignmentScreen from '../screens/instructor/CreateAssignmentScreen';
import AddAssignmentScreen from '../screens/instructor/AddAssignmentScreen';
import CreateAnnouncementScreen from '../screens/instructor/CreateAnnouncementScreen';
import ManageQuizzesScreen from '../screens/instructor/ManageQuizzesScreen';
import ChangePasswordScreen from '../screens/instructor/ChangePasswordScreen';
import CourseStudentsScreen from '../screens/instructor/CourseStudentsScreen';
import AssignmentTemplatesScreen from '../screens/instructor/AssignmentTemplatesScreen';
import NotificationPreferencesScreen from '../screens/instructor/NotificationPreferencesScreen';
import InactiveStudentsScreen from '../screens/instructor/InactiveStudentsScreen';
import BatchEnrollmentScreen from '../screens/instructor/BatchEnrollmentScreen';
import MessagesListScreen from '../screens/instructor/MessagesListScreen';
import DirectMessageScreen from '../screens/instructor/DirectMessageScreen';
import StudentListForMessageScreen from '../screens/instructor/StudentListForMessageScreen';
import CertificateManagementScreen from '../screens/instructor/CertificateManagementScreen';
import DiscussionModerationScreen from '../screens/instructor/DiscussionModerationScreen';
import InstructorProfileScreen from '../screens/instructor/InstructorProfileScreen';
import LiveClassSchedulerScreen from '../screens/instructor/LiveClassSchedulerScreen';
import StudentPerformanceReportScreen from '../screens/instructor/StudentPerformanceReportScreen';
import PeerReviewManagementScreen from '../screens/instructor/PeerReviewManagementScreen';
import ExportCourseDataScreen from '../screens/instructor/ExportCourseDataScreen';
import AssessmentManagementScreen from '../screens/instructor/AssessmentManagementScreen';
import StudyGroupsScreen from '../screens/student/StudyGroupsScreen';
import StudentLiveClassesScreen from '../screens/student/StudentLiveClassesScreen';
import ForumScreen from '../screens/student/ForumScreen';
import LeaderboardScreen from '../screens/student/LeaderboardScreen';
import FlashcardsScreen from '../screens/student/FlashcardsScreen';
import WellnessTrackerScreen from '../screens/student/WellnessTrackerScreen';
import GoalSettingScreen from '../screens/student/GoalSettingScreen';

// Import settings screens
import DataExportScreen from '../screens/settings/DataExportScreen';

// Import admin screens
import AuditLogsScreen from '../screens/admin/AuditLogsScreen';
import AdminUserDetailScreen from '../screens/admin/AdminUserDetailScreen';
import AdminInstructorsScreen from '../screens/admin/AdminInstructorsScreen';
import AdminReportsScreen from '../screens/admin/AdminReportsScreen';
import AdminAnnouncementsScreen from '../screens/admin/AdminAnnouncementsScreen';
import AdminNotificationsScreen from '../screens/admin/AdminNotificationsScreen';
import AdminLogsScreen from '../screens/admin/AdminLogsScreen';
import AdminDiscussionsScreen from '../screens/admin/AdminDiscussionsScreen';
import AdminFeedbackScreen from '../screens/admin/AdminFeedbackScreen';
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const [showOnboarding, setShowOnboarding] = useState(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const completed = await AsyncStorage.getItem('onboardingCompleted');
      setShowOnboarding(completed !== 'true');
    } catch (error) {
      console.error('Error checking onboarding:', error);
      setShowOnboarding(false);
    }
  };

  if (loading || showOnboarding === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {showOnboarding && !isAuthenticated ? (
          <>
            <Stack.Screen 
              name="Landing" 
              component={LandingScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Onboarding" 
              component={OnboardingScreen} 
              options={{ headerShown: false }}
            />
          </>
        ) : null}
        {isAuthenticated ? (
          <>
            <Stack.Screen 
              name="Main" 
              component={TabNavigator} 
              options={{ headerShown: false }}
            />
            {/* Dashboard Screens */}
            <Stack.Screen 
              name="ModuleDashboard" 
              component={ModuleDashboardScreen}
              options={{ headerShown: false }}
            />
            {/* Course Screens */}
            <Stack.Screen 
              name="CourseDetail" 
              component={CourseDetailScreen}
              options={{ title: 'Course Details' }}
            />
            <Stack.Screen 
              name="Lesson" 
              component={LessonScreen}
              options={{ title: 'Lesson' }}
            />
            {/* User Screens */}
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{ title: 'Edit Profile' }}
            />
            <Stack.Screen 
              name="InstructorList" 
              component={InstructorListScreen}
              options={{ title: 'Instructors' }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="HelpSupport" 
              component={HelpSupportScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ChangePassword" 
              component={ChangePasswordScreen}
              options={{ title: 'Change Password' }}
            />
            {/* Assessment Screens */}
            <Stack.Screen 
              name="QuizList" 
              component={QuizListScreen}
              options={{ title: 'Quizzes' }}
            />
            <Stack.Screen 
              name="Quiz" 
              component={QuizScreen}
              options={{ title: 'Take Quiz', headerLeft: null }}
            />
            <Stack.Screen 
              name="QuizResult" 
              component={QuizResultScreen}
              options={{ title: 'Quiz Result', headerLeft: null }}
            />
            <Stack.Screen 
              name="AssignmentList" 
              component={AssignmentListScreen}
              options={{ title: 'Assignments' }}
            />
            <Stack.Screen 
              name="AssignmentDetail" 
              component={AssignmentDetailScreen}
              options={{ title: 'Assignment Details' }}
            />
            <Stack.Screen 
              name="SubmitAssignment" 
              component={SubmitAssignmentScreen}
              options={{ title: 'Submit Assignment' }}
            />
            {/* Analytics Screens */}
            <Stack.Screen 
              name="Progress" 
              component={ProgressScreen}
              options={{ title: 'Course Progress' }}
            />
            <Stack.Screen 
              name="CompletedCourses" 
              component={CompletedCoursesScreen}
              options={{ title: 'Completed Courses' }}
            />
            <Stack.Screen 
              name="Certificate" 
              component={CertificateScreen}
              options={{ title: 'My Certificates' }}
            />
            <Stack.Screen 
              name="Analytics" 
              component={AnalyticsDashboardScreen}
              options={{ title: 'Analytics Dashboard' }}
            />
            
            {/* Gamification Screens */}
            <Stack.Screen 
              name="GamificationDashboard" 
              component={GamificationDashboardScreen}
              options={{ title: 'Gamification' }}
            />
            <Stack.Screen 
              name="GamificationLeaderboard" 
              component={GamificationLeaderboardScreen}
              options={{ title: 'Leaderboard' }}
            />
            <Stack.Screen 
              name="GamificationBadges" 
              component={GamificationBadgesScreen}
              options={{ title: 'Badges' }}
            />
            
            {/* Discussion Screens */}
            <Stack.Screen 
              name="DiscussionBoard" 
              component={DiscussionBoardScreen}
              options={{ title: 'Discussions' }}
            />
            <Stack.Screen 
              name="DiscussionDetail" 
              component={DiscussionDetailScreen}
              options={{ title: 'Discussion' }}
            />
            <Stack.Screen 
              name="AddDiscussion" 
              component={AddDiscussionScreen}
              options={{ title: 'New Discussion' }}
            />
            <Stack.Screen 
              name="EditDiscussion" 
              component={EditDiscussionScreen}
              options={{ title: 'Edit Discussion' }}
            />
            <Stack.Screen 
              name="Feedback" 
              component={FeedbackScreen}
              options={{ title: 'Course Feedback' }}
            />
            <Stack.Screen 
              name="Report" 
              component={ReportScreen}
              options={{ title: 'Report Content' }}
            />
            {/* Notification Screens */}
            <Stack.Screen 
              name="NotificationList" 
              component={NotificationScreen}
              options={{ title: 'All Notifications' }}
            />
            <Stack.Screen 
              name="Announcements" 
              component={AnnouncementScreen}
              options={{ title: 'Announcements' }}
            />
            <Stack.Screen 
              name="Streak" 
              component={StreakScreen}
              options={{ title: 'Learning Streak' }}
            />
            <Stack.Screen 
              name="Badges" 
              component={BadgeScreen}
              options={{ title: 'Achievement Badges' }}
            />
            <Stack.Screen
              name="ManageLessons"
              component={ManageLessonsScreen}
              options={{ title: 'Manage Lessons' }}
            />
            <Stack.Screen
              name="AddLesson"
              component={AddLessonScreen}
              options={{ title: 'Add Lesson' }}
            />
            <Stack.Screen
              name="EditLesson"
              component={EditLessonScreen}
              options={{ title: 'Edit Lesson' }}
            />
            {/* Instructor Screens */}
            <Stack.Screen
              name="InstructorCourseDetail"
              component={InstructorCourseDetailScreen}
              options={{ title: 'Manage Course' }}
            />
            <Stack.Screen
              name="InstructorSubmissions"
              component={GradeSubmissionsScreen}
              options={{ title: 'Submissions' }}
            />
            <Stack.Screen
              name="InstructorStudents"
              component={InstructorSubmissionsScreen}
              options={{ title: 'Students' }}
            />
            <Stack.Screen
              name="InstructorDiscussions"
              component={DiscussionBoardScreen}
              options={{ title: 'Discussions' }}
            />
            <Stack.Screen
              name="CreateCourse"
              component={CreateCourseScreen}
              options={{ title: 'Create Course' }}
            />
            <Stack.Screen
              name="EditCourse"
              component={EditCourseScreen}
              options={{ title: 'Edit Course' }}
            />
            <Stack.Screen
              name="CreateLesson"
              component={CreateLessonScreen}
              options={{ title: 'Add Lesson' }}
            />
            <Stack.Screen
              name="CreateQuiz"
              component={CreateQuizScreen}
              options={{ title: 'Create Quiz' }}
            />
            <Stack.Screen
              name="AddQuiz"
              component={AddQuizScreen}
              options={{ title: 'Create Quiz' }}
            />
            <Stack.Screen
              name="CreateAssignment"
              component={CreateAssignmentScreen}
              options={{ title: 'Create Assignment' }}
            />
            <Stack.Screen
              name="AddAssignment"
              component={AddAssignmentScreen}
              options={{ title: 'Create Assignment' }}
            />
            <Stack.Screen
              name="CreateAnnouncement"
              component={CreateAnnouncementScreen}
              options={{ title: 'Create Announcement' }}
            />
            <Stack.Screen
              name="ManageQuizzes"
              component={ManageQuizzesScreen}
              options={{ title: 'Manage Quizzes' }}
            />
            <Stack.Screen
              name="ManageAssignments"
              component={InstructorCourseDetailScreen}
              options={{ title: 'Manage Assignments' }}
            />
            <Stack.Screen
              name="CourseStudents"
              component={CourseStudentsScreen}
              options={{ title: 'Enrolled Students' }}
            />
            <Stack.Screen
              name="AssignmentTemplates"
              component={AssignmentTemplatesScreen}
              options={{ title: 'Assignment Templates' }}
            />
            <Stack.Screen
              name="NotificationPreferences"
              component={NotificationPreferencesScreen}
              options={{ title: 'Notification Settings' }}
            />
            <Stack.Screen
              name="InactiveStudents"
              component={InactiveStudentsScreen}
              options={{ title: 'Inactive Students' }}
            />
            <Stack.Screen
              name="BatchEnrollment"
              component={BatchEnrollmentScreen}
              options={{ title: 'Batch Enrollment' }}
            />
            <Stack.Screen
              name="MessagesList"
              component={MessagesListScreen}
              options={{ title: 'Messages' }}
            />
            <Stack.Screen
              name="DirectMessage"
              component={DirectMessageScreen}
              options={{ title: 'Chat' }}
            />
            <Stack.Screen
              name="StudentListForMessage"
              component={StudentListForMessageScreen}
              options={{ title: 'Select Student' }}
            />
            <Stack.Screen
              name="CertificateManagement"
              component={CertificateManagementScreen}
              options={{ title: 'Certificates' }}
            />
            <Stack.Screen
              name="DiscussionModeration"
              component={DiscussionModerationScreen}
              options={{ title: 'Discussion Moderation' }}
            />
            <Stack.Screen
              name="InstructorProfile"
              component={InstructorProfileScreen}
              options={{ title: 'Edit Profile' }}
            />
            <Stack.Screen
              name="LiveClassScheduler"
              component={LiveClassSchedulerScreen}
              options={{ title: 'Live Classes' }}
            />
            <Stack.Screen
              name="StudentPerformanceReport"
              component={StudentPerformanceReportScreen}
              options={{ title: 'Performance Report' }}
            />
            <Stack.Screen
              name="PeerReviewManagement"
              component={PeerReviewManagementScreen}
              options={{ title: 'Peer Reviews' }}
            />
            <Stack.Screen
              name="ExportCourseData"
              component={ExportCourseDataScreen}
              options={{ title: 'Export Course Data' }}
            />
            <Stack.Screen
              name="AssessmentManagement"
              component={AssessmentManagementScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="StudyGroups"
              component={StudyGroupsScreen}
              options={{ title: 'Study Groups' }}
            />
            <Stack.Screen
              name="StudentLiveClasses"
              component={StudentLiveClassesScreen}
              options={{ title: 'Live Classes' }}
            />
            <Stack.Screen
              name="Forum"
              component={ForumScreen}
              options={{ title: 'Forum' }}
            />
            <Stack.Screen
              name="Leaderboard"
              component={LeaderboardScreen}
              options={{ title: 'Leaderboard' }}
            />
            <Stack.Screen
              name="Flashcards"
              component={FlashcardsScreen}
              options={{ title: 'Flashcards' }}
            />
            <Stack.Screen
              name="WellnessTracker"
              component={WellnessTrackerScreen}
              options={{ title: 'Wellness Tracker' }}
            />
            <Stack.Screen
              name="GoalSetting"
              component={GoalSettingScreen}
              options={{ title: 'Goal Setting' }}
            />
            {/* Settings Screens */}
            <Stack.Screen
              name="DataExport"
              component={DataExportScreen}
              options={{ title: 'Data Export' }}
            />
            {/* Admin Screens */}
            <Stack.Screen
              name="AuditLogs"
              component={AuditLogsScreen}
              options={{ title: 'Audit Logs' }}
            />
            <Stack.Screen
              name="AdminUserDetail"
              component={AdminUserDetailScreen}
              options={{ title: 'User Details' }}
            />
            <Stack.Screen
              name="AdminInstructors"
              component={AdminInstructorsScreen}
              options={{ title: 'Instructors' }}
            />
            <Stack.Screen
              name="AdminReports"
              component={AdminReportsScreen}
              options={{ title: 'Content Reports' }}
            />
            <Stack.Screen
              name="AdminAnnouncements"
              component={AdminAnnouncementsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AdminNotifications"
              component={AdminNotificationsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AdminLogs"
              component={AdminLogsScreen}
              options={{ title: 'Admin Logs' }}
            />
            <Stack.Screen
              name="AdminDiscussions"
              component={AdminDiscussionsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AdminFeedback"
              component={AdminFeedbackScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AdminAnalytics"
              component={AdminAnalyticsScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <Stack.Screen 
            name="Auth" 
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export default AppNavigator;
