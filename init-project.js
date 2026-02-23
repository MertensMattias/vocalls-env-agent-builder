#!/usr/bin/env node

/**
 * Vocalls Smart Project Initialization Wizard
 *
 * Creates a fully configured multi-project workspace entry with
 * per-project settings, documentation, and starter code.
 *
 * Usage: node init-project.js
 */

var fs = require('fs');
var path = require('path');
var os = require('os');
var http = require('http');
var readline = require('readline');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    red: '\x1b[31m'
};

var WIZARD_VERSION = '2.0';
var DEFAULT_DATABASE_URL = 'http://localhost:3001';
var DEFAULT_ENV = 'acc';
var DEFAULT_HTTP_MODE = 'real';
var DEFAULT_STORAGE_MODE = 'disk';

function colorize(color, message) {
    return colors[color] + message + colors.reset;
}

function log(color, message) {
    console.log(colorize(color, message));
}

function header(text) {
    console.log('\n' + colorize('bright', colors.blue + '═══════════════════════════════════════════════'));
    console.log(colorize('bright', colors.blue + '  ' + text));
    console.log(colorize('bright', colors.blue + '═══════════════════════════════════════════════') + '\n');
}

function question(prompt) {
    return new Promise(function(resolve) {
        rl.question(colorize('bright', prompt), function(answer) {
            resolve((answer || '').trim());
        });
    });
}

function askWithDefault(prompt, defaultValue, helpText) {
    var suffix = defaultValue !== undefined && defaultValue !== null && defaultValue !== '' ? ' [' + defaultValue + ']' : '';
    return question(prompt + suffix + ' ').then(function(answer) {
        if (answer === '?' && helpText) {
            log('blue', helpText);
            return askWithDefault(prompt, defaultValue, helpText);
        }
        if (answer === '' && defaultValue !== undefined) {
            return defaultValue;
        }
        return answer;
    });
}

function askYesNo(prompt, defaultValue, helpText) {
    var defaultLabel = defaultValue ? 'yes' : 'no';
    return askWithDefault(prompt, defaultLabel, helpText).then(function(answer) {
        var normalized = answer.toLowerCase();
        if (normalized === 'y' || normalized === 'yes') {
            return true;
        }
        if (normalized === 'n' || normalized === 'no') {
            return false;
        }
        if (answer === defaultLabel) {
            return defaultValue;
        }
        log('yellow', 'Please answer "yes" or "no". Type "?" for help.');
        return askYesNo(prompt, defaultValue, helpText);
    });
}

function isValidProjectName(name) {
    return /^[a-z0-9][a-z0-9\-_]{1,48}[a-z0-9]$/.test(name || '');
}

function sanitizeProjectName(name) {
    if (!name) {
        return '';
    }
    return name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-_]/g, '-').toLowerCase();
}

function toTitleCase(value) {
    if (!value) {
        return '';
    }
    return value.replace(/[-_]+/g, ' ').split(' ').map(function(part) {
        return part.length === 0 ? '' : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }).join(' ');
}

function deriveCustomerFromProject(projectName) {
    var guess = toTitleCase(projectName);
    return guess.length > 0 ? guess : 'Customer';
}

function loadEnvConfig(configPath) {
    var defaultConfig = {
        httpMode: DEFAULT_HTTP_MODE,
        storageMode: DEFAULT_STORAGE_MODE,
        env: DEFAULT_ENV,
        moduleName: 'vocalls-env',
        environment: {
            examplesPath: 'examples'
        },
        projects: {},
        activeProject: null
    };

    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
        return defaultConfig;
    }

    try {
        var content = fs.readFileSync(configPath, 'utf8');
        var parsed = JSON.parse(content);
        if (!parsed.projects || typeof parsed.projects !== 'object') {
            parsed.projects = {};
        }
        if (!parsed.environment || typeof parsed.environment !== 'object') {
            parsed.environment = { examplesPath: 'examples' };
        }
        if (!parsed.httpMode) {
            parsed.httpMode = DEFAULT_HTTP_MODE;
        }
        if (!parsed.storageMode) {
            parsed.storageMode = DEFAULT_STORAGE_MODE;
        }
        if (!parsed.env) {
            parsed.env = DEFAULT_ENV;
        }
        if (!parsed.moduleName) {
            parsed.moduleName = 'vocalls-env';
        }
        return parsed;
    } catch (error) {
        log('red', 'Failed to parse env.config.json. A new file will be created.');
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
        return defaultConfig;
    }
}

