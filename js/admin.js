class AdminPanel {
    constructor() {
        this.database = null;
        this.playersRef = null;
        this.playersList = new Map();
        
        this.prizeNames = {
            'prize1': 'Học bổng 100%',
            'prize2': 'Học bổng 75%',
            'prize3': 'Học bổng 50%',
            'prize4': 'Học bổng 25%',
            'prize5': 'Quà tặng đặc biệt'
        };
        
        this.courseDisplayNames = {
            'tieu-hoc': '🧒 Khối Tiểu học (Starters - Movers - Flyers)',
            'thcs': '👨‍🎓 Khối THCS (Pre-KET - PET)',
            'thpt': '🎓 Luyện thi THPT',
            'tieng-trung': '🇨🇳 Tiếng Trung cơ bản',
            'tieng-trung-11': '🇨🇳 Tiếng Trung cơ bản 1-1',
            'tieng-anh-giao-tiep': '💬 Tiếng Anh giao tiếp',
            'tieng-anh-giao-tiep-11': '💬 Tiếng Anh giao tiếp 1-1',
            'chung-chi': '🏆 Luyện thi chứng chỉ (B1, B2, TOEIC, IELTS)'
        };
        
        this.initialize();
    }

    async initialize() {
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
                this.database = FirebaseConfig.getDatabase();
                
                if (this.database && window.firebase?.database?.ref && window.firebase?.database?.onValue) {
                    this.playersRef = window.firebase.database.ref(this.database, 'players');
                    
                    window.firebase.database.onValue(this.playersRef, (snapshot) => {
                        const data = snapshot.val();
                        console.log('📊 Dữ liệu:', data);
                        this.updatePlayersList(data);
                        this.renderPlayersTable();
                        this.updateStats();
                    }, (error) => {
                        console.error('❌ Lỗi:', error);
                        this.showError('Có lỗi khi tải dữ liệu. Vui lòng thử lại.');
                    });
                }
            }

            console.log('✅ Admin panel initialized');
        } catch (error) {
            console.error('❌ Admin panel initialization failed:', error);
            this.showError('Failed to initialize admin panel');
        }
    }

    updatePlayersList(data) {
        const seenPhones = new Set();
        this.playersList.clear();

        if (!data) return;

        const sortedEntries = Object.entries(data)
            .sort(([,a], [,b]) => {
                const timeA = new Date(a.startTime || 0).getTime();
                const timeB = new Date(b.startTime || 0).getTime();
                // Sort by most recent first so we keep latest record per phone
                return timeB - timeA;
            });

        sortedEntries.forEach(([id, player]) => {
            if (!player) return;
            
            const phone = String(player.phone || '').trim();
            if (!phone) return;

            // Because entries are sorted by newest first, keep first occurrence per phone
            if (seenPhones.has(phone)) return;
            seenPhones.add(phone);

            this.playersList.set(id, {
                id,
                stt: player.stt || this.getNextSequence(),
                startTime: this.formatTimestamp(player.startTime || player.lastUpdated),
                name: player.name || 'Chưa có tên',
                phone: phone || 'Chưa có SĐT',
                course: this.formatCourse(player.course),
                score: this.formatScore(player.score),
                prize: this.formatPrize(player.prize),
                finalDecision: this.formatDecision(player.finalDecision),
                rawData: player
            });
        });
    }

    getNextSequence() {
        return this.playersList.size + 1;
    }

    formatTimestamp(timestamp) {
        if (!timestamp) return 'Chưa có thời gian';
        try {
            let date;
            if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
                // Firebase timestamp
                date = new Date(timestamp.seconds * 1000);
            } else if (timestamp) {
                // ISO string or other format
                date = new Date(timestamp);
            } else {
                return 'Chưa có thời gian';
            }
            
            if (isNaN(date.getTime())) {
                return 'Lỗi định dạng';
            }
            
            return date.toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        } catch (error) {
            console.error('Lỗi định dạng thời gian:', error);
            return 'Lỗi định dạng';
        }
    }

    formatCourse(course) {
        if (!course) return 'Chưa chọn khóa học';
        return this.courseDisplayNames[course] || course;
    }

    formatScore(score) {
        if (score === null || score === undefined) return 'Chưa làm quiz';
        if (score === 0) return '0/5';
        return `${score}/5`;
    }

    formatPrize(prize) {
        if (!prize) return '⏳ Chưa quay';
        // Allow either plain string or object with name/icon
        if (typeof prize === 'object') {
            return prize.name || '⏳ Chưa quay';
        }
        return String(prize);
    }

    formatDecision(decision) {
        if (decision === true || decision === 'register') return '✅ Đăng ký nhận quà';
        if (decision === false || decision === 'decline') return '📞 Liên hệ lại sau';
        return '⏳ Chưa quyết định';
    }

    renderPlayersTable() {
        const tbody = document.getElementById('playersTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        const sortedPlayers = Array.from(this.playersList.values())
            .sort((a, b) => a.stt - b.stt);

        sortedPlayers.forEach(player => {
            const row = document.createElement('tr');
            row.dataset.playerId = player.id;
            
            // Add row classes for better styling
            if (player.rawData && player.rawData.score >= 3) {
                row.classList.add('passed-quiz');
            }
            if (player.rawData && player.rawData.finalDecision === true) {
                row.classList.add('registered');
            }
            
            row.innerHTML = `
                <td class="text-center stt-cell">${player.stt}</td>
                <td class="text-center time-cell">${player.startTime}</td>
                <td class="name-cell">${player.name}</td>
                <td class="phone-cell">${player.phone}</td>
                <td class="course-cell">${player.course}</td>
                <td class="text-center score-cell ${this.getScoreClass(player.rawData?.score)}">${player.score}</td>
                <td class="prize-cell">${player.prize}</td>
                <td class="text-center decision-cell ${this.getDecisionClass(player.rawData?.finalDecision)}">${player.finalDecision}</td>
                <td class="text-center">
                    <button class="btn-secondary" onclick="window.adminPanel.confirmDeletePlayer('${player.id}','${player.name}','${player.phone}')">🗑️ Xóa</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        this.updateTotalPlayers(sortedPlayers.length);
    }

    async deletePlayer(playerId) {
        try {
            if (!playerId || !this.database || !window.firebase?.database?.ref) return;
            const ref = window.firebase.database.ref(this.database, `players/${playerId}`);
            await window.firebase.database.set(ref, null);
            this.showNotification('🗑️ Đã xóa người chơi', 'success');
        } catch (error) {
            console.error('❌ Lỗi xóa người chơi:', error);
            this.showError('Không thể xóa người chơi');
        }
    }

    confirmDeletePlayer(playerId, name, phone) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-icon">❓</div>
                    <h3>Xác nhận xóa</h3>
                </div>
                <div class="modal-body">
                    <p>Bạn có chắc muốn xóa người chơi này?</p>
                    <p><strong>${name || 'Không tên'}</strong> - ${phone || ''}</p>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn modal-btn-secondary" id="cancelDel">Hủy</button>
                    <button class="modal-btn modal-btn-primary" id="okDel">Xóa</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        modal.querySelector('#cancelDel').onclick = () => modal.remove();
        modal.querySelector('#okDel').onclick = async () => {
            await this.deletePlayer(playerId);
            modal.remove();
        };
    }

    openDeleteRangeModal() {
        const modal = document.getElementById('deleteRangeModal');
        if (modal) modal.classList.add('show');
    }

    closeDeleteRangeModal() {
        const modal = document.getElementById('deleteRangeModal');
        if (modal) modal.classList.remove('show');
    }

    async confirmDeleteRange() {
        try {
            const startEl = document.getElementById('deleteStart');
            const endEl = document.getElementById('deleteEnd');
            const start = startEl?.value ? new Date(startEl.value).getTime() : null;
            const end = endEl?.value ? new Date(endEl.value).getTime() : null;

            if (!start && !end) {
                this.showError('Vui lòng chọn ít nhất một mốc thời gian');
                return;
            }

            if (!this.database || !window.firebase?.database?.ref || !window.firebase?.database?.get) return;
            const playersRef = window.firebase.database.ref(this.database, 'players');
            const snapshot = await window.firebase.database.get(playersRef);
            if (!snapshot.exists()) {
                this.closeDeleteRangeModal();
                return;
            }
            const players = snapshot.val();
            const deletions = [];

            for (const [id, player] of Object.entries(players)) {
                const ts = new Date(player.startTime || player.lastUpdated || 0).getTime();
                if ((start === null || ts >= start) && (end === null || ts <= end)) {
                    const ref = window.firebase.database.ref(this.database, `players/${id}`);
                    deletions.push(window.firebase.database.set(ref, null));
                }
            }

            await Promise.all(deletions);
            this.closeDeleteRangeModal();
            this.showNotification(`🗑️ Đã xóa ${deletions.length} người trong khoảng thời gian đã chọn`, 'success');
        } catch (error) {
            console.error('❌ Lỗi xóa theo thời gian:', error);
            this.showError('Không thể xóa theo thời gian đã chọn');
        }
    }

    getScoreClass(score) {
        if (score === null || score === undefined) return 'no-score';
        if (score >= 3) return 'passed';
        if (score > 0) return 'partial';
        return 'failed';
    }

    getDecisionClass(decision) {
        if (decision === true) return 'registered';
        if (decision === false) return 'declined';
        return 'pending';
    }

    updateTotalPlayers(total) {
        const totalPlayers = document.getElementById('totalPlayers');
        if (totalPlayers) {
            totalPlayers.textContent = total;
        }
    }

    updateStats() {
        const players = Array.from(this.playersList.values());
        
        // Calculate statistics
        const totalParticipants = players.length;
        const completedQuiz = players.filter(p => p.rawData && p.rawData.score !== null && p.rawData.score !== undefined).length;
        const passedQuiz = players.filter(p => p.rawData && p.rawData.score >= 3).length;
        const registeredUsers = players.filter(p => p.rawData && p.rawData.finalDecision === true).length;
        const declinedUsers = players.filter(p => p.rawData && p.rawData.finalDecision === false).length;
        
        // Update stats display if elements exist
        this.updateStatElement('total-participants', totalParticipants);
        this.updateStatElement('completed-quiz', completedQuiz);
        this.updateStatElement('passed-quiz', passedQuiz);
        this.updateStatElement('registered-users', registeredUsers);
        this.updateStatElement('declined-users', declinedUsers);
        
        // Calculate percentages
        const passRate = completedQuiz > 0 ? Math.round((passedQuiz / completedQuiz) * 100) : 0;
        const conversionRate = totalParticipants > 0 ? Math.round((registeredUsers / totalParticipants) * 100) : 0;
        
        this.updateStatElement('pass-rate', `${passRate}%`);
        this.updateStatElement('conversion-rate', `${conversionRate}%`);
    }

    updateStatElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('adminError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        
        // Also show as notification
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `admin-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Expose range deletion helpers to global for modal buttons
    bindGlobalHelpers() {
        window.openDeleteRangeModal = () => this.openDeleteRangeModal();
        window.closeDeleteRangeModal = () => this.closeDeleteRangeModal();
        window.confirmDeleteRange = () => this.confirmDeleteRange();
    }

    // Export data to CSV
    exportToCSV() {
        const players = Array.from(this.playersList.values());
        if (players.length === 0) {
            this.showNotification('Không có dữ liệu để xuất!', 'warning');
            return;
        }

        // CSV header with BOM for UTF-8
        const BOM = '\uFEFF';
        let csv = BOM + 'STT,Thời gian,Họ tên,Số điện thoại,Khóa học,Điểm số,Phần quà,Quyết định cuối cùng\n';
        
        players.forEach(player => {
            const row = [
                player.stt,
                `"${player.startTime}"`,
                `"${player.name}"`,
                `"${player.phone}"`,
                `"${player.course}"`,
                player.score,
                `"${player.prize}"`,
                `"${player.finalDecision}"`
            ];
            csv += row.join(',') + '\n';
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `quiz-results-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        this.showNotification('📤 Đã xuất dữ liệu thành công!', 'success');
    }

    // Refresh data
    refreshData() {
        if (this.playersRef && window.firebase?.database?.get) {
            window.firebase.database.get(this.playersRef).then((snapshot) => {
                const data = snapshot.val();
                this.updatePlayersList(data);
                this.renderPlayersTable();
                this.updateStats();
                this.showNotification('🔄 Đã làm mới dữ liệu!', 'success');
            }).catch((error) => {
                console.error('❌ Lỗi làm mới dữ liệu:', error);
                this.showError('Không thể làm mới dữ liệu');
            });
        }
    }
}

// Initialize Admin Panel
document.addEventListener('DOMContentLoaded', () => {
    const adminPanel = new AdminPanel();
    window.adminPanel = adminPanel;
    
    // Add global functions for buttons
    window.exportData = () => adminPanel.exportToCSV();
    window.refreshData = () => adminPanel.refreshData();
    adminPanel.bindGlobalHelpers();
});
