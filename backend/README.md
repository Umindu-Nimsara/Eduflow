# 🎓 Eduflow Backend

O/L Exam Preparation Platform Backend API for Sri Lankan students.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Create a `.env` file in the root directory:

```env
# Server
NODE_ENV=development
PORT=5000

# Database - MongoDB Atlas
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/eduflow?retryWrites=true&w=majority

# JWT Secrets (Generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_ACCESS_SECRET=your_32_character_secret_here
JWT_REFRESH_SECRET=your_different_32_character_secret_here
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Cloudinary (Get from: https://cloudinary.com/console)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=EDUFLOW
USE_LOCAL_STORAGE=false

# CORS
ALLOWED_ORIGINS=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
LOGIN_RATE_LIMIT_MAX=50
```

### 3. Seed Database (Optional)
```bash
node scripts/reset-and-seed-complete.js
```

### 4. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

Server will run on: `http://localhost:5000`

## 📋 Test Accounts (After Seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@eduflow.lk | password123 |
| Teacher | nimal@teacher.lk | password123 |
| Student | kasun@student.lk | password123 |

## 🔗 API Endpoints

- Health Check: `GET /health`
- Login: `POST /api/auth/login`
- Register: `POST /api/auth/register`
- Get Courses: `GET /api/courses`
- Get Profile: `GET /api/users/profile`

## 📦 Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Cloudinary (File Storage)
- Bcrypt (Password Hashing)

## 🌐 Deploy to Render

1. Push to GitHub
2. Create MongoDB Atlas database
3. Setup Cloudinary account
4. Deploy on Render.com
5. Add environment variables

## 📞 Support

For issues, contact: umindunimsara394@gmail.com
