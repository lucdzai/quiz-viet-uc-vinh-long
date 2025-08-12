const config = {
    // Player ID management
    _currentPlayerId: null,
    get currentPlayerId() {
        return this._currentPlayerId || localStorage.getItem('currentPlayerId');
    },
    set currentPlayerId(id) {
        this._currentPlayerId = id;
        if (id) {
            localStorage.setItem('currentPlayerId', id);
        } else {
            localStorage.removeItem('currentPlayerId');
        }
    },

    connectionStatus: false,
    
    async initializePlayer(playerData) {
        if (!this.connectionStatus) {
            throw new Error('Không có kết nối đến máy chủ');
        }
        
        try {
            const phoneQuery = await this.checkPhoneExists(playerData.phone);
            if (phoneQuery) {
                throw new Error('Số điện thoại đã được sử dụng!');
            }

            const timestamp = Date.now();
            const playerId = `player_${timestamp}`;
            
            if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
                const database = FirebaseConfig.getDatabase();
                if (database && window.firebase?.database?.ref && window.firebase?.database?.set) {
                    const playerRef = window.firebase.database.ref(database, `players/${playerId}`);
                    await window.firebase.database.set(playerRef, {
                        id: playerId,
                        stt: await this.getNextSequence(),
                        startTime: window.firebase?.database?.serverTimestamp ? window.firebase.database.serverTimestamp() : new Date().toISOString(),
                        name: playerData.name,
                        phone: playerData.phone,
                        course: playerData.course,
                        score: 0,
                        prize: '',
                        finalDecision: null,
                        lastUpdated: window.firebase?.database?.serverTimestamp ? window.firebase.database.serverTimestamp() : new Date().toISOString()
                    });
                }
            }

            this.currentPlayerId = playerId;
            console.log('✅ Đã tạo người chơi:', playerId);
            return true;
        } catch (error) {
            console.error('❌ Lỗi khởi tạo:', error);
            throw error;
        }
    },

    async checkPhoneExists(phone) {
        try {
            if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
                const database = FirebaseConfig.getDatabase();
                if (database && window.firebase?.database?.ref && window.firebase?.database?.get) {
                    const playersRef = window.firebase.database.ref(database, 'players');
                    const snapshot = await window.firebase.database.get(playersRef);
                    
                    if (snapshot.exists()) {
                        const players = snapshot.val();
                        return Object.values(players).some(player => player.phone === phone);
                    }
                }
            }
            return false;
        } catch (error) {
            console.error('❌ Lỗi kiểm tra số điện thoại:', error);
            return false;
        }
    },

    async updateQuizResult(result) {
        if (!this.currentPlayerId) {
            throw new Error('Không tìm thấy thông tin người chơi!');
        }

        try {
            if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
                const database = FirebaseConfig.getDatabase();
                if (database && window.firebase?.database?.ref && window.firebase?.database?.update) {
                    const playerRef = window.firebase.database.ref(database, `players/${this.currentPlayerId}`);
                    await window.firebase.database.update(playerRef, {
                        score: Number(result.score),
                        lastUpdated: window.firebase?.database?.serverTimestamp ? window.firebase.database.serverTimestamp() : new Date().toISOString()
                    });
                    console.log('✅ Đã cập nhật điểm');
                }
            }
        } catch (error) {
            console.error('❌ Lỗi cập nhật điểm:', error);
            throw error;
        }
    },

    async updateWheelResult(result) {
        if (!this.currentPlayerId) {
            throw new Error('Không tìm thấy thông tin người chơi!');
        }

        try {
            if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
                const database = FirebaseConfig.getDatabase();
                if (database && window.firebase?.database?.ref && window.firebase?.database?.update) {
                    const playerRef = window.firebase.database.ref(database, `players/${this.currentPlayerId}`);
                    await window.firebase.database.update(playerRef, {
                        prize: result.prize,
                        prizeIcon: result.prizeIcon || '',
                        prizeDescription: result.prizeDescription || '',
                        lastUpdated: window.firebase?.database?.serverTimestamp ? window.firebase.database.serverTimestamp() : new Date().toISOString()
                    });
                    console.log('✅ Đã cập nhật phần thưởng:', result.prize);
                }
            }
        } catch (error) {
            console.error('❌ Lỗi cập nhật phần thưởng:', error);
            throw error;
        }
    },

    async updateFinalChoice(result) {
        if (!this.currentPlayerId) {
            throw new Error('Không tìm thấy thông tin người chơi!');
        }

        try {
            if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
                const database = FirebaseConfig.getDatabase();
                if (database && window.firebase?.database?.ref && window.firebase?.database?.update) {
                    const playerRef = window.firebase.database.ref(database, `players/${this.currentPlayerId}`);
                    await window.firebase.database.update(playerRef, {
                        finalDecision: Boolean(result.decision),
                        finalDecisionText: result.decision ? 'Đăng ký nhận quà' : 'Liên hệ lại sau',
                        prize: result.prize || '',
                        prizeIcon: result.prizeIcon || '',
                        lastUpdated: window.firebase?.database?.serverTimestamp ? window.firebase.database.serverTimestamp() : new Date().toISOString()
                    });
                    console.log('✅ Đã cập nhật quyết định:', result.decision ? 'Đăng ký' : 'Liên hệ lại sau');
                }
            }
        } catch (error) {
            console.error('❌ Lỗi cập nhật quyết định:', error);
            throw error;
        }
    },

    async getNextSequence() {
        try {
            if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
                const database = FirebaseConfig.getDatabase();
                if (database && window.firebase?.database?.ref && window.firebase?.database?.get) {
                    const snapshot = await window.firebase.database.get(window.firebase.database.ref(database, 'players'));
                    return snapshot.exists() ? Object.keys(snapshot.val()).length + 1 : 1;
                }
            }
            return Date.now();
        } catch (error) {
            console.error('❌ Lỗi lấy số thứ tự:', error);
            return Date.now();
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
        zalo: '0372284333',
        logoUrl: 'assets/lg.png'
    },
    
    // Cấu hình khác
    QUIZ_SETTINGS: {
        PASS_SCORE: 3, // Điểm tối thiểu để vào vòng quay
        TOTAL_QUESTIONS: 5,
        TIME_LIMIT: 300 // 5 phút (giây)
    }
};

// Branding config to allow swapping logo/background without touching code
window.APP_BRANDING = {
    logoUrl: (CONFIG?.CENTER_INFO?.logoUrl) || 'assets/lg.svg'
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

// Monitor connection status
document.addEventListener('DOMContentLoaded', function() {
    // Initialize connection monitoring for Firebase
    if (typeof FirebaseConfig !== 'undefined') {
        // Wait for Firebase to initialize
        setTimeout(() => {
            try {
                const db = FirebaseConfig.getDatabase();
                if (db && window.firebase?.database?.ref && window.firebase?.database?.onValue) {
                    const connectedRef = window.firebase.database.ref(db, '.info/connected');
                    window.firebase.database.onValue(connectedRef, (snap) => {
                        config.connectionStatus = snap.val() === true;
                        console.log('🔌 Trạng thái kết nối:', config.connectionStatus ? '✅ Đã kết nối' : '❌ Mất kết nối');
                    });
                } else {
                    console.log('🔌 Firebase database not available, using localStorage mode');
                    config.connectionStatus = false;
                }
            } catch (error) {
                console.error('❌ Lỗi thiết lập monitor kết nối:', error);
                config.connectionStatus = false;
            }
        }, 1000);
    }
});
