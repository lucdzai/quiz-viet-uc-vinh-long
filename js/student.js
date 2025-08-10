/**
 * Student Quiz Data Management Module
 * 
 * Handles student-specific data operations including:
 * - Enhanced user data saving with device info and timestamps
 * - Offline data handling with localStorage
 * - Integration with Firebase and sync service
 */

class StudentDataManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.retryAttempts = 3;
        this.retryDelay = 2000;
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.onConnectionChange(true);
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.onConnectionChange(false);
        });
    }

    /**
     * Enhanced saveUserData function with device info and timestamps
     */
    async saveUserData(userData) {
        try {
            // Enhance userData with additional information
            const enhancedUserData = this.enhanceUserData(userData);
            
            // Try Firebase first if online
            if (this.isOnline) {
                const result = await this.saveToFirebase(enhancedUserData);
                if (result.success) {
                    this.showNotification('✅ Đã lưu dữ liệu thành công!', 'success');
                    return result;
                }
            }
            
            // Fallback to offline storage
            const offlineResult = await this.saveOffline(enhancedUserData);
            this.showNotification('⚠️ Đã lưu dữ liệu offline. Sẽ đồng bộ khi có kết nối.', 'warning');
            return offlineResult;
            
        } catch (error) {
            console.error('❌ Error in saveUserData:', error);
            
            // Final fallback to offline storage
            try {
                const fallbackResult = await this.saveOffline(userData);
                this.showNotification('⚠️ Lưu dữ liệu tạm thời do lỗi kết nối', 'warning');
                return fallbackResult;
            } catch (fallbackError) {
                console.error('❌ Complete failure in saveUserData:', fallbackError);
                this.showNotification('❌ Không thể lưu dữ liệu. Vui lòng thử lại!', 'error');
                throw fallbackError;
            }
        }
    }

    /**
     * Enhance user data with device information and timestamps
     */
    enhanceUserData(userData) {
        const enhanced = {
            ...userData,
            timestamp: userData.timestamp || new Date().toISOString(),
            deviceInfo: this.getDeviceInfo(),
            sessionId: this.generateSessionId(),
            dataVersion: '1.0',
            source: 'student-app'
        };

        // Format and validate core user data fields
        return this.formatUserData(enhanced);
    }

    /**
     * Format and validate user data for consistent display
     */
    formatUserData(userData) {
        const formatted = { ...userData };

        // Ensure required fields have proper values
        formatted.name = this.validateAndFormatString(userData.name, 'Chưa có tên');
        formatted.phone = this.validateAndFormatPhone(userData.phone);
        formatted.classType = this.validateAndFormatString(userData.classType, 'chua-chon');
        
        // Format timestamp consistently
        formatted.timestamp = this.formatTimestamp(userData.timestamp);
        formatted.formattedDate = this.formatDisplayDate(userData.timestamp);
        formatted.formattedTime = this.formatDisplayTime(userData.timestamp);
        
        // Format score if present
        if (typeof userData.score !== 'undefined') {
            formatted.score = this.validateScore(userData.score);
            formatted.scoreDisplay = `${formatted.score}/5`;
        }

        // Format prize if present
        if (userData.prize) {
            formatted.prize = this.validateAndFormatString(userData.prize, 'Chưa có');
        }

        // Format choice if present
        if (userData.choice) {
            formatted.choice = this.validateChoice(userData.choice);
            formatted.choiceDisplay = this.getChoiceDisplayText(formatted.choice);
        }

        return formatted;
    }

    /**
     * Validate and format string fields
     */
    validateAndFormatString(value, defaultValue = 'Chưa có') {
        if (!value || value.trim() === '' || value === 'undefined' || value === 'null') {
            return defaultValue;
        }
        return value.trim();
    }

    /**
     * Validate and format phone number
     */
    validateAndFormatPhone(phone) {
        if (!phone || phone.trim() === '' || phone === 'undefined' || phone === 'null') {
            return 'Chưa có SĐT';
        }
        
        // Clean phone number (remove spaces, dashes)
        const cleaned = phone.toString().replace(/[\s\-\(\)]/g, '');
        
        // Basic Vietnamese phone validation
        if (cleaned.match(/^(\+84|84|0)[0-9]{8,9}$/)) {
            return cleaned;
        }
        
        return phone.toString().trim();
    }

    /**
     * Validate score value
     */
    validateScore(score) {
        const numScore = typeof score === 'number' ? score : parseInt(score);
        if (isNaN(numScore) || numScore < 0 || numScore > 5) {
            return 0;
        }
        return numScore;
    }

    /**
     * Validate choice value
     */
    validateChoice(choice) {
        const validChoices = ['register', 'decline'];
        return validChoices.includes(choice) ? choice : '';
    }

    /**
     * Get display text for choice
     */
    getChoiceDisplayText(choice) {
        const displayTexts = {
            'register': 'Đăng ký khóa học',
            'decline': 'Từ chối đăng ký',
            '': 'Chưa quyết định'
        };
        return displayTexts[choice] || 'Chưa quyết định';
    }

    /**
     * Format timestamp to ISO string
     */
    formatTimestamp(timestamp) {
        if (!timestamp) {
            return new Date().toISOString();
        }
        
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                return new Date().toISOString();
            }
            return date.toISOString();
        } catch (error) {
            return new Date().toISOString();
        }
    }

    /**
     * Format date for display in admin panel
     */
    formatDisplayDate(timestamp) {
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                return 'Không xác định';
            }
            return date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            return 'Không xác định';
        }
    }

    /**
     * Format time for display in admin panel
     */
    formatDisplayTime(timestamp) {
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                return 'Không xác định';
            }
            return date.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            return 'Không xác định';
        }
    }

    /**
     * Format full date and time for display
     */
    formatDisplayDateTime(timestamp) {
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                return 'Không xác định';
            }
            return date.toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            return 'Không xác định';
        }
    }

    /**
     * Get comprehensive device information
     */
    getDeviceInfo() {
        const nav = navigator;
        
        return {
            userAgent: nav.userAgent,
            platform: nav.platform,
            language: nav.language,
            languages: nav.languages || [nav.language],
            cookieEnabled: nav.cookieEnabled,
            onLine: nav.onLine,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            timezone: {
                offset: new Date().getTimezoneOffset(),
                name: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            connection: this.getConnectionInfo()
        };
    }

    /**
     * Get network connection information if available
     */
    getConnectionInfo() {
        if ('connection' in navigator) {
            const conn = navigator.connection;
            return {
                effectiveType: conn.effectiveType,
                downlink: conn.downlink,
                rtt: conn.rtt,
                saveData: conn.saveData
            };
        }
        return null;
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Save data to Firebase with retry logic
     */
    async saveToFirebase(userData, attempt = 1) {
        try {
            // Use Firebase directly from firebase-config.js
            if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
                const database = FirebaseConfig.getDatabase();
                if (!database) {
                    throw new Error('Firebase database not available');
                }

                console.log(`🔄 Attempting Firebase save (attempt ${attempt})...`);
                
                // Generate user ID if not present
                const userId = userData.id || Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
                userData.id = userId;
                
                // Save directly to Firebase Realtime Database
                const userRef = window.firebase.database.ref(database, `users/${userId}`);
                await window.firebase.database.set(userRef, {
                    ...userData,
                    savedAt: window.firebase.database.serverTimestamp(),
                    source: 'firebase'
                });
                
                console.log('✅ Firebase save successful');
                return {
                    success: true,
                    userId: userId,
                    source: 'firebase',
                    timestamp: new Date().toISOString()
                };
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            console.warn(`❌ Firebase save attempt ${attempt} failed:`, error.message);
            
            if (attempt < this.retryAttempts && this.isOnline) {
                console.log(`🔄 Retrying Firebase save in ${this.retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
                return this.saveToFirebase(userData, attempt + 1);
            }
            
            throw error;
        }
    }

    /**
     * Save data to offline storage
     */
    async saveOffline(userData) {
        try {
            // Mark as pending sync
            userData.pendingSync = true;
            userData.savedOfflineAt = new Date().toISOString();
            
            // Save to localStorage
            const userId = this.saveToLocalStorage(userData);
            
            // Add to sync queue
            this.addToSyncQueue(userData);
            
            console.log('💾 Data saved offline successfully');
            
            return {
                success: true,
                userId: userId,
                source: 'localStorage',
                offline: true,
                pendingSync: true
            };
            
        } catch (error) {
            console.error('❌ Offline save failed:', error);
            throw error;
        }
    }

    /**
     * Save to localStorage with error handling
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
            
            console.log('💾 Saved to localStorage:', userId);
            return userId;
            
        } catch (error) {
            console.error('❌ localStorage save failed:', error);
            throw error;
        }
    }

    /**
     * Add data to sync queue
     */
    addToSyncQueue(userData) {
        try {
            const syncQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
            
            const syncItem = {
                id: userData.id || this.generateSessionId(),
                data: userData,
                type: 'userData',
                timestamp: new Date().toISOString(),
                attempts: 0,
                maxAttempts: 5
            };
            
            syncQueue.push(syncItem);
            localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
            
            console.log('📋 Added to sync queue:', syncItem.id);
            
            // Trigger sync service if available
            if (typeof SyncService !== 'undefined') {
                SyncService.scheduleSync();
            }
            
        } catch (error) {
            console.error('❌ Failed to add to sync queue:', error);
        }
    }

    /**
     * Update quiz result with enhanced data
     */
    async updateQuizResult(userId, score, answers) {
        try {
            const quizData = {
                score: score,
                answers: answers,
                quizCompletedAt: new Date().toISOString(),
                deviceInfo: this.getDeviceInfo(),
                performance: this.getQuizPerformanceData()
            };

            if (this.isOnline && typeof FirebaseConfig !== 'undefined') {
                try {
                    const database = FirebaseConfig.getDatabase();
                    if (database) {
                        const userRef = window.firebase.database.ref(database, `users/${userId}`);
                        await window.firebase.database.set(userRef, {
                            ...quizData,
                            updatedAt: window.firebase.database.serverTimestamp()
                        });
                        
                        this.showNotification('✅ Đã lưu kết quả quiz!', 'success');
                        return { success: true, source: 'firebase' };
                    }
                } catch (error) {
                    console.warn('❌ Firebase quiz update failed:', error);
                }
            }

            // Offline fallback
            this.updateLocalStorage(userId, quizData);
            this.addToSyncQueue({ id: userId, ...quizData, type: 'quizResult' });
            this.showNotification('⚠️ Lưu kết quả offline', 'warning');
            
            return { success: true, offline: true };
            
        } catch (error) {
            console.error('❌ Quiz result update failed:', error);
            this.showNotification('❌ Không thể lưu kết quả quiz', 'error');
            throw error;
        }
    }

    /**
     * Get quiz performance data
     */
    getQuizPerformanceData() {
        return {
            timeSpent: this.getTimeSpent(),
            browserPerformance: this.getBrowserPerformance(),
            interactions: this.getInteractionData()
        };
    }

    /**
     * Get time spent on quiz
     */
    getTimeSpent() {
        // This would be calculated based on quiz start time
        // For now, return current timestamp
        return {
            totalTime: Date.now(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get browser performance data
     */
    getBrowserPerformance() {
        if ('performance' in window) {
            return {
                navigation: performance.navigation?.type,
                timing: performance.timing ? {
                    loadStart: performance.timing.loadEventStart,
                    loadEnd: performance.timing.loadEventEnd
                } : null,
                memory: performance.memory ? {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize
                } : null
            };
        }
        return null;
    }

    /**
     * Get user interaction data
     */
    getInteractionData() {
        return {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            pageVisibility: document.visibilityState
        };
    }

    /**
     * Update localStorage data
     */
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
                console.log('💾 Updated localStorage for user:', userId);
            }
            
        } catch (error) {
            console.error('❌ localStorage update failed:', error);
        }
    }

    /**
     * Handle connection changes
     */
    onConnectionChange(isOnline) {
        console.log(`🌐 Connection status changed: ${isOnline ? 'Online' : 'Offline'}`);
        
        if (isOnline) {
            this.showNotification('🌐 Kết nối Internet đã được khôi phục', 'success');
            
            // Trigger sync if service is available
            if (typeof SyncService !== 'undefined') {
                setTimeout(() => {
                    SyncService.syncPendingData();
                }, 1000);
            }
        } else {
            this.showNotification('⚠️ Mất kết nối Internet. Dữ liệu sẽ được lưu offline.', 'warning');
        }
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `student-notification student-${type}`;
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
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.4;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 4000);
    }

    /**
     * Get notification color based on type
     */
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
            hasData: this.hasPendingData()
        };
    }

    /**
     * Check if there's pending data to sync
     */
    hasPendingData() {
        try {
            const syncQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
            return syncQueue.length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Clear synced data from localStorage
     */
    clearSyncedData(dataId) {
        try {
            const syncQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
            const filteredQueue = syncQueue.filter(item => item.id !== dataId);
            localStorage.setItem('syncQueue', JSON.stringify(filteredQueue));
            console.log('🗑️ Cleared synced data:', dataId);
        } catch (error) {
            console.error('❌ Failed to clear synced data:', error);
        }
    }
}

// Initialize student data manager
let StudentData;
if (typeof window !== 'undefined') {
    StudentData = new StudentDataManager();
    window.StudentData = StudentData;
    console.log('👨‍🎓 StudentDataManager initialized');
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudentDataManager;
}