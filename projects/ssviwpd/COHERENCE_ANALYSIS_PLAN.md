# Coherence Analysis & Integration Plan

## Bot Persona + Context Preparation Integration

**Date**: 2026-02-09  
**Files Analyzed**:
- `bot_persona_4_standalone.js` (1081 lines)
- `context_preparation_4_refactored.js` (756 lines)
- `Bot Persona_source.xml` (reference for base prompt structure)

---

## Executive Summary

Both scripts are production-ready and ES5.1 compliant. However, there are **3 critical integration issues** and **5 enhancement opportunities** identified that need to be addressed to ensure seamless operation between the Bot Persona and Context Preparation scripts.

---

## Part 1: Current State Analysis

### 1.1 Bot Persona Script (`bot_persona_4_standalone.js`)

**Strengths**:
- ✅ Complete standalone implementation (CONFIG, CODE, RUNTIME)
- ✅ ES5.1 compliant (validated)
- ✅ 84 unit tests passed
- ✅ Multi-language support (NL/FR/DE/EN)
- ✅ Comprehensive message rotation
- ✅ Dialog history management
- ✅ STT/TTS processing

**Current Base Prompt Structure** (lines 862-952):
```javascript
__gptDialog_getBasePrompt = function (objective) {
    // 1. Persona definition (name, role, tone, style)
    // 2. General rules (language, voice-specific)
    // 3. Advanced instructions (from persona.advancedInstructions)
    // 4. General knowledge (domain knowledge)
    // 5. Company information
    // 6. User info (if available)
    // 7. Conversation awareness
    // 8. Objective (from context_preparation)
    // Returns: complete system prompt
}
```

**Issues Identified**:
1. ❌ Base prompt structure **differs** from XML source template
2. ❌ Missing explicit section headers (`YOUR PERSONA:`, `GENERAL KNOWLEDGE:`, etc.)
3. ❌ Date/time formatting uses localized labels but doesn't match XML structure
4. ⚠️ No validation that `objective` parameter is provided
5. ⚠️ `__generalUserInfo` is checked but never set anywhere

### 1.2 Context Preparation Script (`context_preparation_4_refactored.js`)

**Strengths**:
- ✅ ES5.1 compliant (validated)
- ✅ 117 unit tests passed
- ✅ Scenario-based prompt generation
- ✅ Multi-language support (NL/FR/DE/EN)
- ✅ Dynamic scenario determination
- ✅ Comprehensive validation

**Current Prompt Generation** (lines 587-605):
```javascript
function buildObjectivePrompt(scenario, lang, vars) {
    // 1. Scenario-specific instructions (from SCENARIO_PROMPTS)
    // 2. Facts section (deferralDate, slices, dayOfMonth, cost)
    // 3. Allowed actions list
    // Returns: objective string for Dialog Node
}
```

**Issues Identified**:
1. ❌ Prompts are **task-focused** but lack **persona context**
2. ❌ No reference to bot's role or interaction style
3. ⚠️ Facts section is always in Dutch ("Feiten:") regardless of language
4. ⚠️ No explicit instruction about when to use which action
5. ⚠️ Missing empathy/tone guidance that's in persona

---

## Part 2: Integration Issues (Critical)

### Issue 1: Base Prompt Structure Mismatch

**Problem**: The current `__gptDialog_getBasePrompt` function doesn't match the XML source structure.

**XML Source Structure** (from `Bot Persona_source.xml`):
```javascript
var prompt = `YOUR PERSONA:
You are a ${__persona.botType} working in a company named ${__persona.companyName} with the following specifications:
- Your name is ${__persona.name}
- Your gender is ${__persona.gender}
- Your role is ${__persona.companyRole}
- Your tone is ${__persona.tone}
- Your interaction style is ${__persona.interactionStyle}
- You are talking to ${__persona.targetCustomer}
- You speak ${__persona.language}

GENERAL KNOWLEDGE:
${__generalKnowledge}

COMPANY INFORMATION about ${__persona.companyName}:
${__companyInformation}

