// Cấu hình cho Quiz App
const CONFIG = {
    // QUAN TRỌNG: Thay YOUR_SCRIPT_ID bằng ID thực tế từ Google Apps Script
    // URL có dạng: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
    // 
    // HƯỚNG DẪN SETUP:
    // 1. Tạo Google Apps Script từ file docs/google-apps-script.js
    // 2. Deploy as Web App với quyền "Anyone"
    // 3. Copy URL của Web App và thay thế URL dưới đây
    // 4. Xem docs/GOOGLE_SHEETS_SETUP.md để có hướng dẫn chi tiết
    //
    // LưU Ý: URL dưới đây là placeholder, cần thay bằng URL thực của bạn
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyN3W1lIQEdlmLZwBHpxb_ImlWwCszntaD4QVuP81E-ZM9oaKzWieRwoBZQr7TnRBA/exec',
    
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

// Database helper functions
const Database = {
    // Lưu dữ liệu người dùng với retry logic
    async saveUserData(userData, retryCount = 0) {
        const maxRetries = 2;
        
        try {
            console.log(`🔄 Đang lưu dữ liệu người dùng (attempt ${retryCount + 1})...`, userData);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
            
            const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'saveUser',
                    data: userData
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Kết quả lưu dữ liệu:', result);
            
            if (result.success) {
                return result;
            } else {
                throw new Error(result.error || 'Không thể lưu dữ liệu');
            }
            
        } catch (error) {
            console.warn(`❌ Lỗi lưu dữ liệu (attempt ${retryCount + 1}):`, error.message);
            
            // Retry logic
            if (retryCount < maxRetries && !error.name === 'AbortError') {
                console.log(`🔄 Thử lại sau ${(retryCount + 1) * 1000}ms...`);
                await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
                return this.saveUserData(userData, retryCount + 1);
            }
            
            // Fallback: lưu vào localStorage
            console.log('💾 Sử dụng localStorage fallback...');
            const userId = this.saveToLocalStorage(userData);
            return { 
                success: true, 
                fallback: true, 
                userId: userId,
                message: 'Đã lưu offline'
            };
        }
    },

    // Cập nhật kết quả quiz
    async updateQuizResult(userId, score, answers) {
        try {
            console.log('Đang cập nhật kết quả quiz...', {userId, score});
            
            const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'updateQuiz',
                    userId: userId,
                    score: score,
                    answers: answers
                })
            });
            
            const result = await response.json();
            console.log('Kết quả cập nhật quiz:', result);
            return result;
            
        } catch (error) {
            console.error('Lỗi cập nhật quiz:', error);
            this.updateLocalStorage(userId, { score, answers });
            return { success: true, fallback: true };
        }
    },

    // Lưu kết quả vòng quay
    async updateWheelResult(userId, prize) {
        try {
            console.log('Đang lưu kết quả vòng quay...', {userId, prize});
            
            const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'updateWheel',
                    userId: userId,
                    prize: prize
                })
            });
            
            const result = await response.json();
            console.log('Kết quả cập nhật vòng quay:', result);
            return result;
            
        } catch (error) {
            console.error('Lỗi cập nhật vòng quay:', error);
            this.updateLocalStorage(userId, { prize });
            return { success: true, fallback: true };
        }
    },

    // Lưu lựa chọn cuối
    async updateFinalChoice(userId, choice, registrationData) {
        try {
            console.log('Đang lưu lựa chọn cuối...', {userId, choice});
            
            const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'updateFinal',
                    userId: userId,
                    choice: choice,
                    registrationData: registrationData
                })
            });
            
            const result = await response.json();
            console.log('Kết quả cập nhật lựa chọn cuối:', result);
            return result;
            
        } catch (error) {
            console.error('Lỗi cập nhật lựa chọn cuối:', error);
            this.updateLocalStorage(userId, { choice, registrationData });
            return { success: true, fallback: true };
        }
    },

    // Lấy thống kê
    async getStats() {
        try {
            const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'getStats'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                return result;
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('Lỗi lấy thống kê:', error);
            return this.getLocalStats();
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

    // Test connection
    async testConnection() {
        try {
            console.log('🔄 Testing Google Apps Script connection...');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
            
            const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'GET',
                mode: 'cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('✅ Connection test result:', result);
            
            if (result.success) {
                console.log('🟢 Google Sheets connection: ONLINE');
                return true;
            } else {
                throw new Error('Invalid response from Google Apps Script');
            }
            
        } catch (error) {
            console.warn('🔴 Google Sheets connection: OFFLINE -', error.message);
            
            // Show user-friendly error message
            if (error.name === 'AbortError') {
                console.warn('⏱️ Connection timeout - using localStorage fallback');
            } else if (error.message.includes('Failed to fetch')) {
                console.warn('🌐 Network error or CORS issue - using localStorage fallback');
            }
            
            return false;
        }
    }
};


// Connection status helper
const ConnectionStatus = {
    isOnline: false,
    lastCheck: null,
    
    async check() {
        this.lastCheck = new Date();
        this.isOnline = await Database.testConnection();
        return this.isOnline;
    },
    
    getStatus() {
        return {
            online: this.isOnline,
            lastCheck: this.lastCheck,
            source: this.isOnline ? 'Google Sheets' : 'localStorage'
        };
    }
};

// Test connection khi load trang (chỉ cho admin)
if (window.location.search.indexOf('student=true') === -1) {
    // Chỉ test khi không phải trang học sinh
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(async () => {
            const isOnline = await ConnectionStatus.check();
            console.log('🔌 Trạng thái kết nối API:', isOnline ? '✅ Hoạt động' : '❌ Offline - Sử dụng localStorage');
            
            // Trigger custom event for UI updates
            window.dispatchEvent(new CustomEvent('connectionStatusUpdate', { 
                detail: { online: isOnline }
            }));
        }, 1000);
    });
}




