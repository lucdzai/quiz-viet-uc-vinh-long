/**
 * AdminPanel Class for Quiz Viet Uc Vinh Long
 * 
 * Provides comprehensive admin dashboard functionality with:
 * - Real-time data loading and display
 * - Firebase integration with offline fallback
 * - Enhanced error handling and loading states
 * - Improved date/time formatting
 * - Data export capabilities
 */
class AdminPanel {
    constructor() {
        this.currentSection = 'dashboard';
        this.userData = [];
        this.stats = {};
        this.isOnline = false;
        this.charts = {};
        this.realtimeUnsubscribe = null;
    }

    /**
     * Initialize the admin panel
     */
    init() {
        console.log('🎯 AdminPanel Loading...');
        
        // Listen for connection status updates
        window.addEventListener('connectionStatusUpdate', (event) => {
            const { online, databaseType, error } = event.detail;
            this.updateConnectionDisplay(online, databaseType, error);
        });

        // Listen for Firebase connection updates
        window.addEventListener('firebaseConnectionUpdate', (event) => {
            const { connected } = event.detail;
            if (CONFIG.DATABASE_TYPE === 'firebase') {
                this.updateConnectionDisplay(connected, 'firebase');
            }
        });
        
        // Set up real-time listeners
        this.setupRealtimeListeners();
        
        // Set up auto-refresh
        const refreshInterval = this.realtimeUnsubscribe ? 60000 : 30000;
        setInterval(() => this.refreshDashboard(), refreshInterval);
        
        // Initial load
        this.refreshDashboard();
        
        // Set up UI event listeners
        this.setupUIEventListeners();
        
        // Set current date as default for export
        const today = new Date().toISOString().split('T')[0];
        const dateToInput = document.getElementById('date-to');
        if (dateToInput) {
            dateToInput.value = today;
        }
        
        // Update system info
        this.updateSystemInfo();
    }

    /**
     * Set up real-time listeners for Firebase
     */
    setupRealtimeListeners() {
        console.log('🔥 Setting up real-time listeners...');
        
        const trySetupListeners = (attempts = 0) => {
            if (typeof window.FirebaseFallback !== 'undefined') {
                try {
                    const status = window.FirebaseFallback.getConnectionStatus();
                    if (status.firebaseAvailable && status.isOnline) {
                        this.realtimeUnsubscribe = window.FirebaseFallback.onDataChange((update) => {
                            console.log('🔥 Real-time update received:', update.type);
                            
                            if (update.type === 'users') {
                                this.userData = update.data;
                                if (this.currentSection === 'data') {
                                    this.displayUserData(this.userData);
                                }
                                if (this.currentSection === 'dashboard') {
                                    this.updateRecentActivity();
                                }
                            } else if (update.type === 'stats') {
                                this.stats = {
                                    success: true,
                                    ...update.data,
                                    source: 'firebase_realtime'
                                };
                                if (this.currentSection === 'dashboard') {
                                    this.updateStatsDisplay();
                                    this.updateStatsChart();
                                }
                            }
                        });
                        
                        console.log('✅ Firebase real-time listeners active');
                        this.showNotification('🔥 Real-time updates enabled', 'success');
                    } else {
                        console.log('ℹ️ Real-time listeners not available (Firebase not accessible)');
                        this.showNotification('ℹ️ Chế độ offline - sử dụng polling', 'info');
                    }
                    
                } catch (error) {
                    console.error('❌ Failed to set up Firebase real-time listeners:', error);
                }
            } else if (attempts < 20) {
                setTimeout(() => trySetupListeners(attempts + 1), 250);
            } else {
                console.log('ℹ️ Real-time listeners not available (FirebaseFallback not ready after 20 attempts)');
                this.showNotification('ℹ️ Mode polling (không real-time)', 'info');
            }
        };
        
        trySetupListeners();
    }

