# 🎨 Postman Collection - Visual Guide

## 📦 What You Have

```
┌─────────────────────────────────────────────┐
│        POSTMAN FILES CREATED                │
├─────────────────────────────────────────────┤
│                                             │
│  ⭐ Gully_Fame_Admin_APIs.json              │
│     └─ 23 API Requests (Ready to Use)       │
│                                             │
│  ⭐ Gully_Fame_Admin_Environment.json       │
│     └─ Environment Variables (Pre-filled)   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🚀 Import Process (3 Steps)

```
Step 1: Open Postman
   ┌──────────────────┐
   │   Postman App    │
   └────────┬─────────┘
            │
Step 2: Click Import Button
   ┌──────────────────────────┐
   │  Click: Import            │
   │  ↓                        │
   │  Upload Files             │
   └────────┬─────────────────┘
            │
Step 3: Select Both JSON Files
   ┌─────────────────────────────────────┐
   │ Collection JSON                     │
   │ └─ Gully_Fame_Admin_APIs            │
   │                                     │
   │ Environment JSON                    │
   │ └─ Gully_Fame_Admin_Environment     │
   └────────┬────────────────────────────┘
            │
   ✅ IMPORTED! Ready to Test
```

---

## 📋 Collection Structure Map

```
┌─────────────────────────────────────────────────────────────┐
│         GULLY FAME ADMIN APIS (23 Requests)                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🔐 AUTHENTICATION (1)                                       │
│     └─ Admin Login (POST)                                    │
│        └─ Auto-saves: {{token}}                             │
│                                                              │
│  🎨 APP BRANDING (3)                                         │
│     ├─ Get App Branding (GET)                               │
│     ├─ Update Logo (POST)                                   │
│     └─ Update Splash Screen (POST)                          │
│                                                              │
│  🖼️ BANNERS (4)                                              │
│     ├─ Create Banner (POST) + File Upload                   │
│     ├─ List Banners (GET)                                   │
│     │  └─ Auto-saves: {{banner_id}}                        │
│     ├─ Update Banner (PUT)                                  │
│     └─ Delete Banner (DELETE)                               │
│                                                              │
│  🏷️ CATEGORIES (7)                                           │
│     ├─ Create Category - Dance (POST)                       │
│     ├─ Create Category - Music (POST)                       │
│     ├─ Create Category - Comedy (POST)                      │
│     ├─ Create Category - Cooking (POST)                     │
│     ├─ List Categories (GET)                                │
│     │  └─ Auto-saves: {{category_id}}                      │
│     ├─ Toggle Status (PUT)                                  │
│     └─ Delete Category (DELETE)                             │
│                                                              │
│  📄 STATIC CONTENT (8)                                       │
│     ├─ Competition Rules                                    │
│     │  ├─ Get (GET)                                         │
│     │  └─ Update (POST)                                     │
│     ├─ Terms & Conditions                                   │
│     │  ├─ Get (GET)                                         │
│     │  └─ Update (POST)                                     │
│     ├─ Privacy Policy                                       │
│     │  ├─ Get (GET)                                         │
│     │  └─ Update (POST)                                     │
│     └─ About Us                                             │
│        ├─ Get (GET)                                         │
│        └─ Update (POST)                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Recommended Test Flow

```
START
  │
  ▼
┌──────────────────────────┐
│  1. AUTHENTICATION       │
│  └─ Admin Login          │
│     └─ ✅ Token Saved    │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  2. CREATE CATEGORIES    │
│  ├─ Dance                │
│  ├─ Music                │
│  ├─ Comedy               │
│  └─ Cooking              │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  3. CREATE BANNER        │
│  ├─ Title: Banner 1      │
│  ├─ Rank: 1              │
│  └─ Upload Images        │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  4. UPDATE CONTENT       │
│  ├─ Competition Rules    │
│  ├─ Terms & Conditions   │
│  ├─ Privacy Policy       │
│  └─ About Us             │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  5. GET BRANDING         │
│  └─ View Current Setup   │
└────────┬─────────────────┘
         │
         ▼
       END
       ✅ All Tests Complete!
```

---

## 🎯 Authentication Flow

