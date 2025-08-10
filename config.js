const config = {
    // Player ID management
    get currentPlayerId() {
        return localStorage.getItem('currentPlayerId');
    },
    set currentPlayerId(id) {
        if (id) {
            localStorage.setItem('currentPlayerId', id);
        } else {
            localStorage.removeItem('currentPlayerId');
        }
    },

    // Get next sequence number
    async getNextSequence() {
        try {
            if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
                const database = FirebaseConfig.getDatabase();
                if (database && window.firebase?.database?.ref) {
                    const counterRef = window.firebase.database.ref(database, 'counters/players');
                    const snapshot = await window.firebase.database.get(counterRef);
                    const current = (snapshot.val() || 0) + 1;
                    await window.firebase.database.set(counterRef, current);
                    return current;
                }
            }
            return Date.now();
        } catch (error) {
            console.error('❌ Failed to get sequence number:', error);
            return Date.now();
        }
    },

    // Initialize new player with sanitized data
    async initializePlayer(playerData) {
        try {
            const timestamp = Date.now();
            const playerId = `player_${timestamp}`;
            
            // Sanitize input data
            const sanitizedData = {
                name: String(playerData.name || '').trim(),
                phone: String(playerData.phone || '').trim(),
                course: String(playerData.course || '').trim()
            };
            
            if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
                const database = FirebaseConfig.getDatabase();
                if (database && window.firebase?.database?.ref && window.firebase?.database?.set) {
                    const playerRef = window.firebase.database.ref(database, `players/${playerId}`);
                    await window.firebase.database.set(playerRef, {
                        id: playerId,
                        startTime: window.firebase?.database?.serverTimestamp ? window.firebase.database.serverTimestamp() : timestamp,
                        stt: await this.getNextSequence(),
                        ...sanitizedData,
                        score: 0,
                        prize: '',
                        finalDecision: '',
                        lastUpdated: window.firebase?.database?.serverTimestamp ? window.firebase.database.serverTimestamp() : timestamp
                    });
                }
            }

            this.currentPlayerId = playerId;
            console.log('✅ Player initialized:', playerId);
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize player:', error);
            return false;
        }
    },

    // Update quiz result with validation
    async updateQuizResult(result) {
        if (!this.currentPlayerId) {
            console.error('❌ No active player');
            return;
        }

        try {
            if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
                const database = FirebaseConfig.getDatabase();
                if (database && window.firebase?.database?.ref && window.firebase?.database?.update) {
                    const playerRef = window.firebase.database.ref(database, `players/${this.currentPlayerId}`);
                    await window.firebase.database.update(playerRef, {
                        score: Number(result.score) || 0,
                        lastUpdated: window.firebase?.database?.serverTimestamp ? window.firebase.database.serverTimestamp() : Date.now()
                    });
                    console.log('✅ Quiz result updated');
                }
            }
        } catch (error) {
            console.error('❌ Quiz update error:', error);
        }
    },

    // Update wheel result with prize name mapping
    async updateWheelResult(prize) {
        if (!this.currentPlayerId) {
            console.error('❌ No active player');
            return;
        }

        try {
            if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
                const database = FirebaseConfig.getDatabase();
                if (database && window.firebase?.database?.ref && window.firebase?.database?.update) {
                    const playerRef = window.firebase.database.ref(database, `players/${this.currentPlayerId}`);
                    await window.firebase.database.update(playerRef, {
                        prize: String(prize),
                        lastUpdated: window.firebase?.database?.serverTimestamp ? window.firebase.database.serverTimestamp() : Date.now()
                    });
                    console.log('✅ Wheel result updated');
                }
            }
        } catch (error) {
            console.error('❌ Wheel update error:', error);
        }
    },

    // Update final choice with boolean conversion
    async updateFinalChoice(decision) {
        if (!this.currentPlayerId) {
            console.error('❌ No active player');
            return;
        }

        try {
            if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
                const database = FirebaseConfig.getDatabase();
                if (database && window.firebase?.database?.ref && window.firebase?.database?.update) {
                    const playerRef = window.firebase.database.ref(database, `players/${this.currentPlayerId}`);
                    await window.firebase.database.update(playerRef, {
                        finalDecision: Boolean(decision),
                        lastUpdated: window.firebase?.database?.serverTimestamp ? window.firebase.database.serverTimestamp() : Date.now()
                    });
                    console.log('✅ Final choice updated');
                }
            }
        } catch (error) {
            console.error('❌ Final choice update error:', error);
        }
    }
};

