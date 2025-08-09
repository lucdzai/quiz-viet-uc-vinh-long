/**
 * Firebase SDK Mock for Local Development
 * This provides a basic Firebase-like interface for testing when CDN is blocked
 */

// Mock Database class
class MockDatabase {
    constructor() {
        this.data = {};
        this.listeners = new Map();
        console.log('🔥 Mock Firebase Database created');
    }
    
    ref(path = '') {
        return new MockDatabaseRef(this, path);
    }
}

// Mock Database Reference
class MockDatabaseRef {
    constructor(database, path) {
        this.database = database;
        this.path = path;
        this.mockData = {};
    }
    
    set(value) {
        console.log(`🔥 Mock set ${this.path}:`, value);
        this.mockData = value;
        
        // Simulate successful save
        return Promise.resolve({
            ref: this,
            key: this.path,
            val: () => value
        });
    }
    
    update(updates) {
        console.log(`🔥 Mock update ${this.path}:`, updates);
        this.mockData = { ...this.mockData, ...updates };
        return Promise.resolve();
    }
    
    push() {
        const key = 'mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        console.log(`🔥 Mock push to ${this.path}, generated key:`, key);
        return {
            key: key,
            set: (value) => {
                console.log(`🔥 Mock push set ${this.path}/${key}:`, value);
                return Promise.resolve();
            }
        };
    }
    
    once(eventType) {
        console.log(`🔥 Mock once ${eventType} on ${this.path}`);
        
        // Special handling for connection info
        if (this.path === '.info/connected') {
            return Promise.resolve({
                val: () => true,
                exists: () => true
            });
        }
        
        if (this.path === '.info/serverTimeOffset') {
            return Promise.resolve({
                val: () => 0,
                exists: () => true
            });
        }
        
        // Return mock data or empty object
        return Promise.resolve({
            val: () => this.mockData || {},
            exists: () => Object.keys(this.mockData || {}).length > 0
        });
    }
    
    on(eventType, callback) {
        console.log(`🔥 Mock listener ${eventType} on ${this.path}`);
        
        // Store listener for cleanup
        const listenerId = Date.now() + Math.random();
        this.database.listeners.set(listenerId, { path: this.path, callback, eventType });
        
        // Simulate connection status for .info/connected
        if (this.path === '.info/connected') {
            setTimeout(() => {
                callback({ val: () => true });
            }, 100);
        } else {
            // Simulate data for other paths
            setTimeout(() => {
                callback({ 
                    val: () => this.mockData || {},
                    exists: () => Object.keys(this.mockData || {}).length > 0
                });
            }, 100);
        }
        
        return listenerId;
    }
    
    off(eventType, callback) {
        console.log(`🔥 Mock remove listener ${eventType} on ${this.path}`);
        // In a real implementation, we'd remove the specific listener
    }
}

// Mock Firebase SDK
window.firebase = {
    apps: [],
    
    initializeApp: function(config) {
        console.log('🔥 Mock Firebase initialized with config:', config);
        this.apps.push({ config });
        return {
            database: () => new MockDatabase()
        };
    },
    
    app: function() {
        return {
            database: () => new MockDatabase()
        };
    },
    
    database: function() {
        return new MockDatabase();
    }
};

// Mock ServerValue for Firebase
firebase.database.ServerValue = {
    increment: function(value) {
        return { '.sv': 'increment', value: value };
    },
    TIMESTAMP: { '.sv': 'timestamp' }
};

console.log('🔥 Mock Firebase SDK loaded successfully');