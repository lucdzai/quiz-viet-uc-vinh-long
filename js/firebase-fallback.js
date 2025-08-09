/**
 * Firebase Fallback Module
 * 
 * This module provides a fallback when Firebase CDN is blocked or unavailable.
 * Updated for Firebase SDK v10.7.1 with modular imports.
 * It attempts to load Firebase from CDN, and falls back to localStorage with 
 * better error handling and user feedback.
 */

class FirebaseFallbackClass {
    constructor() {
        this.isFirebaseAvailable = false;
        this.database = null;
        this.listeners = new Map();
        this.connectionStatus = 'checking';
        
        // Don't initialize immediately - let firebase-config.js handle Firebase initialization
        this.setupStatusMonitoring();
    }

    setupStatusMonitoring() {
        // Listen for Firebase connection updates from firebase-config.js
        window.addEventListener('firebaseConnectionUpdate', (event) => {
            const { connected } = event.detail;
            this.isFirebaseAvailable = connected;
            this.connectionStatus = connected ? 'online' : 'offline';
            
            if (connected && typeof FirebaseConfig !== 'undefined') {
                this.database = FirebaseConfig.getDatabase();
            }
        });

        // Listen for connection status updates
        window.addEventListener('connectionStatusUpdate', (event) => {
            const { online, databaseType, error, shouldFallback } = event.detail;
            if (databaseType === 'firebase') {
                this.isFirebaseAvailable = online;
                this.connectionStatus = online ? 'online' : 'offline';
                
                // If we should fallback due to error, switch to localStorage mode
                if (shouldFallback && !online) {
                    console.warn('⚠️ Switching to localStorage mode due to Firebase error:', error);
                    this.connectionStatus = 'localStorage';
                    this.isFirebaseAvailable = false;
                }
            } else if (databaseType === 'localStorage') {
                this.connectionStatus = 'localStorage';
            }
        });

        // Listen for database access verification results
        window.addEventListener('databaseAccessVerified', (event) => {
            const { verified, reason, shouldFallback } = event.detail;
            
            if (!verified) {
                console.warn(`⚠️ Database access verification failed: ${reason}`);
                
                if (shouldFallback) {
                    console.warn('⚠️ Switching to localStorage mode due to access verification failure');
                    this.connectionStatus = 'localStorage';
                    this.isFirebaseAvailable = false;
                    
                    // Notify UI about the fallback
                    this.notifyConnectionChange(false, 'localStorage', `Database access failed: ${reason}`);
                }
            } else {
                console.log('✅ Database access verification successful');
            }
        });

        // Check if Firebase is already initialized
        setTimeout(() => {
            if (typeof FirebaseConfig !== 'undefined') {
                const status = FirebaseConfig.getConnectionStatus();
                if (status.initialized && status.database) {
                    this.isFirebaseAvailable = true;
                    this.database = FirebaseConfig.getDatabase();
                    this.connectionStatus = 'online';
                }
            }
        }, 300);
    }

    notifyConnectionChange(online, source, errorMessage = null) {
        // Dispatch custom events for UI updates
        window.dispatchEvent(new CustomEvent('connectionStatusUpdate', {
            detail: {
                online: online,
                databaseType: source,
                error: errorMessage
            }
        }));

        if (source === 'firebase') {
            window.dispatchEvent(new CustomEvent('firebaseConnectionUpdate', {
                detail: { connected: online }
            }));
        }
    }

    // Data methods that work with both Firebase and localStorage
    async saveUserData(userData) {
        if (this.isFirebaseAvailable && this.database) {
            return await this.saveToFirebase(userData);
        } else {
            return this.saveToLocalStorage(userData);
        }
    }

    async saveToFirebase(userData) {
        try {
            const usersRef = window.firebase.database.ref(this.database, 'users');
            const newUserRef = window.firebase.database.push(usersRef);
            const userId = userData.id || newUserRef.key;
            userData.id = userId;
            userData.timestamp = userData.timestamp || new Date().toISOString();

            const userRef = window.firebase.database.ref(this.database, `users/${userId}`);
            await window.firebase.database.set(userRef, userData);
            
            // Update stats
            await this.updateFirebaseStats('totalParticipants', 1);
            
            return {
                success: true,
                userId: userId,
                source: 'firebase'
            };
        } catch (error) {
            console.error('❌ Firebase save failed:', error);
            // Fallback to localStorage
            return this.saveToLocalStorage(userData);
        }
    }

