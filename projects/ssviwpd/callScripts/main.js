/**
 * main.js - ssviwpd Call Script (Restructured)
 *
 * Self-service IVR: I want a payment delay
 * Generated: 2025-02-09T00:00:00Z
 * Environment default: acc
 *
 * STRUCTURE:
 * 1. Header & initialization logging (lines 1-31)
 * 2. Flow variables (lines 33-88)
 * 3. Result constants & languages (lines 90-97)
 * 4. CONFIG BLOCK (lines 99-1700+)
 *    - Case mapping, prompts, tools, action config
 *    - CDB logs, case openings, result templates
 *    - Persona, messages, knowledge, company info
 *    - varObj (dev data overlay)
 * 5. SCRIPT BODY (lines 1700+)
 *    - Initialize language and agent context
 *    - Set persona and base prompt
 *    - Set segment params at bottom
 */

log_info('=================================================');
log_info('SSVIWPD - Call Script Started');
log_info('Self-service: I want a payment delay');
log_info('=================================================');

log_info('Project Settings:');
log_info('  Module:', 'ssviwpd-module');
log_info('  Default Environment:', 'acc');
log_info('  HTTP Mode:', 'real');
log_info('  Storage Mode:', 'disk');

log_info('Call Information:');
log_info('  Call GUID:', context.callInfo.callGuid);
log_info('  Direction:', context.callInfo.direction);
log_info('  From:', context.callInfo.fromUri);
log_info('  To:', context.callInfo.toUri);
log_info('  Language:', context.language);

context.session.variables.scriptName = 'main';
context.session.variables.scriptExecutedAt = nowUTC();

log_info('Script execution completed successfully');
log_info('=================================================');


// ============================================================================
// FLOW VARIABLES
// ============================================================================

callFlowName = 'ENGIE-SSVIWPD';
environment = null;
language = null;
ani = null;
dnis = null;

interactionStartTime = null;
counter = 30;

iwarIban = null;
iwarSaldo = null;
iwarDate = null;
iwarBankDetailsId = null;
iwarDropActive = false;
iwarDueDate = null;
iwarCaseNumber = null;
iwarCaseMessage = null;
iwarExceptionDetails = null;

agentPersona = null;
agentContext = null;

deferral_days = 0;
customer_confirmed = "";
AGENT_PERSONA = null;

__opening = null;
__objective = null;
__dialogSystemPrompt = null;

installment_slices = null;
deferral_date = null;
deferral_days = 30;
installment_day = null;
first_payment_date = null;
base_prompt = null;

debugCall = true;
debug = true;
paymentAssistantResult = null;
gtwtOrigin = 'I_WANT_A_REFUND';
gtwtReason = null;


// ============================================================================
// RESULT CONSTANTS & LANGUAGES
// ============================================================================

RESULT_END = 'END';
RESULT_FAILURE_API = 'FAILURE_API';
RESULT_OPERATOR = 'OPERATOR';
RESULT_END_OPERATOR = 'END_OPERATOR';
LANGUAGES = ['NL', 'FR', 'DE', 'EN'];
DEFAULT_LANGUAGE = 'NL';


// ============================================================================
// CONFIG BLOCK (at top)
// ============================================================================

// Case number to scenario mapping
var CASE_TO_SCENARIO = {
    "1": "info_only", "2": "info_only", "12": "info_only",
    "8": "collection_agency", "9": "collection_agency",
    "10": "website_referral_email", "11": "website_referral",
    "13": "full_choice", "14": "full_choice", "20": "full_choice",
    "15": "installment_only", "16": "installment_only", "17": "installment_only", "18": "installment_only"
};

