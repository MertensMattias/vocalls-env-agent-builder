# AGENTS.md – Vocalls Framework Guide

This document defines the shared rules for the entire workspace. Each project receives its own `projects/<name>/AGENTS.md` for customer-specific instructions—refer to both when collaborating.

---

## 1. Framework Overview

### Repository Layout

vocalls-environment-template/
├── core/                     # Sandbox + script loader + validators
├── cli/                      # Dev tooling (simulate, validate, export, switch)
├── vocalls_session_init/     # Session builders & helpers
├── projects/                 # One or more IVR projects
├── env.config.json           # Multi-project configuration & defaults
└── package.json

### First-Time Setup

```bash
npm install
npm run simulate -- --callScript main          # Example project
npm run validate -- --all
npm run export -- --callScript main
```

### Creating Projects

```bash
npm run init                                   # Smart wizard
npm run simulate -- --list-projects            # Show configured projects
npm run switch -- <project-name>               # Update activeProject in env.config.json
```

The wizard captures project metadata, per-project defaults, and generates project-level documentation automatically.

---

## 2. ES5.1 Coding Constraints (Strict)

| ✅ Allowed                               | ❌ Forbidden                                         |
|-----------------------------------------|------------------------------------------------------|
| `var` declarations                      | `let`, `const`                                       |
| Template literals & string concat       | Arrow functions `() => {}`                           |
| Destructuring (`var {a,b}=obj`)         | `async/await`                                        |
| Promises with `.then(success, failure)` | `.catch()`                                           |
| Map, Set, WeakMap, WeakSet              | Optional chaining `obj?.prop`, nullish `a ?? b`      |
| `try/catch`                             | ES6 classes, for...of, modules (`import`, `export`)  |

**Logging** – use the provided wrappers (`logInfo`, `logWarn`, `logError`, `logDebug`) instead of `console.*`.

---

## 3. Global APIs

```javascript
context               // Vocalls call context
varObj                // Call-level variables (ani, dnis, language, etc.)
Storage.readFile()    // Persistent storage (disk/memory)
Storage.writeFile()
jsonHttpRequest()     // HTTP client (thenable)
nowUTC()              // Current timestamp (ISO)
logInfo / logWarn / logError / logDebug
```

### Database Bridge (optional)

Available when `vocalls-database-service` runs and project settings define `databaseUrl`:

```javascript
dbQuery(sql, params)
dbQuerySingle(sql, params)
dbExecute(sql, params)
dbStoredProc(procName, params)
```

Always guard with `if (typeof dbQuery !== 'undefined')` before use.

### Script Loading Order (hard requirement)

1. `callScript_init/globalCode.js`
2. `callScript_init/globalVariables.js`
3. `globalLibraries/active/*` (reverse alphabetical)
4. Project `callScripts/<name>.js`

---

## 4. CLI Toolbox (Project-Aware)

All commands accept the `--project` flag to target specific entries in `env.config.json`. Defaults fall back to the project settings captured by the wizard.

### Simulate

```bash
npm run simulate -- --callScript main --project my-project
npm run simulate -- --list-projects                 # Display available projects
npm run switch -- my-project                        # Mark project active (optional)
```

Options:

- `--project <name>` – project entry (default: activeProject)
- `--env <acc|prd|dvp>` – override project environment
- `--mode <real|stub>` – HTTP behaviour
- `--storage <disk|memory>` – storage backend
- `--script <path>` – run arbitrary JS file instead of call script

### Validate

```bash
npm run validate -- --project my-project --callScripts
npm run validate -- --project my-project --globalLibraries
npm run validate -- projects/my-project/callScripts/main.js
```

### Export

```bash
npm run export -- --callScript main --project my-project
npm run export -- --callScript main --project my-project --output production.js
```

Exports honour project module names and paths defined in `env.config.json`.

### Switch Active Project

```bash
npm run switch -- another-project
npm run switch -- --list
```

Updates `env.config.json.activeProject` without manual edits.

---

## 5. Database Service

```bash
cd vocalls-database-service
npm install
npm run init-db
npm start   # Default endpoint: http://localhost:3001
```

Set the per-project `settings.databaseUrl` during initialization (or edit later) so every CLI tool references the correct instance.

---

## 6. Multi-Project Workflow

