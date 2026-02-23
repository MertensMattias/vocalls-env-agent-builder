// Bot Persona init - uses config from 02_bot_persona.js when available
// Paste this into the Bot Persona component Init node (Node 7)

__gptComponentVersion = "4.0.0-config";

// detect language from varObj or context
var _detectedLang = 'EN';
if (typeof varObj !== 'undefined' && varObj && varObj.language) {
    _detectedLang = String(varObj.language).toUpperCase();
} else if (typeof context !== 'undefined' && context && context.language) {
    _detectedLang = String(context.language).substr(0, 2).toUpperCase();
}
if (_detectedLang !== 'NL' && _detectedLang !== 'FR' && _detectedLang !== 'DE') {
    _detectedLang = 'EN';
}

__conversationType = 'chatbot';
__conversationLanguage = (typeof context !== 'undefined' && context && context.language) ? context.language.substr(0, 2) : 'en';
try {
    if (context.callInfo.from) {
        __conversationType = 'voicebot';
    }
} catch (e) {}

// apply config from 02_bot_persona.js when available
if (typeof CONFIG !== 'undefined' && CONFIG) {
    __defaultLLMProvider = CONFIG.__defaultLLMProvider;
    __defaultModel = CONFIG.__defaultModel;
    __defaultServiceHost = CONFIG.__defaultServiceHost;
    __logPrompt = CONFIG.__logPrompt;
    __allowBargeIn = CONFIG.__allowBargeIn;
    __typingSound = CONFIG.__typingSound;
    __timeZone = CONFIG.__timeZone || "Europe/Brussels";
    __gptMaxTokens = CONFIG.__gptMaxTokens;
    __gptShortWaitDelay = CONFIG.__gptShortWaitDelay;
    __gptLongWaitDelay = CONFIG.__gptLongWaitDelay;
} else {
    if (!__timeZone) __timeZone = "America/New_York";
    __gptMaxTokens = 500;
    __gptShortWaitDelay = 1000;
    __gptLongWaitDelay = 2000;
}

// persona and messages from config or Component Variables
if (typeof AGENT_PERSONA !== 'undefined' && AGENT_PERSONA && AGENT_PERSONA[_detectedLang]) {
    __persona = AGENT_PERSONA[_detectedLang];
    __advancedInstructions = __persona.advancedInstructions;
    __generalKnowledge = (typeof GENERAL_KNOWLEDGE !== 'undefined' && GENERAL_KNOWLEDGE[_detectedLang]) ? GENERAL_KNOWLEDGE[_detectedLang] : '';
    __companyInformation = (typeof COMPANY_INFORMATION !== 'undefined' && COMPANY_INFORMATION[_detectedLang]) ? COMPANY_INFORMATION[_detectedLang] : '';
    var _msgs = (typeof MESSAGES !== 'undefined' && MESSAGES[_detectedLang]) ? MESSAGES[_detectedLang] : (typeof MESSAGES !== 'undefined' && MESSAGES.EN) ? MESSAGES.EN : { repeat: [], noInput: [], waitShort: [], wait: [], waitConfirmation: [], confirmation: [], fill: [], bargeIn: [] };
    __gpt_repeat = _msgs.repeat || [];
    __gpt_noInput = _msgs.noInput || [];
    __gpt_waitShort = _msgs.waitShort || [];
    __gpt_wait = _msgs.wait || [];
    __gpt_waitConfirmation = _msgs.waitConfirmation || [];
    __gpt_confirmation = _msgs.confirmation || [];
    __gpt_fill = _msgs.fill || [];
    __gpt_bargeIn = _msgs.bargeIn || [];
} else {
    __persona = {
        "name": __name,
        "botType": __conversationType,
        "gender": __gender,
        "companyName": __companyName,
        "tone": __tone,
        "companyRole": __companyRole,
        "targetCustomer": __targetCustomer,
        "language": __language,
        "description": __description,
        "interactionStyle": __interactionStyle,
        "allowBargeIn": (__allowBargeIn == 'true' || __allowBargeIn == true)
    };
    __advancedInstructions = __advancedInstructions;
    __gpt_repeat = [];
    __gpt_noInput = [];
    __gpt_wait = [];
    __gpt_waitShort = [];
    __gpt_waitConfirmation = [];
    __gpt_confirmation = [];
    __gpt_fill = [];
    __gpt_bargeIn = [];
}

