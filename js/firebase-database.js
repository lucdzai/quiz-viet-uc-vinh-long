/**
 * Firebase Realtime Database Service
 * 
 * This module provides Firebase Realtime Database integration to replace Google Sheets.
 * Maintains the same interface as GoogleSheetsIntegration for compatibility.
 */

class FirebaseDatabase {
    constructor() {
        this.database = null;
        this.isOnline = false;
        this.listeners = new Map();
        
        // Initialize Firebase connection
        this.initialize();
    }

    /**
     * Initialize Firebase database connection
     */
    async initialize() {
        try {
            // Wait for Firebase config to be loaded
            if (typeof FirebaseConfig === 'undefined') {
                console.warn('⚠️ FirebaseConfig not available. Make sure firebase-config.js is loaded first.');
                return false;
            }

            // Initialize Firebase if not already done
            if (!FirebaseConfig.getConnectionStatus().initialized) {
                FirebaseConfig.initializeFirebase();
            }

            this.database = FirebaseConfig.getDatabase();
            
            if (this.database) {
                this.isOnline = true;
                console.log('✅ Firebase database initialized successfully');
                
                // Set up connection monitoring
                this.setupConnectionMonitoring();
                
                return true;
            } else {
                throw new Error('Failed to get Firebase database instance');
            }
            
        } catch (error) {
            console.error('❌ Firebase database initialization failed:', error);
            this.isOnline = false;
            return false;
        }
    }

    /**
     * Set up Firebase connection monitoring
     */
    setupConnectionMonitoring() {
        if (!this.database) return;

        const connectedRef = this.database.ref('.info/connected');
        connectedRef.on('value', (snapshot) => {
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
    }

    /**
     * Save user data to Firebase
     */
    async saveUserData(userData) {
        try {
            if (!this.database) {
                throw new Error('Firebase database not initialized');
            }

            // Generate user ID if not provided
            const userId = userData.id || this.database.ref().child('users').push().key;
            userData.id = userId;
            
            // Add timestamp if not present
            if (!userData.timestamp) {
                userData.timestamp = new Date().toISOString();
            }

            console.log(`🔄 Saving user data to Firebase:`, userData);

            // Save to Firebase
            await this.database.ref(`users/${userId}`).set(userData);
            
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
     * Update quiz result
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

            await this.database.ref(`users/${userId}`).update(updateData);
            
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
     * Update wheel result
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

            await this.database.ref(`users/${userId}`).update(updateData);
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
     * Update final choice
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

            await this.database.ref(`users/${userId}`).update(updateData);
            
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
     * Get statistics
     */
    async getStats() {
        try {
            if (!this.database) {
                throw new Error('Firebase database not initialized');
            }

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
            console.warn('❌ Failed to get stats from Firebase, using localStorage:', error);
            return this.getLocalStats();
        }
    }

    /**
     * Get all user data (for admin dashboard)
     */
    async getAllUserData() {
        try {
            if (!this.database) {
                throw new Error('Firebase database not initialized');
            }

            const snapshot = await this.database.ref('users').once('value');
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
     * Test Firebase connection
     */
    async testConnection() {
        try {
            if (!this.database) {
                return false;
            }

            // Test by reading server timestamp
            const snapshot = await this.database.ref('.info/serverTimeOffset').once('value');
            this.isOnline = true;
            return true;
            
        } catch (error) {
            console.error('❌ Firebase connection test failed:', error);
            this.isOnline = false;
            return false;
        }
    }

    /**
     * Set up real-time listener for live dashboard updates
     */
    onDataChange(callback) {
        if (!this.database) {
            console.warn('⚠️ Cannot set up listener: Firebase database not initialized');
            return () => {}; // Return empty unsubscribe function
        }

        try {
            // Listen to users data
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
            }, (error) => {
                console.error('❌ Firebase users listener error:', error);
            });

            const statsListener = statsRef.on('value', (snapshot) => {
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

    /**
     * Update statistics in Firebase
     */
    async updateStats(statKey, increment = 1) {
        if (!this.database) return;

        try {
            const statsRef = this.database.ref('stats');
            const updates = {
                [statKey]: firebase.database.ServerValue.increment(increment),
                lastUpdated: new Date().toISOString()
            };
            
            await statsRef.update(updates);
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
        this.listeners.forEach(({ ref, listener }, key) => {
            ref.off('value', listener);
        });
        this.listeners.clear();
    }
}

// Initialize Firebase Database instance if Firebase is configured
let FirebaseDB;
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        // Wait a bit for firebase-config.js to load
        setTimeout(() => {
            if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.isFirebaseConfigured()) {
                FirebaseDB = new FirebaseDatabase();
                window.FirebaseDB = FirebaseDB;
                console.log('🔥 FirebaseDB instance created and available globally');
            } else {
                console.log('⚠️ Firebase not configured, FirebaseDB not initialized');
            }
        }, 100);
    });
}