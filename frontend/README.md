# 📱 Eduflow Mobile App

React Native mobile application for O/L Exam Preparation Platform.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Update API URL
Edit `src/constants/api.js`:
```javascript
export const API_URL = 'http://YOUR_BACKEND_URL:5000/api';
// For local: http://192.168.1.X:5000/api
// For production: https://your-backend.onrender.com/api
```

### 3. Start Development Server
```bash
npx expo start
```

### 4. Run on Device

**Option 1: Expo Go (Easiest)**
1. Install Expo Go app on your phone
2. Scan QR code from terminal
3. App will open in Expo Go

**Option 2: Android Emulator**
```bash
npx expo start --android
```

**Option 3: iOS Simulator (Mac only)**
```bash
npx expo start --ios
```

## 📦 Build APK

### Using EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure
eas build:configure

# Build APK
eas build --platform android --profile preview
```

### Local Build
```bash
# Build locally (requires Android Studio)
npx expo run:android --variant release
```

## 🎨 Features

- 🔐 User Authentication (Student, Teacher, Admin)
- 📚 Course Management
- 📝 Assignments & Quizzes
- 💬 Discussion Forums
- 🏆 Gamification (Points, Badges, Leaderboard)
- 📊 Progress Tracking
- 🔔 Notifications
- 👨‍🏫 Instructor Dashboard
- 👨‍💼 Admin Panel

## 📋 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@eduflow.lk | password123 |
| Teacher | nimal@teacher.lk | password123 |
| Student | kasun@student.lk | password123 |

## 🛠️ Tech Stack

- React Native
- Expo
- React Navigation
- Axios
- AsyncStorage
- Cloudinary (File Uploads)

## 📱 Screens

- Landing & Onboarding
- Login & Register
- Student Dashboard
- Course List & Details
- Lesson Viewer
- Quiz & Assignments
- Discussion Board
- Gamification Dashboard
- Profile & Settings
- Instructor Dashboard
- Admin Panel

## 🔧 Configuration

### API Configuration
`src/constants/api.js` - Backend API URL

### Colors
`src/constants/colors.js` - App color scheme

### Strings
`src/constants/strings.js` - App text content

## 📞 Support

For issues, contact: umindunimsara394@gmail.com

## 📄 License

ISC License