if (typeof stopVoiceDetection !== 'function') {
    __persona.allowBargeIn = false;
} else {
    __persona.allowBargeIn = (__allowBargeIn == 'true' || __allowBargeIn == true);
}

__gpt_enteredNodes = [];
__noInputPtr = 0;
__confirmationPtr = 0;
__fillPtr = 0;
__repeatMessagePtr = 0;
__waitMessagePtr = 0;
__waitShortMessagePtr = 0;
__bargeInMessagePtr = 0;
__waitConfirmationMessagePtr = 0;
__gptSeed = 2017;
__gptFunctionCallHistory = [];
__ignoredNodeList = [];
__gptDialogHistoryStartFrom = 0;
__gptLastBotSpeechNode = null;
__gptPreventStreaming = false;
__usePersonaAndKB = true;

if (typeof wordCount === 'undefined') {
    wordCount = function(s) { if (!s) return 0; return s.split(/\s+/).length; };
}

__gptDialog_getNoInputMessage = function () {
    if (__gpt_noInput.length == 0) return "";
    var responseMsg = __gpt_noInput[__noInputPtr];
    __noInputPtr++;
    if (__noInputPtr >= __gpt_noInput.length) __noInputPtr = 0;
    return responseMsg;
};
__gptDialog_getConfirmationMessage = function () {
    if (__gpt_confirmation.length == 0) return "";
    var responseMsg = __gpt_confirmation[__confirmationPtr];
    __confirmationPtr++;
    if (__confirmationPtr >= __gpt_confirmation.length) __confirmationPtr = 0;
    return responseMsg;
};
__gptDialog_getFillMessage = function () {
    if (__gpt_fill.length == 0) return "";
    var responseMsg = __gpt_fill[__fillPtr];
    __fillPtr++;
    if (__fillPtr >= __gpt_fill.length) __fillPtr = 0;
    return responseMsg;
};
__gptDialog_getRepeatMessage = function () {
    if (__gpt_repeat.length == 0) return "";
    var responseMsg = __gpt_repeat[__repeatMessagePtr];
    __repeatMessagePtr++;
    if (__repeatMessagePtr >= __gpt_repeat.length) __repeatMessagePtr = 0;
    return responseMsg;
};
__gptDialog_getWaitMessage = function () {
    if (__gpt_wait.length == 0) return "";
    var responseMsg = __gpt_wait[__waitMessagePtr];
    __waitMessagePtr++;
    if (__waitMessagePtr >= __gpt_wait.length) __waitMessagePtr = 0;
    return responseMsg;
};
__gptDialog_getWaitMessageShort = function () {
    if (__gpt_waitShort.length == 0) return "";
    var responseMsg = __gpt_waitShort[__waitShortMessagePtr];
    __waitShortMessagePtr++;
    if (__waitShortMessagePtr >= __gpt_waitShort.length) __waitShortMessagePtr = 0;
    return responseMsg;
};
__gptDialog_getbargeInMessage = function () {
    if (__gpt_bargeIn.length == 0) return "";
    var responseMsg = __gpt_bargeIn[__bargeInMessagePtr];
    __bargeInMessagePtr++;
    if (__bargeInMessagePtr >= __gpt_bargeIn.length) __bargeInMessagePtr = 0;
    return responseMsg;
};
__gptDialog_getWaitConfirmationMessage = function () {
    if (__gpt_waitConfirmation.length == 0) return "";
    var responseMsg = __gpt_waitConfirmation[__waitConfirmationMessagePtr];
    __waitConfirmationMessagePtr++;
    if (__waitConfirmationMessagePtr >= __gpt_waitConfirmation.length) __waitConfirmationMessagePtr = 0;
    return responseMsg;
};

