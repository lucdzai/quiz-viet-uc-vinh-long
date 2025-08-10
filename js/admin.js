class AdminPanel {
    constructor() {
        this.initializeAdmin();
    }

    async initializeAdmin() {
        try {
            await FirebaseConfig.initializeFirebase();
            this.db = FirebaseConfig.getDatabase();
            this.setupEventListeners();
            this.initRealtimeSync();
        } catch (error) {
            console.error('Admin initialization failed:', error);
            this.handleInitError();
        }
    }

    setupEventListeners() {
        this.tbody = document.getElementById('participantData');
        this.refreshButton = document.getElementById('refreshButton');
        this.exportButton = document.getElementById('exportButton');
        this.searchInput = document.getElementById('searchInput');
        
        this.allData = [];
        this.filteredData = [];
        
        // Event listeners
        this.refreshButton.addEventListener('click', () => this.refreshData());
        this.exportButton.addEventListener('click', () => this.exportToExcel());
        this.searchInput.addEventListener('input', () => this.handleSearch());
    }

    handleInitError() {
        console.warn('Database not available, falling back to manual refresh');
        this.setupEventListeners();
        this.loadParticipants();
    }

    initRealtimeSync() {
        if (!this.db) {
            console.error('Database not available');
            return;
        }

        const usersRef = window.firebase.database.ref(this.db, 'users');
        window.firebase.database.onValue(usersRef, 
            (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    this.updateDisplay(data);
                }
            },
            (error) => {
                console.error('Database sync error:', error);
            }
        );
    }

    updateDisplay(data) {
        this.allData = Object.values(data)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        this.handleSearch();
    }

    async refreshData() {
        this.refreshButton.classList.add('loading');
        await this.loadParticipants();
        this.refreshButton.classList.remove('loading');
    }

    async loadParticipants() {
        try {
            // Use the Database helper from config.js
            const result = await Database.getAllUserData();
            
            if (result.success && result.data) {
                this.allData = result.data
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                this.handleSearch();
            } else {
                this.allData = [];
                this.showNoData();
            }
        } catch (error) {
            console.error('Error loading participants:', error);
            this.allData = [];
            this.showNoData();
        }
    }

    handleSearch() {
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        this.filteredData = this.allData.filter(user => 
            user.name?.toLowerCase().includes(searchTerm) ||
            user.phone?.toLowerCase().includes(searchTerm)
        );
        this.displayParticipants(this.filteredData);
    }

    showNoData() {
        this.tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Không có dữ liệu</td></tr>';
    }

    formatGift(gift) {
        if (!gift) return '-';
        // If gift is an object, return the name property
        if (typeof gift === 'object') {
            return gift.name || '-';
        }
        // If gift is a string, return it directly
        return gift;
    }

    displayParticipants(data) {
        this.tbody.innerHTML = '';
        if (!data.length) {
            this.showNoData();
            return;
        }

        data.forEach((user, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${this.formatTime(user.timestamp)}</td>
                <td>${this.formatText(user.name)}</td>
                <td>${this.formatText(user.phone)}</td>
                <td>${this.formatCourse(user.class_type || user.classType)}</td>
                <td>${user.score || 0}/10</td>
                <td>${this.formatGift(user.gift || user.prize)}</td>
                <td>${this.formatDecision(user.decision || user.choice)}</td>
            `;
            this.tbody.appendChild(row);
        });
    }

    exportToExcel() {
        if (typeof XLSX === 'undefined') {
            // Fallback to CSV export if XLSX library is not loaded
            console.warn('XLSX library not available, falling back to CSV export');
            this.exportToCSV();
            return;
        }

        const data = this.filteredData.map((user, index) => ({
            'STT': index + 1,
            'Thời gian': this.formatTime(user.timestamp),
            'Họ và tên': user.name || '',
            'Số điện thoại': user.phone || '',
            'Khóa học': this.formatCourse(user.class_type || user.classType),
            'Điểm số': `${user.score || 0}/10`,
            'Phần quà': this.formatGift(user.gift || user.prize),
            'Quyết định': this.formatDecision(user.decision || user.choice)
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Người tham gia');
        XLSX.writeFile(wb, `Quiz_data_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    exportToCSV() {
        const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
        let csv = BOM + 'STT,Thời gian,Họ và tên,Số điện thoại,Khóa học,Điểm số,Phần quà,Quyết định\n';
        
        this.filteredData.forEach((user, index) => {
            const row = [
                index + 1,
                this.formatTime(user.timestamp),
                user.name || '',
                user.phone || '',
                this.formatCourse(user.class_type || user.classType),
                `${user.score || 0}/10`,
                this.formatGift(user.gift || user.prize),
                this.formatDecision(user.decision || user.choice)
            ].map(field => `"${field}"`).join(',');
            csv += row + '\n';
        });
        
        this.downloadFile(csv, `Quiz_data_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    formatTime(timestamp) {
        if (!timestamp) return '-';
        return new Intl.DateTimeFormat('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(new Date(timestamp));
    }

    formatText(text) {
        return text || '-';
    }

    formatCourse(type) {
        const courses = {
            'tieu-hoc': 'Tiểu học',
            'thcs': 'THCS',
            'thpt': 'THPT',
            'tieng-trung': 'Tiếng Trung',
            'tieng-anh-giao-tiep': 'Tiếng Anh giao tiếp',
            'chung-chi': 'Chứng chỉ'
        };
        return courses[type] || '-';
    }

    formatDecision(decision) {
        const decisions = {
            'register': 'Đăng ký',
            'decline': 'Từ chối'
        };
        return decisions[decision] || '-';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    new AdminPanel();
});
