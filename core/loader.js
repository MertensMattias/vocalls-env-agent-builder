/**
 * Vocalls Script Loader - Single, Clean Implementation
 *
 * Loads scripts in the correct order with ES5.1 transformation and validation.
 * Supports configurable paths via env.config.json for multi-project support.
 *
 * Loading Order (maintained regardless of paths):
 * 1. callScript_init/globalCode.js - Base utilities
 * 2. callScript_init/globalVariables.js - Global variables
 * 3. globalLibraries/active/* - Libraries in REVERSE alphabetical order
 * 4. User script - Main call flow
 *
 * Path Resolution:
 * - Reads active project from env.config.json
 * - Uses project-specific paths if configured
 * - Falls back to environment defaults if project config missing
 * - Falls back to hardcoded defaults if config file missing (backward compatibility)
 *
 * Project Switching:
 * - Active project determined by env.config.json "activeProject" field
 * - Can be overridden via CLI --project flag (handled by simulate.js)
 *
 * @module loader
 */

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var core = require('./minimalVocallsCore');

var DEFAULT_DATABASE_URL = 'http://localhost:3001';

/**
 * Simple ES5.1 transformer - converts let/const to var
 */
function transformES5(code) {
    return code
        .replace(/\blet\s+/g, 'var ')
        .replace(/\bconst\s+/g, 'var ');
}

/**
 * Load environment configuration from env.config.json
 */
function loadEnvConfig() {
    var configPath = path.resolve(process.cwd(), 'env.config.json');
    var defaultConfig = {
        httpMode: 'real',
        storageMode: 'disk',
        env: 'acc',
        moduleName: 'vocalls-env',
        databaseUrl: DEFAULT_DATABASE_URL,
        environment: {
            examplesPath: 'examples'
        },
        projects: {},
        activeProject: null
    };

    try {
        if (fs.existsSync(configPath)) {
            var configContent = fs.readFileSync(configPath, 'utf8');
            var parsed = JSON.parse(configContent);
            if (!parsed.projects || typeof parsed.projects !== 'object') {
                parsed.projects = {};
            }
            if (!parsed.environment || typeof parsed.environment !== 'object') {
                parsed.environment = { examplesPath: 'examples' };
            }
            if (!parsed.httpMode) {
                parsed.httpMode = defaultConfig.httpMode;
            }
            if (!parsed.storageMode) {
                parsed.storageMode = defaultConfig.storageMode;
            }
            if (!parsed.env) {
                parsed.env = defaultConfig.env;
            }
            if (!parsed.moduleName) {
                parsed.moduleName = defaultConfig.moduleName;
            }
            if (!parsed.databaseUrl) {
                parsed.databaseUrl = DEFAULT_DATABASE_URL;
            }
            if (!parsed.activeProject) {
                parsed.activeProject = null;
            }
            return parsed;
        }
    } catch (error) {
        // Silently fail - will use fallback behavior
    }

    return defaultConfig;
}

/**
 * Load project configuration from env.config.json
 * Returns the active project's configuration, or null if not found
 * 
 * @param {string} projectName - Optional project name override (from CLI --project flag)
 * @returns {Object|null} Project configuration object or null
 */
function loadProjectConfig(projectName) {
    var envConfig = loadEnvConfig();
    
    // Use provided project name, or activeProject from config, or default to example-starter
    var activeProjectName = projectName || envConfig.activeProject || 'example-starter';
    
    if (envConfig.projects && envConfig.projects[activeProjectName]) {
        var projectEntry = envConfig.projects[activeProjectName] || {};
        var settings = mergeSettings(envConfig, projectEntry.settings);
        return {
            name: activeProjectName,
            config: projectEntry,
            settings: settings,
            metadata: projectEntry.metadata || {},
            envConfig: envConfig
        };
    }
    
    return null;
}

function mergeSettings(envConfig, projectSettings) {
    var merged = {
        env: envConfig.env || 'acc',
        httpMode: envConfig.httpMode || 'real',
        storageMode: envConfig.storageMode || 'disk',
        moduleName: envConfig.moduleName || 'vocalls-env',
        databaseUrl: envConfig.databaseUrl || DEFAULT_DATABASE_URL
    };

    if (projectSettings) {
        for (var key in projectSettings) {
            if (projectSettings.hasOwnProperty(key) && projectSettings[key] !== undefined && projectSettings[key] !== null) {
                merged[key] = projectSettings[key];
            }
        }
    }

    return merged;
}

/**
 * Get path for callScript_init directory
 * Falls back to default if config not available
 */