OBJECTIVE:
${objective}

INSTRUCTIONS:
${__advancedInstructions}

RULES:
- Always respond in ${__persona.language}
- Keep responses concise and natural
- Use the provided actions when appropriate
`;
```

**Current Implementation** (lines 862-952):
- Uses localized labels (PROMPT_LABELS) instead of English headers
- Different section order
- Missing explicit "YOUR PERSONA:" header
- Date/time section not in XML

**Impact**: 
- LLM may not interpret sections correctly
- Inconsistent with original design intent
- Harder to debug prompt issues

### Issue 2: Objective Prompt Lacks Persona Context

**Problem**: Context preparation's `buildObjectivePrompt` generates task instructions without persona context.

**Example Output** (Case 13, NL):
```
Doel: help de klant kiezen tussen uitstel van betaling en een afbetalingsplan.
- Vraag naar de voorkeur als de klant nog niet gekozen heeft.
- Na keuze: bevestig de keuze in 1 korte zin.
...

---
Feiten:
- deferralDate: 15-03-2026
- slices: 3
- dayOfMonth: 1
- adminCost: 25 EUR

Allowed actions: request_payment_deferral, create_payment_plan, transfer_to_operator, end_conversation.
```

**Missing**:
- Reference to bot's empathetic tone
- Instruction to use short sentences (from persona.interactionStyle)
- Guidance on natural variation (from persona.advancedInstructions)
- Connection between task and bot's role

**Impact**:
- Bot may execute actions correctly but sound robotic
- Persona traits (warmth, empathy) not reinforced in task context
- Disconnect between "who the bot is" and "what the bot does"

### Issue 3: Language Inconsistency in Facts Section

**Problem**: Facts section always uses Dutch label "Feiten:" regardless of selected language.

**Current Code** (line 599):
```javascript
prompt += '\n\n---\nFeiten:\n- ' + facts.join('\n- ');
```

**Should Be**:
```javascript
var factsLabel = {
    NL: 'Feiten',
    FR: 'Faits',
    DE: 'Fakten',
    EN: 'Facts'
};
prompt += '\n\n---\n' + factsLabel[lang] + ':\n- ' + facts.join('\n- ');
```

**Impact**:
- Minor but unprofessional
- May confuse LLM in non-Dutch scenarios
- Inconsistent with multi-language design

---

## Part 3: Enhancement Opportunities

### Enhancement 1: Unified Prompt Structure

**Goal**: Align both scripts to use the same prompt structure as XML source.

**Changes**:
1. Update `__gptDialog_getBasePrompt` to use English section headers
2. Remove localized labels (PROMPT_LABELS) or use them only for display
3. Match XML section order exactly
4. Add explicit "YOUR PERSONA:", "GENERAL KNOWLEDGE:", etc.

**Benefit**:
- Consistency with original design
- Easier debugging
- Better LLM comprehension

### Enhancement 2: Persona-Aware Objective Prompts

**Goal**: Inject persona context into context preparation prompts.

**Approach**:
Add a preamble to each scenario prompt that references the bot's persona:

```javascript
function buildObjectivePrompt(scenario, lang, vars) {
    var preamble = {
        NL: "Als " + __persona.name + ", een " + __persona.tone + " " + __persona.botType + ", ",
        FR: "En tant que " + __persona.name + ", un " + __persona.tone + " " + __persona.botType + ", ",
        DE: "Als " + __persona.name + ", ein " + __persona.tone + " " + __persona.botType + ", ",
        EN: "As " + __persona.name + ", a " + __persona.tone + " " + __persona.botType + ", "
    };
    
    var prompt = preamble[lang] + resolveTemplate(localized(promptTpl, lang), vars);
    // ... rest of function
}
```

**Benefit**:
- Bot maintains persona even in task-focused scenarios
- Reinforces tone and style in every interaction
- More natural, less robotic responses

### Enhancement 3: Action Guidance Enhancement

**Goal**: Provide explicit guidance on when/how to use each action.

