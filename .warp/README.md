# Warp AI Rules Configuration

> **Purpose**: Define how AI assistants should work with this project
> **Last Updated**: 2025-10-07

---

## 📋 Rule Files in This Directory

### 1. **`rules/production-frontend-first.json`** (Existing)
**Purpose**: HOW to write code
**Scope**: General development standards
**Contains**:
- Production-grade code quality standards
- Frontend-first development workflow
- UI/UX consistency requirements
- Component architecture patterns
- Security, testing, documentation standards
- Senior developer best practices (10+ years experience level)

**This file defines**: Your coding philosophy and quality standards

---

### 2. **`rules/project-context.yaml`** (New - MCP Context)
**Purpose**: WHAT you're building
**Scope**: Project-specific context
**Contains**:
- Mari Gunting project overview
- Monorepo structure (Customer & Provider apps)
- Current progress (Customer 100%, Provider 50%)
- File locations and key paths
- Common commands and workflows
- Test credentials and quick facts

**This file defines**: Project knowledge and context

---

## 🔄 How They Work Together

Think of it like this:

```
┌─────────────────────────────────────────────────┐
│     production-frontend-first.json              │
│     "HOW to build it"                           │
│     - Code quality standards                    │
│     - Development methodology                   │
│     - Best practices & patterns                 │
└─────────────────────────────────────────────────┘
                     +
┌─────────────────────────────────────────────────┐
│     project-context.yaml                        │
│     "WHAT you're building"                      │
│     - Project structure                         │
│     - Current status                            │
│     - File locations                            │
└─────────────────────────────────────────────────┘
                     =
┌─────────────────────────────────────────────────┐
│     Complete AI Assistant                       │
│     - Knows your quality standards              │
│     - Knows your project structure              │
│     - Provides production-grade suggestions     │
│     - Maintains project context                 │
└─────────────────────────────────────────────────┘
```

---

## 💡 Example Usage

### Scenario 1: Adding a New Feature
**AI uses both rules**:

From `production-frontend-first.json`:
- ✅ Frontend-first approach (UI before backend)
- ✅ Production-grade code quality
- ✅ Consistent with design system
- ✅ Proper error handling & loading states

From `project-context.yaml`:
- ✅ Knows it's a monorepo (Customer vs Provider app)
- ✅ Places code in correct location
- ✅ Uses existing shared types/services
- ✅ Follows project-specific patterns

**Result**: Production-quality feature in the right place!

---

### Scenario 2: Troubleshooting
**AI uses both rules**:

From `production-frontend-first.json`:
- ✅ Suggests production-grade solutions
- ✅ Maintains code quality standards
- ✅ Considers security & performance

From `project-context.yaml`:
- ✅ Knows common issues for this project
- ✅ References correct file paths
- ✅ Suggests project-specific fixes
- ✅ Uses correct commands for this setup

**Result**: Accurate, context-aware troubleshooting!

---

## 🎯 Key Differences

| Aspect | production-frontend-first.json | project-context.yaml |
|--------|--------------------------------|----------------------|
| **Focus** | Universal standards | Project specifics |
| **Scope** | Any production app | Mari Gunting only |
| **Changes** | Rarely (standards stable) | Frequently (project evolves) |
| **Type** | Prescriptive (must do) | Descriptive (what is) |
| **Examples** | "Use TypeScript strictly" | "Types are in packages/shared/types/" |

---

## 📝 When to Update Each File

### Update `production-frontend-first.json` when:
- ❌ Rarely! (These are your core standards)
- You adopt a new technology stack
- You change development methodology
- You update company/team standards

### Update `project-context.yaml` when:
- ✅ Frequently! (As project evolves)
- Complete a major feature
- Project structure changes
- Add new apps or packages
- Progress to next phase

---

## 🔧 Maintenance

### Weekly (or after major work):
```bash
# Update project context with latest status
code .warp/rules/project-context.yaml

# Update these sections:
# - current_work (progress updates)
# - metadata.last_updated (current date)
```

### Monthly (or as needed):
```bash
# Review production standards
code .warp/rules/production-frontend-first.json

# Only update if standards change
```

---

## 🚀 MCP Integration

Both rule files are integrated with Model Context Protocol (MCP):

**MCP Config** (`.mcp/config.json`):
- References both rule files automatically
- Loads context from documentation files
- Enables persistent AI memory

**Context Files** (root directory):
- `PROJECT_CONTEXT.md` - Detailed project info
- `DEVELOPMENT_STATUS.md` - Progress tracking
- `ARCHITECTURE_GUIDE.md` - System design
- `COMMON_TASKS.md` - Command reference

**How it works**:
1. Warp AI reads both rule files
2. MCP servers provide file/git access
3. Context files provide detailed documentation
4. AI has complete project understanding!

---

## ✅ Verification

Test if both rules are active:

### Test Production Standards:
```
Ask AI: "What code quality standards should I follow?"
Expected: Mentions production-grade, TypeScript strict, etc.
```

### Test Project Context:
```
Ask AI: "What project am I working on?"
Expected: Mentions Mari Gunting, monorepo, Customer/Provider apps
```

### Test Both Together:
```
Ask AI: "I want to add schedule management to the Provider app"
Expected: 
- Suggests frontend-first approach (production rules)
- Knows to place in apps/partner/ (project context)
- Mentions using shared types (project context)
- Maintains production quality (production rules)
```

---

## 🎉 Benefits

With both rule files active, AI assistants will:

✅ **Write production-grade code** (from production-frontend-first.json)
✅ **Know your project structure** (from project-context.yaml)
✅ **Remember context across sessions** (via MCP)
✅ **Give accurate suggestions** (combined knowledge)
✅ **Maintain quality standards** (enforced by rules)
✅ **Understand your workflow** (frontend-first approach)

---

## 📞 Questions?

### "Should I modify production-frontend-first.json?"
**Usually NO** - These are your core standards. Only change if your methodology changes.

### "Should I modify project-context.yaml?"
**YES, regularly!** - Update as project evolves. Keep it current.

### "Can I add more rule files?"
**Yes!** - Create separate files for:
- Team-specific conventions
- Technology-specific rules
- Domain-specific guidelines

### "How do I disable a rule file?"
Rename it (e.g., `production-frontend-first.json.disabled`) or move it out of the `rules/` directory.

---

**Both rule files working together = Production-quality code with full project context! 🚀**

---

_Last updated: 2025-10-07_
