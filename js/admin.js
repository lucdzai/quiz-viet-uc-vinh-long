/**
 * Simplified AdminPanel Class for Quiz Viet Uc Vinh Long
 * 
 * Provides essential admin functionality with:
 * - Real-time data loading and display
 * - Manual refresh functionality
 * - Participant data table
 * - Firebase integration with localStorage fallback
 */
class AdminPanel {
    constructor() {
        this.tbody = document.getElementById('participantData');
        this.refreshButton = document.getElementById('refreshButton');
        
        // Set up refresh button
        this.refreshButton.addEventListener('click', () => this.refreshData());
        
        // Initial load
        this.loadParticipants();
    }

    async refreshData() {
        this.refreshButton.classList.add('loading');
        this.refreshButton.disabled = true;
        await this.loadParticipants();
        this.refreshButton.classList.remove('loading');
        this.refreshButton.disabled = false;
    }

    async loadParticipants() {
        try {
            console.log('🔄 Loading participant data...');
            const result = await Database.getAllUserData();
            
            if (result.success && result.data) {
                this.displayParticipants(result.data);
                console.log(`✅ Loaded ${result.data.length} participants from ${result.source}`);
            } else {
                this.tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Không có dữ liệu</td></tr>';
                console.warn('Failed to load participant data');
            }
        } catch (error) {
            console.error('Error loading participants:', error);
            this.tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Lỗi khi tải dữ liệu</td></tr>';
        }
    }

    displayParticipants(data) {
        this.tbody.innerHTML = '';
        
        if (!data || data.length === 0) {
            this.tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Không có dữ liệu</td></tr>';
            return;
        }

        const sortedData = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        sortedData.forEach((user, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${this.formatTime(user.timestamp)}</td>
                <td>${this.formatText(user.name)}</td>
                <td>${this.formatText(user.phone)}</td>
                <td>${this.formatCourse(user.classType || user.class_type)}</td>
                <td>${user.score || 0}/10</td>
                <td>${this.formatText(user.gift || user.prize)}</td>
                <td>${this.formatDecision(user.decision || user.choice)}</td>
            `;
            this.tbody.appendChild(row);
        });
    }

    formatTime(timestamp) {
        if (!timestamp) return '-';
        try {
            return new Intl.DateTimeFormat('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).format(new Date(timestamp));
        } catch (error) {
            return '-';
        }
    }

    formatText(text) {
        return text || '-';
    }

    formatCourse(type) {
        const courses = {
            'tieu-hoc': 'Tiểu học',
            'trung-hoc': 'Trung học',
            'thcs': 'THCS',
            'thpt': 'THPT',
            'tieng-trung': 'Tiếng Trung',
            'tieng-anh-giao-tiep': 'Tiếng Anh giao tiếp',
            'chung-chi': 'Chứng chỉ'
        };
        return courses[type] || type || '-';
    }

    formatDecision(decision) {
        const decisions = {
            'register': 'Đăng ký',
            'contact_later': 'Liên hệ sau',
            'decline': 'Từ chối'
        };
        return decisions[decision] || '-';
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new AdminPanel();
});
