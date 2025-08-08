# 🧪 Testing Guide for Cross-Device Admin Dashboard

This guide helps verify that the cross-device admin dashboard functionality is working correctly.

## 🎯 Test Scenarios

### Scenario 1: Cross-Device Data Visibility ✅

**Purpose**: Verify admin dashboard can see data from different student devices

**Steps**:
1. Open student quiz on Device A (e.g., phone)
2. Complete quiz and register for course
3. Open admin dashboard on Device B (e.g., laptop)
4. **Expected**: Admin should see the student's data immediately

**Success Criteria**:
- ✅ Student data appears in admin dashboard data table
- ✅ Statistics update with new participant count
- ✅ Recent activity shows student's journey
- ✅ Data source indicator shows "Google Sheets" when online

### Scenario 2: Real-Time Data Updates ✅

**Purpose**: Verify admin dashboard updates in real-time

**Steps**:
1. Open admin dashboard
2. Keep dashboard open while students take quiz on other devices
3. Watch for automatic updates (30-second refresh)
4. Use manual refresh button

**Success Criteria**:
- ✅ New data appears within 30 seconds automatically
- ✅ Manual refresh loads latest data immediately
- ✅ Statistics update correctly
- ✅ Connection status remains stable

### Scenario 3: Offline Fallback Mode ✅

**Purpose**: Verify system works when Google Sheets is unavailable

**Steps**:
1. Disconnect internet or use invalid Google Script URL
2. Open admin dashboard
3. **Expected**: Should fall back to localStorage gracefully

**Success Criteria**:
- ✅ Connection status shows "❌ Offline - Dùng localStorage"
- ✅ Data source indicator shows "🟡 localStorage (Local only)"
- ✅ Local data displays correctly
- ✅ User gets clear notification about offline mode

### Scenario 4: Data Source Transparency ✅

**Purpose**: Verify users can see where data is coming from

**Visual Indicators**:
- 🟢 **Google Sheets (Real-time)**: Data from all devices
- 🟡 **localStorage (Local only)**: Data from current device only
- ❌ **Offline - Dùng localStorage**: Fallback mode

**Steps**:
1. Check data source indicator in "Dữ liệu người dùng" section
2. Verify connection status in dashboard header
3. Test connection using "🧪 Test kết nối" button

## 🛠️ Manual Testing Steps

### Test 1: Fresh Installation
```bash
# 1. Clone repository
git clone https://github.com/lucdzai/quiz-viet-uc-vinh-long.git

# 2. Open admin.html in browser
# 3. Should see "❌ Offline - Dùng localStorage" (expected for fresh install)
# 4. Should see "🟡 localStorage (Local only)" in data section
```

### Test 2: With Test Data
```javascript
// Add test data in browser console
const testUsers = [
  {
    id: "test_001",
    name: "Test User 1",
    phone: "0901234567",
    classType: "thcs",
    timestamp: new Date().toISOString(),
    score: 4,
    choice: "register"
  }
];
localStorage.setItem('quizUsers', JSON.stringify(testUsers));
location.reload(); // Refresh page
```

### Test 3: Google Sheets Integration
1. Set up Google Sheets (see GOOGLE_SHEETS_SETUP.md)
2. Update `config.js` with valid Google Script URL
3. Test connection using admin dashboard
4. Submit test quiz data
5. Verify data appears in both Google Sheets and admin dashboard

## 🔍 What to Look For

### ✅ Working Correctly
- Data source indicators show current mode clearly
- Cross-device data appears in admin dashboard
- Fallback works seamlessly when Google Sheets unavailable
- Real-time updates work (30-second auto-refresh)
- Manual refresh button works
- Statistics calculate correctly
- Export functionality works

### ❌ Issues to Report
- Data from other devices not appearing
- Connection status stuck or incorrect
- Errors in browser console (except CORS, which is expected)
- Statistics not updating
- UI elements not responsive
- Notifications not appearing

## 📊 Expected Behavior Summary

| Condition | Connection Status | Data Source | Expected Behavior |
|-----------|------------------|-------------|------------------|
| Google Sheets Online | ✅ Google Sheets - Hoạt động | 🟢 Google Sheets (Real-time) | All device data visible |
| Google Sheets Offline | ❌ Offline - Dùng localStorage | 🟡 localStorage (Local only) | Current device data only |
| First Time Setup | ❌ Offline - Dùng localStorage | 🟡 localStorage (Local only) | No data until configured |

## 🚀 Performance Expectations

- **Page Load**: < 3 seconds
- **Data Refresh**: < 2 seconds
- **Connection Test**: < 5 seconds
- **Auto-refresh**: Every 30 seconds
- **Fallback Switch**: Immediate (< 1 second)

## 💡 Testing Tips

1. **Use Browser Dev Tools**: Check Console for detailed logs
2. **Test on Multiple Devices**: Verify true cross-device functionality
3. **Network Simulation**: Use dev tools to simulate offline/online
4. **Clear Storage**: Test fresh user experience
5. **Multiple Browsers**: Ensure compatibility

## 🐛 Common Test Issues

**Issue**: Data not showing
- **Check**: localStorage has data: `localStorage.getItem('quizUsers')`
- **Fix**: Add test data or complete a quiz

**Issue**: Google Sheets connection fails
- **Check**: Valid URL in config.js
- **Check**: Apps Script deployed with "Anyone" access
- **Expected**: Should fallback to localStorage gracefully

**Issue**: UI looks broken
- **Check**: Chart.js might be blocked by ad blocker
- **Expected**: Should show placeholder message instead

**Issue**: Multiple notifications
- **Check**: Browser console for stack overflow errors
- **Fix**: Refresh page to reset notification state