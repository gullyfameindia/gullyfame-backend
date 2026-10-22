# Postman Collection - Quick Reference

## 📦 Files to Import

You now have **2 files** in the project root:

```
c:\Tinku Kumar\Projects\GulyFame\
├── Gully_Fame_Admin_APIs.postman_collection.json  ← Import this first
└── Gully_Fame_Admin_Environment.postman_environment.json  ← Import this second
```

## 🎯 How to Import (3 Simple Steps)

### Step 1: Import Collection
```
Postman → Import → Upload Files → Select "Gully_Fame_Admin_APIs.postman_collection.json"
```

### Step 2: Import Environment
```
Settings (⚙️) → Environments → Import → Select "Gully_Fame_Admin_Environment.postman_environment.json"
```

### Step 3: Select Environment
```
Top Right Dropdown → Select "Gully Fame Admin Environment"
```

---

## 🔄 Recommended Test Flow

### Flow Diagram
```
┌─────────────────────────────────────────────┐
│  1. Admin Login                             │
│  POST /auth/admin/login                     │
│  ↓ (auto-saves token)                       │
├─────────────────────────────────────────────┤
│  2. Create Categories (Dance, Music, etc)   │
│  POST /admin/categories                     │
│  ↓ (first ID auto-saved)                    │
├─────────────────────────────────────────────┤
│  3. List Categories                         │
│  GET /admin/categories                      │
│  ↓                                          │
├─────────────────────────────────────────────┤
│  4. Create Banners                          │
│  POST /admin/banners (with file uploads)    │
│  ↓                                          │
├─────────────────────────────────────────────┤
│  5. Update Static Content                   │
│  POST /admin/content (all 4 types)          │
│  ↓                                          │
├─────────────────────────────────────────────┤
│  6. Update App Branding                     │
│  POST /admin/branding                       │
└─────────────────────────────────────────────┘
```

### Step-by-Step Execution

#### ✅ Step 1: LOGIN
```
Authentication > Admin Login
- Click Send
- ✅ Token automatically saved to {{token}}
- ✅ You're authenticated!
```

#### ✅ Step 2: CREATE CATEGORIES
```
Categories > Create Category - Dance
- Click Send
- Response shows created category

Categories > Create Category - Music
- Click Send

Categories > Create Category - Comedy
- Click Send

Categories > Create Category - Cooking
- Click Send
```

#### ✅ Step 3: LIST CATEGORIES
```
Categories > List Categories
- Click Send
- ✅ First category ID auto-saved to {{category_id}}
- See all 4 categories in response
```

#### ✅ Step 4: TOGGLE CATEGORY
```
Categories > Toggle Category Status
- {{category_id}} auto-filled from previous step
- Body: {"isActive": false}
- Click Send
- Category is now inactive
```

#### ✅ Step 5: CREATE BANNERS
```
Banners > Create Banner
- Click Body tab
- Set title: "Banner 1"
- Set rank: 1
- Add files: mobileView, ipadView, desktopView
- Click Send
```

#### ✅ Step 6: UPDATE CONTENT
```
Static Content > Update Competition Rules
- Click Send
- Body has sample content

Static Content > Update Terms & Conditions
- Click Send

Static Content > Update Privacy Policy
- Click Send

Static Content > Update About Us
- Click Send
```

#### ✅ Step 7: GET BRANDING
```
App Branding > Get App Branding
- Click Send
- See current branding settings
```

---

## 📋 Request Map

### 🔐 Authentication (1 request)
| Request | Method | Endpoint | Purpose |
|---------|--------|----------|---------|
| Admin Login | POST | /auth/admin/login | Get JWT token |

### 🎨 App Branding (3 requests)
| Request | Method | Endpoint | Purpose |
|---------|--------|----------|---------|
| Get App Branding | GET | /admin/branding | Get current logo/splash |
| Update Logo | POST | /admin/branding | Update app logo |
| Update Splash Screen | POST | /admin/branding | Update splash screen |

### 🖼️ Banners (4 requests)
| Request | Method | Endpoint | Purpose |
|---------|--------|----------|---------|
| Create Banner | POST | /admin/banners | Create new banner |
| List Banners | GET | /admin/banners | Get all banners |
| Update Banner | PUT | /admin/banners/:id | Edit banner |
| Delete Banner | DELETE | /admin/banners/:id | Delete banner |

