#!/usr/bin/env node

/**
 * CLI Simulate - Run Vocalls scripts in simulation environment
 *
 * Usage:
 *   node cli/simulate.js --callScript main
 *   node cli/simulate.js --callScript simpleTest --env prd --mode stub
 *   npm run simulate -- --callScript main
 */

var fs = require('fs');
var path = require('path');
var core = require('../core/minimalVocallsCore');
var vocallsContext = require('../vocalls_session_init/vocallsContext');
var loader = require('../core/loader');

var DEFAULT_DATABASE_URL = 'http://localhost:3001';

/**
 * Ensure script is run from project root directory
 * Throws error if not in correct location
 */
function ensureProjectRoot() {
    var cwd = process.cwd();
    var configPath = path.resolve(cwd, 'env.config.json');
    var cliPath = path.resolve(cwd, 'cli', 'simulate.js');
    
    // Check if env.config.json exists (indicates project root)
    if (!fs.existsSync(configPath)) {
        console.error('Error: Must run from project root directory');
        console.error('Current directory:', cwd);
        console.error('Expected: directory containing env.config.json');
        console.error('');
        console.error('Please run:');
        console.error('  cd <project-root>');
        console.error('  node cli/simulate.js --callScript <script-name>');
        process.exit(1);
    }
    
    // Verify CLI script exists (double-check we're in right place)
    if (!fs.existsSync(cliPath)) {
        console.error('Error: CLI script not found at expected location');
        console.error('Current directory:', cwd);
        console.error('Expected:', path.resolve(cwd, 'cli', 'simulate.js'));
        process.exit(1);
    }
}

// Parse command line arguments
function parseArgs() {
    var args = process.argv.slice(2);
    var options = {
        script: null,
        callScript: null,
        env: null,
        mode: null,
        storage: null,
        project: null,
        listProjects: false
    };

    for (var i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--script':
                options.script = args[++i];
                break;
            case '--callScript':
            case '--call-script':
                options.callScript = args[++i];
                break;
            case '--env':
                options.env = args[++i];
                break;
            case '--mode':
                options.mode = args[++i];
                break;
            case '--storage':
                options.storage = args[++i];
                break;
            case '--project':
                options.project = args[++i];
                break;
            case '--list-projects':
                options.listProjects = true;
                break;
            case '--help':
            case '-h':
                showHelp();
                process.exit(0);
                break;
            default:
                if (args[i].startsWith('--')) {
                    console.error('Unknown option:', args[i]);
                    showHelp();
                    process.exit(1);
                }
        }
    }

    // Default to main if no script specified
    if (!options.script && !options.callScript) {
        options.callScript = 'main';
        console.log('No script specified, defaulting to callScript: main');
    }

    // Validate that only one script type is specified
    if (options.script && options.callScript) {
        console.error('Error: Cannot specify both --script and --callScript. Use one or the other.');
        showHelp();
        process.exit(1);
    }

    return options;
}

function showHelp() {
    console.log(`
Vocalls Script Simulator

Usage: node cli/simulate.js [options]
       npm run simulate -- [options]

Options:
  --script <path>         Path to JavaScript file to simulate
  --callScript <name>     Name of call script in callScripts/ directory [default: main]
  --project <name>        Project name to use [default: example-starter]
  --list-projects         Show all configured projects and exit
  --env <env>             Target environment (acc|prd|dvp) [default: project setting]
  --mode <mode>           Execution mode (real|stub) [default: project setting]
  --storage <mode>        Storage backend (disk|memory) [default: project setting]
  -h, --help              Show this help message

Note: Use either --script OR --callScript, not both.
      Must be run from project root directory.

Examples:
  node cli/simulate.js                                    # Uses main by default
  node cli/simulate.js --callScript main                 # Main call script with global libraries
  node cli/simulate.js --callScript simpleTest           # Simple test script
  node cli/simulate.js --script test-script.js          # Load arbitrary script
  node cli/simulate.js --callScript myScript --mode stub    # Use stub mode with call script
  npm run simulate -- --callScript main                  # Using npm script
`);
}

