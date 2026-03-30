#!/bin/bash
set -e

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0
TIMESTAMP=$(date +%s)
EMAIL1="testuser1_${TIMESTAMP}@test.com"
EMAIL2="testuser2_${TIMESTAMP}@test.com"

green() { echo -e "\033[32m✓ $1\033[0m"; }
red()   { echo -e "\033[31m✗ $1\033[0m"; }

assert_status() {
  local label="$1" expected="$2" actual="$3" body="$4"
  if [ "$actual" = "$expected" ]; then
    green "$label (HTTP $actual)"
    PASS=$((PASS + 1))
  else
    red "$label — expected $expected, got $actual"
    echo "  Response: $body"
    FAIL=$((FAIL + 1))
  fi
}

request() {
  local method="$1" url="$2" token="$3" data="$4"
  local args=(-s -w "\n%{http_code}" -X "$method" "${BASE_URL}${url}" -H "Content-Type: application/json")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  [ -n "$data" ]  && args+=(-d "$data")
  curl "${args[@]}"
}

parse() {
  local response="$1"
  BODY=$(echo "$response" | sed '$d')
  STATUS=$(echo "$response" | tail -1)
}

echo ""
echo "=========================================="
echo "  API Test Suite — Rede de Apoio"
echo "=========================================="
echo ""

# ─── Auth ────────────────────────────────────────────

echo "--- Autenticação ---"

parse "$(request POST /auth/register "" "{\"email\":\"$EMAIL1\",\"password\":\"123456\",\"name\":\"User One\"}")"
assert_status "Register user 1" 200 "$STATUS"
TOKEN1=$(echo "$BODY" | jq -r '.accessToken // empty')

parse "$(request POST /auth/register "" "{\"email\":\"$EMAIL2\",\"password\":\"123456\",\"name\":\"User Two\"}")"
assert_status "Register user 2" 200 "$STATUS"
TOKEN2=$(echo "$BODY" | jq -r '.accessToken // empty')

if [ -z "$TOKEN1" ] || [ -z "$TOKEN2" ]; then
  red "Could not obtain tokens. Aborting."
  exit 1
fi

# ─── Networks CRUD ───────────────────────────────────

echo ""
echo "--- 3.1 CRUD da Rede ---"

parse "$(request POST /api/networks "$TOKEN1" '{"name":"Rede Dona Maria","description":"Cuidados diários"}')"
assert_status "POST /networks — create" 201 "$STATUS"
NETWORK_ID=$(echo "$BODY" | jq -r '.id // empty')

parse "$(request POST /api/networks "$TOKEN1" '{}')"
assert_status "POST /networks — missing name (400)" 400 "$STATUS"

parse "$(request GET /api/networks "$TOKEN1")"
assert_status "GET /networks — list" 200 "$STATUS"
COUNT=$(echo "$BODY" | jq 'length')
[ "$COUNT" -ge 1 ] && green "  List has $COUNT network(s)" || red "  Expected at least 1 network"

parse "$(request GET "/api/networks/$NETWORK_ID" "$TOKEN1")"
assert_status "GET /networks/:id — details" 200 "$STATUS"

parse "$(request GET "/api/networks/$NETWORK_ID" "$TOKEN2")"
assert_status "GET /networks/:id — non-member (403)" 403 "$STATUS"

parse "$(request PATCH "/api/networks/$NETWORK_ID" "$TOKEN1" '{"name":"Rede Atualizada"}')"
assert_status "PATCH /networks/:id — update" 200 "$STATUS"
UPDATED_NAME=$(echo "$BODY" | jq -r '.name // empty')
[ "$UPDATED_NAME" = "Rede Atualizada" ] && green "  Name updated correctly" || red "  Name mismatch: $UPDATED_NAME"

parse "$(request PATCH "/api/networks/$NETWORK_ID" "$TOKEN2" '{"name":"Hack"}')"
assert_status "PATCH /networks/:id — non-creator (403)" 403 "$STATUS"

# ─── Members ─────────────────────────────────────────

echo ""
echo "--- 3.2 Membros da Rede ---"

parse "$(request GET "/api/networks/$NETWORK_ID/members" "$TOKEN1")"
assert_status "GET /members — list" 200 "$STATUS"
CREATOR_MEMBER_ID=$(echo "$BODY" | jq -r '.[0].id // empty')

parse "$(request GET "/api/networks/$NETWORK_ID/members" "$TOKEN2")"
assert_status "GET /members — non-member (403)" 403 "$STATUS"

parse "$(request PATCH "/api/networks/$NETWORK_ID/members/$CREATOR_MEMBER_ID" "$TOKEN1" '{"role":"ASSISTIDO"}')"
assert_status "PATCH /members — cannot change creator role (400)" 400 "$STATUS"

