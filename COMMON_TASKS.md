# Mari Gunting - Common Tasks & Commands

> **Quick Reference Guide** for frequently used commands and workflows
> **Last Updated**: 2025-10-07

---

## 🚀 Running the Apps

### Customer App
```bash
# Navigate to customer app
cd apps/customer

# Start development server
npm start

# Clear cache and start
npm start -- --clear

# Run on specific platform
npm start -- --ios        # iOS simulator
npm start -- --android    # Android emulator
```

### Partner App
```bash
# Navigate to partner app
cd apps/partner

# Start development server
npm start

# Clear cache and start
npm start -- --clear
```

### Run Both Apps Simultaneously
```bash
# Terminal 1 - Customer App
cd apps/customer && npm start

# Terminal 2 - Partner App
cd apps/partner && npm start
```

### Quick Test Logins
- **Customer App**: `11-111 1111`
- **Partner App**: `22-222 2222`

---

## 📦 Installing Dependencies

### Initial Setup (First Time)
```bash
# From project root
cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting

# Install root dependencies
npm install

# Install Customer app dependencies
cd apps/customer
npm install

# Install Provider app dependencies
cd apps/partner
npm install

# Install Shared package dependencies (if needed)
cd packages/shared
npm install
```

### After Pulling Updates
```bash
# From project root
npm install

# Then update each app
cd apps/customer && npm install
cd ../provider && npm install
```

### Add New Package

**For Customer App Only**:
```bash
cd apps/customer
npm install <package-name>
```

**For Partner App Only**:
```bash
cd apps/partner
npm install <package-name>
```

**For Shared Code** (used by both apps):
```bash
cd packages/shared
npm install <package-name>
```

### Remove Package
```bash
npm uninstall <package-name>
```

---

## 🔧 Development Workflow

### Type Checking
```bash
# Check TypeScript errors (from any app directory)
npx tsc --noEmit

# Watch mode
npx tsc --noEmit --watch
```

### Clear Cache
```bash
# Clear Expo cache
npm start -- --clear

# Or manually
rm -rf .expo
rm -rf node_modules/.cache
```

### Reset Everything
```bash
# From app directory (customer or provider)
rm -rf node_modules
rm -rf .expo
npm install
npm start -- --clear
```

---

## 🐛 Troubleshooting

### "Module not found" Error
```bash
# Clear cache and reinstall
cd apps/customer  # or apps/partner
rm -rf node_modules
npm install
npm start -- --clear
```

### App Won't Start / Metro Bundler Issues
```bash
# Kill all node processes
killall -9 node

# Clear watchman (if installed)
watchman watch-del-all

# Start fresh
npm start -- --clear
```

### Expo Go Connection Issues
```bash
# Restart with tunnel mode
npm start -- --tunnel

# Or use LAN mode
npm start -- --lan
```

### iOS Simulator Won't Open
```bash
# Check Xcode command line tools
xcode-select --install

# Reset simulator
xcrun simctl erase all

# Open simulator manually first
open -a Simulator
```

### Android Emulator Issues
```bash
# List available emulators
emulator -list-avds

# Start specific emulator
emulator -avd <emulator-name>

# Or open from Android Studio
# Tools > AVD Manager > Play button
```

### TypeScript Errors Not Updating
```bash
# Restart TypeScript server in VS Code
# CMD+Shift+P > "TypeScript: Restart TS Server"

# Or restart Metro bundler
# Press 'r' in terminal where npm start is running
```

---

## 📁 File & Folder Operations

### Create New Screen (Customer App)
```bash
# Navigate to customer app screens directory
cd apps/customer/app

# Create new file (example: settings.tsx)
touch settings.tsx

# Or with nested route
mkdir -p booking/confirmation
touch booking/confirmation.tsx
```

### Create New Screen (Partner App)
```bash
cd apps/partner/app
touch new-screen.tsx
```

### Create Shared Component
```bash
cd packages/shared/components
touch NewComponent.tsx
```

### Create New Type
```bash
# Edit the shared types file
code packages/shared/types/index.ts

# Or create new type file
touch packages/shared/types/newTypes.ts
```

---

## 🗂️ Project Navigation

### Quick Directory Access
```bash
# Project root
cd ~/Desktop/ProjectSideIncome/mari-gunting

# Customer app
cd ~/Desktop/ProjectSideIncome/mari-gunting/apps/customer

# Provider app
cd ~/Desktop/ProjectSideIncome/mari-gunting/apps/partner

# Shared code
cd ~/Desktop/ProjectSideIncome/mari-gunting/packages/shared

# Documentation
cd ~/Desktop/ProjectSideIncome/mari-gunting/docs
```

### View Project Structure
```bash
# From root directory
tree -L 3 -I 'node_modules|.expo|.git'

# Or using ls
ls -la
```

### Find Files
```bash
# Find all TypeScript files
find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules

# Find specific file
find . -name "mockData.ts"

# Search in files
grep -r "SearchTerm" apps/customer/app --include="*.tsx"
```

---

## 📝 Editing & Code Management

### Open in VS Code
```bash
# Open entire project
code ~/Desktop/ProjectSideIncome/mari-gunting

# Open specific app
code ~/Desktop/ProjectSideIncome/mari-gunting/apps/customer

# Open specific file
code packages/shared/types/index.ts
```

