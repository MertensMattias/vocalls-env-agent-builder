# Agent Memory & Change Management Guide

**Best practices for maintaining project context and tracking changes with AI agents**

## 📋 Overview

This guide explains how to properly structure project memory and track changes when working with AI coding assistants. It builds on the existing patterns in this template and provides a systematic approach to maintaining context across sessions.

## 🏗️ Memory Architecture

### Three-Layer Memory System

```
┌─────────────────────────────────────────┐
│  Layer 1: Framework Rules (AGENTS.md)  │  ← Global, rarely changes
├─────────────────────────────────────────┤
│  Layer 2: Project Memory                │  ← Project-specific, stable
│  - project_config.md                    │
│  - SETUP.md                             │
├─────────────────────────────────────────┤
│  Layer 3: Workflow State                │  ← Dynamic, changes frequently
│  - workflow_state.md                    │
│  - CHANGELOG.md (optional)              │
└─────────────────────────────────────────┘
```

## 📁 File Structure & Purpose

### 1. Framework Level: `AGENTS.md` (Root)

**Purpose**: Global framework rules and conventions  
**Update Frequency**: Rarely (only when framework changes)  
**Location**: Project root

**Contains**:
- Framework architecture
- ES5.1 constraints
- Global API documentation
- CLI command reference
- Common patterns and anti-patterns

**When to Update**:
- Framework features added/removed
- New global conventions established
- Breaking changes to core APIs

---

### 2. Project Level: `project_config.md`

**Purpose**: Long-term project memory and stable context  
**Update Frequency**: When requirements or architecture change  
**Location**: `projects/<project-name>/project_config.md`

**Contains**:
- Project overview and goals
- Technology stack
- Coding standards (project-specific)
- Key architectural decisions
- API/service configurations
- Performance constraints
- Links and references

**When to Update**:
- New requirements added
- Architecture decisions made
- API endpoints change
- Performance constraints identified
- Major refactoring decisions

**Example Structure**:
```markdown
# Project Configuration

## Project Overview
- **Name**: engie_energyline
- **Description**: IVR call flow for energy line support
- **Status**: Active Development

## Key Decisions
- Use REST API for customer lookup
- Store session data in context.session.variables
- Timeout: 30 seconds for HTTP calls

## APIs & Services
- Customer API: https://api.example.com/customers
- Auth: Bearer token in headers
```

---

### 3. Workflow Level: `workflow_state.md`

**Purpose**: Current development state and active tasks  
**Update Frequency**: After each significant change or task completion  
**Location**: `projects/<project-name>/workflow_state.md`

**Contains**:
- Current development phase
- Active tasks (checkboxes)
- Recent activity log
- Next steps
- Implementation notes
- Blueprints/previous plans (archived)

**When to Update**:
- Starting a new task
- Completing a task
- Changing development phase
- Encountering blockers
- Making architectural decisions

**Example Structure**:
```markdown
# Workflow State

## Current Phase
**Phase**: Implementation
**Started**: 2025-01-15T10:00:00Z

## Active Tasks
- [x] Implement customer lookup
- [ ] Add error handling
- [ ] Write tests

## Activity Log
[2025-01-15T10:30:00Z] Added customer lookup function
[2025-01-15T11:00:00Z] Fixed timeout handling
```

---

### 4. Optional: `CHANGELOG.md`

**Purpose**: Detailed change history for version tracking  
**Update Frequency**: After each significant change  
**Location**: `projects/<project-name>/CHANGELOG.md`

**Contains**:
- Versioned change log
- Breaking changes
- New features
- Bug fixes
- Migration notes

**Format**:
```markdown
# Changelog

## [1.2.0] - 2025-01-15
### Added
- Customer lookup API integration
- Error handling for timeouts

### Changed
- Refactored main.js for better readability

### Fixed
- Memory leak in session variables
```

---

## 🔄 Change Tracking Workflow

### When Starting a New Task

