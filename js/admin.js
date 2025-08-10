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
                    }, (error) => {
                        console.error('❌ Lỗi:', error);
                        alert('Có lỗi khi tải dữ liệu. Vui lòng thử lại.');
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
                return timeA - timeB;
            });

        sortedEntries.forEach(([id, player]) => {
            if (!player) return;
            
            const phone = String(player.phone || '').trim();
            if (!seenPhones.has(phone)) {
                seenPhones.add(phone);
                
                this.playersList.set(id, {
                    id,
                    stt: player.stt || 0,
                    startTime: this.formatTimestamp(player.startTime),
                    name: player.name || 'Chưa có tên',
                    phone: phone || 'Chưa có SĐT',
                    course: player.course || 'Chưa chọn khóa học',
                    score: Number(player.score || 0),
                    prize: this.formatPrize(player.prize),
                    finalDecision: this.formatDecision(player.finalDecision)
                });
            }
        });
    }

    formatTimestamp(timestamp) {
        if (!timestamp) return 'Chưa có thời gian';
        try {
            const date = typeof timestamp === 'object' ? 
                new Date(timestamp.seconds * 1000) : 
                new Date(timestamp);
            
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

    formatPrize(prize) {
        if (!prize) return 'Chưa quay thưởng';
        return this.prizeNames[prize] || prize;
    }

    formatDecision(decision) {
        if (decision === true) return 'Đồng ý';
        if (decision === false) return 'Từ chối';
        return 'Chưa quyết định';
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
            
            row.innerHTML = `
                <td class="text-center">${player.stt}</td>
                <td class="text-center">${player.startTime}</td>
                <td>${player.name}</td>
                <td>${player.phone}</td>
                <td>${player.course}</td>
                <td class="text-center">${player.score}</td>
                <td>${player.prize}</td>
                <td class="text-center">${player.finalDecision}</td>
            `;
            tbody.appendChild(row);
        });

        const totalPlayers = document.getElementById('totalPlayers');
        if (totalPlayers) {
            totalPlayers.textContent = sortedPlayers.length;
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('adminError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }
}

// Initialize Admin Panel
document.addEventListener('DOMContentLoaded', () => {
    const adminPanel = new AdminPanel();
    window.adminPanel = adminPanel;
});
