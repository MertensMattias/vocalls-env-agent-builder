# ssviwpd - Project Configuration

**AI Assistant Context File** - Long-term memory for development workflow

> **Note**: This file contains stable, long-term project context. For current development state, see `workflow_state.md`.

## Project Overview

- **Project Name**: ssviwpd
- **Customer**: SSVIWPD
- **Description**: Self-service IVR flow for customers requesting a payment delay
- **Created**: 2025-02-09T00:00:00Z
- **Initialized By**: wizard
- **Wizard Version**: 2.0
- **Status**: Initialized

## Project Settings

- **Environment**: acc (acc=acceptance, prd=production, dvp=development)
- **HTTP Mode**: real (real=actual calls, stub=mock responses)
- **Storage Mode**: disk (disk=persistent, memory=transient)
- **Module Name**: ssviwpd-module
- **Database URL**: http://localhost:3001

## Technology Stack

- **Language**: ES5.1 JavaScript (Vocalls compatible)
- **Framework**: Vocalls IVR Platform
- **HTTP**: jsonHttpRequest (Thenable interface)
- **Database**: Optional SQLite via REST API (if service running)
- **Storage**: File-based (disk/memory modes)

## Coding Standards

- Use `var` only (no let/const)
- No arrow functions
- No async/await
- Promises: use `.then(success, failure)` - NO `.catch()`
- No optional chaining `?.` or nullish coalescing `??`
- Always check function availability before using

## Key Decisions

> Document architectural decisions here with timestamps and reasoning.

- **2025-02-09T00:00:00Z**: Project initialized
  - Reason: New IVR project for self-service payment delay requests

## APIs & Services

> Document external APIs, endpoints, authentication, and timeouts here.

## Performance Constraints

- HTTP timeout: 30 seconds (default)
- Script execution: Real-time
- Storage: .storage/ directory
- Maximum call duration: [Add if applicable]

## Project Goals

- [ ] Design call flow for payment delay requests
- [ ] Implement main script
- [ ] Add global libraries
- [ ] Validate against ES5.1
- [ ] Test with simulator
- [ ] Export for production

## Key Files

- `callScript_init/globalCode.js` - Shared utilities (loaded first)
- `callScript_init/globalVariables.js` - Global initialization
- `callScripts/main.js` - Main call flow
- `globalLibraries/active/` - Project-specific libraries
- `workflow_state.md` - Current development state (dynamic)
- `AGENTS.md` (root) - Framework documentation

## Development Rules

1. **Naming**: Use descriptive names (functionName, variableName, CONSTANT_NAME)
2. **Comments**: Document complex logic and business rules
3. **Error Handling**: Always validate data and handle errors gracefully
4. **Logging**: Use logInfo, logWarn, logError for debugging
5. **Validation**: Run validation before deployment

## Links & References

- [Vocalls Documentation](https://vocalls.com/docs)
- [ES5.1 Reference](https://www.ecma-international.org/ecma-262/5.1/)
- [Agent Memory Guide](../AGENT_MEMORY_GUIDE.md) - How to use this file effectively
- [Project Folder](./)
