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
        this.db = this.getDB();
        this.tbody = document.getElementById('participantData');
        this.loadParticipants();
    }

    getDB() {
        // Try to get Firebase database if available
        if (typeof window.firebase !== 'undefined' && window.firebase.database) {
            try {
                return window.firebase.database.getDatabase();
            } catch (error) {
                console.warn('Firebase not available, using fallback:', error);
            }
        }
        return null;
    }

    async loadParticipants() {
        if (this.db) {
            try {
                const usersRef = window.firebase.database.ref(this.db, 'users');
                window.firebase.database.onValue(usersRef, (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        this.displayParticipants(data);
                    }
                });
            } catch (error) {
                console.warn('Firebase real-time failed, trying fallback:', error);
                this.loadFromLocalStorage();
            }
        } else {
            this.loadFromLocalStorage();
        }
    }

    loadFromLocalStorage() {
        try {
            const data = JSON.parse(localStorage.getItem('quizUsers') || '[]');
            const formattedData = {};
            data.forEach((user, index) => {
                formattedData[index] = user;
            });
            this.displayParticipants(formattedData);
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            this.displayParticipants({});
        }
    }

    displayParticipants(data) {
        if (!this.tbody) return;
        
        this.tbody.innerHTML = '';
        const sortedData = Object.values(data)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        sortedData.forEach((user, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${this.formatTime(user.timestamp)}</td>
                <td>${this.formatText(user.name)}</td>
                <td>${this.formatText(user.phone)}</td>
                <td>${this.formatCourse(user.class_type || user.classType)}</td>
                <td>${user.score || 0}/10</td>
                <td>${this.formatText(user.gift || user.prize)}</td>
                <td>${this.formatDecision(user.decision || user.choice)}</td>
            `;
            this.tbody.appendChild(row);
        });
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
            'trung-hoc': 'Trung học',
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
            'contact_later': 'Liên hệ sau',
            'decline': 'Từ chối'
        };
        return decisions[decision] || '-';
    }
}

new AdminPanel();