__gptDialog_mergeAssistantSpeechAndFunctionCall = function (input) {
    var callMessage = null;
    var result = [];
    for (var i = 0; i < input.length; i++) {
        var msg = input[i];
        if (msg.role === 'function' || msg.role === 'tool') {
            if (callMessage) {
                if (callMessage.length > 0) result[result.length - 1].content = callMessage.join(" ");
                callMessage = null;
            }
        } else if (msg.role === 'assistant') {
            if (typeof msg.tool_calls !== 'undefined' || typeof msg.function_call !== 'undefined') {
                if (callMessage) throw new Error("A function call message was found after another with no result inbetween!");
                callMessage = [];
                if (typeof msg.content !== 'undefined') callMessage.push(msg.content);
                result.push(Object.assign({}, msg));
                continue;
            }
            if (callMessage) {
                if (typeof msg.content !== 'undefined') callMessage.push(msg.content);
                continue;
            }
        } else if (callMessage) throw new Error("A '" + msg.role + "' message was found after a function call with no result!");
        result.push(msg);
    }
    if (callMessage) throw new Error("A function call message has no result.");
    return result;
};

__gptDialog_getPrevMessages = function () {
    var _previousConversation = [];
    for (i = __gptDialogHistoryStartFrom; i <= context.speakFlow.size - 1; i++) {
        var __curItem = context.speakFlow.get(i);
        if (!__ignoredNodeList.includes(__curItem.nodeId)) {
            var __role = null;
            if (__curItem.type == 3) __role = "assistant";
            else if (__curItem.type == 5) __role = "user";
            if (__role) {
                var isPreviousFunctionCall = false;
                if (_previousConversation.length > 1 && _previousConversation[_previousConversation.length - 2]["function_call"]) isPreviousFunctionCall = true;
                var __content = __curItem.activity;
                if (__role == 'user') __content = __gptDialog_postprocessDialogSTT(__content);
                if (_previousConversation.length > 0 && isPreviousFunctionCall == false && __gptLastBotSpeechNode == __curItem.nodeId && _previousConversation[_previousConversation.length - 1]["role"] == __role && !_previousConversation[_previousConversation.length - 1]["function_call"]) {
                    _previousConversation[_previousConversation.length - 1]["content"] = _previousConversation[_previousConversation.length - 1]["content"] + " " + __content;
                } else {
                    _previousConversation.push({"role": __role, "content": __content});
                    __gptLastBotSpeechNode = __curItem.nodeId;
                }
            }
        }
        for (f = 0; f < __gptFunctionCallHistory.length; f++) {
            if (__gptFunctionCallHistory[f].speakFlowIndexFunctionCall == i && __gptFunctionCallHistory[f].componentId == __gptComponentId) {
                _previousConversation.push({"role": "assistant", "function_call": {"name": __gptFunctionCallHistory[f].name, "arguments": __gptFunctionCallHistory[f].arguments}});
            }
        }
        for (f = 0; f < __gptFunctionCallHistory.length; f++) {
            if (__gptFunctionCallHistory[f].speakFlowIndexResultSet == i && __gptFunctionCallHistory[f].componentId == __gptComponentId) {
                var __content = __gptFunctionCallHistory[f].result;
                if (__content) {
                    if (typeof __content === 'string' || __content instanceof String) __content = __content.trim();
                    else __content = JSON.stringify(__content);
                } else __content = "";
                _previousConversation.push({"role": "function", "name": __gptFunctionCallHistory[f].name, "content": __content});
            }
        }
    }
    switch (__gptProvider) {
        case "Gemini":
        case "Claude":
            _previousConversation = __gptDialog_mergeAssistantSpeechAndFunctionCall(_previousConversation);
            break;
    }
    return _previousConversation;
};

__gptDialog_addNodeToIgnoreList = function (nodeId) {
    if (__ignoredNodeList.includes(nodeId) == false) __ignoredNodeList.push(nodeId);
};

__gptDialog_clearDialogHistory = function () {
    __gptDialogHistoryStartFrom = context.speakFlow.size;
};

__gptDialog_postprocessDialogSTT = function (__gptInput) {
    if (__conversationType == 'voicebot') {
        switch (context.language.substr(0, 2)) {
            case "en": __gptInput = __gptInput.replace(/SEC/g, 'sec'); break;
        }
    }
    if (typeof postprocessDialogSTT === 'function') {
        __gptInputNew = postprocessDialogSTT(__gptInput);
        if (__gptInputNew) return __gptInputNew;
    }
    return __gptInput;
};

