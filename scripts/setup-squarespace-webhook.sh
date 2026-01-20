#!/bin/bash

# Squarespace Webhook Setup Script
# This script helps you set up the Squarespace webhook subscription

set -e

echo "🚀 Squarespace Webhook Setup"
echo "=============================="
echo ""

# Check if API key is set
SQUARESPACE_API_KEY="7a51a456-4ac3-40c7-80a9-380968b1e4ea"

if [ -z "$SQUARESPACE_API_KEY" ]; then
  echo "❌ Error: SQUARESPACE_API_KEY not found"
  echo "Please set it in this script or as an environment variable"
  exit 1
fi

echo "✅ API Key found: ${SQUARESPACE_API_KEY:0:8}..."
echo ""

# Webhook endpoint URL
WEBHOOK_URL="https://rmrcms.vercel.app/api/squarespace/webhook"

echo "📍 Webhook URL: $WEBHOOK_URL"
echo ""

# Step 1: List existing webhook subscriptions
echo "📋 Step 1: Checking existing webhook subscriptions..."
echo ""

EXISTING_WEBHOOKS=$(curl -s -X GET https://api.squarespace.com/1.0/webhook_subscriptions \
  -H "Authorization: $SQUARESPACE_API_KEY" \
  -H "User-Agent: RMR-CMS/1.0")

echo "$EXISTING_WEBHOOKS" | jq '.' 2>/dev/null || echo "$EXISTING_WEBHOOKS"
echo ""

# Ask if user wants to create a new webhook
echo "❓ Do you want to create a new webhook subscription? (y/n)"
read -r CREATE_WEBHOOK

if [ "$CREATE_WEBHOOK" != "y" ]; then
  echo "ℹ️  Skipping webhook creation"
  exit 0
fi

# Step 2: Create webhook subscription
echo ""
echo "🔗 Step 2: Creating webhook subscription..."
echo ""

RESPONSE=$(curl -s -X POST https://api.squarespace.com/1.0/webhook_subscriptions \
  -H "Authorization: $SQUARESPACE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "User-Agent: RMR-CMS/1.0" \
  -d "{
    \"endpointUrl\": \"$WEBHOOK_URL\",
    \"topics\": [\"order.create\"]
  }")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract secret from response
SECRET=$(echo "$RESPONSE" | jq -r '.secret' 2>/dev/null)

if [ "$SECRET" != "null" ] && [ -n "$SECRET" ]; then
  echo "✅ Webhook subscription created successfully!"
  echo ""
  echo "🔑 IMPORTANT: Save this webhook secret!"
  echo "======================================"
  echo ""
  echo "SQUARESPACE_WEBHOOK_SECRET=$SECRET"
  echo ""
  echo "📝 Next steps:"
  echo "1. Add the above line to your .env.local file"
  echo "2. Add SQUARESPACE_WEBHOOK_SECRET to Vercel environment variables"
  echo "3. Redeploy your app (or wait for auto-deploy)"
  echo "4. Test with a real order or use the test script"
  echo ""
else
  echo "❌ Failed to create webhook subscription"
  echo "Response: $RESPONSE"
  exit 1
fi

