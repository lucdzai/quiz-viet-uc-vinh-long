/**
 * Firebase Realtime Database Service
 * 
 * This module provides Firebase Realtime Database integration to replace Google Sheets.
 * Updated for Firebase SDK v10.7.1 with modular imports.
 * Maintains the same interface as GoogleSheetsIntegration for compatibility.
 */

class FirebaseDatabase {
    constructor() {
        this.database = null;
        this.isOnline = false;
        this.listeners = new Map();
        
        // Use the centralized Firebase initialization from firebase-config.js
        this.setupConnection();
    }

    /**
     * Setup connection using centralized Firebase configuration
     */
    setupConnection() {
        // Listen for Firebase initialization from firebase-config.js
        window.addEventListener('firebaseConnectionUpdate', (event) => {
            const { connected } = event.detail;
            this.isOnline = connected;
            
            if (connected && typeof FirebaseConfig !== 'undefined') {
                this.database = FirebaseConfig.getDatabase();
                console.log('✅ Firebase database connected via firebase-config.js');
            } else {
                this.database = null;
                console.log('❌ Firebase database disconnected');
            }
        });

        // Check if Firebase is already initialized
        setTimeout(() => {
            if (typeof FirebaseConfig !== 'undefined') {
                const status = FirebaseConfig.getConnectionStatus();
                if (status.initialized && status.database) {
                    this.database = FirebaseConfig.getDatabase();
                    this.isOnline = true;
                    console.log('✅ Firebase database already available');
                    this.setupConnectionMonitoring();
                }
            }
        }, 250);
    }

    /**
     * Set up Firebase connection monitoring with v10 syntax
     */
    setupConnectionMonitoring() {
        if (!this.database) return;

        try {
            const connectedRef = window.firebase.database.ref(this.database, '.info/connected');
            window.firebase.database.onValue(connectedRef, (snapshot) => {
                this.isOnline = snapshot.val() === true;
                console.log(`🔥 Firebase status: ${this.isOnline ? 'Online' : 'Offline'}`);
                
                // Trigger connection status update for admin dashboard
                window.dispatchEvent(new CustomEvent('connectionStatusUpdate', { 
                    detail: { 
                        online: this.isOnline,
                        databaseType: 'firebase'
                    }
                }));
            }, (error) => {
                console.error('❌ Firebase connection monitoring error:', error);
                this.isOnline = false;
                
                // Trigger connection status update for errors
                window.dispatchEvent(new CustomEvent('connectionStatusUpdate', { 
                    detail: { 
                        online: false,
                        databaseType: 'firebase',
                        error: error.message
                    }
                }));
            });
        } catch (error) {
            console.error('❌ Failed to setup connection monitoring:', error);
        }
    }

    /**
     * Save user data to Firebase with v10 syntax
     */
    async saveUserData(userData) {
        try {
            if (!this.database) {
                throw new Error('Firebase database not initialized');
            }

            // Generate user ID if not provided using v10 push
            const usersRef = window.firebase.database.ref(this.database, 'users');
            const newUserRef = window.firebase.database.push(usersRef);
            const userId = userData.id || newUserRef.key;
            userData.id = userId;
            
            // Add timestamp if not present
            if (!userData.timestamp) {
                userData.timestamp = new Date().toISOString();
            }

            console.log(`🔄 Saving user data to Firebase:`, userData);

            // Save to Firebase using v10 set
            const userRef = window.firebase.database.ref(this.database, `users/${userId}`);
            await window.firebase.database.set(userRef, userData);
            
            // Update stats
            await this.updateStats('totalParticipants', 1);
            
            this.showNotification('✅ Đã lưu dữ liệu vào Firebase', 'success');
            
            return {
                success: true,
                userId: userId,
                source: 'firebase'
            };
            
        } catch (error) {
            console.error('❌ Firebase save failed:', error);
            
            // Fallback to localStorage
            const fallbackResult = this.saveToLocalStorage(userData);
            this.showNotification('⚠️ Lưu tạm thời (offline mode)', 'warning');
            
            return {
                success: true,
                userId: fallbackResult.userId,
                source: 'localStorage',
                fallback: true,
                error: error.message
            };
        }
    }

