# Test Data for Quiz Application

## Adding Test Data to localStorage

To test the admin dashboard functionality when Firebase is not available, you can add test data to localStorage:

```javascript
// Add this to browser console to create test data
const testUsers = [
    {
        id: "test1",
        name: "Nguyễn Văn A",
        phone: "0901234567",
        classType: "thcs",
        timestamp: "2024-12-28T10:30:00Z",
        score: 4,
        prize: "Giảm giá 50%",
        choice: "register",
        registrationData: {
            registrationDecision: "register"
        }
    },
    {
        id: "test2", 
        name: "Trần Thị B",
        phone: "0987654321",
        classType: "tieng-anh-giao-tiep",
        timestamp: "2024-12-28T11:00:00Z",
        score: 5,
        prize: "Voucher học phí",
        choice: "register",
        registrationData: {
            registrationDecision: "register"
        }
    },
    {
        id: "test3",
        name: "Lê Văn C", 
        phone: "0912345678",
        classType: "thpt",
        timestamp: "2024-12-28T11:30:00Z",
        score: 2,
        choice: "decline"
    }
];

localStorage.setItem('quizUsers', JSON.stringify(testUsers));
console.log('Test data added to localStorage');

// Refresh the page to see the data
location.reload();
```

## Testing Firebase Connection

If Firebase becomes available, you can test the connection:

```javascript
// Test Firebase configuration
if (typeof FirebaseConfig !== 'undefined') {
    console.log('Firebase Config Status:', FirebaseConfig.getConnectionStatus());
    
    FirebaseConfig.testFirebaseConnection().then(result => {
        console.log('Firebase connection test:', result);
    }).catch(error => {
        console.log('Firebase connection failed:', error);
    });
}

// Test Firebase Fallback
if (typeof window.FirebaseFallback !== 'undefined') {
    console.log('Firebase Fallback Status:', window.FirebaseFallback.getConnectionStatus());
    
    window.FirebaseFallback.healthCheck().then(health => {
        console.log('Firebase Fallback health:', health);
    });
}
```

## Testing Admin Dashboard Features

1. **Connection Status**: Should show localStorage mode when Firebase is blocked
2. **Statistics**: Should display test data statistics correctly
3. **User Data**: Should show the test users in the data table
4. **Real-time Updates**: Should fall back to polling when Firebase is unavailable
5. **Export Functions**: Should work with test data

## Expected Results

With test data added:
- Total participants: 3
- Completed quiz: 3
- Passed quiz: 2 (score >= 3)
- Registered users: 2
- Declined users: 1
- Conversion rate: 67%