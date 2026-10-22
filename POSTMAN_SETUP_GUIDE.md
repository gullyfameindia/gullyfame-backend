# Gully Fame Admin APIs - Postman Setup Guide

## 📥 Import Files

You have two files to import into Postman:

1. **Gully_Fame_Admin_APIs.postman_collection.json** - API Collection
2. **Gully_Fame_Admin_Environment.postman_environment.json** - Environment Variables

### Step-by-Step Import Instructions

#### Import Collection
1. Open Postman
2. Click **"Import"** button (top-left)
3. Select **"Upload Files"** tab
4. Choose `Gully_Fame_Admin_APIs.postman_collection.json`
5. Click **"Import"**

#### Import Environment
1. Click **Settings** icon (gear icon, top-right)
2. Click **"Environments"** from left sidebar
3. Click **"Import"** button
4. Choose `Gully_Fame_Admin_Environment.postman_environment.json`
5. Click **"Import"**

#### Select Environment
1. Top-right corner, find the environment dropdown (currently shows "No Environment")
2. Select **"Gully Fame Admin Environment"**

---

## 📋 Collection Structure

```
Gully Fame Admin APIs
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

## 🔐 Environment Variables

| Variable | Default Value | Purpose |
|----------|---------------|---------|
| `base_url` | `http://localhost:3552/v1/api` | Base API URL |
| `token` | Empty | JWT token (auto-populated after login) |
| `admin_email` | `admin@gullyfame.com` | Admin email for testing |
| `admin_password` | `admin123` | Admin password for testing |
| `banner_id` | Empty | Banner ID for update/delete operations |
| `category_id` | Empty | Category ID for update/delete operations |

---

## 🚀 Quick Start Guide

### 1. Login First
1. Open **Authentication** folder
2. Click **Admin Login** request
3. Click **"Send"** button
4. Token will be **automatically saved** to `{{token}}` variable

### 2. Verify Login Success
You should see response like:
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

### 3. Use Other APIs
All other requests will automatically include the token in the Authorization header!

---

## 📝 Common Use Cases

### Test 1: Complete Admin Setup Flow

#### Step 1: Login
- Go to **Authentication > Admin Login**
- Click **Send**
- ✅ Token auto-saved

#### Step 2: Create Categories
- Go to **Categories > Create Category - Dance**
- Click **Send**
- Repeat for Music, Comedy, Cooking

#### Step 3: List Categories
- Go to **Categories > List Categories**
- Click **Send**
- ✅ First category ID auto-saved to `{{category_id}}`

#### Step 4: Update Content
- Go to **Static Content > Update Competition Rules**
- Modify content in Body if needed
- Click **Send**

#### Step 5: Get Branding
- Go to **App Branding > Get App Branding**
- Click **Send**

---

### Test 2: Banner Management

#### Create Banner
1. Go to **Banners > Create Banner**
2. Click on **Body** tab
3. Under **formdata**:
   - **title**: Edit value (e.g., "Featured Banner")
   - **rank**: Edit value (e.g., "1")
   - **mobileView**: Click file icon, select image from your computer
   - **ipadView**: Click file icon, select image from your computer
   - **desktopView**: Click file icon, select image from your computer
4. Click **Send**

#### List Banners
1. Go to **Banners > List Banners**
2. Click **Send**
3. Copy banner `_id` from response
4. Paste into `banner_id` environment variable (Settings > Environments > Gully Fame Admin Environment > banner_id)

#### Update Banner
1. Go to **Banners > Update Banner**
2. Make sure `banner_id` is set in environment
3. Update fields in Body tab
4. Click **Send**

#### Delete Banner
1. Go to **Banners > Delete Banner**
2. Make sure `banner_id` is set in environment
3. Click **Send**

---

### Test 3: Category Management

#### Create Multiple Categories
1. Go to **Categories > Create Category - Dance**
   - Click **Send**
2. Go to **Categories > Create Category - Music**
   - Click **Send**
3. Go to **Categories > Create Category - Comedy**
   - Click **Send**
4. Go to **Categories > Create Category - Cooking**
   - Click **Send**

#### List and Update Category
1. Go to **Categories > List Categories**
   - Click **Send**
   - Copy `_id` of first category from response
2. Set `category_id` in environment variables
3. Go to **Categories > Toggle Category Status**
   - Body shows `{"isActive": false}`
   - Click **Send** to deactivate category

#### Delete Category
1. Go to **Categories > Delete Category**
2. Make sure `category_id` is set
3. Click **Send**

---

## 🛠️ Advanced Features

### Auto-save Token After Login
The **Admin Login** request has a test script that automatically:
1. Checks if login was successful (rCode === 1)
2. Extracts token from response
3. Saves to `{{token}}` environment variable

No manual copying needed!

### Auto-save Category ID After Listing
The **List Categories** request has a test script that:
1. Gets first category from response
2. Saves its `_id` to `{{category_id}}` variable

