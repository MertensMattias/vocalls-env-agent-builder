// =============================================================================
// CODE NODE 3 - PROMPT GLUE (micro-utterances + base prompt override + runtime build)
// Dependencies: normalizeLanguage, buildFromRuntime, getCurrentSegmentName, __persona, __advancedInstructions
// =============================================================================

function pickLocalizedText(map, lang) {
    map = (map && typeof map === "object") ? map : {};
    return map[lang] || map.EN || map.NL || "";
}

var __runtimeLang = normalizeLanguage(varObj && varObj.language);

// -----------------------------------------------------------------------------
// 1) MESSAGES (micro-utterances)
// -----------------------------------------------------------------------------

if (typeof MESSAGES === "undefined") {
    var MESSAGES = {
        NL: {
            repeat: ["Nog eens alstublieft?", "Sorry? Kunt u dat herhalen?", "Pardon?"],
            noInput: ["Hoort u mij?", "Bent u er nog?", "Hallo?"],
            waitShort: ["Secondje", "Ehm", "Hm", "Hmm", "Even kijken", "Momentje"],
            wait: ["Een ogenblik alstublieft.", "Een momentje alstublieft."],
            waitConfirmation: ["Natuurlijk.", "Neem uw tijd.", "Geen probleem."],
            confirmation: ["Ok.", "Prima.", "In orde."],
            fill: ["Even kijken.", "Ik controleer het.", "Ik kijk het na."],
            bargeIn: ["Kunt u dat herhalen?", "Sorry, ga verder", "Ga door"]
        },
        FR: {
            repeat: ["Encore une fois, s il vous plait?", "Pardon? Repetez?"],
            noInput: ["M entendez-vous?", "Vous etes la?"],
            waitShort: ["Alors", "Euh", "Hm", "Hmm"],
            wait: ["Un moment, s il vous plait.", "Un instant, s il vous plait."],
            waitConfirmation: ["Bien sur.", "Prenez votre temps.", "Pas de probleme."],
            confirmation: ["D accord.", "Tres bien.", "Ok."],
            fill: ["Je verifie.", "Je regarde.", "Un instant."],
            bargeIn: ["Repetez, s il vous plait?", "Allez-y", "Continuez"]
        },
        DE: {
            repeat: ["Noch einmal bitte?", "Wie bitte? Wiederholen?"],
            noInput: ["Hoeren Sie mich?", "Sind Sie noch da?"],
            waitShort: ["Also", "Ahm", "Hm", "Hmm"],
            wait: ["Einen Moment bitte.", "Einen Augenblick bitte."],
            waitConfirmation: ["Sicher.", "Nehmen Sie sich Zeit.", "Kein Problem."],
            confirmation: ["Okay.", "Gut.", "In Ordnung."],
            fill: ["Ich pruefe das.", "Ich schaue nach.", "Einen Moment."],
            bargeIn: ["Wiederholen bitte?", "Bitte weiter", "Fahren Sie fort"]
        },
        EN: {
            repeat: ["Once again please?", "Sorry? Can you repeat?"],
            noInput: ["Can you hear me?", "Are you still there?"],
            waitShort: ["So", "Uh", "Hm", "Hmm", "Well"],
            wait: ["One moment please.", "Just a second please."],
            waitConfirmation: ["Sure.", "Take your time.", "No problem."],
            confirmation: ["Okay.", "Alright.", "Got it."],
            fill: ["Let me check.", "I will verify.", "One moment."],
            bargeIn: ["Say again please?", "Sorry go ahead", "Continue"]
        }
    };
}

// Export micro-utterances (expects runtime globals)
__gpt_repeat = (MESSAGES[__runtimeLang] && MESSAGES[__runtimeLang].repeat) ? MESSAGES[__runtimeLang].repeat : [];
__gpt_noInput = (MESSAGES[__runtimeLang] && MESSAGES[__runtimeLang].noInput) ? MESSAGES[__runtimeLang].noInput : [];
__gpt_waitShort = (MESSAGES[__runtimeLang] && MESSAGES[__runtimeLang].waitShort) ? MESSAGES[__runtimeLang].waitShort : [];
__gpt_wait = (MESSAGES[__runtimeLang] && MESSAGES[__runtimeLang].wait) ? MESSAGES[__runtimeLang].wait : [];
__gpt_waitConfirmation = (MESSAGES[__runtimeLang] && MESSAGES[__runtimeLang].waitConfirmation) ? MESSAGES[__runtimeLang].waitConfirmation : [];
__gpt_confirmation = (MESSAGES[__runtimeLang] && MESSAGES[__runtimeLang].confirmation) ? MESSAGES[__runtimeLang].confirmation : [];
__gpt_fill = (MESSAGES[__runtimeLang] && MESSAGES[__runtimeLang].fill) ? MESSAGES[__runtimeLang].fill : [];
__gpt_bargeIn = (MESSAGES[__runtimeLang] && MESSAGES[__runtimeLang].bargeIn) ? MESSAGES[__runtimeLang].bargeIn : [];

