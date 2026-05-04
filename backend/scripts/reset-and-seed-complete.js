const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../src/models/User.model');
const Course = require('../src/models/Course.model');
const Lesson = require('../src/models/Lesson.model');
const Quiz = require('../src/models/Quiz.model');
const Question = require('../src/models/Question.model');
const Discussion = require('../src/models/Discussion.model');
const Reply = require('../src/models/Reply.model');
const Enrollment = require('../src/models/Enrollment.model');
const Progress = require('../src/models/Progress.model');
const QuizAttempt = require('../src/models/QuizAttempt.model');
const Assignment = require('../src/models/Assignment.model');
const AssignmentSubmission = require('../src/models/AssignmentSubmission.model');
const UserGamification = require('../src/models/Gamification.model');
const InstructorProfile = require('../src/models/InstructorProfile.model');
const UserProfile = require('../src/models/UserProfile.model');
const Streak = require('../src/models/Streak.model');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Clear all data
const clearAllData = async () => {
  console.log('\n🗑️  Clearing all existing data...');
  
  try {
    await User.deleteMany({});
    await Course.deleteMany({});
    await Lesson.deleteMany({});
    await Quiz.deleteMany({});
    await Question.deleteMany({});
    await Discussion.deleteMany({});
    await Reply.deleteMany({});
    await Enrollment.deleteMany({});
    await Progress.deleteMany({});
    await QuizAttempt.deleteMany({});
    await Assignment.deleteMany({});
    await AssignmentSubmission.deleteMany({});
    await UserGamification.deleteMany({});
    await InstructorProfile.deleteMany({});
    await UserProfile.deleteMany({});
    await Streak.deleteMany({});
    
    console.log('✅ All data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
};

// Create users (students and instructors)
const createUsers = async () => {
  console.log('\n👥 Creating users...');
  
  // Note: Password will be hashed by the pre-save hook in User model
  const password = 'password123';
  
  // Create 5 students
  const students = await User.create([
    {
      name: 'Kasun Perera',
      email: 'kasun@student.lk',
      password: password,
      role: 'student'
    },
    {
      name: 'Nimali Silva',
      email: 'nimali@student.lk',
      password: password,
      role: 'student'
    },
    {
      name: 'Tharindu Fernando',
      email: 'tharindu@student.lk',
      password: password,
      role: 'student'
    },
    {
      name: 'Sachini Jayawardena',
      email: 'sachini@student.lk',
      password: password,
      role: 'student'
    },
    {
      name: 'Dilshan Rajapaksa',
      email: 'dilshan@student.lk',
      password: password,
      role: 'student'
    }
  ]);
  
  // Create 5 instructors
  const instructors = await User.create([
    {
      name: 'Dr. Nimal Bandara',
      email: 'nimal@teacher.lk',
      password: password,
      role: 'instructor'
    },
    {
      name: 'Mrs. Chamari Wickramasinghe',
      email: 'chamari@teacher.lk',
      password: password,
      role: 'instructor'
    },
    {
      name: 'Mr. Rohan Gunawardena',
      email: 'rohan@teacher.lk',
      password: password,
      role: 'instructor'
    },
    {
      name: 'Ms. Sanduni Amarasinghe',
      email: 'sanduni@teacher.lk',
      password: password,
      role: 'instructor'
    },
    {
      name: 'Prof. Ajith Dissanayake',
      email: 'ajith@teacher.lk',
      password: password,
      role: 'instructor'
    }
  ]);
  
  // Create admin
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@eduflow.lk',
    password: password,
    role: 'admin'
  });
  
  console.log(`✅ Created ${students.length} students`);
  console.log(`✅ Created ${instructors.length} instructors`);
  console.log(`✅ Created 1 admin`);
  
  return { students, instructors, admin };
};

