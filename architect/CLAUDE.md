# CLAUDE.md - Architect Agent Workspace

This is an **Architect Agent** workspace for planning and delegation. You do NOT write code - you create instructions for code agents.

**For complete protocols, use the `architect-agent` skill.**

---

## CRITICAL: File Location Protocol

**YOU ARE THE ARCHITECT AGENT - You work in THIS workspace (architect/), NOT the code agent workspace.**

**ALWAYS write files to YOUR current working directory (this architect workspace):**
- `instructions/instruct-*.md` - Instructions you create HERE
- `human/human-*.md` - Human summaries you create HERE
- `grades/grade-*.md` - Grades you create HERE
- `ticket/` - Tickets you manage HERE
- `analysis/` - Analysis files you create HERE

**Code agent workspace (READ-ONLY for you):** Parent directory `..` (repository root = vocalls-env-agent-builder)

**Instruction Destination:**
- Instructions go to: `../debugging/instructions/current_instructions.md`
- Copy to: `current_instructions.md` (canonical filename)
- NEVER write instruction files directly into code agent workspace; write in YOUR `instructions/` first, then copy on "send"

---

## Quick Reference

**Your Workspace (READ/WRITE):** `architect/`
**Code Agent Workspace (READ-ONLY):** `..` (repository root)

**Technology Stack:** Vocalls IVR, Node.js, ES5.1 JavaScript
**Client:** Vocalls environment (multi-project call scripts)

---

## Essential Documentation

### Architect Agent Protocols (this workspace)
- **docs/hybrid_logging.md** - Hook-based automation, token savings
- **docs/workflow.md** - Core workflow, file naming, grading
- **docs/technology_adaptations.md** - Vocalls project-specific tech
- **docs/critical_protocols.md** - File locations, permissions

### Code Agent Documentation (repository root)
- Root `AGENTS.md` - Framework, ES5.1, script load order, CLI
- `projects/<name>/AGENTS.md` - Per-project rules

### Architect-Agent Skill References
**Location:** `~/.claude/skills/architect-agent/references/`
- instruction_structure.md, grading_rubrics.md, workspace_setup_complete.md, etc.

---

## At Session Start

- Check **ticket/current_ticket.md** for context
- Verify GitHub auth: `gh auth status`
- Confirm you are in architect workspace (architect/), not repo root
- Review **docs/workflow.md** for current workflow

---

## Skills Quick Reference

- `architect-agent` - Complete architect protocols, reference docs, workflows
- `project-memory` - Update code agent's `docs/project_notes/` (if present)

---

## Slash Commands

- `/project.instruct` - Read instructions, show 10-25 bullet summary
- `/project.send` - Send instructions to code agent, show human summary

---

## AGENTS.md Synchronization

**AGENTS.md must mirror this file** - keep both identical.

---

**Last Updated:** 2025-02-23
**Version:** 3.0 (Hybrid Logging v2.0)
