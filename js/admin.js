// Admin Dashboard JavaScript
let currentSection = 'dashboard';
let userData = [];
let stats = {};
let isOnline = false;
let charts = {};

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Admin Dashboard Loading...');
    
    // Listen for connection status updates
    window.addEventListener('connectionStatusUpdate', function(event) {
        const { online } = event.detail;
        updateConnectionDisplay(online);
    });
    
    // Set up auto-refresh
    setInterval(refreshDashboard, 30000); // Refresh every 30 seconds
    
    // Initial load
    refreshDashboard();
    
    // Set up search functionality
    document.getElementById('search-input').addEventListener('input', filterUserData);
    document.getElementById('class-filter').addEventListener('change', filterUserData);
    document.getElementById('status-filter').addEventListener('change', filterUserData);
    
    // Set current date as default for export
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date-to').value = today;
    
    // Update system info
    updateSystemInfo();
});

// Show/hide sections
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName).classList.add('active');
    
    // Add active to clicked button
    event.target.classList.add('active');
    
    currentSection = sectionName;
    
    // Load section-specific data
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'data':
            loadUserData();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'export':
            // Export section doesn't need special loading
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Check connection status
async function checkConnection() {
    const statusElement = document.getElementById('connection-status');
    statusElement.textContent = '🔄 Đang kiểm tra...';
    statusElement.className = 'connection-status status-offline';
    
    try {
        const online = await Database.testConnection();
        updateConnectionDisplay(online);
        return online;
    } catch (error) {
        console.error('Connection check failed:', error);
        updateConnectionDisplay(false);
        return false;
    }
}

// Update connection display
function updateConnectionDisplay(isOnline) {
    const statusElement = document.getElementById('connection-status');
    
    if (isOnline) {
        statusElement.textContent = '✅ Google Sheets - Hoạt động';
        statusElement.className = 'connection-status status-online';
        isOnline = true;
        
        // Show success notification
        showNotification('🟢 Kết nối Google Sheets thành công!', 'success');
    } else {
        statusElement.textContent = '❌ Offline - Dùng localStorage';
        statusElement.className = 'connection-status status-offline';
        isOnline = false;
        
        // Show warning notification
        showNotification('🟡 Chế độ offline - Dữ liệu được lưu locally', 'warning');
    }
    
    // Update data source indicator
    const dataSourceElement = document.getElementById('data-source');
    if (dataSourceElement) {
        dataSourceElement.textContent = isOnline ? 'Google Sheets + localStorage' : 'localStorage only';
    }
}

// Refresh dashboard data
async function refreshDashboard() {
    console.log('🔄 Refreshing dashboard...');
    await checkConnection();
    await loadStats();
    
    if (currentSection === 'dashboard') {
        updateStatsDisplay();
        updateRecentActivity();
        updateStatsChart();
    }
}

// Load statistics
async function loadStats() {
    try {
        stats = await Database.getStats();
        console.log('📊 Stats loaded:', stats);
    } catch (error) {
        console.error('❌ Error loading stats:', error);
        showNotification('Lỗi khi tải thống kê', 'error');
    }
}

// Update stats display
function updateStatsDisplay() {
    if (!stats) return;
    
    document.getElementById('total-participants').textContent = stats.totalParticipants || 0;
    document.getElementById('completed-quiz').textContent = stats.completedQuiz || 0;
    document.getElementById('passed-quiz').textContent = stats.passedQuiz || 0;
    document.getElementById('registered-users').textContent = stats.registeredUsers || 0;
    
    // Calculate conversion rate
    const conversionRate = stats.totalParticipants > 0 
        ? Math.round((stats.registeredUsers / stats.totalParticipants) * 100)
        : 0;
    document.getElementById('conversion-rate').textContent = conversionRate + '%';
    
    // Calculate average score
    const users = JSON.parse(localStorage.getItem('quizUsers') || '[]');
    const completedUsers = users.filter(u => u.score !== undefined);
    const avgScore = completedUsers.length > 0
        ? (completedUsers.reduce((sum, u) => sum + u.score, 0) / completedUsers.length).toFixed(1)
        : 0;
    document.getElementById('avg-score').textContent = avgScore;
}

