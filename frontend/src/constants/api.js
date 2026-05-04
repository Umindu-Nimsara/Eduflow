// API Configuration - Physical Device
// Use computer's IP address on same WiFi network
// Computer IP: 10.214.148.69 (updated)
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://10.214.148.69:5000/api';
export const API_URL = API_BASE;
export const UPLOADS_URL = API_BASE.replace('/api', '/uploads');

export const ENDPOINTS = {
  // Auth
  AUTH: '/auth',
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_REFRESH: '/auth/refresh-token',
  AUTH_ME: '/auth/me',
  CHANGE_PASSWORD: '/auth/change-password',
  
  // Courses
  COURSES: '/courses',
  COURSE_UPLOAD: '/courses/upload',
  
  // Lessons
  LESSONS: '/lessons',
  LESSON_UPLOAD_VIDEO: '/lessons/upload-video',
  LESSON_UPLOAD_DOCUMENT: '/lessons/upload-document',
  
  // Users
  USERS: '/users',
  USER_UPLOAD_PHOTO: '/users/upload-photo',
  
  // Instructors
  INSTRUCTORS: '/instructors',
  INSTRUCTOR_REGISTER: '/instructors/register',
  INSTRUCTOR_UPLOAD_PHOTO: '/instructors/upload-photo',
  
  // Quizzes
  QUIZZES: '/quizzes',
  QUESTIONS: '/questions',
  
  // Assignments
  ASSIGNMENTS: '/assignments',
  SUBMISSIONS: '/submissions',
  SUBMISSION_UPLOAD: '/submissions/upload',
  
  // Progress & Enrollment
  PROGRESS: '/progress',
  ENROLLMENTS: '/enrollments',
  CERTIFICATES: '/certificates',
  
  // Analytics
  ANALYTICS: '/analytics',
  ADMIN_LOGS: '/admin/logs',
  
  // Discussion
  DISCUSSIONS: '/discussions',
  REPLIES: '/replies',
  FEEDBACK: '/feedback',
  REPORTS: '/reports',
  
  // Notifications
  NOTIFICATIONS: '/notifications',
  ANNOUNCEMENTS: '/announcements',
  STREAKS: '/streaks',
  BADGES: '/badges',
};