// Scenario prompts for objective context
var SCENARIO_PROMPTS = {
    full_choice: {
        NL: "Doel: informeer over betalingsmogelijkheden en help kiezen.\n- Leg optie 1 uit: uitstel tot {{deferralDate}}. Optie 2: {{slices}} schijven, elke maand op de {{dayOfMonth}}e.{{costNotice}}\n- Vraag voorkeur, bevestig keuze, vraag expliciet: Zal ik dit nu regelen?\n- Na expliciete bevestiging: create_deferral of create_installment_plan.\n- transfer_to_agent: bij weigering van beide opties, off-topic, of klant vraagt expliciet om medewerker.\n- Aan het einde: als klant niet tevreden is of meer wil weten: escalate_to_agent. Anders: end_conversation.\nIMPORTANT: Geen actie zonder expliciete bevestiging (behalve end_conversation).",
        FR: "Objectif: aider à choisir entre report et plan de paiement.\n- Option 1: report jusqu'au {{deferralDate}}. Option 2: {{slices}} versements le {{dayOfMonth}}.{{costNotice}}\n- Demandez la préférence, confirmez, puis confirmation explicite d'exécution.\n- Après confirmation: create_deferral ou create_installment_plan.\n- transfer_to_agent: refus des deux options, hors-sujet, ou demande explicite d'un agent.\n- En fin: si le client n'est pas satisfait ou veut en savoir plus: escalate_to_agent. Sinon: end_conversation.\nIMPORTANT: Aucune action sans confirmation explicite (sauf end_conversation).",
        DE: "Ziel: bei der Wahl zwischen Aufschub und Ratenplan helfen.\n- Option 1: Aufschub bis {{deferralDate}}. Option 2: {{slices}} Raten am {{dayOfMonth}}.{{costNotice}}\n- Präferenz erfragen, bestätigen, explizite Ausführungsbestätigung.\n- Nach Bestätigung: create_deferral oder create_installment_plan.\n- transfer_to_agent: Ablehnung beider Optionen, Off-Topic oder explizite Bitte um Mitarbeiter.\n- Am Ende: wenn Kunde unzufrieden oder will mehr wissen: escalate_to_agent. Sonst: end_conversation.\nWICHTIG: Keine Aktion ohne explizite Bestätigung (außer end_conversation).",
        EN: "Goal: help choose between deferral and installment plan.\n- Option 1: deferral until {{deferralDate}}. Option 2: {{slices}} installments on the {{dayOfMonth}}th.{{costNotice}}\n- Ask preference, confirm choice, then explicit execution confirmation.\n- After confirmation: create_deferral or create_installment_plan.\n- transfer_to_agent: refusal of both options, off-topic, or user explicitly asks for an agent.\n- At the end: if customer not satisfied or wants to know more: escalate_to_agent. Otherwise: end_conversation.\nIMPORTANT: No action without explicit confirmation (except end_conversation)."
    },
    deferral_only: {
        NL: "Doel: bied alleen uitstel tot {{deferralDate}} aan.\n- Vraag: Zal ik dit nu voor u regelen? Pas na expliciete bevestiging: create_deferral.\n- transfer_to_agent: bij weigering, off-topic, of klant vraagt om medewerker.\n- Aan het einde: niet tevreden of meer willen weten: escalate_to_agent. Anders: end_conversation.\nIMPORTANT: Geen actie zonder expliciete bevestiging (behalve end_conversation).",
        FR: "Objectif: proposer uniquement un report jusqu'au {{deferralDate}}.\n- Demandez confirmation explicite puis appelez create_deferral.\n- transfer_to_agent: refus, hors-sujet ou demande d'un agent.\n- En fin: pas satisfait ou veut en savoir plus: escalate_to_agent. Sinon: end_conversation.\nIMPORTANT: Aucune action sans confirmation explicite (sauf end_conversation).",
        DE: "Ziel: nur Aufschub bis {{deferralDate}} anbieten.\n- Nach expliziter Bestätigung: create_deferral.\n- transfer_to_agent: Ablehnung, Off-Topic oder Bitte um Mitarbeiter.\n- Am Ende: unzufrieden oder mehr wissen: escalate_to_agent. Sonst: end_conversation.\nWICHTIG: Keine Aktion ohne explizite Bestätigung (außer end_conversation).",
        EN: "Goal: offer only deferral until {{deferralDate}}.\n- After explicit confirmation: call create_deferral.\n- transfer_to_agent: refusal, off-topic or request for an agent.\n- At the end: not satisfied or wants to know more: escalate_to_agent. Otherwise: end_conversation.\nIMPORTANT: No action without explicit confirmation (except end_conversation)."
    },
    installment_only: {
        NL: "Doel: bied afbetalingsplan aan ({{slices}} schijven, {{dayOfMonth}}e).{{costNotice}}\n- Vraag: Zal ik dit plan aanmaken? Pas na expliciete bevestiging: create_installment_plan.\n- transfer_to_agent: bij weigering, off-topic of vraag om medewerker.\n- Aan het einde: niet tevreden of meer willen weten: escalate_to_agent. Anders: end_conversation.\nIMPORTANT: Geen actie zonder expliciete bevestiging (behalve end_conversation).",
        FR: "Objectif: proposer le plan ({{slices}} versements le {{dayOfMonth}}).{{costNotice}}\n- Après confirmation explicite: create_installment_plan.\n- transfer_to_agent: refus, hors-sujet ou demande d'agent.\n- En fin: pas satisfait ou veut plus: escalate_to_agent. Sinon: end_conversation.\nIMPORTANT: Aucune action sans confirmation explicite (sauf end_conversation).",
        DE: "Ziel: Ratenplan anbieten ({{slices}} Raten am {{dayOfMonth}}).{{costNotice}}\n- Nach Bestätigung: create_installment_plan.\n- transfer_to_agent: Ablehnung, Off-Topic oder Agenten-Anfrage.\n- Am Ende: unzufrieden oder mehr: escalate_to_agent. Sonst: end_conversation.\nWICHTIG: Keine Aktion ohne explizite Bestätigung (außer end_conversation).",
        EN: "Goal: offer installment plan ({{slices}} installments on the {{dayOfMonth}}th).{{costNotice}}\n- After explicit confirmation: create_installment_plan.\n- transfer_to_agent: refusal, off-topic or request for agent.\n- At the end: not satisfied or wants more: escalate_to_agent. Otherwise: end_conversation.\nIMPORTANT: No action without explicit confirmation (except end_conversation)."
    },
    website_referral_email: {
        NL: "Doel: verwijs naar klantenzone voor betaalplan. Bied e-mail met link aan. Na expliciet ja: send_email.\n- transfer_to_agent: off-topic of klant vraagt om medewerker.\n- Aan het einde: niet tevreden of meer willen weten: escalate_to_agent. Anders: end_conversation.\nIMPORTANT: Geen actie zonder expliciete bevestiging (behalve end_conversation).",
        FR: "Objectif: diriger vers la zone client. Proposez l'e-mail avec le lien. Après oui explicite: send_email.\n- transfer_to_agent: hors-sujet ou demande d'agent.\n- En fin: pas satisfait ou veut plus: escalate_to_agent. Sinon: end_conversation.\nIMPORTANT: Aucune action sans confirmation explicite (sauf end_conversation).",
        DE: "Ziel: zur Kundenzone verweisen. E-Mail mit Link anbieten. Nach explizitem Ja: send_email.\n- transfer_to_agent: Off-Topic oder Agenten-Anfrage.\n- Am Ende: unzufrieden oder mehr: escalate_to_agent. Sonst: end_conversation.\nWICHTIG: Keine Aktion ohne explizite Bestätigung (außer end_conversation).",
        EN: "Goal: refer to customer zone for plan. Offer email with link. After explicit yes: send_email.\n- transfer_to_agent: off-topic or request for agent.\n- At the end: not satisfied or wants more: escalate_to_agent. Otherwise: end_conversation.\nIMPORTANT: No action without explicit confirmation (except end_conversation)."
    },
    website_referral: {
        NL: "Doel: verwijs naar klantenzone. Leg uit dat zij zelf een plan kunnen maken.\n- Als niet duidelijk of klant wil meer hulp: escalate_to_agent (einde scenario, niet tevreden of meer willen weten).\n- Bij off-topic of expliciete vraag om medewerker: transfer_to_agent.\n- Als alles duidelijk en tevreden: end_conversation.\nIMPORTANT: Geen actie zonder expliciete bevestiging (behalve end_conversation).",
        FR: "Objectif: diriger vers la zone client. Expliquez qu'ils peuvent créer un plan.\n- Si pas clair ou client veut plus d'aide: escalate_to_agent (fin de scénario, pas satisfait ou veut en savoir plus).\n- Si hors-sujet ou demande explicite d'agent: transfer_to_agent.\n- Si clair et satisfait: end_conversation.\nIMPORTANT: Aucune action sans confirmation explicite (sauf end_conversation).",
        DE: "Ziel: zur Kundenzone verweisen. Erklären Sie Selbstbedienung.\n- Wenn unklar oder Kunde will mehr Hilfe: escalate_to_agent (Ende Szenario, unzufrieden oder mehr wissen).\n- Bei Off-Topic oder expliziter Agenten-Anfrage: transfer_to_agent.\n- Wenn klar und zufrieden: end_conversation.\nWICHTIG: Keine Aktion ohne explizite Bestätigung (außer end_conversation).",
        EN: "Goal: refer to customer zone. Explain they can create a plan.\n- If unclear or customer wants more help: escalate_to_agent (end of scenario, not satisfied or wants to know more).\n- If off-topic or explicit request for agent: transfer_to_agent.\n- If clear and satisfied: end_conversation.\nIMPORTANT: No action without explicit confirmation (except end_conversation)."
    },
    info_only: {
        NL: "Doel: informeer over de situatie en beantwoord vragen.\n- Aan het einde: als de klant niet tevreden is of meer wil weten: escalate_to_agent.\n- Bij off-topic of expliciete vraag om medewerker: transfer_to_agent.\n- Als tevreden en geen verdere vragen: end_conversation.\nIMPORTANT: Geen actie zonder expliciete bevestiging (behalve end_conversation).",
        FR: "Objectif: fournir des informations et répondre aux questions.\n- En fin: si le client n'est pas satisfait ou veut en savoir plus: escalate_to_agent.\n- Si hors-sujet ou demande explicite d'agent: transfer_to_agent.\n- Si satisfait et pas d'autres questions: end_conversation.\nIMPORTANT: Aucune action sans confirmation explicite (sauf end_conversation).",
        DE: "Ziel: informieren und Fragen beantworten.\n- Am Ende: wenn Kunde unzufrieden oder will mehr wissen: escalate_to_agent.\n- Bei Off-Topic oder expliziter Agenten-Anfrage: transfer_to_agent.\n- Wenn zufrieden und keine weiteren Fragen: end_conversation.\nWICHTIG: Keine Aktion ohne explizite Bestätigung (außer end_conversation).",
        EN: "Goal: provide information and answer questions.\n- At the end: if customer not satisfied or wants to know more: escalate_to_agent.\n- If off-topic or explicit request for agent: transfer_to_agent.\n- If satisfied and no further questions: end_conversation.\nIMPORTANT: No action without explicit confirmation (except end_conversation)."
    },
    collection_agency: {
        NL: "Doel: informeer dat het dossier bij incasso ligt. Geen betalingsregelingen mogelijk. Beantwoord vragen over contactgegevens.\n- Als klant doorverbinding wil (niet tevreden of meer willen weten): escalate_to_agent.\n- Bij off-topic of expliciete vraag om medewerker: transfer_to_agent.\n- Als tevreden: end_conversation.\nIMPORTANT: Geen actie zonder expliciete bevestiging (behalve end_conversation).",
        FR: "Objectif: informer que le dossier est en recouvrement. Aucun arrangement possible. Répondez aux questions sur les coordonnées.\n- Si le client veut être transféré (pas satisfait ou veut plus): escalate_to_agent.\n- Si hors-sujet ou demande explicite d'agent: transfer_to_agent.\n- Si satisfait: end_conversation.\nIMPORTANT: Aucune action sans confirmation explicite (sauf end_conversation).",
        DE: "Ziel: mitteilen dass die Akte beim Inkasso ist. Keine Zahlungsvereinbarung möglich. Fragen zu Kontaktdaten beantworten.\n- Wenn Kunde Verbindung will (unzufrieden oder mehr wissen): escalate_to_agent.\n- Bei Off-Topic oder expliziter Agenten-Anfrage: transfer_to_agent.\n- Wenn zufrieden: end_conversation.\nWICHTIG: Keine Aktion ohne explizite Bestätigung (außer end_conversation).",
        EN: "Goal: inform that the case is with collection. No payment arrangement possible. Answer questions about contact details.\n- If customer wants to be transferred (not satisfied or wants more): escalate_to_agent.\n- If off-topic or explicit request for agent: transfer_to_agent.\n- If satisfied: end_conversation.\nIMPORTANT: No action without explicit confirmation (except end_conversation)."
    },
    fallback_error: {
        NL: "Actie: zeg 1 korte zin dat er een technische fout is en roep meteen transfer_to_agent aan. Wacht niet op een antwoord.",
        FR: "Action: dites 1 phrase courte sur une erreur technique et appelez transfer_to_agent immediatement. N'attendez pas de reponse.",
        DE: "Aktion: sagen Sie 1 kurzen Satz uber einen technischen Fehler und rufen Sie sofort transfer_to_agent auf. Nicht warten.",
        EN: "Action: say 1 short sentence about a technical error and call transfer_to_agent immediately. Do not wait for a response."
    }
};

// Scenario-to-tools mapping: which actions are allowed per scenario
var SCENARIO_TOOLS = {
    full_choice: ["create_deferral", "create_installment_plan", "transfer_to_agent", "escalate_to_agent", "end_conversation"],
    deferral_only: ["create_deferral", "transfer_to_agent", "escalate_to_agent", "end_conversation"],
    installment_only: ["create_installment_plan", "transfer_to_agent", "escalate_to_agent", "end_conversation"],
    website_referral_email: ["send_email", "transfer_to_agent", "escalate_to_agent", "end_conversation"],
    website_referral: ["transfer_to_agent", "escalate_to_agent", "end_conversation"],
    info_only: ["transfer_to_agent", "escalate_to_agent", "end_conversation"],
    collection_agency: ["transfer_to_agent", "escalate_to_agent", "end_conversation"],
    fallback_error: ["transfer_to_agent"]
};

