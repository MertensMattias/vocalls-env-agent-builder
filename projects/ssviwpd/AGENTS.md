# ssviwpd - Project Documentation

**Customer**: SSVIWPD
**Created**: 2025-02-09T00:00:00Z
**Initialized By**: wizard
**Wizard Version**: 2.0

## Project Settings

- Environment: acc
- HTTP Mode: real
- Storage Mode: disk
- Module Name: ssviwpd-module
- Database URL: http://localhost:3001

## Project-Specific Rules

- SSVIWPD = Self-service IVR: I want a payment delay
- Use the generated utilities in `callScript_init/globalCode.js` instead of redefining helpers.

## Custom Libraries

- None active. Add shared helpers to `projects/ssviwpd/globalLibraries/active/` and document them here.

## Business Logic & Call Flow

- `callScripts/main.js` is the entry point for payment delay requests.
- Flow: greeting, identify customer, validate eligibility, process payment delay request.
- Document key nodes, transitions, and intents here as they are implemented.

## External Integrations

- [List APIs, credentials, and integration details when added]

## Testing & Verification

- Run the simulator: `npm run simulate -- --callScript main --project ssviwpd`
- Validate ES5.1 compliance: `npm run validate -- --project ssviwpd --all`
- Export bundle: `npm run export -- --callScript main --project ssviwpd`

---

See root `AGENTS.md` for framework-wide standards and tools.
