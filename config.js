// Cấu hình cho Quiz App
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

// Database helper functions - Simplified Firebase-only implementation
const Database = {
    // Check if Firebase is available and configured
    isFirebaseAvailable() {
        return typeof window !== 'undefined' && 
               typeof window.FirebaseConfig !== 'undefined' && 
               window.FirebaseConfig.getDatabase() !== null;
    },

    // Get current database type
    getCurrentDatabaseType() {
        if (this.isFirebaseAvailable()) {
            const database = window.FirebaseConfig.getDatabase();
            return database ? 'firebase' : 'localStorage';
        }
        return 'localStorage';
    },

    // Lưu dữ liệu người dùng - Firebase only with localStorage fallback
    async saveUserData(userData) {
        try {
            if (this.isFirebaseAvailable()) {
                const database = window.FirebaseConfig.getDatabase();
                if (database) {
                    console.log('🔄 Saving to Firebase...');
                    
                    const userRef = window.firebase.database.ref(database, `users/${userData.id || Date.now()}`);
                    await window.firebase.database.set(userRef, {
                        ...userData,
                        savedAt: window.firebase.database.serverTimestamp(),
                        source: 'firebase'
                    });
                    
                    console.log('✅ Firebase save successful');
                    return { 
                        success: true, 
                        userId: userData.id,
                        source: 'firebase'
                    };
                }
            }
            
            // Fallback to localStorage
            throw new Error('Firebase not available');
            
        } catch (error) {
            console.warn('❌ Firebase save failed, using localStorage:', error.message);
            const userId = this.saveToLocalStorage(userData);
            return { 
                success: true, 
                fallback: true, 
                userId: userId,
                source: 'localStorage',
                message: 'Saved offline'
            };
        }
    },

    // Cập nhật kết quả quiz
    async updateQuizResult(userId, score, answers) {
        try {
            if (this.isFirebaseAvailable()) {
                const database = window.FirebaseConfig.getDatabase();
                if (database) {
                    const userRef = window.firebase.database.ref(database, `users/${userId}`);
                    await window.firebase.database.update(userRef, {
                        score: score,
                        answers: answers,
                        quizCompletedAt: window.firebase.database.serverTimestamp()
                    });
                    
                    console.log('✅ Quiz result updated in Firebase');
                    return { success: true, source: 'firebase' };
                }
            }
            
            // Fallback to localStorage
            this.updateLocalStorage(userId, { score, answers });
            return { success: true, fallback: true, source: 'localStorage' };
            
        } catch (error) {
            console.error('❌ Quiz update error:', error);
            this.updateLocalStorage(userId, { score, answers });
            return { success: true, fallback: true, source: 'localStorage' };
        }
    },

    // Lưu kết quả vòng quay
    async updateWheelResult(userId, prize) {
        try {
            if (this.isFirebaseAvailable()) {
                const database = window.FirebaseConfig.getDatabase();
                if (database) {
                    const userRef = window.firebase.database.ref(database, `users/${userId}`);
                    await window.firebase.database.update(userRef, {
                        prize: prize,
                        wheelCompletedAt: window.firebase.database.serverTimestamp()
                    });
                    
                    console.log('✅ Wheel result updated in Firebase');
                    return { success: true, source: 'firebase' };
                }
            }
            
            // Fallback to localStorage
            this.updateLocalStorage(userId, { prize });
            return { success: true, fallback: true, source: 'localStorage' };
            
        } catch (error) {
            console.error('❌ Wheel update error:', error);
            this.updateLocalStorage(userId, { prize });
            return { success: true, fallback: true, source: 'localStorage' };
        }
    },

    // Lưu lựa chọn cuối
    async updateFinalChoice(userId, choice, registrationData) {
        try {
            if (this.isFirebaseAvailable()) {
                const database = window.FirebaseConfig.getDatabase();
                if (database) {
                    const userRef = window.firebase.database.ref(database, `users/${userId}`);
                    await window.firebase.database.update(userRef, {
                        choice: choice,
                        registrationData: registrationData,
                        finalChoiceAt: window.firebase.database.serverTimestamp()
                    });
                    
                    console.log('✅ Final choice updated in Firebase');
                    return { success: true, source: 'firebase' };
                }
            }
            
            // Fallback to localStorage
            this.updateLocalStorage(userId, { choice, registrationData });
            return { success: true, fallback: true, source: 'localStorage' };
            
        } catch (error) {
            console.error('❌ Final choice update error:', error);
            this.updateLocalStorage(userId, { choice, registrationData });
            return { success: true, fallback: true, source: 'localStorage' };
        }
    },

    // Lấy thống kê
    async getStats() {
        try {
            if (this.isFirebaseAvailable()) {
                const database = window.FirebaseConfig.getDatabase();
                if (database) {
                    const usersRef = window.firebase.database.ref(database, 'users');
                    const snapshot = await window.firebase.database.get(usersRef);
                    
                    if (snapshot.exists()) {
                        const users = Object.values(snapshot.val());
                        
                        const totalParticipants = users.length;
                        const completedQuiz = users.filter(u => u.score !== undefined).length;
                        const passedQuiz = users.filter(u => u.score >= CONFIG.QUIZ_SETTINGS.PASS_SCORE).length;
                        const registeredUsers = users.filter(u => 
                            u.choice === 'register' || 
                            u.registrationData?.registrationDecision === 'register'
                        ).length;
                        const declinedUsers = users.filter(u => 
                            u.choice === 'decline' || 
                            u.registrationData?.registrationDecision === 'decline'
                        ).length;
                        
                        return {
                            success: true,
                            totalParticipants,
                            completedQuiz,
                            passedQuiz,
                            registeredUsers,
                            declinedUsers,
                            lastUpdated: new Date().toISOString(),
                            source: 'firebase'
                        };
                    }
                }
            }
            
            // Fallback to localStorage
            return this.getLocalStats();
            
        } catch (error) {
            console.error('❌ Stats error:', error);
            return this.getLocalStats();
        }
    },

    // Get all user data (for admin dashboard)
    async getAllUserData() {
        try {
            if (this.isFirebaseAvailable()) {
                const database = window.FirebaseConfig.getDatabase();
                if (database) {
                    const usersRef = window.firebase.database.ref(database, 'users');
                    const snapshot = await window.firebase.database.get(usersRef);
                    
                    if (snapshot.exists()) {
                        return {
                            success: true,
                            data: Object.values(snapshot.val()),
                            source: 'firebase'
                        };
                    }
                }
            }
            
            // Fallback to localStorage
            return {
                success: true,
                data: JSON.parse(localStorage.getItem('quizUsers') || '[]'),
                source: 'localStorage'
            };
            
        } catch (error) {
            console.error('❌ Get all data error:', error);
            return {
                success: false,
                data: [],
                source: 'localStorage'
            };
        }
    },

    // Fallback functions cho localStorage
    saveToLocalStorage(userData) {
        try {
            const users = JSON.parse(localStorage.getItem('quizUsers') || '[]');
            userData.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            userData.saved_locally = true;
            users.push(userData);
            localStorage.setItem('quizUsers', JSON.stringify(users));
            console.log('Đã lưu vào localStorage:', userData.id);
            return userData.id;
        } catch (error) {
            console.error('Lỗi lưu localStorage:', error);
            return Date.now().toString();
        }
    },

    updateLocalStorage(userId, updateData) {
        try {
            const users = JSON.parse(localStorage.getItem('quizUsers') || '[]');
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                users[userIndex] = { ...users[userIndex], ...updateData };
                localStorage.setItem('quizUsers', JSON.stringify(users));
                console.log('Đã cập nhật localStorage cho user:', userId);
            }
        } catch (error) {
            console.error('Lỗi cập nhật localStorage:', error);
        }
    },

    getLocalStats() {
        try {
            const users = JSON.parse(localStorage.getItem('quizUsers') || '[]');
            
            // Tính toán các thống kê chi tiết
            const totalParticipants = users.length;
            const completedQuiz = users.filter(u => u.score !== undefined).length;
            const passedQuiz = users.filter(u => u.score >= CONFIG.QUIZ_SETTINGS.PASS_SCORE).length;
            
            // Thống kê quyết định đăng ký
            const registeredUsers = users.filter(u => 
                u.choice === 'register' || 
                u.registrationData?.registrationDecision === 'register'
            ).length;
            
            const declinedUsers = users.filter(u => 
                u.choice === 'decline' || 
                u.registrationData?.registrationDecision === 'decline'
            ).length;
            
            return {
                success: true,
                totalParticipants: totalParticipants,
                completedQuiz: completedQuiz,
                passedQuiz: passedQuiz,
                registeredUsers: registeredUsers,
                declinedUsers: declinedUsers,
                lastUpdated: new Date().toISOString(),
                source: 'localStorage'
            };
        } catch (error) {
            console.error('Lỗi lấy stats từ localStorage:', error);
            return {
                success: false,
                totalParticipants: 0,
                completedQuiz: 0,
                passedQuiz: 0,
                registeredUsers: 0,
                declinedUsers: 0
            };
        }
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
            if (typeof window.FirebaseConfig.testDatabaseConnection === 'function') {
                const result = await window.FirebaseConfig.testDatabaseConnection();
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


// Connection status helper with Firebase and Google Sheets support
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

// Updated config object with new database methods
const config = {
    async updateWheelResult(userId, result) {
        try {
            await window.FirebaseConfig.databaseMethods.updateWheelResult(userId, result);
            console.log('✅ Wheel result updated successfully');
        } catch (error) {
            console.error('❌ Wheel update error:', error);
        }
    },

    async updateFinalChoice(userId, choice) {
        try {
            await window.FirebaseConfig.databaseMethods.updateFinalChoice(userId, choice);
            console.log('✅ Final choice updated successfully');
        } catch (error) {
            console.error('❌ Final choice update error:', error);
        }
    }
};

// Make config available globally
window.config = config;