// ACTION_CONFIG: Describes all possible actions for the LLM
var ACTION_CONFIG = {
    create_deferral: {
        description: {
            NL: "Regel uitstel van betaling.",
            FR: "Organise le deferral.",
            DE: "Richte Deferral ein.",
            EN: "Set up payment deferral."
        },
        confirmation: "Explicit",
        confirmation_message: {
            NL: "Wil je {deferral_days} dagen uitstel van betaling?",
            FR: "Souhaitez-vous {deferral_days} jours de deferral?",
            DE: "Soll ich {deferral_days} Tage der Deferral fur Sie einrichten?",
            EN: "Shall I set up {deferral_days} days of deferral for you?"
        },
        entities: {},
        silent: false
    },
    create_installment_plan: {
        description: {
            NL: "Maakt het afbetalingsplan aan.",
            FR: "Crée le plan de paiement. Appelez cette fonction uniquement lorsque l'utilisateur a explicitement confirmé qu'il souhaite le plan.",
            DE: "Erstellt den Ratenzahlungsplan. Rufen Sie diese Funktion nur auf, wenn der Nutzer explizit bestätigt hat, dass er den Plan möchte.",
            EN: "Creates the installment plan. Call this function only when the user has explicitly confirmed they want the plan."
        },
        confirmation: "Explicit",
        confirmation_message: {
            NL: "Zal ik het plan van {installment_slices} schijven voor u opzetten?",
            FR: "Souhaitez-vous que je mette en place le plan en {installment_slices} mensualites pour vous?",
            DE: "Soll ich den Ratenplan mit {installment_slices} Raten fur Sie einrichten?",
            EN: "Shall I set up the {installment_slices} slices installment plan for you?"
        },
        entities: {},
        silent: false
    },
    send_email: {
        description: {
            NL: "Stuurt e-mail met link naar de klantenzone.",
            FR: "Envoie un e-mail avec le lien vers la zone client.",
            DE: "Sendet E-Mail mit Link zur Kundenzone.",
            EN: "Sends email with link to the customer zone."
        },
        confirmation: "None",
        confirmation_message: {},
        entities: {},
        silent: false
    },
    transfer_to_agent: {
        description: {
            NL: "Verbindt door naar een medewerker. Gebruik bij: off-topic, klant vraagt expliciet om een medewerker, weigering van beide opties, of technische fout. Zeg verder niets.",
            FR: "Transfère à un collaborateur. Utilisez en cas de: hors-sujet, demande explicite d'un collaborateur, refus des deux options, ou erreur technique. Ne dites rien de plus.",
            DE: "Verbindet mit einem Mitarbeiter. Verwenden bei: Off-Topic, Nutzer verlangt ausdrücklich einen Mitarbeiter, Ablehnung beider Optionen oder technischem Fehler. Keine weiteren Worte.",
            EN: "Connects to an agent. Use when: off-topic, user explicitly asks for an agent, refusal of both options, or technical error. No further words."
        },
        confirmation: "Explicit",
        confirmation_message: {},
        entities: {
            transfer_type: {
                type: "string",
                description: {
                    NL: "Classificeert de reden voor het doorverbinden met een medewerker, kies de meest passende categorie uit de volgende waarden: on_customer_request, question_out_of_scope, customer_frustrated or complex_case",
                    FR: "Classifiez la raison du transfert à un collaborateur, choisissez la catégorie la plus appropriée parmi les valeurs suivantes: on_customer_request, question_out_of_scope, customer_frustrated or complex_case",
                    DE: "Klassifizieren Sie die Grundlage für die Verbindung mit einem Mitarbeiter, wählen Sie die am besten passende Kategorie aus den folgenden Werten: on_customer_request, question_out_of_scope, customer_frustrated or complex_case",
                    EN: "Classify the reason for transferring to an agent, choose the most appropriate category from the following values: on_customer_request, question_out_of_scope, customer_frustrated or complex_case"
                },
                required: true
            }
        },
        silent: true
    },
    escalate_to_agent: {
        description: {
            NL: "Escaleert naar een medewerker. Gebruik alleen aan het einde van het scenario wanneer de klant niet tevreden is of meer wil weten. Niet gebruiken bij off-topic of expliciete vraag om medewerker (gebruik dan transfer_to_agent).",
            FR: "Escalade vers un collaborateur. Utilisez uniquement en fin de scénario quand le client n'est pas satisfait ou veut en savoir plus. Ne pas utiliser si hors-sujet ou demande explicite d'un agent (utilisez transfer_to_agent).",
            DE: "Eskalation zu einem Mitarbeiter. Nur am Ende des Szenarios verwenden, wenn der Kunde unzufrieden ist oder mehr wissen möchte. Nicht bei Off-Topic oder expliziter Agenten-Anfrage (dann transfer_to_agent).",
            EN: "Escalates to an agent. Use only at the end of the scenario when the customer is not satisfied or wants to know more. Do not use for off-topic or explicit request for an agent (use transfer_to_agent)."
        },
        confirmation: "None",
        confirmation_message: {},
        entities: {},
        silent: true
    },
    end_conversation: {
        description: {
            NL: "Beëindigt het gesprek. Roep aan om dit gesprek te stoppen, zeg verder niets.",
            FR: "Termine la conversation. Appelez pour terminer la conversation, ne dites rien de plus.",
            DE: "Beendet das Gespräch. Rufen Sie auf, um das Gespräch zu beenden. Keine weiteren Worte.",
            EN: "Ends the conversation. Call to end the conversation. No further words."
        },
        confirmation: "None",
        confirmation_message: {},
        entities: {},
        silent: true
    }
};

var COST_NOTICE = { NL: " Administratiekost: ", FR: " Frais administratifs: ", DE: " Verwaltungskosten: ", EN: " Administrative cost: " };
var COST_SUFFIX = { NL: " euro.", FR: " euros.", DE: " Euro.", EN: " euros." };

