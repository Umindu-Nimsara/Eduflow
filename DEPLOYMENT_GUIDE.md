# 🚀 Eduflow Deployment Guide

## Current Issue: Network Error on Video Upload

### Problem:
- Backend running on local IP: `10.214.148.69:5000`
- Mobile app can't connect reliably
- Network errors during file uploads

### Root Cause:
Local IP addresses are:
- ❌ Not accessible outside your WiFi
- ❌ Change when computer restarts
- ❌ Blocked by firewalls
- ❌ Not suitable for production

---

## ✅ SOLUTION 1: Deploy to Render.com (RECOMMENDED)

### Why Render?
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Easy deployment
- ✅ Reliable uptime
- ✅ Accessible from anywhere

### Steps:

#### 1. Prepare Your Code

**A. Update package.json (backend):**
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**B. Create render.yaml in project root:**
```yaml
services:
  - type: web
    name: eduflow-backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: CLOUDINARY_CLOUD_NAME
        value: dm2tqyley
      - key: CLOUDINARY_API_KEY
        value: "988226859331656"
      - key: CLOUDINARY_API_SECRET
        sync: false
```

#### 2. Deploy to Render

1. **Sign up:** https://render.com
2. **Connect GitHub:**
   - New → Web Service
   - Connect your repository
   - Select branch: `main`

3. **Configure:**
   - Name: `eduflow-backend`
   - Environment: `Node`
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Instance Type: `Free`

4. **Add Environment Variables:**
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eduflow
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   CLOUDINARY_CLOUD_NAME=dm2tqyley
   CLOUDINARY_API_KEY=988226859331656
   CLOUDINARY_API_SECRET=your-cloudinary-secret
   ALLOWED_ORIGINS=*
   ```

5. **Deploy!**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Get your URL: `https://eduflow-backend.onrender.com`

#### 3. Update Frontend

**Update frontend/.env.local:**
```env
# Production API
EXPO_PUBLIC_API_URL=https://eduflow-backend.onrender.com/api

# Local development (comment out for production)
# EXPO_PUBLIC_API_URL=http://10.214.148.69:5000/api
```

**Restart frontend:**
```bash
cd frontend
npm start
```

**Reload app:**
- Shake phone
- Tap "Reload"

---

## ✅ SOLUTION 2: Use Ngrok (Quick Testing)

### For Quick Testing Without Deployment:

#### 1. Install Ngrok
```bash
# Download from: https://ngrok.com/download
# Or use chocolatey:
choco install ngrok
```

#### 2. Get Auth Token
1. Sign up: https://dashboard.ngrok.com/signup
2. Get token: https://dashboard.ngrok.com/get-started/your-authtoken
3. Configure:
```bash
ngrok config add-authtoken YOUR_TOKEN
```

#### 3. Start Tunnel
```bash
ngrok http 5000
```

#### 4. Copy URL
You'll see:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:5000
```

#### 5. Update Frontend
```env
EXPO_PUBLIC_API_URL=https://abc123.ngrok-free.app/api
```

#### 6. Restart & Reload
```bash
cd frontend
npm start
```
Then reload app.

### Ngrok Limitations:
- ❌ URL changes every restart (free)
- ❌ 2 hour session limit (free)
- ❌ Need to keep terminal open
- ✅ Good for quick testing only

---

## ✅ SOLUTION 3: Deploy to Railway.app

### Alternative to Render:

#### 1. Sign up: https://railway.app
#### 2. New Project → Deploy from GitHub
#### 3. Add Environment Variables (same as Render)
#### 4. Deploy!

**Railway gives you:**
- Free $5 credit/month
- Automatic deployments
- Easy database setup
- Custom domains

---

## 🔧 Fix Current Network Issue (Temporary)

If you want to keep using local IP:

### 1. Check Firewall
```powershell
# Allow Node.js through firewall
New-NetFirewallRule -DisplayName "Node.js Server" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow
```

### 2. Test Connection
From phone browser, visit:
```
http://10.214.148.69:5000/health
```

Should show:
```json
{"success":true,"message":"Server is running"}
```

### 3. If Still Not Working:
- Restart backend
- Restart frontend
- Reload app
- Check both devices on same WiFi

---

## 📱 For Team Access

### Option 1: Render/Railway (Best)
- Everyone uses: `https://your-app.onrender.com/api`
- Works from anywhere
- No setup needed

### Option 2: Ngrok (Testing)
- Share ngrok URL with team
- They update their .env.local
- URL changes when you restart

### Option 3: Local Network (Not Recommended)
- Only works on same WiFi
- Everyone needs your IP
- IP changes frequently

---

## 🎯 Recommended Approach

**For Development:**
1. Use Ngrok for quick testing
2. Keep backend running locally
3. Share ngrok URL with team

**For Production/Demo:**
1. Deploy to Render.com (FREE)
2. Use production URL in app
3. Reliable and accessible anywhere

**For Final Deployment:**
1. Deploy backend to Render/Railway
2. Deploy frontend to Expo EAS
3. Publish to Play Store/App Store

---

## 📝 Quick Commands

### Deploy to Render:
```bash
# 1. Push to GitHub
git add .
git commit -m "Prepare for deployment"
git push origin main

# 2. Go to render.com and connect repo
# 3. Add environment variables
# 4. Deploy!
```

### Use Ngrok:
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Ngrok
ngrok http 5000

# Terminal 3: Frontend
cd frontend
# Update .env.local with ngrok URL
npm start
```

### Test Locally:
```bash
# Check IP
ipconfig

# Update .env.local
# EXPO_PUBLIC_API_URL=http://[YOUR_IP]:5000/api

# Restart frontend
cd frontend
npm start
```

---

## ❓ Which Solution Should You Use?

| Solution | Best For | Pros | Cons |
|----------|----------|------|------|
| **Render.com** | Production, Team | Free, Reliable, HTTPS | Initial setup |
| **Ngrok** | Quick Testing | Fast, Easy | Temporary URLs |
| **Local IP** | Solo Dev | No setup | Network issues |
| **Railway** | Production | Easy, Fast | Paid after $5 |

**Recommendation:** Deploy to Render.com for best experience! 🚀
