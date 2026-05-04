# ⚡ Quick Start Guide

## 🎯 Two Modes, One Codebase

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  LOCAL MODE          vs          PRODUCTION MODE        │
│  ───────────                     ────────────────       │
│                                                         │
│  💻 Your Computer                ☁️  Render.com         │
│  ⚡ Fast                         🌍 Accessible          │
│  🏠 WiFi Only                    ✅ Anywhere            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Commands

### Local Development (Daily Coding)
```bash
# Double-click this file:
dev-local.bat

# What it does:
# ✅ Starts local backend
# ✅ Starts frontend (local mode)
# ✅ App connects to your computer
```

### Production Testing (Before Sharing)
```bash
# Double-click this file:
dev-production.bat

# What it does:
# ✅ Starts frontend (production mode)
# ✅ App connects to Render
# ✅ No local backend needed
```

---

## 📋 Daily Workflow

### Morning (Start Coding):
```bash
1. Run: dev-local.bat
2. Code your features
3. Test instantly
```

### Afternoon (Deploy):
```bash
1. git add .
2. git commit -m "Add feature X"
3. git push
4. Wait 2-3 minutes
```

### Evening (Test & Share):
```bash
1. Run: dev-production.bat
2. Test on production
3. Share with team
```

---

## 🔄 Switch Modes

### Currently in Local Mode?
```bash
# Switch to Production:
dev-production.bat
```

### Currently in Production Mode?
```bash
# Switch to Local:
dev-local.bat
```

### After Switching:
```bash
# Reload app:
1. Shake phone
2. Tap "Reload"
```

---

## 🆘 Quick Fixes

### Backend Not Working?
```bash
# Check if running:
# Look for: "Server running on port 5000"

# Restart:
Ctrl+C (in backend terminal)
cd backend
npm start
```

### App Not Connecting?
```bash
# 1. Check .env.local
# 2. Restart frontend
# 3. Reload app (shake → Reload)
```

### IP Changed?
```bash
# 1. Check IP:
ipconfig

# 2. Update .env.development:
EXPO_PUBLIC_API_URL=http://[NEW_IP]:5000/api

# 3. Restart:
dev-local.bat
```

---

## 📁 Important Files

```
frontend/
├── .env.local          ← Active config (changes)
├── .env.development    ← Local backend config
└── .env.production     ← Render backend config

Root/
├── dev-local.bat       ← Start local mode
├── dev-production.bat  ← Start production mode
└── DEVELOPMENT_WORKFLOW.md  ← Full guide
```

---

## 💡 Pro Tips

### ✅ Use Local for:
- Daily coding
- Quick testing
- Debugging
- Fast iteration

### ✅ Use Production for:
- Final testing
- Team collaboration
- Demos
- Presentations

### ✅ Deploy When:
- Feature is complete
- Bug is fixed
- Ready to share
- End of day

---

## 🎯 Remember

```
Code Locally → Test Locally → Push to GitHub → Auto-Deploy → Test Production
    ⚡            ⚡              📤              ⏱️ 2-3min        ✅
```

---

## 📞 Need Help?

1. Read: `DEVELOPMENT_WORKFLOW.md` (detailed guide)
2. Read: `DEPLOYMENT_GUIDE.md` (deployment help)
3. Check: Backend terminal for errors
4. Test: `http://10.214.148.69:5000/health` (local)
5. Test: `https://eduflow-backend.onrender.com/health` (production)

---

## ⚡ TL;DR

**Coding?** → `dev-local.bat`
**Sharing?** → `dev-production.bat`
**Deploying?** → `git push`

That's it! 🎉