// Legacy compatibility - maintain existing CONFIG object for backward compatibility
const CONFIG = {
    // Database configuration - Simplified to Firebase only
    DATABASE_TYPE: 'firebase', // 'firebase' only
    
    // Firebase configuration
    USE_FIREBASE: true,
    
    // URL của website (sẽ tự động cập nhật khi deploy)
    WEBSITE_URL: 'https://lucdzai.github.io/quiz-viet-uc-vinh-long',
    
    // Thông tin trung tâm
    CENTER_INFO: {
        name: 'Trung Tâm Ngoại Ngữ Việt Úc Vĩnh Long',
        address: 'Số 36/7, đường Trần Phú, Phường Phước Hậu, Tỉnh Vĩnh Long',
        phone: '02703.912.007',
        hotline: '02703.912.007',
        email: 'ngoainguvietuceducation@gmail.com',
        website: 'https://ngoainguvietuc.vn',
        facebook: 'https://www.facebook.com/trungtamngoainguVietUc',
        zalo: '0387.864.329'
    },
    
    // Cấu hình khác
    QUIZ_SETTINGS: {
        PASS_SCORE: 3, // Điểm tối thiểu để vào vòng quay
        TOTAL_QUESTIONS: 5,
        TIME_LIMIT: 300 // 5 phút (giây)
    }
};

// Legacy database helper functions for backward compatibility
const Database = {
    // Check if Firebase is available and configured
    isFirebaseAvailable() {
        return typeof FirebaseConfig !== 'undefined' && 
               FirebaseConfig.isFirebaseConfigured() &&
               FirebaseConfig.getConnectionStatus().initialized;
    },

    // Get current database type
    getCurrentDatabaseType() {
        if (this.isFirebaseAvailable()) {
            const database = FirebaseConfig.getDatabase();
            return database ? 'firebase' : 'localStorage';
        }
        return 'localStorage';
    },

    // Test connection - Firebase only
    async testConnection() {
        try {
            console.log('🔄 Testing Firebase connection...');
            
            if (!this.isFirebaseAvailable()) {
                console.log('🔴 Firebase not available - using localStorage');
                return false;
            }
            
            // Use Firebase config's test connection method
            if (typeof FirebaseConfig.testFirebaseConnection === 'function') {
                const result = await FirebaseConfig.testFirebaseConnection();
                console.log(`${result ? '🟢' : '🔴'} Firebase connection: ${result ? 'ONLINE' : 'OFFLINE'}`);
                return result;
            }
            
            return false;
            
        } catch (error) {
            console.warn(`🔴 Firebase connection test failed:`, error.message);
            return false;
        }
    }
};

// Connection status helper with Firebase support
const ConnectionStatus = {
    isOnline: false,
    lastCheck: null,
    currentDatabaseType: 'localStorage',
    
    async check() {
        this.lastCheck = new Date();
        this.currentDatabaseType = Database.getCurrentDatabaseType();
        this.isOnline = await Database.testConnection();
        return this.isOnline;
    },
    
    getStatus() {
        return {
            online: this.isOnline,
            lastCheck: this.lastCheck,
            source: this.isOnline ? this.currentDatabaseType : 'localStorage',
            databaseType: this.currentDatabaseType
        };
    }
};

// Test connection khi load trang (chỉ cho admin)
if (window.location.search.indexOf('student=true') === -1) {
    // Chỉ test khi không phải trang học sinh
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(async () => {
            const isOnline = await ConnectionStatus.check();
            const dbType = Database.getCurrentDatabaseType();
            console.log(`🔌 Trạng thái kết nối ${dbType}:`, isOnline ? '✅ Hoạt động' : '❌ Offline - Sử dụng localStorage');
            
            // Trigger custom event for UI updates
            window.dispatchEvent(new CustomEvent('connectionStatusUpdate', { 
                detail: { 
                    online: isOnline,
                    databaseType: dbType
                }
            }));
        }, 1000);
    });
}