__gptMaxTokens = 500;
__gptShortWaitDelay = 1000;
__gptLongWaitDelay = 2000;

// -----------------------------------------------------------------------------
// 2) Knowledge + labels (unchanged content, single localizer)
// -----------------------------------------------------------------------------

var GENERAL_KNOWLEDGE = {
    NL: "BETALINGSOPTIES:\n" +
        "- Uitstel van betaling: 30 dagen\n" +
        "- Afbetalingsplan: 3 of 6 maandelijkse termijnen\n" +
        "- Online betaling via klantenzone www.engie.be\n" +
        "- Overschrijving naar IBAN\n" +
        "- Domiciliering: automatische betaling\n\n" +
        "BETALINGSPROCES:\n" +
        "- Betalingstermijn: 14 dagen na factuurdatum\n" +
        "- Facturen per e-mail verstuurd\n" +
        "- Bij niet-betaling: herinnering, aanmaning, incasso\n\n" +
        "CONTACT:\n" +
        "- Telefoon: 078 35 35 34 (werkdagen 8-18u)\n" +
        "- E-mail: klantenservice@engie.be\n" +
        "- Website: www.engie.be\n" +
        "- App: ENGIE Belgium (iOS/Android)",
    FR: "OPTIONS DE PAIEMENT:\n" +
        "- Report de paiement: 30 jours\n" +
        "- Plan de paiement: 3 ou 6 versements mensuels\n" +
        "- Paiement en ligne via zone client www.engie.be\n" +
        "- Virement bancaire vers IBAN\n" +
        "- Domiciliation: paiement automatique\n\n" +
        "PROCESSUS DE PAIEMENT:\n" +
        "- Delai de paiement: 14 jours apres facturation\n" +
        "- Factures envoyees par e-mail\n" +
        "- En cas de non-paiement: rappel, mise en demeure, recouvrement\n\n" +
        "CONTACT:\n" +
        "- Telephone: 078 35 35 34 (jours ouvrables 8h-18h)\n" +
        "- E-mail: klantenservice@engie.be\n" +
        "- Site web: www.engie.be\n" +
        "- App: ENGIE Belgium (iOS/Android)",
    DE: "ZAHLUNGSOPTIONEN:\n" +
        "- Zahlungsaufschub: 30 Tage\n" +
        "- Ratenzahlungsplan: 3 oder 6 monatliche Raten\n" +
        "- Online-Zahlung ueber Kundenzone www.engie.be\n" +
        "- Ueberweisung auf IBAN\n" +
        "- Lastschrift: automatische Zahlung\n\n" +
        "ZAHLUNGSPROZESS:\n" +
        "- Zahlungsfrist: 14 Tage nach Rechnungsdatum\n" +
        "- Rechnungen per E-Mail versendet\n" +
        "- Bei Nichtzahlung: Erinnerung, Mahnung, Inkasso\n\n" +
        "KONTAKT:\n" +
        "- Telefon: 078 35 35 34 (Werktage 8-18 Uhr)\n" +
        "- E-Mail: klantenservice@engie.be\n" +
        "- Website: www.engie.be\n" +
        "- App: ENGIE Belgium (iOS/Android)",
    EN: "PAYMENT OPTIONS:\n" +
        "- Payment deferral: 30 days\n" +
        "- Installment plan: 3 or 6 monthly installments\n" +
        "- Online payment via customer zone www.engie.be\n" +
        "- Bank transfer to IBAN\n" +
        "- Direct debit: automatic payment\n\n" +
        "PAYMENT PROCESS:\n" +
        "- Payment term: 14 days after invoice date\n" +
        "- Invoices sent by email\n" +
        "- In case of non-payment: reminder, formal notice, collection\n\n" +
        "CONTACT:\n" +
        "- Phone: 078 35 35 34 (weekdays 8am-6pm)\n" +
        "- Email: klantenservice@engie.be\n" +
        "- Website: www.engie.be\n" +
        "- App: ENGIE Belgium (iOS/Android)"
};

