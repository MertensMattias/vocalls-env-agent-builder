#!/usr/bin/env node

/**
 * CLI Validate - Validate JavaScript files against Vocalls ES5.1 constraints
 * 
 * Usage:
 *   node cli/validate.js projects/example-starter/callScripts/main.js
 *   node cli/validate.js projects/example-starter/callScripts/*.js
 *   node cli/validate.js --project example-starter --callScripts
 *   npm run validate -- projects/example-starter/callScripts/main.js
 */

var fs = require('fs');
var path = require('path');
var core = require('../core/minimalVocallsCore');
var loader = require('../core/loader');

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
        console.error('  node cli/validate.js <files...>');
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
        files: [],
        verbose: false,
        quiet: false,
        project: null,
        callScripts: false,
        globalLibraries: false,
        all: false
    };
    
    for (var i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            case '--quiet':
            case '-q':
                options.quiet = true;
                break;
            case '--project':
                options.project = args[++i];
                break;
            case '--callScripts':
                options.callScripts = true;
                break;
            case '--globalLibraries':
                options.globalLibraries = true;
                break;
            case '--all':
                options.all = true;
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
                } else {
                    options.files.push(args[i]);
                }
        }
    }
    
    return options;
}

function showHelp() {
    console.log(`
Vocalls ES5.1 Constraint Validator

Usage: node cli/validate.js [options] <files...>
       npm run validate -- [options] <files...>

Arguments:
  <files...>          One or more JavaScript files to validate
                      Supports relative paths from project root

Options:
  -v, --verbose       Show detailed validation information
  -q, --quiet         Only show errors, no success messages
  --project <name>    Project name for project-specific paths [default: example-starter]
  --callScripts       Validate all call scripts for active project
  --globalLibraries   Validate all global libraries for active project
  --all               Validate all scripts and libraries for active project
  -h, --help          Show this help message

Note: Must be run from project root directory.

Examples:
  node cli/validate.js projects/example-starter/callScripts/main.js
  node cli/validate.js projects/example-starter/callScripts/*.js
  node cli/validate.js --callScripts
  node cli/validate.js --all
  node cli/validate.js --verbose --project example-starter --callScripts
  npm run validate -- projects/example-starter/callScripts/main.js

Exit Codes:
  0    All files passed validation
  1    One or more files failed validation or error occurred
`);
}

function expandProjectFiles(options) {
    var files = [];
    var projectConfig = loadProjectConfig(options.project);
    
    if (!projectConfig) {
        console.error('Error: Could not load project configuration');
        console.error('Make sure env.config.json exists and contains project configuration');
        process.exit(1);
    }
    
    var config = projectConfig.config;
    
    if (options.callScripts || options.all) {
        var callScriptsPath = path.resolve(process.cwd(), config.callScriptsPath || 'projects/example-starter/callScripts');
        if (fs.existsSync(callScriptsPath)) {
            var scripts = fs.readdirSync(callScriptsPath)
                .filter(function(f) { return f.endsWith('.js'); })
                .map(function(f) { return path.join(callScriptsPath, f); });
            files = files.concat(scripts);
        }
    }
    
    if (options.globalLibraries || options.all) {
        var globalLibrariesPath = path.resolve(process.cwd(), config.globalLibrariesPath || 'projects/example-starter/globalLibraries/active');
        if (fs.existsSync(globalLibrariesPath)) {
            var libraries = fs.readdirSync(globalLibrariesPath)
                .filter(function(f) { return f.endsWith('.js') || f.indexOf('.') === -1; })
                .map(function(f) { return path.join(globalLibrariesPath, f); });
            files = files.concat(libraries);
        }
    }
    
    return files;
}

