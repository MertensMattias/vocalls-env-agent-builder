# Vocalls Environment Template

A complete development environment template for building Vocalls IVR call scripts with ES5.1 compliance, multi-project support, and AI agent memory management.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run the example project
npm run simulate -- --callScript main --project example-starter

# Create a new project
npm run init

# Validate your scripts
npm run validate -- --project <project-name> --all

# Export for production
npm run export -- --callScript main --project <project-name>
```

## ✨ Features

- **Smart Project Wizard** - Interactive setup with intelligent defaults
- **Multi-Project Support** - Manage multiple IVR projects in one workspace
- **ES5.1 Validation** - Automatic compliance checking for Vocalls platform
- **Simulation Engine** - Test call scripts locally before deployment
- **AI Agent Memory** - Three-layer memory system for AI-assisted development
- **Production Export** - Bundle scripts for Vocalls platform deployment

## 📁 Project Structure

```text
vocalls-environment-template/
├── core/                           # Framework (simulation engine, loader)
├── cli/                            # CLI tools (simulate, validate, export, switch)
├── vocalls_session_init/           # Session context builder
├── projects/                       # Your IVR projects
│   └── example-starter/           # Example project (reference)
│       ├── callScript_init/       # Initialization scripts
│       ├── callScripts/            # Call flow scripts
│       ├── globalLibraries/active/ # Project-specific libraries
│       ├── project_config.md      # AI context (long-term memory)
│       └── workflow_state.md       # Development progress tracker
├── env.config.json                 # Multi-project configuration
└── package.json
```

## 🛠️ CLI Commands

### Project Management

```bash
# Create a new project (interactive wizard)
npm run init

# List all configured projects
npm run simulate -- --list-projects

# Switch active project
npm run switch -- <project-name>
```

### Development

```bash
# Simulate a call script
npm run simulate -- --callScript main --project <project-name>

# Validate ES5.1 compliance
npm run validate -- --project <project-name> --all

# Export for production
npm run export -- --callScript main --project <project-name>
```

## 🤖 AI Agent Memory System

This template includes a sophisticated memory management system for AI-assisted development:

- **`AGENTS.md`** (root) - Framework rules (rarely changes)
- **`projects/<name>/project_config.md`** - Project memory (stable context)
- **`projects/<name>/workflow_state.md`** - Current state (frequently updated)

See **[AGENT_MEMORY_GUIDE.md](./AGENT_MEMORY_GUIDE.md)** for complete documentation.

## 📚 Documentation

- **[AGENTS.md](./AGENTS.md)** - Framework guide and ES5.1 constraints
- **[AGENT_MEMORY_GUIDE.md](./AGENT_MEMORY_GUIDE.md)** - Complete memory management guide
- **[.cursorrules](./.cursorrules)** - Cursor AI configuration

## 🔧 ES5.1 Constraints

This template enforces strict ES5.1 compliance for Vocalls platform compatibility:

**✅ Allowed:**

- `var` declarations
- Template literals
- Destructuring
- Promises with `.then(success, failure)` (NO `.catch()`)
- Map, Set, WeakMap, WeakSet

**❌ Forbidden:**

- `let`/`const`
- Arrow functions
- `async/await`
- Optional chaining (`?.`)
- Nullish coalescing (`??`)
- ES6 classes
- `for...of` loops
- `import`/`export`/`require`

See [AGENTS.md](./AGENTS.md) for complete constraints and patterns.

## 🎯 Creating Your First Project

### Project Wizard

The interactive wizard (`npm run init`) creates a complete project structure with:

1. **Project Structure** - All necessary directories and files
2. **Environment Registration** - Automatic `env.config.json` configuration
3. **Smart Defaults** - Auto-detects existing projects and suggests settings
4. **AI Memory Files** - Generates `project_config.md` and `workflow_state.md`
5. **Starter Code** - ES5.1-compliant templates with project metadata

### Wizard Flow

1. **Welcome & Context Detection** - Lists existing projects, shows active project, checks database service
2. **Project Identity** - Prompts for name, customer, description (with smart suggestions)
3. **Environment Settings** - Configures environment, HTTP/storage mode, module name, database URL
4. **Review & Confirmation** - Table summary with edit loop
5. **Execution** - Safe directory creation, template generation, `env.config.json` update
6. **Completion** - Next-step commands and tips

Use `?` during prompts for inline help, or hit `Ctrl+C` to abort safely at any time.

### What Gets Created

```text
projects/your-project/
├── callScript_init/
│   ├── globalCode.js              # Shared utilities (loaded first)
│   └── globalVariables.js         # Global initialization
├── callScripts/
│   └── main.js                    # Main call flow
├── globalLibraries/active/        # Optional project libraries
├── exported_callscripts/          # Production exports
├── AGENTS.md                      # Project-specific guidance
├── SETUP.md                       # Getting started guide
├── project_config.md              # AI assistant long-term memory
└── workflow_state.md              # Task tracker & activity log
```

The wizard also updates `env.config.json` with project paths, settings, and metadata.

### Project Naming Guidelines

✅ **Valid examples**: `my-project`, `customer_app`, `ivr-2025`, `test123`  
❌ **Avoid**: uppercase, spaces, dots, or special characters (`MyProject`, `my project`, `my.project`, `my@project`)

### Post-Initialization Steps

1. **Review project metadata:**

   ```bash
   code projects/your-project/project_config.md
   code projects/your-project/workflow_state.md
   ```

2. **Implement call flow logic:**

   ```bash
   code projects/your-project/callScripts/main.js
   ```

3. **Test your script:**

   ```bash
   npm run simulate -- --callScript main --project your-project
   ```

4. **Validate ES5.1 compliance:**

   ```bash
   npm run validate -- --callScripts --project your-project
   ```

5. **Export for production:**

   ```bash
   npm run export -- --callScript main --project your-project
   ```

### Multi-Project Operations

- **List configured projects:**

   ```bash
   npm run simulate -- --list-projects
   npm run switch -- --list
   ```

- **Switch active project:**

   ```bash
   npm run switch -- another-project
   ```

- **Run with project-aware defaults:**

   ```bash
   npm run simulate -- --callScript main --project another-project --mode stub
   ```

## 📖 Example Project

The `example-starter` project demonstrates:

- Basic call script structure
- Logging patterns
- Session variable usage
- ES5.1 compliant code

Run it with:

```bash
npm run simulate -- --callScript main --project example-starter
```

## 🔍 Requirements

- **Node.js**: >= 18.18.0
- **npm**: Latest version

## 💾 Database Service (Optional)

If you plan to use the Vocalls database bridge:

```bash
cd vocalls-database-service
npm install
npm run init-db
npm start
```

Project settings store the database URL so that simulators and exports stay in sync.

## 🐛 Troubleshooting

- **Project already exists** – Wizard offers overwrite; decline to keep existing starter files intact
- **Project missing in env.config.json** – Rerun `npm run init`, or add entry manually
- **Simulator uses wrong project** – Confirm active project with `npm run simulate -- --list-projects` or pass `--project` explicitly
- **No database detected** – Start the service, then rerun `npm run init` or update `settings.databaseUrl` manually

## 📝 License

See [LICENSE](./LICENSE) file for details.

## 🤝 Contributing

This is a template repository. Fork it and customize for your needs!

## 🔗 Resources

- [Vocalls Documentation](https://vocalls.com/docs)
- [ES5.1 Specification](https://www.ecma-international.org/ecma-262/5.1/)
- [Agent Memory Guide](./AGENT_MEMORY_GUIDE.md)

---

**Ready to build?** Run `npm run init` to create your first project!
