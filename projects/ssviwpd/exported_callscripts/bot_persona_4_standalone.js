// =============================================================================
// BOT PERSONA STANDALONE SCRIPT (v4) — Complete Replacement
// =============================================================================
//
// This single script replaces the entire Bot Persona component (init + language scripts).
// Designed to run in a regular Script node in the selfservice flow, BEFORE the Dialog Node.
//
// Structure:
//   SECTION 1: CONFIG     - All input settings & localized data
//   SECTION 2: CODE       - All functions (no execution)
//   SECTION 3: RUNTIME    - Sequential execution
//
// =============================================================================


// =============================================================================
// SECTION 1: CONFIG — All input settings & localized data
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// 1a. LLM & Runtime Config (from Component Variables)
// ─────────────────────────────────────────────────────────────────────────────

var CONFIG = {
    __defaultLLMProvider: "AzureOpenAI",
    __defaultModel: "gpt-4.1-mini",
    __defaultServiceHost: "",
    __logPrompt: false,
    __allowBargeIn: true,
    __typingSound: true,
    __timeZone: "Europe/Brussels",
    __gptMaxTokens: 500,
    __gptShortWaitDelay: 1000,
    __gptLongWaitDelay: 2000
};


// ─────────────────────────────────────────────────────────────────────────────
// 1b. AGENT_PERSONA (NL/FR/DE/EN) — persona fields per language
// ─────────────────────────────────────────────────────────────────────────────

