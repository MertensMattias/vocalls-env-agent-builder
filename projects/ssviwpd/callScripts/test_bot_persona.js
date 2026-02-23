// =============================================================================
// TEST_BOT_PERSONA.JS — Unit Test for bot_persona_4_standalone.js
// =============================================================================
//
// Tests the standalone bot persona script by:
// 1. Loading it via the simulator
// 2. Validating all expected globals are set
// 3. Testing message rotation
// 4. Testing language switching
// 5. Testing prompt builder
//
// Run: npm run simulate -- --callScript test_bot_persona --project ssviwpd
//
// =============================================================================

// Test assertion helper
var _testsPassed = 0;
var _testsFailed = 0;
function assert(condition, message) {
    if (condition) {
        _testsPassed++;
        logInfo('[PASS] ' + message);
    } else {
        _testsFailed++;
        logError('[FAIL] ' + message);
    }
}

function assertDefined(value, name) {
    assert(typeof value !== 'undefined', name + ' is defined');
}

function assertNotEmpty(arr, name) {
    assert(arr && arr.length > 0, name + ' is non-empty array');
}

function assertFunction(fn, name) {
    assert(typeof fn === 'function', name + ' is a function');
}

function assertString(str, name) {
    assert(typeof str === 'string' && str.length > 0, name + ' is non-empty string');
}

// ═════════════════════════════════════════════════════════════════════════════
// LOAD BOT PERSONA STANDALONE SCRIPT
// ═════════════════════════════════════════════════════════════════════════════
//
// NOTE: For this test to work, copy bot_persona_4_standalone.js to 
// projects/ssviwpd/globalLibraries/active/ with a name like "01_bot_persona.js"
// so it loads automatically before this test script.
//
// Or run: npm run simulate -- --script projects/ssviwpd/exported_callscripts/bot_persona_4_standalone.js
// (but that won't work with --callScript, so we need the globalLibraries approach)
//
// ═════════════════════════════════════════════════════════════════════════════

logInfo('========================================');
logInfo('Bot Persona Standalone Unit Test');
logInfo('========================================');

