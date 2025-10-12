#!/bin/bash

# Mari-Gunting Environment Setup Script
# This script helps initialize environment files from the example

set -e

echo "🚀 Mari-Gunting Environment Setup"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Check if .env.example exists
if [ ! -f "$ROOT_DIR/.env.example" ]; then
  echo -e "${RED}❌ Error: .env.example not found${NC}"
  exit 1
fi

echo "📋 This script will create .env files for:"
echo "  - Customer App (apps/customer/.env)"
echo "  - Partner App (apps/partner/.env)"
echo ""
echo -e "${YELLOW}⚠️  Warning: This will overwrite existing .env files!${NC}"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

# Create customer .env
echo ""
echo "Creating apps/customer/.env..."
cp "$ROOT_DIR/.env.example" "$ROOT_DIR/apps/customer/.env"
echo -e "${GREEN}✅ Created apps/customer/.env${NC}"

# Create partner .env
echo "Creating apps/partner/.env..."
cp "$ROOT_DIR/.env.example" "$ROOT_DIR/apps/partner/.env"
echo -e "${GREEN}✅ Created apps/partner/.env${NC}"

echo ""
echo "🎉 Environment files created successfully!"
echo ""
echo "📝 Next steps:"
echo "  1. Edit apps/customer/.env with your Supabase credentials"
echo "  2. Edit apps/partner/.env with your Supabase credentials"
echo "  3. Add API keys for services you want to use (Mapbox, Cloudinary, etc.)"
echo ""
echo "📖 For detailed instructions, see: docs/ENVIRONMENT_SETUP.md"
echo ""
echo "🔐 Security reminders:"
echo "  • Never commit .env files to git"
echo "  • Use different keys for dev/staging/production"
echo "  • Keep service role keys secret (never expose to client)"
echo ""