**Current** (line 604):
```javascript
prompt += '\n\nAllowed actions: ' + toolNames.join(', ') + '.';
```

**Enhanced**:
```javascript
var actionGuidance = {
    NL: '\n\nBeschikbare acties:\n',
    FR: '\n\nActions disponibles:\n',
    DE: '\n\nVerfügbare Aktionen:\n',
    EN: '\n\nAvailable actions:\n'
};

prompt += actionGuidance[lang];
for (var i = 0; i < toolNames.length; i++) {
    var action = toolNames[i];
    var desc = ACTION_DESCRIPTIONS[action][lang];
    prompt += '- ' + action + ': ' + desc + '\n';
}
```

**Benefit**:
- LLM understands not just what actions exist, but when to use them
- Reduces incorrect action calls
- Better user experience

### Enhancement 4: Validation & Error Handling

**Goal**: Add validation to ensure scripts work together correctly.

**Checks to Add**:
1. In `bot_persona`: Validate that `__objective` is set before Dialog Node
2. In `context_preparation`: Validate that `__persona` exists
3. In both: Add version compatibility check

**Example**:
```javascript
// In context_preparation RUNTIME:
if (typeof __persona === 'undefined') {
    logError('Context Preparation Error: __persona not set. Bot Persona script must run first.');
    agentContext.error = true;
    agentContext.errorReason = 'Bot Persona not initialized';
}
```

**Benefit**:
- Fail fast with clear error messages
- Easier debugging in production
- Prevents silent failures

### Enhancement 5: Documentation & Comments

**Goal**: Add inline documentation explaining integration points.

**Areas to Document**:
1. In `bot_persona`: Document that `__objective` will be set by context_preparation
2. In `context_preparation`: Document expected globals from bot_persona
3. In both: Add integration test recommendations

**Example**:
```javascript
// =============================================================================
// INTEGRATION POINT: Context Preparation
// =============================================================================
// This script expects the following to be called AFTER this script:
// - context_preparation_4_refactored.js (or equivalent)
//   which will set: __objective, __opening, agentContext
//
// The Dialog Node will then use:
// - __persona (set here)
// - __objective (set by context_preparation)
// - __gptDialog_getBasePrompt(__objective) (defined here)
// =============================================================================
```

**Benefit**:
- Clear understanding of script dependencies
- Easier onboarding for new developers
- Prevents integration mistakes

---

## Part 4: Recommended Action Plan

### Phase 1: Critical Fixes (Must Do) — COMPLETED 2026-02-09

**Priority**: HIGH  
**Estimated Effort**: 2-3 hours  
**Risk**: LOW (well-tested changes)

1. **Fix Base Prompt Structure** (Issue 1) — DONE
   - Update `__gptDialog_getBasePrompt` to match XML source
   - Use English section headers
   - Remove PROMPT_LABELS dependency
   - Test with existing unit tests

2. **Fix Facts Label** (Issue 3) — DONE
   - Add localized "Facts" labels
   - Update `buildObjectivePrompt` function
   - Add test case for each language

3. **Add Integration Validation** (Enhancement 4) — DONE
   - Add `__persona` check in context_preparation
   - Add `__objective` check before Dialog Node (if applicable)
   - Add error logging

**Deliverables**:
- Updated `bot_persona_4_standalone.js`
- Updated `context_preparation_4_refactored.js`
- Updated unit tests
- Validation report

### Phase 2: Persona Integration (Should Do)

**Priority**: MEDIUM  
**Estimated Effort**: 3-4 hours  
**Risk**: MEDIUM (changes prompt generation logic)

1. **Add Persona Context to Objectives** (Issue 2 + Enhancement 2)
   - Create persona preamble function
   - Update `buildObjectivePrompt` to include preamble
   - Test across all scenarios and languages

2. **Enhance Action Guidance** (Enhancement 3)
   - Create ACTION_DESCRIPTIONS config
   - Update prompt generation to include descriptions
   - Test action selection accuracy

