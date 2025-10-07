# Mari Gunting - MCP Setup Guide

> **How to Enable Model Context Protocol (MCP) in Warp**
> **Purpose**: Maintain AI context even when hitting 100% usage
> **Last Updated**: 2025-10-07

---

## 🎯 What is MCP?

**Model Context Protocol (MCP)** is a system that helps AI assistants maintain persistent memory of your project, even across different chat sessions or when context limits are reached.

### Benefits
✅ **Persistent Memory**: AI remembers your project structure  
✅ **Context Recovery**: When hitting 100% context, AI can reload from files  
✅ **Better Assistance**: More accurate suggestions based on project knowledge  
✅ **Faster Development**: Less time explaining the same things

---

## 📋 What We Created

### 1. Context Documentation Files
These files help AI understand your project:

- **`PROJECT_CONTEXT.md`** - Main project overview
- **`DEVELOPMENT_STATUS.md`** - Current progress tracker
- **`ARCHITECTURE_GUIDE.md`** - System design documentation
- **`COMMON_TASKS.md`** - Command reference guide

### 2. MCP Configuration
- **`.mcp/config.json`** - MCP server configuration
- Enables filesystem and git context access

### 3. Warp Rules
- **`.warp/rules/project-context.yaml`** - Warp-specific AI rules
- Helps Warp AI understand your project automatically

---

## 🚀 Step-by-Step Setup

### Step 1: Verify Files Created ✅

All MCP files have been created! Verify they exist:

```bash
# Check context files (root directory)
ls -la PROJECT_CONTEXT.md
ls -la DEVELOPMENT_STATUS.md
ls -la ARCHITECTURE_GUIDE.md
ls -la COMMON_TASKS.md

# Check MCP config
ls -la .mcp/config.json

# Check Warp rules
ls -la .warp/rules/project-context.yaml
```

Expected output: All files should exist with recent timestamps.

---

### Step 2: Enable MCP in Warp

#### Option A: Using Warp Settings (Recommended)

1. **Open Warp Settings**:
   - Press `Cmd + ,` (Command + Comma)
   - Or click Warp menu → Settings

2. **Navigate to AI Settings**:
   - Look for "AI" or "Warp AI" section in sidebar
   - Click on it

3. **Enable MCP**:
   - Find "Model Context Protocol (MCP)" section
   - Toggle switch to **ON**
   - Look for "MCP Servers" or "Context Sources"

4. **Configure MCP Servers**:
   - Click "Add MCP Server" or "Configure"
   - Warp should auto-detect `.mcp/config.json`
   - If not, manually point to: `/Users/bos/Desktop/ProjectSideIncome/mari-gunting/.mcp/config.json`

5. **Enable Context Files**:
   - Look for "Context Files" or "Project Context" section
   - Ensure these files are marked for inclusion:
     - `PROJECT_CONTEXT.md`
     - `DEVELOPMENT_STATUS.md`
     - `ARCHITECTURE_GUIDE.md`
     - `COMMON_TASKS.md`

6. **Save & Restart**:
   - Click "Save" or "Apply"
   - Restart Warp terminal

#### Option B: Using Warp Config File (Advanced)

If Warp doesn't have UI for MCP yet, you might need to edit config:

```bash
# Open Warp config (if it exists)
code ~/.warp/config.yaml

# Or check if there's a config directory
ls -la ~/.warp/
```

