# Firebase Realtime Database Setup Guide

This guide walks you through setting up Firebase Realtime Database for the Quiz App to replace Google Sheets integration.

## Why Firebase?

Firebase Realtime Database offers several advantages over Google Sheets:
- **Real-time synchronization**: Changes appear instantly across all devices
- **Better reliability**: Fewer connection issues and timeouts
- **Offline support**: Built-in offline capabilities with automatic sync
- **Scalability**: Handles more concurrent users efficiently
- **No CORS issues**: Native web support without complex server setup

## Prerequisites

- A Google account
- Basic understanding of JavaScript
- Access to the Firebase Console

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name (e.g., `quiz-viet-uc-vinh-long`)
4. Choose whether to enable Google Analytics (optional)
5. Click **"Create project"**

## Step 2: Set Up Realtime Database

1. In your Firebase project console, click **"Realtime Database"** in the left sidebar
2. Click **"Create Database"**
3. Choose a location (select closest to your users, e.g., `asia-southeast1`)
4. Start in **"Test mode"** for now (we'll configure security later)
5. Click **"Done"**

## Step 3: Configure Database Rules

The project includes a `database.rules.json` file with the correct security rules. Deploy these rules using one of the following methods:

### Method 1: Using Firebase CLI (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project (if not already done)
firebase init database

# Deploy the rules
firebase deploy --only database
```

### Method 2: Manual Setup via Console

1. In the Realtime Database console, click on the **"Rules"** tab
2. Replace the default rules with the contents from `database.rules.json`:

```json
{
  "rules": {
    "users": {
      ".read": true,
      ".write": true,
      "$userId": {
        ".validate": "newData.hasChildren(['timestamp']) && newData.child('timestamp').isString()"
      }
    },
    "stats": {
      ".read": true,
      ".write": true,
      ".validate": "newData.hasChildren(['lastUpdated']) && newData.child('lastUpdated').isString()"
    }
  }
}
```

3. Click **"Publish"**

**Note**: These rules allow read/write access for development. For production, implement proper authentication and more restrictive rules.

## Step 4: Get Firebase Configuration

1. In Firebase Console, click the **gear icon** ⚙️ and select **"Project settings"**
2. Scroll down to **"Your apps"** section
3. Click the **Web app icon** `</>`
4. Register your app with a name (e.g., "Quiz Web App")
5. Copy the configuration object

## Step 5: Update Firebase Configuration

1. Open `js/firebase-config.js` in your project
2. Replace the placeholder configuration with your actual Firebase config:

```javascript
const FIREBASE_CONFIG = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id-default-rtdb.firebaseio.com/",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:your-actual-app-id"
};
```

## Step 6: Enable Firebase in Configuration

1. Open `config.js`
2. Set the database type to Firebase:

```javascript
const CONFIG = {
    // Database configuration - Choose between Firebase or Google Sheets
    DATABASE_TYPE: 'firebase', // Change this to 'firebase'
    USE_FIREBASE: true,        // Set this to true
    
    // ... rest of your configuration
};
```

## Step 7: Test the Setup

1. Open your admin dashboard (`admin.html`)
2. Check the connection status indicator
3. Look for Firebase connection messages in the browser console
4. Try submitting a test quiz as a student

### Expected Console Messages

```
🔥 Auto-initializing Firebase...
✅ Firebase initialized successfully
🔥 Firebase connection status: ✅ Connected
🔥 FirebaseDB instance created and available globally
🔥 Setting up Firebase real-time listeners...
✅ Firebase real-time listeners active
```

## Step 8: Database Structure

Your Firebase database will automatically create this structure:

```json
{
  "users": {
    "user_id_1": {
      "timestamp": "2025-01-09T03:44:28Z",
      "name": "Student Name",
      "phone": "0901234567",
      "classType": "thcs",
      "userAgent": "...",
      "ipAddress": "...",
      "score": 4,
      "quizCompletedAt": "...",
      "prize": "Giảm giá 50%",
      "wheelCompletedAt": "...",
      "choice": "register",
      "registrationData": {...},
      "finalChoiceAt": "..."
    }
  },
  "stats": {
    "totalParticipants": 15,
    "completedQuiz": 12,
    "passedQuiz": 8,
    "registeredUsers": 5,
    "declinedUsers": 3,
    "lastUpdated": "2025-01-09T04:00:00Z"
  }
}
```

## Production Security Rules

For production deployment, replace the test rules with more secure ones:

```json
{
  "rules": {
    "users": {
      ".read": true,
      ".write": true,
      "$userId": {
        ".validate": "newData.hasChildren(['timestamp', 'name', 'phone', 'classType'])",
        ".write": "!data.exists() || (!newData.exists() && data.exists())"
      }
    },
    "stats": {
      ".read": true,
      ".write": "newData.hasChildren(['lastUpdated'])"
    }
  }
}
```

## Monitoring and Analytics

1. **Usage Monitoring**: Check Firebase Console for real-time usage
2. **Performance**: Monitor response times in the admin dashboard
3. **Errors**: Check browser console for any Firebase errors
4. **Costs**: Monitor Firebase usage in the console (Realtime DB has generous free tier)

## Troubleshooting

### Common Issues

**1. "Firebase not configured" error**
- Ensure you've updated `FIREBASE_CONFIG` with actual values
- Check that all required fields are present

**2. "Permission denied" errors**
- Verify database rules are correctly set
- Check that the database URL is correct

**3. "Firebase not initialized"**
- Ensure Firebase scripts are loaded before application scripts
- Check browser console for initialization errors

**4. Real-time updates not working**
- Verify the admin dashboard shows "Firebase real-time listeners active"
- Check that the database type is set to 'firebase' in config.js

### Debug Mode

Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('debug', 'true');
```

### Connection Test

Test Firebase connection manually:
```javascript
// In browser console
FirebaseConfig.testFirebaseConnection().then(result => {
    console.log('Connection test:', result);
});
```

## Backup and Migration

### Exporting Data
Firebase data can be exported via:
1. Firebase Console → Database → Export JSON
2. Admin dashboard export functions (CSV, JSON)

### Migrating from Google Sheets
1. Export existing Google Sheets data
2. Import to Firebase using the admin dashboard
3. Update configuration to use Firebase
4. Test thoroughly before switching

## Performance Optimization

1. **Index frequently queried fields** in Firebase Console
2. **Use pagination** for large datasets
3. **Implement data cleanup** for old records
4. **Monitor quota usage** to avoid overages

## Support

For Firebase-specific issues:
- [Firebase Documentation](https://firebase.google.com/docs/database)
- [Firebase Console](https://console.firebase.google.com/)
- Check browser console for detailed error messages

For app-specific issues:
- Check `TROUBLESHOOTING.md`
- Review browser console logs
- Test with different browsers/devices