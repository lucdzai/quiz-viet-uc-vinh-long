# 🔧 Troubleshooting Guide

Common issues and solutions for the Quiz Application with Google Sheets integration.

## 🔍 Quick Diagnosis

### Check Connection Status
1. Open admin dashboard (`admin.html`)
2. Look at connection indicator in header
3. Click "🧪 Test kết nối" button
4. Check browser console for detailed logs

### Common Status Messages

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| ✅ Google Sheets - Hoạt động | Connected and working | None - everything is working |
| ❌ Offline - Dùng localStorage | Using fallback mode | Check Google Apps Script setup |
| 🔄 Đang kiểm tra... | Testing connection | Wait for result |

## 🚨 Common Issues

### 1. "Offline - Dùng localStorage" Status

**Symptoms:**
- Admin dashboard shows offline status
- Data saved only to localStorage
- No data appearing in Google Sheets

**Solutions:**

#### Check Google Apps Script URL
```javascript
// In config.js, verify this URL is correct:
GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_ACTUAL_ID/exec'
```

#### Verify Web App Deployment
1. Open Google Apps Script project
2. Click "Deploy" → "Manage deployments"
3. Ensure:
   - ✅ Type: "Web app"
   - ✅ Execute as: "Me"
   - ✅ Who has access: **"Anyone"** (Critical!)

#### Test Script Independently
1. Copy your Google Apps Script URL
2. Open in new browser tab
3. Should see: `{"success":true,"message":"Quiz Google Apps Script is running"...}`

### 2. CORS Errors in Browser Console - FIXED! ✅

**Previous Issue (NOW RESOLVED):**
```
Access to fetch at 'https://script.google.com/...' from origin 'https://yoursite.com' has been blocked by CORS policy
```

**✅ SOLUTION IMPLEMENTED**: Added `doOptions()` function to Google Apps Script

**What was fixed:**
- ✅ Added missing `doOptions()` function to handle browser preflight requests
- ✅ CORS headers now properly configured for OPTIONS, GET, and POST methods
- ✅ Cross-device data synchronization now works without CORS errors
- ✅ POST requests to Google Apps Script no longer blocked

**Expected behavior after fix:**
- Students can submit quiz data from phones → data syncs to Google Sheets
- Admin dashboard shows real-time data from ALL devices
- No more CORS errors in browser console
- Cross-device data collection works perfectly

**Note:** If you still see CORS errors, ensure you've updated your Google Apps Script with the latest code from `docs/google-apps-script.js` that includes the `doOptions()` function.

### 3. No Data in Google Sheets

**Symptoms:**
- Connection status shows online
- Quiz submissions seem to work
- But no rows appear in Google Sheets

**Solutions:**

#### Check Spreadsheet ID
```javascript
// In your Google Apps Script, verify:
const SPREADSHEET_ID = 'your_actual_spreadsheet_id_here';
```

#### Verify Sheet Permissions
1. Google Apps Script and Google Sheet must be owned by same Google account
2. Script execution policy must be "Me" (owner)
3. Sheet must not be restricted or protected

#### Check Apps Script Logs
1. Open Google Apps Script project
2. Click "Executions" in left sidebar
3. Look for errors in recent executions
4. Common errors:
   - "Permission denied" → Check ownership
   - "Spreadsheet not found" → Check SPREADSHEET_ID

### 4. Charts Not Loading

**Symptoms:**
- Admin dashboard loads but charts are missing
- Console error: "Chart is not defined"

**Solutions:**

#### CDN Blocked
- Some networks block CDN resources
- Chart.js library fails to load
- **This is cosmetic only** - data and functionality still work

#### Alternative Solutions
- Use different network/connection
- Charts will load when CDN is accessible
- Core functionality (data, tables) works without charts

### 5. QR Code Not Generating

**Symptoms:**
- Shows "📱 Không thể tạo mã QR" 
- Fallback link is displayed instead

**Solutions:**

#### QR Library Blocked
- QR code library CDN is blocked
- **Fallback link works perfectly** - students can still access quiz

#### Update Website URL
```javascript
// In config.js, ensure this matches your actual domain:
WEBSITE_URL: 'https://your-actual-domain.com'
```

## 🧪 Testing & Debugging

### Manual Connection Test
```javascript
// Run in browser console on admin page:
Database.testConnection().then(result => {
    console.log('Connection test result:', result);
});
```

### Check localStorage Data
```javascript
// View saved data:
console.log(JSON.parse(localStorage.getItem('quizUsers') || '[]'));

// Clear local data (for testing):
localStorage.clear();
```

### Force Refresh Dashboard
```javascript
// Refresh admin dashboard manually:
if (typeof refreshDashboard === 'function') {
    refreshDashboard();
}
```

## 📊 Understanding the Logs

### Normal Operation Logs
```
🔄 Testing Google Apps Script connection...
✅ Connection test result: {success: true, message: "..."}
🟢 Google Sheets connection: ONLINE
📊 Stats loaded: {success: true, totalParticipants: 5, ...}
```

### Offline Mode Logs
```
🔄 Testing Google Apps Script connection...
🔴 Google Sheets connection: OFFLINE - Failed to fetch
🌐 Network error or CORS issue - using localStorage fallback
📊 Stats loaded: {success: true, totalParticipants: 3, source: "localStorage"}
```

### Error Logs to Investigate
```
❌ HTTP 404: Not Found → Check Google Apps Script URL
❌ HTTP 403: Forbidden → Check web app permissions
❌ Spreadsheet not found → Check SPREADSHEET_ID
```

## 🔄 Recovery Procedures

### Data Recovery from localStorage
If Google Sheets connection is lost, data is safely stored in localStorage:

1. **Export localStorage data:**
   - Open admin dashboard
   - Go to "📤 Xuất dữ liệu" tab
   - Click "📄 Xuất JSON" to download backup

2. **Manual import to Google Sheets:**
   - Download the JSON file
   - Convert to CSV using online tools
   - Import to Google Sheets manually

### Sync After Connection Restored
1. Open admin dashboard
2. Go to "⚙️ Cài đặt" tab  
3. Click "🔄 Đồng bộ dữ liệu"
4. Wait for sync completion notification

## 🛠️ Advanced Troubleshooting

### Enable Verbose Logging
Add to browser console:
```javascript
// Enable detailed connection logging
window.DEBUG_MODE = true;
```

### Test Google Apps Script Directly
1. Open Google Apps Script project
2. Select `testScript` function
3. Click "Run" button
4. Check execution log for errors

### Network Diagnostics
```bash
# Test Google Apps Script accessibility
curl -I "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"

# Should return HTTP 200 or 302
```

## 📞 When to Seek Help

Contact support or create an issue if:

- ✅ You've followed all troubleshooting steps
- ✅ Google Apps Script URL is verified correct
- ✅ Web app is deployed with "Anyone" access
- ✅ No errors in Apps Script execution logs
- ❌ Connection still fails after 24 hours

Include in your report:
- Browser and version
- Connection status screenshots
- Browser console logs
- Google Apps Script execution logs

## ✅ Success Indicators

Your setup is working correctly when:

- [ ] Admin dashboard loads without errors
- [ ] Connection status shows accurate information
- [ ] Test quiz data appears in dashboard
- [ ] localStorage fallback works when offline
- [ ] Notifications appear for connection changes
- [ ] Data export functions work properly