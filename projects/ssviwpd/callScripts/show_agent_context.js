// =============================================================================
// Show agentContext for different cases
// =============================================================================
//
// Prerequisites: bot_persona and context_preparation in globalLibraries
// Run: npm run simulate -- --callScript show_agent_context --project ssviwpd
//
// =============================================================================

function logAgentContext(label, ctx) {
    logInfo('\n========== ' + label + ' ==========');
    logInfo(JSON.stringify(ctx, null, 2));
    logInfo('-----------------------------------');
}

// Mock API results for different cases
var CASES = {
    case1_info_only: {
        caseNumber: 1,
        options: {}
    },
    case13_full_choice: {
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
    },
    case13_deferral_only: {
        caseNumber: 13,
        options: {
            paymentDeferralAvailable: true,
            installmentPlanAvailable: false,
            deferralProposal: {
                nearestPaymentDeferral: {
                    deferralDate: '2026-03-20',
                    financialTransactionID: 'TXN-444'
                }
            },
            installmentPlanProposal: {},
            financialTransactionIDList: []
        }
    },
    case13_installment_only: {
        caseNumber: 13,
        options: {
            paymentDeferralAvailable: false,
            installmentPlanAvailable: true,
            deferralProposal: {},
            installmentPlanProposal: {
                slices: 6,
                applyCost: false,
                cost: 0
            },
            installmentPlanStartDate: '2026-04-15',
            financialTransactionIDList: ['TXN-111', 'TXN-222']
        }
    },
    case8_collection_agency: {
        caseNumber: 8,
        options: {}
    },
    case10_website_referral_email: {
        caseNumber: 10,
        options: {}
    }
};

var currentSegment = 'demo';
var lang = (typeof varObj !== 'undefined' && varObj && varObj.language) ? varObj.language : 'NL';

logInfo('=== PERSONA (__persona) ===');
if (typeof __persona !== 'undefined') {
    logInfo(JSON.stringify(__persona, null, 2));
} else {
    logInfo('__persona not set (Bot Persona script must load first)');
}
logInfo('-----------------------------------');

logInfo('\n=== agentContext for sample cases (lang: ' + lang + ') ===');

// Case 1: info_only
varObj = { language: lang, _tempData: {} };
varObj._tempData[currentSegment] = { apiResult: CASES.case1_info_only };
var ctx1 = buildAgentContext(1, CASES.case1_info_only, lang);
logAgentContext('Case 1 - info_only', ctx1);

// Case 13: full_choice
varObj._tempData[currentSegment] = { apiResult: CASES.case13_full_choice };
var ctx13 = buildAgentContext(13, CASES.case13_full_choice, lang);
logAgentContext('Case 13 - full_choice', ctx13);

// Full system prompt (persona + objective) for Case 13
if (typeof __gptDialog_getBasePrompt === 'function') {
    logInfo('\n========== Case 13 - FULL PROMPT (persona + objective) ==========');
    logInfo(__gptDialog_getBasePrompt(ctx13.prompt));
    logInfo('-----------------------------------');
}

// Case 13: deferral_only (downgraded)
varObj._tempData[currentSegment] = { apiResult: CASES.case13_deferral_only };
var ctx13d = buildAgentContext(13, CASES.case13_deferral_only, lang);
logAgentContext('Case 13 - deferral_only (downgraded)', ctx13d);

// Case 13: installment_only (downgraded)
varObj._tempData[currentSegment] = { apiResult: CASES.case13_installment_only };
var ctx13i = buildAgentContext(13, CASES.case13_installment_only, lang);
logAgentContext('Case 13 - installment_only (downgraded)', ctx13i);

// Case 8: collection_agency
varObj._tempData[currentSegment] = { apiResult: CASES.case8_collection_agency };
var ctx8 = buildAgentContext(8, CASES.case8_collection_agency, lang);
logAgentContext('Case 8 - collection_agency', ctx8);

// Case 10: website_referral_email
varObj._tempData[currentSegment] = { apiResult: CASES.case10_website_referral_email };
var ctx10 = buildAgentContext(10, CASES.case10_website_referral_email, lang);
logAgentContext('Case 10 - website_referral_email', ctx10);

// Fallback: empty payload
var ctxFallback = buildFallback(0, lang, 'Missing apiResult at varObj._tempData[demo].apiResult');
logAgentContext('Fallback - empty/missing payload', ctxFallback);

logInfo('\n=== Done ===');