1. **Read Context Files**:
   ```bash
   # Agent should read:
   - AGENTS.md (framework rules)
   - projects/<name>/project_config.md (project context)
   - projects/<name>/workflow_state.md (current state)
   ```

2. **Update workflow_state.md**:
   - Mark new task as `[ ]` (in progress)
   - Add entry to Activity Log
   - Update "Current Phase" if needed

3. **Make Changes**:
   - Follow patterns from `project_config.md`
   - Adhere to constraints from `AGENTS.md`
   - Update code files

4. **After Completion**:
   - Mark task as `[x]` (completed)
   - Add completion entry to Activity Log
   - Update `CHANGELOG.md` if significant change
   - Update `project_config.md` if architecture changed

---

## 📝 Best Practices

### 1. Keep Memory Files Focused

**✅ DO**:
- Keep `project_config.md` focused on stable, long-term context
- Keep `workflow_state.md` focused on current, dynamic state
- Use clear sections with consistent formatting

**❌ DON'T**:
- Mix long-term and short-term information
- Include implementation details in `project_config.md`
- Store code snippets in memory files (use code comments)

### 2. Update Frequency Guidelines

| File | Update Frequency | Trigger |
|------|------------------|---------|
| `AGENTS.md` | Rarely | Framework changes |
| `project_config.md` | Occasionally | Requirements/architecture changes |
| `workflow_state.md` | Frequently | Task start/completion |
| `CHANGELOG.md` | Per change | Significant changes |

### 3. Timestamp Everything

Always include timestamps in:
- Activity logs
- Phase changes
- Blueprint archives
- Decision records

**Format**: ISO 8601 (`2025-01-15T10:30:00Z`)

### 4. Archive Old Plans

When plans change significantly:
1. Move old plan to "Blueprints" section
2. Add timestamp
3. Add brief note on why it changed
4. Keep new plan in main section

### 5. Use Clear Task Lists

**✅ Good**:
```markdown
- [x] Implement customer lookup API
- [ ] Add error handling for API failures
- [ ] Write unit tests for lookup function
```

**❌ Bad**:
```markdown
- [x] Did some stuff
- [ ] More work needed
```

### 6. Document Decisions

When making architectural decisions:
1. Add to `project_config.md` under "Key Decisions"
2. Include reasoning
3. Add timestamp
4. Reference related code if applicable

---

## 🤖 Agent Interaction Patterns

### Pattern 1: Starting Fresh Session

**Agent should**:
1. Read `AGENTS.md` for framework rules
2. Read `project_config.md` for project context
3. Read `workflow_state.md` for current state
4. Read relevant code files mentioned in state
5. Proceed with task understanding full context

### Pattern 2: Continuing Work

**Agent should**:
1. Read `workflow_state.md` first (most recent state)
2. Check `project_config.md` for any updates
3. Read changed files since last session
4. Continue from last checkpoint

### Pattern 3: Making Changes

**Agent should**:
1. Update `workflow_state.md` before starting
2. Make code changes
3. Update `workflow_state.md` after completion
4. Update `project_config.md` if architecture changed
5. Update `CHANGELOG.md` if significant change

---

## 📊 Memory File Templates

### Template: `project_config.md`

