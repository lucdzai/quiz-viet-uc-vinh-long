/**
 * Firebase SDK Mock for Local Development
 * This provides a basic Firebase-like interface for testing when CDN is blocked
 * Updated to support Firebase v10 modular syntax
 */

// Mock Database class
class MockDatabase {
    constructor() {
        this.data = this.loadFromStorage();
        this.listeners = new Map();
        console.log('🔥 Mock Firebase Database created');
    }
    
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('mockFirebaseData');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            return {};
        }
    }
    
    saveToStorage() {
        try {
            localStorage.setItem('mockFirebaseData', JSON.stringify(this.data));
        } catch (error) {
            console.warn('Failed to save mock data to localStorage');
        }
    }
    
    setData(path, value) {
        const pathParts = path.split('/').filter(p => p);
        let current = this.data;
        
        // Navigate to parent
        for (let i = 0; i < pathParts.length - 1; i++) {
            if (!current[pathParts[i]]) {
                current[pathParts[i]] = {};
            }
            current = current[pathParts[i]];
        }
        
        // Set value
        if (pathParts.length > 0) {
            current[pathParts[pathParts.length - 1]] = value;
        } else {
            this.data = value;
        }
        
        this.saveToStorage();
        this.notifyListeners(path, value);
    }
    
    getData(path) {
        if (!path) return this.data;
        
        const pathParts = path.split('/').filter(p => p);
        let current = this.data;
        
        for (const part of pathParts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return null;
            }
        }
        
        return current;
    }
    
    notifyListeners(path, value) {
        this.listeners.forEach((listener, id) => {
            if (listener.path === path || path.startsWith(listener.path + '/') || listener.path.startsWith(path + '/') || listener.path === '') {
                setTimeout(() => {
                    listener.callback({
                        val: () => this.getData(listener.path),
                        exists: () => this.getData(listener.path) !== null
                    });
                }, 10);
            }
        });
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
        this.database.setData(this.path, value);
        
        // Simulate successful save
        return Promise.resolve({
            ref: this,
            key: this.path,
            val: () => value
        });
    }
    
    update(updates) {
        console.log(`🔥 Mock update ${this.path}:`, updates);
        const current = this.database.getData(this.path) || {};
        const updated = { ...current, ...updates };
        this.database.setData(this.path, updated);
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
    
    get() {
        console.log(`🔥 Mock get called on ${this.path}`);
        const data = this.database.getData(this.path);
        return Promise.resolve({
            val: () => data,
            exists: () => data !== null
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
                const data = this.database.getData(this.path);
                callback({ 
                    val: () => data,
                    exists: () => data !== null
                });
            }, 100);
        }
        
        return listenerId;
    }
    
    onValue(callback, errorCallback) {
        return this.on('value', callback);
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
        // Persist into the in-memory database
        if (ref && ref.database && typeof ref.database.setData === 'function') {
            ref.database.setData(ref.path, value);
        } else {
            ref.mockData = value;
        }
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
            const dbData = ref && ref.database ? ref.database.getData(ref.path) : undefined;
            const val = dbData !== undefined ? dbData : (ref.mockData || {});
            callback({ 
                val: () => val,
                exists: () => val !== null && (typeof val !== 'object' || Object.keys(val).length > 0)
            });
        }, 100);
    }

    function mockUpdate(ref, updates) {
        console.log(`🔥 Mock update called on ${ref.path}:`, updates);
        if (ref && ref.database) {
            const current = ref.database.getData(ref.path) || {};
            const merged = { ...current, ...updates };
            ref.database.setData(ref.path, merged);
            return Promise.resolve();
        }
        // Fallback if no database reference
        ref.mockData = { ...(ref.mockData || {}), ...updates };
        return Promise.resolve();
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
        increment: mockIncrement,
        update: mockUpdate
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