```
Request: Admin Login
┌─────────────────────────────────────────┐
│  POST /auth/admin/login                 │
│                                         │
│  Body (JSON):                           │
│  {                                      │
│    "email": "admin@gullyfame.com",     │
│    "password": "admin123",              │
│    "role": "Admin"                      │
│  }                                      │
└────────┬────────────────────────────────┘
         │
         ▼
    Server Validates
         │
         ├─ Check Email ✅
         ├─ Check Password ✅
         ├─ Check Role ✅
         └─ Generate JWT Token ✅
         │
         ▼
Response: 200 OK
┌─────────────────────────────────────────┐
│  {                                      │
│    "rCode": 1,                          │
│    "msg": "login_success",              │
│    "rData": {                           │
│      "token": "eyJhbGc...",            │
│      "admin": {                         │
│        "id": "...",                     │
│        "email": "admin@gullyfame.com", │
│        "role": "Admin"                  │
│      }                                  │
│    }                                    │
│  }                                      │
└────────┬────────────────────────────────┘
         │
         ▼
   ✅ TOKEN AUTO-SAVED
   {{token}} = "eyJhbGc..."
         │
         ▼
   All future requests
   use this token!
```

---

## 🔐 Token Usage

```
All Protected Requests Include:

┌────────────────────────────────────────────┐
│  Header: Authorization                     │
│  Value: Bearer {{token}}                   │
└────────────────────────────────────────────┘

Example:
┌────────────────────────────────────────────┐
│  GET /admin/categories                     │
│  Authorization: Bearer eyJhbGc...          │
│                                            │
│  Server:                                   │
│  ├─ Check Header exists ✅                 │
│  ├─ Verify Token Valid ✅                  │
│  ├─ Check Admin ID ✅                      │
│  ├─ Check Role ✅                          │
│  └─ Grant Access ✅                        │
│                                            │
│  Response: Categories List                 │
└────────────────────────────────────────────┘
```

---

## 📊 Request Types Overview

```
┌─────────────────────────────────────────────┐
│         DIFFERENT REQUEST TYPES              │
├─────────────────────────────────────────────┤
│                                             │
│  GET Requests (No Body)                    │
│  ├─ Get App Branding                       │
│  ├─ List Banners                           │
│  ├─ List Categories                        │
│  └─ Get Content                            │
│                                             │
│  POST Requests (JSON Body)                 │
│  ├─ Admin Login (credentials)              │
│  ├─ Create Category (name, icon)           │
│  └─ Update Content (type, content)         │
│                                             │
│  POST Requests (Form-Data Body)            │
│  ├─ Update Logo (file + fields)            │
│  ├─ Update Splash (file + fields)          │
│  └─ Create Banner (files + fields)         │
│                                             │
│  PUT Requests (JSON Body)                  │
│  ├─ Update Banner                          │
│  └─ Toggle Category Status                 │
│                                             │
│  DELETE Requests (No Body)                 │
│  ├─ Delete Banner                          │
│  └─ Delete Category                        │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 📁 File Upload Flow

```
Create/Update Banner with Images:

┌────────────────────────────────────┐
│  Form-Data Request                 │
│  ┌────────────────────────────────┐│
│  │ Text Fields:                   ││
│  │ • title: "Banner 1"            ││
│  │ • rank: 1                       ││
│  │                                ││
│  │ File Fields:                   ││
│  │ • mobileView: [image.png]      ││
│  │ • ipadView: [image.png]        ││
│  │ • desktopView: [image.png]     ││
│  └────────┬──────────────────────┘│
│           │                        │
└───────────┼────────────────────────┘
            │
            ▼
    Server Receives Request
            │
            ├─ Parse form-data ✅
            ├─ Validate files ✅
            ├─ Upload to AWS S3 ✅
            │  (3 different sizes)
            ├─ Save to Database ✅
            │  (S3 URLs)
            └─ Send Response ✅
            │
            ▼
    Response with URLs:
    ┌──────────────────────────┐
    │ {                        │
    │   "mobileView": "s3://", │
    │   "ipadView": "s3://",   │
    │   "desktopView": "s3://" │
    │ }                        │
    └──────────────────────────┘
