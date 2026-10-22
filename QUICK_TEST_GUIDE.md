# Gully Fame Admin APIs - Quick Test Examples

## Server Status
✅ Running on: `http://localhost:3552`

## Quick Reference - All Endpoints

| Feature | Method | Endpoint |
|---------|--------|----------|
| Admin Login | POST | `/v1/api/auth/admin/login` |
| Get Branding | GET | `/v1/api/admin/branding` |
| Update Branding | POST | `/v1/api/admin/branding` |
| Create Banner | POST | `/v1/api/admin/banners` |
| List Banners | GET | `/v1/api/admin/banners` |
| Update Banner | PUT | `/v1/api/admin/banners/:id` |
| Delete Banner | DELETE | `/v1/api/admin/banners/:id` |
| Create Category | POST | `/v1/api/admin/categories` |
| List Categories | GET | `/v1/api/admin/categories` |
| Update Category | PUT | `/v1/api/admin/categories/:id` |
| Delete Category | DELETE | `/v1/api/admin/categories/:id` |
| Get Content | GET | `/v1/api/admin/content/:type` |
| Update Content | POST | `/v1/api/admin/content` |

---

## Test Cases with curl

### 1. Admin Login (Get Token)
```bash
curl -X POST http://localhost:3552/v1/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gullyfame.com",
    "password": "admin123",
    "role": "Admin"
  }'
```

**Expected Response:**
```json
{
  "rCode": 1,
  "msg": "login_success",
  "rData": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "...",
      "email": "admin@gullyfame.com",
      "role": "Admin"
    }
  }
}
```

**Save token for next requests:**
```bash
TOKEN="your_token_here"
```

---

### 2. Get App Branding
```bash
curl -X GET http://localhost:3552/v1/api/admin/branding \
  -H "Authorization: Bearer $TOKEN"
```

---

### 3. Create Category - Dance
```bash
curl -X POST http://localhost:3552/v1/api/admin/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dance",
    "icon": "🕺"
  }'
```

---

### 4. Create Category - Music
```bash
curl -X POST http://localhost:3552/v1/api/admin/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Music",
    "icon": "🎵"
  }'
```

---

### 5. Create Category - Comedy
```bash
curl -X POST http://localhost:3552/v1/api/admin/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Comedy",
    "icon": "😂"
  }'
```

---

### 6. Create Category - Cooking
```bash
curl -X POST http://localhost:3552/v1/api/admin/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cooking",
    "icon": "👨‍🍳"
  }'
```

---

### 7. List All Categories
```bash
curl -X GET http://localhost:3552/v1/api/admin/categories \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
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

---

### 8. Update Competition Rules
```bash
curl -X POST http://localhost:3552/v1/api/admin/content \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "COMPETITION_RULES",
    "content": "1. All participants must be 18 years or older.\n2. Content must be original and not violate any copyright.\n3. Participants must follow community guidelines.\n4. Inappropriate content will result in disqualification."
  }'
```

---

### 9. Update Terms & Conditions
```bash
curl -X POST http://localhost:3552/v1/api/admin/content \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TERMS",
    "content": "By using Gully Fame, you agree to the following terms and conditions...\n\n1. User Responsibilities\n2. Content Guidelines\n3. Intellectual Property\n4. Limitation of Liability"
  }'
```

---

### 10. Update Privacy Policy
```bash
curl -X POST http://localhost:3552/v1/api/admin/content \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "PRIVACY_POLICY",
    "content": "Privacy Policy\n\nWe are committed to protecting your privacy. This policy explains how we collect, use, and protect your personal information..."
  }'
```

---

### 11. Update About Us
```bash
curl -X POST http://localhost:3552/v1/api/admin/content \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ABOUT_US",
    "content": "About Gully Fame\n\nGully Fame is a platform for discovering and celebrating talent from across the globe. We provide a space for creators to showcase their skills and connect with audiences worldwide."
  }'
```

---

### 12. Get Competition Rules
```bash
curl -X GET http://localhost:3552/v1/api/admin/content/COMPETITION_RULES \
  -H "Authorization: Bearer $TOKEN"
