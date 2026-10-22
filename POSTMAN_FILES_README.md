# 📌 Postman Collection Files Location

## 📂 Files Created

All files are in the **project root directory**:

```
c:\Tinku Kumar\Projects\GulyFame\
```

### Postman Files (Ready to Import)

1. **Gully_Fame_Admin_APIs.postman_collection.json**
   - Contains all 23 API requests
   - Organized in folders by feature
   - Auto-token saving
   - File upload support

2. **Gully_Fame_Admin_Environment.postman_environment.json**
   - Contains all environment variables
   - Base URL, token, IDs
   - Default values ready to use

### Documentation Files

3. **POSTMAN_SETUP_GUIDE.md**
   - Detailed import instructions
   - Step-by-step workflows
   - Troubleshooting guide

4. **POSTMAN_QUICK_REFERENCE.md**
   - Quick reference card
   - All endpoints at a glance
   - Pro tips & tricks

5. **QUICK_TEST_GUIDE.md**
   - curl command examples
   - Frontend integration code
   - Testing instructions

6. **API_DOCUMENTATION.md**
   - Complete API reference
   - Request/response examples
   - Error handling

7. **IMPLEMENTATION_SUMMARY.md**
   - What was implemented
   - Tech stack details
   - Database models

---

## 🎯 Quick Start (3 Steps)

### Step 1: Open Postman
Launch Postman application

### Step 2: Import Collection
```
Click: Import → Upload Files
Select: Gully_Fame_Admin_APIs.postman_collection.json
```

### Step 3: Import Environment
```
Click: Import → Upload Files
Select: Gully_Fame_Admin_Environment.postman_environment.json
```

**Done!** ✅ You're ready to test APIs

---

## 🔗 Collection Contents Summary

```
Gully Fame Admin APIs
│
├── 🔐 Authentication (1)
│   └── Admin Login
│
├── 🎨 App Branding (3)
│   ├── Get App Branding
│   ├── Update Logo
│   └── Update Splash Screen
│
├── 🖼️ Banners (4)
│   ├── Create Banner
│   ├── List Banners
│   ├── Update Banner
│   └── Delete Banner
│
├── 🏷️ Categories (7)
│   ├── Create Dance
│   ├── Create Music
│   ├── Create Comedy
│   ├── Create Cooking
│   ├── List Categories
│   ├── Toggle Status
│   └── Delete Category
│
└── 📄 Static Content (8)
    ├── Get/Update Competition Rules
    ├── Get/Update Terms & Conditions
    ├── Get/Update Privacy Policy
    └── Get/Update About Us
```

---

## 📋 How to Use

### Basic Flow
```
1. Login (Admin Login)
   ↓
2. Create Categories
   ↓
3. Create Banners
   ↓
4. Update Content
   ↓
5. Get Branding
```

### File Structure in Postman
```
After import, you'll see:

Collections (Left Panel)
└── Gully Fame Admin APIs
    ├── Authentication
    │   └── Admin Login
    ├── App Branding
    │   ├── Get App Branding
    │   ├── Update App Branding (Logo)
    │   └── Update App Branding (Splash Screen)
    ├── Banners
    │   ├── Create Banner
    │   ├── List Banners
    │   ├── Update Banner
    │   └── Delete Banner
    ├── Categories
    │   ├── Create Category - Dance
    │   ├── Create Category - Music
    │   ├── Create Category - Comedy
    │   ├── Create Category - Cooking
    │   ├── List Categories
    │   ├── Toggle Category Status
    │   └── Delete Category
    └── Static Content
        ├── Get Competition Rules
        ├── Update Competition Rules
        ├── Get Terms & Conditions
        ├── Update Terms & Conditions
        ├── Get Privacy Policy
        ├── Update Privacy Policy
        ├── Get About Us
        └── Update About Us
```

---

## 🎯 Key Features

✅ **23 Complete Requests** - All admin endpoints
✅ **Organized Folders** - Easy navigation
✅ **Auto Authentication** - Token auto-saved
✅ **File Upload Support** - Test images directly
✅ **Smart Variables** - Reusable across requests
✅ **Test Scripts** - Automated validation
✅ **Error Handling** - Clear error messages
✅ **Documentation** - Inline request descriptions

---

## 🌍 Server Configuration

Before testing, make sure:

```
✅ Server running: npm run start
✅ Port: 3552
✅ Database: Connected
✅ Redis: Connected
```

Check terminal output:
```
service listening on port 3552
connected to database
Connected to Redis server
```

---

## 📱 Environment Setup

After importing environment, you'll have:

| Variable | Value |
|----------|-------|
| base_url | http://localhost:3552/v1/api |
| token | (auto-filled after login) |
| admin_email | admin@gullyfame.com |
| admin_password | admin123 |
| banner_id | (auto-filled) |
| category_id | (auto-filled) |

---

## 🧪 Testing Workflow

### Test Scenario 1: Complete Admin Setup
```
1. Login
2. Create 4 categories
3. Create banner with images
4. Update all content pages
5. Get branding info
```

### Test Scenario 2: Banner Management
```
1. Login
2. Create banner
3. List banners
4. Update banner
5. Delete banner
```

### Test Scenario 3: Category Management
```
1. Login
2. Create categories
3. List categories
4. Update category
5. Delete category
```

---

## 📝 Sample Response

When you run **Admin Login**, you'll see:

```json
{
  "rCode": 1,
  "msg": "login_success",
  "rData": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "507f1f77bcf86cd799439011",
      "email": "admin@gullyfame.com",
      "role": "Admin"
    }
  }
}
```

✅ Token is automatically saved!

---

## 🔄 Variables Used in Requests

All requests automatically use:
```
Authorization: Bearer {{token}}
Base URL: {{base_url}}
IDs: {{banner_id}}, {{category_id}}
```

No manual token copying needed!

---

## 💡 Pro Tips

1. **Use Postman Runner** to execute multiple requests in sequence
2. **Check Console** (Cmd+Alt+C) for request/response details
3. **Use Variables** in custom requests you create
4. **Export Results** as HTML/JSON for reporting
5. **Create Custom Tests** for your specific needs

---

## 🐛 Troubleshooting

### "invalid_token" Error
→ Run Admin Login request first

### "Cannot find module" in server
→ Check MongoDB is running

### File upload fails
→ Use file icon, not text field

### 404 errors on update
→ Get ID from List request first

---

## 📚 Related Documentation

- **POSTMAN_SETUP_GUIDE.md** - Detailed setup instructions
- **POSTMAN_QUICK_REFERENCE.md** - Quick lookup reference
- **QUICK_TEST_GUIDE.md** - Testing examples
- **API_DOCUMENTATION.md** - Complete API details
- **IMPLEMENTATION_SUMMARY.md** - Implementation overview

---

## ✅ Checklist

Before testing:
- [ ] Server running (`npm run start`)
- [ ] Postman installed and open
- [ ] Collection imported
- [ ] Environment imported
- [ ] Environment selected (top-right)
- [ ] Ready to test! 🚀

---

## 📞 Need Help?

1. Read **POSTMAN_SETUP_GUIDE.md** for detailed instructions
2. Check **POSTMAN_QUICK_REFERENCE.md** for endpoints
3. Review **API_DOCUMENTATION.md** for technical details
4. Check server logs for errors

---

Happy Testing! 🎉

All files are ready to use. Just import the two JSON files and you're all set!