function main() {
    // Ensure we're in project root before proceeding
    ensureProjectRoot();
    
    var options = parseArgs();

    // Load environment config to get debug logging setting
    var envConfig = loader.loadEnvConfig();

    if (options.listProjects) {
        var projectNames = Object.keys(envConfig.projects || {});
        console.log('Configured projects:');
        if (projectNames.length === 0) {
            console.log('  (none)');
        } else {
            projectNames.forEach(function(name) {
                var projectEntry = envConfig.projects[name] || {};
                var settings = projectEntry.settings || {};
                console.log('  - ' + name + ' (env: ' + (settings.env || envConfig.env || 'acc') + ', module: ' + (settings.moduleName || envConfig.moduleName || 'vocalls-env') + ')');
            });
        }
        process.exit(0);
    }

    var projectDetails = loader.loadProjectConfig(options.project);
    var selectedProjectName = projectDetails ? projectDetails.name : (options.project || envConfig.activeProject || 'example-starter');

    var baseSettings = {
        env: envConfig.env || 'acc',
        httpMode: envConfig.httpMode || 'real',
        storageMode: envConfig.storageMode || 'disk',
        moduleName: envConfig.moduleName || 'vocalls-env',
        databaseUrl: envConfig.databaseUrl || DEFAULT_DATABASE_URL
    };

    if (projectDetails && projectDetails.settings) {
        baseSettings = projectDetails.settings;
    } else if (selectedProjectName && selectedProjectName !== 'example-starter' && (!baseSettings.moduleName || baseSettings.moduleName === 'vocalls-env')) {
        baseSettings.moduleName = selectedProjectName + '-module';
    }

    if (!projectDetails && options.project) {
        console.warn('Project "' + options.project + '" not found in env.config.json. Using inferred paths in projects/' + options.project + '/');
    }

    var callScriptsPath;
    if (projectDetails && projectDetails.config && projectDetails.config.callScriptsPath) {
        callScriptsPath = projectDetails.config.callScriptsPath;
    } else if (selectedProjectName) {
        callScriptsPath = 'projects/' + selectedProjectName + '/callScripts';
    } else {
        callScriptsPath = 'projects/example-starter/callScripts';
    }

    // Show simulator header
    var envOverridden = options.env !== null;
    var modeOverridden = options.mode !== null;
    var storageOverridden = options.storage !== null;
    var resolvedEnv = (options.env || baseSettings.env || 'acc').toLowerCase();
    var resolvedHttpMode = (options.mode || baseSettings.httpMode || 'real').toLowerCase();
    var resolvedStorage = (options.storage || baseSettings.storageMode || 'disk').toLowerCase();
    var resolvedModuleName = baseSettings.moduleName || 'vocalls-env';
    var resolvedDatabaseUrl = baseSettings.databaseUrl || DEFAULT_DATABASE_URL;

    options.env = resolvedEnv;
    options.mode = resolvedHttpMode;
    options.storage = resolvedStorage;

    var allowedEnvs = ['acc', 'prd', 'dvp'];
    if (allowedEnvs.indexOf(resolvedEnv) === -1) {
        console.warn('Unknown environment "' + resolvedEnv + '", defaulting to acc.');
        resolvedEnv = 'acc';
        options.env = 'acc';
    }

    var allowedModes = ['real', 'stub'];
    if (allowedModes.indexOf(resolvedHttpMode) === -1) {
        console.warn('Unknown HTTP mode "' + resolvedHttpMode + '", defaulting to real.');
        resolvedHttpMode = 'real';
        options.mode = 'real';
    }

    var allowedStorage = ['disk', 'memory'];
    if (allowedStorage.indexOf(resolvedStorage) === -1) {
        console.warn('Unknown storage mode "' + resolvedStorage + '", defaulting to disk.');
        resolvedStorage = 'disk';
        options.storage = 'disk';
    }

    console.log('Vocalls Script Simulator');
    console.log('========================');
    if (options.callScript) {
        console.log('Project:', selectedProjectName);
        console.log('Call Script:', options.callScript + ' (from ' + callScriptsPath + '/)');
    } else {
        console.log('Script:', options.script);
    }
    console.log('Environment:', resolvedEnv + (envOverridden ? '' : ' (project default)'));
    console.log('HTTP Mode:', resolvedHttpMode + (modeOverridden ? '' : ' (project default)'));
    console.log('Storage Mode:', resolvedStorage + (storageOverridden ? '' : ' (project default)'));
    console.log('Module Name:', resolvedModuleName);
    if (resolvedDatabaseUrl) {
        console.log('Database URL:', resolvedDatabaseUrl);
    }
    console.log();

    // Determine script path and check existence
    var scriptPath;
    if (options.callScript) {
        scriptPath = path.resolve(process.cwd(), callScriptsPath, options.callScript + '.js');
        if (!fs.existsSync(scriptPath)) {
            console.error('Error: Call script not found:', scriptPath);
            console.error('');
            console.error('Available scripts in', callScriptsPath + ':');
            try {
                var files = fs.readdirSync(path.resolve(process.cwd(), callScriptsPath))
                    .filter(function(f) { return f.endsWith('.js'); });
                if (files.length > 0) {
                    files.forEach(function(f) { console.error('  -', f.replace('.js', '')); });
                } else {
                    console.error('  (no .js files found)');
                }
            } catch (e) {
                console.error('  (could not read directory)');
            }
            process.exit(1);
        }
    } else {
        scriptPath = path.resolve(process.cwd(), options.script);
        if (!fs.existsSync(scriptPath)) {
            console.error('Error: Script file not found:', scriptPath);
            process.exit(1);
        }
    }

    try {
        // Create session context
        var seed = vocallsContext.createDefaultSeed('inbound', {
            session: {
                variables: {
                    VOCALLS_ENV: resolvedEnv,
                    SIMULATION_MODE: resolvedHttpMode
                }
            },
            settings: {
                moduleName: resolvedModuleName,
                defaultEnvironment: resolvedEnv
            }
        });

        var sandbox = vocallsContext.buildSessionContext(seed, {
            httpMode: resolvedHttpMode,
            storageMode: resolvedStorage,
            logging: true,
            projectSettings: {
                env: baseSettings.env,
                httpMode: baseSettings.httpMode,
                storageMode: baseSettings.storageMode,
                moduleName: resolvedModuleName,
                databaseUrl: resolvedDatabaseUrl
            },
            projectName: selectedProjectName,
            databaseUrl: resolvedDatabaseUrl,
            environment: resolvedEnv
        });

        console.log('✓ Session context created');

        // Use script loader - global libraries first, then user script
        var userScript = options.callScript ? (callScriptsPath + '/' + options.callScript + '.js') : options.script;

        sandbox = loader.executeScripts({
            sandbox: sandbox,
            userScript: userScript,
            validateScripts: true,
            projectName: selectedProjectName
        });

        var executionMeta = loader.getExecutionMetadata(sandbox);

        console.log('✓ Script execution completed');

    } catch (error) {
        console.error('Simulator error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