var COMPANY_INFORMATION = {
    NL: "ENGIE is een energie- en dienstenleverancier in Belgie. We leveren elektriciteit, aardgas en energiediensten aan particulieren en bedrijven.\n\n" +
        "KLANTENZONE:\n" +
        "Via www.engie.be kunnen klanten hun facturen bekijken, meterstand doorgeven, contracten beheren en betalingen doen.\n\n" +
        "BETALINGSREGELINGEN:\n" +
        "ENGIE biedt oplossingen bij betalingsmoeilijkheden zoals uitstel van betaling (30 dagen) of een afbetalingsplan (3 of 6 maanden).",
    FR: "ENGIE est un fournisseur d'energie et de services en Belgique. Nous fournissons de l'electricite, du gaz naturel et des services energetiques.\n\n" +
        "ZONE CLIENT:\n" +
        "Via www.engie.be, les clients peuvent consulter leurs factures, communiquer leur index, gerer leurs contrats et effectuer des paiements.\n\n" +
        "ARRANGEMENTS DE PAIEMENT:\n" +
        "ENGIE propose des solutions en cas de difficultes de paiement comme un report (30 jours) ou un plan (3 ou 6 mois).",
    DE: "ENGIE ist ein Energie- und Dienstleistungsanbieter in Belgien. Wir liefern Strom, Erdgas und Energiedienstleistungen.\n\n" +
        "KUNDENBEREICH:\n" +
        "Ueber www.engie.be koennen Kunden Rechnungen einsehen, Zaehlerstaende mitteilen, Vertraege verwalten und Zahlungen vornehmen.\n\n" +
        "ZAHLUNGSVEREINBARUNGEN:\n" +
        "ENGIE bietet Loesungen bei Zahlungsschwierigkeiten wie Zahlungsaufschub (30 Tage) oder Ratenplan (3 oder 6 Monate).",
    EN: "ENGIE is an energy and services provider in Belgium. We supply electricity, natural gas and energy services.\n\n" +
        "CUSTOMER ZONE:\n" +
        "Via www.engie.be, customers can view invoices, submit meter readings, manage contracts and make payments.\n\n" +
        "PAYMENT ARRANGEMENTS:\n" +
        "ENGIE may offer solutions for payment difficulties such as a deferral (30 days) or an installment plan (3 or 6 months)."
};

