# 🎓 EduFlow - O/L Education Platform

A comprehensive mobile learning platform for Grade 6-11 students preparing for O/L examinations in Sri Lanka. Built with React Native (Expo) and Node.js.

## 👥 Group Details - WE-IT-22

| IT Number  | Name      Module     | Responsibilities 

| IT24104053 | Lakruwan V.                | Course & Content Management System                                                   
| IT24100464 | Danapala M.G.U.N           | User and discussion & feedback  Management
System                  |                     
| IT24102890 | Thalpawila T. V. K. D. N   | Assessment & Evaluation Management System                          |                 
| IT24102897 | Rambusinghe Vithange P.M   | Instructor Management System                          |                                
| IT24103975 | Theertha H.A.S             | Learning Analytics & progress management System                          |            
| IT24103168 | Dolaphilla D. T. S. K      | Notification & Engagement Management System                          |                

## 🔗 Repository

**GitHub**: [https://github.com/Umindu-Nimsara/Eduflow.git](https://github.com/Umindu-Nimsara/Eduflow.git)

## 📋 Features

### For Students (Grade 6-11)
- Browse 108 O/L courses across 18 subjects
- Filter courses by grade (6-11) and subject
- FREE enrollment in all courses
- Watch video lessons and read study materials
- Track learning progress and maintain streaks
- Take quizzes and submit assignments
- Earn certificates upon course completion
- Participate in course discussions
- Receive notifications and announcements

**18 O/L Subjects Available:**
- Languages: Sinhala, Tamil, English
- Core: Mathematics, Science, History, Geography
- Civic Education
- Religion: Buddhism, Christianity, Hinduism, Islam
- Health & Physical Education
- ICT (Information & Communication Technology)
- Arts: Art, Music, Dancing, Drama

### For Instructors
- Create and manage courses
- Upload video lessons and documents
- Create quizzes and assignments
- Grade student submissions
- View course analytics
- Manage course announcements
- Monitor student progress

### For Admins
- User management (students, instructors)
- Course moderation
- System analytics
- Content reports management
- Platform announcements

## 🛠️ Tech Stack

### Frontend (Mobile App)
- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **State Management**: Context API
- **HTTP Client**: Axios
- **UI Components**: Custom components with React Native
- **Media**: Expo Image Picker, Document Picker

### Backend (API Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (Access & Refresh Tokens)
- **File Storage**: Cloudinary
- **File Upload**: Multer

## 📁 Project Structure

```
eduflow/
├── backend/              # Node.js API server
│   ├── src/
│   │   ├── config/      # Database & Cloudinary config
│   │   ├── controllers/ # Route controllers
│   │   ├── middleware/  # Auth & validation middleware
│   │   ├── models/      # MongoDB models
│   │   ├── routes/      # API routes
│   │   ├── seeders/     # Database seeders
│   │   ├── utils/       # Helper utilities
│   │   └── server.js    # Entry point
│   ├── uploads/         # Local file uploads (if not using Cloudinary)
│   ├── .env             # Environment variables
│   └── package.json
│
└── frontend/            # React Native mobile app
    ├── src/
    │   ├── components/  # Reusable components
    │   ├── constants/   # API URLs, colors, etc.
    │   ├── context/     # React Context (Auth, etc.)
    │   ├── navigation/  # Navigation setup
    │   ├── screens/     # App screens
    │   ├── services/    # API services
    │   └── utils/       # Helper utilities
    ├── .env.local       # Environment variables
    └── package.json

```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (for file uploads)
- Expo Go app on your mobile device

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
# Copy the example file
cp .env.example .env

# Or on Windows:
copy .env.example .env
```

4. Edit `.env` file and configure:

**MongoDB Atlas Setup:**
- Go to https://www.mongodb.com/cloud/atlas
- Create a free cluster
- Get your connection string
- Update `MONGODB_URI` in `.env`
- Add `0.0.0.0/0` to IP whitelist (Network Access)

**Cloudinary Setup:**
- Go to https://cloudinary.com/
- Sign up for free account
- Get credentials from Dashboard
- Update Cloudinary variables in `.env`
- Create an unsigned upload preset named "EDUFLOW"

**JWT Secrets:**
- Generate secure random strings (min 32 chars)
- Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Update `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`

5. Start the server:
```bash
npm start
```

Server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file from example:
```bash
# Copy the example file
cp .env.example .env.local

# Or on Windows:
copy .env.example .env.local
```

4. Find your computer's IP address:

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your WiFi adapter
```

**Mac/Linux:**
```bash
ifconfig
# Look for "inet" under en0 (WiFi)
```

5. Edit `.env.local` and replace `YOUR_COMPUTER_IP` with your actual IP:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
```

6. Start Expo:
```bash
npm start
```

7. Scan QR code with Expo Go app on your phone

**Important:** 
- Ensure your phone and computer are on the same WiFi network!
- If using Android Emulator, use `http://10.0.2.2:5000/api` instead

## 🔐 Default Test Accounts

You can use these accounts to test the system:

- **Admin**: admin@elearning.com / password123
- **Teacher**: teacher@school.lk / teacher123
- **Student**: alice@elearning.com / password123

## 📦 Database Seeding

To populate the database with O/L courses:

```bash
cd backend
node src/seeders/seed-ol-subjects.js
```

This will create:
- 108 O/L courses (18 subjects × 6 grades)
- All courses are FREE for students
- Courses for Grade 6, 7, 8, 9, 10, and 11
- Sinhala descriptions and subject thumbnails
- Ready for teachers to add lessons and quizzes

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/update-profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create course (Instructor)
- `PUT /api/courses/:id` - Update course (Instructor)
- `DELETE /api/courses/:id` - Delete course (Instructor)
- `POST /api/courses/upload` - Upload thumbnail

### Lessons
- `GET /api/lessons` - Get all lessons
- `GET /api/lessons/:id` - Get lesson by ID
- `POST /api/lessons` - Create lesson (Instructor)
- `PUT /api/lessons/:id` - Update lesson (Instructor)
- `DELETE /api/lessons/:id` - Delete lesson (Instructor)
- `POST /api/lessons/upload-video` - Upload video
- `POST /api/lessons/upload-document` - Upload PDF

### Enrollments
- `POST /api/enrollments` - Enroll in course
- `GET /api/enrollments/user/:userId` - Get user enrollments
- `GET /api/enrollments/course/:courseId` - Get course enrollments

### Progress
- `POST /api/progress` - Update lesson progress
- `GET /api/progress/course/:courseId` - Get course progress

### Quizzes & Assignments
- `GET /api/quizzes` - Get quizzes
- `POST /api/quizzes` - Create quiz (Instructor)
- `GET /api/assignments` - Get assignments
- `POST /api/assignments` - Create assignment (Instructor)
- `POST /api/submissions` - Submit assignment

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard stats
- `GET /api/analytics/course/:courseId` - Get course analytics

## 🔧 Troubleshooting

### App won't connect to backend
1. Verify both devices are on the same WiFi network
2. Check your computer's IP address hasn't changed
3. Update `EXPO_PUBLIC_API_URL` in `frontend/.env.local`
4. Restart Expo server: `npm start`
5. Clear Expo Go app data on your phone

### MongoDB connection failed
1. Check MongoDB Atlas IP whitelist
2. Add `0.0.0.0/0` to allow all IPs (development only)
3. Verify connection string in `.env`

### File uploads not working
1. Verify Cloudinary credentials in `.env`
2. Check `USE_LOCAL_STORAGE=false` in `.env`
3. Ensure upload preset exists in Cloudinary dashboard

### Login stuck on loading
1. Clear Expo Go app data
2. Restart app and try again
3. Check backend logs for errors

## 📱 Building for Production

### Android APK
```bash
cd frontend
eas build --platform android
```

### iOS IPA
```bash
cd frontend
eas build --platform ios
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

**WE-IT-22 Group Members:**
- IT24104053 - Lakruwan V.
- IT24104164 - Danapala M.G.U.N 
- IT24102890 - Thalpawila T. V. K. D. N 
- IT24102897 - Rambusinghe Vithange P.M
- IT24103975 - Theertha H.A.S
- IT24103168 - Dolaphilla D. T. S. K 

## 🙏 Acknowledgments

- React Native & Expo teams
- MongoDB & Cloudinary for excellent services
- SLIIT - Sri Lanka Institute of Information Technology
- All contributors and testers

---

**Happy Learning! 🎓**