// Create instructor profiles
const createInstructorProfiles = async (instructors) => {
  console.log('\n👨‍🏫 Creating instructor profiles...');
  
  const profiles = await InstructorProfile.create([
    {
      userId: instructors[0]._id,
      bio: 'Experienced Mathematics teacher with 15+ years of teaching O/L students. Specialized in making complex concepts simple.',
      qualifications: 'B.Sc in Mathematics, M.Sc in Education, Diploma in Teaching',
      expertise: ['Mathematics', 'Algebra', 'Geometry'],
      experience: '15 years of teaching experience',
      rating: 4.8,
      totalStudents: 0
    },
    {
      userId: instructors[1]._id,
      bio: 'Passionate Science educator dedicated to making science fun and engaging for students.',
      qualifications: 'B.Sc in Biology, Postgraduate Diploma in Education',
      expertise: ['Science', 'Biology', 'Chemistry'],
      experience: '10 years of teaching experience',
      rating: 4.7,
      totalStudents: 0
    },
    {
      userId: instructors[2]._id,
      bio: 'English language expert helping students master grammar, writing, and literature.',
      qualifications: 'BA in English Literature, TESOL Certification',
      expertise: ['English', 'Grammar', 'Literature'],
      experience: '12 years of teaching experience',
      rating: 4.9,
      totalStudents: 0
    },
    {
      userId: instructors[3]._id,
      bio: 'History teacher bringing the past to life through engaging storytelling and analysis.',
      qualifications: 'BA in History, MA in Education',
      expertise: ['History', 'Sri Lankan History', 'World History'],
      experience: '8 years of teaching experience',
      rating: 4.6,
      totalStudents: 0
    },
    {
      userId: instructors[4]._id,
      bio: 'ICT specialist preparing students for the digital age with practical skills.',
      qualifications: 'B.Sc in Computer Science, Industry Certifications',
      expertise: ['ICT', 'Programming', 'Computer Basics'],
      experience: '7 years of teaching experience',
      rating: 4.8,
      totalStudents: 0
    }
  ]);
  
  console.log(`✅ Created ${profiles.length} instructor profiles`);
  return profiles;
};

// Create student profiles
const createStudentProfiles = async (students) => {
  console.log('\n👨‍🎓 Creating student profiles...');
  
  const profiles = await UserProfile.create(
    students.map((student, index) => ({
      userId: student._id,
      grade: 9 + (index % 3), // Grades 9, 10, 11
      school: ['Royal College', 'Ananda College', 'Visakha Vidyalaya', 'Nalanda College', 'Musaeus College'][index],
      interests: ['Mathematics', 'Science', 'English'][index % 3] ? [['Mathematics', 'Science'], ['English', 'History'], ['ICT', 'Mathematics']][index % 3] : ['Science']
    }))
  );
  
  console.log(`✅ Created ${profiles.length} student profiles`);
  return profiles;
};