var AGENT_PERSONA = {
    NL: {
        name: "Dena",
        gender: "vrouw",
        botType: "zelfbedieningsagent",
        description: "klanten helpen met betalingsvragen",
        companyName: "ENGIE",
        companyRole: "selfservice betalingsagent",
        tone: "vriendelijk, deskundig, professioneel maar warm",
        interactionStyle: "helder en begrijpelijk. Korte zinnen",
        targetCustomer: "klanten met betalingsvragen",
        language: "Nederlands",
        advancedInstructions: "REGELS:\n" +
            "- Geen actie zonder expliciete bevestiging\n" +
            "- Herhaal de optie: 'Zal ik dit regelen?'\n" +
            "- Bij off-topic: gebruik transfer_to_operator\n" +
            "- Geen naam noemen aan begin gesprek\n\n" +
            "NATUURLIJK:\n" +
            "- Varieer formuleringen\n" +
            "- Korte bevestigingen: 'Dat begrijp ik', 'Oke'\n" +
            "- Bij onduidelijkheid: een vraag tegelijk\n\n" +
            "EMPATHIE:\n" +
            "- Erken kort de situatie\n" +
            "- Overgangen: 'Wat ik kan aanbieden...'"
    },
    FR: {
        name: "Dena",
        gender: "femme",
        botType: "agent libre-service",
        description: "aider les clients avec questions de paiement",
        companyName: "ENGIE",
        companyRole: "agent paiement libre-service",
        tone: "amical, competent, professionnel mais chaleureux",
        interactionStyle: "claire et comprehensible. Phrases courtes",
        targetCustomer: "clients avec questions de paiement",
        language: "Francais",
        advancedInstructions: "REGLES:\n" +
            "- Aucune action sans confirmation explicite\n" +
            "- Repetez: 'Dois-je organiser?'\n" +
            "- Hors-sujet: utilisez transfer_to_operator\n" +
            "- Pas de nom au debut\n\n" +
            "NATUREL:\n" +
            "- Variez formulations\n" +
            "- Confirmations courtes: 'Je comprends', 'Bien'\n" +
            "- Ambiguite: une question a la fois\n\n" +
            "EMPATHIE:\n" +
            "- Reconnaissez brievement\n" +
            "- Transitions: 'Ce que je propose...'"
    },
    DE: {
        name: "Dena",
        gender: "weiblich",
        botType: "Selbstbedienungs-Agent",
        description: "Kunden bei Zahlungsfragen helfen",
        companyName: "ENGIE",
        companyRole: "Selbstbedienungs-Zahlungsagent",
        tone: "freundlich, kompetent, professionell aber warm",
        interactionStyle: "klar und verstandlich. Kurze Satze",
        targetCustomer: "Kunden mit Zahlungsfragen",
        language: "Deutsch",
        advancedInstructions: "REGELN:\n" +
            "- Keine Aktion ohne explizite Bestatigung\n" +
            "- Wiederholen: 'Soll ich regeln?'\n" +
            "- Off-topic: transfer_to_operator\n" +
            "- Kein Name am Anfang\n\n" +
            "NATURLICH:\n" +
            "- Formulierungen variieren\n" +
            "- Kurze Bestatigungen: 'Verstehe', 'Gut'\n" +
            "- Unklarheit: eine Frage nacheinander\n\n" +
            "EMPATHIE:\n" +
            "- Kurz anerkennen\n" +
            "- Ubergange: 'Was ich anbieten kann...'"
    },
    EN: {
        name: "Dena",
        gender: "female",
        botType: "self-service agent",
        description: "help customers with payment questions",
        companyName: "ENGIE",
        companyRole: "self-service payment agent",
        tone: "friendly, knowledgeable, professional but warm",
        interactionStyle: "clear and understandable. Short sentences",
        targetCustomer: "customers with payment questions",
        language: "English",
        advancedInstructions: "RULES:\n" +
            "- No action without explicit confirmation\n" +
            "- Repeat: 'Shall I arrange?'\n" +
            "- Off-topic: use transfer_to_operator\n" +
            "- No name at beginning\n\n" +
            "NATURAL:\n" +
            "- Vary phrasing\n" +
            "- Short confirmations: 'I understand', 'Good'\n" +
            "- Unclear: one question at a time\n\n" +
            "EMPATHY:\n" +
            "- Acknowledge briefly\n" +
            "- Transitions: 'What I can offer...'"
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// 1c. MESSAGES (NL/FR/DE/EN) — user-provided arrays for voice interactions
// ─────────────────────────────────────────────────────────────────────────────

var MESSAGES = {
    NL: {
        repeat: ['Nog eens alstublieft?', 'Sorry? Kunt u dat herhalen?', 'Pardon?'],
        noInput: ['Hoort u mij?', 'Bent u er nog?', 'Hallo?'],
        waitShort: ['Secondje', 'Ehm', 'Hm', 'Hmm', 'Even kijken', 'Momentje'],
        wait: ['Een ogenblik alstublieft.', 'Een momentje alstublieft.'],
        waitConfirmation: ['Natuurlijk.', 'Neem uw tijd.', 'Geen probleem.'],
        confirmation: ['Oké.', 'Prima.', 'In orde.'],
        fill: ['Even kijken.', 'Ik controleer het.', 'Ik kijk het na.'],
        bargeIn: ['Kunt u dat herhalen?', 'Sorry, ga verder', 'Ga door']
    },
    FR: {
        repeat: ["Encore une fois, s'il vous plaît?", 'Pardon? Répétez?'],
        noInput: ["M'entendez-vous?", 'Vous êtes là?'],
        waitShort: ['Alors', 'Euh', 'Hm', 'Hmm'],
        wait: ["Un moment, s'il vous plaît.", "Un instant, s'il vous plaît."],
        waitConfirmation: ['Bien sûr.', 'Prenez votre temps.', 'Pas de problème.'],
        confirmation: ['Daccord.', 'Très bien.', 'Ok.'],
        fill: ['Je vérifie.', 'Je regarde.', 'Un instant.'],
        bargeIn: ["Répétez, s'il vous plaît?", 'Allez-y', 'Continuez']
    },
    DE: {
        repeat: ['Noch einmal bitte?', 'Wie bitte? Wiederholen?'],
        noInput: ['Hören Sie mich?', 'Sind Sie noch da?'],
        waitShort: ['Also', 'Ähm', 'Hm', 'Hmm'],
        wait: ['Einen Moment bitte.', 'Einen Augenblick bitte.'],
        waitConfirmation: ['Sicher.', 'Nehmen Sie sich Zeit.', 'Kein Problem.'],
        confirmation: ['Okay.', 'Gut.', 'In Ordnung.'],
        fill: ['Ich prüfe das.', 'Ich schaue nach.', 'Einen Moment.'],
        bargeIn: ['Wiederholen bitte?', 'Bitte weiter', 'Fahren Sie fort']
    },
    EN: {
        repeat: ['Once again please?', 'Sorry? Can you repeat?'],
        noInput: ['Can you hear me?', 'Are you still there?'],
        waitShort: ['So', 'Uh', 'Hm', 'Hmm', 'Well'],
        wait: ['One moment please.', 'Just a second please.'],
        waitConfirmation: ['Sure.', 'Take your time.', 'No problem.'],
        confirmation: ['Okay.', 'Alright.', 'Got it.'],
        fill: ['Let me check.', 'I will verify.', 'One moment.'],
        bargeIn: ['Say again please?', 'Sorry go ahead', 'Continue']
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// 1d. GENERAL_KNOWLEDGE (NL/FR/DE/EN) — domain knowledge strings
// ─────────────────────────────────────────────────────────────────────────────

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
        "- Online-Zahlung uber Kundenzone www.engie.be\n" +
        "- Uberweisung auf IBAN\n" +
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


// ─────────────────────────────────────────────────────────────────────────────
// 1e. COMPANY_INFORMATION (NL/FR/DE/EN) — company context strings
// ─────────────────────────────────────────────────────────────────────────────

var COMPANY_INFORMATION = {
    NL: "ENGIE is een energie- en dienstenleverancier in België. We leveren elektriciteit, aardgas en energiediensten aan particulieren en bedrijven.\n\n" +
        "KLANTENZONE:\n" +
        "Via www.engie.be kunnen klanten hun facturen bekijken, meterstand doorgeven, contracten beheren en betalingen doen.\n\n" +
        "BETALINGSREGELINGEN:\n" +
        "ENGIE biedt verschillende oplossingen voor klanten met betalingsmoeilijkheden:\n" +
        "- Uitstel van betaling (30 dagen)\n" +
        "- Afbetalingsplannen (3 of 6 maanden)\n" +
        "Deze kunnen via de klantenzone of telefonisch geregeld worden.",

    FR: "ENGIE est un fournisseur d'énergie et de services en Belgique. Nous fournissons de l'électricité, du gaz naturel et des services énergétiques aux particuliers et aux entreprises.\n\n" +
        "ZONE CLIENT:\n" +
        "Via www.engie.be, les clients peuvent consulter leurs factures, communiquer leur index, gérer leurs contrats et effectuer des paiements.\n\n" +
        "ARRANGEMENTS DE PAIEMENT:\n" +
        "ENGIE propose différentes solutions pour les clients ayant des difficultés de paiement:\n" +
        "- Report de paiement (30 jours)\n" +
        "- Plans de paiement (3 ou 6 mois)\n" +
        "Ceux-ci peuvent être organisés via la zone client ou par téléphone.",

    DE: "ENGIE ist ein Energie- und Dienstleistungsanbieter in Belgien. Wir liefern Strom, Erdgas und Energiedienstleistungen an Privatkunden und Unternehmen.\n\n" +
        "KUNDENBEREICH:\n" +
        "Über www.engie.be können Kunden ihre Rechnungen einsehen, Zählerstände mitteilen, Verträge verwalten und Zahlungen vornehmen.\n\n" +
        "ZAHLUNGSVEREINBARUNGEN:\n" +
        "ENGIE bietet verschiedene Lösungen für Kunden mit Zahlungsschwierigkeiten:\n" +
        "- Zahlungsaufschub (30 Tage)\n" +
        "- Ratenzahlungspläne (3 oder 6 Monate)\n" +
        "Diese können über den Kundenbereich oder telefonisch eingerichtet werden.",

    EN: "ENGIE is an energy and services provider in Belgium. We supply electricity, natural gas and energy services to individuals and businesses.\n\n" +
        "CUSTOMER ZONE:\n" +
        "Via www.engie.be, customers can view their invoices, submit meter readings, manage contracts and make payments.\n\n" +
        "PAYMENT ARRANGEMENTS:\n" +
        "ENGIE offers various solutions for customers with payment difficulties:\n" +
        "- Payment deferral (30 days)\n" +
        "- Installment plans (3 or 6 months)\n" +
        "These can be arranged via the customer zone or by phone."
};


// ─────────────────────────────────────────────────────────────────────────────
// 1f. PROMPT_LABELS (NL/FR/DE/EN) — all prompt builder labels
// ─────────────────────────────────────────────────────────────────────────────

var PROMPT_LABELS = {
    NL: {
        persona:          'JOUW PERSONA',
        youAre:           'Je bent een ',
        worksAt:          ' werkzaam bij ',
        specs:            ' met de volgende specificaties',
        nameLabel:        'Jouw naam is',
        genderLabel:      'Jouw geslacht is',
        toneLabel:        'Jouw communicatiestijl is',
        styleLabel:       'Jouw interactiestijl is',
        roleLabel:        'Jouw rol is',
        audienceLabel:    'Je spreekt met',
        functionLabel:    'Jouw hoofdfunctie is',
        inboundCall:      'Je communiceert via de telefoon, dit is een inkomende oproep.',
        outboundCall:     'Je communiceert via de telefoon, dit is een uitgaande oproep.',
        datePrefix:       'De huidige datum is ',
        timePrefix:       ' en de tijd is ',
        rules:            'ALGEMENE INSTRUCTIES',
        generalInstructions: "- Gebruik duidelijke en beknopte taal.\n" +
                          "- Houd je zinnen kort en bondig, zoals in een telefoongesprek.\n" +
                          "- Imiteer authentieke interpersoonlijke communicatie.\n" +
                          "- Zorg ervoor dat je antwoorden aansluiten bij de behoeften van de klant.\n" +
                          "- Beantwoord alleen vragen die binnen je takenpakket vallen.\n" +
                          "- Als de gebruiker om iets vraagt wat je niet kunt doen, verontschuldig je dat je daarmee niet kunt helpen.\n" +
                          "- Als je het antwoord niet weet, verzin het niet en zeg dat je het niet weet.\n" +
                          "- Beantwoord geen enkele vraag die niet binnen je doelstelling valt.\n" +
                          "- Communiceer altijd in het ",
        voiceRules:       "- Gebruik geen emoticons tijdens de dialoog.\n" +
                          "- Gebruik geen markdown, JSON of HTML-syntaxis tijdens de dialoog.\n",
        advanced:         'GEAVANCEERDE INSTRUCTIES',
        knowledge:        'JE KENNIS IS',
        companyInfo:      'INFORMATIE OVER ',
        userInfo:         'INFORMATIE OVER DE GEBRUIKER',
        conversation:     'GESPREKSSTIJL',
        conversationList: "- Bouw voort op wat al besproken is\n" +
                          "- Herhaal niet wat je al hebt uitgelegd\n" +
                          "- Beantwoord eerst klantvragen, ga dan verder\n" +
                          "- Bij aarzeling: help bij de afweging\n" +
                          "- Bij bekende opties: vraag direct naar voorkeur\n",
        objective:        'HUIDIGE DOELSTELLING',
        objectiveLine:     'Nu is je HUIDIGE DOEL in de dialoog',
        clarifierRule:     '- Doe geen aannames over functieparameters; vraag om opheldering bij dubbelzinnigheid.\n',
        voiceTimeRule:     '- Bij tijden: zeg "negen uur" in plaats van "09:00".\n',
        voiceToneRule:     '- Vermijd uitroeptekens; gebruik punten voor een natuurlijke toon.\n'
    },
    FR: {
        persona:          'VOTRE PERSONA',
        youAre:           'Vous êtes un(e) ',
        worksAt:          ' travaillant chez ',
        specs:            ' avec les spécifications suivantes',
        nameLabel:        'Votre nom est',
        genderLabel:      'Votre genre est',
        toneLabel:        'Votre style de communication est',
        styleLabel:       'Votre style d\'interaction est',
        roleLabel:        'Votre rôle est',
        audienceLabel:    'Vous parlez avec',
        functionLabel:    'Votre fonction principale est',
        inboundCall:      'Vous communiquez par téléphone, c\'est un appel entrant.',
        outboundCall:     'Vous communiquez par téléphone, c\'est un appel sortant.',
        datePrefix:       'La date actuelle est le ',
        timePrefix:       ' et l\'heure est ',
        rules:            'INSTRUCTIONS GÉNÉRALES',
        generalInstructions: "- Utilisez un langage clair et concis.\n" +
                          "- Gardez vos phrases courtes et précises, comme au téléphone.\n" +
                          "- Imitez une communication interpersonnelle authentique.\n" +
                          "- Assurez-vous que vos réponses correspondent aux besoins du client.\n" +
                          "- Répondez uniquement aux questions relevant de votre mission.\n" +
                          "- Si le client demande quelque chose d'impossible, excusez-vous.\n" +
                          "- Si vous ne savez pas, ne l'inventez pas et dites-le.\n" +
                          "- Ne répondez à aucune question hors de votre objectif.\n" +
                          "- Communiquez toujours en ",
        voiceRules:       "- N'utilisez pas d'émoticônes pendant le dialogue.\n" +
                          "- N'utilisez pas de syntaxe markdown, JSON ou HTML pendant le dialogue.\n",
        advanced:         'INSTRUCTIONS AVANCÉES',
        knowledge:        'VOS CONNAISSANCES',
        companyInfo:      'INFORMATIONS SUR ',
        userInfo:         'INFORMATIONS SUR L\'UTILISATEUR',
        conversation:     'STYLE DE CONVERSATION',
        conversationList: "- Construisez sur ce qui a déjà été discuté\n" +
                          "- Ne répétez pas ce que vous avez déjà expliqué\n" +
                          "- Répondez d'abord aux questions du client\n" +
                          "- En cas d'hésitation: aidez à la réflexion\n" +
                          "- Si les options sont connues: demandez directement la préférence\n",
        objective:        'OBJECTIF ACTUEL',
        objectiveLine:     'Votre objectif actuel dans le dialogue',
        clarifierRule:     '- Ne présumez pas des paramètres; demandez clarification si ambigu.\n',
        voiceTimeRule:     '- Pour les heures: dites "neuf heures" pas "09:00".\n',
        voiceToneRule:     '- Évitez les points d\'exclamation; utilisez des points.\n'
    },
    DE: {
        persona:          'IHRE PERSONA',
        youAre:           'Sie sind ein(e) ',
        worksAt:          ' bei ',
        specs:            ' mit folgenden Spezifikationen',
        nameLabel:        'Ihr Name ist',
        genderLabel:      'Ihr Geschlecht ist',
        toneLabel:        'Ihr Kommunikationsstil ist',
        styleLabel:       'Ihr Interaktionsstil ist',
        roleLabel:        'Ihre Rolle ist',
        audienceLabel:    'Sie sprechen mit',
        functionLabel:    'Ihre Hauptfunktion ist',
        inboundCall:      'Sie kommunizieren per Telefon, dies ist ein eingehender Anruf.',
        outboundCall:     'Sie kommunizieren per Telefon, dies ist ein ausgehender Anruf.',
        datePrefix:       'Das aktuelle Datum ist ',
        timePrefix:       ' und die Zeit ist ',
        rules:            'ALLGEMEINE ANWEISUNGEN',
        generalInstructions: "- Verwenden Sie klare und knappe Sprache.\n" +
                          "- Halten Sie Sätze kurz und prägnant, wie in einem Telefongespräch.\n" +
                          "- Imitieren Sie authentische zwischenmenschliche Kommunikation.\n" +
                          "- Sorgen Sie dafür, dass Ihre Antworten den Kundenbedürfnissen entsprechen.\n" +
                          "- Beantworten Sie nur Fragen innerhalb Ihrer Aufgaben.\n" +
                          "- Wenn der Kunde etwas Unmögliches verlangt, entschuldigen Sie sich.\n" +
                          "- Wenn Sie keine Antwort wissen, erfinden Sie nichts und sagen Sie es.\n" +
                          "- Beantworten Sie keine Fragen außerhalb Ihres Ziels.\n" +
                          "- Kommunizieren Sie immer auf ",
        voiceRules:       "- Verwenden Sie keine Emoticons während des Dialogs.\n" +
                          "- Verwenden Sie keine Markdown-, JSON- oder HTML-Syntax während des Dialogs.\n",
        advanced:         'ERWEITERTE ANWEISUNGEN',
        knowledge:        'IHR WISSEN',
        companyInfo:      'INFORMATIONEN ÜBER ',
        userInfo:         'INFORMATIONEN ÜBER DEN BENUTZER',
        conversation:     'GESPRÄCHSSTIL',
        conversationList: "- Bauen Sie auf Besprochenes auf\n" +
                          "- Wiederholen Sie nicht bereits Erklärtes\n" +
                          "- Beantworten Sie Kundenfragen zuerst\n" +
                          "- Bei Zögern: helfen Sie bei der Überlegung\n" +
                          "- Bei bekannten Optionen: fragen Sie direkt nach Präferenz\n",
        objective:        'AKTUELLES ZIEL',
        objectiveLine:     'Ihr aktuelles Ziel im Dialog',
        clarifierRule:     '- Keine Annahmen bei Parametern; bei Unklarheit nachfragen.\n',
        voiceTimeRule:     '- Bei Zeiten: sagen Sie "neun Uhr" statt "09:00".\n',
        voiceToneRule:     '- Vermeiden Sie Ausrufezeichen; Punkte verwenden.\n'
    },
    EN: {
        persona:          'YOUR PERSONA',
        youAre:           'You are a ',
        worksAt:          ' working at ',
        specs:            ' with the following specifications',
        nameLabel:        'Your name is',
        genderLabel:      'Your gender is',
        toneLabel:        'Your communication style is',
        styleLabel:       'Your interaction style is',
        roleLabel:        'Your role is',
        audienceLabel:    'You speak with',
        functionLabel:    'Your main function is',
        inboundCall:      'You communicate by phone, this is an inbound call.',
        outboundCall:     'You communicate by phone, this is an outbound call.',
        datePrefix:       'The current date is ',
        timePrefix:       ' and the time is ',
        rules:            'GENERAL INSTRUCTIONS',
        generalInstructions: "- Use clear and concise language.\n" +
                          "- Keep your sentences short and to the point, like in a phone call.\n" +
                          "- Mimic authentic interpersonal communication.\n" +
                          "- Ensure your responses are aligned with the customer's needs.\n" +
                          "- Only answer questions that are within your scope of tasks.\n" +
                          "- If the user asks for something you can't do, apologize that you can't help.\n" +
                          "- If you don't know the answer, don't make it up and say you don't know.\n" +
                          "- Do not answer any questions that are not within your objective.\n" +
                          "- Always communicate in ",
        voiceRules:       "- Do not use any emoticons during dialogue.\n" +
                          "- Do not use markdown, JSON or HTML syntax during dialogue.\n",
        advanced:         'ADVANCED INSTRUCTIONS',
        knowledge:        'YOUR KNOWLEDGE IS',
        companyInfo:      'INFORMATION ABOUT ',
        userInfo:         'INFO ABOUT THE USER',
        conversation:     'CONVERSATION STYLE',
        conversationList: "- Build on what has already been discussed\n" +
                          "- Don't repeat what you already explained\n" +
                          "- Answer customer questions first, then continue\n" +
                          "- If hesitating: help weigh the options\n" +
                          "- If options are known: ask directly for preference\n",
        objective:        'CURRENT OBJECTIVE',
        objectiveLine:     'Now, your CURRENT OBJECTIVE in the dialog is',
        clarifierRule:     '- Do not assume function parameter values; ask for clarification if ambiguous.\n',
        voiceTimeRule:     '- For times: say "nine o\'clock" not "09:00".\n',
        voiceToneRule:     '- Avoid exclamation marks; use periods for natural tone.\n'
    }
};


// =============================================================================
// SECTION 2: CODE — All functions (no execution)
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// 2a. Message Rotation Getters
// ─────────────────────────────────────────────────────────────────────────────

__gptDialog_getNoInputMessage = function () { 
    if (__gpt_noInput.length == 0) return ""; 
 
    var responseMsg = __gpt_noInput[__noInputPtr]; 
    __noInputPtr++; 
 
    if (__noInputPtr >= __gpt_noInput.length) { 
        __noInputPtr = 0; 
    } 
 
    return responseMsg; 
}; 
 
__gptDialog_getConfirmationMessage = function () { 
    if (__gpt_confirmation.length == 0) return ""; 
 
    var responseMsg = __gpt_confirmation[__confirmationPtr]; 
    __confirmationPtr++; 
 
    if (__confirmationPtr >= __gpt_confirmation.length) { 
        __confirmationPtr = 0; 
    } 
 
    return responseMsg; 
}; 
 
__gptDialog_getFillMessage = function () { 
    if (__gpt_fill.length == 0) return ""; 
 
    var responseMsg = __gpt_fill[__fillPtr]; 
    __fillPtr++; 
 
    if (__fillPtr >= __gpt_fill.length) { 
        __fillPtr = 0; 
    } 
 
    return responseMsg; 
}; 
 
__gptDialog_getRepeatMessage = function () { 
    if (__gpt_repeat.length == 0) return ""; 
 
    var responseMsg = __gpt_repeat[__repeatMessagePtr]; 
    __repeatMessagePtr++; 
 
    if (__repeatMessagePtr >= __gpt_repeat.length) { 
        __repeatMessagePtr = 0; 
    } 
 
    return responseMsg; 
}; 
 
__gptDialog_getWaitMessage = function () { 
    if (__gpt_wait.length == 0) return ""; 
 
    var responseMsg = __gpt_wait[__waitMessagePtr]; 
    __waitMessagePtr++; 
 
    if (__waitMessagePtr >= __gpt_wait.length) { 
        __waitMessagePtr = 0; 
    } 
 
    return responseMsg; 
}; 
 
__gptDialog_getWaitMessageShort = function () { 
    if (__gpt_waitShort.length == 0) return ""; 
 
    var responseMsg = __gpt_waitShort[__waitShortMessagePtr]; 
    __waitShortMessagePtr++; 
 
    if (__waitShortMessagePtr >= __gpt_waitShort.length) { 
        __waitShortMessagePtr = 0; 
    } 
 
    return responseMsg; 
}; 
 
__gptDialog_getbargeInMessage = function () { 
    if (__gpt_bargeIn.length == 0) return ""; 
 
    var responseMsg = __gpt_bargeIn[__bargeInMessagePtr]; 
    __bargeInMessagePtr++; 
 
    if (__bargeInMessagePtr >= __gpt_bargeIn.length) { 
        __bargeInMessagePtr = 0; 
    } 
 
    return responseMsg; 
}; 
 
__gptDialog_getWaitConfirmationMessage = function () { 
    if (__gpt_waitConfirmation.length == 0) return ""; 
 
    var responseMsg = __gpt_waitConfirmation[__waitConfirmationMessagePtr]; 
    __waitConfirmationMessagePtr++; 
 
    if (__waitConfirmationMessagePtr >= __gpt_waitConfirmation.length) { 
        __waitConfirmationMessagePtr = 0; 
    } 
 
    return responseMsg; 
};


// ─────────────────────────────────────────────────────────────────────────────
// 2b. Dialog History Functions
// ─────────────────────────────────────────────────────────────────────────────

__gptDialog_mergeAssistantSpeechAndFunctionCall = function (input) {
    var callMessage = null;
    var result = [];
    for (var i = 0; i < input.length; i++) {
        var msg = input[i];
        if (msg.role === 'function' || msg.role === 'tool') {
            if (callMessage) {
                // Finalize call
                if (callMessage.length > 0) result[result.length - 1].content = callMessage.join(" ");
                callMessage = null;
            }
        }
        else if (msg.role === 'assistant') {
            if (typeof msg.tool_calls !== 'undefined' || typeof msg.function_call !== 'undefined') {
                if (callMessage) throw new Error("A function call message was found after another with no result inbetween!");
                // Prepare content parts
                callMessage = [];
                if (typeof msg.content !== 'undefined') {
                    callMessage.push(msg.content);
                }
                result.push(Object.assign({}, msg));
                continue;
            }
            if (callMessage) {
                if (typeof msg.content !== 'undefined') {
                    callMessage.push(msg.content);
                }
                continue;
            }
        }
        else if (callMessage) throw new Error('A \'' + msg.role + '\' message was found after a function call with no result!');
        result.push(msg);
    }
    if (callMessage) throw new Error("A function call message has no result.");
    return result;
};


// returns all gpt messages
__gptDialog_getPrevMessages = function () {
    var _previousConversation = []; 
    for (i = __gptDialogHistoryStartFrom; i <= context.speakFlow.size - 1; i++) {

        var __curItem = context.speakFlow.get(i);
 
        // node is not marked as "ignore" 
        if (!__ignoredNodeList.includes(__curItem.nodeId)) { 
 
            var __role = null; 
            if (__curItem.type == 3) { 
                __role = "assistant"; 
            } else if (__curItem.type == 5) { 
                __role = "user"; 
            } 
 
            if (__role) {

                var isPreviousFunctionCall = false;
                if (_previousConversation.length > 1
                    && _previousConversation[_previousConversation.length - 2]["function_call"]) {
                        isPreviousFunctionCall = true;
                        // this will not split assistant response to "set result" with following generated message by objective
                    }


                var __content = __curItem.activity;
                if (__role == 'user') {
                    __content = __gptDialog_postprocessDialogSTT(__content);
                }

                if (_previousConversation.length > 0 
                    && isPreviousFunctionCall == false
                    && __gptLastBotSpeechNode == __curItem.nodeId
                    && _previousConversation[_previousConversation.length - 1]["role"] == __role 
                    && !_previousConversation[_previousConversation.length - 1]["function_call"]) { 
                    // last message is the same, lets append message, not push new  
                    _previousConversation[_previousConversation.length - 1]["content"] = _previousConversation[_previousConversation.length - 1]["content"] + " " + __content; 
                } else {
                    // push new message  
                    _previousConversation.push({
                        "role": __role, 
                        "content": __content 
                    }); 
                    __gptLastBotSpeechNode = __curItem.nodeId;
                } 
            } 
        } 

        // add function call to the list 
        for (f = 0; f < __gptFunctionCallHistory.length; f++) {
            if (__gptFunctionCallHistory[f].speakFlowIndexFunctionCall == i
                && __gptFunctionCallHistory[f].componentId == __gptComponentId) {
                _previousConversation.push({
                    "role": "assistant",
                    "function_call": {
                        "name": __gptFunctionCallHistory[f].name,
                        "arguments": __gptFunctionCallHistory[f].arguments,
                    }
                });
            }
        }        
 
        //add result of function call to history 
        for (f = 0; f < __gptFunctionCallHistory.length; f++) { 
            if (__gptFunctionCallHistory[f].speakFlowIndexResultSet == i 
                && __gptFunctionCallHistory[f].componentId == __gptComponentId) { 
 
                var __content = __gptFunctionCallHistory[f].result; 
                if (__content) { 
                    if (typeof __content === 'string' || __content instanceof String) { 
                        // content is string - just trim it 
                        __content = __content.trim(); 
                    } else { 
                        //its object, serialize it 
                        __content = JSON.stringify(__content); 
                    } 
                } else { 
                    __content = ""; 
                } 
 
                _previousConversation.push({ 
                    "role": "function", 
                    "name": __gptFunctionCallHistory[f].name, 
                    "content": __content 
                }); 
            } 
        } 

    } 

    switch (__gptProvider) {
        // do not merge messages -> not needed for OpenAI and AzureOpenAI
        /*case "AzureOpenAI": 
        case "OpenAI":*/
        case "Gemini":
        case "Claude": {
            _previousConversation = __gptDialog_mergeAssistantSpeechAndFunctionCall(_previousConversation);
            break;
        }
    }
    
    return _previousConversation; 
}; 
 
// add node to ignore list 
__gptDialog_addNodeToIgnoreList = function (nodeId) { 
    if (__ignoredNodeList.includes(nodeId) == false) { 
        __ignoredNodeList.push(nodeId); 
    } 
}; 
 
// removes all previous conversation history 
__gptDialog_clearDialogHistory = function () { 
    __gptDialogHistoryStartFrom = context.speakFlow.size; 
    /*for (i = 0; i <= context.speakFlow.size - 1; i++) { 
        var __currNodeId = context.speakFlow.get(i).nodeId; 
        if (__ignoredNodeList.includes(__currNodeId) == false) { 
            __gptDialog_addNodeToIgnoreList(__currNodeId); 
        } 
    }*/ 
};


// ─────────────────────────────────────────────────────────────────────────────
// 2c. STT/TTS Processing (with language-specific fixes)
// ─────────────────────────────────────────────────────────────────────────────

__gptDialog_postprocessDialogSTT = function (__gptInput) { 

    // fix of common word issues
    if (__conversationType == 'voicebot') {
        switch (context.language.substr(0, 2)) {
            case "en": {
                __gptInput = __gptInput.replace(/SEC/g, 'sec');
                break;
            }
        }
    }


    if (typeof postprocessDialogSTT === 'function') { 
        __gptInputNew = postprocessDialogSTT(__gptInput); 
        if (__gptInputNew) { 
            return __gptInputNew; 
        } 
    } 
    return __gptInput; 
}; 
 
__gptDialog_preprocessDialogTTS = function (__gptOutput) { 

    // default replacements per language
    if (__conversationType == 'voicebot' && (__conversationLanguage == 'cs' || __conversationLanguage == 'sk')) {
        __gptOutput = __gptOutput.replace(/:00 hodin/g, ':00'); // 9 hodin hodin  
        __gptOutput = __gptOutput.replace(/\/a(?!>)|\\a(?!>)/g, ''); // podíval/a podíval\a  
    }
 
    if (__conversationType == 'voicebot') { 
        __gptOutput = __gptOutput.replace(/:\)/g, ''); // replace :) by nothing 
        __gptOutput = __gptOutput.replace(/\*/g, ' '); // replace * by space 
        __gptOutput = __gptOutput.replace(/!/g, '.'); // on voice channel, bot is screaming when exclamation used

        // escape non valid xml characters
        if (__conversationLanguage == 'en') {
            __gptOutput = __gptOutput.replace(/&/g, ' and '); // replace "&" to "and"
        }
        __gptOutput = XML.formatSequential([__gptOutput]);
        
    } else if (__conversationType == 'chatbot') {
        
        // check if output is not valid XML (guarded: __gptIsValidXML defined in Dialog Node)
        if (typeof __gptIsValidXML === 'function' && __gptIsValidXML(__gptOutput) == false) {
            // escape non valid xml characters
            __gptOutput = XML.formatSequential([__gptOutput]);
        }
    }
 
    // check if user defined their custom function 
    if (__gptOutput) { 
        if (typeof preprocessDialogTTS === 'function') { 
            __gptOutputNew = preprocessDialogTTS(__gptOutput); 
            if (__gptOutputNew) { 
                return __gptOutputNew; 
            } 
        } 
    } 
 
    return __gptOutput; 
};


// ─────────────────────────────────────────────────────────────────────────────
// 2d. Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

__gptGetLastSpeaker = function () {
    var speakFlow = __gptGetCleanSpeakFlow();

    if (!speakFlow.length)
        return "n/a";

    var last = speakFlow.pop();
    return last.type == 5
        ? "user"
        : "bot";
};

__gptGetCleanSpeakFlow = function () {
    var output = [];

    for (var i = 0; i < context.speakFlow.size; i++) {
        var item = context.speakFlow.get(i);

        if ([3, 5].includes(item.type))
            output.push(item);
    }
    return output;
};

// return true if bot said something
__gptBotSpoke = function () {
    for (var i = 0; i < context.speakFlow.size; i++) {
        if (context.speakFlow.get(i).type == 3) return true;
    }
    return false;
};

getCurrentDialogDate = function () {
    return new Date(); /* current server date and time (this function should be overrided) */
};

// Local safe fallback for wordCount (defined in Dialog Node; provide fallback here)
if (typeof wordCount === 'undefined') {
    wordCount = function(s) {
        if (!s) return 0;
        return s.split(/\s+/).length;
    };
}


// ─────────────────────────────────────────────────────────────────────────────
// 2e. Public API
// ─────────────────────────────────────────────────────────────────────────────

/* PUBLIC FUNCTIONS */ 
getDialogHistory = function () { 
    return __gptDialog_getPrevMessages(); 
};

addToDialogIgnored = function (nodeId) { 
    return __gptDialog_addNodeToIgnoreList(nodeId); 
};

clearDialogHistory = function () { 
    return __gptDialog_clearDialogHistory(); 
};

llmPreventStreaming = function (value) {
    __gptPreventStreaming = (value !== undefined) ? value : true;
};


// ─────────────────────────────────────────────────────────────────────────────
// 2f. Base Prompt Builder (localized)
// ─────────────────────────────────────────────────────────────────────────────

// Base prompt: optimized with Vocalls voice rules and localized structure
__gptDialog_getBasePrompt = function (objective) {
    var p = __persona;
    var lang = 'NL';
    if (typeof varObj !== 'undefined' && varObj && varObj.language) {
        lang = String(varObj.language).toUpperCase();
    } else if (typeof context !== 'undefined' && context && context.language) {
        lang = String(context.language).substr(0, 2).toUpperCase();
    }
    if (lang !== 'NL' && lang !== 'FR' && lang !== 'DE') lang = 'EN';
    var L = PROMPT_LABELS[lang] || PROMPT_LABELS.EN;
    var locale = (typeof context !== 'undefined' && context && context.language) ? context.language : 'nl-BE';

    // 1. Persona definition
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
                isInbound = context.callInfo.direction == 'inbound' ||
                    (context.callInfo.direction == 'outbound' && typeof debugCall !== 'undefined' && debugCall);
            }
        } catch (e) { /* ignore */ }
        prompt += '- ' + (isInbound ? L.inboundCall : L.outboundCall) + '\n';
    }

    var now = getCurrentDialogDate();
    prompt += '\n' + L.datePrefix + now.toLocaleDateString(locale, { timeZone: __timeZone }) +
        L.timePrefix + now.toLocaleTimeString(locale, { timeZone: __timeZone }) + '\n';

    // 2. General instructions (Vocalls ALGEMENE INSTRUCTIES)
    prompt += '\n' + L.rules + ':\n';
    prompt += L.generalInstructions + p.language + '.\n';
    prompt += L.clarifierRule;

    if (__conversationType == 'voicebot') {
        prompt += L.voiceRules;
        prompt += L.voiceTimeRule;
        prompt += L.voiceToneRule;
    }

    // 3. Advanced instructions
    if (typeof __advancedInstructions !== 'undefined' && __advancedInstructions) {
        prompt += '\n' + L.advanced + ':\n';
        prompt += __advancedInstructions + '\n';
    }

    // 4. General knowledge
    if (typeof __generalKnowledge !== 'undefined' && __generalKnowledge) {
        prompt += '\n' + L.knowledge + ':\n';
        prompt += __generalKnowledge + '\n';
    }

    // 5. Conversation awareness (localized)
    prompt += '\n' + L.conversation + ':\n';
    prompt += L.conversationList;

    // 6. Company information
    if (typeof __companyInformation !== 'undefined' && __companyInformation) {
        prompt += '\n' + L.companyInfo + p.companyName + ':\n';
        prompt += __companyInformation + '\n';
    }

    // 7. User information
    if (typeof __generalUserInfo !== 'undefined' && __generalUserInfo) {
        prompt += '\n' + L.userInfo + ':\n';
        prompt += __generalUserInfo + '\n';
    }

    // 8. Current objective (from context_preparation)
    if (objective) {
        prompt += '\n' + L.objectiveLine + ':\n';
        prompt += objective + '\n';
    }

    return prompt;
};


