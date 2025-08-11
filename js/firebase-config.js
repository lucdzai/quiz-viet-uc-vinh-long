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
    storageBucket: "quiz-viet-uc-vinh-long.appspot.com",
    messagingSenderId: "324450811055",
    appId: "1:324450811055:web:0c114401847a7c664ca85a",
    measurementId: "G-V1BRGTJTWW"
};

// Firebase database reference paths
const DB_PATHS = {
    PLAYERS: 'players',
    STATS: 'stats'
};

// Firebase initialization state
let firebaseApp = null;
let database = null;

// Add retry mechanism for Firebase initialization
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

async function initializeFirebase() {
    while (initAttempts < MAX_INIT_ATTEMPTS) {
        try {
            initAttempts++;
            console.log(`🔄 Firebase initialization attempt ${initAttempts}...`);
            
            // Check if Firebase modules are loaded
            if (typeof window.firebase === 'undefined' || !window.firebase.initializeApp) {
                console.warn('⚠️ Firebase SDK not loaded. Please include Firebase scripts in your HTML.');
                console.info('💡 Application will continue in offline mode using localStorage');
                
                // Trigger fallback event immediately
                triggerConnectionUpdate(false, 'localStorage', 'Firebase SDK not available');
                throw new Error('Firebase SDK not available');
            }

            if (!firebaseApp) {
                firebaseApp = await window.firebase.initializeApp(FIREBASE_CONFIG);
            }
            
            database = window.firebase.database.getDatabase();
            
            // Test connection
            const connectedRef = window.firebase.database.ref(database, '.info/connected');
            return new Promise((resolve, reject) => {
                let unsubscribe; // khai báo trước để tránh TDZ

                const timeout = setTimeout(() => {
                    if (typeof unsubscribe === 'function') unsubscribe();
                    reject(new Error('Connection timeout'));
                }, 10000);

                unsubscribe = window.firebase.database.onValue(
                    connectedRef, 
                    (snap) => {
                        if (snap.val() === true) {
                            clearTimeout(timeout);
                            if (typeof unsubscribe === 'function') unsubscribe();
                            console.log('✅ Firebase connected successfully');
                            resolve(database);
                        }
                    },
                    (error) => {
                        clearTimeout(timeout);
                        if (typeof unsubscribe === 'function') unsubscribe();
                        console.error('❌ Firebase connection error:', error);
                        reject(error);
                    }
                );
            });
        } catch (error) {
            console.error(`❌ Firebase initialization attempt ${initAttempts} failed:`, error);
            if (initAttempts === MAX_INIT_ATTEMPTS) {
                throw error;
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

/**
 * Legacy function for backward compatibility
 */
async function initializeFirebaseCompat(retryCount = 3) {
    try {
        return await initializeFirebase();
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        throw error;
    }
}

function getDatabase() {
    if (!database) {
        throw new Error('⚠️ Firebase not initialized. Call initializeFirebase() first.');
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
 * Export database connection status
 */
function getDatabaseStatus() {
    return new Promise((resolve) => {
        try {
            if (!database) {
                resolve(false);
                return;
            }
            
            const connRef = window.firebase.database.ref(database, '.info/connected');
            window.firebase.database.onValue(connRef, (snap) => {
                resolve(snap.val() === true);
            });
        } catch (error) {
            console.error('❌ Error checking database status:', error);
            resolve(false);
        }
    });
}

/**
 * Check if Firebase is properly configured
 */
function isFirebaseConfigured() {
    return FIREBASE_CONFIG.apiKey !== 'your-api-key-here' && 
           FIREBASE_CONFIG.projectId !== 'your-project-id';
}

/**
 * Verify actual database access with read/write test
 */
async function verifyDatabaseAccess() {
    if (!database) {
        console.warn('⚠️ Cannot verify database access - database not initialized');
        return false;
    }
    
    try {
        console.log('🔍 Verifying database access...');
        
        // Test writing to a safe path
        const testRef = window.firebase.database.ref(database, 'access_test');
        const testData = {
            timestamp: Date.now(),
            access_check: true
        };
        
        await window.firebase.database.set(testRef, testData);
        
        // Test reading back
        const snapshot = await window.firebase.database.get(testRef);
        const success = snapshot.exists() && snapshot.val().access_check === true;
        
        if (success) {
            console.log('✅ Database access verification successful');
            // Clean up test data
            await window.firebase.database.set(testRef, null);
            
            // Trigger successful verification event
            window.dispatchEvent(new CustomEvent('databaseAccessVerified', { 
                detail: { verified: true }
            }));
        } else {
            console.warn('⚠️ Database access verification failed - data not readable');
            window.dispatchEvent(new CustomEvent('databaseAccessVerified', { 
                detail: { verified: false, reason: 'Data not readable' }
            }));
        }
        
        return success;
        
    } catch (error) {
        console.error('❌ Database access verification failed:', error);
        console.error('❌ Access verification error details:', {
            code: error.code,
            message: error.message
        });
        
        // Determine error type for better fallback handling
        if (error.code === 'PERMISSION_DENIED') {
            console.error('🔒 Database access denied - check Firebase security rules');
            window.dispatchEvent(new CustomEvent('databaseAccessVerified', { 
                detail: { verified: false, reason: 'Permission denied', shouldFallback: true }
            }));
        } else if (error.message && error.message.includes('Invalid token in path')) {
            console.error('🔤 Invalid database path - check database structure');
            window.dispatchEvent(new CustomEvent('databaseAccessVerified', { 
                detail: { verified: false, reason: 'Invalid path', shouldFallback: true }
            }));
        } else {
            console.error('🌐 Network or other error during access verification');
            window.dispatchEvent(new CustomEvent('databaseAccessVerified', { 
                detail: { verified: false, reason: 'Network error', shouldFallback: false }
            }));
        }
        
        return false;
    }
}

/**
 * Get Firebase connection status
 */
function getConnectionStatus() {
    return {
        initialized: firebaseApp !== null,
        configured: isFirebaseConfigured(),
        app: firebaseApp !== null,
        database: database !== null
    };
}

/**
 * Test Firebase connection with v10 syntax using valid database paths
 */
async function testFirebaseConnection() {
    if (!firebaseApp || !database) {
        console.warn('⚠️ Firebase not initialized for connection test');
        return false;
    }
    
    try {
        // Test with a valid database path instead of .info paths to avoid "Invalid token in path" errors
        const testRef = window.firebase.database.ref(database, 'connection_test');
        
        // First try to write a test value
        const testData = {
            timestamp: Date.now(),
            test: true
        };
        
        await window.firebase.database.set(testRef, testData);
        console.log('✅ Firebase write test successful');
        
        // Then try to read it back
        const snapshot = await window.firebase.database.get(testRef);
        const success = snapshot.exists() && snapshot.val().test === true;
        
        if (success) {
            console.log('✅ Firebase read test successful');
            // Clean up test data
            await window.firebase.database.set(testRef, null);
        }
        
        return success;
    } catch (error) {
        console.error('❌ Firebase connection test failed:', error);
        console.error('❌ Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
        });
        
        // Check if it's a permission error vs network error
        if (error.code === 'PERMISSION_DENIED') {
            console.error('🔒 Database permission denied - check Firebase security rules');
        } else if (error.code === 'NETWORK_ERROR') {
            console.error('🌐 Network error - check internet connection');
        } else if (error.message && error.message.includes('Invalid token in path')) {
            console.error('🔤 Invalid path token error - using fallback connection test');
        }
        
        return false;
    }
}

// Helper function to verify connection before operations
async function verifyConnection() {
    try {
        const db = getDatabase();
        if (!db) return false;
        
        const connectedRef = window.firebase.database.ref(db, '.info/connected');
        
        return new Promise((resolve) => {
            const unsubscribe = window.firebase.database.onValue(connectedRef, (snap) => {
                unsubscribe();
                resolve(snap.val() === true);
            });
        });
    } catch (error) {
        console.error('❌ Lỗi kiểm tra kết nối:', error);
        return false;
    }
}

// Export configuration and functions
window.FirebaseConfig = {
    FIREBASE_CONFIG,
    DB_PATHS,
    initializeFirebase,
    initializeFirebaseCompat: initializeFirebaseCompat,
    getDatabase,
    getFirebaseApp,
    getDatabaseStatus,
    isFirebaseConfigured,
    getConnectionStatus,
    testFirebaseConnection,
    verifyDatabaseAccess,
    setupConnectionMonitoring,
    databaseService,
    verifyConnection
};

// Auto-initialize Firebase when script loads (if configured)
document.addEventListener('DOMContentLoaded', async function() {
    if (isFirebaseConfigured()) {
        console.log('🔥 Auto-initializing Firebase v10...');
        
        // Delay initialization to ensure Firebase SDK is loaded
        setTimeout(async () => {
            try {
                if (typeof window.firebase !== 'undefined' && window.firebase.initializeApp) {
                    await initializeFirebase();
                    // Set up connection monitoring after successful init
                    setupConnectionMonitoring();
                } else {
                    console.warn('⚠️ Firebase SDK not available - falling back to localStorage mode');
                    console.info('💡 Tip: This could be due to network issues, ad blockers, or CDN blocking');
                    // Trigger fallback mode event with more informative message
                    triggerConnectionUpdate(false, 'localStorage', 'Firebase SDK not loaded - using offline mode');
                }
            } catch (error) {
                console.error('❌ Auto-initialization failed:', error);
                triggerConnectionUpdate(false, 'localStorage', `Initialization failed: ${error.message}`);
            }
        }, 200); // Increased delay for module loading
    } else {
        console.log('⚠️ Firebase not configured. Update FIREBASE_CONFIG in firebase-config.js');
        triggerConnectionUpdate(false, 'localStorage', 'Firebase not configured');
    }
});
