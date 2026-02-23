#!/usr/bin/env node

/**
 * CLI Export - Generate paste-ready ES5 code for Vocalls deployment
 * Supports project-specific paths and uses loader for proper script bundling
 * 
 * Usage:
 *   node cli/export.js --callScript main
 *   node cli/export.js --callScript main --project example-starter
 *   node cli/export.js --script path/to/script.js
 */

var fs = require('fs');
var path = require('path');
var core = require('../core/minimalVocallsCore');
var loader = require('../core/loader');

var DEFAULT_DATABASE_URL = 'http://localhost:3001';

/**
 * Ensure script is run from project root directory
 */
function ensureProjectRoot() {
    var cwd = process.cwd();
    var configPath = path.resolve(cwd, 'env.config.json');
    
    if (!fs.existsSync(configPath)) {
        console.error('Error: Must run from project root directory');
        console.error('Current directory:', cwd);
        console.error('Expected: directory containing env.config.json');
        console.error('');
        console.error('Please run:');
        console.error('  cd <project-root>');
        console.error('  node cli/export.js --callScript <script-name>');
        process.exit(1);
    }
}

/**
 * Load project configuration from env.config.json
 */
function loadProjectConfig(projectName) {
    var projectDetails = loader.loadProjectConfig(projectName);
    if (projectDetails) {
        return projectDetails;
    }

    var fallbackName = projectName || 'example-starter';
    return {
        name: fallbackName,
        config: {
            callScriptInitPath: 'projects/' + fallbackName + '/callScript_init',
            callScriptsPath: 'projects/' + fallbackName + '/callScripts',
            globalLibrariesPath: 'projects/' + fallbackName + '/globalLibraries/active',
            exportedPath: 'projects/' + fallbackName + '/exported_callscripts'
        }
    };
}

