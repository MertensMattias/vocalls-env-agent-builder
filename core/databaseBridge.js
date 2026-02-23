/**
 * Database Bridge for Vocalls
 * Connects vocalls core to database service via HTTP/S
 */

var http = require('http');
var https = require('https');

var DEFAULT_DATABASE_URL = 'http://localhost:3001';
var MAX_RETRIES = 3;
var TIMEOUT_MS = 5000;

var isAvailable = false;
var activeUrl = DEFAULT_DATABASE_URL;
var requestModule = http;
var requestHost = 'localhost';
var requestPort = 3001;
var requestBasePath = '';

function configureDatabaseUrl(serviceUrl) {
    var urlToUse = serviceUrl || DEFAULT_DATABASE_URL;

    try {
        var parsed = new URL(urlToUse);
        activeUrl = urlToUse;
        requestHost = parsed.hostname;
        requestPort = parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80);
        requestModule = parsed.protocol === 'https:' ? https : http;
        requestBasePath = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname.replace(/\/$/, '') : '';
    } catch (error) {
        console.warn('[DatabaseBridge] Invalid database URL "' + urlToUse + '" (' + error.message + '). Falling back to ' + DEFAULT_DATABASE_URL);
        activeUrl = DEFAULT_DATABASE_URL;
        requestHost = 'localhost';
        requestPort = 3001;
        requestModule = http;
        requestBasePath = '';
    }
}

/**
 * Initialize bridge and check if service is available
 */
function initialize(serviceUrl) {
    configureDatabaseUrl(serviceUrl);
    checkAvailability();
}

/**
 * Check if database service is available
 */
function checkAvailability() {
    makeRequest('/health', 'GET', null, function(err, data) {
        if (!err && data && data.success) {
            isAvailable = true;
            console.log('[DatabaseBridge] ✓ Database service available at', activeUrl);
        } else {
            isAvailable = false;
            console.log('[DatabaseBridge] ✗ Database service not available at ' + activeUrl + ' - database functions will return null');
        }
    });
}

/**
 * Make HTTP request to database service
 */
function makeRequest(path, method, body, callback) {
    var postData = body ? JSON.stringify(body) : null;

    var requestPath = (requestBasePath + path).replace(/\/{2,}/g, '/');
    if (requestPath.charAt(0) !== '/') {
        requestPath = '/' + requestPath;
    }

    var options = {
        hostname: requestHost,
        port: requestPort,
        path: requestPath,
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        timeout: TIMEOUT_MS
    };

    if (postData) {
        options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    var req = requestModule.request(options, function(res) {
        var data = '';

        res.on('data', function(chunk) {
            data += chunk;
        });

        res.on('end', function() {
            if (!data) {
                callback(null, {});
                return;
            }
            try {
                var parsed = JSON.parse(data);
                callback(null, parsed);
            } catch (e) {
                callback(e);
            }
        });
    });

    req.on('error', function(err) {
        callback(err);
    });

    req.on('timeout', function() {
        req.destroy();
        callback(new Error('Request timeout'));
    });

    if (postData) {
        req.write(postData);
    }

    req.end();
}

/**
 * Make synchronous-like request (uses busy waiting for simplicity)
 * Note: In production C# implementation, this would be truly synchronous
 */
function makeSyncRequest(path, method, body) {
    var result = null;
    var error = null;
    var done = false;

    makeRequest(path, method, body, function(err, data) {
        if (err) {
            error = err;
        } else {
            result = data;
        }
        done = true;
    });

    // Wait for response (busy wait - acceptable for localhost HTTP)
    var start = Date.now();
    while (!done && Date.now() - start < TIMEOUT_MS) {
        // Busy wait
    }

    if (!done) {
        console.error('[DatabaseBridge] Request timeout');
        return null;
    }

    if (error) {
        console.error('[DatabaseBridge] Request error:', error.message);
        return null;
    }

    return result;
}

/**
 * Expose to global scope for JavaScript call scripts
 */
function exposeGlobalFunctions() {
    /**
     * dbQuery - Execute SELECT query, return array of rows
     * @param {string} sql - SQL query with ? placeholders
     * @param {Array} params - Query parameters
     * @returns {Array<Object>|null} Array of result objects or null
     */
    global.dbQuery = function(sql, params) {
        if (!isAvailable) {
            console.warn('[dbQuery] Database service not available');
            return null;
        }

        var response = makeSyncRequest('/api/query', 'POST', { sql: sql, params: params });

        if (response && response.success) {
            return response.data;
        }

        console.error('[dbQuery] Query failed:', response ? response.error : 'No response');
        return null;
    };

    /**
     * dbQuerySingle - Execute query, return first row only
     * @param {string} sql - SQL query with ? placeholders
     * @param {Array} params - Query parameters
     * @returns {Object|null} First result object or null
     */
    global.dbQuerySingle = function(sql, params) {
        if (!isAvailable) {
            console.warn('[dbQuerySingle] Database service not available');
            return null;
        }

        var response = makeSyncRequest('/api/query-single', 'POST', { sql: sql, params: params });

        if (response && response.success) {
            return response.data;
        }

        console.error('[dbQuerySingle] Query failed:', response ? response.error : 'No response');
        return null;
    };

    /**
     * dbExecute - Execute INSERT/UPDATE/DELETE statement
     * @param {string} sql - SQL statement with ? placeholders
     * @param {Array} params - Statement parameters
     * @returns {number} Number of rows affected or -1 on error
     */
    global.dbExecute = function(sql, params) {
        if (!isAvailable) {
            console.warn('[dbExecute] Database service not available');
            return -1;
        }

        var response = makeSyncRequest('/api/execute', 'POST', { sql: sql, params: params });

        if (response && response.success) {
            return response.changes;
        }

        console.error('[dbExecute] Execute failed:', response ? response.error : 'No response');
        return -1;
    };

    /**
     * dbStoredProc - Execute stored procedure
     * @param {string} procName - Procedure name
     * @param {Array} params - Procedure parameters
     * @returns {*} Procedure result or null
     */
    global.dbStoredProc = function(procName, params) {
        if (!isAvailable) {
            console.warn('[dbStoredProc] Database service not available');
            return null;
        }

        var response = makeSyncRequest('/api/stored-proc', 'POST', { procName: procName, params: params });

        if (response && response.success) {
            return response.data;
        }

        console.error('[dbStoredProc] Procedure failed:', response ? response.error : 'No response');
        return null;
    };

    console.log('[DatabaseBridge] ✓ Global database functions exposed to JavaScript (URL: ' + activeUrl + ')');
}

/**
 * Check if database is available
 * @returns {boolean} True if database service is available
 */
function isDatabaseAvailable() {
    return isAvailable;
}

module.exports = {
    initialize: initialize,
    exposeGlobalFunctions: exposeGlobalFunctions,
    checkAvailability: checkAvailability,
    isDatabaseAvailable: isDatabaseAvailable,
    configureDatabaseUrl: configureDatabaseUrl
};

 
