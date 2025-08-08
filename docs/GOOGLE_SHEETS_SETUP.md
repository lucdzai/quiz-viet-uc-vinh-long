# 🚀 Google Sheets Integration Setup Guide

This guide will help you set up Google Sheets integration for centralized data collection from the quiz application.

## 📊 Overview

The quiz application integrates with Google Sheets through Google Apps Script to:
- ✅ Collect user data from all participants
- ✅ Store quiz results and scores
- ✅ Track wheel spin results and prizes  
- ✅ Record final registration decisions
- ✅ Provide real-time statistics
- ✅ Enable cross-device data synchronization
- ✅ Support offline mode with localStorage fallback

## ⚡ Quick Start (5 minutes)

### Step 1: Create Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it "Quiz Data Collection"
4. Copy the Sheet ID from URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`

### Step 2: Create Google Apps Script  
1. Go to [Google Apps Script](https://script.google.com)
2. Click "New Project"
3. Replace all code with the content from `docs/google-apps-script.js`
4. Update `SPREADSHEET_ID` variable with your Sheet ID
5. Save project (Ctrl+S)

### Step 3: Deploy as Web App
1. Click "Deploy" → "New deployment"  
2. Type: "Web app"
3. Execute as: "Me"
4. Who has access: **"Anyone"** ⚠️ Important!
5. Click "Deploy" and copy the web app URL

### Step 4: Update Quiz Application
1. Open `config.js` in your quiz application
2. Replace `GOOGLE_SCRIPT_URL` with your web app URL
3. Save and test the application

✅ **Done!** Your quiz now saves data to Google Sheets with localStorage fallback.

## 🔧 Technical Features

### ✅ CORS Support
- Proper CORS headers configured for all API responses
- Supports cross-origin requests from any domain
- Handles preflight OPTIONS requests

### ✅ Error Handling & Retry Logic
- Automatic retry (2 attempts) with exponential backoff
- Graceful fallback to localStorage when Google Sheets is unavailable
- User-friendly error messages and notifications

### ✅ Real-time Data Sync
- Admin dashboard refreshes every 30 seconds
- Connection status indicator with health checks
- Automatic offline/online mode detection

### ✅ Data Backup & Export
- localStorage serves as automatic backup
- Manual data export (CSV, JSON)
- Data synchronization when connection is restored

## 📱 User Experience

### For Quiz Takers:
- ✅ Seamless experience regardless of backend status
- ✅ Data automatically saved (online or offline)
- ✅ No disruption if Google Sheets is temporarily unavailable

### For Administrators:
- ✅ Real-time dashboard with live statistics
- ✅ Clear connection status indicators  
- ✅ Data filtering and search capabilities
- ✅ Export functionality for reporting
- ✅ Mobile-responsive admin interface

## 🛡️ Troubleshooting

### Connection Issues

**❌ "Offline - Dùng localStorage" status**
- ✅ **Normal operation** - localStorage fallback is working
- ⚠️ Check Google Apps Script URL in `config.js`
- ⚠️ Verify web app deployed with "Anyone" access
- ⚠️ Confirm CORS headers are included in Apps Script

**❌ Data not appearing in Google Sheets**
- Check Apps Script execution logs for errors
- Verify `SPREADSHEET_ID` is correct in Apps Script
- Test Apps Script manually with the `testScript()` function

**❌ CORS errors in browser console**
- This is expected behavior with external APIs
- The application automatically falls back to localStorage
- Users will see "🟡 Chế độ offline" notification

### Testing the Integration

1. **Admin Dashboard Test**:
   - Open admin dashboard
   - Check connection status indicator
   - Click "🧪 Test kết nối" button
   - Verify appropriate notifications appear

2. **Data Flow Test**:
   - Complete a test quiz submission
   - Check if data appears in admin dashboard
   - Verify localStorage contains the data
   - If online, check Google Sheets for new row

3. **Offline Mode Test**:
   - Disconnect internet or use invalid script URL
   - Submit quiz data 
   - Verify "offline mode" notifications
   - Check that data is saved to localStorage
   - Restore connection and test sync functionality

## Step-by-Step Setup

### 1. Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it "Quiz Data Collection" or similar
4. Copy the sheet ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit#gid=0`
   - Copy the `SHEET_ID` part - you'll need this later

### 2. Set up Google Apps Script