var PROMPT_LABELS = {
    NL: {
        persona: "JOUW PERSONA",
        inboundCall: "Je communiceert met de gebruiker via de telefoon, dit is een inkomend gesprek.",
        outboundCall: "Je communiceert met de gebruiker via de telefoon, dit is een uitgaand gesprek.",
        datePrefix: "De huidige datum is ",
        timePrefix: " en de tijd is ",
        rules: "ALGEMENE INSTRUCTIES",
        generalInstructions:
            "- Gebruik duidelijke en beknopte taal.\n" +
            "- Houd je zinnen kort en bondig, zoals in een telefoongesprek.\n" +
            "- Reageer op wat de klant zegt, niet op een vast script.\n" +
            "- Als de klant een vraag stelt, beantwoord die eerst.\n" +
            "- Als je het antwoord niet weet, verzin het niet.\n" +
            "- Communiceer altijd in ",
        voiceRules:
            "- Gebruik geen emoticons tijdens het gesprek.\n" +
            "- Gebruik geen markdown, JSON of HTML syntax tijdens het gesprek.\n",
        advanced: "GEAVANCEERDE INSTRUCTIES",
        knowledge: "JE KENNIS IS",
        companyInfo: "INFORMATIE OVER ",
        userInfo: "INFORMATIE OVER DE GEBRUIKER",
        objectiveLine: "Nu is je HUIDIGE DOELSTELLING in het gesprek:"
    },
    FR: {
        persona: "VOTRE PERSONA",
        inboundCall: "Vous communiquez par telephone, c est un appel entrant.",
        outboundCall: "Vous communiquez par telephone, c est un appel sortant.",
        datePrefix: "La date actuelle est le ",
        timePrefix: " et l heure est ",
        rules: "INSTRUCTIONS GENERALES",
        generalInstructions:
            "- Utilisez un langage clair et concis.\n" +
            "- Gardez vos phrases courtes, comme au telephone.\n" +
            "- Repondez a ce que dit le client, pas a un script fixe.\n" +
            "- Si le client pose une question, repondez d abord.\n" +
            "- Si vous ne savez pas, ne l inventez pas.\n" +
            "- Communiquez toujours en ",
        voiceRules:
            "- N utilisez pas d emoticones pendant le dialogue.\n" +
            "- N utilisez pas de syntaxe markdown, JSON ou HTML pendant le dialogue.\n",
        advanced: "INSTRUCTIONS AVANCEES",
        knowledge: "VOS CONNAISSANCES",
        companyInfo: "INFORMATIONS SUR ",
        userInfo: "INFORMATIONS SUR L UTILISATEUR",
        objectiveLine: "Votre objectif actuel dans le dialogue:"
    },
    DE: {
        persona: "IHRE PERSONA",
        inboundCall: "Sie kommunizieren per Telefon, dies ist ein eingehender Anruf.",
        outboundCall: "Sie kommunizieren per Telefon, dies ist ein ausgehender Anruf.",
        datePrefix: "Das aktuelle Datum ist ",
        timePrefix: " und die Zeit ist ",
        rules: "ALLGEMEINE ANWEISUNGEN",
        generalInstructions:
            "- Verwenden Sie klare und knappe Sprache.\n" +
            "- Halten Sie Saetze kurz, wie in einem Telefongespraech.\n" +
            "- Reagieren Sie auf den Kunden, nicht auf ein festes Skript.\n" +
            "- Wenn der Kunde eine Frage stellt, zuerst beantworten.\n" +
            "- Wenn Sie es nicht wissen, nichts erfinden.\n" +
            "- Kommunizieren Sie immer auf ",
        voiceRules:
            "- Verwenden Sie keine Emoticons waehrend des Dialogs.\n" +
            "- Verwenden Sie keine Markdown-, JSON- oder HTML-Syntax waehrend des Dialogs.\n",
        advanced: "ERWEITERTE ANWEISUNGEN",
        knowledge: "IHR WISSEN",
        companyInfo: "INFORMATIONEN UEBER ",
        userInfo: "INFORMATIONEN UEBER DEN BENUTZER",
        objectiveLine: "Ihr aktuelles Ziel im Dialog:"
    },
    EN: {
        persona: "YOUR PERSONA",
        inboundCall: "You communicate by phone, this is an inbound call.",
        outboundCall: "You communicate by phone, this is an outbound call.",
        datePrefix: "The current date is ",
        timePrefix: " and the time is ",
        rules: "GENERAL INSTRUCTIONS",
        generalInstructions:
            "- Use clear and concise language.\n" +
            "- Keep sentences short, like in a phone call.\n" +
            "- Respond to what the customer says, not a fixed script.\n" +
            "- If the customer asks a question, answer first.\n" +
            "- If you do not know, do not make it up.\n" +
            "- Always communicate in ",
        voiceRules:
            "- Do not use any emoticons during dialogue.\n" +
            "- Do not use markdown, JSON or HTML syntax during dialogue.\n",
        advanced: "ADVANCED INSTRUCTIONS",
        knowledge: "YOUR KNOWLEDGE IS",
        companyInfo: "INFORMATION ABOUT ",
        userInfo: "INFO ABOUT THE USER",
        objectiveLine: "Now, your CURRENT OBJECTIVE in the dialog is:"
    }
};

// -----------------------------------------------------------------------------
// 3) Conversation type detection (guarded, no hard dependency)
// -----------------------------------------------------------------------------

try {
    if (typeof context !== 'undefined' && context && context.callInfo && context.callInfo.from) {
        __conversationType = "voicebot";
    }
} catch (e1) {}

// -----------------------------------------------------------------------------
// 4) Base prompt override
// -----------------------------------------------------------------------------