function getCallScriptInitPath(projectConfig) {
    if (projectConfig && projectConfig.config && projectConfig.config.callScriptInitPath) {
        return projectConfig.config.callScriptInitPath;
    }
    var envConfig = loadEnvConfig();
    if (envConfig.environment && envConfig.environment.callScriptInitPath) {
        return envConfig.environment.callScriptInitPath;
    }
    // Fallback to new project structure default
    return 'projects/example-starter/callScript_init';
}

/**
 * Get path for globalLibraries/active directory
 * Falls back to default if config not available
 */
function getGlobalLibrariesPath(projectConfig) {
    if (projectConfig && projectConfig.config && projectConfig.config.globalLibrariesPath) {
        return projectConfig.config.globalLibrariesPath;
    }
    var envConfig = loadEnvConfig();
    if (envConfig.environment && envConfig.environment.globalLibrariesPath) {
        return envConfig.environment.globalLibrariesPath;
    }
    // Fallback to new project structure default
    return 'projects/example-starter/globalLibraries/active';
}

/**
 * Execute scripts in the correct order
 *
 * @param {Object} options - Loading options
 * @param {Object} options.sandbox - Pre-built sandbox context
 * @param {string} options.userScript - Path to user script file
 * @param {boolean} options.validateScripts - Validate scripts before execution
 * @param {string} options.projectName - Optional project name override (from CLI --project flag)
 * @returns {Object} Updated sandbox after all scripts loaded
 */
function executeScripts(options) {
    if (!options.sandbox) {
        throw new Error('sandbox is required in options');
    }

    if (!options.userScript) {
        throw new Error('userScript path is required in options');
    }

    var sandbox = options.sandbox;
    var validateScripts = options.validateScripts !== false; // Default true
    
    // Load project configuration (optional - falls back to defaults if not found)
    // Accept project name from options if provided (allows simulate.js to pass --project flag)
    var projectConfig = loadProjectConfig(options.projectName);
    
    // Get configurable paths with fallback to defaults
    var callScriptInitPath = getCallScriptInitPath(projectConfig);
    var globalLibrariesPath = getGlobalLibrariesPath(projectConfig);

    // Suppress initialization debug logs - only show errors

    // Create VM context from sandbox - everything executes in same global scope
    var context = vm.createContext(sandbox);

    var executionOrder = [];
    var startTime = Date.now();
    
    // Make execution order available in real-time to scripts
    sandbox._executionOrder = executionOrder;
    context._executionOrder = executionOrder;

    // Step 1: Load callScript_init/globalCode.js first (provides base utilities)
    var callScriptGlobalCodePath = path.resolve(process.cwd(), callScriptInitPath, 'globalCode.js');
    if (fs.existsSync(callScriptGlobalCodePath)) {
        executeScript(callScriptGlobalCodePath, 'globalLibrary', context, sandbox, validateScripts, executionOrder);
    } else {
        sandbox.log_warn('callScript_init/globalCode.js not found, skipping:', callScriptGlobalCodePath);
    }

    // Step 2: Load callScript_init/globalVariables.js second (depends on utilities from globalCode.js)
    var globalVariablesPath = path.resolve(process.cwd(), callScriptInitPath, 'globalVariables.js');
    if (fs.existsSync(globalVariablesPath)) {
        executeScript(globalVariablesPath, 'globalLibrary', context, sandbox, validateScripts, executionOrder);
    } else {
        sandbox.log_warn('globalVariables.js not found, skipping:', globalVariablesPath);
    }

    // Step 3: Load global libraries from active/ folder in REVERSE alphabetical order
    var globalLibrariesActiveDir = path.resolve(process.cwd(), globalLibrariesPath);
    var libraryFiles = [];

    // Auto-discover files in globalLibraries/active/ folder in REVERSE alphabetical order
    if (fs.existsSync(globalLibrariesActiveDir)) {
        // Auto-discovering global libraries from active/ folder (suppressed debug log)
        try {
            libraryFiles = fs.readdirSync(globalLibrariesActiveDir)
                .filter(function (file) {
                    var fullPath = path.join(globalLibrariesActiveDir, file);
                    var isFile = fs.statSync(fullPath).isFile();
                    // Accept files with .js extension OR files without any extension (assumed to be JS)
                    var isJsFile = file.endsWith('.js') || file.indexOf('.') === -1;
                    return isFile && isJsFile;
                })
                .sort()
                .reverse()
                .map(function (file) {
                    return path.join(globalLibrariesActiveDir, file);
                });
        } catch (e) {
            sandbox.log_warn('Error reading globalLibraries/active directory:', e.message);
        }
    } else {
        sandbox.log_warn('globalLibraries/active directory not found:', globalLibrariesActiveDir);
    }

    // Execute global libraries first
    libraryFiles.forEach(function (libPath) {
        if (fs.existsSync(libPath)) {
            executeScript(libPath, 'globalLibrary', context, sandbox, validateScripts, executionOrder);
        } else {
            sandbox.log_warn('Global library not found:', libPath);
        }
    });

    // Step 4: Execute user script
    var userScriptPath = path.resolve(process.cwd(), options.userScript);
    if (!fs.existsSync(userScriptPath)) {
        throw new Error('User script not found: ' + userScriptPath);
    }

    var result = executeScript(userScriptPath, 'userScript', context, sandbox, validateScripts, executionOrder);

    var totalTime = Date.now() - startTime;

    // Script execution completed (suppressed debug log)

    // Store execution metadata in sandbox
    sandbox._executionMetadata = {
        order: executionOrder,
        totalTime: totalTime,
        timestamp: new Date().toISOString(),
        userScriptResult: result
    };

    return sandbox;
}

