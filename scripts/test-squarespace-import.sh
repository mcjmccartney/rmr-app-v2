#!/bin/bash

# Test Squarespace Historical Import
# This script helps you test and run the historical order import

set -e

echo "📚 Squarespace Historical Import"
echo "================================="
echo ""

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check required variables
if [ -z "$WEBHOOK_API_KEY" ]; then
  echo "❌ Error: WEBHOOK_API_KEY not found in .env.local"
  exit 1
fi

if [ -z "$SQUARESPACE_API_KEY" ]; then
  echo "❌ Error: SQUARESPACE_API_KEY not found in .env.local"
  exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Base URL - default to Vercel production
BASE_URL="${1:-https://rmrcms.vercel.app}"
echo "🌐 Using base URL: $BASE_URL"
echo ""

# Menu
echo "What would you like to do?"
echo ""
echo "1. Dry run (preview only - no changes)"
echo "2. Import first 50 orders (test)"
echo "3. Import ALL historical orders"
echo "4. Check endpoint status"
echo ""
echo -n "Enter choice (1-4): "
read -r CHOICE

case $CHOICE in
  1)
    echo ""
    echo "🔍 Running dry run preview..."
    echo ""

    # Save response to temp file
    RESPONSE=$(mktemp)
    HTTP_CODE=$(curl -w "%{http_code}" -o "$RESPONSE" -X POST "$BASE_URL/api/squarespace/import-historical?dryRun=true" \
      -H "x-api-key: $WEBHOOK_API_KEY" \
      -H "Content-Type: application/json")

    echo "📊 HTTP Status: $HTTP_CODE"
    echo ""

    # Try to parse as JSON, otherwise show raw
    if jq empty "$RESPONSE" 2>/dev/null; then
      jq '.' "$RESPONSE"
    else
      echo "Raw response:"
      cat "$RESPONSE"
    fi

    rm "$RESPONSE"
    ;;
  
  2)
    echo ""
    echo "⚠️  This will import the first 50 orders and create clients/memberships"
    echo -n "Are you sure? (y/n): "
    read -r CONFIRM
    if [ "$CONFIRM" = "y" ]; then
      echo ""
      echo "📥 Importing first 50 orders..."
      echo ""
      curl -X POST "$BASE_URL/api/squarespace/import-historical?limit=50" \
        -H "x-api-key: $WEBHOOK_API_KEY" \
        -H "Content-Type: application/json" \
        | jq '.'
    else
      echo "Cancelled"
    fi
    ;;
  
  3)
    echo ""
    echo "⚠️  WARNING: This will import ALL historical orders!"
    echo "This may take several minutes and create many records."
    echo ""
    echo -n "Are you ABSOLUTELY sure? (type 'yes' to confirm): "
    read -r CONFIRM
    if [ "$CONFIRM" = "yes" ]; then
      echo ""
      echo "📥 Importing ALL historical orders..."
      echo "This may take a while..."
      echo ""

      # Save response to temp file
      RESPONSE=$(mktemp)
      HTTP_CODE=$(curl -w "%{http_code}" -o "$RESPONSE" -X POST "$BASE_URL/api/squarespace/import-historical" \
        -H "x-api-key: $WEBHOOK_API_KEY" \
        -H "Content-Type: application/json")

      echo ""
      echo "📊 HTTP Status: $HTTP_CODE"
      echo ""

      # Try to parse as JSON, otherwise show raw
      if jq empty "$RESPONSE" 2>/dev/null; then
        jq '.' "$RESPONSE"
      else
        echo "Raw response:"
        cat "$RESPONSE"
      fi

      rm "$RESPONSE"
    else
      echo "Cancelled"
    fi
    ;;
  
  4)
    echo ""
    echo "ℹ️  Checking endpoint status..."
    echo ""
    curl -X GET "$BASE_URL/api/squarespace/import-historical" \
      | jq '.'
    ;;
  
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "✅ Done!"