// Case opening messages
var CASE_OPENINGS = {
    "1": { NL: "Ik zie dat er een procedure loopt, om het openstaande bedrag te innen. Hierdoor kan ik geen betalings regelingen meer voorstellen. Kan ik u hierover meer uitleg geven?", FR: "Une procédure est en cours pour recouvrer le montant impayé. C'est pourquoi je ne peux pas proposer de solution ici. Puis-je vous donner plus d'explications?", DE: "Es läuft ein Verfahren zur Eintreibung des offenen Betrags. Deshalb kann ich hier keine Regelung aanbieden. Kann ich Ihnen dazu mehr erklären?", EN: "There is a procedure in place to collect the outstanding amount. For that reason, I cannot offer a solution here. Can I give you more information about this?" },
    "2": { NL: "Er staat momenteel nog een onbetaalde waarborg open, het is belangrijk dat je dit zo snel mogelijk in orde brengt. Heb je hierover nog vragen?", FR: "Une garantie impayée est actuellement en cours. Il est important qu'elle soit réglée rapidement. Avez-vous une question à ce sujet?", DE: "Derzeit ist eine unbezahlte Kaution offen. Es ist wichtig, dass dieser so schnell wie möglich beglichen wird. Haben Sie dazu eine Frage?", EN: "There is currently an unpaid security deposit. It is important that this is paid as soon as possible. Do you have a question about this?" },
    "8": { _use: "9" },
    "9": { NL: "Uw dossier is overgedragen aan een incassobureau, zij staan in voor de verdere afhandeling hiervan. Hierdoor kan ik je geen betalingsregeling meer voorstellen. Wil je de contact gegevens van dit bureau?", FR: "Votre dossier a été transféré à une agence de recouvrement. Je ne peux donc plus rien modifier ici. Souhaitez-vous que je vous donne les coordonnées de cette agence?", DE: "Ihre Akte wurde an ein Inkassobüro übergeben. Daher kann ich hier nichts mehr ändern. Möchten Sie, dass ich Ihnen die Kontaktdaten nenne?", EN: "Your case has been transferred to a collection agency. I can no longer make changes here. Would you like me to provide the agency's contact details?" },
    "10": { NL: "Er is een mogelijkheid om een afbetalingsplan in te stellen, enkel kan ik dit niet voor je doen. Via de klantenzone op onze website, kan je zelf een afbetalingsplan aanmaken, dit voor bedragen tot 7500 euro. Zal ik uitleggen hoe dat werkt?", FR: "Je ne peux pas le régler directement ici. Vous pouvez créer vous-même un plan de paiement dans la zone client, pour des montants jusqu'à 7500 euros. Souhaitez-vous que je vous explique comment cela fonctionne?", DE: "Ich kann das hier nicht direkt regeln. Sie können selbst einen Ratenzahlungsplan im Kundenbereich erstellen, für Beträge bis 7500 Euro. Soll ich erklären, wie das funktioniert?", EN: "I cannot arrange this directly here. You can create an installment plan yourself in the customer zone, for amounts up to 7500 euros. Would you like me to explain how this works?" },
    "11": { NL: "Ik kan dit hier niet voor u aanmaken. U kunt wel zelf een afbetalingsplan instellen via de klantenzone, voor bedragen tot 7500 euro. Is dat duidelijk voor u?", FR: "Je ne peux pas le créer pour vous ici. En revanche, vous pouvez configurer vous-même un plan de paiement via la zone client, pour des montants jusqu'à 7500 euros. Est-ce clair pour vous?", DE: "Ich kann das hier nicht für Sie erstellen. Sie können jedoch selbst einen Ratenzahlungsplan im Kundenbereich einrichten, für Beträge bis 7500 Euro. Ist das für Sie klar?", EN: "I cannot create this for you here. However, you can set up an installment plan yourself via the customer zone, for amounts up to 7500 euros. Is that clear for you?" },
    "12": { NL: "We kunnen geen nieuw afbetalingsplan aanmaken omdat het vorige plan niet werd nageleefd. Kan ik uitleggen wat dit betekent voor uw dossier?", FR: "Nous ne pouvons pas créer un nouveau plan de paiement, car le précédent n'a pas été respecté. Puis-je expliquer ce que cela signifie pour votre dossier?", DE: "Wir können keinen neuen Ratenzahlungsplan erstellen, da der vorherige Plan nicht eingehalten wurde. Kann ich erklären, was das für Ihre Akte bedeutet?", EN: "We cannot create a new installment plan because the previous plan was not respected. Can I explain what this means for your case?" },
    "13": { NL: "Ik kan u twee mogelijkheden aanbieden. U kunt kiezen voor uitstel van betaling met 30 dagen, of voor een afbetalingsplan in {{slices}} schijven. Voor het afbetalingsplan geldt een extra kost van {{cost}} euro. Wat heeft uw voorkeur?", FR: "Je peux vous proposer deux possibilités. Soit un report de paiement de 30 jours, soit un plan de paiement en {{slices}} versements. Des frais supplémentaires de {{cost}} euros s'appliquent au plan. Quelle est votre préférence?", DE: "Ich kann Ihnen zwei Möglichkeiten anbieten. Entweder einen Zahlungsaufschub von 30 Tagen oder einen Ratenzahlungsplan in {{slices}} Raten. Für den Plan fällt eine zusätzliche Gebühr von {{cost}} Euro an. Was bevorzugen Sie?", EN: "I can offer you two options. Either a payment delay of 30 days, or an installment plan in {{slices}} installments. The plan includes an additional cost of {{cost}} euros. What do you prefer?" },
    "14": { NL: "Ik kan u twee opties aanbieden. Ofwel uitstel van betaling tot {{deferralDate}}, ofwel een afbetalingsplan in {{slices}} schijven, betaalbaar op de {{dayOfMonth}}e van elke maand. Wat kiest u?", FR: "Je peux vous proposer deux options. Soit un report de paiement jusqu'au {{deferralDate}}, soit un plan de paiement en {{slices}} versements, payable le {{dayOfMonth}} de chaque mois. Que choisissez-vous?", DE: "Ich kann Ihnen zwei Optionen anbieten. Entweder einen Zahlungsaufschub bis zum {{deferralDate}} oder einen Ratenzahlungsplan in {{slices}} Raten, zahlbar jeweils am {{dayOfMonth}}. Was wählen Sie?", EN: "I can offer you two options. Either a payment delay until {{deferralDate}}, or an installment plan in {{slices}} installments, payable on the {{dayOfMonth}}th of each month. What do you choose?" },
    "15": { _use: "16" },
    "16": { NL: "Ik kan u een afbetalingsplan aanbieden in {{slices}} schijven, betaalbaar op de {{dayOfMonth}}e van elke maand. Daarbij komt een extra kost van {{cost}} euro. Zal ik dit voor u in orde brengen?", FR: "Je peux vous proposer un plan de paiement en {{slices}} versements, payable le {{dayOfMonth}} de chaque mois. Des frais supplémentaires de {{cost}} euros s'appliquent. Souhaitez-vous que je m'en occupe pour vous?", DE: "Ich kann Ihnen einen Ratenzahlungsplan in {{slices}} Raten anbieten, zahlbar am {{dayOfMonth}} jedes Monats. Dafür fällt eine zusätzliche Gebühr von {{cost}} Euro an. Soll ich das für Sie in die Wege leiten?", EN: "I can offer you an installment plan in {{slices}} installments, payable on the {{dayOfMonth}}th of each month. There is an additional cost of {{cost}} euros. Shall I take care of this for you?" },
    "17": { _use: "18" },
    "18": { NL: "Ik kan u een afbetalingsplan aanbieden in {{slices}} schijven, betaalbaar op de {{dayOfMonth}}e van elke maand. Zal ik dit voor u regelen?", FR: "Je peux vous proposer un plan de paiement en {{slices}} versements, payable le {{dayOfMonth}} de chaque mois. Souhaitez-vous que je le mette en place pour vous?", DE: "Ich kann Ihnen einen Ratenzahlingsplan in {{slices}} Raten anbieten, zahlbar am {{dayOfMonth}} jedes Monats. Soll ich das für Sie einrichten?", EN: "I can offer you an installment plan in {{slices}} installments, payable on the {{dayOfMonth}}th of each month. Shall I arrange this for you?" },
    "20": { _use: "14" }
};

var SCENARIO_OPENINGS_OVERRIDE = {
    deferral_only: { NL: "Ik kan u uitstel van betaling aanbieden tot {{deferralDate}}. Wilt u dat ik dit voor u regel?", FR: "Je peux vous proposer un report de paiement jusqu'au {{deferralDate}}. Souhaitez-vous que je le mette en place?", DE: "Ich kann Ihnen einen Zahlungsaufschub bis {{deferralDate}} aanbieden. Soll ich das für Sie einrichten?", EN: "I can offer you a payment deferral until {{deferralDate}}. Would you like me to arrange this for you?" },
    installment_only: { NL: "Ik kan u een afbetalingsplan aanbieden in {{slices}} schijven, betaalbaar op de {{dayOfMonth}}e van elke maand.{{costNotice}} Wilt u dat ik dit voor u regel?", FR: "Je peux vous proposer un plan de paiement en {{slices}} versements, payable le {{dayOfMonth}} de chaque mois.{{costNotice}} Souhaitez-vous que je le mette en place?", DE: "Ich kann Ihnen einen Ratenzahlungsplan in {{slices}} Raten aanbieden, zahlbar am {{dayOfMonth}} jedes Monats.{{costNotice}} Soll ich das für Sie einrichten?", EN: "I can offer you an installment plan in {{slices}} installments, payable on the {{dayOfMonth}}th of each month.{{costNotice}} Would you like me to arrange this for you?" }
};

// Action result templates for conversation feedback
var ACTION_RESULT_TEMPLATES = {
    create_deferral: {
        success: { NL: "create_deferral: geslaagd. Bevestig dat het uitstel geregeld is tot {{deferralDate}}. Vraag of de klant nog een vraag heeft.", FR: "create_deferral: reussi. Confirmez que le report est organise jusqu'au {{deferralDate}}. Demandez si le client a une autre question.", DE: "create_deferral: erfolgreich. Bestatigen Sie den Aufschub bis {{deferralDate}}. Fragen Sie ob es noch eine Frage gibt.", EN: "create_deferral: success. Confirm deferral until {{deferralDate}}. Ask if the customer has any other question." },
        failure: { NL: "create_deferral: mislukt. Zeg dat er een technisch probleem is en roep transfer_to_agent aan.", FR: "create_deferral: echoue. Dites qu'il y a un probleme technique et appelez transfer_to_agent.", DE: "create_deferral: fehlgeschlagen. Sagen Sie dass es ein technisches Problem gibt und rufen Sie transfer_to_agent auf.", EN: "create_deferral: failed. Say there is a technical problem and call transfer_to_agent." }
    },
    create_installment_plan: {
        success: { NL: "create_installment_plan: geslaagd. Bevestig dat het afbetalingsplan in {{slices}} schijven is aangemaakt. Eerste betaling op {{firstPaymentDate}}. Vraag of de klant nog een vraag heeft.", FR: "create_installment_plan: reussi. Confirmez le plan en {{slices}} versements. Premier paiement le {{firstPaymentDate}}. Demandez si le client a une autre question.", DE: "create_installment_plan: erfolgreich. Bestatigen Sie den Plan mit {{slices}} Raten. Erste Zahlung am {{firstPaymentDate}}. Fragen Sie ob es noch eine Frage gibt.", EN: "create_installment_plan: success. Confirm plan with {{slices}} installments. First payment on {{firstPaymentDate}}. Ask if the customer has any other question." },
        failure: { NL: "create_installment_plan: mislukt. Zeg dat er een technisch probleem is en roep transfer_to_agent aan.", FR: "create_installment_plan: echoue. Dites qu'il y a un probleme technique et appelez transfer_to_agent.", DE: "create_installment_plan: fehlgeschlagen. Sagen Sie dass es ein technisches Problem gibt und rufen Sie transfer_to_agent auf.", EN: "create_installment_plan: failed. Say there is a technical problem and call transfer_to_agent." }
    },
    send_email: {
        success: { NL: "send_email: geslaagd. Bevestig dat de e-mail met de link is verstuurd. Vraag of de klant nog een vraag heeft.", FR: "send_email: reussi. Confirmez que l'e-mail avec le lien a ete envoye. Demandez si le client a une autre question.", DE: "send_email: erfolgreich. Bestatigen Sie dass die E-Mail mit dem Link gesendet wurde. Fragen Sie ob es noch eine Frage gibt.", EN: "send_email: success. Confirm the email with the link was sent. Ask if the customer has any other question." },
        failure: { NL: "send_email: mislukt. Zeg dat er een technisch probleem is en roep transfer_to_agent aan.", FR: "send_email: echoue. Dites qu'il y a un probleme technique et appelez transfer_to_agent.", DE: "send_email: fehlgeschlagen. Sagen Sie dass es ein technisches Problem gibt und rufen Sie transfer_to_agent auf.", EN: "send_email: failed. Say there is a technical problem and call transfer_to_agent." }
    },
    transfer_to_agent: { success: { NL: "", FR: "", DE: "", EN: "" }, failure: { NL: "", FR: "", DE: "", EN: "" } },
    escalate_to_agent: { success: { NL: "", FR: "", DE: "", EN: "" }, failure: { NL: "", FR: "", DE: "", EN: "" } },
    end_conversation: { success: { NL: "", FR: "", DE: "", EN: "" }, failure: { NL: "", FR: "", DE: "", EN: "" } }
};

