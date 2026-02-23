// =============================================================================
// PAYMENT ASSISTANT — CONTEXT PREPARATION (REFactored)
// Vocalls Runtime Compatible (ES5)
// =============================================================================
//
// Runs BEFORE the Dialog Node.
//
// Responsibilities:
// - Read API result strictly from: varObj._tempData[currentSegment].apiResult
// - Determine scenario (based on case + options.paymentDeferralAvailable/options.installmentPlanAvailable)
// - Validate required variables for that scenario
// - Produce:
//   - __opening   : first spoken line for a separate Say node
//   - __objective : system prompt for the Dialog node (NO opening included)
//   - agentContext: object for action handlers (toolData, actionResults, cdbCaseData, etc.)
//
// Notes:
// - Do NOT modify Bot Persona script/component here.
// - Action names must match Dialog node output relation names.
//
// =============================================================================


// ─────────────────────────────────────────────────────────────────────────────
// PART 1 — UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

var LANGUAGES = ['NL', 'FR', 'DE', 'EN'];
var DEFAULT_LANGUAGE = 'NL';

function normalizeLanguage(lang) {
    lang = String(lang || DEFAULT_LANGUAGE).toUpperCase();
    for (var i = 0; i < LANGUAGES.length; i++) {
        if (LANGUAGES[i] === lang) return lang;
    }
    return DEFAULT_LANGUAGE;
}

function localized(obj, lang) {
    if (!obj) return '';
    return obj[lang] || obj.EN || obj[DEFAULT_LANGUAGE] || '';
}

function formatDate(iso) {
    if (!iso) return '';
    var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return m[3] + '-' + m[2] + '-' + m[1];
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return ('0' + d.getDate()).slice(-2) + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + d.getFullYear();
}

