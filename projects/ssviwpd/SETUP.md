# ssviwpd - Setup & Getting Started

## Project Initialized

Project structure created at:

`projects/ssviwpd/`

## Project Settings Snapshot

- Environment: acc
- HTTP Mode: real
- Storage Mode: disk
- Module Name: ssviwpd-module
- Database URL: http://localhost:3001

## What's Next?

### 1. Update Project Configuration

Edit `project_config.md` with your:
- **APIs & Services**: Endpoints, authentication, timeouts
- **Key Decisions**: Document architectural choices with timestamps
- **Performance constraints**: Timeouts, call duration limits

### 2. Update Workflow State

Edit `workflow_state.md` to track:
- Current development phase
- Active tasks (use specific, actionable descriptions)
- Activity log (with ISO 8601 timestamps)
- Next steps

### 3. Design Your Call Flow

Edit `callScripts/main.js` to implement your payment delay logic:

```javascript
logInfo('Call received from:', varObj.ani);
// Add your call flow logic here
```

### 4. Add Utilities (if needed)

Add project-specific functions to:
- `globalLibraries/active/yourLibrary.js`

### 5. Test Your Script

```bash
npm run simulate -- --callScript main --project ssviwpd
```

### 6. Validate ES5.1 Constraints

```bash
npm run validate -- --callScripts --project ssviwpd
```

### 7. Export for Production

```bash
npm run export -- --callScript main --project ssviwpd
```

## Project Structure

projects/ssviwpd/
├── callScript_init/
│   ├── globalCode.js         # Shared utilities (loaded first)
│   └── globalVariables.js    # Global initialization
├── callScripts/
│   └── main.js               # Main call flow
├── globalLibraries/
│   └── active/               # Project-specific libraries
├── exported_callscripts/    # Production exports
├── project_config.md        # AI context (long-term memory)
├── workflow_state.md
├── AGENTS.md
└── SETUP.md                 # This file

## Key Concepts

### varObj - Call Variables

Use this for call-related data:

```javascript
varObj.ani = context.callInfo.fromUri;      // Caller number
varObj.dnis = context.callInfo.toUri;       // Dialed number
varObj.language = context.language;         // Call language
varObj.customer = { id: "123", name: "John" };  // Customer data
```

### context - Vocalls Context

Access call information:

```javascript
context.callInfo.callGuid                    // Unique call ID
context.callInfo.fromUri                     // Caller
context.callInfo.toUri                       // Dialed number
context.callInfo.direction                   // "inbound" or "outbound"
context.session.variables                    // Persistent variables
context.language                             // Call language
```

### Available Global Functions

- `logInfo()`, `logWarn()`, `logError()`, `logDebug()` - Logging
- `nowUTC()` - Get current UTC timestamp
- `safeGet(obj, key, default)` - Safe property access
- `getPath(obj, path)` - Nested property access
- `generateId()` - Generate unique ID
- `isEmpty(obj)` - Check if empty
- `isValidObject(obj)` - Validate object

---

**Created**: 2025-02-09T00:00:00Z
**Project**: ssviwpd
**Framework**: Vocalls Development Template
