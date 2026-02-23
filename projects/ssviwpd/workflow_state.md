# ssviwpd - Workflow State

**Dynamic Workspace** - Current development progress and task tracking

> **Note**: This file tracks current, dynamic state. For stable project context, see `project_config.md`.

## Current Phase

**Phase**: Planning
**Started**: 2025-02-09T00:00:00Z
**Owner**: wizard

## Development Tasks

### Planning Phase
- [ ] Define call flow logic (greeting, payment delay request, validation, conclusion)
- [ ] Identify required APIs/Services (document in project_config.md)
- [ ] Plan error handling strategy (timeouts, failures, fallbacks)
- [ ] Design varObj structure (what variables are needed?)

### Implementation Phase
- [ ] Implement globalCode.js utilities (if project-specific functions needed)
- [ ] Implement globalVariables.js initialization (custom varObj setup)
- [ ] Implement main call script (core call flow logic)
- [ ] Add error handling (try/catch, HTTP error handling)
- [ ] Add logging/debugging (logInfo, logWarn, logError)

### Validation Phase
- [ ] Validate ES5.1 constraints (`npm run validate -- --callScripts --project ssviwpd`)
- [ ] Test with simulator (`npm run simulate -- --callScript main --project ssviwpd`)
- [ ] Test error scenarios (API failures, timeouts, invalid inputs)
- [ ] Review code (readability, maintainability, patterns)

### Deployment Phase
- [ ] Run final validation
- [ ] Export for production (`npm run export -- --callScript main --project ssviwpd`)
- [ ] Document deployment (update project_config.md with deployment notes)

## Blueprints (Previous Plans)

> Archive old plans here when they change significantly. Include timestamp and reason for change.

- Initial project structure created at 2025-02-09T00:00:00Z

## Activity Log

> Use ISO 8601 format for timestamps: `2025-01-15T10:30:00Z`

```text
[2025-02-09T00:00:00Z] Project initialized via wizard 2.0
```

## Implementation Rules

1. Always check function availability before using (`if (typeof dbQuery !== 'undefined')`)
2. Use safeGet() for property access (`safeGet(varObj, 'customer.name', 'Unknown')`)
3. Use varObj for call-related variables (ani, dnis, language, customer data)
4. Test scripts with: `npm run simulate -- --callScript main --project ssviwpd`
5. Validate with: `npm run validate -- --callScripts --project ssviwpd`
6. Update this file after completing tasks (mark `[x]`, add Activity Log entry)
7. Update project_config.md if architecture changes

## Next Steps

1. Update `project_config.md` with:
   - APIs & Services section (endpoints, auth, timeouts)
   - Key Decisions section (architectural choices)
2. Design call flow in `callScripts/main.js` for payment delay flow
3. Add global libraries as needed in `globalLibraries/active/`
4. Run `npm run simulate -- --callScript main --project ssviwpd`
5. Iterate and refine

## Notes

- This file is read by AI assistants for context
- Update after major changes or completions
- Archive blueprints with timestamps for reference
- Keep task descriptions specific and actionable
- Always include timestamps in Activity Log (ISO 8601 format)