function safeDayOfMonth(iso) {
    if (!iso) return '';
    var m = String(iso).match(/^\d{4}-\d{2}-(\d{2})/);
    if (m) {
        var day = parseInt(m[1], 10);
        return isNaN(day) ? '' : day;
    }
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

function isTrue(v) {
    return v === true;
}

function ensureObject(v) {
    return (v && typeof v === 'object') ? v : {};
}

function getCurrentSegmentName() {
    if (typeof currentSegment !== 'undefined' && currentSegment) return String(currentSegment);
    if (typeof segmentState !== 'undefined' && segmentState && segmentState.currentSegment) return String(segmentState.currentSegment);
    if (typeof segmentState !== 'undefined' && segmentState && segmentState.params && segmentState.params.currentSegment) return String(segmentState.params.currentSegment);
    return '';
}


// ─────────────────────────────────────────────────────────────────────────────
// PART 2 — CONFIG
// ─────────────────────────────────────────────────────────────────────────────

// Case -> base scenario
var CASE_TO_SCENARIO = {
    "1":  "info_only",
    "2":  "info_only",
    "12": "info_only",
    "8":  "collection_agency",
    "9":  "collection_agency",
    "10": "website_referral_email",
    "11": "website_referral",
    "13": "full_choice",
    "14": "full_choice",
    "20": "full_choice",
    "15": "installment_only",
    "16": "installment_only",
    "17": "installment_only",
    "18": "installment_only"
};

// Scenario -> available actions (must match Dialog node output relations)
var SCENARIO_TOOLS = {
    full_choice:            ["request_payment_deferral", "create_payment_plan", "transfer_to_operator", "end_conversation"],
    deferral_only:          ["request_payment_deferral", "transfer_to_operator", "end_conversation"],
    installment_only:       ["create_payment_plan", "transfer_to_operator", "end_conversation"],
    website_referral_email: ["send_url_by_email", "transfer_to_operator", "end_conversation"],
    website_referral:       ["transfer_to_operator", "end_conversation"],
    info_only:              ["transfer_to_operator", "end_conversation"],
    collection_agency:      ["transfer_to_operator", "end_conversation"],
    fallback_error:         ["transfer_to_operator"]
};

// Cost notice fragments
var COST_NOTICE = {
    NL: " Administratiekost: ",
    FR: " Frais administratifs: ",
    DE: " Verwaltungskosten: ",
    EN: " Administrative cost: "
};
var COST_SUFFIX = {
    NL: " euro.",
    FR: " euros.",
    DE: " Euro.",
    EN: " euros."
};

// Case openings (spoken by a separate Say node). Use {{costNotice}} instead of raw {{cost}}.
var CASE_OPENINGS = {
    "1": {
        NL: "Ik zie dat er een procedure loopt om het openstaande bedrag te innen. Hierdoor kan ik geen betalingsregeling voorstellen. Heeft u hierover een vraag?",
        FR: "Une procedure est en cours pour recouvrer le montant impaye. Je ne peux donc pas proposer de plan de paiement ici. Avez-vous une question a ce sujet?",
        DE: "Es lauft ein Verfahren zur Eintreibung des offenen Betrags. Daher kann ich hier keinen Zahlungsplan anbieten. Haben Sie dazu eine Frage?",
        EN: "A procedure is in place to collect the outstanding amount. For that reason, I cannot offer a payment arrangement here. Do you have a question about this?"
    },
    "2": {
        NL: "Er staat nog een onbetaalde waarborg open. Het is belangrijk dat dit zo snel mogelijk betaald wordt. Heeft u hierover een vraag?",
        FR: "Une garantie impayee est toujours ouverte. Il est important qu'elle soit payee rapidement. Avez-vous une question a ce sujet?",
        DE: "Derzeit ist noch eine unbezahlte Kaution offen. Es ist wichtig, dass diese so schnell wie moglich bezahlt wird. Haben Sie dazu eine Frage?",
        EN: "There is still an unpaid security deposit. It is important that this is paid as soon as possible. Do you have a question about this?"
    },
    "8": { _use: "9" },
    "9": {
        NL: "Uw dossier is overgedragen aan een incassobureau. Hierdoor kan ik geen betalingsregeling meer voorstellen. Wilt u de contactgegevens van dit bureau?",
        FR: "Votre dossier a ete transfere a une agence de recouvrement. Je ne peux donc plus proposer de plan ici. Souhaitez-vous les coordonnees de cette agence?",
        DE: "Ihre Akte wurde an ein Inkassoburo ubergeben. Daher kann ich hier keinen Plan mehr anbieten. Mochten Sie die Kontaktdaten?",
        EN: "Your case has been transferred to a collection agency. I can no longer offer a payment arrangement here. Would you like the agency's contact details?"
    },
    "10": {
        NL: "Ik kan dit hier niet voor u aanmaken. Via de klantenzone op onze website kunt u zelf een afbetalingsplan aanmaken voor bedragen tot 7500 euro. Wilt u dat ik u uitleg hoe?",
        FR: "Je ne peux pas le regler ici. Vous pouvez creer vous-meme un plan de paiement via la zone client, pour des montants jusqu'a 7500 euros. Souhaitez-vous que j'explique comment?",
        DE: "Ich kann das hier nicht einrichten. Sie konnen selbst einen Ratenzahlungsplan im Kundenbereich erstellen, fur Betrage bis 7500 Euro. Soll ich erklaren wie?",
        EN: "I cannot set this up here. You can create an installment plan yourself in the customer zone for amounts up to 7500 euros. Would you like me to explain how?"
    },
    "11": {
        NL: "Ik kan dit hier niet voor u aanmaken. U kunt wel zelf een afbetalingsplan instellen via de klantenzone, voor bedragen tot 7500 euro. Is dat duidelijk voor u?",
        FR: "Je ne peux pas le creer pour vous ici. Vous pouvez configurer vous-meme un plan de paiement via la zone client, pour des montants jusqu'a 7500 euros. Est-ce clair pour vous?",
        DE: "Ich kann das hier nicht fur Sie erstellen. Sie konnen jedoch selbst einen Ratenzahlungsplan im Kundenbereich einrichten, fur Betrage bis 7500 Euro. Ist das klar fur Sie?",
        EN: "I cannot create this for you here. However, you can set up an installment plan yourself via the customer zone for amounts up to 7500 euros. Is that clear for you?"
    },
    "12": {
        NL: "We kunnen geen nieuw afbetalingsplan aanmaken omdat het vorige plan niet werd nageleefd. Heeft u hierover een vraag?",
        FR: "Nous ne pouvons pas creer un nouveau plan de paiement car le precedent n'a pas ete respecte. Avez-vous une question a ce sujet?",
        DE: "Wir konnen keinen neuen Ratenzahlungsplan erstellen, da der vorherige Plan nicht eingehalten wurde. Haben Sie dazu eine Frage?",
        EN: "We cannot create a new installment plan because the previous plan was not respected. Do you have a question about this?"
    },
    "13": {
        NL: "Ik kan u twee mogelijkheden aanbieden: uitstel van betaling tot {{deferralDate}}, of een afbetalingsplan in {{slices}} schijven.{{costNotice}} Wat heeft uw voorkeur?",
        FR: "Je peux vous proposer deux options: un report de paiement jusqu'au {{deferralDate}}, ou un plan de paiement en {{slices}} versements.{{costNotice}} Quelle est votre preference?",
        DE: "Ich kann Ihnen zwei Optionen anbieten: Zahlungsaufschub bis {{deferralDate}} oder einen Ratenzahlungsplan in {{slices}} Raten.{{costNotice}} Was bevorzugen Sie?",
        EN: "I can offer you two options: a payment delay until {{deferralDate}}, or an installment plan in {{slices}} installments.{{costNotice}} What do you prefer?"
    },
    "14": {
        NL: "Ik kan u twee opties aanbieden: uitstel van betaling tot {{deferralDate}}, of een afbetalingsplan in {{slices}} schijven, betaalbaar op de {{dayOfMonth}}e van elke maand.{{costNotice}} Wat kiest u?",
        FR: "Je peux vous proposer deux options: un report de paiement jusqu'au {{deferralDate}}, ou un plan de paiement en {{slices}} versements, payable le {{dayOfMonth}} de chaque mois.{{costNotice}} Que choisissez-vous?",
        DE: "Ich kann Ihnen zwei Optionen anbieten: Zahlungsaufschub bis {{deferralDate}} oder einen Ratenzahlungsplan in {{slices}} Raten, zahlbar am {{dayOfMonth}}.{{costNotice}} Was wahlen Sie?",
        EN: "I can offer you two options: a payment delay until {{deferralDate}}, or an installment plan in {{slices}} installments, payable on the {{dayOfMonth}}th of each month.{{costNotice}} What do you choose?"
    },
    "15": { _use: "16" },
    "16": {
        NL: "Ik kan u een afbetalingsplan aanbieden in {{slices}} schijven, betaalbaar op de {{dayOfMonth}}e van elke maand.{{costNotice}} Zal ik dit voor u regelen?",
        FR: "Je peux vous proposer un plan de paiement en {{slices}} versements, payable le {{dayOfMonth}} de chaque mois.{{costNotice}} Souhaitez-vous que je le mette en place?",
        DE: "Ich kann Ihnen einen Ratenzahlungsplan in {{slices}} Raten anbieten, zahlbar am {{dayOfMonth}} jedes Monats.{{costNotice}} Soll ich das fur Sie einrichten?",
        EN: "I can offer you an installment plan in {{slices}} installments, payable on the {{dayOfMonth}}th of each month.{{costNotice}} Shall I arrange this for you?"
    },
    "17": { _use: "18" },
    "18": {
        NL: "Ik kan u een afbetalingsplan aanbieden in {{slices}} schijven, betaalbaar op de {{dayOfMonth}}e van elke maand.{{costNotice}} Zal ik dit voor u regelen?",
        FR: "Je peux vous proposer un plan de paiement en {{slices}} versements, payable le {{dayOfMonth}} de chaque mois.{{costNotice}} Souhaitez-vous que je le mette en place?",
        DE: "Ich kann Ihnen einen Ratenzahlungsplan in {{slices}} Raten anbieten, zahlbar am {{dayOfMonth}} jedes Monats.{{costNotice}} Soll ich das fur Sie einrichten?",
        EN: "I can offer you an installment plan in {{slices}} installments, payable on the {{dayOfMonth}}th of each month.{{costNotice}} Shall I arrange this for you?"
    },
    "20": { _use: "14" }
};

// Scenario objective prompts (Dialog node system prompt). NO opening included.
var SCENARIO_PROMPTS = {
    full_choice: {
        NL: "Doel: help de klant kiezen tussen uitstel van betaling en een afbetalingsplan.\n" +
            "- Vraag naar de voorkeur als de klant nog niet gekozen heeft.\n" +
            "- Na keuze: bevestig de keuze in 1 korte zin.\n" +
            "- Vraag daarna expliciet om uitvoerbevestiging: 'Zal ik dit nu voor u regelen?'\n" +
            "- Pas na expliciete bevestiging: roep request_payment_deferral of create_payment_plan aan.\n" +
            "- Bij weigering van beide opties: roep transfer_to_operator aan.\n" +
            "- Bij geen antwoord of onduidelijk antwoord: stel 1 korte verduidelijkingsvraag. Bij opnieuw onduidelijk: roep transfer_to_operator aan.\n" +
            "IMPORTANT: geen actie zonder expliciete bevestiging.",
        FR: "Objectif: aider le client a choisir entre un report de paiement et un plan de paiement.\n" +
            "- Demandez la preference si le client n'a pas encore choisi.\n" +
            "- Apres le choix: confirmez en 1 phrase courte.\n" +
            "- Demandez ensuite une confirmation explicite d'execution: 'Voulez-vous que je le fasse maintenant?'\n" +
            "- Seulement apres confirmation: appelez request_payment_deferral ou create_payment_plan.\n" +
            "- Si le client refuse les deux: appelez transfer_to_operator.\n" +
            "- Si reponse floue: 1 question de clarification. Si toujours flou: transfer_to_operator.\n" +
            "IMPORTANT: aucune action sans confirmation explicite.",
        DE: "Ziel: dem Kunden helfen zwischen Zahlungsaufschub und Ratenzahlung zu wahlen.\n" +
            "- Fragen Sie nach der Prferenz, falls der Kunde noch nicht gewahlt hat.\n" +
            "- Nach Wahl: in 1 kurzen Satz bestatigen.\n" +
            "- Danach explizite Ausfuhrungsbestatigung: 'Soll ich das jetzt fur Sie erledigen?'\n" +
            "- Erst nach Bestatigung: request_payment_deferral oder create_payment_plan aufrufen.\n" +
            "- Wenn beide abgelehnt: transfer_to_operator.\n" +
            "- Wenn unklar: 1 Klarungsfrage. Wenn weiter unklar: transfer_to_operator.\n" +
            "WICHTIG: keine Aktion ohne explizite Bestatigung.",
        EN: "Goal: help the customer choose between a payment deferral and an installment plan.\n" +
            "- Ask their preference if they have not chosen yet.\n" +
            "- After a choice: confirm in 1 short sentence.\n" +
            "- Then ask for explicit execution confirmation: 'Shall I do this now for you?'\n" +
            "- Only after explicit confirmation: call request_payment_deferral or create_payment_plan.\n" +
            "- If the customer refuses both: call transfer_to_operator.\n" +
            "- If unclear: ask 1 short clarification question. If still unclear: transfer_to_operator.\n" +
            "IMPORTANT: no action without explicit confirmation."
    },

    deferral_only: {
        NL: "Doel: regel uitstel van betaling als de klant dat wil.\n" +
            "- Vraag of de klant uitstel wil tot {{deferralDate}} als dat nog niet duidelijk is.\n" +
            "- Vraag expliciet om uitvoerbevestiging.\n" +
            "- Pas na expliciete bevestiging: roep request_payment_deferral aan.\n" +
            "- Bij weigering of onduidelijk: transfer_to_operator.\n" +
            "IMPORTANT: geen actie zonder expliciete bevestiging.",
        FR: "Objectif: organiser un report de paiement si le client le souhaite.\n" +
            "- Demandez si le client veut un report jusqu'au {{deferralDate}} si ce n'est pas clair.\n" +
            "- Demandez une confirmation explicite d'execution.\n" +
            "- Seulement apres confirmation: appelez request_payment_deferral.\n" +
            "- Si refus ou flou: transfer_to_operator.\n" +
            "IMPORTANT: aucune action sans confirmation explicite.",
        DE: "Ziel: Zahlungsaufschub einrichten, wenn der Kunde das mochte.\n" +
            "- Fragen Sie ob der Kunde Aufschub bis {{deferralDate}} mochte, falls unklar.\n" +
            "- Explizite Ausfuhrungsbestatigung einholen.\n" +
            "- Erst danach: request_payment_deferral aufrufen.\n" +
            "- Bei Ablehnung oder Unklarheit: transfer_to_operator.\n" +
            "WICHTIG: keine Aktion ohne explizite Bestatigung.",
        EN: "Goal: arrange a payment deferral if the customer wants it.\n" +
            "- Ask if they want a deferral until {{deferralDate}} if unclear.\n" +
            "- Ask for explicit execution confirmation.\n" +
            "- Only after confirmation: call request_payment_deferral.\n" +
            "- If refusal or unclear: transfer_to_operator.\n" +
            "IMPORTANT: no action without explicit confirmation."
    },

    installment_only: {
        NL: "Doel: regel een afbetalingsplan als de klant dat wil.\n" +
            "- Vraag of de klant een plan in {{slices}} schijven wil, betaalbaar op de {{dayOfMonth}}e.\n" +
            "- Vraag expliciet om uitvoerbevestiging.\n" +
            "- Pas na expliciete bevestiging: roep create_payment_plan aan.\n" +
            "- Bij weigering of onduidelijk: transfer_to_operator.\n" +
            "IMPORTANT: geen actie zonder expliciete bevestiging.",
        FR: "Objectif: creer un plan de paiement si le client le souhaite.\n" +
            "- Demandez si le client veut un plan en {{slices}} versements, payable le {{dayOfMonth}}.\n" +
            "- Demandez une confirmation explicite d'execution.\n" +
            "- Seulement apres confirmation: appelez create_payment_plan.\n" +
            "- Si refus ou flou: transfer_to_operator.\n" +
            "IMPORTANT: aucune action sans confirmation explicite.",
        DE: "Ziel: Ratenzahlungsplan erstellen, wenn der Kunde das mochte.\n" +
            "- Fragen Sie ob der Kunde einen Plan mit {{slices}} Raten mochte, zahlbar am {{dayOfMonth}}.\n" +
            "- Explizite Ausfuhrungsbestatigung einholen.\n" +
            "- Erst danach: create_payment_plan aufrufen.\n" +
            "- Bei Ablehnung oder Unklarheit: transfer_to_operator.\n" +
            "WICHTIG: keine Aktion ohne explizite Bestatigung.",
        EN: "Goal: create an installment plan if the customer wants it.\n" +
            "- Ask if they want a plan in {{slices}} installments, payable on the {{dayOfMonth}}th.\n" +
            "- Ask for explicit execution confirmation.\n" +
            "- Only after confirmation: call create_payment_plan.\n" +
            "- If refusal or unclear: transfer_to_operator.\n" +
            "IMPORTANT: no action without explicit confirmation."
    },

    website_referral_email: {
        NL: "Doel: bied aan om een e-mail te sturen met een link naar de klantenzone.\n" +
            "- Vraag expliciet of u de e-mail mag sturen.\n" +
            "- Bij ja: roep send_url_by_email aan.\n" +
            "- Anders: transfer_to_operator of end_conversation afhankelijk van de vraag.\n" +
            "IMPORTANT: geen actie zonder expliciete bevestiging.",
        FR: "Objectif: proposer d'envoyer un e-mail avec un lien vers la zone client.\n" +
            "- Demandez explicitement l'autorisation d'envoyer l'e-mail.\n" +
            "- Si oui: appelez send_url_by_email.\n" +
            "- Sinon: transfer_to_operator ou end_conversation selon la demande.\n" +
            "IMPORTANT: aucune action sans confirmation explicite.",
        DE: "Ziel: anbieten eine E-Mail mit Link zum Kundenbereich zu senden.\n" +
            "- Fragen Sie explizit ob Sie die E-Mail senden durfen.\n" +
            "- Bei Ja: send_url_by_email aufrufen.\n" +
            "- Sonst: transfer_to_operator oder end_conversation je nach Frage.\n" +
            "WICHTIG: keine Aktion ohne explizite Bestatigung.",
        EN: "Goal: offer to send an email with a link to the customer zone.\n" +
            "- Ask explicitly for permission to send the email.\n" +
            "- If yes: call send_url_by_email.\n" +
            "- Otherwise: transfer_to_operator or end_conversation depending on the request.\n" +
            "IMPORTANT: no action without explicit confirmation."
    },

    website_referral: {
        NL: "Doel: leg uit dat de klant dit in de klantenzone kan regelen en check of dit duidelijk is.\n" +
            "- Als de klant hulp wil of het niet duidelijk is: transfer_to_operator.\n" +
            "- Als alles duidelijk is en er zijn geen verdere vragen: end_conversation.",
        FR: "Objectif: expliquer que le client peut le faire via la zone client et verifier si c'est clair.\n" +
            "- Si le client veut de l'aide ou ce n'est pas clair: transfer_to_operator.\n" +
            "- Si tout est clair et pas d'autres questions: end_conversation.",
        DE: "Ziel: erklaren dass der Kunde dies im Kundenbereich erledigen kann und prufen ob es klar ist.\n" +
            "- Wenn der Kunde Hilfe will oder es unklar ist: transfer_to_operator.\n" +
            "- Wenn alles klar und keine weiteren Fragen: end_conversation.",
        EN: "Goal: explain the customer can handle this in the customer zone and check if it is clear.\n" +
            "- If the customer wants help or it is unclear: transfer_to_operator.\n" +
            "- If everything is clear and no further questions: end_conversation."
    },

    info_only: {
        NL: "Doel: beantwoord vragen over de situatie en bepaal of de klant nog hulp nodig heeft.\n" +
            "- Als de klant een medewerker wil: transfer_to_operator.\n" +
            "- Als er geen verdere vragen zijn: end_conversation.",
        FR: "Objectif: repondre aux questions sur la situation et verifier si le client a besoin d'aide.\n" +
            "- Si le client veut un collaborateur: transfer_to_operator.\n" +
            "- Si pas d'autres questions: end_conversation.",
        DE: "Ziel: Fragen zur Situation beantworten und prufen ob der Kunde Hilfe braucht.\n" +
            "- Wenn der Kunde einen Mitarbeiter will: transfer_to_operator.\n" +
            "- Wenn keine weiteren Fragen: end_conversation.",
        EN: "Goal: answer questions about the situation and check if the customer needs help.\n" +
            "- If the customer wants an agent: transfer_to_operator.\n" +
            "- If there are no further questions: end_conversation."
    },

    collection_agency: {
        NL: "Doel: geef informatie over het incassobureau en beantwoord vragen.\n" +
            "- Als de klant hulp wil of niet verder kan: transfer_to_operator.\n" +
            "- Als er geen verdere vragen zijn: end_conversation.",
        FR: "Objectif: fournir les informations sur l'agence de recouvrement et repondre aux questions.\n" +
            "- Si le client veut de l'aide: transfer_to_operator.\n" +
            "- Si pas d'autres questions: end_conversation.",
        DE: "Ziel: Informationen zum Inkassoburo geben und Fragen beantworten.\n" +
            "- Wenn der Kunde Hilfe will: transfer_to_operator.\n" +
            "- Wenn keine weiteren Fragen: end_conversation.",
        EN: "Goal: provide information about the collection agency and answer questions.\n" +
            "- If the customer wants help: transfer_to_operator.\n" +
            "- If there are no further questions: end_conversation."
    },

    fallback_error: {
        NL: "Actie: zeg 1 korte zin dat er een technische fout is en roep meteen transfer_to_operator aan. Wacht niet op een antwoord.",
        FR: "Action: dites 1 phrase courte sur une erreur technique et appelez transfer_to_operator immediatement. N'attendez pas de reponse.",
        DE: "Aktion: sagen Sie 1 kurzen Satz uber einen technischen Fehler und rufen Sie sofort transfer_to_operator auf. Nicht warten.",
        EN: "Action: say 1 short sentence about a technical error and call transfer_to_operator immediately. Do not wait for a response."
    }
};

// Action result templates (used by the dialog to continue after tool result).
// transfer_to_operator is handled outside agent scope; treat as success.
var ACTION_RESULT_TEMPLATES = {
    request_payment_deferral: {
        success: {
            NL: "request_payment_deferral: geslaagd. Bevestig dat het uitstel geregeld is tot {{deferralDate}}. Vraag of de klant nog een vraag heeft.",
            FR: "request_payment_deferral: reussi. Confirmez que le report est organise jusqu'au {{deferralDate}}. Demandez si le client a une autre question.",
            DE: "request_payment_deferral: erfolgreich. Bestatigen Sie den Aufschub bis {{deferralDate}}. Fragen Sie ob es noch eine Frage gibt.",
            EN: "request_payment_deferral: success. Confirm deferral until {{deferralDate}}. Ask if the customer has any other questions."
        },
        failure: {
            NL: "request_payment_deferral: mislukt. Zeg dat er een technisch probleem is en roep transfer_to_operator aan.",
            FR: "request_payment_deferral: echoue. Dites qu'il y a un probleme technique et appelez transfer_to_operator.",
            DE: "request_payment_deferral: fehlgeschlagen. Sagen Sie dass es ein technisches Problem gibt und rufen Sie transfer_to_operator auf.",
            EN: "request_payment_deferral: failed. Say there is a technical problem and call transfer_to_operator."
        }
    },
    create_payment_plan: {
        success: {
            NL: "create_payment_plan: geslaagd. Bevestig dat het afbetalingsplan in {{slices}} schijven is aangemaakt. Eerste betaling op {{firstPaymentDate}}. Vraag of de klant nog een vraag heeft.",
            FR: "create_payment_plan: reussi. Confirmez le plan en {{slices}} versements. Premier paiement le {{firstPaymentDate}}. Demandez si le client a une autre question.",
            DE: "create_payment_plan: erfolgreich. Bestatigen Sie den Plan mit {{slices}} Raten. Erste Zahlung am {{firstPaymentDate}}. Fragen Sie ob es noch eine Frage gibt.",
            EN: "create_payment_plan: success. Confirm plan with {{slices}} installments. First payment on {{firstPaymentDate}}. Ask if the customer has any other questions."
        },
        failure: {
            NL: "create_payment_plan: mislukt. Zeg dat er een technisch probleem is en roep transfer_to_operator aan.",
            FR: "create_payment_plan: echoue. Dites qu'il y a un probleme technique et appelez transfer_to_operator.",
            DE: "create_payment_plan: fehlgeschlagen. Sagen Sie dass es ein technisches Problem gibt und rufen Sie transfer_to_operator auf.",
            EN: "create_payment_plan: failed. Say there is a technical problem and call transfer_to_operator."
        }
    },
    send_url_by_email: {
        success: {
            NL: "send_url_by_email: geslaagd. Bevestig dat de e-mail met de link is verstuurd. Vraag of de klant nog een vraag heeft.",
            FR: "send_url_by_email: reussi. Confirmez que l'e-mail avec le lien a ete envoye. Demandez si le client a une autre question.",
            DE: "send_url_by_email: erfolgreich. Bestatigen Sie dass die E-Mail mit dem Link gesendet wurde. Fragen Sie ob es noch eine Frage gibt.",
            EN: "send_url_by_email: success. Confirm the email with the link was sent. Ask if the customer has any other questions."
        },
        failure: {
            NL: "send_url_by_email: mislukt. Zeg dat er een technisch probleem is en roep transfer_to_operator aan.",
            FR: "send_url_by_email: echoue. Dites qu'il y a un probleme technique et appelez transfer_to_operator.",
            DE: "send_url_by_email: fehlgeschlagen. Sagen Sie dass es ein technisches Problem gibt und rufen Sie transfer_to_operator auf.",
            EN: "send_url_by_email: failed. Say there is a technical problem and call transfer_to_operator."
        }
    },
    transfer_to_operator: {
        success: { NL: "", FR: "", DE: "", EN: "" },
        failure: { NL: "", FR: "", DE: "", EN: "" }
    }
};


// ── CDB case data (unchanged; user will update IDs later) ───────────────────
var CDB_CASE_DATA = {
    "1":  { END: 'cdbLog1', END_OPERATOR: 'cdbLog2', OPERATOR: 'cdbLog3' },
    "2":  { END: 'cdbLog1', END_OPERATOR: 'cdbLog2', OPERATOR: 'cdbLog3' },
    "8":  { END: 'cdbLog1', END_OPERATOR: 'cdbLog2', OPERATOR: 'cdbLog3' },
    "9":  { END: 'cdbLog1', END_OPERATOR: 'cdbLog2', OPERATOR: 'cdbLog3' },
    "10": { END: 'cdbLog1', END_OPERATOR: 'cdbLog2', FAILURE: 'cdbLog3', OPERATOR: 'cdbLog4' },
    "11": { END: 'cdbLog1', END_OPERATOR: 'cdbLog2', OPERATOR: 'cdbLog3' },
    "12": { END: 'cdbLog1', END_OPERATOR: 'cdbLog2', OPERATOR: 'cdbLog3' },
    "13": { END: 'cdbLog1', END_OPERATOR: 'cdbLog2', FAILURE: 'cdbLog3', OPERATOR: 'cdbLog4' },
    "14": { END: 'cdbLog1', END_OPERATOR: 'cdbLog2', FAILURE: 'cdbLog3', OPERATOR: 'cdbLog4' },
    "15": { END: 'cdbLog1', END_OPERATOR: 'cdbLog2', FAILURE: 'cdbLog3', OPERATOR: 'cdbLog4' },
    "16": { END: 'cdbLog1', END_OPERATOR: 'cdbLog2', FAILURE: 'cdbLog3', OPERATOR: 'cdbLog4' },
    "17": { END: 'cdbLog1', END_OPERATOR: 'cdbLog2', FAILURE: 'cdbLog3', OPERATOR: 'cdbLog4' },
    "18": { END: 'cdbLog1', END_OPERATOR: 'cdbLog2', FAILURE: 'cdbLog3', OPERATOR: 'cdbLog4' },
    "20": { END: 'cdbLog1', END_OPERATOR: 'cdbLog2', FAILURE: 'cdbLog3', OPERATOR: 'cdbLog4' }
};
var CDB_FALLBACK = { END_OPERATOR: 'cdbLogEX', FAILURE: 'cdbLogEX', OPERATOR: 'cdbLogEX' };
function getCdbCaseData(caseNum) {
    return CDB_CASE_DATA[String(caseNum)] || CDB_FALLBACK;
}


// ─────────────────────────────────────────────────────────────────────────────
// PART 3 — DATA EXTRACTION + SCENARIO
// ─────────────────────────────────────────────────────────────────────────────

function extractVariables(payload, lang) {
    var data = ensureObject(payload);
    var opt = ensureObject(data.options);

    var deferralProposal = ensureObject(opt.deferralProposal);
    var nearestDeferral = ensureObject(deferralProposal.nearestPaymentDeferral);
    var installmentProposal = ensureObject(opt.installmentPlanProposal);

    var hasCost = isTrue(installmentProposal.applyCost);
    var cost = installmentProposal.cost || 0;

    var vars = {
        deferralDate: formatDate(nearestDeferral.deferralDate),
        slices: installmentProposal.slices || 0,
        dayOfMonth: safeDayOfMonth(opt.installmentPlanStartDate),
        firstPaymentDate: formatDate(opt.installmentPlanStartDate),
        hasCost: hasCost,
        cost: cost
    };

    vars.costNotice = hasCost ? (COST_NOTICE[lang] || COST_NOTICE.EN) + String(cost) + (COST_SUFFIX[lang] || COST_SUFFIX.EN) : '';

    vars.toolData = {
        deferralTransactionId: nearestDeferral.financialTransactionID || null,
        deferralDate: nearestDeferral.deferralDate || null,
        financialTransactionIDList: opt.financialTransactionIDList || [],
        installmentSlices: installmentProposal.slices || 0,
        installmentStartDate: opt.installmentPlanStartDate || null,
        installmentCost: cost,
        installmentApplyCost: hasCost
    };

    return vars;
}

function getAvailabilityFlags(payload) {
    var opt = ensureObject(ensureObject(payload).options);
    return {
        deferralAvailable: isTrue(opt.paymentDeferralAvailable),
        installmentAvailable: isTrue(opt.installmentPlanAvailable)
    };
}

function determineScenario(caseNum, payload) {
    var baseScenario = CASE_TO_SCENARIO[String(caseNum)] || 'info_only';
    var flags = getAvailabilityFlags(payload);

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

function validateRequired(scenario, vars, payload) {
    var flags = getAvailabilityFlags(payload);

    if (scenario === 'full_choice') {
        if (!flags.deferralAvailable || !flags.installmentAvailable) return false;
        if (!vars.deferralDate) return false;
        if (!vars.slices || vars.slices < 1) return false;
        if (!vars.firstPaymentDate) return false;
        if (!vars.dayOfMonth) return false;
        return true;
    }

    if (scenario === 'deferral_only') {
        if (!flags.deferralAvailable) return false;
        if (!vars.deferralDate) return false;
        return true;
    }

    if (scenario === 'installment_only') {
        if (!flags.installmentAvailable) return false;
        if (!vars.slices || vars.slices < 1) return false;
        if (!vars.firstPaymentDate) return false;
        if (!vars.dayOfMonth) return false;
        return true;
    }

    // For non-payment scenarios, nothing required
    return true;
}


// ─────────────────────────────────────────────────────────────────────────────
// PART 4 — BUILD OBJECTIVE, OPENING, ACTION RESULTS
// ─────────────────────────────────────────────────────────────────────────────

// Scenario-aware opening overrides. Used when the case opening is tailored for
// full choice, but the scenario has been downgraded to a single option.
var SCENARIO_OPENINGS = {
    deferral_only: {
        NL: "Ik kan u uitstel van betaling aanbieden tot {{deferralDate}}. Wilt u dat ik dit voor u regel?",
        FR: "Je peux vous proposer un report de paiement jusqu'au {{deferralDate}}. Souhaitez-vous que je le mette en place?",
        DE: "Ich kann Ihnen einen Zahlungsaufschub bis {{deferralDate}} anbieten. Soll ich das fur Sie einrichten?",
        EN: "I can offer you a payment deferral until {{deferralDate}}. Would you like me to arrange this for you?"
    },
    installment_only: {
        NL: "Ik kan u een afbetalingsplan aanbieden in {{slices}} schijven, betaalbaar op de {{dayOfMonth}}e van elke maand.{{costNotice}} Wilt u dat ik dit voor u regel?",
        FR: "Je peux vous proposer un plan de paiement en {{slices}} versements, payable le {{dayOfMonth}} de chaque mois.{{costNotice}} Souhaitez-vous que je le mette en place?",
        DE: "Ich kann Ihnen einen Ratenzahlungsplan in {{slices}} Raten anbieten, zahlbar am {{dayOfMonth}} jedes Monats.{{costNotice}} Soll ich das fur Sie einrichten?",
        EN: "I can offer you an installment plan in {{slices}} installments, payable on the {{dayOfMonth}}th of each month.{{costNotice}} Would you like me to arrange this for you?"
    }
};

function getOpeningText(caseNum, scenario, lang, vars) {
    var key = (caseNum != null) ? String(caseNum) : '';
    if (!key || !CASE_OPENINGS[key]) return '';

    // Override openings for downgraded scenarios on cases that normally present both options.
    if ((key === '13' || key === '14' || key === '20') && (scenario === 'deferral_only' || scenario === 'installment_only')) {
        var scTpl = localized(SCENARIO_OPENINGS[scenario], lang);
        if (scTpl) return resolveTemplate(scTpl, vars);
    }

    var entry = CASE_OPENINGS[key];
    if (entry && entry._use) entry = CASE_OPENINGS[entry._use] || entry;

    var tpl = localized(entry, lang);
    if (!tpl) return '';
    return resolveTemplate(tpl, vars);
}

function buildObjectivePrompt(scenario, lang, vars) {
    var promptTpl = SCENARIO_PROMPTS[scenario] || SCENARIO_PROMPTS.fallback_error;
    var prompt = resolveTemplate(localized(promptTpl, lang), vars);

    // Facts section is useful for payment scenarios, kept concise.
    if (scenario === 'full_choice' || scenario === 'deferral_only' || scenario === 'installment_only') {
        var facts = [];
        if (vars.deferralDate) facts.push('deferralDate: ' + vars.deferralDate);
        if (vars.slices) facts.push('slices: ' + vars.slices);
        if (vars.dayOfMonth) facts.push('dayOfMonth: ' + vars.dayOfMonth);
        if (vars.hasCost) facts.push('adminCost: ' + vars.cost + ' EUR');
        if (facts.length) {
            prompt += '\n\n---\nFeiten:\n- ' + facts.join('\n- ');
        }
    }

    var toolNames = SCENARIO_TOOLS[scenario] || ['transfer_to_operator'];
    prompt += '\n\nAllowed actions: ' + toolNames.join(', ') + '.';
    return prompt;
}

function buildActionResults(scenario, lang, vars) {
    var results = {};
    var scenarioTools = SCENARIO_TOOLS[scenario] || ['transfer_to_operator'];
    for (var i = 0; i < scenarioTools.length; i++) {
        var action = scenarioTools[i];
        if (ACTION_RESULT_TEMPLATES.hasOwnProperty(action)) {
            var outcomes = ACTION_RESULT_TEMPLATES[action];
            results[action] = {};
            for (var outcome in outcomes) {
                if (outcomes.hasOwnProperty(outcome)) {
                    results[action][outcome] = resolveTemplate(localized(outcomes[outcome], lang), vars);
                }
            }
        }
    }
    return results;
}


function buildAgentContext(caseNum, payload, lang) {
    lang = normalizeLanguage(lang);

    if (!payload || typeof payload !== 'object') {
        return buildFallback(caseNum, lang, 'Invalid payload');
    }

    var vars = extractVariables(payload, lang);
    var scenario = determineScenario(caseNum, payload);
    if (!validateRequired(scenario, vars, payload)) {
        return buildFallback(caseNum, lang, 'Missing required fields for scenario: ' + scenario);
    }

    return {
        error: false,
        errorReason: null,
        caseNumber: caseNum,
        scenario: scenario,
        language: lang,
        openingText: getOpeningText(caseNum, scenario, lang, vars),
        prompt: buildObjectivePrompt(scenario, lang, vars),
        toolData: vars.toolData,
        actionResults: buildActionResults(scenario, lang, vars),
        cdbCaseData: getCdbCaseData(caseNum),
        paymentVars: {
            deferralDate: vars.deferralDate,
            slices: vars.slices,
            dayOfMonth: vars.dayOfMonth,
            cost: vars.cost,
            hasCost: vars.hasCost,
            costNotice: vars.costNotice,
            firstPaymentDate: vars.firstPaymentDate
        },
        meta: {
            hasMultipleOptions: scenario === 'full_choice',
            allowsSelfService: scenario === 'full_choice' || scenario === 'deferral_only' || scenario === 'installment_only' ||
                              scenario === 'website_referral_email' || scenario === 'website_referral',
            requiresOperatorTransfer: scenario === 'fallback_error'
        }
    };
}

function buildFallback(caseNum, lang, reason) {
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
        caseNumber: caseNum,
        scenario: 'fallback_error',
        language: normalizeLanguage(lang),
        openingText: '',
        prompt: buildObjectivePrompt('fallback_error', normalizeLanguage(lang), emptyVars),
        toolData: {},
        actionResults: buildActionResults('fallback_error', normalizeLanguage(lang), emptyVars),
        cdbCaseData: CDB_FALLBACK,
        paymentVars: emptyVars,
        meta: {
            hasMultipleOptions: false,
            allowsSelfService: false,
            requiresOperatorTransfer: true
        }
    };
}


// ─────────────────────────────────────────────────────────────────────────────
// PART 5 — MAIN EXECUTION
// ─────────────────────────────────────────────────────────────────────────────

var v = (typeof varObj !== 'undefined') ? varObj : null;
var lang = (v && v.language) ? v.language : DEFAULT_LANGUAGE;

var segName = getCurrentSegmentName();
var apiResult = null;

if (v && v._tempData && segName && v._tempData[segName] && v._tempData[segName].apiResult) {
    apiResult = v._tempData[segName].apiResult;
}

if (!apiResult || typeof apiResult !== 'object') {
    agentContext = buildFallback(0, lang, 'Missing apiResult at varObj._tempData[' + segName + '].apiResult');
} else {
    var payload = apiResult.data || apiResult.result || apiResult;
    var caseNum = (payload && payload.caseNumber != null) ? payload.caseNumber : apiResult.caseNumber;

    if (caseNum == null || caseNum === 0) {
        agentContext = buildFallback(0, lang, 'No case number from API');
    } else {
        agentContext = buildAgentContext(caseNum, payload, lang);
    }
}

// Outputs for flow nodes
__opening = agentContext.openingText || '';
__objective = agentContext.prompt || '';

// Globals used by Designer action/entity descriptions (keep as before)
deferral_days = 30;
installment_slices = agentContext.paymentVars ? agentContext.paymentVars.slices : 0;
deferral_date = agentContext.paymentVars ? agentContext.paymentVars.deferralDate : '';
installment_day = agentContext.paymentVars ? agentContext.paymentVars.dayOfMonth : '';
first_payment_date = agentContext.paymentVars ? agentContext.paymentVars.firstPaymentDate : '';

if (typeof log_debug === 'function') {
    try {
        log_debug('PaymentAssistant: ' + JSON.stringify({
            segment: segName,
            case: agentContext.caseNumber,
            scenario: agentContext.scenario,
            lang: agentContext.language,
            error: agentContext.error
        }));
    } catch (e) {
        // ignore
    }
}

return agentContext;
