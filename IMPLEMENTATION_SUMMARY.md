# Gully Fame Admin APIs - Implementation Complete ✅

## Overview
All APIs for the Gully Fame Admin Panel have been implemented according to the UI screenshots. The system includes:
- Admin Authentication
- App Branding Management (Logo & Splash Screen)
- Home Banners Management
- Categories Management
- Static Content Management (Competition Rules, Terms & Conditions, Privacy Policy, About Us)

## Server Status
✅ Server is running on port: **3552**
✅ Database: Connected
✅ Redis Cache: Connected

---

## Files Modified/Created

### New Controllers Created
1. **BannerController.js** - Handles banner CRUD operations
2. **CategoryController.js** - Handles category CRUD operations

### Files Updated
1. **AuthMiddleware.js** - Added `verifyAdminToken` method for admin authentication
2. **BannerService.js** - Fixed model import (Banner → Banners)
3. **CategoryService.js** - Fixed model import path (Category → Catagory)
4. **src/routes/auth.js** - Added `/admin/login` endpoint
5. **src/routes/index.js** - Added admin routes mounting

---

## Complete API Endpoints

### 1. AUTHENTICATION

#### Admin Login
```
POST /v1/api/auth/admin/login
Content-Type: application/json

{
  "email": "admin@gullyfame.com",
  "password": "admin123",
  "role": "Admin"
}

Response:
{
  "rCode": 1,
  "msg": "login_success",
  "rData": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "admin_id",
      "email": "admin@gullyfame.com",
      "role": "Admin"
    }
  }
}
```

---

### 2. APP BRANDING (Logo & Splash Screen)

#### Get App Branding
```
GET /v1/api/admin/branding
Authorization: Bearer <token>

Response:
{
  "rCode": 1,
  "msg": "success",
  "rData": {
    "_id": "...",
    "logo": ["https://s3.amazonaws.com/..."],
    "splashImage": ["https://s3.amazonaws.com/..."],
    "splashTitle": "Welcome to Gully Fame",
    "splashSubtitle": "Showcase your talent and compete with the best!",
    "splashButtonText": "Get Started",
    "showOverlay": true,
    "isActive": true
  }
}
```

#### Update App Branding
```
POST /v1/api/admin/branding
Authorization: Bearer <token>
Content-Type: multipart/form-data

Files:
- logo (optional) - PNG file, 512x512px, transparent background
- splashImage (optional) - Image file

Fields:
- splashTitle (string, optional)
- splashSubtitle (string, optional)
- splashButtonText (string, optional)
- showOverlay (boolean, optional)

Response:
{
  "rCode": 1,
  "msg": "success"
}
```

---

### 3. HOME BANNERS

#### Create Banner
```
POST /v1/api/admin/banners
Authorization: Bearer <token>
Content-Type: multipart/form-data

Files:
- mobileView (required) - Banner image for mobile
- ipadView (required) - Banner image for iPad
- desktopView (required) - Banner image for desktop

Fields:
- title (string, required) - e.g., "Banner 1"
- rank (number, required) - Display order (1, 2, 3...)
- startDate (date, optional) - ISO format: 2024-01-15
- expireDate (date, optional) - ISO format: 2024-12-31

Response:
{
  "rCode": 1,
  "msg": "banner_created",
  "rData": {
    "_id": "...",
    "title": "Banner 1",
    "mobileView": "https://s3.amazonaws.com/...",
    "ipadView": "https://s3.amazonaws.com/...",
    "desktopView": "https://s3.amazonaws.com/...",
    "rank": 1,
    "startDate": null,
    "expireDate": null,
    "isActive": true
  }
}
```

#### Get All Banners
```
GET /v1/api/admin/banners
Authorization: Bearer <token>

Response:
{
  "rCode": 1,
  "msg": "success",
  "rData": [
    {
      "_id": "...",
      "title": "Banner 1",
      "mobileView": "https://s3.amazonaws.com/...",
      "ipadView": "https://s3.amazonaws.com/...",
      "desktopView": "https://s3.amazonaws.com/...",
      "rank": 1,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Update Banner
```
PUT /v1/api/admin/banners/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data

Files (optional):
- mobileView
- ipadView
- desktopView

Fields (optional):
- title
- rank
- startDate
- expireDate

Response:
{
  "rCode": 1,
  "msg": "banner_updated",
  "rData": { ... updated banner data ... }
}
```

#### Delete Banner
```
DELETE /v1/api/admin/banners/:id
Authorization: Bearer <token>

Response:
{
  "rCode": 1,
  "msg": "banner_deleted"
}
```

---

### 4. CATEGORIES

#### Create Category
```
POST /v1/api/admin/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Dance",
  "icon": "🕺"
}

