/**
 * globalCode.js - Shared Utilities & Functions
 *
 * Project: ssviwpd
 * Module: ssviwpd-module
 * Generated: 2025-02-09T00:00:00Z
 * 
 * This file contains ALL shared functions for the call script.
 * Functions are organized in logical groups:
 * - Basic utilities (safeGet, isEmpty, etc.)
 * - Language & formatting helpers
 * - Context & segment helpers
 * - Action execution helpers
 * - Context build pipeline
 */

// ============================================================================
// BASIC UTILITIES
// ============================================================================

function safeGet(obj, key, defaultValue) {
    try {
        var value = obj[key];
        return value !== undefined ? value : defaultValue;
    } catch (error) {
        return defaultValue;
    }
}

function getPath(obj, path) {
    if (!path) {
        return obj;
    }
    var parts = path.split('.');
    var current = obj;
    for (var i = 0; i < parts.length; i++) {
        if (!current || typeof current !== 'object') {
            return undefined;
        }
        current = current[parts[i]];
    }
    return current;
}

function isEmpty(value) {
    if (!value) {
        return true;
    }
    if (Array.isArray(value)) {
        return value.length === 0;
    }
    if (typeof value === 'object') {
        for (var key in value) {
            if (value.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }
    return false;
}

function isValidObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function generateId() {
    return 'ID-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// ============================================================================
// LANGUAGE & FORMATTING HELPERS
// ============================================================================

function normalizeLanguage(language) {
    language = String(language || 'NL').toUpperCase();
    var langs = ['NL', 'FR', 'DE', 'EN'];
    return langs.indexOf(language) >= 0 ? language : 'NL';
}

function pickLocalizedText(map, language) {
    map = (map && typeof map === "object") ? map : {};
    return map[language] || map.EN || map.NL || "";
}

function localized(obj, language) {
    if (!obj) return '';
    return obj[language] || obj.EN || obj['NL'] || '';
}

function formatDate(iso) {
    if (!iso) return '';
    var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return m[3] + '-' + m[2] + '-' + m[1];
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return ('0' + d.getDate()).slice(-2) + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + d.getFullYear();
}

function getDayOfMonth(iso) {
    if (!iso) return '';
    var m = String(iso).match(/^\d{4}-\d{2}-(\d{2})/);
    if (m) return parseInt(m[1], 10);
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.getDate();
}

function resolveTemplate(tpl, vars) {
    if (!tpl) return '';
    var s = tpl;
    for (var k in vars) {
        if (vars.hasOwnProperty(k)) {
            s = s.split('{{' + k + '}}').join(String(vars[k] != null ? vars[k] : ''));
        }
    }
    return s;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function ensureObject(v) {
    return (v && typeof v === 'object') ? v : {};
}

function isTrue(v) {
    return v === true;
}

function arrayIsArray(v) {
    return Object.prototype.toString.call(v) === '[object Array]';
}

function ensureArray(v) {
    return Object.prototype.toString.call(v) === '[object Array]' ? v : [];
}

function safeJsonStringify(v) {
    try { return JSON.stringify(v); } catch (e) { return '[unstringifiable]'; }
}

function getCurrentSegmentName() {
    if (typeof currentSegment !== 'undefined' && currentSegment) return String(currentSegment);
    if (typeof segmentState !== 'undefined' && segmentState && segmentState.currentSegment) return String(segmentState.currentSegment);
    if (typeof segmentState !== 'undefined' && segmentState && segmentState.params && segmentState.params.currentSegment) return String(segmentState.params.currentSegment);
    return '';
}

// ============================================================================
// CONTEXT & SEGMENT HELPERS
// ============================================================================

function getAgentContext() {
    if (typeof agentContext !== 'undefined' && agentContext) return agentContext;
    return null;
}

function getToolData() {
    var ctx = getAgentContext();
    return ctx ? ensureObject(ctx.toolData) : {};
}

function setSegmentResult(value) {
    if (typeof segmentState !== 'undefined' && segmentState) {
        segmentState.segmentResult = value;
    }
}

function recordActionOutcome(actionName, outcome, rawResult, cdbLog) {
    var ctx = getAgentContext();
    if (!ctx) return;

    if (!ctx.actionHistory) ctx.actionHistory = [];
    ctx.lastAction = actionName;
    ctx.lastOutcome = outcome;
    ctx.lastRawResult = rawResult || null;

    ctx.actionHistory.push({
        name: actionName,
        outcome: outcome,
        raw: rawResult || null,
        at: (new Date()).toISOString ? (new Date()).toISOString() : null
    });

    if (typeof cdbLog === 'string' && cdbLog) {
        if (!ctx.actionCdbLogs) ctx.actionCdbLogs = {};
        ctx.actionCdbLogs[actionName] = cdbLog;
        ctx.lastCdbLog = cdbLog;
    }

    // Resolve outcome message at record time so it uses current paymentVars
    var lang = ctx.language || (typeof varObj !== 'undefined' && varObj && varObj.language) || 'NL';
    var vars = {};
    var pv = ctx.paymentVars || {};
    for (var k in pv) { if (pv.hasOwnProperty(k)) vars[k] = pv[k]; }
    if (rawResult && rawResult.response) {
        var r = rawResult.response;
        if (r.firstPaymentDate) vars.firstPaymentDate = formatDate(r.firstPaymentDate);
        if (r.installmentSlices != null) vars.slices = r.installmentSlices;
        if (r.deferralDate) vars.deferralDate = formatDate(r.deferralDate);
    }
    if (typeof ACTION_RESULT_TEMPLATES !== 'undefined' && ACTION_RESULT_TEMPLATES && ACTION_RESULT_TEMPLATES[actionName]) {
        var tpl = ACTION_RESULT_TEMPLATES[actionName];
        var raw = outcome === 'success' ? (tpl.success || {}) : (tpl.failure || {});
        var tplStr = localized(raw, lang);
        ctx.lastOutcomeMessage = resolveTemplate(tplStr, vars);
    } else if (ctx.actionResults && ctx.actionResults[actionName]) {
        ctx.lastOutcomeMessage = outcome === 'success'
            ? (ctx.actionResults[actionName].success || '')
            : (ctx.actionResults[actionName].failure || '');
    } else {
        ctx.lastOutcomeMessage = '';
    }
}

// ============================================================================
// ACTION EXECUTION HELPERS
// ============================================================================

function isApiFailure(result) {
    if (!result || result.success !== true) return true;
    if (!isValidObject(result.response)) return true;
    if (result.response.failureOccurred) return true;
    if (result.response.caseNumber === 99) return true;
    return false;
}

function executeFactory(factoryConfig) {
    var request = executeApiCall(factoryConfig, varObj, segmentState);
    return request.then(
        function (result) {
            return { ok: true, result: result };
        },
        function (error) {
            return { ok: false, error: error };
        }
    );
}

function applyDeferralInputsToSegmentState(toolData) {
    if (!segmentState || !segmentState.params) segmentState.params = {};
    segmentState.params.deferralTransactionId = toolData.deferralTransactionId || toolData.deferralTransactionID || null;
    segmentState.params.deferralDate = toolData.deferralDate || null;
}

function applyInstallmentInputsToSegmentState(toolData) {
    if (!segmentState || !segmentState.params) segmentState.params = {};
    segmentState.params.financialTransactionIDList = ensureArray(toolData.financialTransactionIDList);
    segmentState.params.installmentSlices = toolData.installmentSlices || null;
    segmentState.params.installmentStartDate = toolData.installmentStartDate || null;
    segmentState.params.installmentApplyCost = toolData.installmentApplyCost === true;
    segmentState.params.installmentCost = toolData.installmentCost || 0;
}

function getCdbLogForAction(caseNum, actionName, outcome) {
    var ctx = getAgentContext();
    var caseStr = String(caseNum);
    if (typeof ACTION_CDB_LOGS === 'undefined') return 'cdbLogUnknown';
    var caseLogs = ACTION_CDB_LOGS[caseStr];
    if (caseLogs && caseLogs[actionName] && caseLogs[actionName][outcome]) {
        return caseLogs[actionName][outcome];
    }
    if (ctx && ctx.cdbCaseData) {
        if (outcome === 'success') return ctx.cdbCaseData.END || 'cdbLogUnknown';
        return ctx.cdbCaseData.FAILURE || ctx.cdbCaseData.END || 'cdbLogUnknown';
    }
    return 'cdbLogUnknown';
}

function getCaseNumber(ctx) {
    if (ctx && ctx.cdbCaseData && ctx.cdbCaseData.caseNumber) return ctx.cdbCaseData.caseNumber;
    if (typeof varObj !== 'undefined' && varObj._tempData) {
        var segName = getCurrentSegmentName();
        if (segName && varObj._tempData[segName]) {
            var apiResult = varObj._tempData[segName].apiResult;
            if (apiResult && apiResult.caseNumber != null) return apiResult.caseNumber;
        }
    }
    return null;
}

function executeAction(actionName, args) {
    if (typeof ACTION_EXECUTION_CONFIG === 'undefined') return;
    var config = ACTION_EXECUTION_CONFIG[actionName];
    if (!config) {
        log_error('executeAction: unknown action → ' + actionName);
        setSegmentResult(typeof RESULT_FAILURE_API !== 'undefined' ? RESULT_FAILURE_API : 'FAILURE_API');
        recordActionOutcome(actionName, 'failure', { reason: 'Unknown action' });
        return;
    }
    var ctx = getAgentContext();
    var toolData = ctx ? (ctx.toolData || {}) : {};
    var caseNum = getCaseNumber(ctx);
    log_debug('Executing action: ' + actionName + ' (case: ' + caseNum + ')');
    if (config.validate) {
        var validation = config.validate(toolData);
        if (!validation.valid) {
            log_error(actionName + ': validation failed → ' + validation.reason);
            setSegmentResult(config.failureResult || (typeof RESULT_FAILURE_API !== 'undefined' ? RESULT_FAILURE_API : 'FAILURE_API'));
            var cdbLog = getCdbLogForAction(caseNum, actionName, 'failure');
            recordActionOutcome(actionName, 'failure', validation.details || { reason: validation.reason }, cdbLog);
            return;
        }
    }
    if (config.factory) {
        return executeApiAction(actionName, config, toolData, caseNum, ctx);
    }
    return executeDirectAction(actionName, config, caseNum, ctx);
}

function executeApiAction(actionName, config, toolData, caseNum, ctx) {
    try {
        if (config.prepareInputs) config.prepareInputs(toolData);
        return executeFactory(config.factory).then(
            function(wrapped) {
                if (!wrapped.ok) { handleActionFailure(actionName, config, wrapped.error, caseNum, ctx); return; }
                var result = wrapped.result;
                if (isApiFailure(result)) { handleActionFailure(actionName, config, result, caseNum, ctx); return; }
                handleActionSuccess(actionName, config, result, caseNum, ctx);
            },
            function(error) { handleActionFailure(actionName, config, error, caseNum, ctx); }
        );
    } catch (err) {
        handleActionFailure(actionName, config, err, caseNum, ctx);
    }
}

function executeDirectAction(actionName, config, caseNum, ctx) {
    try {
        var result = config.execute ? config.execute() : { success: true };
        setSegmentResult(config.successResult);
        var cdbLog = getCdbLogForAction(caseNum, actionName, 'success');
        recordActionOutcome(actionName, 'success', result, cdbLog);
        log_debug(actionName + ': success (cdbLog: ' + cdbLog + ')');
    } catch (err) {
        var fallback = config.fallbackResult || config.successResult;
        setSegmentResult(fallback);
        var cdbLog = getCdbLogForAction(caseNum, actionName, 'failure');
        recordActionOutcome(actionName, 'failure', err, cdbLog);
        log_error(actionName + ': error → ' + safeJsonStringify(err));
    }
}

function handleActionSuccess(actionName, config, result, caseNum, ctx) {
    setSegmentResult(config.successResult);
    if (config.onSuccess) {
        try { config.onSuccess(result, ctx); } catch (hookErr) { log_warn(actionName + ': onSuccess hook error → ' + safeJsonStringify(hookErr)); }
    }
    var cdbLog = getCdbLogForAction(caseNum, actionName, 'success');
    recordActionOutcome(actionName, 'success', result, cdbLog);
    log_debug(actionName + ': success (cdbLog: ' + cdbLog + ')');
}

function handleActionFailure(actionName, config, error, caseNum, ctx) {
    setSegmentResult(config.failureResult || (typeof RESULT_FAILURE_API !== 'undefined' ? RESULT_FAILURE_API : 'FAILURE_API'));
    var cdbLog = getCdbLogForAction(caseNum, actionName, 'failure');
    recordActionOutcome(actionName, 'failure', error, cdbLog);
    log_error(actionName + ': failure (cdbLog: ' + cdbLog + ') → ' + safeJsonStringify(error));
}

function runAction(actionName, args) {
    actionName = String(actionName || '');
    return executeAction(actionName, args);
}

// ============================================================================
// CONTEXT BUILD PIPELINE
// ============================================================================

function getCdbCaseData(caseNum) {
    if (typeof CDB_CASE_DATA === 'undefined') return typeof CDB_FALLBACK !== 'undefined' ? CDB_FALLBACK : {};
    return CDB_CASE_DATA[String(caseNum)] || (typeof CDB_FALLBACK !== 'undefined' ? CDB_FALLBACK : {});
}

function getAvailabilityFlags(data) {
    var opt = ensureObject(ensureObject(data).options);
    return {
        deferralAvailable: isTrue(opt.paymentDeferralAvailable),
        installmentAvailable: isTrue(opt.installmentPlanAvailable)
    };
}

function extractVariables(data, language) {
    var opt = ensureObject(ensureObject(data).options);
    var def = ensureObject(ensureObject(ensureObject(opt.deferralProposal).nearestPaymentDeferral));
    var inst = ensureObject(opt.installmentPlanProposal);

    var hasCost = isTrue(inst.applyCost);
    var cost = inst.cost || 0;

    var vars = {
        deferralDate: formatDate(def.deferralDate),
        slices: inst.slices || 0,
        dayOfMonth: getDayOfMonth(opt.installmentPlanStartDate),
        firstPaymentDate: formatDate(opt.installmentPlanStartDate),
        cost: cost,
        hasCost: hasCost,
        costNotice: '',
        toolData: {
            deferralTransactionId: def.financialTransactionID || null,
            deferralDate: def.deferralDate || null,
            financialTransactionIDList: opt.financialTransactionIDList || [],
            installmentSlices: inst.slices || 0,
            installmentStartDate: opt.installmentPlanStartDate || null,
            installmentCost: cost,
            installmentApplyCost: hasCost
        }
    };

    if (typeof COST_NOTICE !== 'undefined') {
        vars.costNotice = hasCost ? (COST_NOTICE[language] || COST_NOTICE.EN) + String(cost) + ((typeof COST_SUFFIX !== 'undefined' ? COST_SUFFIX[language] : null) || '.') : '';
    }
    return vars;
}

function determineScenario(caseNum, data) {
    if (typeof CASE_TO_SCENARIO === 'undefined') return 'info_only';
    var baseScenario = CASE_TO_SCENARIO[String(caseNum)] || 'info_only';
    var flags = getAvailabilityFlags(data);

    if (baseScenario === 'full_choice') {
        if (flags.deferralAvailable && flags.installmentAvailable) return 'full_choice';
        if (flags.deferralAvailable && !flags.installmentAvailable) return 'deferral_only';
        if (!flags.deferralAvailable && flags.installmentAvailable) return 'installment_only';
        return 'fallback_error';
    }

    if (baseScenario === 'installment_only') {
        if (flags.installmentAvailable) return 'installment_only';
        if (!flags.installmentAvailable && flags.deferralAvailable) return 'deferral_only';
        return 'fallback_error';
    }

    return baseScenario;
}

function validateRequired(scenario, vars, data) {
    if (typeof SCENARIO_TOOLS === 'undefined') return true;
    var flags = getAvailabilityFlags(data);

    if (scenario === 'full_choice') {
        if (!flags.deferralAvailable || !flags.installmentAvailable) return false;
        if (!vars.deferralDate) return false;
        if (!vars.slices || vars.slices < 1) return false;
        if (!vars.firstPaymentDate) return false;
        if (!vars.dayOfMonth) return false;
    } else if (scenario === 'deferral_only') {
        if (!flags.deferralAvailable) return false;
        if (!vars.deferralDate) return false;
    } else if (scenario === 'installment_only') {
        if (!flags.installmentAvailable) return false;
        if (!vars.slices || vars.slices < 1) return false;
        if (!vars.firstPaymentDate) return false;
        if (!vars.dayOfMonth) return false;
    }

    var allowed = SCENARIO_TOOLS[scenario];
    if (allowed && arrayIsArray(allowed)) {
        var toolData = vars.toolData || {};
        for (var i = 0; i < allowed.length; i++) {
            var actionName = allowed[i];
            if (typeof ACTION_EXECUTION_CONFIG !== 'undefined' && ACTION_EXECUTION_CONFIG[actionName]) {
                var config = ACTION_EXECUTION_CONFIG[actionName];
                if (config && typeof config.validate === 'function') {
                    var v = config.validate(toolData);
                    if (!v || !v.valid) return false;
                }
            }
        }
    }
    return true;
}

function getCaseOpening(language, vars, caseNum) {
    if (typeof CASE_OPENINGS === 'undefined') return null;
    language = normalizeLanguage(language);
    var caseKey = caseNum != null ? String(caseNum) : null;
    if (!caseKey || !CASE_OPENINGS[caseKey]) return null;
    var entry = CASE_OPENINGS[caseKey];
    if (entry._use) entry = CASE_OPENINGS[entry._use] || entry;
    var tpl = (entry && entry[language]) ? entry[language] : (entry && entry.EN) || "";
    return tpl ? resolveTemplate(tpl, vars || {}) : null;
}

function getOpeningText(caseNum, scenario, language, vars) {
    if (typeof SCENARIO_OPENINGS_OVERRIDE === 'undefined') return '';
    language = normalizeLanguage(language);
    var caseKey = (caseNum != null) ? String(caseNum) : '';

    if ((caseKey === '13' || caseKey === '14' || caseKey === '20') && (scenario === 'deferral_only' || scenario === 'installment_only')) {
        var overrideTpl = localized(SCENARIO_OPENINGS_OVERRIDE[scenario], language);
        if (overrideTpl) return resolveTemplate(overrideTpl, vars);
    }

    return getCaseOpening(language, vars, caseNum) || '';
}

function buildObjectivePrompt(scenario, language, vars) {
    if (typeof SCENARIO_PROMPTS === 'undefined') return '';
    language = normalizeLanguage(language);

    var promptTpl = SCENARIO_PROMPTS[scenario] || (SCENARIO_PROMPTS.fallback_error || {});
    var prompt = resolveTemplate(localized(promptTpl, language), vars);

    if (scenario === 'full_choice' || scenario === 'deferral_only' || scenario === 'installment_only') {
        var facts = [];
        if (vars.deferralDate) facts.push('deferralDate: ' + vars.deferralDate);
        if (vars.slices) facts.push('slices: ' + vars.slices);
        if (vars.dayOfMonth) facts.push('dayOfMonth: ' + vars.dayOfMonth);
        if (vars.hasCost) facts.push('adminCost: ' + vars.cost + ' EUR');

        if (facts.length) {
            var factsLabel = (typeof FACTS_LABEL !== 'undefined' ? FACTS_LABEL[language] : null) || 'Facts';
            prompt += '\n\n---\n' + factsLabel + ':\n- ' + facts.join('\n- ');
        }
    }

    var allowed = (typeof SCENARIO_TOOLS !== 'undefined' ? SCENARIO_TOOLS[scenario] : null) || ['transfer_to_agent'];
    prompt += '\n\nAllowed actions: ' + allowed.join(', ') + '.';
    return prompt;
}

function buildToolDefinitions(scenario, language) {
    if (typeof SCENARIO_TOOLS === 'undefined' || typeof ACTION_CONFIG === 'undefined') return [];
    language = normalizeLanguage(language);
    var allowed = SCENARIO_TOOLS[scenario];

    if (!allowed || !arrayIsArray(allowed)) return [];

    var out = [];
    for (var i = 0; i < allowed.length; i++) {
        var toolName = allowed[i];
        var cfg = ACTION_CONFIG[toolName];
        if (!cfg) {
            out.push({ name: toolName, description: '', confirmation: 'None', entities: [], silent: false });
        } else {
            var entities = [];
            if (cfg.entities && typeof cfg.entities === 'object') {
                var entityNames = Object.keys(cfg.entities);
                for (var j = 0; j < entityNames.length; j++) {
                    var entityName = entityNames[j];
                    var e = cfg.entities[entityName];
                    var eDesc = localized(e.description, language);
                    entities.push({ name: entityName, type: e.type || 'string', description: eDesc, required: !!e.required });
                }
            }
            out.push({
                name: toolName,
                description: localized(cfg.description, language),
                confirmation: cfg.confirmation || 'None',
                entities: entities,
                silent: !!cfg.silent
            });
        }
    }
    return out;
}

function buildActionResults(scenario, language, vars) {
    if (typeof SCENARIO_TOOLS === 'undefined' || typeof ACTION_RESULT_TEMPLATES === 'undefined') return {};
    language = normalizeLanguage(language);
    var results = {};
    var allowed = SCENARIO_TOOLS[scenario] || ['transfer_to_agent'];

    for (var i = 0; i < allowed.length; i++) {
        var actionName = allowed[i];
        if (ACTION_RESULT_TEMPLATES.hasOwnProperty(actionName)) {
            var template = ACTION_RESULT_TEMPLATES[actionName];
            var successText = resolveTemplate(localized(template.success, language), vars);
            var failureText = resolveTemplate(localized(template.failure, language), vars);

            if (successText || failureText) {
                results[actionName] = { success: successText, failure: failureText };
            }
        }
    }
    return results;
}

function buildFallback(caseNum, language, reason) {
    var safeLang = normalizeLanguage(language);
    var emptyVars = {
        deferralDate: '',
        slices: 0,
        dayOfMonth: '',
        firstPaymentDate: '',
        hasCost: false,
        cost: 0,
        costNotice: '',
        toolData: {}
    };

    return {
        error: true,
        errorReason: reason || 'Unknown error',
        scenario: 'fallback_error',
        language: safeLang,
        toolData: {},
        toolDefinitions: buildToolDefinitions('fallback_error', safeLang),
        actionResults: buildActionResults('fallback_error', safeLang, emptyVars),
        cdbCaseData: getCdbCaseData(caseNum),
        caseNumber: caseNum || null,
        caseMessage: null,
        paymentVars: emptyVars,
        message: null,
        opening: '',
        objective: buildObjectivePrompt('fallback_error', safeLang, emptyVars),
        prompt: buildObjectivePrompt('fallback_error', safeLang, emptyVars)
    };
}

function build(caseNum, data, language) {
    if (!data || typeof data !== 'object') return { error: true, message: 'Invalid customer data' };

    if (data.apiResult) data = data.apiResult;

    var safeLang = normalizeLanguage(language);
    var payload = data;

    var scenario = determineScenario(caseNum, payload);
    var vars = extractVariables(payload, safeLang);

    if (!validateRequired(scenario, vars, payload)) {
        return buildFallback(caseNum, safeLang, 'Missing required fields for scenario: ' + scenario);
    }

    var opening = getOpeningText(caseNum, scenario, safeLang, vars);
    var objective = buildObjectivePrompt(scenario, safeLang, vars);

    return {
        error: false,
        scenario: scenario,
        language: safeLang,
        objective: objective,
        message: opening,
        toolData: vars.toolData,
        toolDefinitions: buildToolDefinitions(scenario, safeLang),
        actionResults: buildActionResults(scenario, safeLang, vars),
        cdbCaseData: getCdbCaseData(caseNum),
        caseNumber: caseNum,
        caseMessage: payload.caseMessage || null,
        paymentVars: {
            deferralDate: vars.deferralDate,
            slices: vars.slices,
            dayOfMonth: vars.dayOfMonth,
            firstPaymentDate: vars.firstPaymentDate,
            cost: vars.cost,
            hasCost: vars.hasCost,
            costNotice: vars.costNotice
        }
    };
}

function buildFromRuntime(language) {
    var safeLang = normalizeLanguage(language);

    var runtimeVarObj = (typeof varObj !== 'undefined') ? varObj : null;
    var segmentName = getCurrentSegmentName();

    var apiResult = null;
    if (runtimeVarObj && runtimeVarObj._tempData && segmentName && runtimeVarObj._tempData[segmentName] && runtimeVarObj._tempData[segmentName].apiResult) {
        apiResult = runtimeVarObj._tempData[segmentName].apiResult;
    }

    if (!apiResult || typeof apiResult !== 'object') {
        return buildFallback(0, safeLang, 'Missing apiResult at varObj._tempData[' + segmentName + '].apiResult');
    }

    var payload = apiResult.apiResult || apiResult.data || apiResult.result || apiResult;
    var caseNum = (payload && payload.caseNumber != null) ? payload.caseNumber : apiResult.caseNumber;

    if (caseNum == null || caseNum === 0) {
        return buildFallback(0, safeLang, 'No case number from API');
    }

    return build(caseNum, payload, safeLang);
}

function buildRuntimeResult() {
    var language = normalizeLanguage((typeof varObj !== 'undefined' && varObj && varObj.language) || 'NL');

    var result = buildFromRuntime(language);

    if (typeof segmentState !== 'undefined' && segmentState) {
        if (!segmentState.params) segmentState.params = {};
        segmentState.params.paymentAssistant = result;
    }

    return result;
}

log_debug('[ssviwpd] globalCode.js loaded');