Just list categories once, then all delete/update requests work automatically!

### Custom Tests
Click **Tests** tab on any request to add custom test scripts:

Example:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has correct structure", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.rCode).to.equal(1);
    pm.expect(jsonData.rData).to.exist;
});
```

---

## 📤 File Upload in Postman

For requests with file uploads (Create/Update Banner, Update Logo):

1. Click on request
2. Go to **Body** tab
3. Select **form-data**
4. For file fields:
   - Click file icon on right
   - Select image from your computer
5. For text fields:
   - Type value directly
6. Click **Send**

### Recommended Image Sizes
- **Logo**: 512x512 PNG (transparent background)
- **Banner Mobile**: 1080x1920 or 540x960
- **Banner Tablet**: 1280x960
- **Banner Desktop**: 1920x1080

---

## 🔄 Working with Environment Variables

### View/Edit Variables
1. Click **Settings** (gear icon, top-right)
2. Click **Environments**
3. Select **"Gully Fame Admin Environment"**
4. Edit values as needed

### Variables in Requests
Use double curly braces to reference variables:
- In URL: `{{base_url}}/admin/categories`
- In Headers: `Bearer {{token}}`
- In Body: Can reference variables using `{{variable_name}}`

### Manually Set Variables
If auto-save doesn't work, manually set:
1. Copy value from response
2. Go to **Settings > Environments > Gully Fame Admin Environment**
3. Paste value in the appropriate variable

---

## 🧪 Test Collections

Run multiple requests in sequence:

1. Click collection name: **"Gully Fame Admin APIs"**
2. Click **"Run"** button (right side)
3. Select requests to run
4. Adjust iteration count and delay
5. Click **"Run Gully Fame Admin APIs"**

This will run all selected requests in order!

---

## 🐛 Troubleshooting

### "invalid_token" Error
**Problem**: Getting 401/403 unauthorized error
**Solution**:
1. Login first with **Admin Login** request
2. Check if token is saved in environment (Settings > Environments > token)
3. Make sure "Gully Fame Admin Environment" is selected (top-right dropdown)

### "Category/Banner not found"
**Problem**: Update/Delete returns 404
**Solution**:
1. Get the ID first (List request)
2. Manually set the ID in environment variables
3. Then try update/delete

### File Upload Not Working
**Problem**: Files not being uploaded
**Solution**:
1. Make sure Body is set to **form-data** (not JSON)
2. Click the file icon (not text field) for file uploads
3. Select actual files from your computer

### "Cannot find module" at startup
**Problem**: Server error
**Solution**:
1. Check that server is running: `npm run start`
2. Verify port 3552 is correct
3. Check MongoDB connection

---

## 📊 Response Examples

### Success Response
```json
{
  "rCode": 1,
  "msg": "success",
  "rData": {
    "_id": "...",
    "name": "Dance",
    "icon": "🕺",
    "isActive": true
  }
}
```

### Error Response
```json
{
  "rCode": 0,
  "msg": "invalid_credentials",
  "rData": null
}
```

### Authentication Error
```json
{
  "rCode": 3,
  "msg": "invalid_token",
  "rData": null
}
```

---

## 📱 Mobile Testing in Postman

### Mock Server
1. Right-click collection
2. Select **"Set up mock server"**
3. Create mock responses for offline testing

### Postman Interceptor
1. Install Chrome extension: Postman Interceptor
2. Capture real requests from browser
3. Save as API requests

---

## 🌐 Different Environments

You can create multiple environments for different servers:

### Development Environment (Already configured)
- Base URL: `http://localhost:3552/v1/api`
- Use local admin account

### Staging Environment (Create new)
1. Settings > Environments
2. Click **"+"** to create new
3. Set variables for staging server
4. Switch in top-right dropdown

### Production Environment (Create new)
Same process for production server

---

## 💡 Tips & Tricks

1. **Use Pre-request Scripts**: Automatically set headers before requests
2. **Use Test Scripts**: Validate responses automatically
3. **Use Variables**: Make requests reusable across environments
4. **Use Folders**: Organize similar requests together
5. **Use Comments**: Document complex requests
6. **Export Results**: Run > Export Results as HTML/JSON

---

## 📚 Additional Resources

- [Postman Documentation](https://learning.postman.com/)
- [REST API Best Practices](https://restfulapi.net/)
- [JWT Authentication](https://jwt.io/)
- [Postman Variables](https://learning.postman.com/docs/sending-requests/variables/)

---

## ✅ Summary

1. ✅ Import collection and environment files
2. ✅ Select "Gully Fame Admin Environment"
3. ✅ Run **Admin Login** request
4. ✅ Token auto-saved
5. ✅ Use other requests - token included automatically!

You're all set to test the Gully Fame Admin APIs! 🎉