    /**
     * Clean up real-time listeners
     */
    cleanupRealtimeListeners() {
        if (this.realtimeUnsubscribe) {
            this.realtimeUnsubscribe();
            this.realtimeUnsubscribe = null;
            console.log('🔥 Firebase real-time listeners cleaned up');
        }
    }

    /**
     * Set up UI event listeners
     */
    setupUIEventListeners() {
        const searchInput = document.getElementById('search-input');
        const classFilter = document.getElementById('class-filter');
        const statusFilter = document.getElementById('status-filter');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterUserData());
        }
        if (classFilter) {
            classFilter.addEventListener('change', () => this.filterUserData());
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterUserData());
        }
    }

    /**
     * Format date and time for consistent display
     */
    formatDateTime(timestamp) {
        if (!timestamp) {
            return 'Không xác định';
        }
        
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
            console.warn('Error formatting date:', error);
            return 'Không xác định';
        }
    }

    /**
     * Format display data with proper fallbacks and validation
     */
    formatDisplayData(user) {
        if (!user) return {};
        
        // Helper function to safely get a value with fallback
        const safeGet = (value, fallback) => {
            if (value === null || value === undefined || value === 'undefined' || value === '') {
                return fallback;
            }
            return value;
        };
        
        return {
            timestamp: this.formatDateTime(user.timestamp),
            name: safeGet(user.name, 'Chưa có tên'),
            phone: safeGet(user.phone, 'Chưa có SĐT'),
            classType: this.getClassDisplayName(user.classType) || 'Chưa chọn lớp',
            score: user.score !== undefined && user.score !== null ? `${user.score}/5` : 'Chưa làm',
            prize: safeGet(user.prize, 'Chưa có'),
            choice: this.getChoiceDisplayText(user.choice),
            status: this.getUserStatus(user)
        };
    }

    /**
     * Get user status with proper formatting and validation
     */
    getUserStatus(user) {
        if (!user) return '❓ Không xác định';
        
        // Check if user has made a final choice
        if (user.choice === 'register') return '✅ Đã đăng ký';
        if (user.choice === 'decline') return '❌ Từ chối đăng ký';
        if (user.choice) return '🏁 Hoàn tất';
        
        // Check quiz completion status
        if (user.score !== undefined && user.score !== null) {
            if (user.score >= CONFIG.QUIZ_SETTINGS.PASS_SCORE) {
                return '🎯 Đạt vòng quay';
            } else {
                return '✅ Hoàn thành quiz';
            }
        }
        
        // Check if user has started
        if (user.timestamp) {
            return '⏳ Đang làm bài';
        }
        
        return '🔄 Mới bắt đầu';
    }

    /**
     * Get choice display text with proper validation
     */
    getChoiceDisplayText(choice) {
        if (!choice || choice === 'undefined' || choice === '') {
            return 'Chưa quyết định';
        }
        
        switch(choice) {
            case 'register': return '✅ Đăng ký khóa học';
            case 'decline': return '❌ Từ chối đăng ký';
            case 'pending': return '⏳ Đang suy nghĩ';
            default: return choice || 'Chưa quyết định';
        }
    }

    /**
     * Get class display name with validation
     */
    getClassDisplayName(classType) {
        if (!classType || classType === 'undefined' || classType === '') {
            return 'Chưa chọn lớp';
        }
        
        const displayNames = {
            'tieu-hoc': 'Khối Tiểu học',
            'thcs': 'Khối THCS', 
            'thpt': 'Luyện thi THPT',
            'tieng-trung': 'Tiếng Trung cơ bản',
            'tieng-trung-11': 'Tiếng Trung 1-1',
            'tieng-anh-giao-tiep': 'Tiếng Anh giao tiếp',
            'tieng-anh-giao-tiep-11': 'Tiếng Anh giao tiếp 1-1',
            'chung-chi': 'Luyện thi chứng chỉ'
        };
        
        return displayNames[classType] || classType;
    }

    /**
     * Show loading overlay
     */
    showLoading(text) {
        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');
        
        if (loadingText) {
            loadingText.textContent = text;
        }
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    /**
     * Show notification with improved styling
     */
    showNotification(message, type = 'info') {
        // Prevent duplicate notifications
        const existingNotifications = document.querySelectorAll('.notification');
        if (existingNotifications.length > 3) {
            existingNotifications[0].remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: ${20 + (existingNotifications.length * 70)}px;
            right: 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-family: Arial, sans-serif;
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
     * Update data source indicator
     */
    updateDataSourceIndicator(source) {
        const indicators = [
            document.getElementById('data-source'),
            document.getElementById('data-source-display')
        ];
        
        let displayText = source;
        let className = '';
        
        switch(source) {
            case 'google_sheets':
                displayText = '🟢 Google Sheets (Real-time)';
                className = 'source-online';
                break;
            case 'firebase':
                displayText = '🟢 Firebase (Real-time)';
                className = 'source-online';
                break;
            case 'localStorage':
                displayText = '🟡 localStorage (Local only)';
                className = 'source-offline';
                break;
            default:
                displayText = source;
                className = 'source-unknown';
        }
        
        indicators.forEach(element => {
            if (element) {
                element.textContent = displayText;
                element.className = `data-source-indicator ${className}`;
            }
        });
    }

    /**
     * Update connection status display in the UI
     */
    updateConnectionDisplay(online, databaseType, error = null) {
        const statusElement = document.getElementById('connection-status');
        const refreshBtn = document.querySelector('.refresh-btn');
        
        if (!statusElement) return;
        
        let statusText = '';
        let statusClass = '';
        
        if (online) {
            switch(databaseType) {
                case 'firebase':
                    statusText = '🟢 Firebase (Online)';
                    statusClass = 'status-online';
                    break;
                case 'google_sheets':
                    statusText = '🟢 Google Sheets (Online)';
                    statusClass = 'status-online';
                    break;
                default:
                    statusText = '🟢 Online';
                    statusClass = 'status-online';
            }
        } else {
            if (error) {
                statusText = `❌ Offline - ${error}`;
                statusClass = 'status-error';
            } else {
                statusText = `🟡 ${databaseType || 'localStorage'} (Offline)`;
                statusClass = 'status-offline';
            }
        }
        
        statusElement.textContent = statusText;
        statusElement.className = `connection-status ${statusClass}`;
        
        // Update refresh button state
        if (refreshBtn && !refreshBtn.disabled) {
            refreshBtn.disabled = false;
        }
        
        // Update data source indicator
        this.updateDataSourceIndicator(online ? databaseType : 'localStorage');
        
        console.log(`🔌 Connection status updated: ${statusText}`);
    }

    /**
     * Enhanced connection check
     */
    async checkConnection() {
        const statusElement = document.getElementById('connection-status');
        const refreshBtn = document.querySelector('.refresh-btn');
        
        if (statusElement) {
            statusElement.textContent = '🔄 Đang kiểm tra kết nối...';
            statusElement.className = 'connection-status status-checking';
        }
        
        if (refreshBtn) {
            refreshBtn.disabled = true;
        }
        
        try {
            let online = false;
            let dbType = Database.getCurrentDatabaseType();
            let errorDetails = null;
            
            console.log(`🔄 Testing connection to ${dbType}...`);
            
            try {
                online = await Database.testConnection();
                errorDetails = online ? null : 'Database test connection failed';
            } catch (error) {
                online = false;
                errorDetails = error.message;
            }
            
            this.updateConnectionDisplay(online, dbType, errorDetails);
            return online;
            
        } catch (error) {
            console.error('Connection check failed:', error);
            this.updateConnectionDisplay(false, Database.getCurrentDatabaseType(), error.message);
            return false;
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
            }
        }
    }

    /**
     * Filter user data based on search criteria
     */
    filterUserData() {
        const searchInput = document.getElementById('search-input');
        const classFilter = document.getElementById('class-filter');
        const statusFilter = document.getElementById('status-filter');
        
        if (!searchInput || !classFilter || !statusFilter) return;
        
        const searchTerm = searchInput.value.toLowerCase();
        const classFilterValue = classFilter.value;
        const statusFilterValue = statusFilter.value;
        
        let filteredData = this.userData.filter(user => {
            // Search filter
            const matchesSearch = !searchTerm || 
                (user.name && user.name.toLowerCase().includes(searchTerm)) ||
                (user.phone && user.phone.includes(searchTerm));
            
            // Class filter
            const matchesClass = !classFilterValue || user.classType === classFilterValue;
            
            // Status filter
            let matchesStatus = true;
            if (statusFilterValue === 'completed') {
                matchesStatus = user.score !== undefined;
            } else if (statusFilterValue === 'passed') {
                matchesStatus = user.score >= 3;
            } else if (statusFilterValue === 'registered') {
                matchesStatus = user.choice === 'register';
            }
            
            return matchesSearch && matchesClass && matchesStatus;
        });
        
        this.displayUserData(filteredData);
    }

    /**
     * Update system info
     */
    updateSystemInfo() {
        const info = {
            userAgent: navigator.userAgent,
            screen: `${screen.width}x${screen.height}`,
            language: navigator.language,
            online: navigator.onLine
        };
        
        console.log('🖥️ System Info:', info);
    }

    /**
     * Show section navigation
     */
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Remove active from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Add active to clicked button (if called from event)
        if (event && event.target) {
            event.target.classList.add('active');
        }
        
        this.currentSection = sectionName;
        
        // Load section-specific data
        switch(sectionName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'data':
                this.loadUserData();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'export':
                // Export section doesn't need special loading
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    /**
     * Load dashboard
     */
    loadDashboard() {
        this.updateStatsDisplay();
        this.updateRecentActivity();
        this.updateStatsChart();
    }

    /**
     * Update stats display
     */
    updateStatsDisplay() {
        if (!this.stats) return;
        
        const elements = {
            'total-participants': this.stats.totalParticipants || 0,
            'completed-quiz': this.stats.completedQuiz || 0,
            'passed-quiz': this.stats.passedQuiz || 0,
            'registered-users': this.stats.registeredUsers || 0
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Calculate conversion rate
        const conversionRate = this.stats.totalParticipants > 0 
            ? Math.round((this.stats.registeredUsers / this.stats.totalParticipants) * 100)
            : 0;
        const conversionElement = document.getElementById('conversion-rate');
        if (conversionElement) {
            conversionElement.textContent = conversionRate + '%';
        }
        
        // Calculate average score
        const completedUsers = this.userData.filter(u => u.score !== undefined);
        const avgScore = completedUsers.length > 0
            ? (completedUsers.reduce((sum, u) => sum + u.score, 0) / completedUsers.length).toFixed(1)
            : 0;
        const avgScoreElement = document.getElementById('avg-score');
        if (avgScoreElement) {
            avgScoreElement.textContent = avgScore;
        }
    }

    /**
     * Update recent activity
     */
    updateRecentActivity() {
        const recentUsers = this.userData
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);
        
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;
        
        if (recentUsers.length === 0) {
            activityList.innerHTML = '<p>Chưa có hoạt động nào</p>';
            return;
        }
        
        let html = '<div class="activity-items">';
        recentUsers.forEach(user => {
            const formatted = this.formatDisplayData(user);
            let activity = `🆕 ${formatted.name} đăng ký tham gia`;
            
            if (user.score !== undefined) {
                activity += ` → ✅ Hoàn thành quiz (${user.score}/5)`;
            }
            
            if (user.prize) {
                activity += ` → 🎁 Nhận quà: ${user.prize}`;
            }
            
            if (user.choice === 'register') {
                activity += ` → 📝 Đăng ký khóa học`;
            } else if (user.choice === 'decline') {
                activity += ` → ❌ Từ chối đăng ký`;
            }
            
            html += `
                <div style="padding: 0.5rem; border-left: 3px solid #3498db; margin: 0.5rem 0; background: #f8f9fa;">
                    <strong>${formatted.timestamp}</strong><br>
                    ${activity}
                </div>
            `;
        });
        html += '</div>';
        
        activityList.innerHTML = html;
    }

    /**
     * Update stats chart
     */
    updateStatsChart() {
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not available, skipping chart update');
            const chartCanvas = document.getElementById('statsChart');
            if (chartCanvas) {
                const ctx = chartCanvas.getContext('2d');
                ctx.fillStyle = '#f8f9fa';
                ctx.fillRect(0, 0, chartCanvas.width, chartCanvas.height);
                ctx.fillStyle = '#6c757d';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Biểu đồ không khả dụng', chartCanvas.width/2, chartCanvas.height/2);
            }
            return;
        }
        
        const ctx = document.getElementById('statsChart')?.getContext('2d');
        if (!ctx) return;
        
        if (this.charts.stats) {
            this.charts.stats.destroy();
        }
        
        this.charts.stats = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Hoàn thành', 'Đạt vòng quay', 'Đăng ký khóa học', 'Từ chối'],
                datasets: [{
                    data: [
                        this.stats.completedQuiz || 0,
                        this.stats.passedQuiz || 0,
                        this.stats.registeredUsers || 0,
                        this.stats.declinedUsers || 0
                    ],
                    backgroundColor: [
                        '#3498db',
                        '#2ecc71',
                        '#e74c3c',
                        '#f39c12'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Phân bố người dùng'
                    }
                }
            }
        });
    }

    /**
     * Load analytics
     */
    loadAnalytics() {
        this.loadClassChart();
        this.loadTimeChart();
        this.loadScoreChart();
    }

    /**
     * Load class distribution chart
     */
    loadClassChart() {
        if (typeof Chart === 'undefined') return;
        
        const ctx = document.getElementById('classChart')?.getContext('2d');
        if (!ctx) return;
        
        if (this.charts.class) {
            this.charts.class.destroy();
        }
        
        const classCounts = {};
        this.userData.forEach(user => {
            const className = this.getClassDisplayName(user.classType) || 'Khác';
            classCounts[className] = (classCounts[className] || 0) + 1;
        });
        
        this.charts.class = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(classCounts),
                datasets: [{
                    label: 'Số người tham gia',
                    data: Object.values(classCounts),
                    backgroundColor: '#3498db'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Phân bố theo lớp học'
                    }
                }
            }
        });
    }

    /**
     * Load time distribution chart
     */
    loadTimeChart() {
        if (typeof Chart === 'undefined') return;
        
        const ctx = document.getElementById('timeChart')?.getContext('2d');
        if (!ctx) return;
        
        if (this.charts.time) {
            this.charts.time.destroy();
        }
        
        const hourCounts = {};
        this.userData.forEach(user => {
            const hour = new Date(user.timestamp).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        
        const hours = Array.from({length: 24}, (_, i) => i);
        const counts = hours.map(h => hourCounts[h] || 0);
        
        this.charts.time = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hours.map(h => h + ':00'),
                datasets: [{
                    label: 'Số người tham gia',
                    data: counts,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Phân bố theo giờ trong ngày'
                    }
                }
            }
        });
    }

    /**
     * Load score distribution chart
     */
    loadScoreChart() {
        if (typeof Chart === 'undefined') return;
        
        const ctx = document.getElementById('scoreChart')?.getContext('2d');
        if (!ctx) return;
        
        if (this.charts.score) {
            this.charts.score.destroy();
        }
        
        const scoreCounts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
        this.userData.forEach(user => {
            if (user.score !== undefined) {
                scoreCounts[user.score]++;
            }
        });
        
        this.charts.score = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['0/5', '1/5', '2/5', '3/5', '4/5', '5/5'],
                datasets: [{
                    label: 'Số người đạt',
                    data: Object.values(scoreCounts),
                    backgroundColor: [
                        '#e74c3c', '#e74c3c', '#f39c12', 
                        '#2ecc71', '#2ecc71', '#27ae60'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Phân bố điểm số'
                    }
                }
            }
        });
    }

    /**
     * Load settings
     */
    loadSettings() {
        const elements = {
            'current-url': CONFIG.GOOGLE_SCRIPT_URL || 'Firebase only mode',
            'last-update': new Date().toLocaleString('vi-VN'),
            'data-source': this.isOnline ? 'Firebase + localStorage' : 'localStorage only'
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    /**
     * Export CSV
     */
    exportCSV() {
        const BOM = '\uFEFF';
        let csv = BOM + 'Thời gian,Tên,SĐT,Lớp học,Điểm,Quà,Quyết định\n';
        
        this.userData.forEach(user => {
            const formatted = this.formatDisplayData(user);
            const row = [
                formatted.timestamp,
                formatted.name,
                formatted.phone,
                formatted.classType,
                formatted.score,
                formatted.prize,
                formatted.choice
            ].map(field => `"${field}"`).join(',');
            csv += row + '\n';
        });
        
        this.downloadFile(csv, 'quiz-data.csv', 'text/csv');
        this.showNotification('Đã xuất file CSV', 'success');
    }

    /**
     * Export JSON
     */
    exportJSON() {
        const data = JSON.stringify(this.userData, null, 2);
        this.downloadFile(data, 'quiz-data.json', 'application/json');
        this.showNotification('Đã xuất file JSON', 'success');
    }

    /**
     * Export PDF (placeholder)
     */
    exportPDF() {
        this.showNotification('Tính năng xuất PDF đang phát triển', 'info');
    }

    /**
     * Export Excel (placeholder)
     */
    exportExcel() {
        this.showNotification('Tính năng xuất Excel đang phát triển', 'info');
    }

    /**
     * Download file helper
     */
    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Test connection
     */
    testConnection() {
        this.showLoading('Đang test kết nối...');
        
        this.checkConnection().then(online => {
            this.hideLoading();
            
            if (online) {
                this.showNotification('✅ Kết nối thành công!', 'success');
                
                // Additional test: try to get stats
                Database.getStats().then(result => {
                    if (result.success) {
                        this.showNotification('✅ API hoạt động bình thường - Có thể lấy dữ liệu', 'success');
                    }
                }).catch(error => {
                    this.showNotification('⚠️ Kết nối OK nhưng có lỗi API: ' + error.message, 'warning');
                });
            } else {
                this.showNotification('❌ Không thể kết nối đến database', 'error');
            }
        });
    }

    /**
     * Show clear data dialog
     */
    showClearDataDialog() {
        const dialog = document.getElementById('clear-data-dialog');
        if (dialog) {
            dialog.style.display = 'flex';
        }
    }

    /**
     * Hide clear data dialog
     */
    hideClearDataDialog() {
        const dialog = document.getElementById('clear-data-dialog');
        if (dialog) {
            dialog.style.display = 'none';
        }
    }

    /**
     * Confirm clear all data
     */
    async confirmClearAllData() {
        this.hideClearDataDialog();
        this.showLoading('Đang xóa tất cả dữ liệu...');
        
        try {
            let clearedItems = [];
            let errors = [];
            
            // Clear localStorage
            try {
                const localStorageCount = localStorage.length;
                localStorage.clear();
                clearedItems.push(`localStorage (${localStorageCount} items)`);
                console.log('✅ Đã xóa localStorage');
            } catch (error) {
                console.error('❌ Lỗi xóa localStorage:', error);
                errors.push('localStorage: ' + error.message);
            }
            
            // Clear sessionStorage
            try {
                const sessionStorageCount = sessionStorage.length;
                sessionStorage.clear();
                clearedItems.push(`sessionStorage (${sessionStorageCount} items)`);
                console.log('✅ Đã xóa sessionStorage');
            } catch (error) {
                console.error('❌ Lỗi xóa sessionStorage:', error);
                errors.push('sessionStorage: ' + error.message);
            }
            
            this.hideLoading();
            
            if (clearedItems.length > 0) {
                const successMessage = `✅ Đã xóa thành công:\n${clearedItems.map(item => '• ' + item).join('\n')}`;
                console.log(successMessage);
                this.showNotification('🎉 Đã xóa tất cả dữ liệu thành công!', 'success');
                
                // Reload page after a short delay
                setTimeout(() => {
                    this.showNotification('🔄 Đang tải lại trang...', 'info');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }, 3000);
            } else {
                this.showNotification('❌ Không thể xóa dữ liệu: ' + errors.join(', '), 'error');
            }
            
        } catch (error) {
            this.hideLoading();
            console.error('❌ Lỗi tổng quát khi xóa dữ liệu:', error);
            this.showNotification('❌ Có lỗi xảy ra: ' + error.message, 'error');
        }
    }

    /**
     * Sync data (placeholder)
     */
    syncData() {
        this.showLoading('Đang đồng bộ dữ liệu...');
        
        setTimeout(() => {
            this.hideLoading();
            this.showNotification('ℹ️ Tính năng đồng bộ sẽ được phát triển', 'info');
        }, 1000);
    }

    /**
     * Backup data
     */
    backupData() {
        const backup = {
            timestamp: new Date().toISOString(),
            data: this.userData,
            stats: this.stats
        };
        
        this.downloadFile(JSON.stringify(backup, null, 2), `backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
        this.showNotification('Đã tạo file backup', 'success');
    }

    /**
     * Refresh dashboard data
     */
    async refreshDashboard() {
        console.log('🔄 Refreshing dashboard...');
        const refreshButton = document.querySelector('.refresh-btn');
        
        if (refreshButton) {
            refreshButton.disabled = true;
            refreshButton.textContent = '🔄 Đang tải...';
        }
        
        try {
            await this.checkConnection();
            await this.loadStats();
            await this.loadUserData();
            
            if (this.currentSection === 'dashboard') {
                this.updateStatsDisplay();
                this.updateRecentActivity();
                this.updateStatsChart();
            }
            
            this.showNotification('✅ Dữ liệu đã được cập nhật', 'success');
            
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
            this.showNotification('⚠️ Có lỗi khi cập nhật dữ liệu: ' + error.message, 'error');
        } finally {
            if (refreshButton) {
                refreshButton.disabled = false;
                refreshButton.textContent = '🔄 Kiểm tra';
            }
        }
    }

    /**
     * Load statistics with improved error handling
     */
    async loadStats() {
        try {
            console.log(`📊 Loading stats from ${Database.getCurrentDatabaseType()}...`);
            this.stats = await Database.getStats();
            console.log('✅ Stats loaded:', this.stats);
            
        } catch (error) {
            console.error('❌ Error loading stats:', error);
            this.showNotification('Lỗi khi tải thống kê: ' + error.message, 'error');
            
            // Emergency fallback - calculate from current userData
            if (this.userData && this.userData.length > 0) {
                this.stats = {
                    success: true,
                    totalParticipants: this.userData.length,
                    completedQuiz: this.userData.filter(u => u.score !== undefined).length,
                    passedQuiz: this.userData.filter(u => u.score >= CONFIG.QUIZ_SETTINGS.PASS_SCORE).length,
                    registeredUsers: this.userData.filter(u => u.choice === 'register').length,
                    declinedUsers: this.userData.filter(u => u.choice === 'decline').length,
                    source: 'calculated from current data'
                };
            } else {
                this.stats = {
                    success: false,
                    totalParticipants: 0,
                    completedQuiz: 0,
                    passedQuiz: 0,
                    registeredUsers: 0,
                    declinedUsers: 0
                };
            }
        }
    }

    /**
     * Load user data with enhanced error handling
     */
    async loadUserData() {
        this.showLoading('Đang tải dữ liệu người dùng...');
        
        try {
            console.log(`🔄 Loading user data from ${Database.getCurrentDatabaseType()}...`);
            const result = await Database.getAllUserData();
            
            if (result.success && result.data) {
                this.userData = result.data;
                console.log(`✅ Loaded ${this.userData.length} records from ${result.source}`);
                
                this.updateDataSourceIndicator(result.source);
                this.displayUserData(this.userData);
                this.hideLoading();
                
                if (this.userData.length === 0) {
                    this.showNotification('ℹ️ Chưa có dữ liệu nào. Dữ liệu từ học sinh sẽ hiển thị khi họ làm quiz.', 'info');
                }
                return;
            } else {
                throw new Error('Failed to load user data');
            }
            
        } catch (error) {
            console.error('Error loading user data:', error);
            this.hideLoading();
            this.showNotification('Lỗi khi tải dữ liệu người dùng: ' + error.message, 'error');
            
            // Emergency fallback to localStorage
            try {
                this.userData = JSON.parse(localStorage.getItem('quizUsers') || '[]');
                this.updateDataSourceIndicator('localStorage (emergency fallback)');
                this.displayUserData(this.userData);
            } catch (fallbackError) {
                console.error('Even localStorage fallback failed:', fallbackError);
                this.userData = [];
                this.displayUserData(this.userData);
            }
        }
    }

    /**
     * Display user data in table with improved formatting
     */
    displayUserData(users) {
        const tbody = document.getElementById('user-data-body');
        if (!tbody) return;
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">Chưa có dữ liệu</td></tr>';
            return;
        }
        
        let html = '';
        users.forEach(user => {
            const formatted = this.formatDisplayData(user);
            
            html += `
                <tr>
                    <td>${formatted.timestamp}</td>
                    <td>${formatted.name}</td>
                    <td>${formatted.phone}</td>
                    <td>${formatted.classType}</td>
                    <td>${formatted.score}</td>
                    <td>${formatted.prize}</td>
                    <td>${formatted.choice}</td>
                    <td>${formatted.status}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }
}

// Global AdminPanel instance
let adminPanel = null;

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Create and initialize AdminPanel instance
    adminPanel = new AdminPanel();
    adminPanel.init();
});