// =============================================================================
// SECTION 3: RUNTIME — Sequential execution
// =============================================================================

__gptComponentVersion = "4.0.0-standalone";

// 1. Detect language from varObj.language or context.language -> normalize to NL/FR/DE/EN
var _detectedLang = 'NL';
if (typeof varObj !== 'undefined' && varObj && varObj.language) {
    _detectedLang = String(varObj.language).toUpperCase();
} else if (typeof context !== 'undefined' && context && context.language) {
    _detectedLang = String(context.language).substr(0, 2).toUpperCase();
}

if (_detectedLang !== 'NL' && _detectedLang !== 'FR' && _detectedLang !== 'DE' && _detectedLang !== 'EN') {
    _detectedLang = 'NL';
}

// 2. Detect __conversationType (chatbot/voicebot) from context.callInfo
__conversationType = 'chatbot'; 
__conversationLanguage = _detectedLang.toLowerCase(); 
 
try { 
    if (context.callInfo.from) { 
        __conversationType = 'voicebot'; 
    } 
} catch (e) { 
 
}

// 3. Set __conversationLanguage from context.language.substr(0,2)
if (typeof context !== 'undefined' && context && context.language) {
    __conversationLanguage = context.language.substr(0, 2);
}

// 4. Set LLM config globals
__defaultLLMProvider = CONFIG.__defaultLLMProvider;
__defaultModel = CONFIG.__defaultModel;
__defaultServiceHost = CONFIG.__defaultServiceHost;
__logPrompt = CONFIG.__logPrompt;
__allowBargeIn = CONFIG.__allowBargeIn;
__typingSound = CONFIG.__typingSound;
__timeZone = CONFIG.__timeZone;
__gptMaxTokens = CONFIG.__gptMaxTokens;
__gptShortWaitDelay = CONFIG.__gptShortWaitDelay;
__gptLongWaitDelay = CONFIG.__gptLongWaitDelay;