Response:
{
  "rCode": 1,
  "msg": "category_created",
  "rData": {
    "_id": "...",
    "name": "Dance",
    "icon": "🕺",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Get All Categories
```
GET /v1/api/admin/categories
Authorization: Bearer <token>

Response:
{
  "rCode": 1,
  "msg": "success",
  "rData": [
    {
      "_id": "...",
      "name": "Dance",
      "icon": "🕺",
      "isActive": true
    },
    {
      "_id": "...",
      "name": "Music",
      "icon": "🎵",
      "isActive": true
    },
    {
      "_id": "...",
      "name": "Comedy",
      "icon": "😂",
      "isActive": true
    },
    {
      "_id": "...",
      "name": "Cooking",
      "icon": "👨‍🍳",
      "isActive": true
    }
  ]
}
```

#### Update Category Status
```
PUT /v1/api/admin/categories/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "isActive": false
}

Response:
{
  "rCode": 1,
  "msg": "category_updated",
  "rData": { ... updated category data ... }
}
```

#### Delete Category
```
DELETE /v1/api/admin/categories/:id
Authorization: Bearer <token>

Response:
{
  "rCode": 1,
  "msg": "category_deleted"
}
```

---

### 5. STATIC CONTENT (Competition Rules, Terms & Conditions, etc.)

#### Get Static Content by Type
```
GET /v1/api/admin/content/:type
Authorization: Bearer <token>

Valid types:
- COMPETITION_RULES
- TERMS
- PRIVACY_POLICY
- ABOUT_US

Example: GET /v1/api/admin/content/COMPETITION_RULES

Response:
{
  "rCode": 1,
  "msg": "success",
  "rData": {
    "_id": "...",
    "type": "COMPETITION_RULES",
    "content": "1. All participants must be 18 years or older...",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Update Static Content
```
POST /v1/api/admin/content
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "COMPETITION_RULES",
  "content": "1. All participants must be 18 years or older...\n2. Content must be original and not violate any copyright...\n3. Participants must follow community guidelines..."
}

Valid types:
- COMPETITION_RULES - Rules for competitions
- TERMS - Terms & Conditions
- PRIVACY_POLICY - Privacy Policy
- ABOUT_US - About Us information

Response:
{
  "rCode": 1,
  "msg": "success"
}
```

---

## Response Format

All APIs follow a consistent response format:

### Success Response (rCode: 1)
```json
{
  "rCode": 1,
  "msg": "success/action_message",
  "rData": { ... data ... }
}
```

### Error Response (rCode: 0 or 3)
```json
{
  "rCode": 0,
  "msg": "error_message",
  "rData": null
}
```

### Common Error Messages
- `invalid_credentials` - Wrong email/password
- `invalid_token` - Missing or expired JWT token
- `account_disabled` - Admin account is disabled
- `token_expired` - JWT token has expired
- `banner_not_found` - Banner doesn't exist
- `category_not_found` - Category doesn't exist

---

## Authentication Flow

1. **Admin Login** - Get JWT token
   ```
   POST /v1/api/auth/admin/login
   ```

2. **Use Token** - Include in all protected endpoints
   ```
   Authorization: Bearer <token>
   ```

3. **Token Verification** - Middleware validates token on each request
   - Checks token signature
   - Verifies admin ID and role
   - Rejects expired tokens

---

## Database Models

### Admin
- `_id` - ObjectId
- `email` - String (unique)
- `password` - String (hashed)
- `role` - String (Admin, Sponsor)
- `isActive` - Boolean
- `createdAt` - Date
- `updatedAt` - Date

### AppBranding
- `_id` - ObjectId
- `logo` - Array of Strings (S3 URLs)
- `splashImage` - Array of Strings (S3 URLs)
- `splashTitle` - String
- `splashSubtitle` - String
- `splashButtonText` - String
- `showOverlay` - Boolean
- `isActive` - Boolean
- `createdAt` - Date
- `updatedAt` - Date

### Banners
- `_id` - ObjectId
- `title` - String
- `mobileView` - String (S3 URL)
- `ipadView` - String (S3 URL)
- `desktopView` - String (S3 URL)
- `rank` - Number
- `startDate` - Date
- `expireDate` - Date
- `isActive` - Boolean
- `createdAt` - Date
- `updatedAt` - Date

### Category
- `_id` - ObjectId
- `name` - String (unique)
- `icon` - String (emoji or URL)
- `isActive` - Boolean
- `createdAt` - Date
- `updatedAt` - Date

### StaticContent
- `_id` - ObjectId
- `type` - String (COMPETITION_RULES, TERMS, PRIVACY_POLICY, ABOUT_US)
- `content` - String
- `isActive` - Boolean
- `createdAt` - Date
- `updatedAt` - Date

---

## Tech Stack

- **Runtime**: Node.js v24+
- **Framework**: Express.js v5.1
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: express-fileupload, AWS S3
- **Image Processing**: Sharp
- **Caching**: Redis
- **Password Hashing**: bcryptjs
- **Validation**: node-input-validator

---

## Folder Structure

```
GulyFame/
├── src/
│   ├── controllers/
│   │   ├── AdminAuthController.js ✅
│   │   ├── AppBrandingController.js ✅
│   │   ├── BannerController.js ✅ (Created)
│   │   ├── CategoryController.js ✅ (Created)
│   │   ├── StaticContentController.js ✅
│   │   └── ...
│   ├── services/
│   │   ├── AdminAuthService.js ✅
│   │   ├── AppBrandingService.js ✅
│   │   ├── BannerService.js ✅ (Fixed)
│   │   ├── CategoryService.js ✅ (Fixed)
│   │   ├── StaticContentService.js ✅
│   │   └── ...
│   ├── models/
│   │   ├── Admin.js ✅
│   │   ├── AppBranding.js ✅
│   │   ├── Banners.js ✅
│   │   ├── Catagory.js ✅
│   │   ├── StaticContent.js ✅
│   │   └── ...
│   ├── routes/
│   │   ├── adminRoutes.js ✅
│   │   ├── auth.js ✅ (Updated)
│   │   ├── index.js ✅ (Updated)
│   │   └── ...
│   ├── middlewares/
│   │   ├── AuthMiddleware.js ✅ (Updated)
│   │   ├── ErrorHandlerMiddleware.js ✅
│   │   ├── ResponseMiddleware.js ✅
│   │   └── ...
│   └── util/
│       ├── s3.js ✅
│       ├── redis.js ✅
│       └── ...
├── index.js ✅
├── package.json ✅
├── .env ✅
└── API_DOCUMENTATION.md ✅ (Created)
```

---

## How to Test APIs

### Using cURL

1. **Login**
```bash
curl -X POST http://localhost:3552/v1/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gullyfame.com",
    "password": "admin123",
    "role": "Admin"
  }'