```

---

### 13. Update App Branding (Logo & Splash)
```bash
# Create test image files first (512x512 PNG for logo)
curl -X POST http://localhost:3552/v1/api/admin/branding \
  -H "Authorization: Bearer $TOKEN" \
  -F "splashTitle=Welcome to Gully Fame" \
  -F "splashSubtitle=Showcase your talent and compete with the best!" \
  -F "splashButtonText=Get Started" \
  -F "showOverlay=true"
```

---

### 14. Create Banner (with images)
```bash
# You need to create/have image files for this
# Example with dummy images

curl -X POST http://localhost:3552/v1/api/admin/banners \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Featured Promotion" \
  -F "rank=1" \
  -F "mobileView=@mobile_banner.png" \
  -F "ipadView=@ipad_banner.png" \
  -F "desktopView=@desktop_banner.png"
```

---

### 15. List Banners
```bash
curl -X GET http://localhost:3552/v1/api/admin/banners \
  -H "Authorization: Bearer $TOKEN"
```

---

## Test Using Postman

### Setup
1. Create new collection: `Gully Fame Admin`
2. Create new request for each endpoint
3. Set environment variable: `token` (save from login response)

### Headers to add (for all protected requests)
```
Authorization: Bearer {{token}}
```

### Example request in Postman

**Create Category**
- Method: POST
- URL: `{{base_url}}/v1/api/admin/categories`
- Headers: 
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- Body (JSON):
```json
{
  "name": "Dance",
  "icon": "🕺"
}
```

---

## Important Notes

1. **Token Expiration**: Token is JWT - verify expiry and refresh if needed
2. **File Uploads**: Maximum 100MB per file
3. **Image Formats**: PNG, JPG, WebP recommended
4. **Unique Fields**: 
   - Category name must be unique
   - Static content type must be unique
5. **Status Codes**:
   - `rCode: 1` = Success
   - `rCode: 0` = Error/Validation failure
   - `rCode: 3` = Authentication error

---

## Error Examples

### Missing Token
```bash
curl -X GET http://localhost:3552/v1/api/admin/categories
```

Response:
```json
{
  "rCode": 3,
  "msg": "invalid_token",
  "rData": null
}
```

### Invalid Credentials
```bash
curl -X POST http://localhost:3552/v1/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "wrong@email.com",
    "password": "wrong",
    "role": "Admin"
  }'
```

Response:
```json
{
  "rCode": 0,
  "msg": "invalid_credentials",
  "rData": null
}
```

---

## Frontend Integration Example

```javascript
// Save this in your frontend code

const API_BASE = "http://localhost:3552/v1/api";
let authToken = null;

// 1. Login
async function adminLogin(email, password) {
  const response = await fetch(`${API_BASE}/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role: "Admin" })
  });
  const data = await response.json();
  if (data.rCode === 1) {
    authToken = data.rData.token;
    localStorage.setItem("adminToken", authToken);
  }
  return data;
}

// 2. Get Categories
async function getCategories() {
  const response = await fetch(`${API_BASE}/admin/categories`, {
    headers: { "Authorization": `Bearer ${authToken}` }
  });
  return response.json();
}

// 3. Create Category
async function createCategory(name, icon) {
  const response = await fetch(`${API_BASE}/admin/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}`
    },
    body: JSON.stringify({ name, icon })
  });
  return response.json();
}

// 4. Get Branding
async function getBranding() {
  const response = await fetch(`${API_BASE}/admin/branding`, {
    headers: { "Authorization": `Bearer ${authToken}` }
  });
  return response.json();
}

// 5. Update Content
async function updateContent(type, content) {
  const response = await fetch(`${API_BASE}/admin/content`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}`
    },
    body: JSON.stringify({ type, content })
  });
  return response.json();
}
```

---

## Next Steps

1. ✅ All APIs are implemented and tested
2. ✅ Server is running on port 3552
3. ✅ Database is connected
4. ✅ File uploads to S3 are configured
5. Next: Integrate frontend with these APIs