# ─── Invitations ─────────────────────────────────────

echo ""
echo "--- 3.3 Sistema de Convites ---"

parse "$(request POST "/api/networks/$NETWORK_ID/invitations" "$TOKEN1" \
  "{\"proposedRole\":\"RESPONSAVEL\",\"medicationAccess\":\"VIEW\",\"invitedEmail\":\"$EMAIL2\"}")"
assert_status "POST /invitations — create" 201 "$STATUS"
INVITE_TOKEN=$(echo "$BODY" | jq -r '.token // empty')
INVITE_ID=$(echo "$BODY" | jq -r '.id // empty')

parse "$(request POST "/api/networks/$NETWORK_ID/invitations" "$TOKEN1" '{}')"
assert_status "POST /invitations — missing role (400)" 400 "$STATUS"

parse "$(request GET "/api/invitations/$INVITE_TOKEN" "")"
assert_status "GET /invitations/:token — public view" 200 "$STATUS"
INVITE_STATUS=$(echo "$BODY" | jq -r '.status // empty')
[ "$INVITE_STATUS" = "PENDING" ] && green "  Status is PENDING" || red "  Expected PENDING, got $INVITE_STATUS"

parse "$(request POST "/api/invitations/$INVITE_TOKEN/accept" "$TOKEN2")"
assert_status "POST /invitations/:token/accept" 201 "$STATUS"

parse "$(request POST "/api/invitations/$INVITE_TOKEN/accept" "$TOKEN2")"
assert_status "POST /invitations/:token/accept — already used (400)" 400 "$STATUS"

# Verify user2 is now a member
parse "$(request GET "/api/networks/$NETWORK_ID/members" "$TOKEN1")"
MEMBER_COUNT=$(echo "$BODY" | jq 'length')
[ "$MEMBER_COUNT" -eq 2 ] && green "  Network now has 2 members" || red "  Expected 2 members, got $MEMBER_COUNT"

# Get user2's member ID for further tests
USER2_MEMBER_ID=$(echo "$BODY" | jq -r '.[] | select(.user.email == "'"$EMAIL2"'") | .id // empty')

# Update user2 permissions
parse "$(request PATCH "/api/networks/$NETWORK_ID/members/$USER2_MEMBER_ID" "$TOKEN1" '{"medicationAccess":"EDIT","alertLevel":"EMERGENCY_ONLY"}')"
assert_status "PATCH /members/:memberId — update permissions" 200 "$STATUS"

# Create a second invite to test reject + cancel
parse "$(request POST "/api/networks/$NETWORK_ID/invitations" "$TOKEN1" '{"proposedRole":"ASSISTIDO","invitedEmail":"another@test.com"}')"
REJECT_TOKEN=$(echo "$BODY" | jq -r '.token // empty')

parse "$(request POST "/api/invitations/$REJECT_TOKEN/reject" "$TOKEN2")"
assert_status "POST /invitations/:token/reject" 204 "$STATUS"

parse "$(request POST "/api/networks/$NETWORK_ID/invitations" "$TOKEN1" '{"proposedRole":"ASSISTIDO"}')"
CANCEL_ID=$(echo "$BODY" | jq -r '.id // empty')

parse "$(request DELETE "/api/invitations/$CANCEL_ID" "$TOKEN2")"
assert_status "DELETE /invitations/:id — not inviter (403)" 403 "$STATUS"

parse "$(request DELETE "/api/invitations/$CANCEL_ID" "$TOKEN1")"
assert_status "DELETE /invitations/:id — cancel" 204 "$STATUS"

# ─── Cleanup: remove member, then delete network ────

echo ""
echo "--- Cleanup ---"

parse "$(request DELETE "/api/networks/$NETWORK_ID/members/$USER2_MEMBER_ID" "$TOKEN1")"
assert_status "DELETE /members/:memberId — remove" 204 "$STATUS"

parse "$(request DELETE "/api/networks/$NETWORK_ID/members/$CREATOR_MEMBER_ID" "$TOKEN1")"
assert_status "DELETE /members — cannot remove creator (400)" 400 "$STATUS"

parse "$(request DELETE "/api/networks/$NETWORK_ID" "$TOKEN1")"
assert_status "DELETE /networks/:id — delete" 204 "$STATUS"

parse "$(request GET "/api/networks/$NETWORK_ID" "$TOKEN1")"
assert_status "GET /networks/:id — after delete (404)" 404 "$STATUS"

# ─── Summary ─────────────────────────────────────────

echo ""
echo "=========================================="
echo "  Results: $PASS passed, $FAIL failed"
echo "=========================================="
echo ""

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
