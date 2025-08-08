/**
 * Google Apps Script for Quiz Data Collection
 * 
 * This script receives data from the quiz application and stores it in Google Sheets.
 * 
 * Setup Instructions:
 * 1. Open Google Apps Script (script.google.com)
 * 2. Create a new project
 * 3. Replace the default code with this script
 * 4. Create a new Google Sheet and note its ID
 * 5. Update the SPREADSHEET_ID variable below with your sheet ID
 * 6. Deploy as web app with execute permissions for "Anyone"
 * 7. Copy the web app URL and update CONFIG.GOOGLE_SCRIPT_URL in config.js
 */

// Configuration - UPDATE THIS WITH YOUR GOOGLE SHEET ID
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your actual Google Sheet ID
const SHEET_NAME = 'Quiz Results';

/**
 * Main function to handle POST requests
 */
function doPost(e) {
  try {
    console.log('Received POST request:', e.postData.contents);
    
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    console.log('Action:', action);
    
    switch (action) {
      case 'saveUser':
        return saveUserData(data.data);
      case 'updateQuiz':
        return updateQuizResult(data.userId, data.score, data.answers);
      case 'updateWheel':
        return updateWheelResult(data.userId, data.prize);
      case 'updateFinal':
        return updateFinalChoice(data.userId, data.choice, data.registrationData);
      case 'getStats':
        return getStats();
      default:
        throw new Error('Unknown action: ' + action);
    }
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests for testing
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: 'Quiz Google Apps Script is running',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Save user data to Google Sheets
 */
function saveUserData(userData) {
  try {
    const sheet = getOrCreateSheet();
    
    // Generate unique ID if not provided
    const userId = userData.id || Utilities.getUuid();
    
    // Create row data with all columns
    const rowData = [
      new Date(userData.timestamp || new Date()),  // A: Timestamp
      userId,                                       // B: User ID
      userData.name || '',                         // C: Name
      userData.phone || '',                        // D: Phone
      userData.classType || '',                    // E: Class Type
      userData.userAgent || '',                    // F: User Agent
      userData.ipAddress || '',                    // G: IP Address
      '',                                          // H: Score (will be updated later)
      '',                                          // I: Quiz Completed At
      '',                                          // J: Prize
      '',                                          // K: Wheel Completed At
      '',                                          // L: Final Choice
      '',                                          // M: Registration Data
      ''                                           // N: Final Choice At
    ];
    
    // Add the row
    sheet.appendRow(rowData);
    
    console.log('User data saved successfully:', userId);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        userId: userId,
        message: 'User data saved successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
}

/**
 * Update quiz result for a user
 */
function updateQuizResult(userId, score, answers) {
  try {
    const sheet = getOrCreateSheet();
    const row = findUserRow(sheet, userId);
    
    if (row === -1) {
      throw new Error('User not found: ' + userId);
    }
    
    // Update score and quiz completion time
    sheet.getRange(row, 8).setValue(score);  // Column H: Score
    sheet.getRange(row, 9).setValue(new Date());  // Column I: Quiz Completed At
    
    console.log('Quiz result updated for user:', userId);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Quiz result updated successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error updating quiz result:', error);
    throw error;
  }
}

/**
 * Update wheel result for a user
 */
function updateWheelResult(userId, prize) {
  try {
    const sheet = getOrCreateSheet();
    const row = findUserRow(sheet, userId);
    
    if (row === -1) {
      throw new Error('User not found: ' + userId);
    }
    
    const prizeText = typeof prize === 'string' ? prize : (prize.name || JSON.stringify(prize));
    
    // Update prize and wheel completion time
    sheet.getRange(row, 10).setValue(prizeText);  // Column J: Prize
    sheet.getRange(row, 11).setValue(new Date());  // Column K: Wheel Completed At
    
    console.log('Wheel result updated for user:', userId);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Wheel result updated successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error updating wheel result:', error);
    throw error;
  }
}

/**
 * Update final choice for a user
 */
function updateFinalChoice(userId, choice, registrationData) {
  try {
    const sheet = getOrCreateSheet();
    const row = findUserRow(sheet, userId);
    
    if (row === -1) {
      throw new Error('User not found: ' + userId);
    }
    
    // Update final choice and registration data
    sheet.getRange(row, 12).setValue(choice);  // Column L: Final Choice
    sheet.getRange(row, 13).setValue(JSON.stringify(registrationData || {}));  // Column M: Registration Data
    sheet.getRange(row, 14).setValue(new Date());  // Column N: Final Choice At
    
    console.log('Final choice updated for user:', userId);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Final choice updated successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error updating final choice:', error);
    throw error;
  }
}

/**
 * Get statistics from the sheet
 */
function getStats() {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    // Skip header row
    const users = data.slice(1);
    
    const stats = {
      totalParticipants: users.length,
      completedQuiz: users.filter(row => row[7] !== '').length,  // Score column
      passedQuiz: users.filter(row => row[7] >= 3).length,
      registeredUsers: users.filter(row => row[11] === 'register').length,  // Final Choice column
      declinedUsers: users.filter(row => row[11] === 'decline').length,
      lastUpdated: new Date().toISOString()
    };
    
    console.log('Stats calculated:', stats);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        ...stats
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
}

/**
 * Get or create the main sheet
 */
function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    
    // Add headers
    const headers = [
      'Timestamp',           // A
      'User ID',            // B
      'Name',               // C
      'Phone',              // D
      'Class Type',         // E
      'User Agent',         // F
      'IP Address',         // G
      'Score',              // H
      'Quiz Completed At',  // I
      'Prize',              // J
      'Wheel Completed At', // K
      'Final Choice',       // L
      'Registration Data',  // M
      'Final Choice At'     // N
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
    
    console.log('Sheet created with headers');
  }
  
  return sheet;
}

/**
 * Find user row by user ID
 */
function findUserRow(sheet, userId) {
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {  // Skip header row
    if (data[i][1] === userId) {  // Column B: User ID
      return i + 1;  // Return 1-based row number
    }
  }
  
  return -1;  // User not found
}

/**
 * Test function to verify the script is working
 */
function testScript() {
  console.log('Testing Google Apps Script...');
  
  try {
    const sheet = getOrCreateSheet();
    console.log('Sheet access successful');
    
    // Test save user
    const testUser = {
      name: 'Test User',
      phone: '0123456789',
      classType: 'test',
      timestamp: new Date().toISOString(),
      userAgent: 'Test Browser',
      ipAddress: '127.0.0.1'
    };
    
    const result = saveUserData(testUser);
    console.log('Test user saved:', result);
    
    return 'Test completed successfully';
    
  } catch (error) {
    console.error('Test failed:', error);
    return 'Test failed: ' + error.toString();
  }
}