```markdown
# <Project Name> - Project Configuration

**AI Assistant Context File** - Long-term memory for development workflow

## Project Overview
- **Project Name**: <name>
- **Description**: <description>
- **Created**: <ISO timestamp>
- **Status**: <status>

## Technology Stack
- **Language**: ES5.1 JavaScript (Vocalls compatible)
- **Framework**: Vocalls IVR Platform
- **HTTP**: jsonHttpRequest (Thenable interface)
- **Database**: <optional SQLite via REST API>
- **Storage**: File-based (disk/memory modes)

## Coding Standards
- Use `var` only (no let/const)
- No arrow functions
- No async/await
- Promises: use `.then(success, failure)` - NO `.catch()`
- No optional chaining `?.` or nullish coalescing `??`
- Always check function availability before using

## Project Goals
- [ ] Goal 1
- [ ] Goal 2

## Key Decisions
- **Decision 1**: <reasoning> (Date: <timestamp>)
- **Decision 2**: <reasoning> (Date: <timestamp>)

## APIs & Services
- **Service Name**: <endpoint>
  - Purpose: <description>
  - Auth: <method>
  - Timeout: <seconds>

## Performance Constraints
- HTTP timeout: 30 seconds
- Script execution: Real-time
- Storage: .storage/ directory

## Key Files
- `callScript_init/globalCode.js` - Shared utilities
- `callScript_init/globalVariables.js` - Initialization
- `callScripts/main.js` - Main call flow
- `globalLibraries/active/` - Project-specific libraries
- `workflow_state.md` - Current development state

## Development Rules
1. **Naming**: Use descriptive names
2. **Comments**: Document complex logic
3. **Error Handling**: Always validate data
4. **Logging**: Use logInfo, logWarn, logError
5. **Validation**: Run validation before deployment

## Links & References
- [Vocalls Documentation](https://vocalls.com/docs)
- [ES5.1 Reference](https://www.ecma-international.org/ecma-262/5.1/)
```

### Template: `workflow_state.md`

```markdown
# <Project Name> - Workflow State

**Dynamic Workspace** - Current development progress and task tracking

## Current Phase

**Phase**: <Planning|Implementation|Validation|Deployment>
**Started**: <ISO timestamp>

## Development Tasks

### <Phase Name> Phase
- [ ] Task 1
- [ ] Task 2
- [x] Completed task

### Next Phase
- [ ] Future task 1
- [ ] Future task 2

## Blueprints (Previous Plans)

- <Description> at <timestamp>
  - Reason for change: <explanation>

## Activity Log

```
[<ISO timestamp>] <Action description>
[<ISO timestamp>] <Action description>
```

## Implementation Rules

1. Rule 1
2. Rule 2

## Next Steps

1. Step 1
2. Step 2

## Notes

- Note 1
- Note 2
```

---

## 🔍 Verification Checklist

Before considering a task complete, verify:

- [ ] `workflow_state.md` updated with task completion
- [ ] Activity log entry added with timestamp
- [ ] `project_config.md` updated if architecture changed
- [ ] `CHANGELOG.md` updated if significant change
- [ ] Code follows patterns from `project_config.md`
- [ ] Code adheres to constraints from `AGENTS.md`
- [ ] All related files updated consistently

---

## 🚨 Common Mistakes to Avoid

### ❌ Mistake 1: Not Updating State Files
**Problem**: Agent loses context between sessions  
**Solution**: Always update `workflow_state.md` after changes

### ❌ Mistake 2: Mixing Long-term and Short-term Memory
**Problem**: `project_config.md` becomes cluttered  
**Solution**: Keep stable info in `project_config.md`, dynamic info in `workflow_state.md`

### ❌ Mistake 3: Missing Timestamps
**Problem**: Can't track when changes happened  
**Solution**: Always include ISO timestamps

### ❌ Mistake 4: Vague Task Descriptions
**Problem**: Agent doesn't understand what to do  
**Solution**: Use specific, actionable task descriptions

### ❌ Mistake 5: Not Archiving Old Plans
**Problem**: Lost context on why decisions changed  
**Solution**: Move old plans to "Blueprints" section with reasoning

---

## 📚 Additional Resources

- See `AGENTS.md` for framework-level documentation
- See `README.md` for project initialization guide
- See `SETUP.md` in each project for project-specific setup

---

## 🎯 Quick Reference

| Need to... | Update... |
|------------|-----------|
| Change requirements | `project_config.md` |
| Start new task | `workflow_state.md` |
| Complete task | `workflow_state.md` + `CHANGELOG.md` |
| Make architecture decision | `project_config.md` |
| Track daily progress | `workflow_state.md` |
| Document breaking change | `CHANGELOG.md` + `project_config.md` |
| Change framework rules | `AGENTS.md` |

---

**Last Updated**: 2025-01-15  
**Version**: 1.0.0

