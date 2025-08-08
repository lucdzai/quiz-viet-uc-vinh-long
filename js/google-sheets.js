/**
 * Google Sheets Integration Module
 * 
 * This module provides enhanced Google Sheets integration functionality
 * with better error handling, retry logic, and user feedback.
 */

class GoogleSheetsIntegration {
    constructor(config) {
        this.scriptUrl = config.GOOGLE_SCRIPT_URL;
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
        this.timeout = 15000; // 15 seconds
        this.isOnline = false;
        
        // Test connection on initialization
        this.testConnection();
    }

    /**
     * Test connection to Google Sheets
     */
    async testConnection() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(this.scriptUrl, {
                method: 'GET',
                mode: 'cors',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const result = await response.json();
                this.isOnline = result.success === true;
                console.log('✅ Google Sheets connection successful');
                return true;
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.warn('⚠️ Google Sheets connection failed:', error.message);
            this.isOnline = false;
            return false;
        }
    }

    /**
     * Send data to Google Sheets with retry logic
     */
    async sendData(action, data, retryCount = 0) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(this.scriptUrl, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: action,
                    ...data
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.isOnline = true;
                return result;
            } else {
                throw new Error(result.error || 'Unknown error from Google Sheets');
            }

        } catch (error) {
            console.warn(`❌ Google Sheets error (attempt ${retryCount + 1}):`, error.message);
            
            // Retry logic
            if (retryCount < this.retryAttempts && !error.name === 'AbortError') {
                await this.delay(this.retryDelay * (retryCount + 1));
                return this.sendData(action, data, retryCount + 1);
            }
            
            this.isOnline = false;
            throw error;
        }
    }

    /**
     * Save user data with enhanced error handling
     */
    async saveUser(userData) {
        try {
            const result = await this.sendData('saveUser', { data: userData });
            
            // Show success notification
            this.showNotification('✅ Đã lưu thông tin vào Google Sheets', 'success');
            
            return {
                success: true,
                userId: result.userId,
                source: 'google_sheets'
            };
            
        } catch (error) {
            console.error('Google Sheets save failed:', error);
            
            // Fallback to localStorage
            const fallbackResult = this.saveToLocalStorage(userData);
            
            // Show fallback notification
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
            await this.sendData('updateQuiz', { userId, score, answers });
            this.showNotification('✅ Đã cập nhật kết quả quiz', 'success');
            return { success: true, source: 'google_sheets' };
            
        } catch (error) {
            // Fallback to localStorage
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
            await this.sendData('updateWheel', { userId, prize });
            this.showNotification('✅ Đã lưu kết quả vòng quay', 'success');
            return { success: true, source: 'google_sheets' };
            
        } catch (error) {
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
            await this.sendData('updateFinal', { userId, choice, registrationData });
            this.showNotification('✅ Đã lưu quyết định cuối', 'success');
            return { success: true, source: 'google_sheets' };
            
        } catch (error) {
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
            const result = await this.sendData('getStats', {});
            return {
                ...result,
                source: 'google_sheets'
            };
            
        } catch (error) {
            console.warn('Failed to get stats from Google Sheets, using localStorage');
            return this.getLocalStats();
        }
    }

    /**
     * Get all user data (for admin dashboard)
     */
    async getAllUserData() {
        try {
            const result = await this.sendData('getAllData', {});
            return {
                success: true,
                data: result.data || [],
                source: 'google_sheets'
            };
            
        } catch (error) {
            console.warn('Failed to get data from Google Sheets, using localStorage');
            return {
                success: true,
                data: JSON.parse(localStorage.getItem('quizUsers') || '[]'),
                source: 'localStorage'
            };
        }
    }

    /**
     * Sync offline data to Google Sheets
     */
    async syncOfflineData() {
        const users = JSON.parse(localStorage.getItem('quizUsers') || '[]');
        const offlineUsers = users.filter(u => u.saved_locally && !u.synced);
        
        if (offlineUsers.length === 0) {
            this.showNotification('✅ Không có dữ liệu cần đồng bộ', 'info');
            return { success: true, synced: 0 };
        }

        let syncedCount = 0;
        const errors = [];

        for (const user of offlineUsers) {
            try {
                await this.sendData('saveUser', { data: user });
                
                // Mark as synced
                user.synced = true;
                user.synced_at = new Date().toISOString();
                syncedCount++;
                
            } catch (error) {
                errors.push({ userId: user.id, error: error.message });
            }
        }

        // Update localStorage
        localStorage.setItem('quizUsers', JSON.stringify(users));

        if (syncedCount > 0) {
            this.showNotification(`✅ Đã đồng bộ ${syncedCount} bản ghi`, 'success');
        }

        if (errors.length > 0) {
            this.showNotification(`⚠️ ${errors.length} bản ghi lỗi đồng bộ`, 'warning');
        }

        return {
            success: true,
            synced: syncedCount,
            errors: errors
        };
    }

    /**
     * LocalStorage fallback methods
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
                passedQuiz: users.filter(u => u.score >= 3).length,
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
     * Utility methods
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `gs-notification gs-${type}`;
        notification.textContent = message;
        
        // Style the notification
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

        // Add animation styles if not already added
        if (!document.getElementById('gs-notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'gs-notification-styles';
            styles.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Auto remove after 4 seconds
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
     * Connection status getter
     */
    getConnectionStatus() {
        return {
            isOnline: this.isOnline,
            status: this.isOnline ? 'connected' : 'offline',
            source: this.isOnline ? 'google_sheets' : 'localStorage'
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
}

// Initialize the Google Sheets integration
let GoogleSheets;
if (typeof CONFIG !== 'undefined') {
    GoogleSheets = new GoogleSheetsIntegration(CONFIG);
}