**Deliverables**:
- Enhanced context_preparation with persona awareness
- New ACTION_DESCRIPTIONS config
- Updated integration tests
- Before/after prompt comparison

### Phase 3: Polish & Documentation (Nice to Have)

**Priority**: LOW  
**Estimated Effort**: 1-2 hours  
**Risk**: NONE (documentation only)

1. **Add Integration Documentation** (Enhancement 5)
   - Document integration points in both scripts
   - Create integration test guide
   - Update AGENTS.md with integration notes

2. **Create Integration Test** (`test_full_flow.js`)
   - Load both scripts in sequence
   - Validate end-to-end flow
   - Test all scenarios with persona

**Deliverables**:
- Inline documentation
- Integration test script
- Updated AGENTS.md

---

## Part 5: Testing Strategy

### 5.1 Unit Tests (Existing - Verify Still Pass)

- `test_bot_persona.js` (84 tests)
- `test_context_preparation.js` (117 tests)

**Action**: Re-run after each phase to ensure no regressions.

### 5.2 Integration Tests (New - To Create)

**Test File**: `test_full_flow.js`

**Test Cases**:
1. Bot Persona loads first, sets all globals
2. Context Preparation loads second, uses persona
3. Base prompt includes all sections correctly
4. Objective prompt references persona
5. All languages work correctly
6. Error handling when scripts load out of order

**Expected Results**:
- All tests pass
- Prompts are coherent and complete
- No missing globals
- Clear error messages on failure

### 5.3 Manual Testing (Production Validation)

**Scenarios to Test**:
1. Case 13 (full_choice) in NL - verify persona + objective coherence
2. Case 1 (info_only) in FR - verify empathy in responses
3. Case 8 (collection_agency) in DE - verify tone consistency
4. Fallback error in EN - verify error handling

**Success Criteria**:
- Bot maintains persona throughout conversation
- Task instructions are clear and followed
- Tone is consistent with persona definition
- Actions are used appropriately

---

## Part 6: Risk Assessment

### Low Risk Changes
- ✅ Facts label localization (simple string replacement)
- ✅ Documentation additions (no code changes)
- ✅ Validation checks (fail-safe additions)

### Medium Risk Changes
- ⚠️ Base prompt structure update (changes LLM input)
- ⚠️ Persona preamble addition (changes prompt length)
- ⚠️ Action guidance enhancement (changes prompt format)

**Mitigation**:
- Test with existing conversations
- A/B test old vs new prompts
- Monitor LLM token usage
- Keep rollback option ready

### High Risk Changes
- ❌ None identified

---

## Part 7: Success Metrics

### Technical Metrics
- ✅ All unit tests pass (201 tests total)
- ✅ ES5.1 validation passes
- ✅ Integration tests pass (new)
- ✅ No console errors in simulator

### Quality Metrics
- ✅ Prompt structure matches XML source
- ✅ All languages have consistent formatting
- ✅ Persona traits visible in all scenarios
- ✅ Actions used correctly 95%+ of time

### User Experience Metrics
- ✅ Bot sounds natural and empathetic
- ✅ Task completion rate maintained or improved
- ✅ Fewer transfer_to_operator calls
- ✅ Positive user feedback

---

## Part 8: Next Steps

### Immediate Actions
1. ✅ Review this plan with stakeholders
2. ⬜ Get approval for Phase 1 (critical fixes)
3. ⬜ Create backup of current working scripts
4. ⬜ Begin Phase 1 implementation

### Follow-up Actions
1. ⬜ Schedule Phase 2 after Phase 1 validation
2. ⬜ Plan A/B testing for prompt changes
3. ⬜ Document lessons learned
4. ⬜ Update AGENTS.md with integration patterns

---

## Appendix A: XML Base Prompt Template (Reference)

```javascript
// From Bot Persona_source.xml (Estonian example, line 166)
__gptDialog_getBasePrompt = function (objective) {
    var prompt = `YOUR PERSONA:
You are a ${__persona.botType} working in a company named ${__persona.companyName} with the following specifications:
- Your name is ${__persona.name}
- Your gender is ${__persona.gender}
- Your role is ${__persona.companyRole}
- Your tone is ${__persona.tone}
- Your interaction style is ${__persona.interactionStyle}
- You are talking to ${__persona.targetCustomer}
- You speak ${__persona.language}

GENERAL KNOWLEDGE:
${__generalKnowledge}

COMPANY INFORMATION about ${__persona.companyName}:
${__companyInformation}

OBJECTIVE:
${objective}

INSTRUCTIONS:
${__advancedInstructions}

RULES:
- Always respond in ${__persona.language}
- Keep responses concise and natural
- Use the provided actions when appropriate
`;
    return prompt;
};
```

---

## Appendix B: Current vs. Proposed Prompt Comparison

### Current Prompt (Case 13, NL)

**From bot_persona**:
```
Jij bent Dena, een zelfbedieningsagent bij ENGIE.
- Jouw rol: selfservice betalingsagent
- Jouw toon: vriendelijk, deskundig, professioneel maar warm
...
[Date/time]

REGELS:
- Antwoord altijd in Nederlands.
...

GEAVANCEERDE INSTRUCTIES:
REGELS:
- Geen actie zonder expliciete bevestiging
...

ALGEMENE KENNIS:
[knowledge content]

BEDRIJFSINFORMATIE over ENGIE:
[company info]

DOEL:
[objective from context_preparation]
```

**From context_preparation**:
```
Doel: help de klant kiezen tussen uitstel van betaling en een afbetalingsplan.
- Vraag naar de voorkeur als de klant nog niet gekozen heeft.
...

---
Feiten:
- deferralDate: 15-03-2026
- slices: 3

Allowed actions: request_payment_deferral, create_payment_plan, transfer_to_operator, end_conversation.
```

### Proposed Prompt (Case 13, NL)

**From bot_persona** (updated):
```
YOUR PERSONA:
You are a zelfbedieningsagent working in a company named ENGIE with the following specifications:
- Your name is Dena
- Your gender is vrouw
- Your role is selfservice betalingsagent
- Your tone is vriendelijk, deskundig, professioneel maar warm
- Your interaction style is helder en begrijpelijk. Korte zinnen
- You are talking to klanten met betalingsvragen
- You speak Nederlands

GENERAL KNOWLEDGE:
[knowledge content]

COMPANY INFORMATION about ENGIE:
[company info]

INSTRUCTIONS:
REGELS:
- Geen actie zonder expliciete bevestiging
- Herhaal de optie: 'Zal ik dit regelen?'
...

OBJECTIVE:
[objective from context_preparation]

RULES:
- Always respond in Nederlands
- Keep responses concise and natural (korte zinnen)
- Maintain a vriendelijk, deskundig, professioneel maar warm tone
- Use the provided actions when appropriate
```

**From context_preparation** (updated):
```
Als Dena, een vriendelijk, deskundig, professioneel maar warm zelfbedieningsagent, help de klant kiezen tussen uitstel van betaling en een afbetalingsplan.
- Vraag naar de voorkeur als de klant nog niet gekozen heeft.
- Na keuze: bevestig de keuze in 1 korte zin.
...

---
Feiten:
- deferralDate: 15-03-2026
- slices: 3
- dayOfMonth: 1
- adminCost: 25 EUR

Beschikbare acties:
- request_payment_deferral: Gebruik dit om uitstel van betaling te regelen na expliciete bevestiging
- create_payment_plan: Gebruik dit om een afbetalingsplan aan te maken na expliciete bevestiging
- transfer_to_operator: Gebruik dit bij weigering, onduidelijkheid, of off-topic vragen
- end_conversation: Gebruik dit als alle vragen beantwoord zijn en de klant tevreden is
```

**Key Improvements**:
1. ✅ English section headers (consistent with XML)
2. ✅ Persona context in objective
3. ✅ Action descriptions (when to use each)
4. ✅ Localized facts label
5. ✅ Tone reinforcement in both sections

---

**End of Plan**
