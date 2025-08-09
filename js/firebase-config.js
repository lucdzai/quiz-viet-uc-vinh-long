/**
 * Firebase Configuration Module
 * 
 * This module provides Firebase Realtime Database configuration and initialization.
 * Replace the placeholder configuration with your actual Firebase project settings.
 */

// Firebase configuration object
// IMPORTANT: Replace these with your actual Firebase project configuration
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCweCbYPM-OWpQ5tVrK7AMT-xh0OL_SgLI",
    authDomain: "quiz-viet-uc-vinh-long.firebaseapp.com",
    databaseURL: "https://quiz-viet-uc-vinh-long-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "quiz-viet-uc-vinh-long",
    storageBucket: "quiz-viet-uc-vinh-long.firebasestorage.app",
    messagingSenderId: "324450811055",
    appId: "1:324450811055:web:0c114401847a7c664ca85a"
};

// Firebase database reference paths
const DB_PATHS = {
    USERS: 'users',
    STATS: 'stats'
};

// Firebase initialization state
let firebaseApp = null;
let database = null;
let isFirebaseInitialized = false;

/**
 * Initialize Firebase application
 */
function initializeFirebase() {
    try {
        // Check if Firebase SDK is loaded
        if (typeof firebase === 'undefined') {
            console.warn('⚠️ Firebase SDK not loaded. Please include Firebase scripts in your HTML.');
            return false;
        }

        // Check if Firebase is already initialized
        if (firebase.apps.length > 0) {
            firebaseApp = firebase.app();
            database = firebase.database();
            isFirebaseInitialized = true;
            console.log('✅ Firebase already initialized');
            return true;
        }

        // Initialize Firebase
        firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
        database = firebase.database();
        isFirebaseInitialized = true;
        
        console.log('✅ Firebase initialized successfully');
        
        // Set up connection monitoring
        setupConnectionMonitoring();
        
        return true;
        
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        isFirebaseInitialized = false;
        return false;
    }
}

/**
 * Set up Firebase connection monitoring
 */
function setupConnectionMonitoring() {
    if (!database) return;
    
    const connectedRef = database.ref('.info/connected');
    connectedRef.on('value', (snapshot) => {
        const connected = snapshot.val();
        console.log(`🔥 Firebase connection status: ${connected ? '✅ Connected' : '❌ Disconnected'}`);
        
        // Update global connection status
        if (typeof ConnectionStatus !== 'undefined') {
            ConnectionStatus.isOnline = connected;
            ConnectionStatus.currentDatabaseType = connected ? 'firebase' : 'localStorage';
        }
        
        // Trigger custom event for UI updates
        window.dispatchEvent(new CustomEvent('firebaseConnectionUpdate', { 
            detail: { connected }
        }));
        
        // Trigger connection status update for admin dashboard
        window.dispatchEvent(new CustomEvent('connectionStatusUpdate', { 
            detail: { 
                online: connected,
                databaseType: connected ? 'firebase' : 'localStorage'
            }
        }));
    });
}

/**
 * Get Firebase database reference
 */
function getDatabase() {
    if (!isFirebaseInitialized) {
        console.warn('⚠️ Firebase not initialized. Call initializeFirebase() first.');
        return null;
    }
    return database;
}

/**
 * Get Firebase app instance
 */
function getFirebaseApp() {
    return firebaseApp;
}

/**
 * Check if Firebase is properly configured
 */
function isFirebaseConfigured() {
    return FIREBASE_CONFIG.apiKey !== 'your-api-key-here' && 
           FIREBASE_CONFIG.projectId !== 'your-project-id';
}

/**
 * Get Firebase connection status
 */
function getConnectionStatus() {
    return {
        initialized: isFirebaseInitialized,
        configured: isFirebaseConfigured(),
        app: firebaseApp !== null,
        database: database !== null
    };
}

/**
 * Test Firebase connection
 */
async function testFirebaseConnection() {
    if (!isFirebaseInitialized || !database) {
        return false;
    }
    
    try {
        // Try to read server timestamp
        const snapshot = await database.ref('.info/serverTimeOffset').once('value');
        return snapshot.exists();
    } catch (error) {
        console.error('❌ Firebase connection test failed:', error);
        return false;
    }
}

// Export configuration and functions
window.FirebaseConfig = {
    FIREBASE_CONFIG,
    DB_PATHS,
    initializeFirebase,
    getDatabase,
    getFirebaseApp,
    isFirebaseConfigured,
    getConnectionStatus,
    testFirebaseConnection,
    setupConnectionMonitoring
};

// Auto-initialize Firebase when script loads (if configured)
document.addEventListener('DOMContentLoaded', function() {
    if (isFirebaseConfigured()) {
        console.log('🔥 Auto-initializing Firebase...');
        setTimeout(() => {
            // Delay initialization to ensure Firebase SDK is loaded
            if (typeof firebase !== 'undefined') {
                initializeFirebase();
            } else {
                console.warn('⚠️ Firebase SDK not available - check network or ad blockers');
                // Trigger fallback mode event
                window.dispatchEvent(new CustomEvent('connectionStatusUpdate', { 
                    detail: { 
                        online: false,
                        databaseType: 'localStorage',
                        error: 'Firebase SDK not loaded'
                    }
                }));
            }
        }, 100);
    } else {
        console.log('⚠️ Firebase not configured. Update FIREBASE_CONFIG in firebase-config.js');
    }
});