    saveToLocalStorage(userData) {
        try {
            const users = JSON.parse(localStorage.getItem('quizUsers') || '[]');
            const userId = userData.id || Date.now().toString() + Math.random().toString(36).substr(2, 9);
            
            userData.id = userId;
            userData.saved_locally = true;
            userData.timestamp = userData.timestamp || new Date().toISOString();
            
            users.push(userData);
            localStorage.setItem('quizUsers', JSON.stringify(users));
            
            return {
                success: true,
                userId: userId,
                source: 'localStorage',
                fallback: !this.isFirebaseAvailable
            };
        } catch (error) {
            console.error('❌ LocalStorage save failed:', error);
            throw error;
        }
    }

    async updateFirebaseStats(statKey, increment = 1) {
        if (!this.database) return;

        try {
            const statsRef = window.firebase.database.ref(this.database, 'stats');
            const updates = {
                [statKey]: window.firebase.database.increment(increment),
                lastUpdated: new Date().toISOString()
            };
            
            await window.firebase.database.set(statsRef, updates);
        } catch (error) {
            console.error(`❌ Failed to update Firebase stat ${statKey}:`, error);
        }
    }

    async getAllUserData() {
        if (this.isFirebaseAvailable && this.database) {
            try {
                const usersRef = window.firebase.database.ref(this.database, 'users');
                const snapshot = await window.firebase.database.get(usersRef);
                const users = snapshot.val() || {};
                
                const userArray = Object.keys(users).map(key => ({
                    id: key,
                    ...users[key]
                }));

                return {
                    success: true,
                    data: userArray,
                    source: 'firebase'
                };
            } catch (error) {
                console.warn('❌ Failed to get Firebase data, using localStorage:', error);
            }
        }

        // Fallback to localStorage
        try {
            return {
                success: true,
                data: JSON.parse(localStorage.getItem('quizUsers') || '[]'),
                source: 'localStorage'
            };
        } catch (error) {
            console.error('❌ Error getting localStorage data:', error);
            return {
                success: false,
                data: [],
                source: 'localStorage'
            };
        }
    }

    async getStats() {
        if (this.isFirebaseAvailable && this.database) {
            try {
                const statsRef = window.firebase.database.ref(this.database, 'stats');
                const snapshot = await window.firebase.database.get(statsRef);
                const stats = snapshot.val() || {};
                
                return {
                    success: true,
                    totalParticipants: stats.totalParticipants || 0,
                    completedQuiz: stats.completedQuiz || 0,
                    passedQuiz: stats.passedQuiz || 0,
                    registeredUsers: stats.registeredUsers || 0,
                    declinedUsers: stats.declinedUsers || 0,
                    lastUpdated: stats.lastUpdated || new Date().toISOString(),
                    source: 'firebase'
                };
            } catch (error) {
                console.warn('❌ Failed to get Firebase stats, using localStorage:', error);
            }
        }

        // Fallback to localStorage calculation
        return this.getLocalStats();
    }

    getLocalStats() {
        try {
            const users = JSON.parse(localStorage.getItem('quizUsers') || '[]');
            
            return {
                success: true,
                totalParticipants: users.length,
                completedQuiz: users.filter(u => u.score !== undefined).length,
                passedQuiz: users.filter(u => u.score >= (CONFIG?.QUIZ_SETTINGS?.PASS_SCORE || 3)).length,
                registeredUsers: users.filter(u => u.choice === 'register').length,
                declinedUsers: users.filter(u => u.choice === 'decline').length,
                lastUpdated: new Date().toISOString(),
                source: 'localStorage'
            };
        } catch (error) {
            console.error('❌ Error getting local stats:', error);
            return {
                success: false,
                totalParticipants: 0,
                completedQuiz: 0,
                passedQuiz: 0,
                registeredUsers: 0,
                declinedUsers: 0,
                source: 'localStorage'
            };
        }
    }

