# 🎓 Eduflow - O/L Exam Preparation Platform

Complete learning management system for Sri Lankan O/L students (Grades 6-11).

## 📦 Project Structure

```
eduflow/
├── backend/          # Node.js + Express API
└── frontend/         # React Native Mobile App
```

## 🚀 Quick Setup

### Backend Setup

```bash
# 1. Go to backend folder
cd backend

# 2. Install dependencies
npm install

# 3. Create .env file (see backend/README.md)
# Add MongoDB URI, JWT secrets, Cloudinary credentials

# 4. Seed database (optional)
node scripts/reset-and-seed-complete.js

# 5. Start server
npm run dev
```

Backend runs on: `http://localhost:5000`

### Frontend Setup

```bash
# 1. Go to frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Update API URL in src/constants/api.js
# Change to your backend URL

# 4. Start Expo
npx expo start

# 5. Scan QR code with Expo Go app
```

## 📋 Requirements

### Backend
- Node.js (v14+)
- MongoDB Atlas account
- Cloudinary account

### Frontend
- Node.js (v14+)
- Expo Go app (for testing)
- Android Studio (for APK build)

## 🎯 Features

### For Students
- 📚 Browse and enroll in courses
- 📖 Watch video lessons
- 📝 Take quizzes and assignments
- 💬 Participate in discussions
- 🏆 Earn points, badges, and streaks
- 📊 Track learning progress
- 🔔 Receive notifications

### For Teachers
- 👨‍🏫 Create and manage courses
- 📹 Upload video lessons
- 📝 Create assignments and quizzes
- ✅ Grade student submissions
- 📊 View student analytics
- 💬 Moderate discussions
- 📢 Send announcements

### For Admins
- 👨‍💼 Manage users (students, teachers)
- 📊 View platform analytics
- 🔍 Monitor discussions and feedback
- 📢 Manage announcements
- 📋 View audit logs
- 📈 Generate reports

## 📱 Test Accounts

After seeding the database:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@eduflow.lk | password123 |
| Teacher | nimal@teacher.lk | password123 |
| Student | kasun@student.lk | password123 |

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Cloudinary (File Storage)
- Bcrypt (Password Hashing)

### Frontend
- React Native
- Expo
- React Navigation
- Axios
- AsyncStorage

## 🌐 Deployment

### Backend (Render)
1. Push backend to GitHub
2. Create MongoDB Atlas database
3. Setup Cloudinary account
4. Deploy on Render.com
5. Add environment variables

### Frontend (Expo EAS)
1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Configure: `eas build:configure`
4. Build APK: `eas build --platform android --profile preview`

## 📚 Documentation

- **Backend:** See `backend/README.md`
- **Frontend:** See `frontend/README.md`

## 🐛 Troubleshooting

### Backend Issues
- Check MongoDB connection string
- Verify environment variables
- Check port 5000 is not in use

### Frontend Issues
- Update API URL in `src/constants/api.js`
- Clear Expo cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## 📞 Support

For issues or questions:
- Email: umindunimsara394@gmail.com
- GitHub: https://github.com/Umindu-Nimsara

## 📄 License

ISC License

---

**Made with ❤️ for Sri Lankan O/L students**
