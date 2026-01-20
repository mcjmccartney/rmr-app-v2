#!/bin/bash

# Test Squarespace Webhook Endpoint
# This script sends a test webhook payload to your local or production endpoint

set -e

echo "🧪 Test Squarespace Webhook"
echo "==========================="
echo ""

# Base URL
BASE_URL="${1:-http://localhost:3000}"
echo "🌐 Testing endpoint: $BASE_URL/api/squarespace/webhook"
echo ""

# Test payload (simulates a Squarespace order.create webhook)
PAYLOAD='{
  "id": "test-notification-' $(date +%s) '",
  "topic": "order.create",
  "websiteId": "test-website-id",
  "subscriptionId": "test-subscription-id",
  "createdOn": "' $(date -u +"%Y-%m-%dT%H:%M:%SZ") '",
  "data": {
    "id": "test-order-' $(date +%s) '",
    "orderNumber": "TEST-' $(date +%s) '",
    "customerEmail": "test.customer@example.com",
    "billingAddress": {
      "firstName": "Test",
      "lastName": "Customer",
      "address1": "123 Test Street",
      "city": "London",
      "postalCode": "SW1A 1AA",
      "countryCode": "GB",
      "phone": "07700900000"
    },
    "shippingAddress": {
      "firstName": "Test",
      "lastName": "Customer",
      "address1": "123 Test Street",
      "city": "London",
      "postalCode": "SW1A 1AA",
      "countryCode": "GB",
      "phone": "07700900000"
    },
    "grandTotal": {
      "value": "12.00",
      "currency": "GBP"
    },
    "createdOn": "' $(date -u +"%Y-%m-%dT%H:%M:%SZ") '",
    "lineItems": [
      {
        "id": "line-item-1",
        "productName": "Monthly Membership",
        "quantity": 1,
        "unitPricePaid": {
          "value": "12.00",
          "currency": "GBP"
        }
      }
    ]
  }
}'

echo "📦 Test Payload:"
echo "$PAYLOAD" | jq '.'
echo ""

echo "🚀 Sending webhook..."
echo ""

# Send the webhook
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/squarespace/webhook" \
  -H "Content-Type: application/json" \
  -H "Squarespace-Signature: test-signature" \
  -d "$PAYLOAD")

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# Extract response body (everything except last line)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📥 Response (HTTP $HTTP_CODE):"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Check result
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Webhook processed successfully!"
  echo ""
  echo "📝 Next steps:"
  echo "1. Check your database for the new client: test.customer@example.com"
  echo "2. Verify the client has firstName='Test' and lastName='Customer'"
  echo "3. Check that a membership record was created"
elif [ "$HTTP_CODE" = "401" ]; then
  echo "⚠️  Signature verification failed (expected in production)"
  echo ""
  echo "This is normal if:"
  echo "- You're testing against production"
  echo "- SQUARESPACE_WEBHOOK_SECRET is set"
  echo ""
  echo "To test properly:"
  echo "1. Use a real Squarespace order"
  echo "2. Or test against local dev server (npm run dev)"
else
  echo "❌ Webhook failed with HTTP $HTTP_CODE"
  echo ""
  echo "Check the response above for error details"
fi