// 5. Set __persona from AGENT_PERSONA[lang] + allowBargeIn with stopVoiceDetection guard
__persona = AGENT_PERSONA[_detectedLang] || AGENT_PERSONA.EN;

// check if we have barge-in support on callbot backed service 
if (typeof stopVoiceDetection !== 'function') { 
    __persona.allowBargeIn = false; 
} else {
    __persona.allowBargeIn = (__allowBargeIn == 'true' || __allowBargeIn == true);
}

// 6. Set __advancedInstructions from persona
__advancedInstructions = __persona.advancedInstructions;

// 7. Set __gpt_* arrays from MESSAGES[lang]
var _msgs = MESSAGES[_detectedLang] || MESSAGES.EN;
__gpt_repeat = _msgs.repeat;
__gpt_noInput = _msgs.noInput;
__gpt_waitShort = _msgs.waitShort;
__gpt_wait = _msgs.wait;
__gpt_waitConfirmation = _msgs.waitConfirmation;
__gpt_confirmation = _msgs.confirmation;
__gpt_fill = _msgs.fill;
__gpt_bargeIn = _msgs.bargeIn;

// Also needed for Dialog Node compatibility
__gpt_enteredNodes = [];

// 8. Init message rotation pointers (all to 0)
__noInputPtr = 0;
__confirmationPtr = 0;
__fillPtr = 0;
__repeatMessagePtr = 0;
__waitMessagePtr = 0;
__waitShortMessagePtr = 0;
__bargeInMessagePtr = 0;
__waitConfirmationMessagePtr = 0;