```

2. **Get App Branding**
```bash
curl -X GET http://localhost:3552/v1/api/admin/branding \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

3. **Create Category**
```bash
curl -X POST http://localhost:3552/v1/api/admin/categories \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dance",
    "icon": "🕺"
  }'
```

4. **Create Banner (with files)**
```bash
curl -X POST http://localhost:3552/v1/api/admin/banners \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=Banner 1" \
  -F "rank=1" \
  -F "mobileView=@/path/to/mobile.png" \
  -F "ipadView=@/path/to/ipad.png" \
  -F "desktopView=@/path/to/desktop.png"
```

### Using Postman
1. Create a new collection
2. Set Authorization header: `Bearer <token>`
3. Use the endpoints listed above
4. For file uploads, use form-data in request body

---

## Key Features Implemented

✅ Admin Authentication with JWT
✅ App Logo Management (upload new logo)
✅ Splash Screen Management (image + text content)
✅ Home Banners Management (create, update, delete with responsive images)
✅ Categories Management (create, list, delete, toggle status)
✅ Static Content Management (Competition Rules, Terms & Conditions, Privacy Policy, About Us)
✅ File Upload to AWS S3
✅ Protected Routes with Admin Token Verification
✅ Error Handling & Validation
✅ MongoDB Database Integration
✅ Redis Caching Support

---

## Notes

1. **Default Admin Credentials** (as shown in UI):
   - Email: `admin@gullyfame.com`
   - Password: `admin123`
   - Role: `Admin`

2. **File Upload Limits**: Maximum 100MB per file

3. **Image Recommendations**:
   - Logo: PNG format, 512x512px, transparent background
   - Banners: Optimized for mobile, iPad, and desktop
   - Formats: PNG, JPG, WebP recommended

4. **JWT Token**: 
   - Included in Authorization header as `Bearer <token>`
   - Verify token on each protected route
   - Token includes admin ID and role

5. **Database**: MongoDB (Mongoose ODM)
   - Automatic timestamps on all documents
   - Proper indexing on unique fields
   - Soft delete using `isActive` flag

---

## Summary

All APIs have been successfully implemented and the server is running! The admin panel can now:
- Manage app branding (logo and splash screen)
- Manage home banners
- Manage content categories
- Manage static content pages
- Authenticate with JWT tokens

All endpoints are protected with admin token verification and support file uploads to AWS S3.