// Create courses with lessons, quizzes, and assignments
const createCourses = async (instructors) => {
  console.log('\n📚 Creating courses...');
  
  const coursesData = [
    {
      instructor: instructors[0],
      title: 'Mathematics - Grade 9',
      description: 'Complete O/L Mathematics course covering algebra, geometry, and statistics',
      subject: 'Mathematics',
      grade: 9,
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400',
      lessons: [
        { title: 'Introduction to Algebra', description: 'Basic algebraic concepts and equations', duration: 45, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
        { title: 'Linear Equations', description: 'Solving linear equations step by step', duration: 50, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
        { title: 'Quadratic Equations', description: 'Understanding and solving quadratic equations', duration: 55, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' }
      ],
      quizzes: [
        {
          title: 'Algebra Basics Quiz',
          description: 'Test your understanding of basic algebra',
          questions: [
            { questionText: 'What is 2x + 5 = 15? Solve for x.', options: ['5', '10', '7.5', '12'], correctAnswer: 0, explanation: 'Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5' },
            { questionText: 'Simplify: 3x + 2x', options: ['5x', '6x', 'x', '5x²'], correctAnswer: 0, explanation: 'Combine like terms: 3x + 2x = 5x' }
          ]
        }
      ],
      assignments: [
        { title: 'Algebra Practice Problems', description: 'Solve 10 algebra problems', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), totalMarks: 100 }
      ]
    },
    {
      instructor: instructors[1],
      title: 'Science - Grade 10',
      description: 'Comprehensive science course covering biology, chemistry, and physics',
      subject: 'Science',
      grade: 10,
      thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400',
      lessons: [
        { title: 'Cell Structure', description: 'Understanding plant and animal cells', duration: 40, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
        { title: 'Photosynthesis', description: 'How plants make food', duration: 45, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
        { title: 'Chemical Reactions', description: 'Types of chemical reactions', duration: 50, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' }
      ],
      quizzes: [
        {
          title: 'Cell Biology Quiz',
          description: 'Test your knowledge of cells',
          questions: [
            { questionText: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Chloroplast'], correctAnswer: 1, explanation: 'Mitochondria produce energy (ATP) for the cell' },
            { questionText: 'Which organelle is found only in plant cells?', options: ['Mitochondria', 'Nucleus', 'Chloroplast', 'Ribosome'], correctAnswer: 2, explanation: 'Chloroplasts are unique to plant cells and perform photosynthesis' }
          ]
        }
      ],
      assignments: [
        { title: 'Cell Diagram', description: 'Draw and label a plant cell', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), totalMarks: 50 }
      ]
    },
    {
      instructor: instructors[2],
      title: 'English Language - Grade 11',
      description: 'Master English grammar, writing, and literature for O/L exam',
      subject: 'English',
      grade: 11,
      thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
      lessons: [
        { title: 'Grammar Fundamentals', description: 'Parts of speech and sentence structure', duration: 40, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
        { title: 'Essay Writing', description: 'How to write effective essays', duration: 50, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
        { title: 'Reading Comprehension', description: 'Strategies for understanding texts', duration: 45, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' }
      ],
      quizzes: [
        {
          title: 'Grammar Quiz',
          description: 'Test your grammar knowledge',
          questions: [
            { questionText: 'Identify the verb: "She runs quickly."', options: ['She', 'runs', 'quickly', 'None'], correctAnswer: 1, explanation: 'Runs is the action verb in this sentence' },
            { questionText: 'Which is a proper noun?', options: ['city', 'Colombo', 'school', 'teacher'], correctAnswer: 1, explanation: 'Colombo is a specific place name, making it a proper noun' }
          ]
        }
      ],
      assignments: [
        { title: 'Essay: My Future Goals', description: 'Write a 500-word essay', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), totalMarks: 100 }
      ]
    },
    {
      instructor: instructors[3],
      title: 'History - Grade 9',
      description: 'Sri Lankan and world history for O/L students',
      subject: 'History',
      grade: 9,
      thumbnail: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400',
      lessons: [
        { title: 'Ancient Civilizations', description: 'Early human societies', duration: 45, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
        { title: 'Sri Lankan History', description: 'From ancient kingdoms to modern times', duration: 50, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' }
      ],
      quizzes: [
        {
          title: 'Ancient History Quiz',
          description: 'Test your knowledge of ancient civilizations',
          questions: [
            { questionText: 'Which was the first ancient civilization?', options: ['Roman', 'Greek', 'Mesopotamian', 'Egyptian'], correctAnswer: 2, explanation: 'Mesopotamia is considered the cradle of civilization' }
          ]
        }
      ],
      assignments: [
        { title: 'Timeline Project', description: 'Create a timeline of Sri Lankan history', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), totalMarks: 75 }
      ]
    },
    {
      instructor: instructors[4],
      title: 'ICT - Grade 10',
      description: 'Information and Communication Technology fundamentals',
      subject: 'ICT',
      grade: 10,
      thumbnail: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400',
      lessons: [
        { title: 'Introduction to Computers', description: 'Computer basics and components', duration: 40, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
        { title: 'Internet and Email', description: 'Using the internet safely', duration: 45, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' }
      ],
      quizzes: [
        {
          title: 'Computer Basics Quiz',
          description: 'Test your ICT knowledge',
          questions: [
            { questionText: 'What does CPU stand for?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'None'], correctAnswer: 0, explanation: 'CPU stands for Central Processing Unit, the brain of the computer' }
          ]
        }
      ],
      assignments: [
        { title: 'Create a Presentation', description: 'Make a PowerPoint about internet safety', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), totalMarks: 50 }
      ]
    },
    // NEW COURSES (5 more)
    {
      instructor: instructors[0],
      title: 'Advanced Mathematics - Grade 11',
      description: 'Advanced topics in algebra, trigonometry, and calculus basics',
      subject: 'Mathematics',
      grade: 11,
      thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
      lessons: [
        { title: 'Trigonometry Basics', description: 'Sine, cosine, and tangent functions', duration: 50, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
        { title: 'Functions and Graphs', description: 'Understanding mathematical functions', duration: 55, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
        { title: 'Statistics and Probability', description: 'Data analysis and probability theory', duration: 45, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' }
      ],
      quizzes: [
        {
          title: 'Trigonometry Quiz',
          description: 'Test your trigonometry skills',
          questions: [
            { questionText: 'What is sin(90°)?', options: ['0', '1', '-1', '0.5'], correctAnswer: 1, explanation: 'sin(90°) = 1' },
            { questionText: 'What is cos(0°)?', options: ['0', '1', '-1', '0.5'], correctAnswer: 1, explanation: 'cos(0°) = 1' }
          ]
        }
      ],
      assignments: [
        { title: 'Trigonometry Problems', description: 'Solve 15 trigonometry problems', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), totalMarks: 100 }
      ]
    },
    {
      instructor: instructors[1],
      title: 'Physics - Grade 11',
      description: 'Mechanics, electricity, and magnetism for O/L students',
      subject: 'Physics',
      grade: 11,
      thumbnail: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400',
      lessons: [
        { title: 'Newton\'s Laws of Motion', description: 'Understanding force and motion', duration: 50, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
        { title: 'Energy and Work', description: 'Kinetic and potential energy', duration: 45, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
        { title: 'Electricity Basics', description: 'Current, voltage, and resistance', duration: 55, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' }
      ],
      quizzes: [
        {
          title: 'Physics Fundamentals Quiz',
          description: 'Test your physics knowledge',
          questions: [
            { questionText: 'What is the SI unit of force?', options: ['Joule', 'Newton', 'Watt', 'Pascal'], correctAnswer: 1, explanation: 'Newton (N) is the SI unit of force' },
            { questionText: 'What is the formula for kinetic energy?', options: ['mgh', '½mv²', 'Fd', 'Pt'], correctAnswer: 1, explanation: 'Kinetic energy = ½mv²' }
          ]
        }
      ],
      assignments: [
        { title: 'Physics Experiments Report', description: 'Document 3 physics experiments', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), totalMarks: 75 }
      ]
    },
    {
      instructor: instructors[2],
      title: 'Sinhala Language - Grade 10',
      description: 'Sinhala grammar, literature, and composition',
      subject: 'Sinhala',
      grade: 10,
      thumbnail: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      lessons: [
        { title: 'Sinhala Grammar Basics', description: 'Parts of speech in Sinhala', duration: 40, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
        { title: 'Essay Writing in Sinhala', description: 'How to write effective essays', duration: 50, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
        { title: 'Sinhala Literature', description: 'Classic Sinhala literary works', duration: 45, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' }
      ],
      quizzes: [
        {
          title: 'Sinhala Grammar Quiz',
          description: 'Test your Sinhala grammar',
          questions: [
            { questionText: 'නාම පදය හඳුනාගන්න: "ළමයා පාසලට යයි"', options: ['ළමයා', 'පාසලට', 'යයි', 'කිසිවක් නැත'], correctAnswer: 0, explanation: 'ළමයා යනු නාම පදයකි' }
          ]
        }
      ],
      assignments: [
        { title: 'Sinhala Essay', description: 'Write an essay in Sinhala', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), totalMarks: 100 }
      ]
    },
    {
      instructor: instructors[3],
      title: 'Geography - Grade 10',
      description: 'Physical and human geography of Sri Lanka and the world',
      subject: 'Geography',
      grade: 10,
      thumbnail: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=400',
      lessons: [
        { title: 'Map Reading Skills', description: 'Understanding maps and coordinates', duration: 45, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
        { title: 'Climate and Weather', description: 'Weather patterns and climate zones', duration: 50, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
        { title: 'Sri Lankan Geography', description: 'Physical features of Sri Lanka', duration: 40, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' }
      ],
      quizzes: [
        {
          title: 'Geography Quiz',
          description: 'Test your geography knowledge',
          questions: [
            { questionText: 'What is the highest mountain in Sri Lanka?', options: ['Adam\'s Peak', 'Pidurutalagala', 'Knuckles', 'Horton Plains'], correctAnswer: 1, explanation: 'Pidurutalagala is the highest mountain in Sri Lanka' },
            { questionText: 'Which ocean surrounds Sri Lanka?', options: ['Atlantic', 'Pacific', 'Indian', 'Arctic'], correctAnswer: 2, explanation: 'Sri Lanka is surrounded by the Indian Ocean' }
          ]
        }
      ],
      assignments: [
        { title: 'Map Project', description: 'Create a detailed map of Sri Lanka', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), totalMarks: 50 }
      ]
    },
    {
      instructor: instructors[4],
      title: 'Business Studies - Grade 11',
      description: 'Introduction to business, economics, and entrepreneurship',
      subject: 'Business',
      grade: 11,
      thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
      lessons: [
        { title: 'Introduction to Business', description: 'What is business and types of businesses', duration: 45, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
        { title: 'Marketing Basics', description: 'Understanding marketing and advertising', duration: 50, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
        { title: 'Entrepreneurship', description: 'Starting your own business', duration: 55, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' }
      ],
      quizzes: [
        {
          title: 'Business Basics Quiz',
          description: 'Test your business knowledge',
          questions: [
            { questionText: 'What are the 4 Ps of marketing?', options: ['Product, Price, Place, Promotion', 'People, Process, Product, Price', 'Plan, Product, Price, Place', 'None'], correctAnswer: 0, explanation: 'The 4 Ps are Product, Price, Place, and Promotion' },
            { questionText: 'What is an entrepreneur?', options: ['A manager', 'A business owner who takes risks', 'An employee', 'A customer'], correctAnswer: 1, explanation: 'An entrepreneur is someone who starts and runs a business, taking on financial risks' }
          ]
        }
      ],
      assignments: [
        { title: 'Business Plan', description: 'Create a simple business plan', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), totalMarks: 100 }
      ]
    }
  ];
  
  const createdCourses = [];
  
  for (const courseData of coursesData) {
    // Create course
    const course = await Course.create({
      title: courseData.title,
      description: courseData.description,
      instructorId: courseData.instructor._id,
      category: courseData.subject,
      subject: courseData.subject,
      grade: courseData.grade,
      thumbnail: courseData.thumbnail,
      price: 0,
      currency: 'FREE',
      isFree: true,
      isPublished: true,
      tags: [courseData.subject.toLowerCase(), `grade-${courseData.grade}`, 'o-level']
    });
    
    // Create lessons
    const lessons = [];
    for (const lessonData of courseData.lessons) {
      const lesson = await Lesson.create({
        ...lessonData,
        courseId: course._id,
        order: lessons.length + 1
      });
      lessons.push(lesson);
    }
    
    // Create quizzes with questions
    const quizzes = [];
    for (const quizData of courseData.quizzes) {
      const quiz = await Quiz.create({
        title: quizData.title,
        description: quizData.description,
        courseId: course._id,
        timeLimit: 30,
        passingScore: 60,
        totalMarks: quizData.questions.length * 10
      });
      
      // Create questions
      for (const questionData of quizData.questions) {
        await Question.create({
          ...questionData,
          quizId: quiz._id,
          marks: 10
        });
      }
      
      quizzes.push(quiz);
    }
    
    // Create assignments
    const assignments = [];
    for (const assignmentData of courseData.assignments) {
      const assignment = await Assignment.create({
        ...assignmentData,
        courseId: course._id,
        instructorId: courseData.instructor._id
      });
      assignments.push(assignment);
    }
    
    createdCourses.push({ course, lessons, quizzes, assignments });
  }
  
  console.log(`✅ Created ${createdCourses.length} courses with lessons, quizzes, and assignments`);
  return createdCourses;
};

// Enroll students and create activity data
const createEnrollmentsAndActivity = async (students, courses) => {
  console.log('\n📝 Creating enrollments and activity data...');
  
  let enrollmentCount = 0;
  let progressCount = 0;
  let quizAttemptCount = 0;
  let submissionCount = 0;
  
  // Each student enrolls in 3-4 courses
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const numCourses = 3 + (i % 2); // 3 or 4 courses
    
    for (let j = 0; j < numCourses && j < courses.length; j++) {
      const { course, lessons, quizzes, assignments } = courses[(i + j) % courses.length];
      
      // Create enrollment
      const enrollment = await Enrollment.create({
        userId: student._id,
        courseId: course._id,
        enrolledAt: new Date(Date.now() - (30 - i * 5) * 24 * 60 * 60 * 1000), // Staggered enrollment
        progress: 0,
        completionPercentage: 0
      });
      enrollmentCount++;
      
      // Create progress for lessons (varying completion) - SPREAD OVER LAST 7 DAYS
      const lessonsToComplete = Math.floor(lessons.length * (0.4 + Math.random() * 0.6));
      for (let k = 0; k < lessonsToComplete; k++) {
        // Spread activities over last 7 days
        const daysAgo = Math.floor(Math.random() * 7);
        await Progress.create({
          userId: student._id,
          courseId: course._id,
          lessonId: lessons[k]._id,
          completed: true,
          watchTime: lessons[k].duration * 60,
          lastWatchedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
        });
        progressCount++;
      }
      
      // Create quiz attempts (more students take quizzes) - SPREAD OVER LAST 7 DAYS
      if (quizzes.length > 0 && Math.random() > 0.2) {
        const quiz = quizzes[0];
        const questions = await Question.find({ quizId: quiz._id });
        const score = 60 + Math.floor(Math.random() * 40); // 60-100%
        const daysAgo = Math.floor(Math.random() * 7);
        
        await QuizAttempt.create({
          userId: student._id,
          quizId: quiz._id,
          courseId: course._id,
          answers: questions.map(q => ({ 
            questionId: q._id, 
            selectedAnswer: q.correctAnswer,
            isCorrect: true
          })),
          score: score,
          percentage: score,
          passed: true,
          timeTaken: 15 + Math.floor(Math.random() * 10), // 15-25 minutes
          attemptedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
        });
        quizAttemptCount++;
      }
      
      // Create assignment submissions - SPREAD OVER LAST 7 DAYS
      if (assignments.length > 0 && Math.random() > 0.3) {
        const daysAgo = Math.floor(Math.random() * 7);
        await AssignmentSubmission.create({
          assignmentId: assignments[0]._id,
          userId: student._id,
          courseId: course._id,
          content: 'Sample submission content',
          submittedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
          status: Math.random() > 0.5 ? 'graded' : 'submitted',
          grade: Math.random() > 0.5 ? 70 + Math.floor(Math.random() * 30) : null
        });
        submissionCount++;
      }
      
      // Update enrollment progress
      const completionPercentage = Math.floor((lessonsToComplete / lessons.length) * 100);
      await Enrollment.findByIdAndUpdate(enrollment._id, {
        progress: lessonsToComplete,
        completionPercentage: completionPercentage
      });
    }
  }
  
  console.log(`✅ Created ${enrollmentCount} enrollments`);
  console.log(`✅ Created ${progressCount} lesson progress records`);
  console.log(`✅ Created ${quizAttemptCount} quiz attempts`);
  console.log(`✅ Created ${submissionCount} assignment submissions`);
};

// Create gamification data
const createGamificationData = async (students) => {
  console.log('\n🎮 Creating gamification data...');
  
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const points = 100 + i * 150; // Varying points
    const level = Math.floor(points / 100);
    
    // Create activity history for last 7 days
    const activityHistory = [];
    for (let day = 6; day >= 0; day--) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      date.setHours(0, 0, 0, 0);
      
      activityHistory.push({
        date: date,
        activities: Math.floor(Math.random() * 5) + 1 // 1-5 activities per day
      });
    }
    
    await UserGamification.create({
      userId: student._id,
      totalPoints: points,
      level: level,
      currentLevelPoints: points % 100,
      pointsToNextLevel: 100,
      rank: level >= 5 ? 'Scholar' : level >= 3 ? 'Learner' : 'Beginner',
      badges: level >= 3 ? [
        { badgeId: 'first_lesson', name: 'First Steps', description: 'Complete your first lesson', icon: 'school-outline' }
      ] : [],
      stats: {
        lessonsCompleted: 5 + i * 3,
        quizzesCompleted: 2 + i,
        assignmentsSubmitted: 1 + i,
        discussionsCreated: i,
        repliesPosted: i * 2,
        coursesCompleted: i > 2 ? 1 : 0,
        perfectQuizzes: i > 1 ? 1 : 0,
        daysActive: 3 + i
      },
      activityHistory: activityHistory,
      lastActivityDate: new Date()
    });
  }
  
  console.log(`✅ Created gamification data for ${students.length} students`);
};

// Create streak data
const createStreakData = async (students) => {
  console.log('\n🔥 Creating streak data...');
  
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    
    // Varying streaks: 0-7 days
    const currentStreak = Math.floor(Math.random() * 8); // 0-7
    const longestStreak = currentStreak + Math.floor(Math.random() * 5); // Longest is always >= current
    const totalActiveDays = 10 + i * 5; // 10, 15, 20, 25, 30
    
    // Last activity date based on streak
    let lastActivityDate;
    if (currentStreak > 0) {
      // If has streak, last activity was today or yesterday
      lastActivityDate = new Date();
      if (Math.random() > 0.5) {
        lastActivityDate.setDate(lastActivityDate.getDate() - 1); // Yesterday
      }
    } else {
      // No streak, last activity was 2-5 days ago
      lastActivityDate = new Date();
      lastActivityDate.setDate(lastActivityDate.getDate() - (2 + Math.floor(Math.random() * 4)));
    }
    
    await Streak.create({
      userId: student._id,
      currentStreak: currentStreak,
      longestStreak: longestStreak,
      lastActivityDate: lastActivityDate,
      totalActiveDays: totalActiveDays
    });
  }
  
  console.log(`✅ Created streak data for ${students.length} students`);
};

// Create discussions
const createDiscussions = async (students, courses) => {
  console.log('\n💬 Creating discussions...');
  
  const discussionTopics = [
    { title: 'Need help with this topic', content: 'Can someone explain this concept in simpler terms?' },
    { title: 'Study tips?', content: 'What are your best study strategies for this subject?' },
    { title: 'Exam preparation', content: 'How should we prepare for the upcoming exam?' },
    { title: 'Clarification needed', content: 'I did not understand the last lesson. Can someone help?' },
    { title: 'Additional resources', content: 'Does anyone have extra practice problems?' }
  ];
  
  let discussionCount = 0;
  let replyCount = 0;
  
  for (const { course } of courses) {
    // Create 2-3 discussions per course
    const numDiscussions = 2 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < numDiscussions; i++) {
      const topic = discussionTopics[i % discussionTopics.length];
      const author = students[Math.floor(Math.random() * students.length)];
      
      const discussion = await Discussion.create({
        title: topic.title,
        content: topic.content,
        userId: author._id,
        courseId: course._id,
        category: 'question',
        tags: [course.category ? course.category.toLowerCase() : 'general'],
        createdAt: new Date(Date.now() - (20 - i * 3) * 24 * 60 * 60 * 1000)
      });
      discussionCount++;
      
      // Create 1-3 replies per discussion
      const numReplies = 1 + Math.floor(Math.random() * 3);
      for (let j = 0; j < numReplies; j++) {
        const replier = students[Math.floor(Math.random() * students.length)];
        await Reply.create({
          discussionId: discussion._id,
          userId: replier._id,
          content: 'Here is my answer to your question. Hope this helps!',
          createdAt: new Date(Date.now() - (18 - i * 3 - j) * 24 * 60 * 60 * 1000)
        });
        replyCount++;
      }
    }
  }
  
  console.log(`✅ Created ${discussionCount} discussions`);
  console.log(`✅ Created ${replyCount} replies`);
};

// Main execution
const main = async () => {
  try {
    console.log('🚀 Starting database reset and seed...\n');
    
    await connectDB();
    await clearAllData();
    
    const { students, instructors, admin } = await createUsers();
    await createInstructorProfiles(instructors);
    await createStudentProfiles(students);
    
    const courses = await createCourses(instructors);
    await createEnrollmentsAndActivity(students, courses);
    await createGamificationData(students);
    await createStreakData(students);
    await createDiscussions(students, courses);
    
    console.log('\n✅ Database reset and seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Students: ${students.length}`);
    console.log(`   - Instructors: ${instructors.length}`);
    console.log(`   - Courses: ${courses.length}`);
    console.log(`   - Admin: 1`);
    console.log('\n🔐 Login Credentials:');
    console.log('   Students: kasun@student.lk, nimali@student.lk, etc.');
    console.log('   Instructors: nimal@teacher.lk, chamari@teacher.lk, etc.');
    console.log('   Admin: admin@eduflow.lk');
    console.log('   Password (all): password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

main();
