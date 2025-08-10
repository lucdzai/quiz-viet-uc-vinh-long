class AdminPanel {
    constructor() {
        this.database = null;
        this.playersRef = null;
        this.playersList = new Map();
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
                        const data = snapshot.val() || {};
                        this.updatePlayersList(data);
                        this.renderPlayersTable();
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
        const seenIds = new Set();
        this.playersList.clear();
        
        // Sort by timestamp first
        const sortedEntries = Object.entries(data)
            .sort(([,a], [,b]) => {
                const timeA = new Date(a.startTime).getTime();
                const timeB = new Date(b.startTime).getTime();
                return timeA - timeB;
            });

        // Add only unique entries based on phone number
        sortedEntries.forEach(([id, player]) => {
            if (!seenIds.has(player.phone)) {
                seenIds.add(player.phone);
                this.playersList.set(id, {
                    id,
                    ...player
                });
            }
        });
    }

    renderPlayersTable() {
        const tbody = document.getElementById('playersTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        // Sort by STT
        const sortedPlayers = Array.from(this.playersList.values())
            .sort((a, b) => (Number(a.stt) || 0) - (Number(b.stt) || 0));

        sortedPlayers.forEach(player => {
            if (player && player.id && !tbody.querySelector(`[data-player-id="${player.id}"]`)) {
                const row = document.createElement('tr');
                row.dataset.playerId = player.id;
                
                // Format all fields
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

    // Format display values
    formatValue(value, type) {
        if (value === null || value === undefined) return '';
        
        switch (type) {
            case 'number':
                return Number(value) || 0;
                
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
            
            case 'text':
                return String(value || '');
            
            case 'score':
                return Number(value) || 0;
                
            case 'prize':
                return String(value || '');
                
            case 'decision':
                return value === true ? 'Đồng ý' : 
                       value === false ? 'Từ chối' : '';
                
            default:
                return String(value || '');
        }
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
