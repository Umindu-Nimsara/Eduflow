import api from './api';
import { ENDPOINTS } from '../constants/api';

export const assessmentService = {
  // Quiz APIs
  getAllQuizzes: async (page = 1, limit = 10, courseId = null) => {
    const params = { page, limit };
    if (courseId) params.courseId = courseId;
    const response = await api.get(ENDPOINTS.QUIZZES, { params });
    return response.data;
  },

  getQuizById: async (quizId) => {
    const response = await api.get(`${ENDPOINTS.QUIZZES}/${quizId}`);
    return response.data;
  },

  submitQuizAttempt: async (quizId, answers, timeTaken = 0) => {
    // answers = [{questionId, selectedOption}] → convert to backend format
    const formattedAnswers = answers.map(a => ({
      questionId:     a.questionId,
      selectedAnswer: a.selectedOption, // backend expects selectedAnswer
    }));
    const response = await api.post(`${ENDPOINTS.QUIZZES}/${quizId}/attempt`, {
      answers:   formattedAnswers,
      timeTaken,
    });
    return response.data;
  },

  getQuizAttempts: async (quizId) => {
    const response = await api.get(`${ENDPOINTS.QUIZZES}/${quizId}/attempts`);
    return response.data;
  },

  getUserQuizHistory: async () => {
    const response = await api.get(`${ENDPOINTS.QUIZZES}/my-attempts`);
    return response.data;
  },

  // Assignment APIs
  getAllAssignments: async (page = 1, limit = 10, courseId = null) => {
    const params = { page, limit };
    if (courseId) params.courseId = courseId;
    const response = await api.get(ENDPOINTS.ASSIGNMENTS, { params });
    return response.data;
  },

  getAssignmentById: async (assignmentId) => {
    const response = await api.get(`${ENDPOINTS.ASSIGNMENTS}/${assignmentId}`);
    return response.data;
  },

  submitAssignment: async (assignmentId, formData) => {
    const response = await api.post(
      `${ENDPOINTS.SUBMISSIONS}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  getMySubmissions: async (assignmentId = null) => {
    const params = assignmentId ? { assignmentId } : {};
    const response = await api.get(`${ENDPOINTS.SUBMISSIONS}/my-submissions`, { params });
    return response.data;
  },

  getSubmissionById: async (submissionId) => {
    const response = await api.get(`${ENDPOINTS.SUBMISSIONS}/${submissionId}`);
    return response.data;
  },
};
