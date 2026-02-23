/**
 * globalVariables.js - Global Variable Initialization
 * 
 * Initializes global variables and context objects.
 * Loaded second, after globalCode.js.
 */

// Initialize call context
if (typeof context !== 'undefined' && context.session) {
    context.session.variables.callStartTime = nowUTC();
    context.session.variables.callId = generateId();
}

// Initialize varObj if needed
var varObj = {
    ani: safeGet(context, 'callInfo.fromUri', ''),
    dnis: safeGet(context, 'callInfo.toUri', ''),
    language: safeGet(context, 'language', 'NL'),
    customer: {},
    metadata: {}
};

logInfo('✓ globalVariables.js loaded - Global context initialized');