// 9. Set __generalKnowledge, __companyInformation from config
__generalKnowledge = GENERAL_KNOWLEDGE[_detectedLang] || GENERAL_KNOWLEDGE.EN;
__companyInformation = COMPANY_INFORMATION[_detectedLang] || COMPANY_INFORMATION.EN;

// 10. Set __usePersonaAndKB = true
__usePersonaAndKB = true;

// 11. Init dialog state
__gptSeed = 2017;
__gptFunctionCallHistory = [];
__ignoredNodeList = [];
__gptDialogHistoryStartFrom = 0;
__gptLastBotSpeechNode = null;
__gptPreventStreaming = false;

// 12. Set __gptComponentVersion
// (already set at the top of SECTION 3)

// 13. All functions from Section 2 are already defined above
// (functions are hoisted in JavaScript, so they're available)

// 14. Debug log
if (__logPrompt == true) {
    if (typeof log_debug === 'function') {
        log_debug("Bot Persona v" + __gptComponentVersion + " initialized - lang=" + _detectedLang + ", type=" + __conversationType);
    }
}

// Compatibility check
if (typeof Task === "undefined") {
    if (typeof log_warn === 'function') {
        log_warn("The voicebot engine version is outdated, please update.");
    }
}

// Warn if description is too long (using safe wordCount fallback)
if (__persona.description && wordCount(__persona.description) > 50) {
    if (typeof log_warn === 'function') {
        log_warn("Bot description too long! Use knowledge/objective instead!");
    }
}
