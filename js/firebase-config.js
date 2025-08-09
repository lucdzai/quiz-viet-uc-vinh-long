/**
 * Firebase Configuration Module
 * 
 * This module provides Firebase Realtime Database configuration and initialization.
 * Updated for Firebase SDK v10.7.1 with modular imports.
 */

// Firebase configuration object
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCweCbYPM-OWpQ5tVrK7AMT-xh0OL_SgLI",
    authDomain: "quiz-viet-uc-vinh-long.firebaseapp.com",
    databaseURL: "https://quiz-viet-uc-vinh-long-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "quiz-viet-uc-vinh-long",
    storageBucket: "quiz-viet-uc-vinh-long.firebasestorage.app",
    messagingSenderId: "324450811055",
    appId: "1:324450811055:web:0c114401847a7c664ca85a",
    measurementId: "G-V1BRGTJTWW"
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
 * Initialize Firebase application with v10 syntax
 */
function initializeFirebase() {
    try {
        // Check if Firebase modules are loaded
        if (typeof window.firebase === 'undefined' || !window.firebase.initializeApp) {
            console.warn('⚠️ Firebase SDK not loaded. Please include Firebase scripts in your HTML.');
            console.info('💡 Application will continue in offline mode using localStorage');
            return false;
        }

        // Check if Firebase is already initialized
        if (firebaseApp) {
            console.log('✅ Firebase already initialized');
            return true;
        }

        // Initialize Firebase with v10 syntax
        firebaseApp = window.firebase.initializeApp(FIREBASE_CONFIG);
        database = window.firebase.database.getDatabase(firebaseApp);
        isFirebaseInitialized = true;
        
        console.log('✅ Firebase v10 initialized successfully');
        
        // Set up connection monitoring
        setupConnectionMonitoring();
        
        return true;
        
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        console.info('💡 Common causes: Invalid configuration, network issues, or Firebase service unavailable');
        console.info('📱 Application will continue in offline mode using localStorage');
        isFirebaseInitialized = false;
        
        // Trigger error event for UI notification
        window.dispatchEvent(new CustomEvent('connectionStatusUpdate', { 
            detail: { 
                online: false,
                databaseType: 'localStorage',
                error: `Firebase initialization failed: ${error.message}`
            }
        }));
        
        return false;
    }
}

/**
 * Set up Firebase connection monitoring with v10 syntax
 */
function setupConnectionMonitoring() {
    if (!database) {
        console.info('📡 Connection monitoring not available - Firebase database not initialized');
        return;
    }
    
    try {
        const connectedRef = window.firebase.database.ref(database, '.info/connected');
        window.firebase.database.onValue(connectedRef, (snapshot) => {
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
                    databaseType: connected ? 'firebase' : 'localStorage',
                    message: connected ? 'Firebase connected' : 'Using offline mode'
                }
            }));
        }, (error) => {
            console.error('❌ Firebase connection monitoring failed:', error);
            console.info('📱 Continuing in offline mode');
            
            // Trigger error event
            window.dispatchEvent(new CustomEvent('connectionStatusUpdate', { 
                detail: { 
                    online: false,
                    databaseType: 'localStorage',
                    error: `Connection monitoring failed: ${error.message}`
                }
            }));
        });
    } catch (error) {
        console.error('❌ Failed to setup connection monitoring:', error);
    }
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
 * Test Firebase connection with v10 syntax
 */
async function testFirebaseConnection() {
    if (!isFirebaseInitialized || !database) {
        return false;
    }
    
    try {
        // Try to read server timestamp
        const serverTimeRef = window.firebase.database.ref(database, '.info/serverTimeOffset');
        const snapshot = await window.firebase.database.get(serverTimeRef);
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
        console.log('🔥 Auto-initializing Firebase v10...');
        setTimeout(() => {
            // Delay initialization to ensure Firebase SDK is loaded
            if (typeof window.firebase !== 'undefined' && window.firebase.initializeApp) {
                initializeFirebase();
            } else {
                console.warn('⚠️ Firebase SDK not available - falling back to localStorage mode');
                console.info('💡 Tip: This could be due to network issues, ad blockers, or CDN blocking');
                // Trigger fallback mode event with more informative message
                window.dispatchEvent(new CustomEvent('connectionStatusUpdate', { 
                    detail: { 
                        online: false,
                        databaseType: 'localStorage',
                        error: 'Firebase SDK not loaded - using offline mode'
                    }
                }));
            }
        }, 200); // Increased delay for module loading
    } else {
        console.log('⚠️ Firebase not configured. Update FIREBASE_CONFIG in firebase-config.js');
    }
});