1. **Initialize** – `npm run init` (smart wizard). Review and confirm settings before generation.
2. **Inspect** – check `projects/<name>/` plus the new entry in `env.config.json` (paths, settings, metadata).
3. **Develop** – edit call scripts, add global libraries, and document specifics in `projects/<name>/AGENTS.md`.
4. **Simulate** – `npm run simulate -- --callScript main --project <name>` (project defaults applied automatically).
5. **Validate** – enforce ES5.1 with `npm run validate -- --project <name> --all`.
6. **Export** – gather production-ready bundle with `npm run export` (writes to `exported_callscripts/`).
7. **Switch** – optional `npm run switch -- <name>` to change the active project for day-to-day commands.

`env.config.json` is the single source of truth—always run the wizard or `npm run switch` instead of manual edits when possible.

---

## 7. Coding Patterns & Utilities

### Variables

```javascript
var customerData = getCustomerInfo();
var result = {};
```

### Functions

```javascript
function processCall(context) {
    var id = generateId();
    return id;
}
```

### HTTP (No `.catch()`)

```javascript
jsonHttpRequest({
    url: 'https://api.example.com/data',
    method: 'POST',
    body: JSON.stringify(payload)
}).then(function(response) {
    if (response.ok) {
        logInfo('Success:', response.data);
    } else {
        logError('Failure:', response.error);
    }
});
```

### Error Handling

```javascript
try {
    var result = riskyOperation();
    handleResult(result);
} catch (error) {
    logError('Error:', error.message);
}
```

### Debugging Helpers

```javascript
logDebug('varObj', varObj);
if (typeof dbQuery !== 'undefined') {
    logInfo('Database available');
}
```

---

## 8. Project-Level Documentation

- **Global (`AGENTS.md`)** – This file. Defines shared standards, CLI usage, and constraints.
- **Per Project (`projects/<name>/AGENTS.md`)** – Expand with customer specifics, integrations, naming conventions, and test plans.
- **`project_config.md`** – Long-term memory (requirements, constraints, stack choices).
- **`workflow_state.md`** – Live task tracker, activity log, and next steps.
- **`SETUP.md`** – Onboarding guide generated by the wizard.

Keep these documents synchronized with code changes—AI assistants rely on them for context.

---

## 9. Additional References

- `AGENT_MEMORY_GUIDE.md` – Deep dive into memory strategy and collaboration workflows.
- Vocalls documentation & ES5.1 specification (linked in project templates).
- `projects/example-starter` – Minimal reference implementation.

### Documentation & Changelog Maintenance

- Keep documentation in sync with code changes. Every substantive update should note:
  - Summary of the change (what/why)
  - Affected files or modules
  - Testing or validation evidence (if applicable)
- Root-level references:
  - `CHANGELOG.md` – chronological list of notable changes; add an entry for every release-worthy feature or fix.
  - `docs/` (if present) – central place for architecture or integration guides; update relevant sections when interfaces change.
- Project-level documentation workflow:
  - `projects/<name>/SETUP.md` – onboarding instructions; enrich with new setup steps or dependencies introduced during the release.
  - `projects/<name>/project_config.md` – stable context; record architectural decisions, APIs, persistent settings.
  - `projects/<name>/workflow_state.md` – dynamic tracker; after each task, update phase, checklists, activity log (with ISO timestamps).
  - `projects/<name>/AGENTS.md` – per-project standards; note new integrations, coding conventions, and QA expectations.
  - `projects/<name>/CHANGELOG.md` (if maintained) – capture project-specific release notes.
- When collaborating:
  - Reference the relevant documentation section in PR descriptions.
  - If a change refactors a shared utility, flag downstream projects to update their documentation accordingly.

### Documentation Compliance Rules

- Before modifying code or documentation, read root `AGENTS.md`, project `project_config.md`, and `workflow_state.md` to confirm current context.
- When adding or modifying shared utilities or patterns, update root `AGENTS.md` during the same task.
- When changing project-specific logic, update `projects/<name>/AGENTS.md` and `project_config.md` to reflect the new behavior, integrations, or decisions.
- After each task, update `workflow_state.md` by marking completed items, adding an Activity Log entry with an ISO 8601 timestamp, and queuing any follow-up work.
- Update `SETUP.md` only if onboarding steps, prerequisites, or tooling change; otherwise leave it untouched.
- Do not submit work unless all affected documentation files are synchronized with the code changes; reviewers must verify this alignment.

---

_Last updated for Wizard 2.0 (multi-project support, smart defaults, project-level documentation templates)._  
For questions, review existing examples or run `npm run validate` before committing changes.
