# Gully Fame Admin APIs - Complete Reference

## Base URL
```
http://localhost:9110/v1/api
```

## Authentication

### Admin Login
**POST** `/auth/admin/login`

Request Body:
```json
{
  "email": "admin@gullyfame.com",
  "password": "admin123",
  "role": "Admin"
}
```

Response:
```json
{
  "rCode": 1,
  "msg": "login_success",
  "rData": {
    "token": "jwt_token_here",
    "admin": {
      "id": "admin_id",
      "email": "admin@gullyfame.com",
      "role": "Admin"
    }
  }
}
```

**Note:** Use the token in Authorization header as `Bearer <token>` for all protected admin routes.

---

## Protected Admin Routes
All routes below require:
- **Header:** `Authorization: Bearer <token>`
- Admin token must be valid and not expired

---

## 1. APP BRANDING MANAGEMENT

### Get App Branding (Logo & Splash Screen)
**GET** `/admin/branding`

Response:
```json
{
  "rCode": 1,
  "msg": "success",
  "rData": {
    "_id": "...",
    "logo": ["url1", "url2"],
    "splashImage": ["url1"],
    "splashTitle": "Welcome to Gully Fame",
    "splashSubtitle": "Showcase your talent and compete with the best!",
    "splashButtonText": "Get Started",
    "showOverlay": true,
    "isActive": true
  }
}
```

### Update App Branding
**POST** `/admin/branding`

Request (Form-Data):
- `logo` (file) - Optional - PNG format with transparent background (512x512px)
- `splashImage` (file) - Optional - Image file
- `splashTitle` (string) - Optional
- `splashSubtitle` (string) - Optional
- `splashButtonText` (string) - Optional
- `showOverlay` (boolean) - Optional - Default: true

Response:
```json
{
  "rCode": 1,
  "msg": "success"
}
```

---

## 2. HOME BANNERS MANAGEMENT

### Create Banner
**POST** `/admin/banners`

Request (Form-Data):
- `title` (string) - Required
- `mobileView` (file) - Required - Mobile image
- `ipadView` (file) - Required - iPad image
- `desktopView` (file) - Required - Desktop image
- `rank` (number) - Required - Display order (1, 2, 3...)
- `startDate` (date) - Optional - ISO format
- `expireDate` (date) - Optional - ISO format

Response:
```json
{
  "rCode": 1,
  "msg": "banner_created",
  "rData": {
    "_id": "...",
    "title": "Banner 1",
    "mobileView": "url",
    "ipadView": "url",
    "desktopView": "url",
    "rank": 1,
    "startDate": null,
    "expireDate": null,
    "isActive": true
  }
}
```

### Get All Banners
**GET** `/admin/banners`

Response:
```json
{
  "rCode": 1,
  "msg": "success",
  "rData": [
    {
      "_id": "...",
      "title": "Banner 1",
      "mobileView": "url",
      "ipadView": "url",
      "desktopView": "url",
      "rank": 1,
      "isActive": true
    }
  ]
}
```

### Update Banner
**PUT** `/admin/banners/:id`

Request (Form-Data):
- `title` (string) - Optional
- `mobileView` (file) - Optional
- `ipadView` (file) - Optional
- `desktopView` (file) - Optional
- `rank` (number) - Optional
- `startDate` (date) - Optional
- `expireDate` (date) - Optional

Response:
```json
{
  "rCode": 1,
  "msg": "banner_updated",
  "rData": { ... }
}
```

### Delete Banner
**DELETE** `/admin/banners/:id`

Response:
```json
{
  "rCode": 1,
  "msg": "banner_deleted"
}
```

---

## 3. CATEGORIES MANAGEMENT

### Create Category
**POST** `/admin/categories`

Request Body:
```json
{
  "name": "Dance",
  "icon": "🕺"
}
```

Response:
```json
{
  "rCode": 1,
  "msg": "category_created",
  "rData": {
    "_id": "...",
    "name": "Dance",
    "icon": "🕺",
    "isActive": true
  }
}
```

### Get All Categories
**GET** `/admin/categories`

Response:
```json
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
    }
  ]
}
```

### Toggle Category Status
**PUT** `/admin/categories/:id`

