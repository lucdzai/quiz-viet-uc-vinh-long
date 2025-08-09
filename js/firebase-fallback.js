/**
 * Firebase Fallback Module
 * 
 * This module provides a fallback when Firebase CDN is blocked or unavailable.
 * It attempts to load Firebase from CDN, and falls back to localStorage with 
 * better error handling and user feedback.
 */

class FirebaseFallbackClass {
    constructor() {
        this.isFirebaseAvailable = false;
        this.database = null;
        this.listeners = new Map();
        this.connectionStatus = 'checking';
        
        this.initialize();
    }

    async initialize() {
        console.log('🔥 Initializing Firebase with fallback support...');
        
        // Check if Firebase CDN was blocked
        if (typeof firebase === 'undefined') {
            console.warn('⚠️ Firebase SDK not loaded - likely blocked by ad blocker or network');
            this.connectionStatus = 'fallback';
            this.setupLocalStorageMode();
            return;
        }
        
        try {
            console.log('✅ Firebase SDK detected');
            await this.initializeFirebase();
        } catch (error) {
            console.warn('⚠️ Firebase initialization failed, using localStorage mode:', error.message);
            this.connectionStatus = 'fallback';
            this.setupLocalStorageMode();
        }
    }

    async initializeFirebase() {
        try {
            // Use existing Firebase configuration
            if (typeof FirebaseConfig === 'undefined') {
                throw new Error('FirebaseConfig not available');
            }

            const config = FirebaseConfig.FIREBASE_CONFIG;
            
            // Initialize Firebase if not already done
            let app;
            if (firebase.apps.length > 0) {
                app = firebase.app();
            } else {
                app = firebase.initializeApp(config);
            }

            this.database = firebase.database();
            
            // Test connection
            await this.testFirebaseConnection();
            
            this.isFirebaseAvailable = true;
            this.connectionStatus = 'online';
            this.setupFirebaseConnectionMonitoring();
            
            console.log('✅ Firebase initialized successfully with fallback support');
            
            // Notify UI
            this.notifyConnectionChange(true, 'firebase');
            
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            throw error;
        }
    }

    async testFirebaseConnection() {
        if (!this.database) {
            throw new Error('Database not initialized');
        }

        try {
            // Test with a simple read operation
            const snapshot = await this.database.ref('.info/serverTimeOffset').once('value');
            return snapshot.exists();
        } catch (error) {
            throw new Error(`Firebase connection test failed: ${error.message}`);
        }
    }

    setupFirebaseConnectionMonitoring() {
        if (!this.database) return;

        const connectedRef = this.database.ref('.info/connected');
        connectedRef.on('value', (snapshot) => {
            const connected = snapshot.val() === true;
            this.connectionStatus = connected ? 'online' : 'offline';
            
            console.log(`🔥 Firebase connection: ${connected ? 'Online' : 'Offline'}`);
            this.notifyConnectionChange(connected, 'firebase');
        });
    }

    setupLocalStorageMode() {
        this.connectionStatus = 'localStorage';
        console.log('💾 Running in localStorage-only mode');
        
        // Check if Firebase CDN was blocked vs configuration issue
        const isFirebaseBlocked = typeof firebase === 'undefined';
        const errorMessage = isFirebaseBlocked 
            ? 'Firebase CDN blocked - using local storage'
            : 'Firebase configuration issue - using local storage';
        
        // Notify UI that we're in localStorage mode
        this.notifyConnectionChange(false, 'localStorage', errorMessage);
        
        // Show user-friendly notification
        setTimeout(() => {
            if (isFirebaseBlocked) {
                this.showUserNotification(
                    '💾 Chế độ Offline: Firebase CDN bị chặn. Dữ liệu được lưu cục bộ.',
                    'warning'
                );
            } else {
                this.showUserNotification(
                    '💾 Chế độ Offline: Lỗi cấu hình Firebase. Dữ liệu được lưu cục bộ.',
                    'warning'
                );
            }
        }, 1000);
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
            const userId = userData.id || this.database.ref().child('users').push().key;
            userData.id = userId;
            userData.timestamp = userData.timestamp || new Date().toISOString();

            await this.database.ref(`users/${userId}`).set(userData);
            
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
            const statsRef = this.database.ref('stats');
            const updates = {
                [statKey]: firebase.database.ServerValue.increment(increment),
                lastUpdated: new Date().toISOString()
            };
            
            await statsRef.update(updates);
        } catch (error) {
            console.error(`❌ Failed to update Firebase stat ${statKey}:`, error);
        }
    }

    async getAllUserData() {
        if (this.isFirebaseAvailable && this.database) {
            try {
                const snapshot = await this.database.ref('users').once('value');
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
                const snapshot = await this.database.ref('stats').once('value');
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

    // Real-time listeners (Firebase only)
    onDataChange(callback) {
        if (!this.isFirebaseAvailable || !this.database) {
            console.warn('⚠️ Real-time listeners not available - Firebase not initialized');
            return () => {}; // Return empty unsubscribe function
        }

        try {
            const usersRef = this.database.ref('users');
            const statsRef = this.database.ref('stats');
            
            const usersListener = usersRef.on('value', (snapshot) => {
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

            const statsListener = statsRef.on('value', (snapshot) => {
                const stats = snapshot.val() || {};
                console.log('🔥 Firebase stats update:', stats);
                callback({
                    type: 'stats',
                    data: stats
                });
            });

            // Store listeners for cleanup
            this.listeners.set('users', { ref: usersRef, listener: usersListener });
            this.listeners.set('stats', { ref: statsRef, listener: statsListener });

            console.log('✅ Firebase real-time listeners established');

            // Return unsubscribe function
            return () => {
                console.log('🔥 Cleaning up Firebase listeners');
                usersRef.off('value', usersListener);
                statsRef.off('value', statsListener);
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

    cleanup() {
        // Clean up Firebase listeners
        this.listeners.forEach(({ ref, listener }, key) => {
            if (ref && typeof ref.off === 'function') {
                ref.off('value', listener);
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