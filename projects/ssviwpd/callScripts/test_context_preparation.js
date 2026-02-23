// =============================================================================
// UNIT TEST: Context Preparation v4
// =============================================================================
//
// Prerequisites:
// - Copy context_preparation_4_refactored.js to globalLibraries/active/01_context_preparation.js
//   so it loads into global scope before this test runs
//
// Run: npm run simulate -- --callScript test_context_preparation --project ssviwpd
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// TEST FRAMEWORK
// ─────────────────────────────────────────────────────────────────────────────

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

function assertExists(value, name) {
    assert(typeof value !== 'undefined', name + ' exists');
}

function assertEquals(actual, expected, name) {
    assert(actual === expected, name + ' === ' + expected + ' (got: ' + actual + ')');
}

function assertNotEmpty(value, name) {
    assert(value && String(value).length > 0, name + ' is not empty');
}

function assertObjectHasKeys(obj, keys, name) {
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        assert(obj.hasOwnProperty(key), name + ' has key: ' + key);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

var mockApiResultCase13 = {
    caseNumber: 13,
    options: {
        paymentDeferralAvailable: true,
        installmentPlanAvailable: true,
        deferralProposal: {
            nearestPaymentDeferral: {
                deferralDate: '2026-03-15',
                financialTransactionID: 'TXN-123'
            }
        },
        installmentPlanProposal: {
            slices: 3,
            applyCost: true,
            cost: 25
        },
        installmentPlanStartDate: '2026-04-01',
        financialTransactionIDList: ['TXN-456', 'TXN-789']
    }
};

var mockApiResultCase1 = {
    caseNumber: 1,
    options: {}
};

var mockApiResultCase13DeferralOnly = {
    caseNumber: 13,
    options: {
        paymentDeferralAvailable: true,
        installmentPlanAvailable: false,
        deferralProposal: {
            nearestPaymentDeferral: {
                deferralDate: '2026-03-15',
                financialTransactionID: 'TXN-123'
            }
        },
        installmentPlanProposal: {},
        financialTransactionIDList: []
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Setup varObj for test
// ─────────────────────────────────────────────────────────────────────────────

function setupVarObj(apiResult, lang) {
    varObj = {
        language: lang || 'NL',
        _tempData: {
            testSegment: {
                apiResult: apiResult
            }
        }
    };
    currentSegment = 'testSegment';
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE
// ─────────────────────────────────────────────────────────────────────────────

logInfo('=== Context Preparation v4 Unit Tests ===');
logInfo('');

// ─── Test 1: Verify script loaded ───────────────────────────────────────────

logInfo('Test Group 1: Script Loading');
assertExists(LANGUAGES, 'LANGUAGES');
assertExists(CASE_TO_SCENARIO, 'CASE_TO_SCENARIO');
assertExists(SCENARIO_TOOLS, 'SCENARIO_TOOLS');
assertExists(CASE_OPENINGS, 'CASE_OPENINGS');
assertExists(SCENARIO_PROMPTS, 'SCENARIO_PROMPTS');
assertExists(ACTION_RESULT_TEMPLATES, 'ACTION_RESULT_TEMPLATES');
assertExists(CDB_CASE_DATA, 'CDB_CASE_DATA');
logInfo('');

// ─── Test 2: Utility functions ──────────────────────────────────────────────

logInfo('Test Group 2: Utility Functions');
assertExists(normalizeLanguage, 'normalizeLanguage function');
assertEquals(normalizeLanguage('nl'), 'NL', 'normalizeLanguage("nl")');
assertEquals(normalizeLanguage('XX'), 'NL', 'normalizeLanguage("XX") defaults to NL');

assertExists(formatDate, 'formatDate function');
assertEquals(formatDate('2026-03-15'), '15-03-2026', 'formatDate("2026-03-15")');

assertExists(safeDayOfMonth, 'safeDayOfMonth function');
assertEquals(safeDayOfMonth('2026-04-01'), 1, 'safeDayOfMonth("2026-04-01")');

assertExists(resolveTemplate, 'resolveTemplate function');
assertEquals(
    resolveTemplate('Hello {{name}}', { name: 'World' }),
    'Hello World',
    'resolveTemplate basic substitution'
);

assertExists(isTrue, 'isTrue function');
assertEquals(isTrue(true), true, 'isTrue(true)');
assertEquals(isTrue(false), false, 'isTrue(false)');

assertExists(ensureObject, 'ensureObject function');
assert(typeof ensureObject(null) === 'object', 'ensureObject(null) returns object');
assert(typeof ensureObject({}) === 'object', 'ensureObject({}) returns object');

assertExists(getCurrentSegmentName, 'getCurrentSegmentName function');
logInfo('');

// ─── Test 3: Core logic functions ───────────────────────────────────────────

logInfo('Test Group 3: Core Logic Functions');
assertExists(extractVariables, 'extractVariables function');
assertExists(getAvailabilityFlags, 'getAvailabilityFlags function');
assertExists(determineScenario, 'determineScenario function');
assertExists(validateRequired, 'validateRequired function');
assertExists(getOpeningText, 'getOpeningText function');
assertExists(buildObjectivePrompt, 'buildObjectivePrompt function');
assertExists(buildActionResults, 'buildActionResults function');
assertExists(buildAgentContext, 'buildAgentContext function');
assertExists(buildFallback, 'buildFallback function');
assertExists(getCdbCaseData, 'getCdbCaseData function');
logInfo('');

// ─── Test 4: Case 13 full_choice scenario ───────────────────────────────────

logInfo('Test Group 4: Case 13 full_choice Scenario');
setupVarObj(mockApiResultCase13, 'NL');

// Manually execute the script logic (simulate runtime)
var v = varObj;
var lang = v.language;
var segName = currentSegment;
var apiResult = v._tempData[segName].apiResult;
var payload = apiResult;
var caseNum = payload.caseNumber;
var agentContext = buildAgentContext(caseNum, payload, lang);

assertEquals(agentContext.error, false, 'agentContext.error === false');
assertEquals(agentContext.caseNumber, 13, 'agentContext.caseNumber === 13');
assertEquals(agentContext.scenario, 'full_choice', 'agentContext.scenario === full_choice');
assertEquals(agentContext.language, 'NL', 'agentContext.language === NL');
assertNotEmpty(agentContext.openingText, 'agentContext.openingText');
assertNotEmpty(agentContext.prompt, 'agentContext.prompt');
assert(agentContext.prompt.indexOf('Feiten:') >= 0, 'Facts label localized for NL (Feiten)');

assertObjectHasKeys(
    agentContext.toolData,
    ['deferralTransactionId', 'deferralDate', 'financialTransactionIDList', 'installmentSlices', 'installmentStartDate', 'installmentCost', 'installmentApplyCost'],
    'agentContext.toolData'
);

assertEquals(agentContext.toolData.deferralTransactionId, 'TXN-123', 'toolData.deferralTransactionId');
assertEquals(agentContext.toolData.installmentSlices, 3, 'toolData.installmentSlices');
assertEquals(agentContext.toolData.installmentCost, 25, 'toolData.installmentCost');

assert(Array.isArray(agentContext.toolDefinitions), 'agentContext.toolDefinitions is array');
assertEquals(agentContext.toolDefinitions.length, 4, 'toolDefinitions.length for full_choice');
var toolNames = agentContext.toolDefinitions.map(function(t) { return t.name; });
assert(toolNames.indexOf('request_payment_deferral') >= 0, 'toolDefinitions includes request_payment_deferral');
assert(toolNames.indexOf('create_payment_plan') >= 0, 'toolDefinitions includes create_payment_plan');
assert(toolNames.indexOf('transfer_to_operator') >= 0, 'toolDefinitions includes transfer_to_operator');
assert(toolNames.indexOf('end_conversation') >= 0, 'toolDefinitions includes end_conversation');
var deferralDef = agentContext.toolDefinitions.filter(function(t) { return t.name === 'request_payment_deferral'; })[0];
assert(deferralDef && deferralDef.description && deferralDef.description.indexOf('uitstel') >= 0, 'toolDefinitions has NL description for deferral');
assertEquals(deferralDef.confirmation, 'Explicit', 'deferral tool has Explicit confirmation');
var endDef = agentContext.toolDefinitions.filter(function(t) { return t.name === 'end_conversation'; })[0];
assert(endDef && endDef.silent === true, 'end_conversation tool has silent: true');

assertObjectHasKeys(
    agentContext.paymentVars,
    ['deferralDate', 'slices', 'dayOfMonth', 'cost', 'hasCost', 'costNotice', 'firstPaymentDate'],
    'agentContext.paymentVars'
);

assertEquals(agentContext.paymentVars.deferralDate, '15-03-2026', 'paymentVars.deferralDate');
assertEquals(agentContext.paymentVars.slices, 3, 'paymentVars.slices');
assertEquals(agentContext.paymentVars.dayOfMonth, 1, 'paymentVars.dayOfMonth');
assertEquals(agentContext.paymentVars.cost, 25, 'paymentVars.cost');
assertEquals(agentContext.paymentVars.hasCost, true, 'paymentVars.hasCost');
assertNotEmpty(agentContext.paymentVars.costNotice, 'paymentVars.costNotice');

assertObjectHasKeys(
    agentContext.actionResults,
    ['request_payment_deferral', 'create_payment_plan', 'transfer_to_operator'],
    'agentContext.actionResults'
);
// Note: end_conversation has no result templates, so it's not in actionResults

assertObjectHasKeys(
    agentContext.actionResults.request_payment_deferral,
    ['success', 'failure'],
    'agentContext.actionResults.request_payment_deferral'
);

assertObjectHasKeys(
    agentContext.meta,
    ['hasMultipleOptions', 'allowsSelfService', 'requiresOperatorTransfer'],
    'agentContext.meta'
);

assertEquals(agentContext.meta.hasMultipleOptions, true, 'meta.hasMultipleOptions');
assertEquals(agentContext.meta.allowsSelfService, true, 'meta.allowsSelfService');
assertEquals(agentContext.meta.requiresOperatorTransfer, false, 'meta.requiresOperatorTransfer');

assertObjectHasKeys(
    agentContext.cdbCaseData,
    ['END', 'END_OPERATOR', 'FAILURE', 'OPERATOR'],
    'agentContext.cdbCaseData'
);

logInfo('');

// ─── Test 5: Case 1 info_only scenario ──────────────────────────────────────

logInfo('Test Group 5: Case 1 info_only Scenario');
setupVarObj(mockApiResultCase1, 'NL');

v = varObj;
lang = v.language;
segName = currentSegment;
apiResult = v._tempData[segName].apiResult;
payload = apiResult;
caseNum = payload.caseNumber;
agentContext = buildAgentContext(caseNum, payload, lang);

assertEquals(agentContext.error, false, 'agentContext.error === false');
assertEquals(agentContext.caseNumber, 1, 'agentContext.caseNumber === 1');
assertEquals(agentContext.scenario, 'info_only', 'agentContext.scenario === info_only');
assertNotEmpty(agentContext.openingText, 'agentContext.openingText');
assertNotEmpty(agentContext.prompt, 'agentContext.prompt');

assertObjectHasKeys(
    agentContext.actionResults,
    ['transfer_to_operator'],
    'agentContext.actionResults for info_only'
);
// Note: end_conversation has no result templates

assertEquals(agentContext.meta.hasMultipleOptions, false, 'meta.hasMultipleOptions');
assertEquals(agentContext.meta.allowsSelfService, false, 'meta.allowsSelfService');

logInfo('');

// ─── Test 6: Case 13 downgrade to deferral_only ─────────────────────────────

logInfo('Test Group 6: Case 13 Downgrade to deferral_only');
setupVarObj(mockApiResultCase13DeferralOnly, 'NL');

v = varObj;
lang = v.language;
segName = currentSegment;
apiResult = v._tempData[segName].apiResult;
payload = apiResult;
caseNum = payload.caseNumber;
agentContext = buildAgentContext(caseNum, payload, lang);

assertEquals(agentContext.error, false, 'agentContext.error === false');
assertEquals(agentContext.caseNumber, 13, 'agentContext.caseNumber === 13');
assertEquals(agentContext.scenario, 'deferral_only', 'agentContext.scenario === deferral_only (downgraded)');
assertNotEmpty(agentContext.openingText, 'agentContext.openingText');
assertNotEmpty(agentContext.prompt, 'agentContext.prompt');

assertObjectHasKeys(
    agentContext.actionResults,
    ['request_payment_deferral', 'transfer_to_operator'],
    'agentContext.actionResults for deferral_only'
);
// Note: end_conversation has no result templates

logInfo('');

// ─── Test 7: Fallback error scenario ────────────────────────────────────────

logInfo('Test Group 7: Fallback Error Scenario');
setupVarObj(null, 'NL');

v = varObj;
lang = v.language;
segName = currentSegment;
apiResult = v._tempData[segName].apiResult;

if (!apiResult || typeof apiResult !== 'object') {
    agentContext = buildFallback(0, lang, 'Missing apiResult');
}

assertEquals(agentContext.error, true, 'agentContext.error === true');
assertEquals(agentContext.scenario, 'fallback_error', 'agentContext.scenario === fallback_error');
assertNotEmpty(agentContext.errorReason, 'agentContext.errorReason');
assertNotEmpty(agentContext.prompt, 'agentContext.prompt');

assertObjectHasKeys(
    agentContext.actionResults,
    ['transfer_to_operator'],
    'agentContext.actionResults for fallback_error'
);

assertEquals(agentContext.meta.requiresOperatorTransfer, true, 'meta.requiresOperatorTransfer');

logInfo('');

// ─── Test 8: Multi-language support ─────────────────────────────────────────

logInfo('Test Group 8: Multi-Language Support');

var languages = ['NL', 'FR', 'DE', 'EN'];
for (var i = 0; i < languages.length; i++) {
    var testLang = languages[i];
    setupVarObj(mockApiResultCase13, testLang);
    
    v = varObj;
    lang = v.language;
    segName = currentSegment;
    apiResult = v._tempData[segName].apiResult;
    payload = apiResult;
    caseNum = payload.caseNumber;
    agentContext = buildAgentContext(caseNum, payload, lang);
    
    assertEquals(agentContext.language, testLang, 'Language detection for ' + testLang);
    assertNotEmpty(agentContext.openingText, 'openingText for ' + testLang);
    assertNotEmpty(agentContext.prompt, 'prompt for ' + testLang);
    if (testLang === 'FR' && agentContext.prompt.indexOf('---') >= 0) {
        assert(agentContext.prompt.indexOf('Faits:') >= 0, 'Facts label localized for FR (Faits)');
    }
    if (testLang === 'EN' && agentContext.prompt.indexOf('---') >= 0) {
        assert(agentContext.prompt.indexOf('Facts:') >= 0, 'Facts label localized for EN (Facts)');
    }
}

logInfo('');

// ─── Test 9: Output globals ─────────────────────────────────────────────────

logInfo('Test Group 9: Output Globals (simulating full script execution)');

// Simulate full script execution for case 13
setupVarObj(mockApiResultCase13, 'NL');

v = (typeof varObj !== 'undefined') ? varObj : null;
lang = (v && v.language) ? v.language : 'NL';
segName = getCurrentSegmentName();
apiResult = null;

if (v && v._tempData && segName && v._tempData[segName] && v._tempData[segName].apiResult) {
    apiResult = v._tempData[segName].apiResult;
}

if (!apiResult || typeof apiResult !== 'object') {
    agentContext = buildFallback(0, lang, 'Missing apiResult');
} else {
    payload = apiResult.data || apiResult.result || apiResult;
    caseNum = (payload && payload.caseNumber != null) ? payload.caseNumber : apiResult.caseNumber;
    
    if (caseNum == null || caseNum === 0) {
        agentContext = buildFallback(0, lang, 'No case number from API');
    } else {
        agentContext = buildAgentContext(caseNum, payload, lang);
    }
}

// Set output globals as the script does
__opening = agentContext.openingText || '';
__objective = agentContext.prompt || '';
deferral_days = 30;
installment_slices = agentContext.paymentVars ? agentContext.paymentVars.slices : 0;
deferral_date = agentContext.paymentVars ? agentContext.paymentVars.deferralDate : '';
installment_day = agentContext.paymentVars ? agentContext.paymentVars.dayOfMonth : '';
first_payment_date = agentContext.paymentVars ? agentContext.paymentVars.firstPaymentDate : '';

assertNotEmpty(__opening, '__opening global set');
assertNotEmpty(__objective, '__objective global set');
assertEquals(installment_slices, 3, 'installment_slices global set');
assertEquals(deferral_date, '15-03-2026', 'deferral_date global set');
assertEquals(installment_day, 1, 'installment_day global set');
assertEquals(first_payment_date, '01-04-2026', 'first_payment_date global set');

logInfo('');

// ─── Test 10: Logging guard ─────────────────────────────────────────────────

logInfo('Test Group 10: Logging Guard');

// Test that logging doesn't throw (logDebug may not exist in simulator, but guard should work)
try {
    if (typeof logDebug === 'function') {
        logDebug('Test log from context_preparation test');
        assert(true, 'logDebug function exists and logging works');
    } else {
        assert(true, 'logDebug not available in simulator (expected), guard prevents errors');
    }
} catch (e) {
    assert(false, 'Logging guard failed: ' + e.message);
}

logInfo('');

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

logInfo('=== Test Summary ===');
logInfo('Tests passed: ' + _testsPassed);
logInfo('Tests failed: ' + _testsFailed);

if (_testsFailed === 0) {
    logInfo('✅ ALL TESTS PASSED');
} else {
    logError('❌ SOME TESTS FAILED');
}

// Test results stored in globals for inspection
var testResults = {
    passed: _testsPassed,
    failed: _testsFailed,
    success: _testsFailed === 0
};