__gptDialog_getBasePrompt = function (objective) {
    var lang = __runtimeLang;
    var labels = PROMPT_LABELS[lang] || PROMPT_LABELS.NL;

    var prompt = labels.persona + ":\n";

    if (lang === "FR") prompt += "Vous etes un(e) ";
    else if (lang === "DE") prompt += "Sie sind ein(e) ";
    else if (lang === "EN") prompt += "You are a ";
    else prompt += "Je bent een ";

    prompt += __persona.botType;

    if (lang === "FR") prompt += " travaillant chez ";
    else if (lang === "DE") prompt += " bei ";
    else if (lang === "EN") prompt += " working at ";
    else prompt += " die werkt bij een bedrijf genaamd ";

    prompt += __persona.companyName;

    if (lang === "FR") prompt += " avec les specifications suivantes:\n";
    else if (lang === "DE") prompt += " mit folgenden Spezifikationen:\n";
    else if (lang === "EN") prompt += " with the following specifications:\n";
    else prompt += " met de volgende specificaties:\n";

    if (lang === "FR") prompt += "- Votre nom est \"" + __persona.name + "\"\n";
    else if (lang === "DE") prompt += "- Ihr Name ist \"" + __persona.name + "\"\n";
    else if (lang === "EN") prompt += "- Your name is \"" + __persona.name + "\"\n";
    else prompt += "- Je naam is \"" + __persona.name + "\"\n";

    if (lang === "FR") prompt += "- Votre genre est \"" + __persona.gender + "\"\n";
    else if (lang === "DE") prompt += "- Ihr Geschlecht ist \"" + __persona.gender + "\"\n";
    else if (lang === "EN") prompt += "- Your gender is \"" + __persona.gender + "\"\n";
    else prompt += "- Je geslacht is \"" + __persona.gender + "\"\n";

    if (lang === "FR") prompt += "- Votre style de communication est \"" + __persona.tone + "\"\n";
    else if (lang === "DE") prompt += "- Ihr Kommunikationsstil ist \"" + __persona.tone + "\"\n";
    else if (lang === "EN") prompt += "- Your communication style is \"" + __persona.tone + "\"\n";
    else prompt += "- Je communicatiestijl/toon is \"" + __persona.tone + "\"\n";

    if (lang === "FR") prompt += "- Votre style d interaction est " + __persona.interactionStyle + "\n";
    else if (lang === "DE") prompt += "- Ihr Interaktionsstil ist " + __persona.interactionStyle + "\n";
    else if (lang === "EN") prompt += "- Your interaction style is " + __persona.interactionStyle + "\n";
    else prompt += "- Je zult met klanten omgaan " + __persona.interactionStyle + "\n";

    if (lang === "FR") prompt += "- Votre role est " + __persona.companyRole + "\n";
    else if (lang === "DE") prompt += "- Ihre Rolle ist " + __persona.companyRole + "\n";
    else if (lang === "EN") prompt += "- Your role is " + __persona.companyRole + "\n";
    else prompt += "- Je rol is " + __persona.companyRole + "\n";

    if (lang === "FR") prompt += "- Vous parlez avec " + __persona.targetCustomer + "\n";
    else if (lang === "DE") prompt += "- Sie sprechen mit " + __persona.targetCustomer + "\n";
    else if (lang === "EN") prompt += "- You speak with " + __persona.targetCustomer + "\n";
    else prompt += "- Je spreekt met " + __persona.targetCustomer + "\n";

    if (lang === "FR") prompt += "- Votre fonction principale est " + __persona.description + "\n";
    else if (lang === "DE") prompt += "- Ihre Hauptfunktion ist " + __persona.description + "\n";
    else if (lang === "EN") prompt += "- Your main function is " + __persona.description + "\n";
    else prompt += "- Je belangrijkste functie is " + __persona.description + "\n";

    if (__conversationType == "voicebot") {
        try {
            if (
                (typeof context !== 'undefined' && context && context.callInfo && context.callInfo.direction == "inbound") ||
                (typeof context !== 'undefined' && context && context.callInfo && context.callInfo.direction == "outbound" && debugCall)
            ) {
                prompt += "- " + labels.inboundCall + "\n";
            } else {
                prompt += "- " + labels.outboundCall + "\n";
            }
        } catch (e2) {}
    }

    try {
        var now = getCurrentDialogDate();
        var locale = (typeof context !== 'undefined' && context && context.language) ? context.language : lang;
        prompt += "\n" + labels.datePrefix + now.toLocaleDateString(locale, { timeZone: __timeZone }) +
            labels.timePrefix + now.toLocaleTimeString(locale, { timeZone: __timeZone }) + "\n";
    } catch (e3) {}

    prompt += "\n" + labels.rules + ":\n";
    prompt += labels.generalInstructions + __persona.language + ".\n";

    if (__conversationType == "voicebot") {
        prompt += labels.voiceRules;
    }

    if (__advancedInstructions) {
        prompt += "\n" + labels.advanced + ":\n" + __advancedInstructions + "\n";
    }

    var knowledge = pickLocalizedText(GENERAL_KNOWLEDGE, lang);
    if (knowledge) {
        prompt += "\n" + labels.knowledge + ":\n" + knowledge + "\n";
    }

    var companyInfo = pickLocalizedText(COMPANY_INFORMATION, lang);
    if (companyInfo) {
        prompt += "\n" + labels.companyInfo + __persona.companyName + ":\n" + companyInfo + "\n";
    }

    if (typeof __generalUserInfo !== "undefined" && __generalUserInfo) {
        prompt += "\n" + labels.userInfo + ":\n" + __generalUserInfo + "\n";
    }

    if (objective) {
        prompt += "\n" + labels.objectiveLine + "\n" + objective + "\n";
    }

    return prompt;
};

