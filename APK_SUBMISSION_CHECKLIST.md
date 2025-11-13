# APK Submission Checklist

## ✅ Before Submitting Your APK

### 1. Deploy Backend to Vercel
- [ ] Backend deployed to Vercel
- [ ] Backend URL tested and working
- [ ] Environment variables set (MONGO_URI, JWT_SECRET)
- [ ] Backend accessible from: `https://your-project.vercel.app/api`

### 2. APK Configuration
- [ ] APK built and tested
- [ ] Backend URL documented for lecturer
- [ ] App prompts for backend URL on first launch (or pre-configured)

### 3. Documentation for Lecturer
- [ ] Backend URL provided: `https://your-project.vercel.app/api`
- [ ] Instructions on how to enter URL in app
- [ ] Test account credentials (if needed)

### 4. Testing
- [ ] Tested APK installation
- [ ] Tested backend connection from phone
- [ ] Tested sign up / login
- [ ] Tested core features (map, reports, routes, notifications)

---

## 📋 What to Give Your Lecturer

1. **APK File:** `app-release.apk` (or your APK filename)
2. **Backend URL:** `https://your-project.vercel.app/api`
3. **Instructions:**
   - Install APK
   - Open app
   - Enter backend URL when prompted
   - Test connection
   - Sign up and test features

---

## ⚠️ Important Notes

- **Backend MUST be deployed to cloud** (Vercel, Railway, etc.)
- **Cannot use localhost or localtunnel** - these require your computer running
- **MongoDB MUST be cloud** (MongoDB Atlas) - not local MongoDB
- **Backend must be accessible 24/7** for testing

---

## 🚀 Quick Deploy Commands

**Deploy to Vercel:**
1. Go to https://vercel.com
2. Sign up/login
3. Create new project
4. Upload `server` folder
5. Add environment variables
6. Deploy

**See:** `DEPLOY_VERCEL_WEB.md` for detailed steps

---

## ✅ Final Check

Before submitting, verify:
- [ ] Backend URL works: `curl https://your-project.vercel.app/api`
- [ ] APK installs on Android device
- [ ] App connects to backend successfully
- [ ] All features work end-to-end

**You're ready to submit!** 🎉

