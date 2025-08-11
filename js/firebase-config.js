/**
 * Firebase Configuration Module
 * 
 * This module provides Firebase Realtime Database configuration and initialization.
 * Updated for Firebase SDK v10.7.1 with modular imports or CDN (window.firebase).
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
                let resolved = false;
                let unsubscribe = null;

                const timeout = setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        if (typeof unsubscribe === 'function') unsubscribe();
                        reject(new Error('Connection timeout'));
                    }
                }, 10000);

                unsubscribe = window.firebase.database.onValue(
                    connectedRef, 
                    (snap) => {
                        if (!resolved && snap.val() === true) {
                            resolved = true;
                            clearTimeout(timeout);
                            if (typeof unsubscribe === 'function') unsubscribe();
                            console.log('✅ Firebase connected successfully');
                            resolve(database);
                        }
                    },
                    (error) => {
                        if (!resolved) {
                            resolved = true;
                            clearTimeout(timeout);
                            if (typeof unsubscribe === 'function') unsubscribe();
                            console.error('❌ Firebase connection error:', error);
                            reject(error);
                        }
                    }
                );
            });
        } catch (error) {
            console.error(`❌ Firebase initialization attempt ${initAttempts} failed:`, error);
            if (initAttempts === MAX_INIT_ATTEMPTS) {
                throw error;
            }
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

function getFirebaseApp() {
    return firebaseApp;
}

function getDatabaseStatus() {
    return new Promise((resolve) => {
        try {
            if (!database) {
                resolve(false);
                return;
            }
            const connRef = window.firebase.database.ref(database, '.info/connected');
            let resolved = false;
            let unsubscribe = null;
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    if (typeof unsubscribe === 'function') unsubscribe();
                    resolve(false);
                }
            }, 4000);
            unsubscribe = window.firebase.database.onValue(connRef, (snap) => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    if (typeof unsubscribe === 'function') unsubscribe();
                    resolve(snap.val() === true);
                }
            });
        } catch (error) {
            console.error('❌ Error checking database status:', error);
            resolve(false);
        }
    });
}

function isFirebaseConfigured() {
    return FIREBASE_CONFIG.apiKey !== 'your-api-key-here' && 
           FIREBASE_CONFIG.projectId !== 'your-project-id';
}

async function verifyDatabaseAccess() {
    if (!database) {
        console.warn('⚠️ Cannot verify database access - database not initialized');
        return false;
    }
    try {
        console.log('🔍 Verifying database access...');
        const testRef = window.firebase.database.ref(database, 'access_test');
        const testData = {
            timestamp: Date.now(),
            access_check: true
        };
        await window.firebase.database.set(testRef, testData);
        const snapshot = await window.firebase.database.get(testRef);
        const success = snapshot.exists() && snapshot.val().access_check === true;
        if (success) {
            console.log('✅ Database access verification successful');
            await window.firebase.database.set(testRef, null);
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
        window.dispatchEvent(new CustomEvent('databaseAccessVerified', { 
            detail: { verified: false, reason: error.code || error.message }
        }));
        return false;
    }
}

function getConnectionStatus() {
    return {
        initialized: firebaseApp !== null,
        configured: isFirebaseConfigured(),
        app: firebaseApp !== null,
        database: database !== null
    };
}

async function testFirebaseConnection() {
    if (!firebaseApp || !database) {
        console.warn('⚠️ Firebase not initialized for connection test');
        return false;
    }
    try {
        const testRef = window.firebase.database.ref(database, 'connection_test');
        const testData = {
            timestamp: Date.now(),
            test: true
        };
        await window.firebase.database.set(testRef, testData);
        console.log('✅ Firebase write test successful');
        const snapshot = await window.firebase.database.get(testRef);
        const success = snapshot.exists() && snapshot.val().test === true;
        if (success) {
            console.log('✅ Firebase read test successful');
            await window.firebase.database.set(testRef, null);
        }
        return success;
    } catch (error) {
        console.error('❌ Firebase connection test failed:', error);
        return false;
    }
}

// Helper function to verify connection before operations
async function verifyConnection() {
    try {
        const db = getDatabase();
        if (!db) return false;
        const connectedRef = window.firebase.database.ref(db, '.info/connected');
        let resolved = false;
        let unsubscribe = null;
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    if (typeof unsubscribe === 'function') unsubscribe();
                    resolve(false);
                }
            }, 5000);
            unsubscribe = window.firebase.database.onValue(
                connectedRef,
                (snap) => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        if (typeof unsubscribe === 'function') unsubscribe();
                        resolve(snap.val() === true);
                    }
                },
                (error) => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        if (typeof unsubscribe === 'function') unsubscribe();
                        resolve(false);
                    }
                }
            );
        });
    } catch (error) {
        console.error('❌ Lỗi kiểm tra kết nối:', error);
        return false;
    }
}

// Dummy function if not implemented
function setupConnectionMonitoring() {
    // You can implement connection monitoring here if needed
}

// Dummy for triggerConnectionUpdate if not defined elsewhere
function triggerConnectionUpdate(status, mode, message) {
    // Optional: Implement a global status update for your app here, or leave empty
}

// Dummy for databaseService if not defined elsewhere
const databaseService = {};

// Export configuration and functions
window.FirebaseConfig = {
    FIREBASE_CONFIG,
    DB_PATHS,
    initializeFirebase,
    initializeFirebaseCompat,
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
        setTimeout(async () => {
            try {
                if (typeof window.firebase !== 'undefined' && window.firebase.initializeApp) {
                    await initializeFirebase();
                    setupConnectionMonitoring();
                } else {
                    console.warn('⚠️ Firebase SDK not available - falling back to localStorage mode');
                    triggerConnectionUpdate(false, 'localStorage', 'Firebase SDK not loaded - using offline mode');
                }
            } catch (error) {
                console.error('❌ Auto-initialization failed:', error);
                triggerConnectionUpdate(false, 'localStorage', `Initialization failed: ${error.message}`);
            }
        }, 200);
    } else {
        console.log('⚠️ Firebase not configured. Update FIREBASE_CONFIG in firebase-config.js');
        triggerConnectionUpdate(false, 'localStorage', 'Firebase not configured');
    }
});
