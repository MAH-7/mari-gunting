#!/bin/bash

# Setup Mapbox credentials for native builds
# This script configures the .netrc file required for downloading Mapbox native SDKs

echo "🗺️  Mapbox Native SDK Setup"
echo "=========================="
echo ""
echo "This script will configure your Mapbox credentials for building the app."
echo ""
echo "You need a Mapbox SECRET token with DOWNLOADS:READ scope."
echo "Get it from: https://account.mapbox.com/access-tokens/"
echo ""

# Prompt for the secret token
read -sp "Enter your Mapbox secret token (starts with sk.): " MAPBOX_SECRET_TOKEN
echo ""

# Validate token format
if [[ ! $MAPBOX_SECRET_TOKEN =~ ^sk\. ]]; then
    echo "❌ Error: Token must start with 'sk.' (secret token)"
    echo "Make sure you:"
    echo "  1. Created a token with DOWNLOADS:READ scope"
    echo "  2. Copied the secret token (not the public one)"
    exit 1
fi

# Create or update .netrc file
NETRC_FILE="$HOME/.netrc"

# Remove existing Mapbox entry if present
if [ -f "$NETRC_FILE" ]; then
    # Create backup
    cp "$NETRC_FILE" "$NETRC_FILE.backup"
    # Remove existing Mapbox entries
    sed -i '' '/machine api.mapbox.com/,/password .*/d' "$NETRC_FILE"
fi

# Add new Mapbox credentials
cat >> "$NETRC_FILE" << EOF
machine api.mapbox.com
login mapbox
password $MAPBOX_SECRET_TOKEN
EOF

# Set proper permissions
chmod 600 "$NETRC_FILE"

echo ""
echo "✅ Mapbox credentials configured successfully!"
echo ""
echo "Your .netrc file has been updated at: $NETRC_FILE"
echo ""
echo "Next steps:"
echo "  1. Run: cd $(dirname $(dirname $0))/apps/customer"
echo "  2. Run: npx expo prebuild --clean"
echo "  3. Run: npx expo run:ios"
echo ""
