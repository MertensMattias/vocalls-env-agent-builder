# example-starter - Project Configuration

**AI Assistant Context File** - Long-term memory for development workflow

> **Note**: This file contains stable, long-term project context. For current development state, see `workflow_state.md`.

## Project Overview

- **Project Name**: example-starter
- **Customer**: Example Starter
- **Description**: Reference implementation demonstrating Vocalls IVR call script structure, patterns, and best practices
- **Created**: Template
- **Initialized By**: template
- **Wizard Version**: 2.0
- **Status**: Example/Reference

## Project Settings

- **Environment**: acc (acc=acceptance, prd=production, dvp=development)
- **HTTP Mode**: real (real=actual calls, stub=mock responses)
- **Storage Mode**: disk (disk=persistent, memory=transient)
- **Module Name**: example-starter-module
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

- **Template**: Example project created as reference implementation
  - Reason: Demonstrates proper structure, patterns, and ES5.1 compliance

> **Example format**:
> - **2025-01-15T10:00:00Z**: Use REST API for customer lookup
>   - Reason: Real-time data required, database has 5-minute cache delay

## APIs & Services

> Document external APIs, endpoints, authentication, and timeouts here.

> **Example format**:
> - **Customer API**: https://api.example.com/customers/{id}
>   - Auth: Bearer token in Authorization header
>   - Timeout: 30 seconds
>   - Returns: Customer object with account details

## Performance Constraints

- HTTP timeout: 30 seconds (default)
- Script execution: Real-time
- Storage: .storage/ directory
- Maximum call duration: [Add if applicable]

## Project Goals

- [x] Demonstrate basic call script structure
- [x] Show ES5.1 compliant patterns
- [x] Provide reference implementation
- [ ] Add more advanced examples (HTTP calls, error handling)
- [ ] Add database integration example

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

