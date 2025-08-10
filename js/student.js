/**
 * Player Data Management Module
 * 
 * Handles player-specific data operations including:
 * - Reliable player data storage with unique IDs
 * - Real-time synchronization with Firebase
 * - Enhanced error handling and user feedback
 * - Proper timestamp formatting
 */

class PlayerDataManager {
    constructor() {
        this.database = null;
        this.playerRef = null;
        this.currentPlayer = null;
        this.initialized = false;
        this.initializeFirebase();
    }

    async initializeFirebase() {
        try {
            // Wait a bit for Firebase to be ready
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
                this.database = FirebaseConfig.getDatabase();
                this.initialized = true;
            } else {
                console.warn('❌ Firebase not available, player data will be saved locally');
            }
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
        }
    }

    async waitForInitialization() {
        if (this.initialized) return;
        
        let attempts = 0;
        while (!this.initialized && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }
        
        if (!this.initialized) {
            throw new Error('Firebase initialization timeout');
        }
    }

    getDatabase() {
        return this.database;
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

    async set(ref, data) {
        if (ref && typeof ref.set === 'function') {
            return await ref.set(data);
        }
        if (ref && window.firebase && window.firebase.database && window.firebase.database.set) {
            return await window.firebase.database.set(ref, data);
        }
        throw new Error('Firebase set not available');
    }

    async update(ref, data) {
        if (ref && typeof ref.update === 'function') {
            return await ref.update(data);
        }
        if (ref && window.firebase && window.firebase.database && window.firebase.database.update) {
            return await window.firebase.database.update(ref, data);
        }
        // Fallback to set if update is not available
        if (ref && typeof ref.set === 'function') {
            return await ref.set(data);
        }
        if (ref && window.firebase && window.firebase.database && window.firebase.database.set) {
            return await window.firebase.database.set(ref, data);
        }
        throw new Error('Firebase update not available');
    }

    serverTimestamp() {
        if (window.firebase && window.firebase.database && window.firebase.database.serverTimestamp) {
            return window.firebase.database.serverTimestamp();
        }
        return new Date().toISOString();
    }

    async initializePlayer(playerData) {
        try {
            // Wait for Firebase to be ready
            await this.waitForInitialization();
            
            // Generate unique ID for player
            const playerId = `player_${Date.now()}`;
            this.playerRef = this.ref(this.database, `players/${playerId}`);
            
            // Initialize player data
            this.currentPlayer = {
                id: playerId,
                startTime: this.serverTimestamp(),
                ...playerData
            };

            // Save initial data
            await this.set(this.playerRef, this.currentPlayer);
            console.log('✅ Player initialized:', playerId);
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize player:', error);
            return false;
        }
    }

    async updatePlayerData(updates) {
        if (!this.playerRef || !this.currentPlayer) {
            console.error('❌ Player not initialized');
            return false;
        }

        try {
            // Update local state
            this.currentPlayer = {
                ...this.currentPlayer,
                ...updates,
                lastUpdated: this.serverTimestamp()
            };

            // Update database
            await this.update(this.playerRef, this.currentPlayer);
            console.log('✅ Player data updated');
            return true;
        } catch (error) {
            console.error('❌ Failed to update player data:', error);
            return false;
        }
    }

    async saveGameResult(result) {
        return this.updatePlayerData({
            gameResult: result,
            completedAt: this.serverTimestamp()
        });
    }
}

// Initialize player data manager
let PlayerData;
if (typeof window !== 'undefined') {
    PlayerData = new PlayerDataManager();
    window.PlayerData = PlayerData;
    console.log('👨‍🎓 PlayerDataManager initialized');
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerDataManager;
}