// CDB case-level data mapping
var CDB_CASE_DATA = {
    "1": { END: 'cdbLog24', END_OPERATOR: 'cdbLog25', OPERATOR: 'cdbLogOperator' },
    "2": { END: 'cdbLog23', END_OPERATOR: 'cdbLog2', OPERATOR: 'cdbLogOperator' },
    "8": { END: 'cdbLog7', OPERATOR: 'cdbLogOperator' },
    "9": { END: 'cdbLog7', OPERATOR: 'cdbLogOperator' },
    "10": { END: 'cdbLog9', END_OPERATOR: 'cdbLog10', FAILURE: 'cdbLog9', OPERATOR: 'cdbLog4' },
    "11": { END: 'cdbLog11', END_OPERATOR: 'cdbLog10', OPERATOR: 'cdbLogOperator' },
    "12": { END: 'cdbLog14', OPERATOR: 'cdbLogOperator' },
    "13": { END: 'cdbLog1', END_OPERATOR: 'cdbLog2', FAILURE: 'cdbLog3', OPERATOR: 'cdbLogOperator' },
    "14": { END: 'cdbLog1', END_OPERATOR: 'cdbLog2', FAILURE: 'cdbLog3', OPERATOR: 'cdbLogOperator' },
    "15": { END: 'cdbLog1', END_OPERATOR: 'cdbLog2', FAILURE: 'cdbLog3', OPERATOR: 'cdbLogOperator' },
    "16": { END: 'cdbLog1', END_OPERATOR: 'cdbLog2', FAILURE: 'cdbLog3', OPERATOR: 'cdbLogOperator' },
    "17": { END: 'cdbLog1', END_OPERATOR: 'cdbLog2', FAILURE: 'cdbLog3', OPERATOR: 'cdbLogOperator' },
    "18": { END: 'cdbLog1', END_OPERATOR: 'cdbLog2', FAILURE: 'cdbLog3', OPERATOR: 'cdbLogOperator' },
    "20": { END: 'cdbLog1', END_OPERATOR: 'cdbLog2', FAILURE: 'cdbLog3', OPERATOR: 'cdbLogOperator' },
    "21": { END: 'cdbLog26', OPERATOR: 'cdbLogOperator' }
};

var CDB_FALLBACK = { END: 'cdbLogEX', END_OPERATOR: 'cdbLogEX', FAILURE: 'cdbLogEX', OPERATOR: 'cdbLogEX' };

var FACTS_LABEL = { NL: 'Feiten', FR: 'Données', DE: 'Fakten', EN: 'Facts' };

// Dev data overlay - will be merged at runtime
varObj = {
    "environment": "acc",
    "schedulerId": 4077,
    "customerName": "ENGIE",
    "customerProject": "ENERGYLINE",
    "routingId": "ENGIE-ENERGYLINE-NL",
    "language": "NL",
    "ani": "+32478306999",
    "dnis": "+3257351051",
    "callIdKey": "6e8ae540-d3aa-4bf5-9a00-4f0935ece6cc",
    "interactionStartTime": "2026-02-08T09:02:40.947Z",
    "logVarActive": true,
    "logSegmentActive": true,
    "logCdbActive": true,
    "speechHistoryActive": true,
    "speechLoggingActive": true,
    "useLLMIntentDetection": false,
    "defaultKeysToLog": ["customerName", "customerProject", "routingId", "language", "ani", "dnis", "interactionStartTime", "customer.identificationMethod", "customer.status", "customer.segment"],
    "addKeysToLog": ["customer.contractAccountStatus", "customer.customerCA", "customer.customerBP", "customer.identificationMethod", "customer.status", "customer.segment", "customer.callAvoidance", "customer.giCustomerCA", "customer.giCustomerBP", "customer.giStatus", "customer.giSegment", "customer.globalAlertList", "customer.intentAlertList"],
    "redirect": false,
    "customer": {
        "contractAccountStatus": "INACTIVE",
        "giCustomerCA": "002209914334",
        "giCustomerBP": "1504287443",
        "customerCA": "002209914334",
        "customerBP": "1504287443",
        "identificationMethod": "MANUAL",
        "status": "STANDARD",
        "segment": "RESI",
        "contactInformation": { "firstName": "Marine", "lastName": "Decante", "mobileNumber": "475534011", "telephoneNumber": null, "email": "marine_decante@hotmail.com" },
        "contractAddress": { "street": "RUE DU VAL", "houseNumber": "35A", "postalCode": "7700", "city": "MOUSCRON", "poBox": null, "supplement": "12", "floor": "1" },
        "globalAlertList": [],
        "intentAlertList": [],
        "callAvoidance": { "basic": "NO_BASIC", "direct": "NO_DIRECT", "enterprise": false, "pushToBackOffice": null }
    },
    "_tempData": {
        "SSVIWPD": {
            "apiResult": {
                "legalRecoveryStatus": null,
                "isCollectionAgency": false,
                "subContractorID": null,
                "collectionAgencyName": null,
                "collectionAgencyPhone": null,
                "installmentPlanStatus": "DEACTIVATED",
                "options": {
                    "paymentDeferralAvailable": false,
                    "installmentPlanAvailable": true,
                    "installmentPlanProposal": { "slices": 6, "applyCost": false, "cost": 0 },
                    "deferralProposal": null,
                    "installmentPlanStartDate": "2026-03-17T00:00:00+01:00",
                    "financialTransactionIDList": ["108458344432"]
                },
                "bmcb": "OTHER",
                "caseNumber": 18,
                "caseMessage": "PD_INACT_CA_ONE_GIV",
                "isEligible": true,
                "faults": [],
                "failureOccurred": false
            }
        }
    }
};

// Action-specific CDB log mapping
var ACTION_CDB_LOGS = {
    "1": {
        create_deferral: { success: "cdbLog50_c1_def_ok", failure: "cdbLog51_c1_def_fail" },
        create_installment_plan: { success: "cdbLog30_c1_inst_ok", failure: "cdbLog31_c1_inst_fail" },
        send_email: { success: "cdbLog60_c1_email_ok", failure: "cdbLog61_c1_email_fail" },
        transfer_to_agent: { success: "cdbLogOperator" },
        escalate_to_agent: { success: "cdbLogOperator" },
        end_conversation: { success: "cdbLog24" }
    },
    "2": {
        create_deferral: { success: "cdbLog50_c2_def_ok", failure: "cdbLog51_c2_def_fail" },
        create_installment_plan: { success: "cdbLog30_c2_inst_ok", failure: "cdbLog31_c2_inst_fail" },
        send_email: { success: "cdbLog60_c2_email_ok", failure: "cdbLog61_c2_email_fail" },
        transfer_to_agent: { success: "cdbLogOperator" },
        escalate_to_agent: { success: "cdbLogOperator" },
        end_conversation: { success: "cdbLog23" }
    },
    "8": { transfer_to_agent: { success: "cdbLogOperator" }, escalate_to_agent: { success: "cdbLogOperator" }, end_conversation: { success: "cdbLog7" } },
    "9": { transfer_to_agent: { success: "cdbLogOperator" }, escalate_to_agent: { success: "cdbLogOperator" }, end_conversation: { success: "cdbLog7" } },
    "10": { send_email: { success: "cdbLog60_c10_email_ok", failure: "cdbLog61_c10_email_fail" }, transfer_to_agent: { success: "cdbLog4" }, escalate_to_agent: { success: "cdbLog4" }, end_conversation: { success: "cdbLog9" } },
    "11": { transfer_to_agent: { success: "cdbLogOperator" }, escalate_to_agent: { success: "cdbLogOperator" }, end_conversation: { success: "cdbLog11" } },
    "12": { transfer_to_agent: { success: "cdbLogOperator" }, escalate_to_agent: { success: "cdbLogOperator" }, end_conversation: { success: "cdbLog14" } },
    "13": { create_deferral: { success: "cdbLog50_c13_def_ok", failure: "cdbLog51_c13_def_fail" }, create_installment_plan: { success: "cdbLog30_c13_inst_ok", failure: "cdbLog31_c13_inst_fail" }, transfer_to_agent: { success: "cdbLogOperator" }, escalate_to_agent: { success: "cdbLogOperator" }, end_conversation: { success: "cdbLog1" } },
    "14": { create_deferral: { success: "cdbLog50_c14_def_ok", failure: "cdbLog51_c14_def_fail" }, create_installment_plan: { success: "cdbLog30_c14_inst_ok", failure: "cdbLog31_c14_inst_fail" }, transfer_to_agent: { success: "cdbLogOperator" }, escalate_to_agent: { success: "cdbLogOperator" }, end_conversation: { success: "cdbLog1" } },
    "15": { create_installment_plan: { success: "cdbLog30_c15_inst_ok", failure: "cdbLog31_c15_inst_fail" }, transfer_to_agent: { success: "cdbLogOperator" }, escalate_to_agent: { success: "cdbLogOperator" }, end_conversation: { success: "cdbLog1" } },
    "16": { create_installment_plan: { success: "cdbLog30_c16_inst_ok", failure: "cdbLog31_c16_inst_fail" }, transfer_to_agent: { success: "cdbLogOperator" }, escalate_to_agent: { success: "cdbLogOperator" }, end_conversation: { success: "cdbLog1" } },
    "17": { create_installment_plan: { success: "cdbLog30_c17_inst_ok", failure: "cdbLog31_c17_inst_fail" }, transfer_to_agent: { success: "cdbLogOperator" }, escalate_to_agent: { success: "cdbLogOperator" }, end_conversation: { success: "cdbLog1" } },
    "18": { create_installment_plan: { success: "cdbLog30_c18_inst_ok", failure: "cdbLog31_c18_inst_fail" }, transfer_to_agent: { success: "cdbLogOperator" }, escalate_to_agent: { success: "cdbLogOperator" }, end_conversation: { success: "cdbLog1" } },
    "20": { create_deferral: { success: "cdbLog50_c20_def_ok", failure: "cdbLog51_c20_def_fail" }, create_installment_plan: { success: "cdbLog30_c20_inst_ok", failure: "cdbLog31_c20_inst_fail" }, transfer_to_agent: { success: "cdbLogOperator" }, escalate_to_agent: { success: "cdbLogOperator" }, end_conversation: { success: "cdbLog1" } },
    "21": { transfer_to_agent: { success: "cdbLogOperator" }, escalate_to_agent: { success: "cdbLogOperator" }, end_conversation: { success: "cdbLog26" } }
};