// Function wrappers for backward compatibility with existing HTML onclick handlers
function showSection(sectionName) {
    if (adminPanel) {
        adminPanel.showSection(sectionName);
    }
}

function refreshDashboard() {
    if (adminPanel) {
        adminPanel.refreshDashboard();
    }
}

function loadUserData() {
    if (adminPanel) {
        adminPanel.loadUserData();
    }
}

function checkConnection() {
    if (adminPanel) {
        return adminPanel.checkConnection();
    }
}

function exportCSV() {
    if (adminPanel) {
        adminPanel.exportCSV();
    }
}

function exportJSON() {
    if (adminPanel) {
        adminPanel.exportJSON();
    }
}

function exportPDF() {
    if (adminPanel) {
        adminPanel.exportPDF();
    }
}

function exportExcel() {
    if (adminPanel) {
        adminPanel.exportExcel();
    }
}

function testConnection() {
    if (adminPanel) {
        adminPanel.testConnection();
    }
}

function clearLocalData() {
    if (adminPanel) {
        adminPanel.showClearDataDialog();
    }
}

function showClearDataDialog() {
    if (adminPanel) {
        adminPanel.showClearDataDialog();
    }
}

function hideClearDataDialog() {
    if (adminPanel) {
        adminPanel.hideClearDataDialog();
    }
}

function confirmClearAllData() {
    if (adminPanel) {
        adminPanel.confirmClearAllData();
    }
}

function syncData() {
    if (adminPanel) {
        adminPanel.syncData();
    }
}

function backupData() {
    if (adminPanel) {
        adminPanel.backupData();
    }
}