1. Go to [Google Apps Script](https://script.google.com)
2. Click "New Project"
3. Replace the default `Code.gs` content with the code from `docs/google-apps-script.js`
4. Update the `SPREADSHEET_ID` variable:
   ```javascript
   const SPREADSHEET_ID = 'your_actual_sheet_id_here';
   ```
5. Save the project (Ctrl+S) and give it a name like "Quiz Data Handler"

### 3. Deploy the Script as Web App

1. In Apps Script, click "Deploy" → "New deployment"
2. Choose type: "Web app"
3. Configure:
   - **Description**: "Quiz Data Collection API"
   - **Execute as**: "Me (your-email@gmail.com)"
   - **Who has access**: "Anyone"
4. Click "Deploy"
5. **Important**: Copy the web app URL - it should look like:
   ```
   https://script.google.com/macros/s/AKfycby...../exec
   ```

### 4. Update Quiz Application Configuration

1. Open `config.js` in your quiz application
2. Update the `GOOGLE_SCRIPT_URL` with your web app URL:
   ```javascript
   GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'
   ```
3. Save the file

### 5. Test the Integration

1. Open the quiz application in your browser
2. Check the browser console for connection status
3. Complete a test quiz to verify data is being saved
4. Check your Google Sheet - you should see:
   - A "Quiz Results" tab created automatically
   - Headers in the first row
   - Test data in subsequent rows

## Data Structure

Your Google Sheet will contain the following columns:

| Column | Name | Description |
|--------|------|-------------|
| A | Timestamp | When user started the quiz |
| B | User ID | Unique identifier for each user |
| C | Name | User's full name |
| D | Phone | User's phone number |
| E | Class Type | Selected course type |
| F | User Agent | Browser information |
| G | IP Address | User's IP address |
| H | Score | Quiz score (0-5) |
| I | Quiz Completed At | When quiz was finished |
| J | Prize | Prize won from wheel spin |
| K | Wheel Completed At | When wheel was spun |
| L | Final Choice | User's registration decision |
| M | Registration Data | Additional registration info |
| N | Final Choice At | When final decision was made |

## Real-time Statistics

The admin dashboard will show real-time statistics including:
- Total participants
- Completed quizzes
- Passed quizzes (score ≥ 3)
- Registration decisions
- Conversion rates

## Troubleshooting

### Common Issues

**1. "Failed to save data" errors**
- Check that the Google Apps Script is deployed correctly
- Verify the web app URL in `config.js`
- Ensure the script has permission to access your Google Sheet

**2. Data not appearing in Google Sheets**
- Check the Google Apps Script execution logs:
  1. Go to Apps Script → Executions
  2. Look for error messages
- Verify the `SPREADSHEET_ID` is correct

**3. Permission errors**
- Make sure the web app is set to "Anyone" access
- Check that you're the owner of both the script and the sheet

**4. CORS errors**
- This is normal - the fallback to localStorage will work
- Users will see data saved locally until the connection is restored

### Testing the Connection

1. Open browser developer tools (F12)
2. Go to Console tab
3. Load the quiz application
4. Look for connection status messages:
   - ✅ "Trạng thái kết nối API: Hoạt động" = Working
   - ❌ "Trạng thái kết nối API: Lỗi" = Problem

### Manual Testing

You can test the Google Apps Script directly:

1. In Apps Script, go to the `testScript` function
2. Click "Run" to execute it
3. Check the execution log for results
4. Verify test data appears in your Google Sheet

## Security Considerations

- The web app is set to "Anyone" access to allow data submission
- No sensitive data should be stored in the client-side code
- User data is only stored in your private Google Sheet
- Consider adding rate limiting if needed

## Backup and Export

- All data is automatically backed up in Google Sheets
- You can export data as CSV/Excel from Google Sheets
- The admin panel also provides local export functionality
- Local data (localStorage) serves as a backup when offline

## Advanced Configuration

### Custom Sheet Names
To use a different sheet name, update the `SHEET_NAME` variable in the Apps Script:
```javascript
const SHEET_NAME = 'Your Custom Name';
```

### Additional Columns
To add more data columns:
1. Modify the `headers` array in `getOrCreateSheet()`
2. Update the `rowData` array in `saveUserData()`
3. Adjust update functions as needed

### Multiple Environments
For testing/production environments:
- Create separate Google Sheets
- Deploy separate Apps Script instances
- Use different `GOOGLE_SCRIPT_URL` values

## Support

If you encounter issues:
1. Check the Google Apps Script execution logs
2. Verify all URLs and IDs are correct
3. Test with a simple browser request to the web app URL
4. The application will fallback to localStorage if Google Sheets fails

## Success Criteria

Your integration is working correctly when:
- ✅ Users can complete the quiz without errors
- ✅ Data appears in your Google Sheet in real-time
- ✅ Admin dashboard shows live statistics
- ✅ Export functionality works
- ✅ Fallback to localStorage works when offline