// Execution config: how to execute each action
var ACTION_EXECUTION_CONFIG = {
    create_deferral: {
        factory: 'createPaymentDeferral',
        prepareInputs: applyDeferralInputsToSegmentState,
        successResult: RESULT_END,
        failureResult: RESULT_FAILURE_API,
        validate: function(toolData) {
            var deferralTransactionId = toolData.deferralTransactionId || toolData.deferralTransactionID;
            var deferralDate = toolData.deferralDate;
            if (!deferralTransactionId || !deferralDate) {
                return { valid: false, reason: 'Missing deferralTransactionId or deferralDate', details: { toolData: toolData } };
            }
            return { valid: true };
        }
    },
    create_installment_plan: {
        factory: 'createPaymentPlan',
        prepareInputs: applyInstallmentInputsToSegmentState,
        successResult: RESULT_END,
        failureResult: RESULT_FAILURE_API,
        validate: function(toolData) {
            var financialTransactionIDList = ensureArray(toolData.financialTransactionIDList);
            var installmentSlices = toolData.installmentSlices;
            var installmentStartDate = toolData.installmentStartDate;
            if (!financialTransactionIDList.length || !installmentSlices || installmentSlices < 1 || !installmentStartDate) {
                return { valid: false, reason: 'Missing required installment fields', details: { toolData: toolData } };
            }
            return { valid: true };
        },
        onSuccess: function(result, ctx) {
            var responseData = result && result.response;
            if (responseData && responseData.firstPaymentDate) {
                if (!ctx.paymentVars) ctx.paymentVars = {};
                ctx.paymentVars.firstPaymentDate = String(responseData.firstPaymentDate);
                log_debug('Updated firstPaymentDate: ' + ctx.paymentVars.firstPaymentDate);
            }
        }
    },
    send_email: {
        factory: 'sendUrlByEmail',
        successResult: RESULT_END,
        failureResult: RESULT_FAILURE_API
    },
    transfer_to_agent: {
        type: 'routing',
        successResult: RESULT_OPERATOR,
        execute: function() { return { success: true, note: 'Transfer initiated' }; }
    },
    escalate_to_agent: {
        type: 'routing',
        successResult: RESULT_END_OPERATOR,
        execute: function() { return { success: true, note: 'Escalation initiated' }; }
    },
    end_conversation: {
        type: 'terminal',
        successResult: RESULT_END,
        fallbackResult: RESULT_END_OPERATOR,
        execute: function() { return { success: true, note: 'Conversation ended' }; }
    }
};

// Agent persona
AGENT_PERSONA = {
    NL: { name: "Dena", gender: "vrouw", botType: "zelfbedieningsagent", description: "klanten helpen met betalingsvragen", companyName: "ENGIE", companyRole: "selfservice betalingsagent", tone: "vriendelijk, deskundig, professioneel maar warm", interactionStyle: "helder en begrijpelijk. Korte zinnen", targetCustomer: "klanten met betalingsvragen", language: "Nederlands", advancedInstructions: "REGELS:\n- Geen actie zonder expliciete bevestiging\n- Herhaal de optie: 'Zal ik dit regelen?'\n- Bij off-topic: gebruik transfer_to_operator\n- Geen naam noemen aan begin gesprek\n\nNATUURLIJK:\n- Varieer formuleringen\n- Korte bevestigingen: 'Dat begrijp ik', 'Oke'\n- Bij onduidelijkheid: een vraag tegelijk\n\nEMPATHIE:\n- Erken kort de situatie\n- Overgangen: 'Wat ik kan aanbieden...'" },
    FR: { name: "Dena", gender: "femme", botType: "agent libre-service", description: "aider les clients avec questions de paiement", companyName: "ENGIE", companyRole: "agent paiement libre-service", tone: "amical, competent, professionnel mais chaleureux", interactionStyle: "claire et comprehensible. Phrases courtes", targetCustomer: "clients avec questions de paiement", language: "Francais", advancedInstructions: "REGLES:\n- Aucune action sans confirmation explicite\n- Repetez: 'Dois-je organiser?'\n- Hors-sujet: utilisez transfer_to_operator\n- Pas de nom au debut\n\nNATUREL:\n- Variez formulations\n- Confirmations courtes: 'Je comprends', 'Bien'\n- Ambiguite: une question a la fois\n\nEMPATHIE:\n- Reconnaissez brievement\n- Transitions: 'Ce que je propose...'" },
    DE: { name: "Dena", gender: "weiblich", botType: "Selbstbedienungs-Agent", description: "Kunden bei Zahlungsfragen helfen", companyName: "ENGIE", companyRole: "Selbstbedienungs-Zahlungsagent", tone: "freundlich, kompetent, professionell aber warm", interactionStyle: "klar und verstandlich. Kurze Satze", targetCustomer: "Kunden mit Zahlungsfragen", language: "Deutsch", advancedInstructions: "REGELN:\n- Keine Aktion ohne explizite Bestatigung\n- Wiederholen: 'Soll ich regeln?'\n- Off-topic: transfer_to_operator\n- Kein Name am Anfang\n\nNATURLICH:\n- Formulierungen variieren\n- Kurze Bestatigungen: 'Verstehe', 'Gut'\n- Unklarheit: eine Frage nacheinander\n\nEMPATHIE:\n- Kurz anerkennen\n- Ubergange: 'Was ich anbieten kann...'" },
    EN: { name: "Dena", gender: "female", botType: "self-service agent", description: "help customers with payment questions", companyName: "ENGIE", companyRole: "self-service payment agent", tone: "friendly, knowledgeable, professional but warm", interactionStyle: "clear and understandable. Short sentences", targetCustomer: "customers with payment questions", language: "English", advancedInstructions: "RULES:\n- No action without explicit confirmation\n- Repeat: 'Shall I arrange?'\n- Off-topic: use transfer_to_operator\n- No name at beginning\n\nNATURAL:\n- Vary phrasing\n- Short confirmations: 'I understand', 'Good'\n- Unclear: one question at a time\n\nEMPATHY:\n- Acknowledge briefly\n- Transitions: 'What I can offer...'" }
};

// Messages for conversation flow
MESSAGES = {
    NL: { repeat: ["Nog eens alstublieft?", "Sorry? Kunt u dat herhalen?", "Pardon?"], noInput: ["Hoort u mij?", "Bent u er nog?", "Hallo?"], waitShort: ["Secondje", "Ehm", "Hm", "Hmm", "Even kijken", "Momentje"], wait: ["Een ogenblik alstublieft.", "Een momentje alstublieft."], waitConfirmation: ["Natuurlijk.", "Neem uw tijd.", "Geen probleem."], confirmation: [], fill: ["Even kijken.", "Ik controleer het.", "Ik kijk het na."], bargeIn: ["Kunt u dat herhalen?", "Sorry, ga verder", "Ga door"] },
    FR: { repeat: ["Encore une fois, s il vous plait?", "Pardon? Repetez?"], noInput: ["M entendez-vous?", "Vous etes la?"], waitShort: ["Alors", "Euh", "Hm", "Hmm"], wait: ["Un moment, s il vous plait.", "Un instant, s il vous plait."], waitConfirmation: ["Bien sur.", "Prenez votre temps.", "Pas de probleme."], confirmation: [], fill: ["Je verifie.", "Je regarde.", "Un instant."], bargeIn: ["Repetez, s il vous plait?", "Allez-y", "Continuez"] },
    DE: { repeat: ["Noch einmal bitte?", "Wie bitte? Wiederholen?"], noInput: ["Horen Sie mich?", "Sind Sie noch da?"], waitShort: ["Also", "Ahm", "Hm", "Hmm"], wait: ["Einen Moment bitte.", "Einen Augenblick bitte."], waitConfirmation: ["Sicher.", "Nehmen Sie sich Zeit.", "Kein Problem."], confirmation: [], fill: ["Ich prufe das.", "Ich schaue nach.", "Einen Moment."], bargeIn: ["Wiederholen bitte?", "Bitte weiter", "Fahren Sie fort"] },
    EN: { repeat: ["Once again please?", "Sorry? Can you repeat?"], noInput: ["Can you hear me?", "Are you still there?"], waitShort: ["So", "Uh", "Hm", "Hmm", "Well"], wait: ["One moment please.", "Just a second please."], waitConfirmation: ["Sure.", "Take your time.", "No problem."], confirmation: [], fill: ["Let me check.", "I will verify.", "One moment."], bargeIn: ["Say again please?", "Sorry go ahead", "Continue"] }
};

