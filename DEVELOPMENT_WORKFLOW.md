# 🔧 Development Workflow After Render Deployment

## Overview

After deploying to Render, you have **TWO environments**:
1. **Local Development** - Your computer (fast, for coding)
2. **Production** - Render.com (stable, for testing/demo)

---

## 🎯 Recommended Workflow

### Daily Development:

```
┌─────────────────────────────────────────┐
│  1. Code on Local Backend               │
│     - Fast reload                       │
│     - Instant changes                   │
│     - No deployment wait                │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  2. Test on Local                       │
│     - Run: dev-local.bat                │
│     - Test features                     │
│     - Fix bugs                          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  3. Push to GitHub                      │
│     - git add .                         │
│     - git commit -m "message"           │
│     - git push                          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  4. Auto-Deploy to Render               │
│     - Render detects push               │
│     - Builds automatically              │
│     - Deploys in 2-3 minutes            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  5. Test on Production                  │
│     - Run: dev-production.bat           │
│     - Test with production backend      │
│     - Share with team                   │
└─────────────────────────────────────────┘
```

---

## 🚀 Quick Start Commands

### Option 1: Use Helper Scripts (EASIEST)

**Local Development:**
```bash
# Double-click or run:
dev-local.bat
```
- Starts local backend
- Starts frontend with local config
- App connects to your computer

**Production Testing:**
```bash
# Double-click or run:
dev-production.bat
```
- Starts frontend with production config
- App connects to Render
- No local backend needed

### Option 2: Manual Commands

**Local Development:**
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
copy .env.development .env.local
npm start
```

**Production Testing:**
```bash
# Terminal: Frontend only
cd frontend
copy .env.production .env.local
npm start
```

---

## 📁 Environment Files

### `.env.local` (Active Config)
```env
# Currently active configuration
# This file changes based on mode
EXPO_PUBLIC_API_URL=http://10.214.148.69:5000/api
```

### `.env.development` (Local Backend)
```env
# Local development configuration
EXPO_PUBLIC_API_URL=http://10.214.148.69:5000/api
EXPO_PUBLIC_ENV=development
```

### `.env.production` (Render Backend)
```env
# Production configuration
EXPO_PUBLIC_API_URL=https://eduflow-backend.onrender.com/api
EXPO_PUBLIC_ENV=production
```

---

## 🔄 Switching Between Modes

### Method 1: Use Scripts (Recommended)
```bash
# Local mode
dev-local.bat

# Production mode
dev-production.bat
```

### Method 2: Manual Switch
1. Open `frontend/.env.local`
2. Change the URL:
   ```env
   # For local:
   EXPO_PUBLIC_API_URL=http://10.214.148.69:5000/api
   
   # For production:
   EXPO_PUBLIC_API_URL=https://eduflow-backend.onrender.com/api
   ```
3. Restart frontend: `npm start`
4. Reload app (shake phone → Reload)

### Method 3: npm Scripts
```bash
# Local mode
cd frontend
npm run start:dev