    // Real-time listeners (Firebase only) - Updated for v10
    onDataChange(callback) {
        if (!this.isFirebaseAvailable || !this.database) {
            console.warn('⚠️ Real-time listeners not available - Firebase not initialized');
            return () => {}; // Return empty unsubscribe function
        }

        try {
            const usersRef = window.firebase.database.ref(this.database, 'users');
            const statsRef = window.firebase.database.ref(this.database, 'stats');
            
            const usersUnsubscribe = window.firebase.database.onValue(usersRef, (snapshot) => {
                const users = snapshot.val() || {};
                const userArray = Object.keys(users).map(key => ({
                    id: key,
                    ...users[key]
                }));
                
                console.log(`🔥 Firebase users update: ${userArray.length} records`);
                callback({
                    type: 'users',
                    data: userArray
                });
            });

            const statsUnsubscribe = window.firebase.database.onValue(statsRef, (snapshot) => {
                const stats = snapshot.val() || {};
                console.log('🔥 Firebase stats update:', stats);
                callback({
                    type: 'stats',
                    data: stats
                });
            });

            // Store listeners for cleanup
            this.listeners.set('users', { unsubscribe: usersUnsubscribe });
            this.listeners.set('stats', { unsubscribe: statsUnsubscribe });

            console.log('✅ Firebase real-time listeners established');

            // Return unsubscribe function
            return () => {
                console.log('🔥 Cleaning up Firebase listeners');
                usersUnsubscribe();
                statsUnsubscribe();
                this.listeners.delete('users');
                this.listeners.delete('stats');
            };
            
        } catch (error) {
            console.error('❌ Failed to set up Firebase listeners:', error);
            return () => {}; // Return empty unsubscribe function
        }
    }

    getConnectionStatus() {
        return {
            isOnline: this.isFirebaseAvailable && this.connectionStatus === 'online',
            status: this.connectionStatus,
            source: this.isFirebaseAvailable ? 'firebase' : 'localStorage',
            firebaseAvailable: this.isFirebaseAvailable
        };
    }

    async healthCheck() {
        const startTime = Date.now();
        
        if (this.isFirebaseAvailable) {
            try {
                const connected = await this.testFirebaseConnection();
                const responseTime = Date.now() - startTime;
                
                return {
                    connected: connected,
                    responseTime: responseTime,
                    status: connected ? 'healthy' : 'offline',
                    source: 'firebase',
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                return {
                    connected: false,
                    responseTime: Date.now() - startTime,
                    status: 'error',
                    source: 'firebase',
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        } else {
            return {
                connected: false,
                responseTime: 0,
                status: 'localStorage_mode',
                source: 'localStorage',
                timestamp: new Date().toISOString()
            };
        }
    }

    async testFirebaseConnection() {
        if (!this.database) {
            console.warn('⚠️ Cannot test Firebase connection - database not initialized');
            return false;
        }

        try {
            // Use the centralized connection test from firebase-config.js
            if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.testFirebaseConnection) {
                return await FirebaseConfig.testFirebaseConnection();
            }
            
            // Fallback test method using valid database paths
            const testRef = window.firebase.database.ref(this.database, 'connection_test');
            const testData = {
                timestamp: Date.now(),
                test: true
            };
            
            await window.firebase.database.set(testRef, testData);
            const snapshot = await window.firebase.database.get(testRef);
            const success = snapshot.exists() && snapshot.val().test === true;
            
            if (success) {
                // Clean up test data
                await window.firebase.database.set(testRef, null);
            }
            
            return success;
        } catch (error) {
            console.error('❌ Firebase connection test failed:', error);
            console.error('❌ Connection test error details:', {
                code: error.code,
                message: error.message
            });
            
            // Handle specific error types for better fallback decisions
            if (error.code === 'PERMISSION_DENIED') {
                console.error('🔒 Database permission denied - should fallback to localStorage');
            } else if (error.message && error.message.includes('Invalid token in path')) {
                console.error('🔤 Invalid path token - check database structure');
            }
            
            return false;
        }
    }

    cleanup() {
        // Clean up Firebase listeners
        this.listeners.forEach(({ unsubscribe }, key) => {
            if (unsubscribe && typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.listeners.clear();
    }

    showUserNotification(message, type = 'info') {
        // Use existing notification system if available
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`📢 ${type.toUpperCase()}: ${message}`);
        }
    }
}

// Initialize the fallback system immediately
let FirebaseFallback;

// Define FirebaseFallback class first, then initialize
(function() {
    // Wait for DOM content to be loaded before initializing
    function initializeFallback() {
        if (typeof window !== 'undefined') {
            FirebaseFallback = new FirebaseFallbackClass();
            window.FirebaseFallback = FirebaseFallback;
            console.log('🔥 Firebase Fallback system initialized');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFallback);
    } else {
        // DOM is already loaded
        setTimeout(initializeFallback, 50);
    }
})();