__gptDialog_preprocessDialogTTS = function (__gptOutput) {
    if (__conversationType == 'voicebot' && (__conversationLanguage == 'cs' || __conversationLanguage == 'sk')) {
        __gptOutput = __gptOutput.replace(/:00 hodin/g, ':00');
        __gptOutput = __gptOutput.replace(/\/a(?!>)|\\a(?!>)/g, '');
    }
    if (__conversationType == 'voicebot') {
        __gptOutput = __gptOutput.replace(/:\)/g, '');
        __gptOutput = __gptOutput.replace(/\*/g, ' ');
        __gptOutput = __gptOutput.replace(/!/g, '.');
        if (__conversationLanguage == 'en') __gptOutput = __gptOutput.replace(/&/g, ' and ');
        __gptOutput = XML.formatSequential([__gptOutput]);
    } else if (__conversationType == 'chatbot') {
        if (typeof __gptIsValidXML === 'function' && __gptIsValidXML(__gptOutput) == false) {
            __gptOutput = XML.formatSequential([__gptOutput]);
        }
    }
    if (__gptOutput && typeof preprocessDialogTTS === 'function') {
        __gptOutputNew = preprocessDialogTTS(__gptOutput);
        if (__gptOutputNew) return __gptOutputNew;
    }
    return __gptOutput;
};

__gptGetLastSpeaker = function () {
    var speakFlow = __gptGetCleanSpeakFlow();
    if (!speakFlow.length) return "n/a";
    var last = speakFlow.pop();
    return last.type == 5 ? "user" : "bot";
};

__gptGetCleanSpeakFlow = function () {
    var output = [];
    for (var i = 0; i < context.speakFlow.size; i++) {
        var item = context.speakFlow.get(i);
        if ([3, 5].includes(item.type)) output.push(item);
    }
    return output;
};

__gptBotSpoke = function () {
    for (var i = 0; i < context.speakFlow.size; i++) {
        if (context.speakFlow.get(i).type == 3) return true;
    }
    return false;
};

getCurrentDialogDate = function () { return new Date(); };

getDialogHistory = function () { return __gptDialog_getPrevMessages(); };
addToDialogIgnored = function (nodeId) { return __gptDialog_addNodeToIgnoreList(nodeId); };
clearDialogHistory = function () { return __gptDialog_clearDialogHistory(); };
llmPreventStreaming = function (value) { __gptPreventStreaming = (value !== undefined) ? value : true; };

