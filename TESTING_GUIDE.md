# 🚀 ClearNext Testing Guide

## ✅ What's Ready:

### **Frontend (HTML Pages):**
- ✅ `index.html` - Welcome/Landing page
- ✅ `login.html` - User login
- ✅ `register.html` - User registration  
- ✅ `user-info-new.html` - Profile setup
- ✅ `journey-duration.html` - Journey duration selection
- ✅ `ai-conversation.html` - AI conversation (fixed!)
- ✅ `tasks.html` - Daily tasks (with Start button!)
- ✅ `daily-reflection.html` - Reflection page (fixed!)
- ✅ `dashboard-new.html` - Progress dashboard

### **Backend (Node.js/Express):**
- ✅ `backend/server.js` - Main server
- ✅ `backend/package.json` - Dependencies
- ✅ User management (guest + registered)
- ✅ Task generation with mood adaptation
- ✅ One-task-per-day enforcement
- ✅ Reflection validation (anti-cheat)
- ✅ Progress tracking & streaks
- ✅ Missed task notifications

## 🛠️ Setup Steps:

### **1. Install MongoDB**
```bash
# Windows: Download and install MongoDB Community Server
# Or use MongoDB Atlas (cloud)
```

### **2. Start Backend**
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
Server runs on: `http://localhost:3000`

### **3. Start Frontend**
```bash
# Use any static server (Python, Node, Live Server)
# Python 3:
python -m http.server 8000

# Node:
npx serve . -p 8000

# Or use VS Code Live Server extension
```
Frontend runs on: `http://localhost:8000`

### **4. Test Flow:**

#### **Complete User Journey:**
1. **Open** `http://localhost:8000`
2. **Click "Get Started"** → Register as guest
3. **Fill profile** (Student/Professional, confusion area)
4. **AI Conversation** → Answer 5 questions
5. **Tasks Page** → Click "Start Today's Task"
6. **Complete Task** → Type response
7. **Daily Reflection** → Fill 3 questions + honesty checkbox
8. **Submit** → See success message
9. **Dashboard** → View progress and stats

#### **Test Backend Features:**
- **One-task-per-day** - Try to generate second task (should be blocked)
- **Time window** - Try before 12AM or after 11:59PM
- **Reflection validation** - Submit very short reflection (should be rejected)
- **Notifications** - Check console for missed task notifications

## 🔍 Testing Checklist:

### **✅ Frontend Tests:**
- [ ] All pages load without errors
- [ ] Navigation works between pages
- [ ] Submit buttons work (reflection, tasks)
- [ ] Forms validate properly
- [ ] Responsive design on mobile

### **✅ Backend Tests:**
- [ ] Guest user creation works
- [ ] Task generation works
- [ ] Task completion saves
- [ ] Reflection validation works
- [ ] Progress tracking updates
- [ ] One-task-per-day enforced

### **✅ Integration Tests:**
- [ ] Frontend talks to backend
- [ ] Data saves to MongoDB
- [ ] User flow completes end-to-end
- [ ] Error handling works

## 🐛 Common Issues & Fixes:

### **MongoDB Connection Error:**
```bash
# Make sure MongoDB is running
# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/clearnext
```

### **CORS Error:**
```bash
# Backend should allow frontend
# Check server.js has cors() middleware
```

### **Token Issues:**
```bash
# Clear browser localStorage
# Check JWT_SECRET in .env
```

### **Submit Button Not Working:**
```bash
# Check browser console for errors
# Verify API endpoints are reachable
```

## 📊 Test Data to Try:

### **User Profiles:**
- **Student + Career + Motivation** → Career-focused tasks
- **Professional + Learning + Time** → Time management tasks
- **Student + Concepts + Motivation** → Concept-building tasks

### **Mood Testing:**
- **Low mood** → Easy, gentle tasks
- **Okay mood** → Medium difficulty
- **Good mood** → Challenging tasks

### **Reflection Testing:**
- **Valid**: 50+ chars, detailed, different sections
- **Invalid**: <50 chars, same content, generic responses

## 🎯 Quick Test Commands:

```bash
# Test backend health
curl http://localhost:3000/api/users/guest

# Test task generation
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/tasks/today

# Test reflection validation
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"learning":"test","feeling":"test","improvement":"test"}' \
     http://localhost:3000/api/task-rules/validate
```

## 🚀 Ready to Test!

Your ClearNext system is **fully functional** with:
- ✅ Complete frontend UI
- ✅ Intelligent backend
- ✅ Database integration
- ✅ Task generation
- ✅ Progress tracking
- ✅ Validation systems
- ✅ Notification system

**Start testing now!** 🎉
