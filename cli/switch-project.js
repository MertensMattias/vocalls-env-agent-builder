#!/usr/bin/env node

/**
 * CLI Switch Project - Updates activeProject in env.config.json
 *
 * Usage:
 *   node cli/switch-project.js <project-name>
 *   npm run switch -- <project-name>
 *
 * Use --list to display available projects.
 */

var fs = require('fs');
var path = require('path');
var loader = require('../core/loader');

function listProjects(envConfig) {
    var projects = Object.keys(envConfig.projects || {});
    console.log('Configured projects:');
    if (projects.length === 0) {
        console.log('  (none)');
    } else {
        projects.forEach(function(name) {
            var entry = envConfig.projects[name] || {};
            var settings = entry.settings || {};
            console.log('  - ' + name + ' (env: ' + (settings.env || envConfig.env || 'acc') + ', module: ' + (settings.moduleName || envConfig.moduleName || 'vocalls-env') + ')');
        });
    }
}

function main() {
    var args = process.argv.slice(2);
    var targetProject = null;
    if (args.length === 0) {
        console.log('Usage: node cli/switch-project.js <project-name>');
        console.log('       node cli/switch-project.js --list');
        process.exit(0);
    }

    if (args[0] === '--list') {
        var configForList = loader.loadEnvConfig();
        listProjects(configForList);
        process.exit(0);
    }

    targetProject = args[0];
    var configPath = path.resolve(process.cwd(), 'env.config.json');
    if (!fs.existsSync(configPath)) {
        console.error('env.config.json not found. Please run this command from the project root.');
        process.exit(1);
    }

    var envConfig = loader.loadEnvConfig();
    if (!envConfig.projects || !envConfig.projects[targetProject]) {
        console.error('Project "' + targetProject + '" not found in env.config.json.');
        listProjects(envConfig);
        process.exit(1);
    }

    envConfig.activeProject = targetProject;
    fs.writeFileSync(configPath, JSON.stringify(envConfig, null, 2), 'utf8');
    console.log('Active project switched to:', targetProject);
}

if (require.main === module) {
    main();
}


