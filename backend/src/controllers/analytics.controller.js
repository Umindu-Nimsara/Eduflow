const User = require('../models/User.model');
const Course = require('../models/Course.model');
const Enrollment = require('../models/Enrollment.model');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get admin overview statistics
// @route   GET /api/analytics/overview
// @access  Private (Admin)
exports.getOverview = asyncHandler(async (req, res, next) => {
  // Get counts
  const [
    totalUsers,
    totalCourses,
    totalEnrollments,
    totalStudents,
    totalInstructors,
    publishedCourses,
  ] = await Promise.all([
    User.countDocuments(),
    Course.countDocuments(),
    Enrollment.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'instructor' }),
    Course.countDocuments({ isPublished: true }),
  ]);

  // Calculate weekly active users (users who logged in within last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const weeklyActiveUsers = await User.countDocuments({
    lastLogin: { $gte: sevenDaysAgo }
  });

  // Calculate total revenue (if courses have prices)
  const courses = await Course.find().select('price');
  const totalRevenue = courses.reduce((sum, course) => sum + (course.price || 0), 0);

  const overview = {
    totalUsers,
    totalCourses,
    totalEnrollments,
    totalStudents,
    totalInstructors,
    publishedCourses,
    weeklyActiveUsers,
    totalRevenue,
  };

  res.status(200).json({
    success: true,
    data: overview
  });
});

// @desc    Get student analytics
// @route   GET /api/analytics/student
// @access  Private (Student)
exports.getStudentAnalytics = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const enrollments = await Enrollment.find({ userId })
    .populate('courseId', 'title')
    .sort({ createdAt: -1 });

  const completedCourses = enrollments.filter(e => e.completionPercentage === 100).length;

  res.status(200).json({
    success: true,
    data: {
      enrolledCourses: enrollments.length,
      completedCourses,
      enrollments
    }
  });
});

// @desc    Get instructor analytics
// @route   GET /api/analytics/instructor
// @access  Private (Instructor)
exports.getInstructorAnalytics = asyncHandler(async (req, res, next) => {
  const instructorId = req.user._id;

  const courses = await Course.find({ instructorId });
  const totalCourses = courses.length;
  const publishedCourses = courses.filter(c => c.isPublished).length;

  // Get total students across all courses
  let totalStudents = 0;
  for (const course of courses) {
    const enrollmentCount = await Enrollment.countDocuments({ courseId: course._id });
    totalStudents += enrollmentCount;
  }

  res.status(200).json({
    success: true,
    data: {
      totalCourses,
      publishedCourses,
      totalStudents,
      courses
    }
  });
});

// @desc    Get weekly activity data
// @route   GET /api/analytics/weekly-activity
// @access  Private (Admin)
exports.getWeeklyActivity = asyncHandler(async (req, res, next) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyData = [];

  // Get data for last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    // Count enrollments for this day
    const enrollments = await Enrollment.countDocuments({
      createdAt: {
        $gte: date,
        $lt: nextDate
      }
    });

    const dayIndex = date.getDay();
    const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1]; // Convert Sunday=0 to Sunday=6

    weeklyData.push({
      label: dayName,
      value: enrollments,
      date: date.toISOString().split('T')[0]
    });
  }

  res.status(200).json({
    success: true,
    data: weeklyData
  });
});

// @desc    Get user growth data
// @route   GET /api/analytics/user-growth
// @access  Private (Admin)
exports.getUserGrowth = asyncHandler(async (req, res, next) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const growthData = [];

  // Get data for last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    // Count new users for this day
    const newUsers = await User.countDocuments({
      createdAt: {
        $gte: date,
        $lt: nextDate
      }
    });

    const dayIndex = date.getDay();
    const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1];

    growthData.push({
      label: dayName,
      value: newUsers,
      date: date.toISOString().split('T')[0]
    });
  }

  res.status(200).json({
    success: true,
    data: growthData
  });
});
