#!/bin/bash

# Test Squarespace API Connection
# This script tests different authorization methods to find the correct one

set -e

echo "🧪 Testing Squarespace API Connection"
echo "======================================"
echo ""

SQUARESPACE_API_KEY="7a51a456-4ac3-40c7-80a9-380968b1e4ea"

echo "Testing different authorization methods..."
echo ""

# Test 1: Bearer token
echo "Test 1: Using 'Bearer' prefix..."
RESPONSE1=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET https://api.squarespace.com/1.0/commerce/orders \
  -H "Authorization: Bearer $SQUARESPACE_API_KEY" \
  -H "User-Agent: RMR-CMS/1.0")

HTTP_CODE1=$(echo "$RESPONSE1" | grep "HTTP_CODE" | cut -d: -f2)
BODY1=$(echo "$RESPONSE1" | sed '/HTTP_CODE/d')

echo "HTTP Code: $HTTP_CODE1"
echo "Response: $BODY1" | jq '.' 2>/dev/null || echo "$BODY1"
echo ""

# Test 2: Direct API key
echo "Test 2: Using API key directly (no Bearer)..."
RESPONSE2=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET https://api.squarespace.com/1.0/commerce/orders \
  -H "Authorization: $SQUARESPACE_API_KEY" \
  -H "User-Agent: RMR-CMS/1.0")

HTTP_CODE2=$(echo "$RESPONSE2" | grep "HTTP_CODE" | cut -d: -f2)
BODY2=$(echo "$RESPONSE2" | sed '/HTTP_CODE/d')

echo "HTTP Code: $HTTP_CODE2"
echo "Response: $BODY2" | jq '.' 2>/dev/null || echo "$BODY2"
echo ""

# Test 3: API-Key header
echo "Test 3: Using 'API-Key' header..."
RESPONSE3=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET https://api.squarespace.com/1.0/commerce/orders \
  -H "API-Key: $SQUARESPACE_API_KEY" \
  -H "User-Agent: RMR-CMS/1.0")

HTTP_CODE3=$(echo "$RESPONSE3" | grep "HTTP_CODE" | cut -d: -f2)
BODY3=$(echo "$RESPONSE3" | sed '/HTTP_CODE/d')

echo "HTTP Code: $HTTP_CODE3"
echo "Response: $BODY3" | jq '.' 2>/dev/null || echo "$BODY3"
echo ""

# Summary
echo "======================================"
echo "Summary:"
echo "======================================"
echo "Test 1 (Bearer): HTTP $HTTP_CODE1"
echo "Test 2 (Direct): HTTP $HTTP_CODE2"
echo "Test 3 (API-Key): HTTP $HTTP_CODE3"
echo ""

if [ "$HTTP_CODE1" = "200" ]; then
  echo "✅ SUCCESS: Use 'Authorization: Bearer \$SQUARESPACE_API_KEY'"
elif [ "$HTTP_CODE2" = "200" ]; then
  echo "✅ SUCCESS: Use 'Authorization: \$SQUARESPACE_API_KEY'"
elif [ "$HTTP_CODE3" = "200" ]; then
  echo "✅ SUCCESS: Use 'API-Key: \$SQUARESPACE_API_KEY'"
else
  echo "❌ All tests failed. Check your API key and permissions."
  echo ""
  echo "Your API key: $SQUARESPACE_API_KEY"
  echo "Make sure it has 'Orders (Read Only)' permission enabled."
fi

