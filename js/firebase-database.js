/**
 * Firebase Database Helper Module
 * 
 * This module provides additional database helper functions
 * that extend the core firebase-config.js functionality.
 */

/**
 * Enhanced database operations with better error handling
 */
class FirebaseDatabase {
    constructor() {
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    /**
     * Get database reference with error handling
     */
    getDatabase() {
        if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
            try {
                return FirebaseConfig.getDatabase();
            } catch (error) {
                console.error('❌ Failed to get database:', error);
                return null;
            }
        }
        return null;
    }

    /**
     * Safe database write with retry logic
     */
    async safeWrite(path, data, attempt = 1) {
        try {
            const db = this.getDatabase();
            if (!db) {
                throw new Error('Database not available');
            }

            const ref = window.firebase.ref(db, path);
            await window.firebase.set(ref, {
                ...data,
                updatedAt: window.firebase.serverTimestamp()
            });

            console.log(`✅ Safe write successful for ${path}`);
            return { success: true, attempt };

        } catch (error) {
            console.warn(`❌ Safe write attempt ${attempt} failed for ${path}:`, error.message);
            
            if (attempt < this.retryAttempts) {
                console.log(`🔄 Retrying safe write in ${this.retryDelay * attempt}ms...`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
                return this.safeWrite(path, data, attempt + 1);
            }
            
            throw error;
        }
    }

    /**
     * Safe database read with error handling
     */
    async safeRead(path) {
        try {
            const db = this.getDatabase();
            if (!db) {
                throw new Error('Database not available');
            }

            const ref = window.firebase.ref(db, path);
            const snapshot = await window.firebase.get(ref);
            
            return {
                success: true,
                exists: snapshot.exists(),
                data: snapshot.exists() ? snapshot.val() : null
            };

        } catch (error) {
            console.error(`❌ Safe read failed for ${path}:`, error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Batch update multiple paths
     */
    async batchUpdate(updates) {
        try {
            const db = this.getDatabase();
            if (!db) {
                throw new Error('Database not available');
            }

            const batch = {};
            for (const [path, data] of Object.entries(updates)) {
                batch[path] = data;
            }

            // Add batch timestamp
            batch['.timestamp'] = window.firebase.serverTimestamp();

            const ref = window.firebase.ref(db);
            await window.firebase.update(ref, batch);

            console.log('✅ Batch update successful');
            return { success: true };

        } catch (error) {
            console.error('❌ Batch update failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Listen to data changes with error recovery
     */
    listenToChanges(path, onData, onError) {
        try {
            const db = this.getDatabase();
            if (!db) {
                if (onError) onError(new Error('Database not available'));
                return null;
            }

            const ref = window.firebase.ref(db, path);
            
            const unsubscribe = window.firebase.onValue(ref, 
                (snapshot) => {
                    try {
                        const data = snapshot.exists() ? snapshot.val() : null;
                        if (onData) onData(data, snapshot.key);
                    } catch (error) {
                        console.error(`❌ Error processing data for ${path}:`, error);
                        if (onError) onError(error);
                    }
                },
                (error) => {
                    console.error(`❌ Listener error for ${path}:`, error);
                    if (onError) onError(error);
                }
            );

            console.log(`👂 Listening to changes for ${path}`);
            return unsubscribe;

        } catch (error) {
            console.error(`❌ Failed to setup listener for ${path}:`, error);
            if (onError) onError(error);
            return null;
        }
    }

    /**
     * Remove data at path
     */
    async remove(path) {
        try {
            const db = this.getDatabase();
            if (!db) {
                throw new Error('Database not available');
            }

            const ref = window.firebase.ref(db, path);
            await window.firebase.set(ref, null);

            console.log(`🗑️ Successfully removed data at ${path}`);
            return { success: true };

        } catch (error) {
            console.error(`❌ Failed to remove data at ${path}:`, error);
            return { success: false, error: error.message };
        }
    }
}

// Create and export instance
const firebaseDatabase = new FirebaseDatabase();

// Export to global scope for backward compatibility
window.FirebaseDatabase = firebaseDatabase;

// Also export as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseDatabase;
}