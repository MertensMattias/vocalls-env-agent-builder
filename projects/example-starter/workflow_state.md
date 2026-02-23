# example-starter - Workflow State

**Dynamic Workspace** - Current development progress and task tracking

> **Note**: This file tracks current, dynamic state. For stable project context, see `project_config.md`.

## Current Phase

**Phase**: Example/Reference
**Started**: Template
**Owner**: template

## Development Tasks

### Planning Phase
- [x] Define call flow logic (greeting → menu → actions → conclusion)
- [x] Identify required APIs/Services (document in project_config.md)
- [x] Plan error handling strategy (timeouts, failures, fallbacks)
- [x] Design varObj structure (what variables are needed?)

### Implementation Phase
- [x] Implement globalCode.js utilities (if project-specific functions needed)
- [x] Implement globalVariables.js initialization (custom varObj setup)
- [x] Implement main call script (core call flow logic)
- [x] Add error handling (try/catch, HTTP error handling)
- [x] Add logging/debugging (logInfo, logWarn, logError)

### Validation Phase
- [x] Validate ES5.1 constraints (`npm run validate -- --callScripts --project example-starter`)
- [x] Test with simulator (`npm run simulate -- --callScript main --project example-starter`)
- [ ] Test error scenarios (API failures, timeouts, invalid inputs)
- [x] Review code (readability, maintainability, patterns)

### Deployment Phase
- [x] Run final validation
- [x] Export for production (`npm run export -- --callScript main --project example-starter`)
- [x] Document deployment (update project_config.md with deployment notes)

## Blueprints (Previous Plans)

> Archive old plans here when they change significantly. Include timestamp and reason for change.

- Example project structure created as template reference

> **Example format**:
> - Original plan: Use database for customer lookup
>   - Changed: 2025-01-15T16:00:00Z
>   - Reason: Database cache too slow, switched to REST API

## Activity Log

> Use ISO 8601 format for timestamps: `2025-01-15T10:30:00Z`

```
[Template] Example project created as reference implementation
```

> **Example format**:
> ```\n> [2025-01-15T10:00:00Z] Project initialized\n> [2025-01-15T10:15:00Z] Defined call flow: greeting → customer lookup → menu routing\n> [2025-01-15T10:30:00Z] Identified Customer API endpoint and auth requirements\n> [2025-01-15T14:30:00Z] Completed customer lookup function implementation\n> ```

## Implementation Rules

1. Always check function availability before using (`if (typeof dbQuery !== 'undefined')`)
2. Use safeGet() for property access (`safeGet(varObj, 'customer.name', 'Unknown')`)
3. Use varObj for call-related variables (ani, dnis, language, customer data)
4. Test scripts with: `npm run simulate -- --callScript main --project example-starter`
5. Validate with: `npm run validate -- --callScripts --project example-starter`
6. Update this file after completing tasks (mark `[x]`, add Activity Log entry)
7. Update project_config.md if architecture changes

## Next Steps

1. Use this project as a reference when creating new projects
2. Extend with additional examples (HTTP calls, database integration)
3. Add more complex call flow patterns
4. Document common patterns and anti-patterns

## Notes

- This is an example/reference project
- Use as a template when creating new projects
- Demonstrates best practices and ES5.1 compliance
- This file is read by AI assistants for context
- Update after major changes or completions
- Archive blueprints with timestamps for reference
- Keep task descriptions specific and actionable
- Always include timestamps in Activity Log (ISO 8601 format)

