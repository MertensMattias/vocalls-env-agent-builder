/**
 * main.js - Example Starter Call Script
 * 
 * This is a minimal example call script that demonstrates the Vocalls
 * development environment structure and basic patterns.
 * 
 * Usage: node cli/simulate.js --callScript main
 */

logInfo('=================================================');
logInfo('Example Starter Call Script');
logInfo('=================================================');

// Log call information
logInfo('Call Information:');
logInfo('  Call GUID:', context.callInfo.callGuid);
logInfo('  Direction:', context.callInfo.direction);
logInfo('  From:', context.callInfo.fromUri);
logInfo('  To:', context.callInfo.toUri);
logInfo('  Language:', context.language);

// Log session variables
logInfo('Session Variables:');
for (var key in context.session.variables) {
    if (context.session.variables.hasOwnProperty(key)) {
        logInfo('  ' + key + ':', context.session.variables[key]);
    }
}

// Log varObj
logInfo('VarObj:');
logInfo('  ANI:', varObj.ani);
logInfo('  DNIS:', varObj.dnis);
logInfo('  Language:', varObj.language);

// Example: Add custom data to session
context.session.variables.scriptName = 'main';
context.session.variables.scriptExecutedAt = nowUTC();

logInfo('✓ Script execution completed successfully');
logInfo('=================================================');