function parseArgs() {
    var args = process.argv.slice(2);
    var options = {
        script: null,
        callScript: null,
        output: null,
        format: 'plain',
        validate: true,
        project: null
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
            case '--output':
                options.output = args[++i];
                break;
            case '--format':
                options.format = args[++i];
                break;
            case '--project':
                options.project = args[++i];
                break;
            case '--no-validate':
                options.validate = false;
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
    
    if (!options.script && !options.callScript) {
        console.error('Error: --script or --callScript parameter is required');
        showHelp();
        process.exit(1);
    }
    
    if (options.script && options.callScript) {
        console.error('Error: Cannot specify both --script and --callScript');
        showHelp();
        process.exit(1);
    }
    
    return options;
}

function showHelp() {
    console.log('');
    console.log('Vocalls Code Export Tool');
    console.log('');
    console.log('Usage: node cli/export.js [options]');
    console.log('       npm run export -- [options]');
    console.log('');
    console.log('Options:');
    console.log('  --script <path>       Path to JavaScript file to export');
    console.log('  --callScript <name>   Name of call script in callScripts/ directory');
    console.log('  --output <path>      Output file path [default: <script>-vocalls-ready.js]');
    console.log('  --project <name>     Project name [default: example-starter]');
    console.log('  --format <format>    Output format (plain) [default: plain]');
    console.log('  --no-validate        Skip ES5.1 constraint validation');
    console.log('  -h, --help           Show this help message');
    console.log('');
    console.log('Note: Must be run from project root directory.');
    console.log('      Use either --script OR --callScript, not both.');
    console.log('');
    console.log('Examples:');
    console.log('  node cli/export.js --callScript main');
    console.log('  node cli/export.js --callScript main --output production.js');
    console.log('  node cli/export.js --script examples/simple-routing.js');
    console.log('  npm run export -- --callScript main');
    console.log('');
}

function bundleScriptWithLoader(scriptPath, projectConfig) {
    // Create a minimal sandbox for bundling
    var sandbox = {
        logInfo: function() {},
        logWarn: function() {},
        logError: function() {},
        logDebug: function() {}
    };
    
    try {
        // Use loader to execute scripts and collect all code
        var userScript = path.relative(process.cwd(), scriptPath);
        sandbox = loader.executeScripts({
            sandbox: sandbox,
            userScript: userScript,
            validateScripts: false, // Don't validate during bundling
            projectName: projectConfig.name
        });
        
        // Get execution metadata
        var metadata = loader.getExecutionMetadata(sandbox);
        
        // Read all files that were loaded
        var bundledCode = [];
        var seen = {};
        
        if (metadata && metadata.order) {
            metadata.order.forEach(function(item) {
                if (!seen[item.path]) {
                    seen[item.path] = true;
                    var content = fs.readFileSync(item.path, 'utf8');
                    // Transform let/const to var for ES5.1 compatibility
                    var transformed = content.replace(/\blet\s+/g, 'var ').replace(/\bconst\s+/g, 'var ');
                    bundledCode.push('/* ' + item.fileName + ' */');
                    bundledCode.push(transformed);
                    bundledCode.push('');
                }
            });
        }
        
        return bundledCode.join('\n');
    } catch (error) {
        // Fallback to simple file read if loader fails
        return fs.readFileSync(scriptPath, 'utf8');
    }
}

function transformCode(code, options) {
    var transformed = code;
    
    // Basic transformations for Vocalls compatibility
    transformed = transformed.replace(/\b(let|const)\s+/g, 'var ');
    
    var header = '/*\n' +
                ' * Generated for Vocalls deployment\n' +
                ' * Timestamp: ' + new Date().toISOString() + '\n' +
                ' * Original: ' + options.originalFilename + '\n' +
                ' * \n' +
                ' * IMPORTANT: This code has been processed for ES5.1 compatibility.\n' +
                ' * Do not edit manually - modify the source file instead.\n' +
                ' */\n\n';
    
    transformed = header + transformed;
    return transformed;
}

function main() {
    // Ensure we're in project root before proceeding
    ensureProjectRoot();
    
    var options = parseArgs();
    
    // Load project configuration
    var projectConfig = loadProjectConfig(options.project);
    var envConfig = loader.loadEnvConfig();
    var projectSettings = projectConfig.settings || {
        env: envConfig.env || 'acc',
        httpMode: envConfig.httpMode || 'real',
        storageMode: envConfig.storageMode || 'disk',
        moduleName: envConfig.moduleName || 'vocalls-env',
        databaseUrl: envConfig.databaseUrl || DEFAULT_DATABASE_URL
    };
    
    console.log('Vocalls Code Export Tool');
    console.log('========================');
    
    // Determine script path
    var scriptPath;
    if (options.callScript) {
        var callScriptsPath = projectConfig.config.callScriptsPath || 'projects/example-starter/callScripts';
        scriptPath = path.resolve(process.cwd(), callScriptsPath, options.callScript + '.js');
        console.log('Project:', projectConfig.name);
        console.log('Call Script:', options.callScript + ' (from ' + callScriptsPath + '/)');
        if (projectSettings && projectSettings.moduleName) {
            console.log('Module Name:', projectSettings.moduleName);
        }
    } else {
        scriptPath = path.resolve(process.cwd(), options.script);
        console.log('Script:', options.script);
    }
    
    if (!fs.existsSync(scriptPath)) {
        console.error('Error: Script file not found:', scriptPath);
        process.exit(1);
    }
    
    // Determine output path
    if (!options.output) {
        var scriptName = path.basename(scriptPath, '.js');
        if (options.callScript) {
            var exportedPath = projectConfig.config.exportedPath || 'projects/example-starter/exported_callscripts';
            options.output = path.join(exportedPath, scriptName + '-vocalls-ready.js');
        } else {
            options.output = scriptName + '-vocalls-ready.js';
        }
    }
    
    console.log('Output:', options.output);
    console.log();
    
    try {
        var sourceCode;
        
        // Use loader for callScripts to bundle with libraries
        if (options.callScript) {
            console.log('Bundling call script with global libraries...');
            sourceCode = bundleScriptWithLoader(scriptPath, projectConfig);
        } else {
            sourceCode = fs.readFileSync(scriptPath, 'utf8');
        }
        
        console.log('Loaded script (' + sourceCode.length + ' characters)');
        
        if (options.validate) {
            var validation = core.validateConstraints(sourceCode, path.basename(scriptPath));
            if (!validation.ok) {
                console.error('Validation failed:');
                validation.errors.forEach(function(error) {
                    console.error('  ' + error.rule + ' at line ' + error.line + ':' + error.col + ' - ' + error.message);
                });
                console.error();
                console.error('Use --no-validate to skip validation and export anyway.');
                process.exit(1);
            }
            console.log('✓ Source validation passed');
        }
        
        var exportedCode = transformCode(sourceCode, {
            format: options.format,
            originalFilename: path.basename(scriptPath)
        });
        
        console.log('✓ Code transformation completed');
        
        var outputPath = path.resolve(process.cwd(), options.output);
        var outputDir = path.dirname(outputPath);
        
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        fs.writeFileSync(outputPath, exportedCode, 'utf8');
        
        console.log('✓ Exported to:', outputPath);
        console.log('File size:', exportedCode.length, 'characters');
        console.log();
        console.log('🚀 Export completed successfully!');
        console.log('📋 Ready to paste into Vocalls platform');
        
    } catch (error) {
        console.error('Export error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