// General knowledge (product info)
GENERAL_KNOWLEDGE = {
    NL: "BETALINGSOPTIES:\n- Uitstel van betaling: 30 dagen\n- Afbetalingsplan: 3 of 6 maandelijkse termijnen\n- Online betaling via klantenzone www.engie.be\n- Overschrijving naar IBAN\n- Domiciliering: automatische betaling\n\nBETALINGSPROCES:\n- Betalingstermijn: 14 dagen na factuurdatum\n- Facturen per e-mail verstuurd\n- Bij niet-betaling: herinnering, aanmaning, incasso\n\nCONTACT:\n- Telefoon: 078 35 35 34 (werkdagen 8-18u)\n- E-mail: klantenservice@engie.be\n- Website: www.engie.be\n- App: ENGIE Belgium (iOS/Android)",
    FR: "OPTIONS DE PAIEMENT:\n- Report de paiement: 30 jours\n- Plan de paiement: 3 ou 6 versements mensuels\n- Paiement en ligne via zone client www.engie.be\n- Virement bancaire vers IBAN\n- Domiciliation: paiement automatique\n\nPROCESSUS DE PAIEMENT:\n- Delai de paiement: 14 jours apres facturation\n- Factures envoyees par e-mail\n- En cas de non-paiement: rappel, mise en demeure, recouvrement\n\nCONTACT:\n- Telephone: 078 35 35 34 (jours ouvrables 8h-18h)\n- E-mail: klantenservice@engie.be\n- Site web: www.engie.be\n- App: ENGIE Belgium (iOS/Android)",
    DE: "ZAHLUNGSOPTIONEN:\n- Zahlungsaufschub: 30 Tage\n- Ratenzahlungsplan: 3 oder 6 monatliche Raten\n- Online-Zahlung uber Kundenzone www.engie.be\n- Uberweisung auf IBAN\n- Lastschrift: automatische Zahlung\n\nZAHLUNGSPROZESS:\n- Zahlungsfrist: 14 Tage nach Rechnungsdatum\n- Rechnungen per E-Mail versendet\n- Bei Nichtzahlung: Erinnerung, Mahnung, Inkasso\n\nKONTAKT:\n- Telefon: 078 35 35 34 (Werktage 8-18 Uhr)\n- E-Mail: klantenservice@engie.be\n- Website: www.engie.be\n- App: ENGIE Belgium (iOS/Android)",
    EN: "PAYMENT OPTIONS:\n- Payment deferral: 30 days\n- Installment plan: 3 or 6 monthly installments\n- Online payment via customer zone www.engie.be\n- Bank transfer to IBAN\n- Direct debit: automatic payment\n\nPAYMENT PROCESS:\n- Payment term: 14 days after invoice date\n- Invoices sent by email\n- In case of non-payment: reminder, formal notice, collection\n\nCONTACT:\n- Phone: 078 35 35 34 (weekdays 8am-6pm)\n- Email: klantenservice@engie.be\n- Website: www.engie.be\n- App: ENGIE Belgium (iOS/Android)"
};

// Company information
COMPANY_INFORMATION = {
    NL: "ENGIE is een energie- en dienstenleverancier in Belgie. We leveren elektriciteit, aardgas en energiediensten aan particulieren en bedrijven.\n\nKLANTENZONE:\nVia www.engie.be kunnen klanten hun facturen bekijken, meterstand doorgeven, contracten beheren en betalingen doen.\n\nBETALINGSREGELINGEN:\nENGIE biedt oplossingen bij betalingsmoeilijkheden zoals uitstel van betaling (30 dagen) of een afbetalingsplan (3 of 6 maanden).",
    FR: "ENGIE est un fournisseur d'energie et de services en Belgique. Nous fournissons de l'electricite, du gaz naturel et des services energetiques.\n\nZONE CLIENT:\nVia www.engie.be, les clients peuvent consulter leurs factures, communiquer leur index, gerer leurs contrats et effectuer des paiements.\n\nARRANGEMENTS DE PAIEMENT:\nENGIE propose des solutions en cas de difficultes de paiement comme un report (30 jours) ou un plan (3 ou 6 mois).",
    DE: "ENGIE ist ein Energie- und Dienstleistungsanbieter in Belgien. Wir liefern Strom, Erdgas und Energiedienstleistungen.\n\nKUNDENBEREICH:\nUber www.engie.be konnen Kunden Rechnungen einsehen, Zahlerstande mitteilen, Vertrage verwalten und Zahlungen vornehmen.\n\nZAHLUNGSVEREINBARUNGEN:\nENGIE bietet Losungen bei Zahlungsschwierigkeiten wie Zahlungsaufschub (30 Tage) oder Ratenplan (3 oder 6 Monate).",
    EN: "ENGIE is an energy and services provider in Belgium. We supply electricity, natural gas and energy services.\n\nCUSTOMER ZONE:\nVia www.engie.be, customers can view invoices, submit meter readings, manage contracts and make payments.\n\nPAYMENT ARRANGEMENTS:\nENGIE may offer solutions for payment difficulties such as a deferral (30 days) or an installment plan (3 or 6 months)."
};

// Prompt labels for base prompt building
PROMPT_LABELS = {
    NL: { persona: "JOUW PERSONA", inboundCall: "Je communiceert met de gebruiker via de telefoon, dit is een inkomend gesprek.", outboundCall: "Je communiceert met de gebruiker via de telefoon, dit is een uitgaand gesprek.", datePrefix: "De huidige datum is ", timePrefix: " en de tijd is ", rules: "ALGEMENE INSTRUCTIES", generalInstructions: "- Gebruik duidelijke en beknopte taal.\n- Houd je zinnen kort en bondig, zoals in een telefoongesprek.\n- Reageer op wat de klant zegt, niet op een vast script.\n- Als de klant een vraag stelt, beantwoord die eerst.\n- Als je het antwoord niet weet, verzin het niet.\n- Communiceer altijd in ", voiceRules: "- Gebruik geen emoticons tijdens het gesprek.\n- Gebruik geen markdown, JSON of HTML syntax tijdens het gesprek.\n", advanced: "GEAVANCEERDE INSTRUCTIES", knowledge: "JE KENNIS IS", companyInfo: "INFORMATIE OVER ", userInfo: "INFORMATIE OVER DE GEBRUIKER", objectiveLine: "Nu is je HUIDIGE DOELSTELLING in het gesprek:" },
    FR: { persona: "VOTRE PERSONA", inboundCall: "Vous communiquez par telephone, c est un appel entrant.", outboundCall: "Vous communiquez par telephone, c est un appel sortant.", datePrefix: "La date actuelle est le ", timePrefix: " et l heure est ", rules: "INSTRUCTIONS GENERALES", generalInstructions: "- Utilisez un langage clair et concis.\n- Gardez vos phrases courtes, comme au telephone.\n- Repondez a ce que dit le client, pas a un script fixe.\n- Si le client pose une question, repondez d abord.\n- Si vous ne savez pas, ne l inventez pas.\n- Communiquez toujours en ", voiceRules: "- N utilisez pas d emoticones pendant le dialogue.\n- N utilisez pas de syntaxe markdown, JSON ou HTML pendant le dialogue.\n", advanced: "INSTRUCTIONS AVANCEES", knowledge: "VOS CONNAISSANCES", companyInfo: "INFORMATIONS SUR ", userInfo: "INFORMATIONS SUR L UTILISATEUR", objectiveLine: "Votre objectif actuel dans le dialogue:" },
    DE: { persona: "IHRE PERSONA", inboundCall: "Sie kommunizieren per Telefon, dies ist ein eingehender Anruf.", outboundCall: "Sie kommunizieren per Telefon, dies ist ein ausgehender Anruf.", datePrefix: "Das aktuelle Datum ist ", timePrefix: " und die Zeit ist ", rules: "ALLGEMEINE ANWEISUNGEN", generalInstructions: "- Verwenden Sie klare und knappe Sprache.\n- Halten Sie Satze kurz, wie in einem Telefongesprach.\n- Reagieren Sie auf den Kunden, nicht auf ein festes Skript.\n- Wenn der Kunde eine Frage stellt, zuerst beantworten.\n- Wenn Sie es nicht wissen, nichts erfinden.\n- Kommunizieren Sie immer auf ", voiceRules: "- Verwenden Sie keine Emoticons wahrend des Dialogs.\n- Verwenden Sie keine Markdown-, JSON- oder HTML-Syntax wahrend des Dialogs.\n", advanced: "ERWEITERTE ANWEISUNGEN", knowledge: "IHR WISSEN", companyInfo: "INFORMATIONEN UBER ", userInfo: "INFORMATIONEN UBER DEN BENUTZER", objectiveLine: "Ihr aktuelles Ziel im Dialog:" },
    EN: { persona: "YOUR PERSONA", inboundCall: "You communicate by phone, this is an inbound call.", outboundCall: "You communicate by phone, this is an outbound call.", datePrefix: "The current date is ", timePrefix: " and the time is ", rules: "GENERAL INSTRUCTIONS", generalInstructions: "- Use clear and concise language.\n- Keep sentences short, like in a phone call.\n- Respond to what the customer says, not a fixed script.\n- If the customer asks a question, answer first.\n- If you do not know, do not make it up.\n- Always communicate in ", voiceRules: "- Do not use any emoticons during dialogue.\n- Do not use markdown, JSON or HTML syntax during dialogue.\n", advanced: "ADVANCED INSTRUCTIONS", knowledge: "YOUR KNOWLEDGE IS", companyInfo: "INFORMATION ABOUT ", userInfo: "INFO ABOUT THE USER", objectiveLine: "Now, your CURRENT OBJECTIVE in the dialog is:" }
};


