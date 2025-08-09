/**
 * Firebase SDK Mock for Local Development
 * This provides a basic Firebase-like interface for testing when CDN is blocked
 * Updated to support Firebase v10 modular syntax
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

// Global mock database instance
let mockDatabaseInstance = null;

// Mock Firebase v10 modular functions
function mockInitializeApp(config) {
    console.log('🔥 Mock Firebase v10 initialized with config:', config);
    mockDatabaseInstance = new MockDatabase();
    return {
        name: '[DEFAULT]',
        options: config
    };
}

function mockGetDatabase(app) {
    console.log('🔥 Mock getDatabase called');
    if (!mockDatabaseInstance) {
        mockDatabaseInstance = new MockDatabase();
    }
    return mockDatabaseInstance;
}

function mockRef(database, path) {
    console.log(`🔥 Mock ref called with path: ${path}`);
    return new MockDatabaseRef(database, path);
}

function mockSet(ref, value) {
    console.log(`🔥 Mock set called on ${ref.path}:`, value);
    ref.mockData = value;
    return Promise.resolve();
}

function mockGet(ref) {
    console.log(`🔥 Mock get called on ${ref.path}`);
    
    // Special handling for connection info
    if (ref.path === '.info/connected') {
        return Promise.resolve({
            val: () => true,
            exists: () => true
        });
    }
    
    if (ref.path === '.info/serverTimeOffset') {
        return Promise.resolve({
            val: () => 0,
            exists: () => true
        });
    }
    
    return Promise.resolve({
        val: () => ref.mockData || {},
        exists: () => Object.keys(ref.mockData || {}).length > 0
    });
}

function mockPush(ref) {
    const key = 'mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    console.log(`🔥 Mock push to ${ref.path}, generated key:`, key);
    return {
        key: key,
        ref: new MockDatabaseRef(ref.database, `${ref.path}/${key}`)
    };
}

function mockOnValue(ref, callback, errorCallback) {
    console.log(`🔥 Mock onValue listener on ${ref.path}`);
    
    // Simulate connection status for .info/connected
    if (ref.path === '.info/connected') {
        setTimeout(() => {
            callback({ val: () => true });
        }, 100);
    } else {
        // Simulate data for other paths
        setTimeout(() => {
            callback({ 
                val: () => ref.mockData || {},
                exists: () => Object.keys(ref.mockData || {}).length > 0
            });
        }, 100);
    }
    
    // Return unsubscribe function
    return () => {
        console.log(`🔥 Mock unsubscribe listener on ${ref.path}`);
    };
}

function mockIncrement(value) {
    console.log(`🔥 Mock increment called with value: ${value}`);
    return { '.sv': 'increment', value: value };
}

function mockServerTimestamp() {
    console.log('🔥 Mock serverTimestamp called');
    return { '.sv': 'timestamp' };
}

// Mock Firebase SDK with v10 modular syntax support
window.firebase = {
    // v10 modular functions
    initializeApp: mockInitializeApp,
    database: {
        getDatabase: mockGetDatabase,
        ref: mockRef,
        set: mockSet,
        get: mockGet,
        push: mockPush,
        onValue: mockOnValue,
        serverTimestamp: mockServerTimestamp,
        increment: mockIncrement
    },
    
    // Legacy v8 support for backward compatibility
    apps: [],
    
    app: function() {
        return {
            database: () => mockDatabaseInstance || new MockDatabase()
        };
    }
};

// Mock ServerValue for Firebase v8 compatibility
window.firebase.database.ServerValue = {
    increment: mockIncrement,
    TIMESTAMP: mockServerTimestamp()
};

console.log('🔥 Mock Firebase SDK v10 loaded successfully');