# Production mode
cd frontend
npm run start:prod
```

---

## 💡 Development Scenarios

### Scenario 1: Adding New Feature

**Steps:**
1. Run `dev-local.bat`
2. Code the feature
3. Test locally
4. When working:
   ```bash
   git add .
   git commit -m "Add new feature"
   git push
   ```
5. Wait 2-3 minutes for Render deployment
6. Run `dev-production.bat` to test on production
7. Share production URL with team

**Time:** Instant local testing, 2-3 min for production

### Scenario 2: Fixing Bug

**Steps:**
1. Run `dev-local.bat`
2. Reproduce bug locally
3. Fix the bug
4. Test fix locally
5. Push to GitHub
6. Auto-deploys to Render
7. Verify fix on production

**Time:** Instant local fix, 2-3 min for production

### Scenario 3: Testing with Team

**Steps:**
1. Ensure latest code is on Render
2. Everyone runs `dev-production.bat`
3. Everyone tests same backend
4. No network issues
5. Consistent data

**Time:** Instant for everyone

### Scenario 4: Demo/Presentation

**Steps:**
1. Push latest code to GitHub
2. Wait for Render deployment
3. Run `dev-production.bat`
4. App uses production backend
5. Reliable, no local server needed

**Time:** 2-3 min deployment, then ready

---

## 🎨 Best Practices

### ✅ DO:

1. **Develop Locally First**
   - Faster iteration
   - Instant feedback
   - No deployment wait

2. **Test on Production Before Sharing**
   - Verify deployment worked
   - Check all features
   - Ensure stability

3. **Use Git Branches**
   ```bash
   # Create feature branch
   git checkout -b feature/new-feature
   
   # Develop and test locally
   # ...
   
   # Merge to main when ready
   git checkout main
   git merge feature/new-feature
   git push
   ```

4. **Keep .env Files Updated**
   - Update IP if it changes
   - Update Render URL after deployment
   - Commit .env.development and .env.production

5. **Use Production for Demos**
   - More reliable
   - No network issues
   - Professional

### ❌ DON'T:

1. **Don't Develop Directly on Production**
   - Slow feedback loop
   - Wait for deployment each change
   - Can break for others

2. **Don't Commit .env.local**
   - Already in .gitignore
   - Contains active config
   - Changes frequently

3. **Don't Share Local IP**
   - Only works on your WiFi
   - Changes when computer restarts
   - Use production URL instead

---

## 🔍 Troubleshooting

### Local Backend Not Working?

**Check:**
```bash
# 1. Is backend running?
# Look for: "Server running in development mode on port 5000"

# 2. Check IP address
ipconfig
# Look for IPv4 Address

# 3. Update .env.development if IP changed
# EXPO_PUBLIC_API_URL=http://[NEW_IP]:5000/api

# 4. Restart frontend
cd frontend
npm start
```

### Production Backend Not Working?

**Check:**
1. Go to Render dashboard
2. Check deployment status
3. View logs for errors
4. Verify environment variables

**Test:**
```bash
# From browser or Postman:
https://eduflow-backend.onrender.com/health

# Should return:
{"success":true,"message":"Server is running"}
```

### App Not Connecting?

**Steps:**
1. Check which mode you're in:
   - Look at `frontend/.env.local`
2. Verify URL is correct
3. Restart frontend
4. Reload app (shake → Reload)
5. Check backend is running (local or Render)

---

## 📊 Comparison

| Aspect | Local Development | Production (Render) |
|--------|------------------|---------------------|
| **Speed** | ⚡ Instant | 🐢 2-3 min deploy |
| **Reliability** | ⚠️ Network dependent | ✅ Always available |
| **Team Access** | ❌ Same WiFi only | ✅ Anyone, anywhere |
| **Data** | 🔄 Test data | 📊 Real/demo data |
| **Best For** | Coding, debugging | Testing, demos |

---

## 🎯 Recommended Setup

### For Solo Development:
```
90% Local Development (dev-local.bat)
10% Production Testing (dev-production.bat)
```

### For Team Development:
```
70% Local Development (dev-local.bat)
30% Production Testing (dev-production.bat)
```

### For Demos/Presentations:
```
100% Production (dev-production.bat)
```

---

## 📝 Quick Reference

### Start Local Development:
```bash
dev-local.bat
# or
cd backend && npm start
cd frontend && npm run start:dev
```

### Start Production Testing:
```bash
dev-production.bat
# or
cd frontend && npm run start:prod
```

### Deploy to Production:
```bash
git add .
git commit -m "Your message"
git push
# Wait 2-3 minutes for auto-deployment
```

### Switch Modes:
```bash
# Edit frontend/.env.local
# Change EXPO_PUBLIC_API_URL
# Restart frontend
# Reload app
```

---

## 🚀 Summary

**Development Workflow:**
1. Code locally (fast)
2. Test locally (instant)
3. Push to GitHub (when ready)
4. Auto-deploy to Render (2-3 min)
5. Test on production (reliable)
6. Share with team (production URL)

**Key Files:**
- `frontend/.env.local` - Active config
- `frontend/.env.development` - Local backend
- `frontend/.env.production` - Render backend
- `dev-local.bat` - Start local mode
- `dev-production.bat` - Start production mode

**Remember:**
- Develop locally for speed
- Test on production before sharing
- Use production for demos
- Push to GitHub to deploy

Happy coding! 🎉