function expandFiles(patterns) {
    var files = [];
    patterns.forEach(function(pattern) {
        // Handle glob patterns (simple implementation)
        if (pattern.indexOf('*') !== -1) {
            var dir = path.dirname(pattern);
            var basePattern = path.basename(pattern);
            var regex = new RegExp('^' + basePattern.replace(/\*/g, '.*').replace(/\./g, '\\.') + '$');
            
            try {
                var dirPath = path.resolve(process.cwd(), dir);
                if (fs.existsSync(dirPath)) {
                    var dirFiles = fs.readdirSync(dirPath)
                        .filter(function(f) { return regex.test(f); })
                        .map(function(f) { return path.join(dirPath, f); });
                    files = files.concat(dirFiles);
                }
            } catch (e) {
                console.warn('Warning: Could not expand pattern:', pattern);
            }
        } else {
            // Simple file path
            var resolved = path.resolve(process.cwd(), pattern);
            if (fs.existsSync(resolved)) {
                files.push(resolved);
            } else {
                console.warn('File not found:', pattern);
            }
        }
    });
    
    // Remove duplicates
    var uniqueFiles = [];
    var seen = {};
    files.forEach(function(file) {
        if (!seen[file]) {
            seen[file] = true;
            uniqueFiles.push(file);
        }
    });
    
    return uniqueFiles;
}

function validateFile(filePath, options) {
    var filename = path.basename(filePath);
    var relativePath = path.relative(process.cwd(), filePath);
    
    try {
        var content = fs.readFileSync(filePath, 'utf8');
        var validation = core.validateConstraints(content, filename);
        
        var result = {
            file: relativePath,
            ok: validation.ok,
            errors: validation.errors,
            warnings: validation.warnings,
            size: content.length
        };
        
        if (options.verbose || !options.quiet) {
            if (validation.ok) {
                if (!options.quiet) {
                    console.log('✓ ' + relativePath + ' (' + content.length + ' chars)');
                }
            } else {
                console.error('✗ ' + relativePath + ' - ' + validation.errors.length + ' error(s)');
                validation.errors.forEach(function(error) {
                    console.error('  ' + error.rule + ' at line ' + error.line + ':' + error.col);
                    console.error('    ' + error.message);
                    if (options.verbose) {
                        console.error('    Snippet: "' + error.snippet + '"');
                    }
                });
            }
        }
        
        return result;
        
    } catch (e) {
        console.error('✗ ' + relativePath + ' - Read error: ' + e.message);
        return {
            file: relativePath,
            ok: false,
            errors: [{ rule: 'file_read', message: e.message }],
            warnings: [],
            size: 0
        };
    }
}

function main() {
    // Ensure we're in project root before proceeding
    ensureProjectRoot();
    
    var options = parseArgs();
    var files = [];
    
    // Expand project-specific files if requested
    if (options.callScripts || options.globalLibraries || options.all) {
        files = files.concat(expandProjectFiles(options));
    }
    
    // Expand explicitly provided files
    if (options.files.length > 0) {
        files = files.concat(expandFiles(options.files));
    }
    
    if (files.length === 0) {
        console.error('Error: No files specified for validation');
        console.error('Use --help to see usage examples');
        process.exit(1);
    }
    
    if (!options.quiet) {
        console.log('Vocalls ES5.1 Constraint Validator');
        console.log('==================================');
        console.log('Validating', files.length, 'file(s)...');
        console.log();
    }
    
    var results = [];
    var totalErrors = 0;
    var totalWarnings = 0;
    
    files.forEach(function(file) {
        var result = validateFile(file, options);
        results.push(result);
        totalErrors += result.errors.length;
        totalWarnings += result.warnings.length;
    });
    
    // Summary
    if (!options.quiet) {
        console.log();
        console.log('Validation Summary:');
        console.log('==================');
        
        var passed = results.filter(function(r) { return r.ok; }).length;
        var failed = results.length - passed;
        
        console.log('Files processed:', results.length);
        console.log('Passed:', passed);
        console.log('Failed:', failed);
        console.log('Total errors:', totalErrors);
        console.log('Total warnings:', totalWarnings);
        
        if (options.verbose && totalErrors === 0) {
            var totalSize = results.reduce(function(sum, r) { return sum + r.size; }, 0);
            console.log('Total code size:', totalSize, 'characters');
        }
    }
    
    // Exit with appropriate code
    if (totalErrors > 0) {
        if (!options.quiet) {
            console.log();
            console.log('❌ Validation failed - ' + totalErrors + ' error(s) found');
        }
        process.exit(1);
    } else {
        if (!options.quiet) {
            console.log();
            console.log('✅ All files passed validation');
        }
        process.exit(0);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