// ============================================================================
// SCRIPT BODY (execution at bottom)
// ============================================================================

// Initialize language and build agent context from runtime data
language = normalizeLanguage(varObj && varObj.language);
log_debug('Using language: ' + language);

agentContext = buildFromRuntime(language);
log_debug('agentContext built: error=' + (agentContext.error ? 'true' : 'false') + ', scenario=' + (agentContext.scenario || 'n/a') + ', caseNumber=' + (agentContext.caseNumber || 'n/a'));

// Set agent persona
agentPersona = AGENT_PERSONA[language];
__persona = agentPersona;
log_debug('Agent persona set: ' + __persona.name + ' (' + __persona.botType + ')');

// Export utterances to runtime
__gpt_repeat = MESSAGES[language].repeat;
__gpt_noInput = MESSAGES[language].noInput;
__gpt_waitShort = MESSAGES[language].waitShort;
__gpt_wait = MESSAGES[language].wait;
__gpt_waitConfirmation = MESSAGES[language].waitConfirmation;
__gpt_confirmation = MESSAGES[language].confirmation || [];
__gpt_fill = MESSAGES[language].fill || [];
__gpt_bargeIn = MESSAGES[language].bargeIn;

__gptMaxTokens = 500;
__gptShortWaitDelay = 1000;
__gptLongWaitDelay = 2000;

__conversationType = 'voicebot';

// Override base prompt builder with knowledge and company info
__gptDialog_getBasePrompt = function (objective) {
    var language = normalizeLanguage(varObj && varObj.language);
    var labels = PROMPT_LABELS[language] || PROMPT_LABELS.NL;

    var prompt = labels.persona + ":\n";

    // Persona description
    if (language === "FR") prompt += "Vous etes un(e) ";
    else if (language === "DE") prompt += "Sie sind ein(e) ";
    else if (language === "EN") prompt += "You are a ";
    else prompt += "Je bent een ";

    prompt += __persona.botType;

    if (language === "FR") prompt += " travaillant chez ";
    else if (language === "DE") prompt += " bei ";
    else if (language === "EN") prompt += " working at ";
    else prompt += " die werkt bij een bedrijf genaamd ";

    prompt += __persona.companyName;

    if (language === "FR") prompt += " avec les specifications suivantes:\n";
    else if (language === "DE") prompt += " mit folgenden Spezifikationen:\n";
    else if (language === "EN") prompt += " with the following specifications:\n";
    else prompt += " met de volgende specificaties:\n";

    // Name, gender, role, tone
    if (language === "FR") prompt += "- Votre nom est \"" + __persona.name + "\"\n";
    else if (language === "DE") prompt += "- Ihr Name ist \"" + __persona.name + "\"\n";
    else if (language === "EN") prompt += "- Your name is \"" + __persona.name + "\"\n";
    else prompt += "- Je naam is \"" + __persona.name + "\"\n";

    if (language === "FR") prompt += "- Votre genre est \"" + __persona.gender + "\"\n";
    else if (language === "DE") prompt += "- Ihr Geschlecht ist \"" + __persona.gender + "\"\n";
    else if (language === "EN") prompt += "- Your gender is \"" + __persona.gender + "\"\n";
    else prompt += "- Je geslacht is \"" + __persona.gender + "\"\n";

    if (language === "FR") prompt += "- Votre style de communication est \"" + __persona.tone + "\"\n";
    else if (language === "DE") prompt += "- Ihr Kommunikationsstil ist \"" + __persona.tone + "\"\n";
    else if (language === "EN") prompt += "- Your communication style is \"" + __persona.tone + "\"\n";
    else prompt += "- Je communicatiestijl/toon is \"" + __persona.tone + "\"\n";

    if (language === "FR") prompt += "- Votre style d interaction est " + __persona.interactionStyle + "\n";
    else if (language === "DE") prompt += "- Ihr Interaktionsstil ist " + __persona.interactionStyle + "\n";
    else if (language === "EN") prompt += "- Your interaction style is " + __persona.interactionStyle + "\n";
    else prompt += "- Je zult met klanten omgaan " + __persona.interactionStyle + "\n";

    if (language === "FR") prompt += "- Votre role est " + __persona.companyRole + "\n";
    else if (language === "DE") prompt += "- Ihre Rolle ist " + __persona.companyRole + "\n";
    else if (language === "EN") prompt += "- Your role is " + __persona.companyRole + "\n";
    else prompt += "- Je rol is " + __persona.companyRole + "\n";

    if (language === "FR") prompt += "- Vous parlez avec " + __persona.targetCustomer + "\n";
    else if (language === "DE") prompt += "- Sie sprechen mit " + __persona.targetCustomer + "\n";
    else if (language === "EN") prompt += "- You speak with " + __persona.targetCustomer + "\n";
    else prompt += "- Je spreekt met " + __persona.targetCustomer + "\n";

    if (language === "FR") prompt += "- Votre fonction principale est " + __persona.description + "\n";
    else if (language === "DE") prompt += "- Ihre Hauptfunktion ist " + __persona.description + "\n";
    else if (language === "EN") prompt += "- Your main function is " + __persona.description + "\n";
    else prompt += "- Je belangrijkste functie is " + __persona.description + "\n";

    // Voice context
    if (__conversationType == "voicebot") {
        try {
            if ((context && context.callInfo && context.callInfo.direction == "inbound") || (context && context.callInfo && context.callInfo.direction == "outbound" && debugCall)) {
                prompt += "- " + labels.inboundCall + "\n";
            } else {
                prompt += "- " + labels.outboundCall + "\n";
            }
        } catch (e2) { log_debug('Voice context error: ' + e2); }
    }

    // Date and time
    try {
        var now = getCurrentDialogDate();
        var locale = (context && context.language) ? context.language : language;
        prompt += "\n" + labels.datePrefix + now.toLocaleDateString(locale, { timeZone: __timeZone }) + labels.timePrefix + now.toLocaleTimeString(locale, { timeZone: __timeZone }) + "\n";
    } catch (e3) { log_debug('Date/time error: ' + e3); }

    // General instructions
    prompt += "\n" + labels.rules + ":\n";
    prompt += labels.generalInstructions + __persona.language + ".\n";

    // Voice restrictions
    if (__conversationType == "voicebot") {
        prompt += labels.voiceRules;
    }

    // Advanced instructions
    if (typeof __advancedInstructions !== "undefined" && __advancedInstructions) {
        prompt += "\n" + labels.advanced + ":\n" + __advancedInstructions + "\n";
    }

    // Knowledge
    var knowledge = pickLocalizedText(GENERAL_KNOWLEDGE, language);
    if (knowledge) {
        prompt += "\n" + labels.knowledge + ":\n" + knowledge + "\n";
    }

    // Company info
    var companyInfo = pickLocalizedText(COMPANY_INFORMATION, language);
    if (companyInfo) {
        prompt += "\n" + labels.companyInfo + __persona.companyName + ":\n" + companyInfo + "\n";
    }

    // User info
    if (typeof __generalUserInfo !== "undefined" && __generalUserInfo) {
        prompt += "\n" + labels.userInfo + ":\n" + __generalUserInfo + "\n";
    }

    // Objective
    if (objective) {
        prompt += "\n" + labels.objectiveLine + "\n" + objective + "\n";
    }

    return prompt;
};

// Set segment params and finalize
if (typeof log_debug === 'function') {
    log_debug('_apiResult.isEligible: ' + (typeof _apiResult !== 'undefined' ? _apiResult.isEligible : 'n/a'));
    log_debug('varObj language: ' + (varObj && varObj.language ? varObj.language : 'n/a'));
    log_debug('segmentState ready: ' + (typeof segmentState !== 'undefined' ? 'yes' : 'no'));
}

// Ensure segment params
if (typeof segmentState !== 'undefined' && segmentState) {
    if (!segmentState.params) segmentState.params = {};
    if (typeof agentContext !== 'undefined' && agentContext) {
        segmentState.params.paymentAssistant = agentContext;
        log_debug('agentContext assigned to segmentState.params.paymentAssistant');
    }
}

// Build base prompt
if (typeof agentContext !== 'undefined' && agentContext && typeof __gptDialog_getBasePrompt === 'function') {
    base_prompt = __gptDialog_getBasePrompt(agentContext.objective);
    log_debug('Dialog base prompt set (objective: ' + (agentContext.scenario || '') + ', length: ' + base_prompt.length + ')');
} else {
    if (typeof base_prompt === 'undefined') base_prompt = '';
    log_warn('main.js end: agentContext or __gptDialog_getBasePrompt not available; base_prompt empty.');
}

log_debug('main.js execution complete');
