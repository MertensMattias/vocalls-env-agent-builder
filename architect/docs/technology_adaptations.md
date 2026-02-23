# Technology Adaptations

**Project:** vocalls-env-agent-builder
**Technology Stack:** Vocalls IVR, Node.js, ES5.1 JavaScript
**Last Updated:** 2025-02-23

---

## Overview

This repository is a Vocalls IVR environment (multi-project call scripts, CLI tooling, simulation). The code agent workspace is the repository root. Architect workspace is the `architect/` subfolder.

---

## Technology Stack

### Primary Technologies
- **Runtime:** Node.js (CLI, simulate, validate, export)
- **Scripts:** ES5.1 JavaScript only (no let/const, no arrow functions, no async/await, no .catch())
- **Framework:** Vocalls IVR (callScript_init, globalLibraries, callScripts load order)
- **Config:** env.config.json (multi-project), per-project in projects/

### Testing
- **Simulate:** `npm run simulate -- --callScript main --project <name>`
- **Validate:** `npm run validate -- --project <name> --all` (ES5.1)
- **Export:** `npm run export -- --callScript main --project <name>`

---

## Build and Test Commands

### Install
```bash
npm install
```

### Simulate (run call script)
```bash
npm run simulate -- --callScript main --project ssviwpd
```

### Validate (ES5.1 + structure)
```bash
npm run validate -- --project ssviwpd --all
```

### Export (production bundle)
```bash
npm run export -- --callScript main --project ssviwpd
```

### Switch active project
```bash
npm run switch -- ssviwpd
npm run switch -- --list
```

---

## Project Structure (Code Agent = Repo Root)

```
vocalls-env-agent-builder/
├── core/                 # Sandbox, script loader, validators
├── cli/                  # simulate, validate, export, switch
├── projects/             # IVR projects (example-starter, ssviwpd, ...)
├── env.config.json       # Multi-project config, activeProject
├── architect/            # THIS architect workspace
│   ├── instructions/
│   ├── human/
│   ├── grades/
│   ├── ticket/
│   ├── analysis/
│   └── docs/
└── debugging/             # Code agent: instructions, logs
    ├── instructions/
    └── logs/
```

---

## Code Agent Instructions

Code agent reads from: `debugging/instructions/current_instructions.md`

Root AGENTS.md defines framework rules, ES5.1 constraints, script load order. Per-project: `projects/<name>/AGENTS.md`, `project_config.md`, `workflow_state.md`.

---

## References

- Repository root: `AGENTS.md`, `README.md`
- Architect skill: `~/.claude/skills/architect-agent/references/`
