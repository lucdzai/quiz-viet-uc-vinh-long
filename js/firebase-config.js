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
    PLAYERS: 'players',
    STATS: 'stats'
};

// Firebase initialization state
let firebaseApp = null;
let database = null;

/**
 * Initialize Firebase application with retry mechanism
 */
async function initializeFirebase(retryCount = 3) {
    for (let i = 0; i < retryCount; i++) {
        try {
            if (!firebaseApp) {
                // Check if Firebase modules are loaded
                if (typeof window.firebase === 'undefined' || !window.firebase.initializeApp) {
                    console.warn('⚠️ Firebase SDK not loaded. Please include Firebase scripts in your HTML.');
                    console.info('💡 Application will continue in offline mode using localStorage');
                    
                    // Trigger fallback event immediately
                    triggerConnectionUpdate(false, 'localStorage', 'Firebase SDK not available');
                    throw new Error('Firebase SDK not available');
                }

                firebaseApp = await window.firebase.initializeApp(FIREBASE_CONFIG);
            }
            
            database = window.firebase.database.getDatabase();
            
            // Test connection
            const connRef = window.firebase.database.ref(database, '.info/connected');
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout'));
                }, 5000);

                window.firebase.database.onValue(connRef, (snap) => {
                    clearTimeout(timeout);
                    if (snap.val() === true) {
                        console.log('✅ Firebase connection established');
                        resolve(true);
                    } else {
                        reject(new Error('Connection failed'));
                    }
                }, (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            });
            
            console.log('✅ Firebase v10 initialized successfully');
            
            return true;
        } catch (error) {
            console.error(`❌ Firebase initialization attempt ${i + 1} failed:`, error);
            if (i === retryCount - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

function getDatabase() {
    if (!database) {
        throw new Error('⚠️ Firebase not initialized. Call initializeFirebase() first.');
    }
    return database;
}

/**
 * Verify database connection with proper async handling
 */
async function verifyDatabaseConnection() {
    if (!database) {
        throw new Error('Database not available for verification');
    }
    
    try {
        console.log('🔍 Verifying database connection...');
        
        // Test with a safe path
        const testRef = window.firebase.database.ref(database, 'connection_test');
        const testData = {
            timestamp: Date.now(),
            test: true
        };
        
        await window.firebase.database.set(testRef, testData);
        
        // Test reading back
        const snapshot = await window.firebase.database.get(testRef);
        const success = snapshot.exists() && snapshot.val().test === true;
        
        if (success) {
            console.log('✅ Database connection verified');
            // Clean up test data
            await window.firebase.database.set(testRef, null);
        }
        
        return success;
    } catch (error) {
        console.error('❌ Database connection verification failed:', error);
        throw error;
    }
}

// Centralized database service with proper error handling
const databaseService = {
    update: async (path, data) => {
        const db = getDatabase();
        try {
            const ref = window.firebase.database.ref(db, path);
            await window.firebase.database.set(ref, data);
            console.log(`✅ Update successful for ${path}`);
            return true;
        } catch (error) {
            console.error(`❌ Update failed for ${path}:`, error);
            return false;
        }
    },
    
    get: async (path) => {
        const db = getDatabase();
        try {
            const ref = window.firebase.database.ref(db, path);
            const snapshot = await window.firebase.database.get(ref);
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            console.error(`❌ Get failed for ${path}:`, error);
            throw error;
        }
    },
    
    push: async (path, data) => {
        const db = getDatabase();
        try {
            const ref = window.firebase.database.ref(db, path);
            const newRef = await window.firebase.database.push(ref, data);
            console.log(`✅ Push successful for ${path}`);
            return newRef.key;
        } catch (error) {
            console.error(`❌ Push failed for ${path}:`, error);
            throw error;
        }
    },
    
    onValue: (path, callback, errorCallback) => {
        const db = getDatabase();
        try {
            const ref = window.firebase.database.ref(db, path);
            return window.firebase.database.onValue(ref, callback, errorCallback);
        } catch (error) {
            console.error(`❌ onValue setup failed for ${path}:`, error);
            if (errorCallback) errorCallback(error);
        }
    }
};

/**
 * Trigger connection status update events
 */
function triggerConnectionUpdate(online, databaseType, error = null) {
    const detail = { 
        online: online,
        databaseType: databaseType
    };
    
    if (error) {
        detail.error = error;
    }
    
    window.dispatchEvent(new CustomEvent('connectionStatusUpdate', { detail }));
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
        // Use .info/connected for connection monitoring - this is a special Firebase path
        const connectedRef = window.firebase.database.ref(database, '.info/connected');
        window.firebase.database.onValue(connectedRef, (snapshot) => {
            const connected = snapshot.val();
            console.log(`🔥 Firebase connection status: ${connected ? '✅ Connected' : '❌ Disconnected'}`);
            
            // Update global connection status
            if (typeof ConnectionStatus !== 'undefined') {
                ConnectionStatus.isOnline = connected;
                ConnectionStatus.currentDatabaseType = connected ? 'firebase' : 'localStorage';
            }
            
            // When connection is established, verify database access
            if (connected) {
                verifyDatabaseAccess();
            }
            
            // Trigger custom event for UI updates
            window.dispatchEvent(new CustomEvent('firebaseConnectionUpdate', { 
                detail: { connected }
            }));
            
            // Trigger connection status update for admin dashboard
            triggerConnectionUpdate(
                connected, 
                connected ? 'firebase' : 'localStorage',
                connected ? null : 'Firebase disconnected'
            );
        }, (error) => {
            console.error('❌ Firebase connection monitoring failed:', error);
            console.error('❌ Connection monitoring error details:', {
                code: error.code,
                message: error.message
            });
            console.info('📱 Continuing in offline mode');
            
            // Trigger error event with more detail
            triggerConnectionUpdate(false, 'localStorage', `Connection monitoring failed: ${error.message}`);
        });
    } catch (error) {
        console.error('❌ Failed to setup connection monitoring:', error);
        console.error('❌ Setup error details:', {
            message: error.message,
            stack: error.stack
        });
    }
}

/**
 * Get Firebase database reference
 */
function getDatabase() {
    if (!database) {
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

// Export configuration and functions
window.FirebaseConfig = {
    FIREBASE_CONFIG,
    DB_PATHS,
    initializeFirebase,
    getDatabase,
    getFirebaseApp,
    getDatabaseStatus,
    isFirebaseConfigured,
    getConnectionStatus,
    testFirebaseConnection,
    verifyDatabaseAccess,
    setupConnectionMonitoring,
    databaseService
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