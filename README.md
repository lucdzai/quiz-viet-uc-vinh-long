# Quiz Viet Uc Vinh Long - Google Sheets Integration

A comprehensive quiz application for language center students with centralized data collection via Google Sheets.

## 🌟 Features

### Core Functionality
- **Interactive quiz system** with multiple course types
- **Prize wheel** with configurable rewards  
- **User registration** and decision tracking
- **Real-time statistics** and analytics
- **QR code generation** for easy student access

### Data Collection
- **Google Sheets integration** for centralized data storage
- **localStorage fallback** when offline
- **Automatic data synchronization**
- **Real-time admin dashboard**
- **Data export** (CSV, JSON, Excel, PDF)

### Admin Features
- **Enhanced admin dashboard** with charts and analytics
- **User data management** with filtering and search
- **Connection status monitoring**
- **Offline mode support**
- **Backup and restore functionality**

## 🚀 Quick Start

### For Basic Usage (LocalStorage Only)
1. Clone the repository
2. Open `index.html` in a web browser
3. Admin can view QR code and basic statistics
4. Students scan QR code or visit `student.html`

### For Google Sheets Integration
1. **Follow the detailed setup guide**: [Google Sheets Setup Guide](docs/GOOGLE_SHEETS_SETUP.md)
2. Configure Google Apps Script
3. Update `config.js` with your script URL
4. Access enhanced admin dashboard at `admin.html`

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
│   ├── admin.js           # Admin dashboard functionality
│   └── google-sheets.js   # Enhanced Google Sheets integration
├── docs/
│   ├── google-apps-script.js      # Google Apps Script code
│   └── GOOGLE_SHEETS_SETUP.md    # Detailed setup instructions
└── assets/
    └── logo.svg           # Center logo
```

## ⚙️ Configuration

### Basic Configuration (config.js)
```javascript
const CONFIG = {
    // Google Apps Script URL (get this after deployment)
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