// -----------------------------------------------------------------------------
// 5) Runtime build + storage
// -----------------------------------------------------------------------------

function buildRuntimeResult() {
    var lang = __runtimeLang;

    var result = buildFromRuntime(lang);

    if (typeof segmentState !== 'undefined') {
        if (!segmentState.params) segmentState.params = {};
        segmentState.params.paymentAssistant = result;
    }

    return result;
}

// Typical usage in a Script node before SAY/DIALOG:
agentContext = buildRuntimeResult();





// =============================================================================
// PAYMENT ASSISTANT - ACTION HANDLERS (FULL IMPLEMENTATION EXAMPLE)
// Vocalls Runtime Compatible (ES5)
// =============================================================================
//
// Implements handlers for actions:
// - create_deferral
// - create_installment_plan
// - send_email
// - transfer_to_agent
// - end_conversation
//
// Uses your current API calling pattern:
//   var request = executeApiCall(factoryConfig, varObj, segmentState);
//   return request.then(successFn, failureFn);
//
// Notes:
// - No Promise .catch() used.
// - All variables declared with var.
// - This file assumes these exist in runtime:
//   - executeApiCall(factoryConfig, varObj, segmentState)
//   - logInfo, logError (and optionally logDebug)
//   - varObj, segmentState
//   - agentContext (from your context-prep step)
//
// Segment result names:
// - These are placeholders. Adapt in Vocalls to your actual transitions.
// =============================================================================

RESULT_END = 'END';
RESULT_FAILURE_API = 'FAILURE_API';
RESULT_OPERATOR = 'OPERATOR';
RESULT_END_OPERATOR = 'END_OPERATOR';

function isValidObject(v) {
    return v && typeof v === 'object';
}

function safeJsonStringify(v) {
    try { return JSON.stringify(v); } catch (e) { return '[unstringifiable]'; }
}

function ensureObject(v) {
    return (v && typeof v === 'object') ? v : {};
}

function ensureArray(v) {
    return Object.prototype.toString.call(v) === '[object Array]' ? v : [];
}

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

function recordActionOutcome(actionName, outcome, rawResult) {
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

    // Convenience: pre-rendered continuation text (from context builder)
    if (ctx.actionResults && ctx.actionResults[actionName]) {
        ctx.lastOutcomeMessage = outcome === 'success'
            ? (ctx.actionResults[actionName].success || '')
            : (ctx.actionResults[actionName].failure || '');
    } else {
        ctx.lastOutcomeMessage = '';
    }
}

function isApiFailure(result) {
    // Mirrors your current checks.
    if (!result || result.success !== true) return true;
    if (!isValidObject(result.response)) return true;
    if (result.response.failureOccurred) return true;
    if (result.response.caseNumber === 99) return true;
    return false;
}

function executeFactory(factoryConfig) {
    // Centralized wrapper to enforce same behavior everywhere.
    // Expects executeApiCall(factoryConfig, varObj, segmentState) to return a promise-like.
    var request = executeApiCall(factoryConfig, varObj, segmentState);

    // Ensure we always use .then(success, failure)
    return request.then(
        function (result) {
            return { ok: true, result: result };
        },
        function (error) {
            return { ok: false, error: error };
        }
    );
}

// -----------------------------------------------------------------------------
// Payload preparation helpers (optional but practical)
// -----------------------------------------------------------------------------

