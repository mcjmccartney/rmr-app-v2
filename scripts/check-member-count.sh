#!/bin/bash

# Check current member count from Supabase

echo "🔍 Checking current member count..."
echo ""

# Get Supabase credentials from .env.local
SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f2)
SUPABASE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d '=' -f2)

# Count total clients
TOTAL=$(curl -s "${SUPABASE_URL}/rest/v1/clients?select=id" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" | jq '. | length')

# Count members (membership = true)
MEMBERS=$(curl -s "${SUPABASE_URL}/rest/v1/clients?select=id&membership=eq.true" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" | jq '. | length')

# Count non-members (membership = false)
NON_MEMBERS=$(curl -s "${SUPABASE_URL}/rest/v1/clients?select=id&membership=eq.false" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" | jq '. | length')

echo "📊 Client Statistics:"
echo "   Total Clients: ${TOTAL}"
echo "   Members: ${MEMBERS}"
echo "   Non-Members: ${NON_MEMBERS}"
echo ""

# Get sample of recent members with their last payment date
echo "📅 Sample of recent members (showing last 10):"
echo ""

curl -s "${SUPABASE_URL}/rest/v1/clients?select=first_name,last_name,email&membership=eq.true&limit=10" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" | jq -r '.[] | "   \(.first_name) \(.last_name) (\(.email))"'

echo ""
echo "✅ Done!"

