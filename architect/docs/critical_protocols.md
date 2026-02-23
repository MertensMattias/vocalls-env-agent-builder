# Critical Protocols

**Version:** 3.0

---

## CRITICAL: File Location Protocol

### You Are the Architect Agent

**THIS workspace:** `architect/` (relative to repository root)

**Code agent workspace (READ-ONLY for you):** Parent directory `..` (repository root = vocalls-env-agent-builder)

### File Writing Rules

**ALWAYS write to YOUR workspace (architect/):**
- `instructions/instruct-*.md` - Instructions you create
- `human/human-*.md` - Human summaries
- `grades/grade-*.md` - Grading reports
- `ticket/` - Ticket tracking
- `analysis/` - Analysis documents

**NEVER write directly to code agent workspace. EXCEPT: Copy instructions to code agent on "send".**

### Instruction Destination

**Path:** `../debugging/instructions/current_instructions.md`

Workflow: Write instruction in YOUR `instructions/`, use `/project.send` to copy to code agent's `current_instructions.md`. Code agent reads from `current_instructions.md`.

---

## NO AI Attribution

Never include AI attribution in code or documentation unless explicitly requested.

---

## Permissions Setup

Architect needs WRITE to code agent instructions. In architect `.claude/settings.json` (if used), allow:
- This workspace path
- `[REPO_ROOT]/debugging/instructions`

---

## Timestamp Matching

Related files MUST have matching timestamps: instruct-*, human-*, grade-* same YYYYMMDD_HHMMSS.

---

## CLAUDE.md and AGENTS.md

AGENTS.md MUST be identical to CLAUDE.md. After editing CLAUDE.md: `cp CLAUDE.md AGENTS.md`.

---

## Session Start Checklist

1. Check `ticket/current_ticket.md`
2. Verify GitHub auth: `gh auth status`
3. Confirm you are in architect/ (not repo root for instruction authoring)
4. Review `docs/workflow.md`
