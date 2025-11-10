#!/usr/bin/env node

/**
 * Color Migration Script
 * 
 * Automatically replaces hardcoded color values with theme references
 * across the entire codebase.
 * 
 * Usage:
 *   node scripts/migrate-colors.js [--dry-run] [--path=<directory>]
 * 
 * Options:
 *   --dry-run    Show what would be changed without modifying files
 *   --path       Specific directory to migrate (default: apps/)
 */

const fs = require('fs');
const path = require('path');

// Color mapping: hex -> theme reference
const COLOR_MAPPINGS = {
  // Primary colors
  '#7E3AF2': 'Colors.primary',
  '#6C2BD9': 'Colors.primaryDark',
  '#F5F3FF': 'Colors.primaryLight',
  
  // Secondary
  '#1E293B': 'Colors.secondary',
  '#334155': 'Colors.secondaryLight',
  '#0F172A': 'Colors.secondaryDark',
  
  // Status colors
  '#10B981': 'Colors.success',
  '#D1FAE5': 'Colors.successLight',
  '#EF4444': 'Colors.error',
  '#FEE2E2': 'Colors.errorLight',
  '#F59E0B': 'Colors.warning',
  '#FEF3C7': 'Colors.warningLight',
  '#3B82F6': 'Colors.info',
  '#DBEAFE': 'Colors.infoLight',
  
  // Purple variants (booking status)
  '#8B5CF6': 'Colors.status.ready',
  '#EDE9FE': 'getStatusBackground("ready")',
  
  // Orange
  '#F97316': 'Colors.status.expired',
  '#FFF7ED': 'getStatusBackground("expired")',
  
  // Text colors
  '#111827': 'Colors.text.primary',
  '#6B7280': 'Colors.text.secondary',
  '#9CA3AF': 'Colors.text.tertiary',
  '#D1D5DB': 'Colors.text.disabled',
  '#FFFFFF': 'Colors.white',
  '#000000': 'Colors.black',
  
  // Background colors
  '#F9FAFB': 'Colors.backgroundSecondary',
  '#F3F4F6': 'Colors.backgroundTertiary',
  
  // Border colors
  '#E5E7EB': 'Colors.border.light',
  
  // Gray scale
  '#F3F4F6': 'Colors.gray[100]',
  '#E5E7EB': 'Colors.gray[200]',
  '#D1D5DB': 'Colors.gray[300]',
  '#9CA3AF': 'Colors.gray[400]',
  '#6B7280': 'Colors.gray[500]',
  '#4B5563': 'Colors.gray[600]',
  '#374151': 'Colors.gray[700]',
  '#1F2937': 'Colors.gray[800]',
  
  // Rating color
  '#FCD34D': 'Colors.rating.filled',
};

// Import statements to add
const IMPORT_STATEMENTS = {
  theme: "import { Colors, theme } from '@mari-gunting/shared/theme';",
  helpers: "import { getStatusColor, getStatusBackground } from '@mari-gunting/shared/theme';",
};

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const pathArg = args.find(arg => arg.startsWith('--path='));
const targetPath = pathArg ? pathArg.split('=')[1] : 'apps';

let filesChanged = 0;
let colorsReplaced = 0;

/**
 * Check if file should be processed
 */
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return ['.tsx', '.ts', '.jsx', '.js'].includes(ext) && 
         !filePath.includes('node_modules') &&
         !filePath.includes('.git') &&
         !filePath.includes('scripts/');
}

/**
 * Check if file already imports from theme
 */
function hasThemeImport(content) {
  return content.includes("from '@mari-gunting/shared/theme'") ||
         content.includes('from "../theme"') ||
         content.includes("from '../theme'");
}

/**
 * Add theme import to file if needed
 */
function addThemeImport(content) {
  if (hasThemeImport(content)) {
    return content;
  }
  
  // Find the last import statement
  const importRegex = /^import .* from ['"][^'"]+['"];?$/gm;
  const imports = content.match(importRegex);
  
  if (!imports) {
    // No imports, add at top
    return IMPORT_STATEMENTS.theme + '\n\n' + content;
  }
  
  const lastImport = imports[imports.length - 1];
  const lastImportIndex = content.lastIndexOf(lastImport);
  const insertIndex = lastImportIndex + lastImport.length;
  
  return content.slice(0, insertIndex) + 
         '\n' + IMPORT_STATEMENTS.theme +
         content.slice(insertIndex);
}

/**
 * Replace hardcoded colors with theme references
 */
function replaceColors(content) {
  let modified = content;
  let replacements = 0;
  
  // Sort by length (longest first) to avoid partial matches
  const sortedColors = Object.entries(COLOR_MAPPINGS)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [hex, themeRef] of sortedColors) {
    // Match hex in various contexts:
    // - color: '#HEX'
    // - backgroundColor: '#HEX'
    // - borderColor: '#HEX'
    // - '#HEX' (in strings)
    const patterns = [
      new RegExp(`(color|backgroundColor|borderColor):\\s*['"]${hex}['"]`, 'gi'),
      new RegExp(`['"]${hex}['"]`, 'g'),
    ];
    
    for (const pattern of patterns) {
      const matches = modified.match(pattern);
      if (matches) {
        modified = modified.replace(pattern, (match) => {
          replacements++;
          if (match.includes(':')) {
            // Property assignment: color: '#HEX' -> color: Colors.primary
            return match.replace(/['"]#[A-F0-9]{6}['"]/i, themeRef);
          } else {
            // String value: '#HEX' -> Colors.primary
            return themeRef;
          }
        });
      }
    }
  }
  
  return { content: modified, replacements };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Replace colors
  const { content: withColors, replacements } = replaceColors(content);
  
  if (replacements === 0) {
    return; // No changes needed
  }
  
  // Add import if needed
  const finalContent = addThemeImport(withColors);
  
  filesChanged++;
  colorsReplaced += replacements;
  
  if (isDryRun) {
    console.log(`[DRY RUN] Would modify: ${filePath}`);
    console.log(`  - ${replacements} color(s) would be replaced`);
  } else {
    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log(`✅ Modified: ${filePath}`);
    console.log(`   Replaced ${replacements} color(s)`);
  }
}

/**
 * Recursively process directory
 */
function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && shouldProcessFile(fullPath)) {
      try {
        processFile(fullPath);
      } catch (error) {
        console.error(`❌ Error processing ${fullPath}:`, error.message);
      }
    }
  }
}

// Main execution
console.log('🎨 Mari Gunting Color Migration Script\n');
console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
console.log(`Target: ${targetPath}\n`);

const fullPath = path.resolve(process.cwd(), targetPath);

if (!fs.existsSync(fullPath)) {
  console.error(`❌ Path not found: ${fullPath}`);
  process.exit(1);
}

console.log('Processing files...\n');
processDirectory(fullPath);

console.log('\n📊 Summary:');
console.log(`   Files modified: ${filesChanged}`);
console.log(`   Colors replaced: ${colorsReplaced}`);

if (isDryRun) {
  console.log('\n💡 This was a dry run. Run without --dry-run to apply changes.');
} else {
  console.log('\n✅ Migration complete!');
  console.log('\n⚠️  Important: Review the changes and test your app!');
}
