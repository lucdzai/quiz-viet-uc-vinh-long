/**
 * Firebase Configuration Module
 * 
 * This module provides Firebase Realtime Database configuration and initialization.
 * Updated for Firebase SDK v10.7.1 with modular imports.
 */

// Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyCweCbYPM-OWpQ5tVrK7AMT-xh0OL_SgLI",
    authDomain: "quiz-viet-uc-vinh-long.firebaseapp.com",
    databaseURL: "https://quiz-viet-uc-vinh-long-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "quiz-viet-uc-vinh-long",
    storageBucket: "quiz-viet-uc-vinh-long.firebasestorage.app",
    messagingSenderId: "324450811055",
    appId: "1:324450811055:web:0c114401847a7c664ca85a",
    measurementId: "G-V1BRGTJTWW"
};

// Firebase initialization state
let firebaseApp = null;
let database = null;

async function initializeFirebase() {
    if (firebaseApp) {
        console.log('🔥 Firebase already initialized');
        return firebaseApp;
    }

    try {
        // Initialize Firebase app
        firebaseApp = await window.firebase.initializeApp(firebaseConfig);
        database = window.firebase.database.getDatabase();
        
        // Test database connection
        await testDatabaseConnection();
        
        console.log('✅ Firebase initialized with database');
        return firebaseApp;
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        throw error;
    }
}

async function testDatabaseConnection() {
    if (!database) {
        throw new Error('Database not initialized');
    }
    
    try {
        const testRef = window.firebase.database.ref(database, '.info/connected');
        await new Promise((resolve, reject) => {
            window.firebase.database.onValue(testRef, (snapshot) => {
                if (snapshot.val() === true) {
                    resolve();
                } else {
                    reject(new Error('Database connection failed'));
                }
            }, { onlyOnce: true });
        });
        console.log('✅ Database connection verified');
    } catch (error) {
        console.error('❌ Database connection test failed:', error);
        throw error;
    }
}

// Database update methods
const databaseMethods = {
    async updateWheelResult(userId, result) {
        if (!database) await initializeFirebase();
        const userRef = window.firebase.database.ref(database, `users/${userId}`);
        const wheelResultRef = window.firebase.database.ref(database, `users/${userId}/wheelResult`);
        await window.firebase.database.set(wheelResultRef, result);
    },

    async updateFinalChoice(userId, choice) {
        if (!database) await initializeFirebase();
        const finalChoiceRef = window.firebase.database.ref(database, `users/${userId}/finalChoice`);
        await window.firebase.database.set(finalChoiceRef, choice);
    },

    async saveUserData(userId, data) {
        if (!database) await initializeFirebase();
        const userRef = window.firebase.database.ref(database, `users/${userId}`);
        await window.firebase.database.set(userRef, data);
    }
};

// Export configuration and functions for global access
window.FirebaseConfig = {
    firebaseConfig,
    initializeFirebase,
    testDatabaseConnection,
    databaseMethods,
    getDatabase: () => database,
    getFirebaseApp: () => firebaseApp
};