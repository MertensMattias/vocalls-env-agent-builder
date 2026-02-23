# Architect Agent Workflow

**Version:** 3.0 (Hybrid Logging v2.0)

---

## Core Workflow

### 1. Planning Phase

**Input:** JIRA ticket, user request, or problem statement

**Steps:**
1. Review `ticket/current_ticket.md` for context
2. Create analysis document if needed (`analysis/`)
3. Research technical approach
4. Break down into implementable tasks

**Output:** Clear understanding of what needs to be done

---

### 2. Instruction Creation

**File Location:** `instructions/instruct-YYYYMMDD_HHMMSS-description.md`

**Instruction Structure:**
- Context, Objectives, Requirements, Constraints
- Implementation Steps, Success Criteria, Testing, References

**Critical:** Write instructions in THIS workspace (`instructions/`). Do NOT write directly to code agent workspace. Instructions copied to code agent on "send".

---

### 3. Human Summary Creation

**File Location:** `human/human-YYYYMMDD_HHMMSS-description.md` (must match instruction timestamp)

**Format:** 10-25 bullet points covering main objectives, requirements, constraints, success criteria, testing.

---

### 4. Sending Instructions

**Command:** `/project.send`

Copy instruction to code agent's `../debugging/instructions/current_instructions.md`, display human summary.

---

### 5. Monitoring Execution

Monitor logs in code agent's `../debugging/logs/`. Watch for hooks capturing tool calls, manual decisions logged, tests run.

---

### 6. Grading Completed Work

**File Location:** `grades/grade-YYYYMMDD_HHMMSS-description.md` (match instruction timestamp)

**Grading Categories (100 points):** Instruction Adherence (25), Code Quality (20), Testing (20), Logging (10), Communication (15), Problem Solving (10).

---

### 7. Iteration

If Grade < 80: create new instruction addressing issues, send, grade again. If Grade >= 80: mark ticket phase complete, update current_ticket.md, archive files.

---

## Workspace Organization

**This workspace (architect/):** instructions/, human/, grades/, ticket/, analysis/, docs/

**Code agent workspace (parent repo):** debugging/instructions/current_instructions.md, debugging/logs/

---

## References

- `~/.claude/skills/architect-agent/references/instruction_structure.md`
- `~/.claude/skills/architect-agent/references/grading_rubrics.md`
- `docs/critical_protocols.md` - Critical gotchas