function saveEnvConfig(configPath, config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

function listExistingProjects(config) {
    var keys = Object.keys(config.projects || {});
    var unique = {};
    keys.forEach(function(name) {
        unique[name] = true;
    });

    var projectsDir = path.join(process.cwd(), 'projects');
    if (fs.existsSync(projectsDir)) {
        fs.readdirSync(projectsDir).forEach(function(dirName) {
            var fullPath = path.join(projectsDir, dirName);
            if (fs.statSync(fullPath).isDirectory()) {
                unique[dirName] = true;
            }
        });
    }

    return Object.keys(unique).sort();
}

function countOccurrences(values) {
    var map = {};
    values.forEach(function(value) {
        if (!value) {
            return;
        }
        if (!map[value]) {
            map[value] = 0;
        }
        map[value]++;
    });
    return map;
}

function selectMostCommon(map, fallback) {
    var bestKey = null;
    var bestCount = -1;
    for (var key in map) {
        if (map.hasOwnProperty(key)) {
            if (map[key] > bestCount) {
                bestCount = map[key];
                bestKey = key;
            }
        }
    }
    return bestKey || fallback;
}

function inferDefaultSettings(config) {
    var envValues = [];
    var httpValues = [];
    var storageValues = [];
    Object.keys(config.projects || {}).forEach(function(name) {
        var project = config.projects[name] || {};
        var settings = project.settings || {};
        envValues.push(settings.env);
        httpValues.push(settings.httpMode);
        storageValues.push(settings.storageMode);
    });

    return {
        env: selectMostCommon(countOccurrences(envValues), config.env || DEFAULT_ENV),
        httpMode: selectMostCommon(countOccurrences(httpValues), config.httpMode || DEFAULT_HTTP_MODE),
        storageMode: selectMostCommon(countOccurrences(storageValues), config.storageMode || DEFAULT_STORAGE_MODE)
    };
}

function detectDatabaseService(url) {
    return new Promise(function(resolve) {
        var detected = {
            url: url,
            available: false,
            status: 'unknown'
        };

        var parsed;
        try {
            parsed = new URL(url);
        } catch (error) {
            detected.status = 'invalid-url';
            resolve(detected);
            return;
        }

        var options = {
            method: 'GET',
            host: parsed.hostname,
            port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
            path: parsed.pathname,
            timeout: 1500
        };

        var req = http.request(options, function(res) {
            detected.available = res.statusCode >= 200 && res.statusCode < 500;
            detected.status = detected.available ? 'reachable' : 'unreachable';
            res.resume();
            resolve(detected);
        });

        req.on('error', function() {
            detected.available = false;
            detected.status = 'connection-error';
            resolve(detected);
        });

        req.on('timeout', function() {
            req.destroy();
            detected.available = false;
            detected.status = 'timeout';
            resolve(detected);
        });

        req.end();
    });
}

function ensureProjectsDirectory() {
    var dirPath = path.join(process.cwd(), 'projects');
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function projectPath(projectName) {
    return path.join(process.cwd(), 'projects', projectName);
}

function projectExists(projectName) {
    return fs.existsSync(projectPath(projectName));
}

function buildPathConfig(projectName) {
    return {
        callScriptInitPath: 'projects/' + projectName + '/callScript_init',
        callScriptsPath: 'projects/' + projectName + '/callScripts',
        globalLibrariesPath: 'projects/' + projectName + '/globalLibraries/active',
        exportedPath: 'projects/' + projectName + '/exported_callscripts'
    };
}

function writeFileSafe(filePath, content, overwrite) {
    var exists = fs.existsSync(filePath);
    if (exists && !overwrite) {
        return false;
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
}

function renderSummaryTable(data) {
    var lines = [
        '╔══════════════════════════════════════════════════════╗',
        '║     Project Configuration Summary                    ║',
        '╠══════════════════════════════════════════════════════╣',
        padSummaryLine('Project Name', data.projectName),
        padSummaryLine('Customer', data.metadata.customerName || '—'),
        padSummaryLine('Description', data.metadata.description || '—'),
        padSummaryLine('Environment', data.settings.env),
        padSummaryLine('HTTP Mode', data.settings.httpMode),
        padSummaryLine('Storage Mode', data.settings.storageMode),
        padSummaryLine('Module Name', data.settings.moduleName),
        padSummaryLine('Database URL', data.settings.databaseUrl),
        '╚══════════════════════════════════════════════════════╝'
    ];
    lines.forEach(function(line) {
        console.log(line);
    });
}

function padSummaryLine(label, value) {
    var formatted = label + ':';
    while (formatted.length < 18) {
        formatted += ' ';
    }
    var displayValue = value && value.length > 0 ? value : '—';
    if (displayValue.length > 38) {
        displayValue = displayValue.slice(0, 35) + '...';
    }
    var line = '║  ' + formatted + ' ' + displayValue;
    while (line.length < 56) {
        line += ' ';
    }
    return line + '║';
}

function buildGlobalCodeTemplate(data) {
    return '/**\n' +
        ' * globalCode.js - Shared Utilities\n' +
        ' *\n' +
        ' * Project: ' + data.projectName + '\n' +
        ' * Module: ' + data.settings.moduleName + '\n' +
        ' * Generated: ' + data.metadata.created + '\n' +
        ' * Wizard Version: ' + WIZARD_VERSION + '\n' +
        ' */\n\n' +
        'function safeGet(obj, key, defaultValue) {\n' +
        '    try {\n' +
        '        var value = obj[key];\n' +
        '        return value !== undefined ? value : defaultValue;\n' +
        '    } catch (error) {\n' +
        '        return defaultValue;\n' +
        '    }\n' +
        '}\n\n' +
        'function getPath(obj, path) {\n' +
        '    if (!path) {\n' +
        '        return obj;\n' +
        '    }\n' +
        '    var parts = path.split(\'.\');\n' +
        '    var current = obj;\n' +
        '    for (var i = 0; i < parts.length; i++) {\n' +
        '        if (!current || typeof current !== \'object\') {\n' +
        '            return undefined;\n' +
        '        }\n' +
        '        current = current[parts[i]];\n' +
        '    }\n' +
        '    return current;\n' +
        '}\n\n' +
        'function isEmpty(value) {\n' +
        '    if (!value) {\n' +
        '        return true;\n' +
        '    }\n' +
        '    if (Array.isArray(value)) {\n' +
        '        return value.length === 0;\n' +
        '    }\n' +
        '    if (typeof value === \'object\') {\n' +
        '        for (var key in value) {\n' +
        '            if (value.hasOwnProperty(key)) {\n' +
        '                return false;\n' +
        '            }\n' +
        '        }\n' +
        '        return true;\n' +
        '    }\n' +
        '    return false;\n' +
        '}\n\n' +
        'function isValidObject(value) {\n' +
        '    return value !== null && typeof value === \'object\' && !Array.isArray(value);\n' +
        '}\n\n' +
        'function generateId() {\n' +
        '    return \'ID-\' + Date.now() + \'-\' + Math.random().toString(36).substr(2, 9);\n' +
        '}\n\n' +
        'logInfo(\'[' + data.projectName + '] globalCode.js loaded\');\n';
}

function buildGlobalVariablesTemplate(data) {
    return '/**\n' +
        ' * globalVariables.js - Global Variable Initialization\n' +
        ' *\n' +
        ' * Project: ' + data.projectName + '\n' +
        ' * Environment: ' + data.settings.env + '\n' +
        ' */\n\n' +
        'if (typeof context !== \'undefined\' && context.session) {\n' +
        '    context.session.variables.projectName = \'' + data.projectName + '\';\n' +
        '    context.session.variables.defaultEnvironment = \'' + data.settings.env + '\';\n' +
        '    context.session.variables.moduleName = \'' + data.settings.moduleName + '\';\n' +
        '    context.session.variables.initializedAt = nowUTC();\n' +
        '}\n\n' +
        'var varObj = {\n' +
        '    ani: safeGet(context, \'callInfo.fromUri\', \'\'),\n' +
        '    dnis: safeGet(context, \'callInfo.toUri\', \'\'),\n' +
        '    language: safeGet(context, \'language\', \'NL\'),\n' +
        '    customer: {\n' +
        '        name: \'' + (data.metadata.customerName || '') + '\'\n' +
        '    },\n' +
        '    metadata: {\n' +
        '        environment: \'' + data.settings.env + '\'\n' +
        '    }\n' +
        '};\n\n' +
        'logInfo(\'[' + data.projectName + '] globalVariables.js initialized\');\n';
}

function buildMainScriptTemplate(data) {
    return '/**\n' +
        ' * main.js - ' + data.projectName + ' Call Script\n' +
        ' *\n' +
        ' * Generated: ' + data.metadata.created + '\n' +
        ' * Environment default: ' + data.settings.env + '\n' +
        ' */\n\n' +
        'logInfo(\'=================================================\');\n' +
        'logInfo(\'' + data.projectName.toUpperCase() + ' - Call Script Started\');\n' +
        'logInfo(\'=================================================\');\n\n' +
        'logInfo(\'Project Settings:\');\n' +
        'logInfo(\'  Module:\', \'' + data.settings.moduleName + '\');\n' +
        'logInfo(\'  Default Environment:\', \'' + data.settings.env + '\');\n' +
        'logInfo(\'  HTTP Mode:\', \'' + data.settings.httpMode + '\');\n' +
        'logInfo(\'  Storage Mode:\', \'' + data.settings.storageMode + '\');\n\n' +
        'logInfo(\'Call Information:\');\n' +
        'logInfo(\'  Call GUID:\', context.callInfo.callGuid);\n' +
        'logInfo(\'  Direction:\', context.callInfo.direction);\n' +
        'logInfo(\'  From:\', context.callInfo.fromUri);\n' +
        'logInfo(\'  To:\', context.callInfo.toUri);\n' +
        'logInfo(\'  Language:\', context.language);\n\n' +
        'context.session.variables.scriptName = \'main\';\n' +
        'context.session.variables.scriptExecutedAt = nowUTC();\n\n' +
        'logInfo(\'✓ Script execution completed successfully\');\n' +
        'logInfo(\'=================================================\');\n';
}

function buildProjectConfigTemplate(data) {
    return '# ' + data.projectName + ' - Project Configuration\n\n' +
        '**AI Assistant Context File** - Long-term memory for development workflow\n\n' +
        '> **Note**: This file contains stable, long-term project context. For current development state, see `workflow_state.md`.\n\n' +
        '## Project Overview\n\n' +
        '- **Project Name**: ' + data.projectName + '\n' +
        '- **Customer**: ' + (data.metadata.customerName || '—') + '\n' +
        '- **Description**: ' + (data.metadata.description || '[Add project description here - what does this IVR flow handle?]') + '\n' +
        '- **Created**: ' + data.metadata.created + '\n' +
        '- **Initialized By**: ' + data.metadata.initializedBy + '\n' +
        '- **Wizard Version**: ' + WIZARD_VERSION + '\n' +
        '- **Status**: Initialized\n\n' +
        '## Project Settings\n\n' +
        '- **Environment**: ' + data.settings.env + ' (acc=acceptance, prd=production, dvp=development)\n' +
        '- **HTTP Mode**: ' + data.settings.httpMode + ' (real=actual calls, stub=mock responses)\n' +
        '- **Storage Mode**: ' + data.settings.storageMode + ' (disk=persistent, memory=transient)\n' +
        '- **Module Name**: ' + data.settings.moduleName + '\n' +
        '- **Database URL**: ' + data.settings.databaseUrl + '\n\n' +
        '## Technology Stack\n\n' +
        '- **Language**: ES5.1 JavaScript (Vocalls compatible)\n' +
        '- **Framework**: Vocalls IVR Platform\n' +
        '- **HTTP**: jsonHttpRequest (Thenable interface)\n' +
        '- **Database**: Optional SQLite via REST API (if service running)\n' +
        '- **Storage**: File-based (disk/memory modes)\n\n' +
        '## Coding Standards\n\n' +
        '- Use `var` only (no let/const)\n' +
        '- No arrow functions\n' +
        '- No async/await\n' +
        '- Promises: use `.then(success, failure)` - NO `.catch()`\n' +
        '- No optional chaining `?.` or nullish coalescing `??`\n' +
        '- Always check function availability before using\n\n' +
        '## Key Decisions\n\n' +
        '> Document architectural decisions here with timestamps and reasoning.\n\n' +
        '- **' + data.metadata.created + '**: Project initialized\n' +
        '  - Reason: New IVR project setup\n\n' +
        '> **Example format**:\n' +
        '> - **2025-01-15T10:00:00Z**: Use REST API for customer lookup\n' +
        '>   - Reason: Real-time data required, database has 5-minute cache delay\n\n' +
        '## APIs & Services\n\n' +
        '> Document external APIs, endpoints, authentication, and timeouts here.\n\n' +
        '> **Example format**:\n' +
        '> - **Customer API**: https://api.example.com/customers/{id}\n' +
        '>   - Auth: Bearer token in Authorization header\n' +
        '>   - Timeout: 30 seconds\n' +
        '>   - Returns: Customer object with account details\n\n' +
        '## Performance Constraints\n\n' +
        '- HTTP timeout: 30 seconds (default)\n' +
        '- Script execution: Real-time\n' +
        '- Storage: .storage/ directory\n' +
        '- Maximum call duration: [Add if applicable]\n\n' +
        '## Project Goals\n\n' +
        '- [ ] Design call flow\n' +
        '- [ ] Implement main script\n' +
        '- [ ] Add global libraries\n' +
        '- [ ] Validate against ES5.1\n' +
        '- [ ] Test with simulator\n' +
        '- [ ] Export for production\n\n' +
        '## Key Files\n\n' +
        '- `callScript_init/globalCode.js` - Shared utilities (loaded first)\n' +
        '- `callScript_init/globalVariables.js` - Global initialization\n' +
        '- `callScripts/main.js` - Main call flow\n' +
        '- `globalLibraries/active/` - Project-specific libraries\n' +
        '- `workflow_state.md` - Current development state (dynamic)\n' +
        '- `AGENTS.md` (root) - Framework documentation\n\n' +
        '## Development Rules\n\n' +
        '1. **Naming**: Use descriptive names (functionName, variableName, CONSTANT_NAME)\n' +
        '2. **Comments**: Document complex logic and business rules\n' +
        '3. **Error Handling**: Always validate data and handle errors gracefully\n' +
        '4. **Logging**: Use logInfo, logWarn, logError for debugging\n' +
        '5. **Validation**: Run validation before deployment\n' +
        '6. **Documentation**: Update this file when architecture, integrations, or persistent settings change\n\n' +
        '## Documentation Maintenance Checklist\n\n' +
        '- Review root `AGENTS.md`, this file, and `workflow_state.md` before starting new work\n' +
        '- Document new decisions under "Key Decisions" with timestamps and reasoning\n' +
        '- Mirror project-specific coding patterns or utilities in `projects/' + data.projectName + '/AGENTS.md`\n' +
        '- Ensure `workflow_state.md` entries are updated after each task (Activity Log + task status)\n' +
        '- Adjust `SETUP.md` only when onboarding steps or tooling change\n\n' +
        '## Links & References\n\n' +
        '- [Vocalls Documentation](https://vocalls.com/docs)\n' +
        '- [ES5.1 Reference](https://www.ecma-international.org/ecma-262/5.1/)\n' +
        '- [Agent Memory Guide](../AGENT_MEMORY_GUIDE.md) - How to use this file effectively\n' +
        '- [Project Folder](./)\n';
}

function buildWorkflowStateTemplate(data) {
    return '# ' + data.projectName + ' - Workflow State\n\n' +
        '**Dynamic Workspace** - Current development progress and task tracking\n\n' +
        '> **Note**: This file tracks current, dynamic state. For stable project context, see `project_config.md`.\n\n' +
        '## Current Phase\n\n' +
        '**Phase**: Planning\n' +
        '**Started**: ' + data.metadata.created + '\n' +
        '**Owner**: ' + data.metadata.initializedBy + '\n\n' +
        '## Development Tasks\n\n' +
        '### Planning Phase\n' +
        '- [ ] Define call flow logic (greeting → menu → actions → conclusion)\n' +
        '- [ ] Identify required APIs/Services (document in project_config.md)\n' +
        '- [ ] Plan error handling strategy (timeouts, failures, fallbacks)\n' +
        '- [ ] Design varObj structure (what variables are needed?)\n\n' +
        '### Implementation Phase\n' +
        '- [ ] Implement globalCode.js utilities (if project-specific functions needed)\n' +
        '- [ ] Implement globalVariables.js initialization (custom varObj setup)\n' +
        '- [ ] Implement main call script (core call flow logic)\n' +
        '- [ ] Add error handling (try/catch, HTTP error handling)\n' +
        '- [ ] Add logging/debugging (logInfo, logWarn, logError)\n\n' +
        '### Validation Phase\n' +
        '- [ ] Validate ES5.1 constraints (`npm run validate -- --callScripts --project ' + data.projectName + '`)\n' +
        '- [ ] Test with simulator (`npm run simulate -- --callScript main --project ' + data.projectName + '`)\n' +
        '- [ ] Test error scenarios (API failures, timeouts, invalid inputs)\n' +
        '- [ ] Review code (readability, maintainability, patterns)\n\n' +
        '### Deployment Phase\n' +
        '- [ ] Run final validation\n' +
        '- [ ] Export for production (`npm run export -- --callScript main --project ' + data.projectName + '`)\n' +
        '- [ ] Document deployment (update project_config.md with deployment notes)\n\n' +
        '## Blueprints (Previous Plans)\n\n' +
        '> Archive old plans here when they change significantly. Include timestamp and reason for change.\n\n' +
        '- Initial project structure created at ' + data.metadata.created + '\n\n' +
        '> **Example format**:\n' +
        '> - Original plan: Use database for customer lookup\n' +
        '>   - Changed: 2025-01-15T16:00:00Z\n' +
        '>   - Reason: Database cache too slow, switched to REST API\n\n' +
        '## Activity Log\n\n' +
        '> Use ISO 8601 format for timestamps: `2025-01-15T10:30:00Z`\n\n' +
        '```text\n' +
        '[' + data.metadata.created + '] Project initialized via wizard ' + WIZARD_VERSION + '\n' +
        '```\n\n' +
        '> **Example format**:\n' +
        '>\n' +
        '> ```text\n' +
        '> [2025-01-15T10:00:00Z] Project initialized\n' +
        '> [2025-01-15T10:15:00Z] Defined call flow: greeting → customer lookup → menu routing\n' +
        '> [2025-01-15T10:30:00Z] Identified Customer API endpoint and auth requirements\n' +
        '> [2025-01-15T14:30:00Z] Completed customer lookup function implementation\n' +
        '> ```\n\n' +
        '## Implementation Rules\n\n' +
        '1. Always check function availability before using (`if (typeof dbQuery !== \'undefined\')`)\n' +
        '2. Use safeGet() for property access (`safeGet(varObj, \'customer.name\', \'Unknown\')`)\n' +
        '3. Use varObj for call-related variables (ani, dnis, language, customer data)\n' +
        '4. Test scripts with: `npm run simulate -- --callScript main --project ' + data.projectName + '`\n' +
        '5. Validate with: `npm run validate -- --callScripts --project ' + data.projectName + '`\n' +
        '6. Update this file after completing tasks (mark `[x]`, add Activity Log entry)\n' +
        '7. Update project_config.md if architecture changes\n\n' +
        '## Next Steps\n\n' +
        '1. Update `project_config.md` with:\n' +
        '   - Project description (what does this IVR flow handle?)\n' +
        '   - Key Decisions section (architectural choices)\n' +
        '   - APIs & Services section (endpoints, auth, timeouts)\n' +
        '2. Design call flow in `callScripts/main.js`\n' +
        '3. Add global libraries as needed in `globalLibraries/active/`\n' +
        '4. Run `npm run simulate -- --callScript main --project ' + data.projectName + '`\n' +
        '5. Iterate and refine\n\n' +
        '## Notes\n\n' +
        '- This file is read by AI assistants for context\n' +
        '- Update after major changes or completions\n' +
        '- Archive blueprints with timestamps for reference\n' +
        '- Keep task descriptions specific and actionable\n' +
        '- Always include timestamps in Activity Log (ISO 8601 format)\n' +
        '- Confirm `project_config.md` and project `AGENTS.md` reflect any changes recorded here\n';
}

function buildSetupGuideTemplate(data) {
    return '# ' + data.projectName + ' - Setup & Getting Started\n\n' +
        '## Project Initialized\n\n' +
        'Project structure created at:\n\n' +
        '`projects/' + data.projectName + '/`\n\n' +
        '## Project Settings Snapshot\n\n' +
        '- Environment: ' + data.settings.env + '\n' +
        '- HTTP Mode: ' + data.settings.httpMode + '\n' +
        '- Storage Mode: ' + data.settings.storageMode + '\n' +
        '- Module Name: ' + data.settings.moduleName + '\n' +
        '- Database URL: ' + data.settings.databaseUrl + '\n\n' +
        '## What\'s Next?\n\n' +
        '### 1. Update Project Configuration\n\n' +
        'Edit `project_config.md` with your:\n' +
        '- **Project description**: What does this IVR flow handle?\n' +
        '- **Key Decisions**: Document architectural choices with timestamps\n' +
        '- **APIs & Services**: Endpoints, authentication, timeouts\n' +
        '- **Performance constraints**: Timeouts, call duration limits\n\n' +
        '> See `AGENT_MEMORY_GUIDE.md` (root) for best practices on using memory files.\n\n' +
        '### 2. Update Workflow State\n\n' +
        'Edit `workflow_state.md` to track:\n' +
        '- Current development phase\n' +
        '- Active tasks (use specific, actionable descriptions)\n' +
        '- Activity log (with ISO 8601 timestamps)\n' +
        '- Next steps\n\n' +
        '### 3. Design Your Call Flow\n\n' +
        'Edit `callScripts/main.js` to implement your call logic:\n\n' +
        '```javascript\n' +
        'logInfo(\'Call received from:\', varObj.ani);\n' +
        '// Add your call flow logic here\n' +
        '```\n\n' +
        '### 4. Add Utilities (if needed)\n\n' +
        'Add project-specific functions to:\n' +
        '- `globalLibraries/active/yourLibrary.js`\n\n' +
        '### 5. Test Your Script\n\n' +
        '```bash\n' +
        'npm run simulate -- --callScript main --project ' + data.projectName + '\n' +
        '```\n\n' +
        '### 6. Validate ES5.1 Constraints\n\n' +
        '```bash\n' +
        'npm run validate -- --callScripts --project ' + data.projectName + '\n' +
        '```\n\n' +
        '### 7. Export for Production\n\n' +
        '```bash\n' +
        'npm run export -- --callScript main --project ' + data.projectName + '\n' +
        '```\n\n' +
        '## Project Structure\n\n' +
        'projects/' + data.projectName + '/\n' +
        '├── callScript_init/\n' +
        '│   ├── globalCode.js         # Shared utilities (loaded first)\n' +
        '│   └── globalVariables.js    # Global initialization\n' +
        '├── callScripts/\n' +
        '│   └── main.js               # Main call flow\n' +
        '├── globalLibraries/\n' +
        '│   └── active/               # Project-specific libraries\n' +
        '├── exported_callscripts/    # Production exports\n' +
        '├── project_config.md        # AI context (long-term memory)\n' +
        '├── workflow_state.md         # Development progress tracker\n' +
        '├── AGENTS.md                 # Project-specific documentation\n' +
        '└── SETUP.md                  # This file\n\n' +
        '## AI Workflow Context\n\n' +
        '### Memory Files Used by AI Assistants\n\n' +
        'This project uses a three-layer memory system:\n\n' +
        '1. **`AGENTS.md`** (root) - Framework rules (rarely changes)\n' +
        '2. **`project_config.md`** - Project memory (stable context)\n' +
        '3. **`workflow_state.md`** - Current state (frequently updated)\n\n' +
        '### Best Practices\n\n' +
        '- **`project_config.md`**: Keep stable, long-term info (decisions, APIs, architecture)\n' +
        '- **`workflow_state.md`**: Keep current, dynamic info (tasks, activity log, next steps)\n' +
        '- Always include ISO 8601 timestamps: `2025-01-15T10:30:00Z`\n' +
        '- Use specific, actionable task descriptions\n' +
        '- Update `workflow_state.md` after completing tasks\n' +
        '- Update `project_config.md` if architecture changes\n\n' +
        'See `AGENT_MEMORY_GUIDE.md` (root) for complete guide.\n\n' +
        '## Key Concepts\n\n' +
        '### varObj - Call Variables\n\n' +
        'Use this for call-related data:\n\n' +
        '```javascript\n' +
        'varObj.ani = context.callInfo.fromUri;      // Caller number\n' +
        'varObj.dnis = context.callInfo.toUri;       // Dialed number\n' +
        'varObj.language = context.language;         // Call language\n' +
        'varObj.customer = { id: "123", name: "John" };  // Customer data\n' +
        '```\n\n' +
        '### context - Vocalls Context\n\n' +
        'Access call information:\n\n' +
        '```javascript\n' +
        'context.callInfo.callGuid                    // Unique call ID\n' +
        'context.callInfo.fromUri                     // Caller\n' +
        'context.callInfo.toUri                       // Dialed number\n' +
        'context.callInfo.direction                   // "inbound" or "outbound"\n' +
        'context.session.variables                    // Persistent variables\n' +
        'context.language                             // Call language\n' +
        '```\n\n' +
        '### Available Global Functions\n\n' +
        '- `logInfo()`, `logWarn()`, `logError()`, `logDebug()` - Logging\n' +
        '- `nowUTC()` - Get current UTC timestamp\n' +
        '- `safeGet(obj, key, default)` - Safe property access\n' +
        '- `getPath(obj, path)` - Nested property access\n' +
        '- `generateId()` - Generate unique ID\n' +
        '- `isEmpty(obj)` - Check if empty\n' +
        '- `isValidObject(obj)` - Validate object\n\n' +
        '## Troubleshooting\n\n' +
        '### Script not found\n\n' +
        'Make sure `callScripts/main.js` exists and run:\n\n' +
        '```bash\n' +
        'npm run simulate -- --callScript main --project ' + data.projectName + '\n' +
        '```\n\n' +
        '### ES5.1 validation errors\n\n' +
        'Common issues:\n' +
        '- Replace `let` or `const` with `var`\n' +
        '- Replace arrow functions `() => {}` with `function() {}`\n' +
        '- Replace `.catch()` with `.then(success, failure)`\n' +
        '- Replace optional chaining `?.` with safeGet()\n\n' +
        '### Database errors\n\n' +
        'If database functions return null:\n' +
        '1. Check if service is running: `cd vocalls-database-service && npm start`\n' +
        '2. Verify availability: `if (typeof dbQuery !== "undefined") { ... }`\n\n' +
        '### Documentation Maintenance\n\n' +
        '- Review root `AGENTS.md`, this project\'s `project_config.md`, and `workflow_state.md` before coding\n' +
        '- Update `project_config.md` with new decisions, integrations, or settings right after implementing them\n' +
        '- Log every completed task in `workflow_state.md` (checklist + Activity Log entry with timestamp)\n' +
        '- Update project `AGENTS.md` whenever you add project-specific patterns or utilities\n' +
        '- Modify `SETUP.md` only when onboarding requirements change\n\n' +
        '## Documentation\n\n' +
        '- `project_config.md` - Long-term project context\n' +
        '- `workflow_state.md` - Development progress\n' +
        '- Root `AGENTS.md` - Framework documentation\n' +
        '- Root `AGENT_MEMORY_GUIDE.md` - Memory management guide\n\n' +
        '---\n\n' +
        '**Created**: ' + data.metadata.created + '\n' +
        '**Project**: ' + data.projectName + '\n' +
        '**Framework**: Vocalls Development Template\n';
}

function buildProjectAgentsTemplate(data) {
    return '# ' + data.projectName + ' - Project Documentation\n\n' +
        '**Customer**: ' + (data.metadata.customerName || '—') + '\n' +
        '**Created**: ' + data.metadata.created + '\n' +
        '**Initialized By**: ' + data.metadata.initializedBy + '\n' +
        '**Wizard Version**: ' + WIZARD_VERSION + '\n\n' +
        '## Project Settings\n\n' +
        '- Environment: ' + data.settings.env + '\n' +
        '- HTTP Mode: ' + data.settings.httpMode + '\n' +
        '- Storage Mode: ' + data.settings.storageMode + '\n' +
        '- Module Name: ' + data.settings.moduleName + '\n' +
        '- Database URL: ' + data.settings.databaseUrl + '\n\n' +
        '## Project-Specific Rules\n\n' +
        '- [Add rules for the engineering team working on this project]\n\n' +
        '## Documentation Expectations\n\n' +
        '- Review root `AGENTS.md`, this file, `project_config.md`, and `workflow_state.md` before making changes\n' +
        '- Document new project-specific utilities, naming patterns, or integrations here immediately\n' +
        '- Record architectural decisions and external services in `project_config.md` with timestamps\n' +
        '- Update `workflow_state.md` activity log and checklists after each task\n' +
        '- Adjust `SETUP.md` only when onboarding steps, tooling, or dependencies change\n\n' +
        '## Custom Libraries\n\n' +
        '- [List and describe global libraries in `globalLibraries/active/`]\n\n' +
        '## Business Logic & Call Flow\n\n' +
        '- [Document key nodes, transitions, and intents]\n\n' +
        '## External Integrations\n\n' +
        '- [List APIs, credentials, and integration details]\n\n' +
        '## Testing & Verification\n\n' +
        '- [Describe test scenarios, happy path, error handling]\n\n' +
        '---\n\n' +
        'See root `AGENTS.md` for framework-wide standards and tools.\n';
}

function initializeProjectFiles(data) {
    var projectDir = projectPath(data.projectName);
    var overwrite = data.overwrite;

    var steps = [
        {
            label: 'Creating project directories',
            action: function() {
                ensureProjectsDirectory();
                fs.mkdirSync(projectDir, { recursive: true });
                fs.mkdirSync(path.join(projectDir, 'callScript_init'), { recursive: true });
                fs.mkdirSync(path.join(projectDir, 'callScripts'), { recursive: true });
                fs.mkdirSync(path.join(projectDir, 'globalLibraries', 'active'), { recursive: true });
                fs.mkdirSync(path.join(projectDir, 'exported_callscripts'), { recursive: true });
            }
        },
        {
            label: 'Generating callScript_init/globalCode.js',
            action: function() {
                writeFileSafe(path.join(projectDir, 'callScript_init', 'globalCode.js'), buildGlobalCodeTemplate(data), overwrite);
            }
        },
        {
            label: 'Generating callScript_init/globalVariables.js',
            action: function() {
                writeFileSafe(path.join(projectDir, 'callScript_init', 'globalVariables.js'), buildGlobalVariablesTemplate(data), overwrite);
            }
        },
        {
            label: 'Generating callScripts/main.js',
            action: function() {
                writeFileSafe(path.join(projectDir, 'callScripts', 'main.js'), buildMainScriptTemplate(data), overwrite);
            }
        },
        {
            label: 'Generating documentation templates',
            action: function() {
                writeFileSafe(path.join(projectDir, 'project_config.md'), buildProjectConfigTemplate(data), overwrite);
                writeFileSafe(path.join(projectDir, 'workflow_state.md'), buildWorkflowStateTemplate(data), overwrite);
                writeFileSafe(path.join(projectDir, 'SETUP.md'), buildSetupGuideTemplate(data), overwrite);
                writeFileSafe(path.join(projectDir, 'AGENTS.md'), buildProjectAgentsTemplate(data), overwrite);
            }
        }
    ];

    steps.forEach(function(step, index) {
        var prefix = '[' + (index + 1) + '/' + steps.length + '] ';
        step.action();
        log('green', prefix + step.label + ' ✓');
    });
}

function updateConfig(configPath, config, data) {
    var projectEntry = buildPathConfig(data.projectName);
    projectEntry.settings = {
        env: data.settings.env,
        httpMode: data.settings.httpMode,
        storageMode: data.settings.storageMode,
        moduleName: data.settings.moduleName,
        databaseUrl: data.settings.databaseUrl
    };
    projectEntry.metadata = {
        customerName: data.metadata.customerName,
        description: data.metadata.description,
        created: data.metadata.created,
        initializedBy: data.metadata.initializedBy,
        wizardVersion: WIZARD_VERSION
    };

    config.projects[data.projectName] = projectEntry;
    config.activeProject = data.projectName;
    if (!config.databaseUrl) {
        config.databaseUrl = DEFAULT_DATABASE_URL;
    }

    saveEnvConfig(configPath, config);
    log('green', '✓ env.config.json updated (active project: ' + data.projectName + ')');
}

function initializeNpm() {
    var packagePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) {
        log('yellow', '⚠ package.json not found - please run "npm install" in template root');
        return;
    }
    log('green', '✓ npm environment detected');
}

function suggestDatabaseSetup(databaseStatus) {
    if (databaseStatus.available) {
        log('green', 'Database service detected at ' + databaseStatus.url);
        return;
    }
    log('yellow', '\nOptional: Database Service Setup');
    console.log('  cd vocalls-database-service');
    console.log('  npm install');
    console.log('  npm run init-db');
    console.log('  npm start\n');
    console.log('Then use dbQuery(), dbExecute() in your scripts.');
}

function showWelcome(context) {
    header('VOCALLS SMART PROJECT WIZARD');
    console.log('This wizard will guide you through setting up a new project with per-project settings, documentation, and starter code.\n');

    if (context.existingProjects.length > 0) {
        log('blue', 'Found ' + context.existingProjects.length + ' existing project(s): ' + context.existingProjects.join(', '));
    } else {
        log('blue', 'No existing projects detected. A new workspace entry will be created.');
    }

    if (context.config.activeProject) {
        log('blue', 'Current active project: ' + context.config.activeProject);
    } else {
        log('yellow', 'No active project currently set.');
    }

    if (context.databaseStatus.status === 'reachable') {
        log('green', 'Database service reachable at ' + context.databaseStatus.url);
    } else if (context.databaseStatus.status === 'invalid-url') {
        log('yellow', 'Database URL is invalid. Default will be used.');
    } else {
        log('yellow', 'Database service not detected (status: ' + context.databaseStatus.status + ')');
    }

    console.log('');
}

function promptProjectName(context, data) {
    return askWithDefault('Enter project name (lowercase, alphanumeric, hyphens):', data.projectName || '', 'Project names must be lowercase and may include hyphens or underscores. Example: energyline_support').then(function(input) {
        var proposed = sanitizeProjectName(input);
        if (!isValidProjectName(proposed)) {
            log('red', 'Invalid project name. Use lowercase letters, numbers, hyphens, underscores (3-50 chars).');
            return promptProjectName(context, data);
        }

        var exists = projectExists(proposed);
        data.projectName = proposed;

        if (exists) {
            log('yellow', '⚠ Project "' + proposed + '" already exists.');
            return askYesNo('Overwrite starter files in this project? (yes/no)', false, 'Only starter files (globalCode.js, globalVariables.js, main.js, documentation) will be replaced. Custom files remain untouched.').then(function(overwrite) {
                if (!overwrite) {
                    var suggestionA = proposed + '-new';
                    var suggestionB = proposed + '-' + new Date().getFullYear();
                    log('yellow', 'Try another name, e.g. "' + suggestionA + '" or "' + suggestionB + '".');
                    return promptProjectName(context, data);
                }
                data.overwrite = true;
                return data;
            });
        }

        data.overwrite = false;
        return data;
    });
}

function promptCustomerInfo(data) {
    var suggestion = deriveCustomerFromProject(data.projectName);
    return askWithDefault('Customer name (enter to accept "' + suggestion + '"):', suggestion, 'Used for documentation and logging.').then(function(customer) {
        data.metadata.customerName = customer;
        return askWithDefault('Project description (single line, optional):', data.metadata.description || '', 'Describe the IVR project purpose.').then(function(description) {
            data.metadata.description = description;
            return data;
        });
    });
}

function promptEnvironmentSettings(context, data) {
    var defaults = context.defaults;
    return askWithDefault('Default environment (acc/prd/dvp):', defaults.env, 'acc = acceptance/testing, prd = production, dvp = development').then(function(envValue) {
        envValue = envValue.toLowerCase();
        if (['acc', 'prd', 'dvp'].indexOf(envValue) === -1) {
            log('yellow', 'Environment must be one of: acc, prd, dvp.');
            return promptEnvironmentSettings(context, data);
        }
        data.settings.env = envValue;

        return askWithDefault('Default HTTP mode (real/stub):', defaults.httpMode, 'real = actual HTTP calls, stub = mock responses for offline testing').then(function(httpMode) {
            httpMode = httpMode.toLowerCase();
            if (['real', 'stub'].indexOf(httpMode) === -1) {
                log('yellow', 'HTTP mode must be "real" or "stub".');
                return promptEnvironmentSettings(context, data);
            }
            data.settings.httpMode = httpMode;

            return askWithDefault('Default storage mode (disk/memory):', defaults.storageMode, 'disk = persistent across runs, memory = transient for quick tests').then(function(storageMode) {
                storageMode = storageMode.toLowerCase();
                if (['disk', 'memory'].indexOf(storageMode) === -1) {
                    log('yellow', 'Storage mode must be "disk" or "memory".');
                    return promptEnvironmentSettings(context, data);
                }
                data.settings.storageMode = storageMode;

                return askWithDefault('Module name (identifier in Vocalls):', data.settings.moduleName, 'Used for namespace separation.').then(function(moduleName) {
                    data.settings.moduleName = moduleName || (data.projectName + '-module');
                    return askWithDefault('Database service URL:', data.settings.databaseUrl, 'Default local database URL.').then(function(dbUrl) {
                        data.settings.databaseUrl = dbUrl || DEFAULT_DATABASE_URL;
                        return data;
                    });
                });
            });
        });
    });
}

function promptModuleName(data) {
    return askWithDefault('Module name:', data.settings.moduleName, 'Used to identify the project in Vocalls.').then(function(moduleName) {
        data.settings.moduleName = moduleName || (data.projectName + '-module');
        return data;
    });
}

function promptDatabaseUrl(data) {
    return askWithDefault('Database service URL:', data.settings.databaseUrl, 'Provide full URL (e.g. http://localhost:3001).').then(function(dbUrl) {
        data.settings.databaseUrl = dbUrl || DEFAULT_DATABASE_URL;
        return data;
    });
}

function promptEditMenu(context, data) {
    console.log('');
    console.log('Edit menu:');
    console.log('  1) Project name');
    console.log('  2) Customer name');
    console.log('  3) Description');
    console.log('  4) Environment');
    console.log('  5) HTTP mode');
    console.log('  6) Storage mode');
    console.log('  7) Module name');
    console.log('  8) Database URL');
    console.log('  9) Done editing');

    return askWithDefault('Select item to edit (1-9):', '', '').then(function(choice) {
        switch (choice) {
            case '1':
                return promptProjectName(context, data).then(function() {
                    data.settings.moduleName = data.projectName + '-module';
                    return promptEditMenu(context, data);
                });
            case '2':
                return askWithDefault('Customer name:', data.metadata.customerName || '', '').then(function(customer) {
                    data.metadata.customerName = customer;
                    return promptEditMenu(context, data);
                });
            case '3':
                return askWithDefault('Project description:', data.metadata.description || '', '').then(function(description) {
                    data.metadata.description = description;
                    return promptEditMenu(context, data);
                });
            case '4':
                return askWithDefault('Environment (acc/prd/dvp):', data.settings.env, '').then(function(envValue) {
                    envValue = envValue.toLowerCase();
                    if (['acc', 'prd', 'dvp'].indexOf(envValue) === -1) {
                        log('yellow', 'Environment must be acc, prd, or dvp.');
                        return promptEditMenu(context, data);
                    }
                    data.settings.env = envValue;
                    return promptEditMenu(context, data);
                });
            case '5':
                return askWithDefault('HTTP mode (real/stub):', data.settings.httpMode, '').then(function(httpMode) {
                    httpMode = httpMode.toLowerCase();
                    if (['real', 'stub'].indexOf(httpMode) === -1) {
                        log('yellow', 'HTTP mode must be real or stub.');
                        return promptEditMenu(context, data);
                    }
                    data.settings.httpMode = httpMode;
                    return promptEditMenu(context, data);
                });
            case '6':
                return askWithDefault('Storage mode (disk/memory):', data.settings.storageMode, '').then(function(storageMode) {
                    storageMode = storageMode.toLowerCase();
                    if (['disk', 'memory'].indexOf(storageMode) === -1) {
                        log('yellow', 'Storage mode must be disk or memory.');
                        return promptEditMenu(context, data);
                    }
                    data.settings.storageMode = storageMode;
                    return promptEditMenu(context, data);
                });
            case '7':
                return promptModuleName(data).then(function() {
                    return promptEditMenu(context, data);
                });
            case '8':
                return promptDatabaseUrl(data).then(function() {
                    return promptEditMenu(context, data);
                });
            case '9':
            case '':
                return data;
            default:
                log('yellow', 'Unknown selection. Please choose 1-9.');
                return promptEditMenu(context, data);
        }
    });
}

function gatherProjectData(context) {
    var data = {
        projectName: '',
        overwrite: false,
        quickStart: false,
        settings: {
            env: context.defaults.env,
            httpMode: context.defaults.httpMode,
            storageMode: context.defaults.storageMode,
            moduleName: '',
            databaseUrl: context.databaseStatus.url || DEFAULT_DATABASE_URL
        },
        metadata: {
            customerName: '',
            description: '',
            created: new Date().toISOString(),
            initializedBy: os.userInfo().username,
            wizardVersion: WIZARD_VERSION
        }
    };

    showWelcome(context);

    return askYesNo('Use smart defaults for settings? (yes/no)', false, 'Smart defaults use inferred settings based on existing projects. You can edit them later.').then(function(quickStart) {
        data.quickStart = quickStart;
        return promptProjectName(context, data);
    }).then(function() {
        if (data.quickStart) {
            data.metadata.customerName = deriveCustomerFromProject(data.projectName);
            data.metadata.description = '';
            data.settings.moduleName = data.projectName + '-module';
            data.settings.databaseUrl = context.databaseStatus.url || DEFAULT_DATABASE_URL;
            return data;
        }

        return promptCustomerInfo(data).then(function() {
            data.settings.moduleName = data.projectName + '-module';
            return promptEnvironmentSettings(context, data);
        });
    }).then(function() {
        if (data.quickStart) {
            data.settings.env = context.defaults.env;
            data.settings.httpMode = context.defaults.httpMode;
            data.settings.storageMode = context.defaults.storageMode;
            if (!data.metadata.customerName) {
                data.metadata.customerName = deriveCustomerFromProject(data.projectName);
            }
            if (!data.settings.databaseUrl) {
                data.settings.databaseUrl = DEFAULT_DATABASE_URL;
            }
        }
        return data;
    });
}

function confirmConfiguration(context, data) {
    renderSummaryTable(data);
    console.log('');
    return askWithDefault('Proceed with these settings? (yes/no/edit):', 'yes', '').then(function(answer) {
        var normalized = answer.toLowerCase();
        if (normalized === 'yes' || normalized === 'y') {
            return true;
        }
        if (normalized === 'no' || normalized === 'n') {
            return false;
        }
        if (normalized === 'edit' || normalized === 'e') {
            return promptEditMenu(context, data).then(function() {
                return confirmConfiguration(context, data);
            });
        }
        log('yellow', 'Please answer yes, no, or edit.');
        return confirmConfiguration(context, data);
    });
}

function finalizeWizard(context, data) {
    header('INITIALIZING PROJECT: ' + data.projectName);
    initializeProjectFiles(data);
    updateConfig(context.configPath, context.config, data);
    initializeNpm();
    header('PROJECT INITIALIZED SUCCESSFULLY');

    log('green', '✅ Project ' + data.projectName + ' is ready!\n');
    console.log(colors.bright + 'Next steps:' + colors.reset);
    console.log('  1. Test:    npm run simulate -- --callScript main --project ' + data.projectName);
    console.log('  2. Validate: npm run validate -- --callScripts --project ' + data.projectName);
    console.log('  3. Export:   npm run export -- --callScript main --project ' + data.projectName);
    console.log('\nProject directory: ' + projectPath(data.projectName));
    console.log('Active project set to: ' + data.projectName + '\n');

    suggestDatabaseSetup(context.databaseStatus);
    log('blue', '\nSee projects/' + data.projectName + '/SETUP.md for detailed guidance.');
}

function runWizard() {
    var configPath = path.join(process.cwd(), 'env.config.json');
    var config = loadEnvConfig(configPath);
    ensureProjectsDirectory();
    var defaults = inferDefaultSettings(config);

    return detectDatabaseService(DEFAULT_DATABASE_URL).then(function(databaseStatus) {
        var context = {
            configPath: configPath,
            config: config,
            defaults: defaults,
            existingProjects: listExistingProjects(config),
            databaseStatus: databaseStatus
        };

        return gatherProjectData(context).then(function(data) {
            return confirmConfiguration(context, data).then(function(confirmed) {
                if (!confirmed) {
                    log('yellow', 'Initialization cancelled. No changes were made.');
                    rl.close();
                    process.exit(0);
                }
                finalizeWizard(context, data);
                rl.close();
            });
        });
    }).catch(function(error) {
        log('red', 'Wizard error: ' + error.message);
        rl.close();
        process.exit(1);
    });
}

runWizard();