function applyDeferralInputsToSegmentState(toolData) {
    // Optional: some implementations read required inputs from segmentState.params
    // Adapt to what your executeApiCall factory expects.
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


// -----------------------------------------------------------------------------
// ACTION: create_deferral
// -----------------------------------------------------------------------------

function action_create_deferral() {
    logInfo('Action: create_deferral');

    var toolData = getToolData();
    var deferralTransactionId = toolData.deferralTransactionId || toolData.deferralTransactionID || null;
    var deferralDate = toolData.deferralDate || null;

    if (!deferralTransactionId || !deferralDate) {
        setSegmentResult(RESULT_FAILURE_API);
        recordActionOutcome('create_deferral', 'failure', { reason: 'Missing deferralTransactionId or deferralDate', toolData: toolData });
        logError('create_deferral: missing required toolData → ' + safeJsonStringify(toolData));
        return;
    }

    try {
        // Ensure required inputs are present where your factories expect them
        applyDeferralInputsToSegmentState(toolData);

        var factoryConfig = 'createPaymentDeferral';
        return executeFactory(factoryConfig).then(
            function (wrapped) {
                if (!wrapped.ok) {
                    setSegmentResult(RESULT_FAILURE_API);
                    recordActionOutcome('create_deferral', 'failure', wrapped.error);
                    logError('create_deferral: request failed → ' + safeJsonStringify(wrapped.error));
                    return;
                }

                var result = wrapped.result;
                if (isApiFailure(result)) {
                    setSegmentResult(RESULT_FAILURE_API);
                    recordActionOutcome('create_deferral', 'failure', result);
                    logError('create_deferral: unexpected response → ' + safeJsonStringify(result));
                    return;
                }

                setSegmentResult(RESULT_END);
                recordActionOutcome('create_deferral', 'success', result);
                logInfo('create_deferral: success');
            },
            function (unexpected) {
                setSegmentResult(RESULT_FAILURE_API);
                recordActionOutcome('create_deferral', 'failure', unexpected);
                logError('create_deferral: unexpected failure → ' + safeJsonStringify(unexpected));
                return;
            }
        );
    } catch (err) {
        setSegmentResult(RESULT_FAILURE_API);
        recordActionOutcome('create_deferral', 'failure', err);
        logError('create_deferral: general failure occurred → ' + safeJsonStringify(err));
        return;
    }
}

// -----------------------------------------------------------------------------
// ACTION: create_installment_plan
// -----------------------------------------------------------------------------

function action_create_installment_plan() {
    logInfo('Action: create_installment_plan');

    var toolData = getToolData();
    var financialTransactionIDList = ensureArray(toolData.financialTransactionIDList);
    var installmentSlices = toolData.installmentSlices;
    var installmentStartDate = toolData.installmentStartDate;

    if (!financialTransactionIDList.length || !installmentSlices || installmentSlices < 1 || !installmentStartDate) {
        setSegmentResult(RESULT_FAILURE_API);
        recordActionOutcome('create_installment_plan', 'failure', { reason: 'Missing required installment fields', toolData: toolData });
        logError('create_installment_plan: missing required toolData → ' + safeJsonStringify(toolData));
        return;
    }

    try {
        applyInstallmentInputsToSegmentState(toolData);

        var factoryConfig = 'createPaymentPlan';
        return executeFactory(factoryConfig).then(
            function (wrapped) {
                if (!wrapped.ok) {
                    setSegmentResult(RESULT_FAILURE_API);
                    recordActionOutcome('create_installment_plan', 'failure', wrapped.error);
                    logError('create_installment_plan: request failed → ' + safeJsonStringify(wrapped.error));
                    return;
                }

                var result = wrapped.result;
                if (isApiFailure(result)) {
                    setSegmentResult(RESULT_FAILURE_API);
                    recordActionOutcome('create_installment_plan', 'failure', result);
                    logError('create_installment_plan: unexpected response → ' + safeJsonStringify(result));
                    return;
                }

                // Optional: if backend returns updated schedule, store it
                // (kept conservative: only set when present)
                var ctx = getAgentContext();
                var responseData = result && (result.response || null);
                if (ctx && responseData && responseData.firstPaymentDate) {
                    if (!ctx.paymentVars) ctx.paymentVars = {};
                    ctx.paymentVars.firstPaymentDate = String(responseData.firstPaymentDate);
                }

                setSegmentResult(RESULT_END);
                recordActionOutcome('create_installment_plan', 'success', result);
                logInfo('create_installment_plan: success');
            },
            function (unexpected) {
                setSegmentResult(RESULT_FAILURE_API);
                recordActionOutcome('create_installment_plan', 'failure', unexpected);
                logError('create_installment_plan: unexpected failure → ' + safeJsonStringify(unexpected));
                return;
            }
        );
    } catch (err) {
        setSegmentResult(RESULT_FAILURE_API);
        recordActionOutcome('create_installment_plan', 'failure', err);
        logError('create_installment_plan: general failure occurred → ' + safeJsonStringify(err));
        return;
    }
}

// -----------------------------------------------------------------------------
// ACTION: send_email
// -----------------------------------------------------------------------------

function action_send_email(args) {
    logInfo('Action: send_email');

    var toolData = getToolData();

    try {
        var factoryConfig = 'sendUrlByEmail';
        return executeFactory(factoryConfig).then(
            function (wrapped) {
                if (!wrapped.ok) {
                    setSegmentResult(RESULT_FAILURE_API);
                    recordActionOutcome('send_email', 'failure', wrapped.error);
                    logError('send_email: request failed → ' + safeJsonStringify(wrapped.error));
                    return;
                }

                var result = wrapped.result;
                if (isApiFailure(result)) {
                    setSegmentResult(RESULT_FAILURE_API);
                    recordActionOutcome('send_email', 'failure', result);
                    logError('send_email: unexpected response → ' + safeJsonStringify(result));
                    return;
                }

                setSegmentResult(RESULT_END);
                recordActionOutcome('send_email', 'success', result);
                logInfo('send_email: success');
            },
            function (unexpected) {
                setSegmentResult(RESULT_FAILURE_API);
                recordActionOutcome('send_email', 'failure', unexpected);
                logError('send_email: unexpected failure → ' + safeJsonStringify(unexpected));
                return;
            }
        );
    } catch (err) {
        setSegmentResult(RESULT_FAILURE_API);
        recordActionOutcome('send_email', 'failure', err);
        logError('send_email: general failure occurred → ' + safeJsonStringify(err));
        return;
    }
}

// -----------------------------------------------------------------------------
// ACTION: transfer_to_agent
// -----------------------------------------------------------------------------

function action_transfer_to_agent() {
    // Per your earlier rule: transfer failure is handled outside agent scope; transfer = success.
    // This handler should just route to the transfer transition.
    logInfo('Action: transfer_to_agent');

    try {
        setSegmentResult(RESULT_OPERATOR); // adapt to your flow (e.g. END_OPERATOR)
        recordActionOutcome('transfer_to_agent', 'success', { note: 'Transfer initiated' });
        return;
    } catch (err) {
        // Still treat as operator if possible, but record failure.
        setSegmentResult(RESULT_OPERATOR);
        recordActionOutcome('transfer_to_agent', 'failure', err);
        logError('transfer_to_agent: general failure occurred → ' + safeJsonStringify(err));
        return;
    }
}

// -----------------------------------------------------------------------------
// ACTION: end_conversation
// -----------------------------------------------------------------------------

function action_end_conversation() {
    logInfo('Action: end_conversation');

    try {
        setSegmentResult(RESULT_END);
        recordActionOutcome('end_conversation', 'success', { note: 'Conversation ended' });
        return;
    } catch (err) {
        // If ending fails, prefer operator rather than looping.
        setSegmentResult(RESULT_END_OPERATOR);
        recordActionOutcome('end_conversation', 'failure', err);
        logError('end_conversation: general failure occurred → ' + safeJsonStringify(err));
        return;
    }
}

// -----------------------------------------------------------------------------
// OPTIONAL DISPATCHER (single entry point)
// -----------------------------------------------------------------------------

function runAction(actionName, args) {
    actionName = String(actionName || '');

    if (actionName === 'create_deferral') return action_create_deferral();
    if (actionName === 'create_installment_plan') return action_create_installment_plan();
    if (actionName === 'send_email') return action_send_email(args);
    if (actionName === 'transfer_to_agent') return action_transfer_to_agent();
    if (actionName === 'end_conversation') return action_end_conversation();

    setSegmentResult(RESULT_FAILURE_API);
    recordActionOutcome(actionName, 'failure', { reason: 'Unknown actionName' });
    logError('runAction: unknown actionName → ' + actionName);
    return;
}