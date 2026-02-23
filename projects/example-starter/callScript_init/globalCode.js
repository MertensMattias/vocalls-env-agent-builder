/**
 * globalCode.js - Base Utilities
 * 
 * Provides core utility functions for call scripts.
 * Loaded first, before globalVariables.js and all global libraries.
 */

/**
 * Safe property access with default value
 */
function safeGet(obj, key, defaultValue) {
    try {
        var value = obj[key];
        return value !== undefined ? value : defaultValue;
    } catch (e) {
        return defaultValue;
    }
}

/**
 * Nested property resolver (e.g. "session.variables.customerId")
 */
function getPath(obj, path) {
    if (!path) return obj;
    var keys = path.split('.');
    var current = obj;
    for (var i = 0; i < keys.length; i++) {
        if (current && typeof current === 'object') {
            current = current[keys[i]];
        } else {
            return undefined;
        }
    }
    return current;
}

/**
 * Check if object is empty
 */
function isEmpty(obj) {
    if (!obj) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }
    return false;
}

/**
 * Validate object structure
 */
function isValidObject(obj) {
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}

/**
 * Generate unique ID
 */
function generateId() {
    return 'ID-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Log to console with timestamp
 */
function logVar(obj, label) {
    label = label || 'Log';
    if (typeof logInfo !== 'undefined') {
        logInfo(label, JSON.stringify(obj, null, 2));
    }
}

logInfo('✓ globalCode.js loaded - Base utilities ready');