### Git Operations
```bash
# Check status
git status

# View changes
git diff

# Stage changes
git add .

# Commit
git commit -m "Your message"

# Push to remote
git push

# Pull latest
git pull

# Create new branch
git checkout -b feature/new-feature

# View branches
git branch -a

# Switch branch
git checkout main
```

---

## 🔍 Inspecting Code & Data

### View Mock Data
```bash
# Open mock data file
code packages/shared/services/mockData.ts

# Or just view in terminal
cat packages/shared/services/mockData.ts
```

### View Types
```bash
code packages/shared/types/index.ts
```

### View API Service Layer
```bash
code packages/shared/services/api.ts
```

### Check Package Dependencies
```bash
# Root dependencies
cat package.json

# Customer app dependencies
cat apps/customer/package.json

# Provider app dependencies
cat apps/partner/package.json
```

---

## 📊 Project Statistics

### Count Lines of Code
```bash
# From project root
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs wc -l

# Count files
find . -name "*.tsx" | grep -v node_modules | wc -l
```

### List All Screens
```bash
# Customer screens
find apps/customer/app -name "*.tsx" | sort

# Partner screens
find apps/partner/app -name "*.tsx" | sort
```

### List Components
```bash
# Customer components
ls -la apps/customer/components/

# Provider components
ls -la apps/partner/components/

# Shared components
ls -la packages/shared/components/
```

---

## 🧪 Testing & Quality

### Run Tests (when set up)
```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run specific test file
npm test -- MyComponent.test.tsx
```

### Check for Issues
```bash
# TypeScript check
npx tsc --noEmit

# Lint (if configured)
npm run lint

# Format (if Prettier is set up)
npx prettier --check "**/*.{ts,tsx}"
```

---

## 🔄 Update & Maintenance

### Update Expo SDK
```bash
# From app directory
npx expo upgrade

# Or manually update package.json and run
npm install
```

### Update All Dependencies
```bash
# Check for outdated packages
npm outdated

# Update package
npm update <package-name>

# Or update all (careful!)
npm update
```

### Clean & Rebuild
```bash
# Remove all node_modules
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules

# Reinstall everything
npm install
cd apps/customer && npm install
cd ../provider && npm install
```

---

## 📱 Build & Deploy (Future)

### Build for Production
```bash
# Install EAS CLI (one-time)
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build for both
eas build --platform all
```

### Submit to App Stores
```bash
# Submit to Apple App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

---

## 💡 Useful Aliases (Optional)

Add these to your `~/.zshrc` or `~/.bashrc`:

```bash
# Navigate to project
alias mg="cd ~/Desktop/ProjectSideIncome/mari-gunting"

# Customer app
alias mgc="cd ~/Desktop/ProjectSideIncome/mari-gunting/apps/customer && npm start"

# Provider app
alias mgp="cd ~/Desktop/ProjectSideIncome/mari-gunting/apps/partner && npm start"

# Open in VS Code
alias mgcode="code ~/Desktop/ProjectSideIncome/mari-gunting"

# Clear and start
alias mgclear="npm start -- --clear"
```

After adding, run:
```bash
source ~/.zshrc  # or source ~/.bashrc
```

---

## 🆘 Emergency Commands

### Kill Everything
```bash
# Kill all node processes
killall -9 node

# Kill Metro bundler specifically
lsof -ti:8081 | xargs kill -9

# Kill Expo processes
ps aux | grep expo | awk '{print $2}' | xargs kill -9
```

### Complete Reset
```bash
# From project root
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
rm -rf .expo
rm -rf apps/*/.expo
rm -rf apps/*/ios/build
rm -rf apps/*/android/build

# Reinstall
npm install
cd apps/customer && npm install && cd ../..
cd apps/partner && npm install && cd ../..

# Start fresh
cd apps/customer && npm start -- --clear
```

---

## 📚 Documentation Access

### View Documentation
```bash
# Main README
cat README.md

# Quick start
cat START_HERE.md

# Project summary
cat PROJECT_SUMMARY.md

# Structure guide
cat STRUCTURE.md

# This file
cat COMMON_TASKS.md

# Development status
cat DEVELOPMENT_STATUS.md

# List all docs
ls -la docs/
```

---

## 🎯 Context for AI Assistants

### Quick Facts When Context is Lost
- **Project Location**: `/Users/bos/Desktop/ProjectSideIncome/mari-gunting`
- **Customer App**: `apps/customer/` (100% complete)
- **Partner App**: `apps/partner/` (50% complete)
- **Shared Code**: `packages/shared/`
- **Mock Data**: `packages/shared/services/mockData.ts`
- **Types**: `packages/shared/types/index.ts`
- **Test Logins**: Customer `11-111 1111`, Provider `22-222 2222`

### Most Common User Requests
1. "Run the app" → `cd apps/customer && npm start` (or provider)
2. "App won't start" → `npm start -- --clear`
3. "Add feature" → Determine app, navigate, edit files
4. "Module error" → Clear cache, reinstall node_modules
5. "Where is X?" → Check this file for paths

---

**This file should be your go-to reference for daily development tasks. Bookmark it!**
