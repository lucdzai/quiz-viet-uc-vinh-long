# Quiz Viet Uc Vinh Long - Cross-Device Admin Dashboard with Firebase Integration

A comprehensive quiz application for language center students with **Firebase Realtime Database** and **Google Sheets integration** options, featuring **cross-device data collection** and **real-time synchronization**.

## 🔥 **NEW: Firebase Realtime Database Integration! 🎉**

**Major Enhancement**: The app now supports Firebase Realtime Database as the primary data storage option, offering significant advantages over Google Sheets:

✅ **Real-time synchronization**: Changes appear instantly across all devices  
✅ **Better reliability**: No more connection timeouts or CORS issues  
✅ **Offline support**: Built-in offline capabilities with automatic sync  
✅ **Live dashboard**: Admin sees updates in real-time without refresh  
✅ **Scalable**: Handles more concurrent users efficiently  
✅ **No server setup**: Direct web integration without complex backend

![Firebase Integration](https://github.com/user-attachments/assets/231b3e16-6c84-4e10-b205-ceb3dd8cc791)

## 🌟 Features

### Core Functionality
- **Interactive quiz system** with multiple course types
- **Prize wheel** with configurable rewards  
- **User registration** and decision tracking
- **Real-time statistics** and analytics
- **QR code generation** for easy student access

### 🔧 Database Integration Options

Choose between two powerful data storage options:

#### 🔥 Firebase Realtime Database (Recommended)
- ✅ **Real-time sync** - Changes appear instantly across all devices
- ✅ **Better reliability** - No connection timeouts or CORS issues
- ✅ **Offline support** - Built-in offline capabilities with automatic sync
- ✅ **Live dashboard** - Admin sees updates without page refresh
- ✅ **No server setup** - Direct web integration

#### 📊 Google Sheets Integration (Alternative)
- ✅ **CORS ISSUE FIXED** - Added missing `doOptions()` function for preflight requests
- ✅ **Cross-device sync** - Students' phone data syncs to Google Sheets
- ✅ **No more POST blocking** - Browser preflight requests handled properly
- ✅ **Enhanced error handling** with retry logic (2 attempts + exponential backoff)
- ✅ **Real-time connection status** with detailed feedback
- ✅ **Automatic fallback to localStorage** when Google Sheets is unavailable

### Data Collection
- **Firebase Realtime Database** for real-time data storage and sync (recommended)
- **Google Sheets integration** as alternative option for centralized data storage
- **localStorage fallback** when offline  
- **Automatic data synchronization** with conflict resolution
- **Real-time admin dashboard** with live updates (Firebase) or 30-second refresh (Google Sheets)
- **Data export** (CSV, JSON, Excel, PDF)

### Admin Features
- **Enhanced admin dashboard** with charts and analytics
- **User data management** with filtering and search
- **Connection status monitoring** with troubleshooting tips
- **Offline mode support** with sync notifications
- **Backup and restore functionality**

## 🚀 Quick Start

### For Firebase Integration (Recommended)
1. **Follow the Firebase setup guide**: [Firebase Setup Guide](docs/FIREBASE_SETUP.md)
2. Create Firebase project and Realtime Database
3. Update `js/firebase-config.js` with your Firebase configuration
4. Set `DATABASE_TYPE: 'firebase'` in `config.js`
5. Access enhanced admin dashboard at `admin.html` with real-time updates

### For Google Sheets Integration (Alternative)
1. **Follow the Google Sheets setup guide**: [Google Sheets Setup Guide](docs/GOOGLE_SHEETS_SETUP.md)
2. Configure Google Apps Script
3. Update `config.js` with your script URL
4. Set `DATABASE_TYPE: 'google_sheets'` in `config.js`
5. Access enhanced admin dashboard at `admin.html`

### For Basic Usage (LocalStorage Only)
1. Clone the repository
2. Open `index.html` in a web browser
3. Admin can view QR code and basic statistics
4. Students scan QR code or visit `student.html`

## 📁 File Structure

```
quiz-viet-uc-vinh-long/
├── index.html              # Main admin page (basic)
├── admin.html              # Enhanced admin dashboard
├── student.html            # Student quiz interface
├── script.js               # Main application logic
├── style.css               # Styling
├── config.js               # Configuration and database functions
├── js/
│   ├── firebase-config.js  # Firebase configuration and setup
│   ├── firebase-database.js # Firebase Realtime Database service
│   ├── admin.js           # Admin dashboard functionality
│   └── google-sheets.js   # Enhanced Google Sheets integration
├── docs/
│   ├── FIREBASE_SETUP.md       # Firebase setup instructions
│   ├── google-apps-script.js   # Google Apps Script code
│   └── GOOGLE_SHEETS_SETUP.md  # Google Sheets setup instructions
└── assets/
    └── logo.svg           # Center logo
```

## ⚙️ Configuration

### Basic Configuration (config.js)
```javascript
const CONFIG = {
    // Database configuration - Choose your data storage option
    DATABASE_TYPE: 'firebase',  // 'firebase' or 'google_sheets'
    USE_FIREBASE: true,          // Enable Firebase integration
    
    // Google Apps Script URL (for Google Sheets option)
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
    
    // Your website URL
    WEBSITE_URL: 'https://your-domain.github.io/quiz-viet-uc-vinh-long',
    
    // Center information
    CENTER_INFO: {
        name: 'Your Center Name',
        address: 'Your Address',
        phone: 'Your Phone',
        // ... other details
    },
    
    // Quiz settings
    QUIZ_SETTINGS: {
        PASS_SCORE: 3,        // Minimum score for wheel
        TOTAL_QUESTIONS: 5,   // Questions per quiz
        TIME_LIMIT: 300       // Time limit in seconds
    }
};
```

### Firebase Setup
See [Firebase Setup Guide](docs/FIREBASE_SETUP.md) for detailed instructions.

### Google Sheets Setup
See [Google Sheets Setup Guide](docs/GOOGLE_SHEETS_SETUP.md) for detailed instructions.

## 🎯 Usage Guide

### For Administrators

#### Basic Admin (index.html)
- View QR code for students
- See basic real-time statistics
- Export data as CSV
- Reset quiz data

#### Enhanced Admin Dashboard (admin.html)
- **Dashboard**: Overview with charts and recent activity
- **Data Management**: View, filter, and search user data
- **Analytics**: Detailed charts and statistics
- **Export**: Multiple export formats with customization
- **Settings**: Connection status, sync, and configuration

### For Students (student.html)
1. Fill in personal information
2. Select course type
3. Complete 5-question quiz
4. Spin prize wheel (if score ≥ 3)
5. Make final registration decision

## 📊 Data Structure

The system collects the following data points:

| Field | Description |
|-------|-------------|
| Timestamp | When user started |
| User ID | Unique identifier |
| Name | Full name |
| Phone | Contact number |
| Class Type | Selected course |
| User Agent | Browser info |
| IP Address | User location |
| Score | Quiz result (0-5) |
| Quiz Completed At | Completion time |
| Prize | Prize from wheel |
| Wheel Completed At | Wheel spin time |
| Final Choice | Registration decision |
| Registration Data | Additional details |
| Final Choice At | Decision time |

## 🔄 Data Flow

1. **Student Registration**: Data saved to Google Sheets + localStorage
2. **Quiz Completion**: Score updated in both systems
3. **Wheel Spin**: Prize recorded with timestamp
4. **Final Decision**: Registration choice saved
5. **Admin View**: Real-time stats from Google Sheets (fallback to localStorage)
6. **Offline Mode**: Automatic fallback with sync when online

## 🛠️ Technical Features

### Error Handling
- **Retry Logic**: Automatic retries for failed requests
- **Fallback System**: localStorage when Google Sheets unavailable
- **User Feedback**: Clear notifications for all actions
- **Connection Monitoring**: Real-time status updates

### Performance
- **Lazy Loading**: Charts and data loaded on demand
- **Caching**: Efficient data management
- **Responsive Design**: Mobile-friendly interface
- **Progressive Enhancement**: Works without JavaScript

### Security
- **Data Validation**: Input sanitization and validation
- **CORS Handling**: Proper cross-origin setup
- **Privacy Protection**: Secure data transmission
- **Access Control**: Admin-only features protection

## 🚨 Troubleshooting

### Common Issues

**Google Sheets Connection Failed**
- Check Google Apps Script deployment
- Verify script URL in config.js
- Ensure "Anyone" access permissions
- Check browser console for errors

**Data Not Syncing**
- Test connection in admin dashboard
- Check Google Apps Script execution logs
- Verify internet connection
- Use sync function in admin settings

**Mobile Issues**
- Ensure responsive design is working
- Test QR code scanning
- Check touch interactions
- Verify form submission

### Debug Mode
Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('debug', 'true');
```

## 📈 Analytics & Reporting

The system provides comprehensive analytics:

- **Participation Metrics**: Total users, completion rates
- **Performance Analysis**: Score distributions, pass rates
- **Conversion Tracking**: Registration decision rates
- **Time Analysis**: Usage patterns by hour/day
- **Course Popularity**: Distribution by course type

## 🔒 Privacy & Security

- User data stored securely in Google Sheets
- No sensitive data in client-side code
- GDPR-compliant data collection
- Secure data transmission via HTTPS
- Optional data anonymization

## 📋 Deployment Checklist

- [ ] Create Google Sheet
- [ ] Deploy Google Apps Script
- [ ] Update config.js with script URL
- [ ] Test connection and data flow
- [ ] Customize center information
- [ ] Set up domain/hosting
- [ ] Test all functionality
- [ ] Train admin users
- [ ] Monitor initial usage

## 🆘 Support

For technical support:
1. Check the troubleshooting section
2. Review Google Apps Script logs
3. Test with sample data
4. Check browser developer console
5. Verify all configuration steps

## Demo
https://lucdzai.github.io/quiz-viet-uc-vinh-long

---
© 2025 Trung Tâm Ngoại Ngữ Việt Úc Vĩnh Long
