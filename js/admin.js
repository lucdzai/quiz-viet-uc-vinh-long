class AdminPanel {
    constructor() {
        this.database = null;
        this.playersRef = null;
        this.playersList = new Map();
        
        // Prize name mapping
        this.prizeNames = {
            'prize1': 'Học bổng 100%',
            'prize2': 'Học bổng 50%',
            'prize3': 'Học bổng 25%',
            'prize4': 'Quà tặng',
            'none': 'Không trúng thưởng'
        };

        this.initialize();
    }

    async initialize() {
        try {
            // Wait a bit for Firebase to be ready
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Initialize Firebase
            if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
                this.database = FirebaseConfig.getDatabase();
                
                if (this.database) {
                    this.playersRef = this.ref(this.database, 'players');
                    
                    // Listen for real-time updates
                    this.onValue(this.playersRef, (snapshot) => {
                        const data = snapshot.val();
                        if (data) {
                            this.updatePlayersList(data);
                            this.renderPlayersTable();
                        } else {
                            this.renderPlayersTable(); // This will show empty message
                        }
                    });
                }
            }

            console.log('✅ Admin panel initialized');
        } catch (error) {
            console.error('❌ Admin panel initialization failed:', error);
            this.showError('Failed to initialize admin panel');
        }
    }

    // Format display values
    formatValue(value, type) {
        if (value === null || value === undefined) return '';
        
        switch (type) {
            case 'timestamp':
                try {
                    const date = value instanceof Date ? value : new Date(value);
                    return date.toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                } catch {
                    return '';
                }
            
            case 'prize':
                return this.prizeNames[value] || value;
            
            case 'score':
                return Number(value).toString() || '0';
                
            case 'decision':
                return value === true ? 'Đồng ý' : 
                       value === false ? 'Từ chối' : '';
                
            default:
                return String(value || '');
        }
    }

    // Update players list without duplicates
    updatePlayersList(data) {
        this.playersList.clear();
        Object.entries(data).forEach(([id, player]) => {
            if (!this.playersList.has(id)) {
                this.playersList.set(id, {
                    id,
                    ...player
                });
            }
        });
    }

    ref(database, path) {
        if (database && window.firebase && window.firebase.database && window.firebase.database.ref) {
            return window.firebase.database.ref(database, path);
        }
        // If using the mock, database might be the ref function itself
        if (database && typeof database.ref === 'function') {
            return database.ref(path);
        }
        return null;
    }

    onValue(ref, callback) {
        if (ref && typeof ref.onValue === 'function') {
            return ref.onValue(callback);
        }
        if (ref && window.firebase && window.firebase.database && window.firebase.database.onValue) {
            return window.firebase.database.onValue(ref, callback);
        }
    }

    // Render table with formatted values
    renderPlayersTable() {
        const tbody = document.getElementById('playersTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        // Check if we have data
        if (this.playersList.size === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Chưa có dữ liệu người chơi</td></tr>';
            return;
        }

        const sortedPlayers = Array.from(this.playersList.values())
            .sort((a, b) => (Number(a.stt) || 0) - (Number(b.stt) || 0));

        sortedPlayers.forEach(player => {
            if (!tbody.querySelector(`[data-player-id="${player.id}"]`)) {
                const row = document.createElement('tr');
                row.dataset.playerId = player.id;
                row.innerHTML = `
                    <td>${this.formatValue(player.stt, 'number')}</td>
                    <td>${this.formatValue(player.startTime, 'timestamp')}</td>
                    <td>${this.formatValue(player.name, 'text')}</td>
                    <td>${this.formatValue(player.phone, 'text')}</td>
                    <td>${this.formatValue(player.course, 'text')}</td>
                    <td>${this.formatValue(player.score, 'score')}</td>
                    <td>${this.formatValue(player.prize, 'prize')}</td>
                    <td>${this.formatValue(player.finalDecision, 'decision')}</td>
                `;
                tbody.appendChild(row);
            }
        });
    }

    showError(message) {
        const errorDiv = document.getElementById('adminError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    new AdminPanel();
});