// Update recent activity
function updateRecentActivity() {
    const users = JSON.parse(localStorage.getItem('quizUsers') || '[]');
    const recentUsers = users
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
    
    const activityList = document.getElementById('activity-list');
    
    if (recentUsers.length === 0) {
        activityList.innerHTML = '<p>Chưa có hoạt động nào</p>';
        return;
    }
    
    let html = '<div class="activity-items">';
    recentUsers.forEach(user => {
        const time = new Date(user.timestamp).toLocaleString('vi-VN');
        let activity = `🆕 ${user.name} đăng ký tham gia`;
        
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
                <strong>${time}</strong><br>
                ${activity}
            </div>
        `;
    });
    html += '</div>';
    
    activityList.innerHTML = html;
}

// Update stats chart
function updateStatsChart() {
    const ctx = document.getElementById('statsChart').getContext('2d');
    
    if (charts.stats) {
        charts.stats.destroy();
    }
    
    charts.stats = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Hoàn thành', 'Đạt vòng quay', 'Đăng ký khóa học', 'Từ chối'],
            datasets: [{
                data: [
                    stats.completedQuiz || 0,
                    stats.passedQuiz || 0,
                    stats.registeredUsers || 0,
                    stats.declinedUsers || 0
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

// Load dashboard
function loadDashboard() {
    updateStatsDisplay();
    updateRecentActivity();
    updateStatsChart();
}

// Load user data
async function loadUserData() {
    showLoading('Đang tải dữ liệu người dùng...');
    
    try {
        // Try to get from Google Sheets first, fallback to localStorage
        userData = JSON.parse(localStorage.getItem('quizUsers') || '[]');
        
        displayUserData(userData);
        hideLoading();
    } catch (error) {
        console.error('Error loading user data:', error);
        hideLoading();
        showNotification('Lỗi khi tải dữ liệu người dùng', 'error');
    }
}

// Display user data in table
function displayUserData(users) {
    const tbody = document.getElementById('user-data-body');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">Chưa có dữ liệu</td></tr>';
        return;
    }
    
    let html = '';
    users.forEach(user => {
        const timestamp = new Date(user.timestamp).toLocaleString('vi-VN');
        const score = user.score !== undefined ? `${user.score}/5` : '-';
        const prize = user.prize || '-';
        
        let decision = '-';
        if (user.choice === 'register') decision = '✅ Đăng ký';
        else if (user.choice === 'decline') decision = '❌ Từ chối';
        
        let status = '⏳ Đang làm';
        if (user.score !== undefined) status = '✅ Hoàn thành';
        if (user.score >= 3) status = '🎯 Đạt vòng quay';
        if (user.choice) status = '🏁 Hoàn tất';
        
        html += `
            <tr>
                <td>${timestamp}</td>
                <td>${user.name || '-'}</td>
                <td>${user.phone || '-'}</td>
                <td>${getClassDisplayName(user.classType) || '-'}</td>
                <td>${score}</td>
                <td>${prize}</td>
                <td>${decision}</td>
                <td>${status}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Filter user data
function filterUserData() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const classFilter = document.getElementById('class-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    
    let filteredData = userData.filter(user => {
        // Search filter
        const matchesSearch = !searchTerm || 
            (user.name && user.name.toLowerCase().includes(searchTerm)) ||
            (user.phone && user.phone.includes(searchTerm));
        
        // Class filter
        const matchesClass = !classFilter || user.classType === classFilter;
        
        // Status filter
        let matchesStatus = true;
        if (statusFilter === 'completed') {
            matchesStatus = user.score !== undefined;
        } else if (statusFilter === 'passed') {
            matchesStatus = user.score >= 3;
        } else if (statusFilter === 'registered') {
            matchesStatus = user.choice === 'register';
        }
        
        return matchesSearch && matchesClass && matchesStatus;
    });
    
    displayUserData(filteredData);
}

// Load analytics
function loadAnalytics() {
    loadClassChart();
    loadTimeChart();
    loadScoreChart();
}

// Load class distribution chart
function loadClassChart() {
    const ctx = document.getElementById('classChart').getContext('2d');
    
    if (charts.class) {
        charts.class.destroy();
    }
    
    const classCounts = {};
    userData.forEach(user => {
        const className = getClassDisplayName(user.classType) || 'Khác';
        classCounts[className] = (classCounts[className] || 0) + 1;
    });
    
    charts.class = new Chart(ctx, {
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

// Load time distribution chart
function loadTimeChart() {
    const ctx = document.getElementById('timeChart').getContext('2d');
    
    if (charts.time) {
        charts.time.destroy();
    }
    
    const hourCounts = {};
    userData.forEach(user => {
        const hour = new Date(user.timestamp).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const hours = Array.from({length: 24}, (_, i) => i);
    const counts = hours.map(h => hourCounts[h] || 0);
    
    charts.time = new Chart(ctx, {
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

// Load score distribution chart
function loadScoreChart() {
    const ctx = document.getElementById('scoreChart').getContext('2d');
    
    if (charts.score) {
        charts.score.destroy();
    }
    
    const scoreCounts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    userData.forEach(user => {
        if (user.score !== undefined) {
            scoreCounts[user.score]++;
        }
    });
    
    charts.score = new Chart(ctx, {
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

// Export functions
function exportCSV() {
    const BOM = '\uFEFF';
    let csv = BOM + 'Thời gian,Tên,SĐT,Lớp học,Điểm,Quà,Quyết định\n';
    
    userData.forEach(user => {
        const row = [
            new Date(user.timestamp).toLocaleString('vi-VN'),
            user.name || '',
            user.phone || '',
            getClassDisplayName(user.classType) || '',
            user.score !== undefined ? `${user.score}/5` : '',
            user.prize || '',
            user.choice === 'register' ? 'Đăng ký' : user.choice === 'decline' ? 'Từ chối' : ''
        ].map(field => `"${field}"`).join(',');
        csv += row + '\n';
    });
    
    downloadFile(csv, 'quiz-data.csv', 'text/csv');
    showNotification('Đã xuất file CSV', 'success');
}

function exportJSON() {
    const data = JSON.stringify(userData, null, 2);
    downloadFile(data, 'quiz-data.json', 'application/json');
    showNotification('Đã xuất file JSON', 'success');
}

function exportPDF() {
    // This would require a PDF library like jsPDF
    showNotification('Tính năng xuất PDF đang phát triển', 'info');
}

function exportExcel() {
    // This would require a library like SheetJS
    showNotification('Tính năng xuất Excel đang phát triển', 'info');
}

// Download file helper
function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

// Settings functions
function loadSettings() {
    document.getElementById('current-url').textContent = CONFIG.GOOGLE_SCRIPT_URL;
    document.getElementById('last-update').textContent = new Date().toLocaleString('vi-VN');
    document.getElementById('data-source').textContent = isOnline ? 'Google Sheets + localStorage' : 'localStorage only';
}

function testConnection() {
    showLoading('Đang test kết nối đến Google Apps Script...');
    
    checkConnection().then(online => {
        hideLoading();
        
        if (online) {
            showNotification('✅ Kết nối Google Apps Script thành công!', 'success');
            
            // Additional test: try to get stats
            Database.getStats().then(result => {
                if (result.success) {
                    showNotification('✅ API hoạt động bình thường - Có thể lấy dữ liệu', 'success');
                }
            }).catch(error => {
                showNotification('⚠️ Kết nối OK nhưng có lỗi API: ' + error.message, 'warning');
            });
        } else {
            showNotification('❌ Không thể kết nối đến Google Apps Script', 'error');
            
            // Show troubleshooting tips
            setTimeout(() => {
                showNotification('💡 Kiểm tra: 1) URL script đúng, 2) Deploy "Anyone", 3) CORS headers', 'info');
            }, 2000);
        }
    });
}

function showSetupGuide() {
    window.open('docs/GOOGLE_SHEETS_SETUP.md', '_blank');
}

function clearLocalData() {
    if (confirm('⚠️ Bạn có chắc muốn xóa tất cả dữ liệu local? Hành động này không thể hoàn tác!')) {
        localStorage.clear();
        showNotification('Đã xóa dữ liệu local', 'success');
        refreshDashboard();
    }
}

function syncData() {
    showLoading('Đang đồng bộ dữ liệu với Google Sheets...');
    
    // Check if GoogleSheets integration is available
    if (typeof GoogleSheets !== 'undefined') {
        GoogleSheets.syncOfflineData().then(result => {
            hideLoading();
            if (result.synced > 0) {
                showNotification(`✅ Đã đồng bộ ${result.synced} bản ghi`, 'success');
                refreshDashboard(); // Refresh to show updated data
            } else {
                showNotification('ℹ️ Không có dữ liệu cần đồng bộ', 'info');
            }
        }).catch(error => {
            hideLoading();
            showNotification('❌ Lỗi đồng bộ: ' + error.message, 'error');
        });
    } else {
        hideLoading();
        
        // Fallback: manual sync attempt
        ConnectionStatus.check().then(online => {
            if (online) {
                showNotification('🔄 Kết nối đã được khôi phục - Dữ liệu mới sẽ tự động đồng bộ', 'success');
                refreshDashboard();
            } else {
                showNotification('❌ Không thể kết nối đến Google Sheets', 'error');
            }
        });
    }
}

function backupData() {
    const backup = {
        timestamp: new Date().toISOString(),
        data: JSON.parse(localStorage.getItem('quizUsers') || '[]'),
        stats: stats
    };
    
    downloadFile(JSON.stringify(backup, null, 2), `backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    showNotification('Đã tạo file backup', 'success');
}

// Utility functions
function showLoading(text) {
    document.getElementById('loading-text').textContent = text;
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function updateSystemInfo() {
    const info = {
        userAgent: navigator.userAgent,
        screen: `${screen.width}x${screen.height}`,
        language: navigator.language,
        online: navigator.onLine
    };
    
    console.log('🖥️ System Info:', info);
}

function getClassDisplayName(classType) {
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