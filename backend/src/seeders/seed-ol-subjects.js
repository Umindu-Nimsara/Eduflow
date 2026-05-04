const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User.model');
const Course = require('../models/Course.model');
const Lesson = require('../models/Lesson.model');

// O/L Subject Categories with Sinhala names
const OL_SUBJECTS = [
  { 
    name: 'Sinhala', 
    sinhala: 'සිංහල',
    description: 'සිංහල භාෂාව හා සාහිත්‍යය',
    thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
    color: '#FF6B6B'
  },
  { 
    name: 'Tamil', 
    sinhala: 'දෙමළ',
    description: 'தமிழ் மொழி மற்றும் இலக்கியம்',
    thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    color: '#4ECDC4'
  },
  { 
    name: 'English', 
    sinhala: 'ඉංග්‍රීසි',
    description: 'English Language and Literature',
    thumbnail: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800',
    color: '#45B7D1'
  },
  { 
    name: 'Mathematics', 
    sinhala: 'ගණිතය',
    description: 'සංඛ්‍යා ගණිතය හා වීජ ගණිතය',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
    color: '#96CEB4'
  },
  { 
    name: 'Science', 
    sinhala: 'විද්‍යාව',
    description: 'භෞතික විද්‍යාව, රසායන විද්‍යාව, ජීව විද්‍යාව',
    thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800',
    color: '#A8E6CF'
  },
  { 
    name: 'History', 
    sinhala: 'ඉතිහාසය',
    description: 'ශ්‍රී ලංකා ඉතිහාසය හා ලෝක ඉතිහාසය',
    thumbnail: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=800',
    color: '#FFD93D'
  },
  { 
    name: 'Geography', 
    sinhala: 'භූගෝල විද්‍යාව',
    description: 'භෞතික හා මානව භූගෝල විද්‍යාව',
    thumbnail: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800',
    color: '#6BCB77'
  },
  { 
    name: 'Civic Education', 
    sinhala: 'පුරවැසි අධ්‍යාපනය',
    description: 'පුරවැසි අයිතිවාසිකම් හා යුතුකම්',
    thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800',
    color: '#FF6B9D'
  },
  { 
    name: 'Buddhism', 
    sinhala: 'බුද්ධ ධර්මය',
    description: 'බුද්ධ ධර්මය හා ඉතිහාසය',
    thumbnail: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800',
    color: '#FFA07A'
  },
  { 
    name: 'Christianity', 
    sinhala: 'ක්‍රිස්තියානි ධර්මය',
    description: 'Christian Religious Studies',
    thumbnail: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800',
    color: '#87CEEB'
  },
  { 
    name: 'Hinduism', 
    sinhala: 'හින්දු ධර්මය',
    description: 'இந்து மத கல்வி',
    thumbnail: 'https://images.unsplash.com/photo-1604608672516-f1b9b1a0e8c2?w=800',
    color: '#FFB347'
  },
  { 
    name: 'Islam', 
    sinhala: 'ඉස්ලාම් ධර්මය',
    description: 'Islamic Religious Studies',
    thumbnail: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800',
    color: '#98D8C8'
  },
  { 
    name: 'Health & Physical Education', 
    sinhala: 'සෞඛ්‍ය හා ශාරීරික අධ්‍යාපනය',
    description: 'සෞඛ්‍ය සම්පන්න ජීවන රටාව',
    thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
    color: '#F7DC6F'
  },
  { 
    name: 'ICT', 
    sinhala: 'තොරතුරු හා සන්නිවේදන තාක්ෂණය',
    description: 'පරිගණක හා තොරතුරු තාක්ෂණය',
    thumbnail: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800',
    color: '#BB8FCE'
  },
  { 
    name: 'Art', 
    sinhala: 'චිත්‍ර කලාව',
    description: 'චිත්‍ර හා නිර්මාණ කලාව',
    thumbnail: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800',
    color: '#F8B195'
  },
  { 
    name: 'Music', 
    sinhala: 'සංගීතය',
    description: 'සංගීත න්‍යාය හා ප්‍රායෝගික',
    thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800',
    color: '#C06C84'
  },
  { 
    name: 'Dancing', 
    sinhala: 'නර්තනය',
    description: 'සාම්ප්‍රදායික හා නූතන නර්තන',
    thumbnail: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=800',
    color: '#F67280'
  },
  { 
    name: 'Drama', 
    sinhala: 'නාට්‍ය',
    description: 'නාට්‍ය කලාව හා රංග ශිල්පය',
    thumbnail: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
    color: '#355C7D'
  }
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

const clearDatabase = async () => {
  try {
    console.log('🗑️  Clearing existing data...');
    await Course.deleteMany({});
    await Lesson.deleteMany({});
    console.log('✅ Database cleared');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
};

const createInstructor = async () => {
  try {
    // Check if instructor exists
    let instructor = await User.findOne({ email: 'teacher@school.lk' });
    
    if (!instructor) {
      const hashedPassword = await bcrypt.hash('teacher123', 10);
      instructor = await User.create({
        name: 'School Teacher',
        email: 'teacher@school.lk',
        password: hashedPassword,
        role: 'instructor',
        mobile: '0771234567'
      });
      console.log('✅ Instructor created: teacher@school.lk / teacher123');
    } else {
      console.log('✅ Using existing instructor');
    }
    
    return instructor;
  } catch (error) {
    console.error('❌ Error creating instructor:', error);
    throw error;
  }
};

const createSubjectCourses = async (instructorId) => {
  try {
    console.log('📚 Creating O/L subject courses...');
    
    const courses = [];
    
    for (const subject of OL_SUBJECTS) {
      // Create course for each grade (6-11)
      for (let grade = 6; grade <= 11; grade++) {
        const course = await Course.create({
          title: `Grade ${grade} - ${subject.name}`,
          description: `${subject.description}\n\nමෙම පාඨමාලාව ${grade} ශ්‍රේණිය සඳහා නිර්මාණය කර ඇත. O/L විභාගයට සූදානම් වීමට අවශ්‍ය සියලුම පාඩම් මෙහි ඇතුළත් වේ.`,
          category: subject.name,
          thumbnail: subject.thumbnail,
          instructorId: instructorId,
          price: 0, // Free for students
          isPublished: true,
          tags: [`Grade ${grade}`, 'O/L', subject.sinhala, 'School']
        });
        
        courses.push(course);
        
        // Create sample lessons
        await Lesson.create({
          courseId: course._id,
          title: `Introduction to ${subject.name}`,
          description: `මූලික සංකල්ප හා හැඳින්වීම`,
          videoUrl: '',
          pdfUrl: '',
          duration: 0,
          orderIndex: 1,
          freePreview: true
        });
        
        // Update lesson count
        await Course.findByIdAndUpdate(course._id, { totalLessons: 1 });
      }
    }
    
    console.log(`✅ Created ${courses.length} subject courses (${OL_SUBJECTS.length} subjects × 6 grades)`);
    return courses;
  } catch (error) {
    console.error('❌ Error creating courses:', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();
    await clearDatabase();
    
    const instructor = await createInstructor();
    await createSubjectCourses(instructor._id);
    
    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Subjects: ${OL_SUBJECTS.length}`);
    console.log(`   - Grades: 6-11 (6 grades)`);
    console.log(`   - Total Courses: ${OL_SUBJECTS.length * 6}`);
    console.log('\n🔐 Login Credentials:');
    console.log('   Teacher: teacher@school.lk / teacher123');
    console.log('   Student: alice@elearning.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