    /**
     * Update quiz result with v10 syntax
     */
    async updateQuizResult(userId, score, answers) {
        try {
            if (!this.database) {
                throw new Error('Firebase database not initialized');
            }

            const updateData = {
                score: score,
                answers: answers,
                quizCompletedAt: new Date().toISOString()
            };

            const userRef = window.firebase.database.ref(this.database, `users/${userId}`);
            await window.firebase.database.set(userRef, updateData);
            
            // Update stats
            await this.updateStats('completedQuiz', 1);
            if (score >= CONFIG.QUIZ_SETTINGS.PASS_SCORE) {
                await this.updateStats('passedQuiz', 1);
            }
            
            this.showNotification('✅ Đã cập nhật kết quả quiz', 'success');
            return { success: true, source: 'firebase' };
            
        } catch (error) {
            console.error('❌ Firebase update quiz failed:', error);
            this.updateLocalStorage(userId, { score, answers });
            this.showNotification('⚠️ Lưu kết quả offline', 'warning');
            return { success: true, source: 'localStorage', fallback: true };
        }
    }

    /**
     * Update wheel result with v10 syntax
     */
    async updateWheelResult(userId, prize) {
        try {
            if (!this.database) {
                throw new Error('Firebase database not initialized');
            }

            const updateData = {
                prize: prize,
                wheelCompletedAt: new Date().toISOString()
            };

            const userRef = window.firebase.database.ref(this.database, `users/${userId}`);
            await window.firebase.database.set(userRef, updateData);
            this.showNotification('✅ Đã lưu kết quả vòng quay', 'success');
            return { success: true, source: 'firebase' };
            
        } catch (error) {
            console.error('❌ Firebase update wheel failed:', error);
            this.updateLocalStorage(userId, { prize });
            this.showNotification('⚠️ Lưu kết quả offline', 'warning');
            return { success: true, source: 'localStorage', fallback: true };
        }
    }

    /**
     * Update final choice with v10 syntax
     */
    async updateFinalChoice(userId, choice, registrationData) {
        try {
            if (!this.database) {
                throw new Error('Firebase database not initialized');
            }

            const updateData = {
                choice: choice,
                registrationData: registrationData,
                finalChoiceAt: new Date().toISOString()
            };

            const userRef = window.firebase.database.ref(this.database, `users/${userId}`);
            await window.firebase.database.set(userRef, updateData);
            
            // Update stats
            if (choice === 'register') {
                await this.updateStats('registeredUsers', 1);
            } else if (choice === 'decline') {
                await this.updateStats('declinedUsers', 1);
            }
            
            this.showNotification('✅ Đã lưu quyết định cuối', 'success');
            return { success: true, source: 'firebase' };
            
        } catch (error) {
            console.error('❌ Firebase update final choice failed:', error);
            this.updateLocalStorage(userId, { choice, registrationData });
            this.showNotification('⚠️ Lưu quyết định offline', 'warning');
            return { success: true, source: 'localStorage', fallback: true };
        }
    }

    /**
     * Get statistics with v10 syntax
     */
    async getStats() {
        try {
            if (!this.database) {
                throw new Error('Firebase database not initialized');
            }

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
            console.warn('❌ Failed to get stats from Firebase, using localStorage:', error);
            return this.getLocalStats();
        }
    }

    /**
     * Get all user data (for admin dashboard) with v10 syntax
     */
    async getAllUserData() {
        try {
            if (!this.database) {
                throw new Error('Firebase database not initialized');
            }

            const usersRef = window.firebase.database.ref(this.database, 'users');
            const snapshot = await window.firebase.database.get(usersRef);
            const users = snapshot.val() || {};
            
            // Convert object to array
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
            console.warn('❌ Failed to get data from Firebase, using localStorage:', error);
            return {
                success: true,
                data: JSON.parse(localStorage.getItem('quizUsers') || '[]'),
                source: 'localStorage'
            };
        }
    }

    /**
     * Test Firebase connection with v10 syntax
     */
    async testConnection() {
        try {
            if (!this.database) {
                return false;
            }

            // Test by reading server timestamp
            const serverTimeRef = window.firebase.database.ref(this.database, '.info/serverTimeOffset');
            const snapshot = await window.firebase.database.get(serverTimeRef);
            this.isOnline = true;
            return true;
            
        } catch (error) {
            console.error('❌ Firebase connection test failed:', error);
            this.isOnline = false;
            return false;
        }
    }

