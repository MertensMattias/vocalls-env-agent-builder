/**
 * globalVariables.js - Global Variable Initialization
 *
 * Project: ssviwpd
 * Environment: acc
 */

if (typeof context !== 'undefined' && context.session) {
    context.session.variables.projectName = 'ssviwpd';
    context.session.variables.defaultEnvironment = 'acc';
    context.session.variables.moduleName = 'ssviwpd-module';
    context.session.variables.initializedAt = nowUTC();
}

var varObj = {
    ani: safeGet(context, 'callInfo.fromUri', ''),
    dnis: safeGet(context, 'callInfo.toUri', ''),
    language: safeGet(context, 'language', 'NL'),
    customer: {
        name: 'SSVIWPD'
    },
    metadata: {
        environment: 'acc'
    }
};

logInfo('[ssviwpd] globalVariables.js initialized');