```

---

## 🌍 Environment Variables

```
┌─────────────────────────────────────────┐
│    ENVIRONMENT VARIABLES                │
├─────────────────────────────────────────┤
│                                         │
│  {{base_url}}                           │
│  └─ http://localhost:3552/v1/api       │
│                                         │
│  {{token}}                              │
│  └─ [AUTO-FILLED after login]           │
│                                         │
│  {{admin_email}}                        │
│  └─ admin@gullyfame.com                │
│                                         │
│  {{admin_password}}                     │
│  └─ admin123                            │
│                                         │
│  {{banner_id}}                          │
│  └─ [AUTO-FILLED after listing]         │
│                                         │
│  {{category_id}}                        │
│  └─ [AUTO-FILLED after listing]         │
│                                         │
└─────────────────────────────────────────┘
```

---

## ✅ Success vs Error Responses

```
┌──────────────────────────────────────────┐
│  SUCCESS RESPONSE (rCode: 1)             │
├──────────────────────────────────────────┤
│  {                                       │
│    "rCode": 1,                           │
│    "msg": "success",                     │
│    "rData": {                            │
│      ... actual data ...                 │
│    }                                     │
│  }                                       │
│                                          │
│  ✅ Request succeeded                    │
│  ✅ Data in rData field                  │
│  ✅ Use data from rData                  │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  ERROR RESPONSE (rCode: 0 or 3)          │
├──────────────────────────────────────────┤
│  {                                       │
│    "rCode": 0,                           │
│    "msg": "error_message",               │
│    "rData": null                         │
│  }                                       │
│                                          │
│  ❌ Request failed                       │
│  ❌ Error details in msg                 │
│  ❌ Check error message                  │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  AUTHENTICATION ERROR (rCode: 3)         │
├──────────────────────────────────────────┤
│  {                                       │
│    "rCode": 3,                           │
│    "msg": "invalid_token",               │
│    "rData": null                         │
│  }                                       │
│                                          │
│  🔐 Token issue:                         │
│  • Missing token                         │
│  • Invalid token                         │
│  • Expired token                         │
│                                          │
│  Solution: Run login again               │
└──────────────────────────────────────────┘
```

---

## 🎯 Category Emoji List

```
Categories created in Postman:

🕺 Dance
   └─ Create Category - Dance

🎵 Music
   └─ Create Category - Music

😂 Comedy
   └─ Create Category - Comedy

👨‍🍳 Cooking
   └─ Create Category - Cooking

(You can add more with custom emoji!)
```

---

## 📄 Static Content Types

```
Four Content Pages:

1️⃣  COMPETITION_RULES
   ├─ Endpoint: /admin/content/COMPETITION_RULES
   ├─ Type Value: "COMPETITION_RULES"
   └─ Purpose: Competition guidelines

2️⃣  TERMS
   ├─ Endpoint: /admin/content/TERMS
   ├─ Type Value: "TERMS"
   └─ Purpose: Terms & Conditions

3️⃣  PRIVACY_POLICY
   ├─ Endpoint: /admin/content/PRIVACY_POLICY
   ├─ Type Value: "PRIVACY_POLICY"
   └─ Purpose: Privacy Policy

4️⃣  ABOUT_US
   ├─ Endpoint: /admin/content/ABOUT_US
   ├─ Type Value: "ABOUT_US"
   └─ Purpose: About Us Page
```

---

## 🔄 Update Process

```
Banner Update Example:

Step 1: Get Banner ID
┌─────────────────────┐
│ GET /admin/banners  │
│ ↓                   │
│ Response includes   │
│ _id: "507f..."      │
└──────────┬──────────┘
           │
Step 2: Save ID to Variable
┌──────────────────────────────┐
│ {{banner_id}} = "507f..."    │
└──────────┬───────────────────┘
           │
Step 3: Update Banner
┌──────────────────────────────┐
│ PUT /admin/banners/{{id}}    │
│ ↓                            │
│ Update form-data fields      │
│ • title                      │
│ • rank                       │
│ • images (optional)          │
└──────────┬───────────────────┘
           │
Step 4: Verify Update
┌──────────────────────────────┐
│ Response: Updated banner     │
│ Check fields updated         │
└──────────────────────────────┘
```

---

## 💡 Pro Tips

```
┌──────────────────────────────────────────┐
│  TIP 1: Auto-Save Scripts                │
│  • Login once                            │
│  • Token saved automatically             │
│  • Use in all future requests            │
│  • No manual copying!                    │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  TIP 2: Variable Usage                   │
│  • {{base_url}} in URL                   │
│  • {{token}} in headers                  │
│  • {{id}} in path parameters             │
│  • Switch environment anytime            │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  TIP 3: Form-Data vs JSON                │
│  • Use JSON for text data                │
│  • Use form-data for files               │
│  • Files need file icon, not text        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  TIP 4: Testing Sequence                 │
│  1. Login first                          │
│  2. Test GET requests                    │
│  3. Test POST requests                   │
│  4. Test PUT/DELETE                      │
│  5. Verify with GET                      │
└──────────────────────────────────────────┘
```

---

## 🚦 Status Codes

```
✅ 200 - Success
   └─ Request completed successfully

⚠️ 400 - Bad Request
   └─ Invalid data or parameters

🔐 401 - Unauthorized
   └─ Missing or invalid token

❌ 404 - Not Found
   └─ Resource doesn't exist

🔥 500 - Server Error
   └─ Server-side issue
```

---

Done! Ready to use Postman! 🎉

Import the JSON files and start testing!