Add MCP configuration (adapt based on Warp's actual config format):

```yaml
# Example - actual format may differ
mcp:
  enabled: true
  config_path: /Users/bos/Desktop/ProjectSideIncome/mari-gunting/.mcp/config.json
  auto_load_context: true
```

---

### Step 3: Verify MCP is Working

Test if MCP is active:

1. **Start a New Chat in Warp**:
   - Open Warp AI panel
   - Type: "What project am I working on?"

2. **Expected Response**:
   AI should mention:
   - "Mari Gunting"
   - "Barber marketplace"
   - "Monorepo with Customer and Provider apps"
   - "50% complete"

3. **Test Context Recovery**:
   - Ask: "Where is the mock data located?"
   - AI should respond: `packages/shared/services/mockData.ts`

4. **Test Project Knowledge**:
   - Ask: "What's the next task I need to complete?"
   - AI should respond: "Provider Schedule Management (Week 5)"

---

### Step 4: Install MCP Server Packages (If Needed)

The `.mcp/config.json` uses npm packages. Ensure they're available:

```bash
# These will be installed automatically via npx
# But you can pre-install globally if preferred:

npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-git
```

**Note**: Using `npx` (as configured) will auto-install these on first use.

---

## 🔧 Troubleshooting

### Issue 1: Warp Doesn't Have MCP Settings

**Solution**: MCP support might be in beta or coming soon.

**Workarounds**:
1. **Manual Context Loading**:
   - When starting a new chat, paste this:
   ```
   Please read these context files:
   - PROJECT_CONTEXT.md
   - DEVELOPMENT_STATUS.md
   ```

2. **Use Files as Reference**:
   - Keep context files open in VS Code
   - Refer to them when asking questions

3. **Wait for Warp Update**:
   - MCP is relatively new
   - Check Warp release notes for MCP support

---

### Issue 2: MCP Servers Not Running

**Check if servers are installed**:
```bash
npx @modelcontextprotocol/server-filesystem --version
npx @modelcontextprotocol/server-git --version
```

**If errors occur**:
```bash
# Clear npm cache
npm cache clean --force

# Try installing globally
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-git
```

---

### Issue 3: AI Still Doesn't Remember Context

**Possible causes**:
1. MCP not fully enabled in Warp
2. Context files not loaded
3. MCP servers not running

**Solutions**:
1. **Manually reference files**:
   ```
   "Before answering, please read PROJECT_CONTEXT.md"
   ```

2. **Provide key info upfront**:
   ```
   Context:
   - Project: Mari Gunting (barber marketplace)
   - Location: /Users/bos/Desktop/ProjectSideIncome/mari-gunting
   - Structure: Monorepo (apps/customer, apps/partner, packages/shared)
   - Status: Customer app 100%, Provider app 50%
   
   Question: [your question]
   ```

3. **Check Warp logs**:
   ```bash
   # Warp may have logs showing MCP status
   # Check: ~/.warp/logs/ or similar
   ```

---

### Issue 4: Context Still Reaches 100%

Even with MCP, very long conversations can hit limits.

**Solutions**:
1. **Start Fresh Session**:
   - MCP will reload context automatically
   - Previous knowledge persists via files

2. **Summarize Before Limit**:
   - Ask AI to summarize current work
   - Copy summary to DEVELOPMENT_STATUS.md

3. **Use Focused Questions**:
   - Break large tasks into smaller questions
   - Reference specific files when asking

---

## 💡 How to Use MCP Effectively

### Best Practices

#### 1. Update Context Files Regularly
```bash
# After completing major work, update status:
code DEVELOPMENT_STATUS.md

# Add notes about what you did
# Update progress checkboxes
# Note any blockers or decisions
```

#### 2. Reference Files in Questions
```
"According to DEVELOPMENT_STATUS.md, what's next?"
"Check COMMON_TASKS.md - how do I run the app?"
```

#### 3. Leverage Git Context
```
"What did I change in the last commit?"
"Show me git history for mockData.ts"
```

#### 4. Ask About Project Structure
```
"Where should I add a new shared component?"
"What's the difference between Customer and Provider apps?"
```

---

## 📚 MCP Context Files Explained

### When to Read Each File

**`PROJECT_CONTEXT.md`**:
- First-time setup
- After long break from project
- When unsure about architecture
- To understand overall structure

**`DEVELOPMENT_STATUS.md`**:
- To check current progress
- To see what's next
- To update after completing tasks
- To track timeline and estimates

**`ARCHITECTURE_GUIDE.md`**:
- When adding complex features
- To understand data flow
- When refactoring code
- For system design decisions

**`COMMON_TASKS.md`**:
- Daily development work
- When you forget a command
- For troubleshooting issues
- Quick reference for paths

---

## 🔄 Maintaining MCP Context

### Weekly Maintenance

**Every Friday** (or end of sprint):

1. **Update DEVELOPMENT_STATUS.md**:
   ```bash
   code DEVELOPMENT_STATUS.md
   # Update checkboxes
   # Note completed tasks
   # Update "Recent Changes" section
   ```

2. **Review PROJECT_CONTEXT.md**:
   ```bash
   code PROJECT_CONTEXT.md
   # Update "Last Updated" date
   # Verify information is accurate
   # Add new key insights
   ```

3. **Add New Commands to COMMON_TASKS.md**:
   ```bash
   code COMMON_TASKS.md
   # Add any new useful commands you discovered
   # Update troubleshooting section
   ```

---

## ✅ Success Checklist

Mark these off as you complete setup:

- [ ] All 4 context files exist and are readable
- [ ] `.mcp/config.json` exists with proper paths
- [ ] `.warp/rules/project-context.yaml` exists
- [ ] Warp MCP settings enabled (or workaround in place)
- [ ] Tested AI knowledge: "What project am I working on?"
- [ ] Tested context recovery: "Where is mock data?"
- [ ] Tested file reference: "Check DEVELOPMENT_STATUS.md"
- [ ] MCP server packages installed (or npx working)

---

## 🎉 You're All Set!

Your Mari Gunting project now has:
- ✅ 4 comprehensive context files
- ✅ MCP configuration ready
- ✅ Warp rules configured
- ✅ Persistent AI memory system

### Next Steps

1. **Test MCP**: Ask AI about your project
2. **Start Coding**: Continue Provider Schedule Management (Week 5)
3. **Update Status**: Keep DEVELOPMENT_STATUS.md current
4. **Reference Files**: Use context files when asking questions

---

## 🆘 Still Having Issues?

### If MCP Doesn't Work in Warp Yet

**Alternative Approach** (Manual Context Loading):

1. **At Start of Each Session**:
   ```
   Hi! I'm working on Mari Gunting project. Please read:
   - PROJECT_CONTEXT.md for overview
   - DEVELOPMENT_STATUS.md for current status
   - COMMON_TASKS.md for commands
   
   Current focus: Provider app Schedule Management (Week 5)
   ```

2. **Before Asking Complex Questions**:
   ```
   Context: [paste relevant section from context files]
   Question: [your question]
   ```

3. **Save Important Conversations**:
   - Copy key decisions to DEVELOPMENT_STATUS.md
   - Update context files with new insights

---

## 📞 Additional Resources

### Warp Documentation
- Check Warp's official docs for MCP support status
- Look for "AI Settings" or "Context Protocol" sections
- Join Warp Discord/community for MCP questions

### MCP Resources
- **MCP Spec**: https://modelcontextprotocol.io
- **MCP Servers**: https://github.com/modelcontextprotocol
- **Community**: Look for MCP discussions in AI dev communities

---

**Congratulations! You've set up MCP for your Mari Gunting project. Now AI can remember your project context even at 100% usage! 🎉**

---

**Questions? Check the context files or ask AI: "Help me with MCP setup"**
