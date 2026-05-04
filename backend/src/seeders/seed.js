const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('../models/User.model');
const UserProfile = require('../models/UserProfile.model');
const InstructorProfile = require('../models/InstructorProfile.model');
const Course = require('../models/Course.model');
const Lesson = require('../models/Lesson.model');
const Quiz = require('../models/Quiz.model');
const Question = require('../models/Question.model');
const Assignment = require('../models/Assignment.model');
const Badge = require('../models/Badge.model');
const Announcement = require('../models/Announcement.model');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Clear existing data
const clearData = async () => {
  try {
    await User.deleteMany({});
    await UserProfile.deleteMany({});
    await InstructorProfile.deleteMany({});
    await Course.deleteMany({});
    await Lesson.deleteMany({});
    await Quiz.deleteMany({});
    await Question.deleteMany({});
    await Assignment.deleteMany({});
    await Badge.deleteMany({});
    await Announcement.deleteMany({});
    console.log('🗑️  Cleared existing data');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

// Seed data
const seedData = async () => {
  try {
    console.log('🌱 Starting to seed data...\n');

    // 1. Create Users
    console.log('👥 Creating users...');
    // Don't hash password here - let the User model handle it
    const plainPassword = 'password123';

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@elearning.com',
      password: plainPassword,
      role: 'admin',
    });

    const instructor1 = await User.create({
      name: 'John Smith',
      email: 'john@elearning.com',
      password: plainPassword,
      role: 'instructor',
    });

    const instructor2 = await User.create({
      name: 'Sarah Johnson',
      email: 'sarah@elearning.com',
      password: plainPassword,
      role: 'instructor',
    });

    const student1 = await User.create({
      name: 'Alice Brown',
      email: 'alice@elearning.com',
      password: plainPassword,
      role: 'student',
    });

    const student2 = await User.create({
      name: 'Bob Wilson',
      email: 'bob@elearning.com',
      password: plainPassword,
      role: 'student',
    });

    console.log('✅ Created 5 users (1 admin, 2 instructors, 2 students)');

    // 2. Create User Profiles
    console.log('📝 Creating user profiles...');
    await UserProfile.create([
      { userId: student1._id, bio: 'Passionate learner interested in technology' },
      { userId: student2._id, bio: 'Software developer looking to expand skills' },
    ]);

    // 3. Create Instructor Profiles
    await InstructorProfile.create([
      {
        userId: instructor1._id,
        bio: 'Senior Software Engineer with 10+ years experience',
        expertise: ['JavaScript', 'React', 'Node.js'],
        isVerified: true,
      },
      {
        userId: instructor2._id,
        bio: 'Full Stack Developer and Tech Educator',
        expertise: ['Python', 'Django', 'Machine Learning'],
        isVerified: true,
      },
    ]);

    console.log('✅ Created profiles');

    // 4. Create Courses
    console.log('📚 Creating courses...');
    const course1 = await Course.create({
      title: 'React Native Masterclass',
      description: 'Learn to build mobile apps with React Native from scratch. This comprehensive course covers everything from basics to advanced topics.',
      instructorId: instructor1._id,
      category: 'Mobile Development',
      price: 49.99,
      tags: ['React Native', 'Mobile', 'JavaScript'],
      isPublished: true,
    });

    const course2 = await Course.create({
      title: 'Node.js & Express Backend Development',
      description: 'Master backend development with Node.js and Express. Build RESTful APIs, work with databases, and deploy to production.',
      instructorId: instructor1._id,
      category: 'Backend Development',
      price: 39.99,
      tags: ['Node.js', 'Express', 'Backend', 'API'],
      isPublished: true,
    });

    const course3 = await Course.create({
      title: 'Python for Data Science',
      description: 'Learn Python programming and data science fundamentals. Work with pandas, numpy, and matplotlib.',
      instructorId: instructor2._id,
      category: 'Data Science',
      price: 59.99,
      tags: ['Python', 'Data Science', 'Pandas'],
      isPublished: true,
    });

    const course4 = await Course.create({
      title: 'Machine Learning Basics',
      description: 'Introduction to machine learning concepts and algorithms. Hands-on projects with real datasets.',
      instructorId: instructor2._id,
      category: 'Machine Learning',
      price: 69.99,
      tags: ['Machine Learning', 'AI', 'Python'],
      isPublished: true,
    });

    console.log('✅ Created 4 courses');

    // 5. Create Lessons
    console.log('📖 Creating lessons...');
    const lessons1 = await Lesson.create([
      {
        courseId: course1._id,
        title: 'Introduction to React Native',
        description: 'Welcome to React Native! In this lesson, we will cover the basics of React Native and set up our development environment.',
        videoUrl: 'https://www.youtube.com/watch?v=0-S5a0eXPoc',
        duration: 15,
        orderIndex: 1,
      },
      {
        courseId: course1._id,
        title: 'Components and Props',
        description: 'Learn about React Native components, props, and how to build reusable UI elements.',
        videoUrl: 'https://www.youtube.com/watch?v=0-S5a0eXPoc',
        duration: 20,
        orderIndex: 2,
      },
      {
        courseId: course1._id,
        title: 'State and Lifecycle',
        description: 'Understanding state management and component lifecycle in React Native applications.',
        videoUrl: 'https://www.youtube.com/watch?v=0-S5a0eXPoc',
        duration: 25,
        orderIndex: 3,
      },
      {
        courseId: course1._id,
        title: 'Navigation Basics',
        description: 'Implement navigation in your React Native app using React Navigation.',
        videoUrl: 'https://www.youtube.com/watch?v=0-S5a0eXPoc',
        duration: 30,
        orderIndex: 4,
      },
    ]);

    const lessons2 = await Lesson.create([
      {
        courseId: course2._id,
        title: 'Node.js Fundamentals',
        description: 'Introduction to Node.js, npm, and the Node.js ecosystem.',
        videoUrl: 'https://www.youtube.com/watch?v=TlB_eWDSMt4',
        duration: 20,
        orderIndex: 1,
      },
      {
        courseId: course2._id,
        title: 'Express.js Setup',
        description: 'Setting up an Express.js server and creating your first routes.',
        videoUrl: 'https://www.youtube.com/watch?v=TlB_eWDSMt4',
        duration: 25,
        orderIndex: 2,
      },
      {
        courseId: course2._id,
        title: 'RESTful API Design',
        description: 'Learn REST principles and build a complete RESTful API.',
        videoUrl: 'https://www.youtube.com/watch?v=TlB_eWDSMt4',
        duration: 30,
        orderIndex: 3,
      },
    ]);

    const lessons3 = await Lesson.create([
      {
        courseId: course3._id,
        title: 'Python Basics',
        description: 'Introduction to Python syntax, variables, and data types.',
        videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
        duration: 15,
        orderIndex: 1,
      },
      {
        courseId: course3._id,
        title: 'Working with Pandas',
        description: 'Data manipulation and analysis with pandas library.',
        videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
        duration: 25,
        orderIndex: 2,
      },
      {
        courseId: course3._id,
        title: 'Data Visualization',
        description: 'Create beautiful visualizations with matplotlib and seaborn.',
        videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
        duration: 20,
        orderIndex: 3,
      },
    ]);

    console.log('✅ Created 10 lessons');

    // 6. Create Quizzes
    console.log('❓ Creating quizzes...');
    const quiz1 = await Quiz.create({
      courseId: course1._id,
      title: 'React Native Basics Quiz',
      description: 'Test your knowledge of React Native fundamentals',
      timeLimit: 15,
      passingScore: 70,
      totalMarks: 50,
      isPublished: true,
    });

    const quiz2 = await Quiz.create({
      courseId: course2._id,
      title: 'Node.js & Express Quiz',
      description: 'Test your understanding of Node.js and Express concepts',
      timeLimit: 20,
      passingScore: 75,
      totalMarks: 40,
      isPublished: true,
    });

    const quiz3 = await Quiz.create({
      courseId: course3._id,
      title: 'Python Fundamentals Quiz',
      description: 'Test your Python programming knowledge',
      timeLimit: 15,
      passingScore: 70,
      totalMarks: 30,
      isPublished: true,
    });

    console.log('✅ Created 3 quizzes');

    // 7. Create Questions
    console.log('❔ Creating questions...');
    await Question.create([
      // Quiz 1 Questions
      {
        quizId: quiz1._id,
        questionText: 'What is React Native?',
        options: [
          'A web framework',
          'A mobile app framework',
          'A database',
          'A programming language',
        ],
        correctAnswer: 1,
        marks: 10,
      },
      {
        quizId: quiz1._id,
        questionText: 'Which company developed React Native?',
        options: ['Google', 'Facebook', 'Microsoft', 'Apple'],
        correctAnswer: 1,
        marks: 10,
      },
      {
        quizId: quiz1._id,
        questionText: 'What language is React Native based on?',
        options: ['Python', 'Java', 'JavaScript', 'Swift'],
        correctAnswer: 2,
        marks: 10,
      },
      {
        quizId: quiz1._id,
        questionText: 'Can React Native apps run on both iOS and Android?',
        options: ['Yes', 'No', 'Only iOS', 'Only Android'],
        correctAnswer: 0,
        marks: 10,
      },
      {
        quizId: quiz1._id,
        questionText: 'What is JSX?',
        options: [
          'A database query language',
          'A syntax extension for JavaScript',
          'A CSS framework',
          'A testing library',
        ],
        correctAnswer: 1,
        marks: 10,
      },
      // Quiz 2 Questions
      {
        quizId: quiz2._id,
        questionText: 'What is Node.js?',
        options: [
          'A JavaScript runtime',
          'A database',
          'A web browser',
          'A CSS framework',
        ],
        correctAnswer: 0,
        marks: 10,
      },
      {
        quizId: quiz2._id,
        questionText: 'What is Express.js?',
        options: [
          'A database',
          'A web framework for Node.js',
          'A testing library',
          'A CSS preprocessor',
        ],
        correctAnswer: 1,
        marks: 10,
      },
      {
        quizId: quiz2._id,
        questionText: 'What does REST stand for?',
        options: [
          'Representational State Transfer',
          'Remote Execution Service Tool',
          'Rapid Express Server Technology',
          'Real-time Event Streaming Transfer',
        ],
        correctAnswer: 0,
        marks: 10,
      },
      {
        quizId: quiz2._id,
        questionText: 'Which HTTP method is used to create a resource?',
        options: ['GET', 'POST', 'PUT', 'DELETE'],
        correctAnswer: 1,
        marks: 10,
      },
      // Quiz 3 Questions
      {
        quizId: quiz3._id,
        questionText: 'What is Python?',
        options: [
          'A snake',
          'A programming language',
          'A database',
          'A web browser',
        ],
        correctAnswer: 1,
        marks: 10,
      },
      {
        quizId: quiz3._id,
        questionText: 'What is pandas used for?',
        options: [
          'Web development',
          'Data manipulation',
          'Game development',
          'Mobile apps',
        ],
        correctAnswer: 1,
        marks: 10,
      },
      {
        quizId: quiz3._id,
        questionText: 'Which symbol is used for comments in Python?',
        options: ['//', '/*', '#', '<!--'],
        correctAnswer: 2,
        marks: 10,
      },
    ]);

    console.log('✅ Created 12 questions');

    // 8. Create Assignments
    console.log('📋 Creating assignments...');
    await Assignment.create([
      {
        courseId: course1._id,
        title: 'Build a Todo App',
        description: 'Create a simple todo application using React Native with add, delete, and mark as complete functionality.',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        totalMarks: 100,
      },
      {
        courseId: course1._id,
        title: 'Weather App Project',
        description: 'Build a weather app that fetches data from an API and displays current weather information.',
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        totalMarks: 100,
      },
      {
        courseId: course2._id,
        title: 'REST API Project',
        description: 'Create a RESTful API for a blog application with CRUD operations for posts and comments.',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        totalMarks: 100,
      },
      {
        courseId: course3._id,
        title: 'Data Analysis Project',
        description: 'Analyze a dataset using pandas and create visualizations to present your findings.',
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        totalMarks: 100,
      },
    ]);

    console.log('✅ Created 4 assignments');

    // 9. Create Badges
    console.log('🏆 Creating badges...');
    await Badge.create([
      {
        name: 'First Course',
        description: 'Complete your first course',
        icon: 'https://img.icons8.com/color/96/000000/trophy.png',
        condition: 'Complete 1 course',
      },
      {
        name: 'Quiz Master',
        description: 'Pass 5 quizzes with 90% or higher',
        icon: 'https://img.icons8.com/color/96/000000/brain.png',
        condition: 'Pass 5 quizzes with 90%+',
      },
      {
        name: 'Assignment Ace',
        description: 'Submit 10 assignments',
        icon: 'https://img.icons8.com/color/96/000000/document.png',
        condition: 'Submit 10 assignments',
      },
      {
        name: 'Discussion Contributor',
        description: 'Post 20 discussions or replies',
        icon: 'https://img.icons8.com/color/96/000000/chat.png',
        condition: 'Post 20 discussions/replies',
      },
      {
        name: '7-Day Streak',
        description: 'Maintain a 7-day learning streak',
        icon: 'https://img.icons8.com/color/96/000000/fire-element.png',
        condition: 'Learn for 7 consecutive days',
      },
      {
        name: '30-Day Streak',
        description: 'Maintain a 30-day learning streak',
        icon: 'https://img.icons8.com/color/96/000000/fire-heart.png',
        condition: 'Learn for 30 consecutive days',
      },
    ]);

    console.log('✅ Created 6 badges');

    // 10. Create Announcements
    console.log('📢 Creating announcements...');
    await Announcement.create([
      {
        createdBy: adminUser._id,
        title: 'Welcome to E-Learning Platform!',
        content: 'We are excited to have you here. Start exploring our courses and begin your learning journey today!',
        targetRole: 'all',
        isActive: true,
      },
      {
        createdBy: adminUser._id,
        title: 'New Courses Added',
        content: 'Check out our latest courses in Machine Learning and Data Science. Enroll now and get 20% off!',
        targetRole: 'student',
        isActive: true,
      },
      {
        createdBy: adminUser._id,
        title: 'Platform Maintenance',
        content: 'Scheduled maintenance on Sunday 2 AM - 4 AM. The platform will be temporarily unavailable.',
        targetRole: 'all',
        isActive: true,
      },
    ]);

    console.log('✅ Created 3 announcements');

    console.log('\n🎉 Seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log('   - 5 Users (1 admin, 2 instructors, 2 students)');
    console.log('   - 4 Courses');
    console.log('   - 10 Lessons');
    console.log('   - 3 Quizzes');
    console.log('   - 12 Questions');
    console.log('   - 4 Assignments');
    console.log('   - 6 Badges');
    console.log('   - 3 Announcements\n');
    console.log('🔑 Test Credentials:');
    console.log('   Admin:      admin@elearning.com / password123');
    console.log('   Instructor: john@elearning.com / password123');
    console.log('   Instructor: sarah@elearning.com / password123');
    console.log('   Student:    alice@elearning.com / password123');
    console.log('   Student:    bob@elearning.com / password123\n');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await clearData();
    await seedData();
    console.log('✅ All done! You can now start the server.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
};

// Run the seeder
main();
