/**
 * Sync Service for Offline Data Handling
 * 
 * This service handles:
 * - Syncing pending data when online
 * - Handling Firebase connection changes
 * - Managing retry logic for failed syncs
 * - Clearing synced data from localStorage
 */

class SyncService {
    constructor() {
        this.isOnline = navigator.onLine;
        this.isSyncing = false;
        this.syncInterval = null;
        this.syncIntervalTime = 30000; // 30 seconds
        this.maxRetryAttempts = 5;
        this.retryDelay = 5000; // 5 seconds
        
        this.init();
    }

    /**
     * Initialize sync service
     */
    init() {
        this.setupEventListeners();
        this.startPeriodicSync();
        this.checkForPendingData();
        
        console.log('🔄 SyncService initialized');
    }

    /**
     * Setup event listeners for connection changes and Firebase events
     */
    setupEventListeners() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.onConnectionChange(true);
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.onConnectionChange(false);
        });

        // Listen for Firebase connection updates
        window.addEventListener('firebaseConnectionUpdate', (event) => {
            const { connected } = event.detail;
            console.log('🔥 Firebase connection update:', connected);
            
            if (connected && this.isOnline) {
                this.scheduleSync();
            }
        });

        // Listen for database access verification
        window.addEventListener('databaseAccessVerified', (event) => {
            const { verified } = event.detail;
            console.log('🔍 Database access verified:', verified);
            
            if (verified && this.isOnline) {
                this.scheduleSync();
            }
        });

        // Listen for page visibility changes to sync when tab becomes active
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isOnline && this.hasPendingData()) {
                this.scheduleSync();
            }
        });
    }

    /**
     * Handle connection changes
     */
    onConnectionChange(isOnline) {
        console.log(`🌐 SyncService: Connection ${isOnline ? 'restored' : 'lost'}`);
        
        if (isOnline) {
            this.showNotification('🔄 Đang đồng bộ dữ liệu...', 'info');
            this.syncPendingData();
        } else {
            this.showNotification('📴 Offline mode: Dữ liệu sẽ được lưu local', 'warning');
        }
    }

    /**
     * Start periodic sync for pending data
     */
    startPeriodicSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(() => {
            if (this.isOnline && this.hasPendingData() && !this.isSyncing) {
                this.syncPendingData();
            }
        }, this.syncIntervalTime);

        console.log(`⏰ Periodic sync started (every ${this.syncIntervalTime / 1000}s)`);
    }

    /**
     * Schedule immediate sync
     */
    scheduleSync() {
        if (this.isOnline && this.hasPendingData() && !this.isSyncing) {
            setTimeout(() => {
                this.syncPendingData();
            }, 1000);
        }
    }

    /**
     * Check for pending data on startup
     */
    checkForPendingData() {
        const pendingCount = this.getPendingDataCount();
        if (pendingCount > 0) {
            console.log(`📋 Found ${pendingCount} pending items to sync`);
            this.showNotification(`📋 Có ${pendingCount} mục dữ liệu chưa đồng bộ`, 'info');
            
            if (this.isOnline) {
                this.scheduleSync();
            }
        }
    }

    /**
     * Main sync function for pending data
     */
    async syncPendingData() {
        if (this.isSyncing || !this.isOnline) {
            return;
        }

        this.isSyncing = true;
        console.log('🔄 Starting data sync...');

        try {
            const syncQueue = this.getSyncQueue();
            if (syncQueue.length === 0) {
                console.log('✅ No pending data to sync');
                this.isSyncing = false;
                return;
            }

            console.log(`🔄 Syncing ${syncQueue.length} items...`);
            let successCount = 0;
            let failureCount = 0;

            for (const item of syncQueue) {
                try {
                    const success = await this.syncItem(item);
                    if (success) {
                        this.removeSyncItem(item.id);
                        successCount++;
                        console.log(`✅ Synced item: ${item.id}`);
                    } else {
                        failureCount++;
                        this.incrementSyncAttempts(item.id);
                    }
                } catch (error) {
                    console.error(`❌ Failed to sync item ${item.id}:`, error);
                    failureCount++;
                    this.incrementSyncAttempts(item.id);
                }
            }

            // Show sync results
            if (successCount > 0) {
                this.showNotification(`✅ Đã đồng bộ ${successCount} mục dữ liệu`, 'success');
            }
            
            if (failureCount > 0) {
                this.showNotification(`⚠️ ${failureCount} mục không đồng bộ được`, 'warning');
            }

            console.log(`🔄 Sync completed: ${successCount} success, ${failureCount} failures`);

        } catch (error) {
            console.error('❌ Sync process failed:', error);
            this.showNotification('❌ Lỗi đồng bộ dữ liệu', 'error');
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Sync individual item
     */
    async syncItem(item) {
        try {
            if (!item || !item.data || !item.type) {
                throw new Error('Invalid sync item structure');
            }

            console.log(`🔄 Syncing ${item.type}: ${item.id}`);

            switch (item.type) {
                case 'userData':
                    return await this.syncUserData(item);
                case 'quizResult':
                    return await this.syncQuizResult(item);
                case 'wheelResult':
                    return await this.syncWheelResult(item);
                case 'finalChoice':
                    return await this.syncFinalChoice(item);
                default:
                    console.warn(`⚠️ Unknown sync type: ${item.type}`);
                    return false;
            }

        } catch (error) {
            console.error(`❌ Error syncing item ${item.id}:`, error);
            return false;
        }
    }

    /**
     * Sync user data
     */
    async syncUserData(item) {
        try {
            if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
                const database = FirebaseConfig.getDatabase();
                if (!database) {
                    return false;
                }

                const userRef = window.firebase.database.ref(database, `users/${item.data.id || Date.now()}`);
                await window.firebase.database.set(userRef, {
                    ...item.data,
                    syncedAt: window.firebase.database.serverTimestamp(),
                    source: 'sync'
                });
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Failed to sync user data:', error);
            return false;
        }
    }

    /**
     * Sync quiz result
     */
    async syncQuizResult(item) {
        try {
            if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
                const database = FirebaseConfig.getDatabase();
                if (!database) {
                    return false;
                }

                const userRef = window.firebase.database.ref(database, `users/${item.id}`);
                const { score, answers } = item.data;
                
                await window.firebase.database.update(userRef, {
                    score: score,
                    answers: answers,
                    quizCompletedAt: window.firebase.database.serverTimestamp()
                });
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Failed to sync quiz result:', error);
            return false;
        }
    }

    /**
     * Sync wheel result
     */
    async syncWheelResult(item) {
        try {
            if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
                const database = FirebaseConfig.getDatabase();
                if (!database) {
                    return false;
                }

                const userRef = window.firebase.database.ref(database, `users/${item.id}`);
                await window.firebase.database.update(userRef, {
                    prize: item.data.prize,
                    wheelCompletedAt: window.firebase.database.serverTimestamp()
                });
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Failed to sync wheel result:', error);
            return false;
        }
    }

    /**
     * Sync final choice
     */
    async syncFinalChoice(item) {
        try {
            if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
                const database = FirebaseConfig.getDatabase();
                if (!database) {
                    return false;
                }

                const userRef = window.firebase.database.ref(database, `users/${item.id}`);
                const { choice, registrationData } = item.data;
                
                await window.firebase.database.update(userRef, {
                    choice: choice,
                    registrationData: registrationData,
                    finalChoiceAt: window.firebase.database.serverTimestamp()
                });
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Failed to sync final choice:', error);
            return false;
        }
    }

    /**
     * Get sync queue from localStorage
     */
    getSyncQueue() {
        try {
            return JSON.parse(localStorage.getItem('syncQueue') || '[]');
        } catch (error) {
            console.error('❌ Failed to get sync queue:', error);
            return [];
        }
    }

    /**
     * Save sync queue to localStorage
     */
    saveSyncQueue(queue) {
        try {
            localStorage.setItem('syncQueue', JSON.stringify(queue));
        } catch (error) {
            console.error('❌ Failed to save sync queue:', error);
        }
    }

    /**
     * Remove successfully synced item from queue
     */
    removeSyncItem(itemId) {
        try {
            const queue = this.getSyncQueue();
            const filteredQueue = queue.filter(item => item.id !== itemId);
            this.saveSyncQueue(filteredQueue);
            console.log(`🗑️ Removed synced item from queue: ${itemId}`);
        } catch (error) {
            console.error('❌ Failed to remove sync item:', error);
        }
    }

    /**
     * Increment sync attempts for failed items
     */
    incrementSyncAttempts(itemId) {
        try {
            const queue = this.getSyncQueue();
            const item = queue.find(item => item.id === itemId);
            
            if (item) {
                item.attempts = (item.attempts || 0) + 1;
                item.lastAttempt = new Date().toISOString();
                
                // Remove item if it exceeded max attempts
                if (item.attempts >= this.maxRetryAttempts) {
                    console.warn(`⚠️ Item ${itemId} exceeded max retry attempts, removing from queue`);
                    this.removeSyncItem(itemId);
                    this.archiveFailedItem(item);
                } else {
                    this.saveSyncQueue(queue);
                    console.log(`🔄 Item ${itemId} attempt ${item.attempts}/${this.maxRetryAttempts}`);
                }
            }
        } catch (error) {
            console.error('❌ Failed to increment sync attempts:', error);
        }
    }

    /**
     * Archive failed items for manual review
     */
    archiveFailedItem(item) {
        try {
            const failedItems = JSON.parse(localStorage.getItem('failedSyncItems') || '[]');
            failedItems.push({
                ...item,
                archivedAt: new Date().toISOString(),
                reason: 'Max retry attempts exceeded'
            });
            localStorage.setItem('failedSyncItems', JSON.stringify(failedItems));
            console.log(`📁 Archived failed sync item: ${item.id}`);
        } catch (error) {
            console.error('❌ Failed to archive failed item:', error);
        }
    }

    /**
     * Check if there's pending data to sync
     */
    hasPendingData() {
        const queue = this.getSyncQueue();
        return queue.length > 0;
    }

    /**
     * Get count of pending data items
     */
    getPendingDataCount() {
        const queue = this.getSyncQueue();
        return queue.length;
    }

    /**
     * Clear all synced data from localStorage
     */
    clearSyncedData() {
        try {
            localStorage.removeItem('syncQueue');
            console.log('🗑️ Cleared all sync queue data');
            this.showNotification('✅ Đã xóa dữ liệu đồng bộ', 'success');
        } catch (error) {
            console.error('❌ Failed to clear synced data:', error);
            this.showNotification('❌ Không thể xóa dữ liệu đồng bộ', 'error');
        }
    }

    /**
     * Get sync status for admin dashboard
     */
    getSyncStatus() {
        const queue = this.getSyncQueue();
        const failedItems = JSON.parse(localStorage.getItem('failedSyncItems') || '[]');
        
        return {
            isOnline: this.isOnline,
            isSyncing: this.isSyncing,
            pendingCount: queue.length,
            failedCount: failedItems.length,
            lastSync: localStorage.getItem('lastSyncTime') || null,
            status: this.isSyncing ? 'syncing' : (queue.length > 0 ? 'pending' : 'up-to-date')
        };
    }

    /**
     * Force sync all pending data
     */
    async forceSyncAll() {
        if (!this.isOnline) {
            this.showNotification('❌ Không có kết nối Internet', 'error');
            return false;
        }

        if (this.isSyncing) {
            this.showNotification('⚠️ Đang trong quá trình đồng bộ', 'warning');
            return false;
        }

        await this.syncPendingData();
        return true;
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `sync-notification sync-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 60px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            font-weight: 500;
            max-width: 280px;
            font-size: 13px;
            animation: slideInRight 0.3s ease;
            font-family: Arial, sans-serif;
            line-height: 1.3;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
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
     * Stop sync service
     */
    stop() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log('🛑 SyncService stopped');
    }

    /**
     * Restart sync service
     */
    restart() {
        this.stop();
        this.init();
        console.log('🔄 SyncService restarted');
    }

    /**
     * Export sync data for debugging
     */
    exportSyncData() {
        const queue = this.getSyncQueue();
        const failedItems = JSON.parse(localStorage.getItem('failedSyncItems') || '[]');
        
        const exportData = {
            syncQueue: queue,
            failedItems: failedItems,
            status: this.getSyncStatus(),
            exportedAt: new Date().toISOString()
        };

        console.log('📤 Sync data export:', exportData);
        return exportData;
    }
}

// Initialize sync service
if (typeof window !== 'undefined' && typeof window.SyncService === 'undefined') {
    // Wait a bit for other services to initialize
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            if (typeof window.SyncService === 'undefined') {
                window.SyncService = new SyncService();
                console.log('🔄 SyncService initialized and available globally');
            }
        }, 1000);
    });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SyncService;
}