/**
 * Count functions and variables in context
 */
function countContextItems(context, beforeKeys) {
    var currentKeys = Object.keys(context);
    var newKeys = currentKeys.filter(function (key) {
        return beforeKeys.indexOf(key) === -1;
    });

    var functions = 0;
    var variables = 0;

    newKeys.forEach(function (key) {
        if (typeof context[key] === 'function') {
            functions++;
        } else {
            variables++;
        }
    });

    return {
        total: newKeys.length,
        functions: functions,
        variables: variables,
        newKeys: newKeys
    };
}

/**
 * Execute a single script file
 * 
 * Uses vm.Script for better debugging support with VS Code.
 * Breakpoints and debugger statements work correctly with this approach.
 */
function executeScript(scriptPath, scriptType, context, sandbox, validateScripts, executionOrder) {
    var stepStart = Date.now();
    var fileName = path.basename(scriptPath);

    try {
        // Loading script (suppressed debug log)

        // Capture context keys before execution (only for global libraries)
        var beforeKeys = [];
        if (scriptType === 'globalLibrary') {
            beforeKeys = Object.keys(context);
        }

        var code = fs.readFileSync(scriptPath, 'utf8');

        // Transform let/const to var for ES5.1 compatibility
        code = transformES5(code);

        // Validate script if requested (non-blocking warnings)
        if (validateScripts && scriptType !== 'userScript') {
            var validation = core.validateConstraints(code, fileName);
            if (!validation.ok) {
                var warnMsg = 'Validation warnings for ' + fileName + ': ' + validation.errors.length + ' issue(s)';
                sandbox.log_warn(warnMsg);
                validation.errors.forEach(function (error) {
                    sandbox.log_warn('  ' + error.rule + ' at line ' + error.line + ':' + error.col + ' - ' + error.message);
                });
                // Don't throw - just warn and continue
            }
        }

        // Execute using vm.Script for better debugging support
        // This allows VS Code debugger to attach and breakpoints to work
        var script = new vm.Script(code, {
            filename: scriptPath,  // Use full path for better stack traces in debugger
            lineOffset: 0,
            columnOffset: 0,
            displayErrors: true,
            produceCachedData: false
        });

        // Run the compiled script in the shared context
        var result = script.runInContext(context, {
            displayErrors: true,
            breakOnSigint: true
        });

        var stepTime = Date.now() - stepStart;
        var contextStats = null;

        // Count new functions and variables (only for global libraries)
        if (scriptType === 'globalLibrary') {
            contextStats = countContextItems(context, beforeKeys);
        }

        var executionItem = {
            type: scriptType,
            path: scriptPath,
            fileName: fileName,
            size: code.length,
            loadTime: stepTime,
            result: result
        };

        if (contextStats) {
            executionItem.contextStats = contextStats;
        }

        executionOrder.push(executionItem);

        var debugInfo = {
            type: scriptType,
            size: code.length + ' chars',
            time: stepTime + 'ms',
            result: result !== undefined ? typeof result : 'undefined'
        };

        if (contextStats) {
            debugInfo.newItems = contextStats.total + ' (' + contextStats.functions + ' functions, ' + contextStats.variables + ' variables)';
        }

        // Script executed successfully (suppressed debug log)

        return result;

    } catch (error) {
        sandbox.log_error('✗ Failed to execute ' + fileName + ':', error.message);
        throw new Error('Script execution failed (' + fileName + '): ' + error.message);
    }
}

/**
 * Gets the execution metadata from the sandbox
 */
function getExecutionMetadata(sandbox) {
    return sandbox && sandbox._executionMetadata ? sandbox._executionMetadata : null;
}

module.exports = {
    executeScripts: executeScripts,
    getExecutionMetadata: getExecutionMetadata,
    loadEnvConfig: loadEnvConfig,
    loadProjectConfig: loadProjectConfig
};