// Base prompt builder - same output as 02_bot_persona.js, uses PROMPT_LABELS from config
__gptDialog_getBasePrompt = function (objective) {
    var p = __persona;
    var lang = (typeof __conversationLanguage !== 'undefined' && __conversationLanguage) ? __conversationLanguage.toUpperCase() : 'EN';
    if (lang !== 'NL' && lang !== 'FR' && lang !== 'DE') lang = 'EN';
    var L = (typeof PROMPT_LABELS !== 'undefined' && PROMPT_LABELS) ? (PROMPT_LABELS[lang] || PROMPT_LABELS.EN) : null;
    if (!L) {
        L = { persona: 'YOUR PERSONA', youAre: 'You are a ', worksAt: ' working at ', specs: ' with the following specifications', nameLabel: 'Your name is', genderLabel: 'Your gender is', toneLabel: 'Your communication style is', styleLabel: 'Your interaction style is', roleLabel: 'Your role is', audienceLabel: 'You speak with', functionLabel: 'Your main function is', inboundCall: 'You communicate by phone, this is an inbound call.', outboundCall: 'You communicate by phone, this is an outbound call.', datePrefix: 'The current date is ', timePrefix: ' and the time is ', rules: 'GENERAL INSTRUCTIONS', generalInstructions: '- Use clear and concise language.\n- Keep your sentences short and to the point, like in a phone call.\n- Mimic authentic interpersonal communication.\n- Ensure your responses are aligned with the customer\'s needs.\n- Only answer questions that are within your scope of tasks.\n- If the user asks for something you can\'t do, apologize that you can\'t help.\n- If you don\'t know the answer, don\'t make it up and say you don\'t know.\n- Do not answer any questions that are not within your objective.\n- Always communicate in ', voiceRules: '- Do not use any emoticons during dialogue.\n- Do not use markdown, JSON or HTML syntax during dialogue.\n', advanced: 'ADVANCED INSTRUCTIONS', knowledge: 'YOUR KNOWLEDGE IS', companyInfo: 'INFORMATION ABOUT ', userInfo: 'INFO ABOUT THE USER', conversation: 'CONVERSATION STYLE', conversationList: "- Build on what has already been discussed\n- Don't repeat what you already explained\n- Answer customer questions first, then continue\n- If hesitating: help weigh the options\n- If options are known: ask directly for preference\n", objectiveLine: 'Now, your CURRENT OBJECTIVE in the dialog is', clarifierRule: '- Do not assume function parameter values; ask for clarification if ambiguous.\n', voiceTimeRule: '- For times: say "nine o\'clock" not "09:00".\n', voiceToneRule: '- Avoid exclamation marks; use periods for natural tone.\n' };
    }
    var locale = (typeof context !== 'undefined' && context && context.language) ? context.language : 'nl-BE';
    var prompt = L.persona + ':\n';
    prompt += L.youAre + p.botType + L.worksAt + p.companyName + L.specs + ':\n';
    prompt += '- ' + L.nameLabel + ' "' + p.name + '"\n';
    prompt += '- ' + L.genderLabel + ' "' + p.gender + '"\n';
    prompt += '- ' + L.toneLabel + ' "' + p.tone + '"\n';
    prompt += '- ' + L.styleLabel + ' ' + p.interactionStyle + '\n';
    prompt += '- ' + L.roleLabel + ' ' + p.companyRole + '\n';
    prompt += '- ' + L.audienceLabel + ' ' + p.targetCustomer + '\n';
    prompt += '- ' + L.functionLabel + ' ' + p.description + '\n';
    if (__conversationType == 'voicebot') {
        var isInbound = true;
        try {
            if (typeof context !== 'undefined' && context && context.callInfo) {
                isInbound = context.callInfo.direction == 'inbound' || (context.callInfo.direction == 'outbound' && typeof debugCall !== 'undefined' && debugCall);
            }
        } catch (e) {}
        prompt += '- ' + (isInbound ? L.inboundCall : L.outboundCall) + '\n';
    }
    var now = getCurrentDialogDate();
    prompt += '\n' + L.datePrefix + now.toLocaleDateString(locale, { timeZone: __timeZone }) + L.timePrefix + now.toLocaleTimeString(locale, { timeZone: __timeZone }) + '\n';
    prompt += '\n' + L.rules + ':\n';
    prompt += L.generalInstructions + p.language + '.\n';
    prompt += L.clarifierRule;
    if (__conversationType == 'voicebot') {
        prompt += L.voiceRules;
        prompt += L.voiceTimeRule;
        prompt += L.voiceToneRule;
    }
    if (typeof __advancedInstructions !== 'undefined' && __advancedInstructions) {
        prompt += '\n' + L.advanced + ':\n';
        prompt += __advancedInstructions + '\n';
    }
    if (typeof __generalKnowledge !== 'undefined' && __generalKnowledge) {
        prompt += '\n' + L.knowledge + ':\n';
        prompt += __generalKnowledge + '\n';
    }
    prompt += '\n' + L.conversation + ':\n';
    prompt += L.conversationList;
    if (typeof __companyInformation !== 'undefined' && __companyInformation) {
        prompt += '\n' + L.companyInfo + p.companyName + ':\n';
        prompt += __companyInformation + '\n';
    }
    if (typeof __generalUserInfo !== 'undefined' && __generalUserInfo) {
        prompt += '\n' + L.userInfo + ':\n';
        prompt += __generalUserInfo + '\n';
    }
    if (objective) {
        prompt += '\n' + L.objectiveLine + ':\n';
        prompt += objective + '\n';
    }
    return prompt;
};

if (__logPrompt == true && typeof log_debug === 'function') {
    log_debug("Bot Persona v" + __gptComponentVersion + " initialized - lang=" + _detectedLang + ", type=" + __conversationType);
}
if (typeof Task === "undefined" && typeof log_warn === 'function') {
    log_warn("The voicebot engine version is outdated, please update.");
}
if (__persona.description && wordCount(__persona.description) > 50 && typeof log_warn === 'function') {
    log_warn("Bot description too long! Use knowledge/objective instead!");
}