### 🏷️ Categories (7 requests)
| Request | Method | Endpoint | Purpose |
|---------|--------|----------|---------|
| Create Dance | POST | /admin/categories | Create Dance category |
| Create Music | POST | /admin/categories | Create Music category |
| Create Comedy | POST | /admin/categories | Create Comedy category |
| Create Cooking | POST | /admin/categories | Create Cooking category |
| List Categories | GET | /admin/categories | Get all categories |
| Toggle Status | PUT | /admin/categories/:id | Enable/disable category |
| Delete Category | DELETE | /admin/categories/:id | Delete category |

### 📄 Static Content (8 requests)
| Request | Method | Endpoint | Purpose |
|---------|--------|----------|---------|
| Get Rules | GET | /admin/content/COMPETITION_RULES | Get rules |
| Update Rules | POST | /admin/content | Update rules |
| Get Terms | GET | /admin/content/TERMS | Get T&C |
| Update Terms | POST | /admin/content | Update T&C |
| Get Privacy | GET | /admin/content/PRIVACY_POLICY | Get privacy policy |
| Update Privacy | POST | /admin/content | Update privacy policy |
| Get About | GET | /admin/content/ABOUT_US | Get about us |
| Update About | POST | /admin/content | Update about us |

**Total: 23 requests**

---

## 🎯 Key Variables

```
{{base_url}}      = http://localhost:3552/v1/api
{{token}}         = JWT token (auto-filled after login)
{{banner_id}}     = Banner ID (for update/delete)
{{category_id}}   = Category ID (for update/delete)
{{admin_email}}   = admin@gullyfame.com
{{admin_password}}= admin123
```

---

## 🚨 Common Errors & Solutions

### ❌ "invalid_token"
```
Solution:
1. Run "Admin Login" request first
2. Check token in Settings > Environments > token
3. Select "Gully Fame Admin Environment" in top-right
```

### ❌ "Cannot GET /v1/api/..."
```
Solution:
1. Check server is running: npm run start
2. Check port 3552 is correct
3. Verify base_url in environment
```

### ❌ File upload not working
```
Solution:
1. Make sure Body is "form-data" (not JSON)
2. Use file icon for file fields
3. Select actual images from computer
```

### ❌ 404 Not Found
```
Solution:
1. List request first (GET)
2. Copy ID from response
3. Paste in environment variable
4. Then try update/delete
```

---

## 💡 Pro Tips

### 1️⃣ Keyboard Shortcuts
- **Ctrl+S**: Save request
- **Ctrl+Alt+C**: Open console
- **Cmd+I**: Beautify JSON

### 2️⃣ Organize Requests
- Create folders by feature
- Use descriptive names
- Add descriptions/comments

### 3️⃣ Test Automation
- Write test scripts in "Tests" tab
- Run collections automatically
- Export results

### 4️⃣ Documentation
- Add request descriptions
- Use example responses
- Create API documentation

---

## 📊 Response Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | `rCode: 1` with data |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid token |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Server issue |

## 🎯 Success Response Format

```json
{
  "rCode": 1,
  "msg": "success",
  "rData": {
    // Response data here
  }
}
```

## ❌ Error Response Format

```json
{
  "rCode": 0,
  "msg": "error_message",
  "rData": null
}
```

---

## 🚀 Next Steps

1. ✅ Import both JSON files into Postman
2. ✅ Select "Gully Fame Admin Environment"
3. ✅ Run "Admin Login"
4. ✅ Verify token is saved
5. ✅ Test other endpoints
6. ✅ Integrate with frontend

---

## 📞 Support

If you encounter issues:

1. **Check server logs**: Look at terminal where `npm run start` runs
2. **Verify MongoDB**: Make sure database is connected
3. **Check ports**: Verify port 3552 is available
4. **Review documentation**: See POSTMAN_SETUP_GUIDE.md

---

## ✨ Features Included

✅ **23 API Endpoints** - All admin functions
✅ **Auto-Token Saving** - Login once, use everywhere
✅ **Auto-ID Saving** - List once, IDs auto-filled
✅ **Environment Variables** - Easy switching
✅ **File Upload Support** - Test image uploads
✅ **Test Scripts** - Automated validation
✅ **Organized Structure** - Grouped by feature
✅ **Ready to Use** - No configuration needed

---

Enjoy testing! 🎉

