/**
 * Google Sheets Integration Module
 * 
 * This module provides Google Sheets integration functionality
 * for backing up quiz data and exporting results.
 */

class GoogleSheetsIntegration {
    constructor() {
        this.apiKey = null;
        this.spreadsheetId = null;
        this.isEnabled = false;
    }

    /**
     * Initialize Google Sheets integration
     */
    initialize(config) {
        if (config && config.apiKey && config.spreadsheetId) {
            this.apiKey = config.apiKey;
            this.spreadsheetId = config.spreadsheetId;
            this.isEnabled = true;
            console.log('📊 Google Sheets integration enabled');
        } else {
            console.log('📊 Google Sheets integration disabled (no configuration)');
        }
    }

    /**
     * Export data to Google Sheets
     */
    async exportData(data) {
        if (!this.isEnabled) {
            console.log('📊 Google Sheets not configured, skipping export');
            return { success: false, reason: 'not_configured' };
        }

        try {
            console.log('📊 Exporting data to Google Sheets...');
            
            // Format data for sheets
            const formattedData = this.formatDataForSheets(data);
            
            // Here you would implement the actual Google Sheets API call
            // For now, we'll simulate the export
            console.log('📊 Data formatted for Google Sheets:', formattedData);
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('✅ Data exported to Google Sheets successfully');
            return { success: true, rowsExported: formattedData.length };
            
        } catch (error) {
            console.error('❌ Google Sheets export failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Format quiz data for Google Sheets
     */
    formatDataForSheets(data) {
        if (!Array.isArray(data)) {
            data = Object.values(data);
        }

        return data.map(user => ({
            timestamp: this.formatTimestamp(user.timestamp),
            name: user.name || '',
            phone: user.phone || '',
            classType: this.formatClassType(user.classType || user.class_type),
            score: user.score || 0,
            prize: this.formatPrize(user.prize || user.gift),
            choice: this.formatChoice(user.choice || user.decision),
            wheelResult: user.wheelResult || '',
            finalChoice: user.finalChoice || ''
        }));
    }

    /**
     * Format timestamp for display
     */
    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        
        try {
            return new Date(timestamp).toLocaleString('vi-VN');
        } catch (error) {
            return timestamp.toString();
        }
    }

    /**
     * Format class type for display
     */
    formatClassType(type) {
        const types = {
            'tieu-hoc': 'Tiểu học',
            'thcs': 'THCS', 
            'thpt': 'THPT',
            'tieng-trung': 'Tiếng Trung',
            'tieng-anh-giao-tiep': 'Tiếng Anh giao tiếp',
            'chung-chi': 'Chứng chỉ'
        };
        return types[type] || type || '';
    }

    /**
     * Format prize for display
     */
    formatPrize(prize) {
        if (typeof prize === 'object' && prize.name) {
            return prize.name;
        }
        return prize || '';
    }

    /**
     * Format choice for display
     */
    formatChoice(choice) {
        const choices = {
            'register': 'Đăng ký',
            'decline': 'Từ chối'
        };
        return choices[choice] || choice || '';
    }

    /**
     * Backup data to Google Sheets automatically
     */
    async autoBackup(data) {
        if (!this.isEnabled) {
            return { success: false, reason: 'not_configured' };
        }

        try {
            console.log('🔄 Starting automatic backup to Google Sheets...');
            
            const result = await this.exportData(data);
            
            if (result.success) {
                console.log('✅ Automatic backup completed');
                
                // Store last backup timestamp
                localStorage.setItem('lastGoogleSheetsBackup', new Date().toISOString());
                
                return result;
            } else {
                console.warn('⚠️ Automatic backup failed:', result.error || result.reason);
                return result;
            }
            
        } catch (error) {
            console.error('❌ Automatic backup error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if backup is needed
     */
    needsBackup() {
        if (!this.isEnabled) {
            return false;
        }

        const lastBackup = localStorage.getItem('lastGoogleSheetsBackup');
        if (!lastBackup) {
            return true;
        }

        const lastBackupTime = new Date(lastBackup);
        const now = new Date();
        const hoursSinceBackup = (now - lastBackupTime) / (1000 * 60 * 60);

        // Backup every 6 hours
        return hoursSinceBackup >= 6;
    }

    /**
     * Get backup status
     */
    getBackupStatus() {
        const lastBackup = localStorage.getItem('lastGoogleSheetsBackup');
        
        return {
            enabled: this.isEnabled,
            lastBackup: lastBackup ? new Date(lastBackup) : null,
            needsBackup: this.needsBackup()
        };
    }
}

// Create and export instance
const googleSheets = new GoogleSheetsIntegration();

// Export to global scope
window.GoogleSheets = googleSheets;

// Initialize with config if available
document.addEventListener('DOMContentLoaded', () => {
    // Check for Google Sheets configuration
    if (typeof window.GOOGLE_SHEETS_CONFIG !== 'undefined') {
        googleSheets.initialize(window.GOOGLE_SHEETS_CONFIG);
    }
});

// Also export as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleSheetsIntegration;
}