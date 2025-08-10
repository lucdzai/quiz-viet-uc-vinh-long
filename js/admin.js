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

    updatePlayersList(data) {
        // Clear existing data
        this.playersList.clear();
        
        // Process and store new data
        Object.entries(data).forEach(([id, playerData]) => {
            this.playersList.set(id, {
                ...playerData,
                formattedStartTime: this.formatTimestamp(playerData.startTime),
                formattedLastUpdate: this.formatTimestamp(playerData.lastUpdated)
            });
        });
    }

    renderPlayersTable() {
        const tbody = document.getElementById('playersTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        // Check if we have data
        if (this.playersList.size === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Chưa có dữ liệu người chơi</td></tr>';
            return;
        }

        // Sort players by STT
        const sortedPlayers = Array.from(this.playersList.values())
            .sort((a, b) => (a.stt || 0) - (b.stt || 0));

        sortedPlayers.forEach(player => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${player.stt || ''}</td>
                <td>${this.formatTimestamp(player.startTime)}</td>
                <td>${player.name || ''}</td>
                <td>${player.phone || ''}</td>
                <td>${player.course || ''}</td>
                <td>${player.score || 0}</td>
                <td>${player.prize || ''}</td>
                <td>${player.finalDecision || ''}</td>
            `;
            tbody.appendChild(row);
        });
    }

    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleString('vi-VN');
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