Request Body:
```json
{
  "isActive": false
}
```

Response:
```json
{
  "rCode": 1,
  "msg": "category_updated",
  "rData": { ... }
}
```

### Delete Category
**DELETE** `/admin/categories/:id`

Response:
```json
{
  "rCode": 1,
  "msg": "category_deleted"
}
```

---

## 4. STATIC CONTENT MANAGEMENT

### Get Static Content by Type
**GET** `/admin/content/:type`

Path Parameters:
- `type` - One of: `COMPETITION_RULES`, `TERMS`, `PRIVACY_POLICY`, `ABOUT_US`

Response:
```json
{
  "rCode": 1,
  "msg": "success",
  "rData": {
    "_id": "...",
    "type": "COMPETITION_RULES",
    "content": "1. All participants must be 18 years or older...",
    "isActive": true
  }
}
```

### Update Static Content
**POST** `/admin/content`

Request Body:
```json
{
  "type": "COMPETITION_RULES",
  "content": "1. All participants must be 18 years or older..."
}
```

Valid Types:
- `COMPETITION_RULES` - Competition Rules content
- `TERMS` - Terms & Conditions
- `PRIVACY_POLICY` - Privacy Policy
- `ABOUT_US` - About Us

Response:
```json
{
  "rCode": 1,
  "msg": "success"
}
```

---

## Complete API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/admin/login` | Admin login |
| GET | `/admin/branding` | Get app branding |
| POST | `/admin/branding` | Update app branding |
| POST | `/admin/banners` | Create banner |
| GET | `/admin/banners` | Get all banners |
| PUT | `/admin/banners/:id` | Update banner |
| DELETE | `/admin/banners/:id` | Delete banner |
| POST | `/admin/categories` | Create category |
| GET | `/admin/categories` | Get all categories |
| PUT | `/admin/categories/:id` | Update category status |
| DELETE | `/admin/categories/:id` | Delete category |
| GET | `/admin/content/:type` | Get static content |
| POST | `/admin/content` | Update static content |

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "rCode": 0,
  "msg": "error_message",
  "rData": null
}
```

Common Error Messages:
- `invalid_credentials` - Wrong email/password for admin login
- `invalid_token` - Missing or invalid JWT token
- `account_disabled` - Admin account is disabled
- `banner_not_found` - Banner with given ID doesn't exist
- `category_not_found` - Category with given ID doesn't exist

---

## Implementation Details

### Models
- **Admin** - Admin user accounts
- **AppBranding** - App logo and splash screen settings
- **Banners** - Home page banners
- **Category** - Content categories
- **StaticContent** - Terms, Privacy Policy, Competition Rules, About Us

### Controllers
- **AdminAuthController** - Admin authentication
- **AppBrandingController** - App branding management
- **BannerController** - Banner management
- **CategoryController** - Category management
- **StaticContentController** - Static content management

### Services
- **AdminAuthService** - Admin auth business logic
- **AppBrandingService** - App branding business logic
- **BannerService** - Banner business logic
- **CategoryService** - Category business logic
- **StaticContentService** - Static content business logic

### File Upload
- Images are uploaded to AWS S3
- File upload is handled by `express-fileupload` middleware
- Maximum file size: 100MB

---

## Testing the APIs

### 1. Login as Admin
```bash
curl -X POST http://localhost:9110/v1/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gullyfame.com",
    "password": "admin123",
    "role": "Admin"
  }'
```

### 2. Get App Branding (using token)
```bash
curl -X GET http://localhost:9110/v1/api/admin/branding \
  -H "Authorization: Bearer <your_token>"
```

### 3. Create a Category
```bash
curl -X POST http://localhost:9110/v1/api/admin/categories \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dance",
    "icon": "🕺"
  }'
```

---

## Notes

1. **Authentication**: All admin routes are protected with JWT token verification
2. **Role-based Access**: Only users with "Admin" role can access these endpoints
3. **File Uploads**: Use multipart/form-data for endpoints with file uploads
4. **Database**: Uses MongoDB with Mongoose
5. **Timestamps**: All records include `createdAt` and `updatedAt` fields
6. **Soft Delete**: Categories and content have `isActive` flag (no hard deletion for some entities)