// Check if bot persona was already loaded (via globalLibraries)
if (typeof __persona === 'undefined') {
    logWarn('Bot persona not loaded yet - attempting to load from exported_callscripts...');
    
    // Read the bot persona script content
    var botPersonaPath = 'projects/ssviwpd/exported_callscripts/bot_persona_4_standalone.js';
    var botPersonaCode = Storage.readFile(botPersonaPath);
    
    if (!botPersonaCode) {
        logError('SETUP ERROR: Bot persona script not found at: ' + botPersonaPath);
        logError('');
        logError('To fix this, either:');
        logError('1. Copy bot_persona_4_standalone.js to projects/ssviwpd/globalLibraries/active/02_bot_persona.js');
        logError('2. Or use: npm run simulate -- --script projects/ssviwpd/exported_callscripts/bot_persona_4_standalone.js');
        logError('');
        logError('Test cannot proceed without bot persona script loaded.');
        throw new Error('Bot persona script not found');
    }
    
    // Note: eval() won't work in the vm.runInContext sandbox to set global variables.
    // The script needs to be loaded via the proper loader mechanism (globalLibraries or --script).
    logError('');
    logError('SETUP ERROR: Cannot dynamically load bot persona script via eval() in sandbox.');
    logError('The vm.runInContext environment doesn\'t allow eval() to modify global scope.');
    logError('');
    logError('Solution: Copy bot_persona_4_standalone.js to:');
    logError('  projects/ssviwpd/globalLibraries/active/02_bot_persona.js');
    logError('');
    logError('This will make it load automatically before the test.');
    throw new Error('Bot persona script must be in globalLibraries/active/ for testing');
} else {
    logInfo('✓ Bot persona script detected (loaded via globalLibraries)\n');
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Verify Persona Object
// ─────────────────────────────────────────────────────────────────────────────

logInfo('\n--- TEST 1: Verify Persona Object ---');

assertDefined(__persona, '__persona');
if (typeof __persona !== 'undefined') {
    assert(__persona.name === 'Dena', '__persona.name is Dena');
    assertString(__persona.botType, '__persona.botType');
    assertString(__persona.gender, '__persona.gender');
    assertString(__persona.companyName, '__persona.companyName');
    assertString(__persona.tone, '__persona.tone');
    assertString(__persona.companyRole, '__persona.companyRole');
    assertString(__persona.targetCustomer, '__persona.targetCustomer');
    assertString(__persona.language, '__persona.language');
    assertString(__persona.description, '__persona.description');
    assertString(__persona.interactionStyle, '__persona.interactionStyle');
    assertDefined(__persona.allowBargeIn, '__persona.allowBargeIn');
}


// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Verify LLM Config Globals
// ─────────────────────────────────────────────────────────────────────────────

logInfo('\n--- TEST 2: Verify LLM Config Globals ---');

assertDefined(__defaultLLMProvider, '__defaultLLMProvider');
assertDefined(__defaultModel, '__defaultModel');
assertDefined(__timeZone, '__timeZone');
assert(__gptMaxTokens === 500, '__gptMaxTokens === 500');
assert(__gptShortWaitDelay === 1000, '__gptShortWaitDelay === 1000');
assert(__gptLongWaitDelay === 2000, '__gptLongWaitDelay === 2000');


// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Verify Message Arrays
// ─────────────────────────────────────────────────────────────────────────────

logInfo('\n--- TEST 3: Verify Message Arrays ---');

assertNotEmpty(__gpt_repeat, '__gpt_repeat');
assertNotEmpty(__gpt_noInput, '__gpt_noInput');
assertNotEmpty(__gpt_waitShort, '__gpt_waitShort');
assertNotEmpty(__gpt_wait, '__gpt_wait');
assertNotEmpty(__gpt_waitConfirmation, '__gpt_waitConfirmation');
assertNotEmpty(__gpt_bargeIn, '__gpt_bargeIn');

// confirmation and fill are empty in this project (intentional)
assertDefined(__gpt_confirmation, '__gpt_confirmation');
assertDefined(__gpt_fill, '__gpt_fill');


// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: Verify Message Pointers Initialization (before rotation test)
// ─────────────────────────────────────────────────────────────────────────────

logInfo('\n--- TEST 4: Verify Message Pointers Initialization ---');

assert(__noInputPtr === 0, '__noInputPtr === 0');
assert(__confirmationPtr === 0, '__confirmationPtr === 0');
assert(__fillPtr === 0, '__fillPtr === 0');
assert(__repeatMessagePtr === 0, '__repeatMessagePtr === 0');
assert(__waitMessagePtr === 0, '__waitMessagePtr === 0');
assert(__waitShortMessagePtr === 0, '__waitShortMessagePtr === 0');
assert(__bargeInMessagePtr === 0, '__bargeInMessagePtr === 0');
assert(__waitConfirmationMessagePtr === 0, '__waitConfirmationMessagePtr === 0');


// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: Verify Message Rotation Functions
// ─────────────────────────────────────────────────────────────────────────────

logInfo('\n--- TEST 5: Verify Message Rotation Functions ---');

assertFunction(__gptDialog_getRepeatMessage, '__gptDialog_getRepeatMessage');
assertFunction(__gptDialog_getNoInputMessage, '__gptDialog_getNoInputMessage');
assertFunction(__gptDialog_getWaitMessage, '__gptDialog_getWaitMessage');
assertFunction(__gptDialog_getWaitMessageShort, '__gptDialog_getWaitMessageShort');
assertFunction(__gptDialog_getWaitConfirmationMessage, '__gptDialog_getWaitConfirmationMessage');
assertFunction(__gptDialog_getbargeInMessage, '__gptDialog_getbargeInMessage');
assertFunction(__gptDialog_getConfirmationMessage, '__gptDialog_getConfirmationMessage');
assertFunction(__gptDialog_getFillMessage, '__gptDialog_getFillMessage');

// Test rotation: call getRepeatMessage N times, verify it wraps around
var repeatLen = __gpt_repeat.length;
var firstMsg = __gptDialog_getRepeatMessage();
assertString(firstMsg, 'First repeat message');

// Call (N-1) more times to loop around (we already called once above)
for (var i = 0; i < repeatLen - 1; i++) {
    __gptDialog_getRepeatMessage();
}

// Next call should be the first message again (we've now called N times total)
var wrappedMsg = __gptDialog_getRepeatMessage();
assert(wrappedMsg === firstMsg, 'Message rotation wraps around correctly');


// ─────────────────────────────────────────────────────────────────────────────
// TEST 6: Verify Dialog History Functions
// ─────────────────────────────────────────────────────────────────────────────

logInfo('\n--- TEST 6: Verify Dialog History Functions ---');

assertFunction(__gptDialog_getPrevMessages, '__gptDialog_getPrevMessages');
assertFunction(__gptDialog_addNodeToIgnoreList, '__gptDialog_addNodeToIgnoreList');
assertFunction(__gptDialog_clearDialogHistory, '__gptDialog_clearDialogHistory');

// Test ignoredNodeList manipulation
var initialIgnoredCount = __ignoredNodeList.length;
__gptDialog_addNodeToIgnoreList('test-node-123');
assert(__ignoredNodeList.length === initialIgnoredCount + 1, 'addNodeToIgnoreList adds node');
assert(__ignoredNodeList.includes('test-node-123'), 'ignoredNodeList contains added node');


// ─────────────────────────────────────────────────────────────────────────────
// TEST 7: Verify STT/TTS Functions
// ─────────────────────────────────────────────────────────────────────────────

logInfo('\n--- TEST 7: Verify STT/TTS Functions ---');

assertFunction(__gptDialog_postprocessDialogSTT, '__gptDialog_postprocessDialogSTT');
assertFunction(__gptDialog_preprocessDialogTTS, '__gptDialog_preprocessDialogTTS');

// Test basic pass-through
var testInput = 'test input';
var processed = __gptDialog_postprocessDialogSTT(testInput);
assert(typeof processed === 'string', 'postprocessDialogSTT returns string');


// ─────────────────────────────────────────────────────────────────────────────
// TEST 8: Verify Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

logInfo('\n--- TEST 8: Verify Utility Functions ---');

assertFunction(__gptGetLastSpeaker, '__gptGetLastSpeaker');
assertFunction(__gptGetCleanSpeakFlow, '__gptGetCleanSpeakFlow');
assertFunction(__gptBotSpoke, '__gptBotSpoke');
assertFunction(getCurrentDialogDate, 'getCurrentDialogDate');

// Test getCurrentDialogDate
var currentDate = getCurrentDialogDate();
assert(currentDate instanceof Date, 'getCurrentDialogDate returns Date object');

// Test wordCount fallback
assertFunction(wordCount, 'wordCount');
var wc = wordCount('hello world test');
assert(wc === 3, 'wordCount counts words correctly');


// ─────────────────────────────────────────────────────────────────────────────
// TEST 9: Verify Public API
// ─────────────────────────────────────────────────────────────────────────────

logInfo('\n--- TEST 9: Verify Public API ---');

assertFunction(getDialogHistory, 'getDialogHistory');
assertFunction(addToDialogIgnored, 'addToDialogIgnored');
assertFunction(clearDialogHistory, 'clearDialogHistory');
assertFunction(llmPreventStreaming, 'llmPreventStreaming');


// ─────────────────────────────────────────────────────────────────────────────
// TEST 10: Verify Knowledge Base Globals
// ─────────────────────────────────────────────────────────────────────────────

logInfo('\n--- TEST 10: Verify Knowledge Base Globals ---');

assertString(__generalKnowledge, '__generalKnowledge');
assertString(__companyInformation, '__companyInformation');
assertDefined(__advancedInstructions, '__advancedInstructions');
assert(__usePersonaAndKB === true, '__usePersonaAndKB === true');


// ─────────────────────────────────────────────────────────────────────────────
// TEST 11: Verify Prompt Builder Function
// ─────────────────────────────────────────────────────────────────────────────

logInfo('\n--- TEST 11: Verify Prompt Builder Function ---');

assertFunction(__gptDialog_getBasePrompt, '__gptDialog_getBasePrompt');

var testObjective = 'help the customer with a payment delay request';
var prompt = __gptDialog_getBasePrompt(testObjective);

assertString(prompt, 'getBasePrompt returns non-empty string');
assert(prompt.indexOf(__persona.name) >= 0, 'Prompt contains persona name');
assert(prompt.indexOf(testObjective) >= 0, 'Prompt contains objective');
assert(prompt.indexOf(__persona.companyName) >= 0, 'Prompt contains company name');
assert(prompt.indexOf('YOUR PERSONA:') >= 0, 'Prompt uses XML structure (YOUR PERSONA)');
assert(prompt.indexOf('OBJECTIVE:') >= 0, 'Prompt uses XML structure (OBJECTIVE)');


// ─────────────────────────────────────────────────────────────────────────────
// TEST 11: Test Language Switching (Simulated)
// ─────────────────────────────────────────────────────────────────────────────

logInfo('\n--- TEST 11: Test Language Detection ---');

// The script already ran and detected language from varObj.language or context.language
// Verify that __conversationLanguage is set
assertDefined(__conversationLanguage, '__conversationLanguage');
assertString(__conversationLanguage, '__conversationLanguage is string');

// Verify that __conversationType is set
assertDefined(__conversationType, '__conversationType');
assert(__conversationType === 'voicebot' || __conversationType === 'chatbot', 
       '__conversationType is voicebot or chatbot');


// ─────────────────────────────────────────────────────────────────────────────
// TEST 13: Verify Dialog State Initialization
// ─────────────────────────────────────────────────────────────────────────────

logInfo('\n--- TEST 13: Verify Dialog State Initialization ---');

assert(__gptSeed === 2017, '__gptSeed === 2017');
assertDefined(__gptFunctionCallHistory, '__gptFunctionCallHistory');
assertDefined(__ignoredNodeList, '__ignoredNodeList');
assert(__gptDialogHistoryStartFrom === 0, '__gptDialogHistoryStartFrom === 0');
assert(__gptLastBotSpeechNode === null, '__gptLastBotSpeechNode === null');
assert(__gptPreventStreaming === false, '__gptPreventStreaming === false');


// ─────────────────────────────────────────────────────────────────────────────
// TEST 14: Verify Component Version
// ─────────────────────────────────────────────────────────────────────────────

logInfo('\n--- TEST 14: Verify Component Version ---');

assertString(__gptComponentVersion, '__gptComponentVersion');
assert(__gptComponentVersion.indexOf('4.0.0') >= 0, '__gptComponentVersion contains 4.0.0');


// ═════════════════════════════════════════════════════════════════════════════
// TEST SUMMARY
// ═════════════════════════════════════════════════════════════════════════════

logInfo('\n========================================');
logInfo('TEST SUMMARY');
logInfo('========================================');
logInfo('Tests Passed: ' + _testsPassed);
logInfo('Tests Failed: ' + _testsFailed);

if (_testsFailed > 0) {
    logError('❌ SOME TESTS FAILED');
} else {
    logInfo('✅ ALL TESTS PASSED');
}

logInfo('========================================');