    /**
     * Set up real-time listener for live dashboard updates with v10 syntax
     */
    onDataChange(callback) {
        if (!this.database) {
            console.warn('⚠️ Cannot set up listener: Firebase database not initialized');
            return () => {}; // Return empty unsubscribe function
        }

        try {
            // Listen to users data
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
            }, (error) => {
                console.error('❌ Firebase users listener error:', error);
            });

            const statsUnsubscribe = window.firebase.database.onValue(statsRef, (snapshot) => {
                const stats = snapshot.val() || {};
                console.log('🔥 Firebase stats update:', stats);
                callback({
                    type: 'stats',
                    data: stats
                });
            }, (error) => {
                console.error('❌ Firebase stats listener error:', error);
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

    /**
     * Update statistics in Firebase with v10 syntax
     */
    async updateStats(statKey, increment = 1) {
        if (!this.database) return;

        try {
            const statsRef = window.firebase.database.ref(this.database, 'stats');
            const updates = {
                [statKey]: window.firebase.database.increment(increment),
                lastUpdated: new Date().toISOString()
            };
            
            await window.firebase.database.set(statsRef, updates);
        } catch (error) {
            console.error(`❌ Failed to update stat ${statKey}:`, error);
        }
    }

    /**
     * LocalStorage fallback methods (same as GoogleSheets)
     */
    saveToLocalStorage(userData) {
        try {
            const users = JSON.parse(localStorage.getItem('quizUsers') || '[]');
            const userId = userData.id || Date.now().toString() + Math.random().toString(36).substr(2, 9);
            
            userData.id = userId;
            userData.saved_locally = true;
            userData.created_at = new Date().toISOString();
            
            users.push(userData);
            localStorage.setItem('quizUsers', JSON.stringify(users));
            
            return { userId, success: true };
            
        } catch (error) {
            console.error('LocalStorage save failed:', error);
            throw error;
        }
    }

    updateLocalStorage(userId, updateData) {
        try {
            const users = JSON.parse(localStorage.getItem('quizUsers') || '[]');
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex !== -1) {
                users[userIndex] = { 
                    ...users[userIndex], 
                    ...updateData,
                    updated_at: new Date().toISOString()
                };
                localStorage.setItem('quizUsers', JSON.stringify(users));
            }
            
        } catch (error) {
            console.error('LocalStorage update failed:', error);
        }
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
            console.error('Error getting local stats:', error);
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

    /**
     * Notification system (same as GoogleSheets)
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `firebase-notification firebase-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-weight: 600;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 4000);
    }

    getNotificationColor(type) {
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        return colors[type] || colors.info;
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            isOnline: this.isOnline,
            status: this.isOnline ? 'connected' : 'offline',
            source: this.isOnline ? 'firebase' : 'localStorage'
        };
    }

    /**
     * Health check for admin dashboard
     */
    async healthCheck() {
        const startTime = Date.now();
        const isConnected = await this.testConnection();
        const responseTime = Date.now() - startTime;

        return {
            connected: isConnected,
            responseTime: responseTime,
            status: isConnected ? 'healthy' : 'offline',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Cleanup method
     */
    cleanup() {
        // Remove all listeners
        this.listeners.forEach(({ unsubscribe }, key) => {
            if (unsubscribe && typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.listeners.clear();
    }
}

// Initialize Firebase Database instance when Firebase is ready
let FirebaseDB;
if (typeof window !== 'undefined') {
    // Wait for firebase-config.js to initialize Firebase first
    window.addEventListener('firebaseConnectionUpdate', function(event) {
        const { connected } = event.detail;
        if (connected && typeof FirebaseConfig !== 'undefined' && !FirebaseDB) {
            FirebaseDB = new FirebaseDatabase();
            window.FirebaseDB = FirebaseDB;
            console.log('🔥 FirebaseDB instance created after Firebase connection established');
        }
    });
    
    // Also check if Firebase is already available
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            if (typeof FirebaseConfig !== 'undefined') {
                const status = FirebaseConfig.getConnectionStatus();
                if (status.initialized && !FirebaseDB) {
                    FirebaseDB = new FirebaseDatabase();
                    window.FirebaseDB = FirebaseDB;
                    console.log('🔥 FirebaseDB instance created with existing Firebase connection');
                }
            }
        }, 200);
    });
}