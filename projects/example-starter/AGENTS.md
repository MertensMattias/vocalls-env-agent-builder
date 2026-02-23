# example-starter – Project Documentation

**Customer**: Example Starter  
**Created**: Template  
**Initialized By**: template  
**Wizard Version**: 2.0

## Project Settings

- Environment: acc
- HTTP Mode: real
- Storage Mode: disk
- Module Name: example-starter-module
- Database URL: http://localhost:3001

## Project-Specific Rules

- Keep scripts lightweight and easy to understand—this project serves as the baseline example.
- Use the generated utilities in `callScript_init/globalCode.js` instead of redefining helpers.

## Custom Libraries

- None active. Add shared helpers to `projects/example-starter/globalLibraries/active/` and document them here.

## Business Logic & Call Flow

- `callScripts/main.js` logs inbound call metadata and stores the execution timestamp in `context.session.variables`.
- Expand by adding prompts, branching, or HTTP integrations as needed.

## External Integrations

- None. When adding integrations, list API endpoints, credentials, and retry policies in this section.

## Testing & Verification

- Run the simulator: `npm run simulate -- --callScript main --project example-starter`
- Validate ES5.1 compliance: `npm run validate -- --project example-starter --all`
- Export bundle: `npm run export -- --callScript main --project example-starter`

---

See root `AGENTS.md` for framework-wide standards, CLI usage, and ES5.1 constraints.

