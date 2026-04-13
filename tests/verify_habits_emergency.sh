#!/bin/bash
set -e

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0
TIMESTAMP=$(date +%s)
EMAIL="hb_test_${TIMESTAMP}@test.com"

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

echo "=== Habit and Emergency Verification ==="

# 1. Register and Login
parse "$(request POST /auth/register "" "{\"email\":\"$EMAIL\",\"password\":\"123456\",\"name\":\"Habit Tester\"}")"
TOKEN=$(echo "$BODY" | jq -r '.accessToken // empty')

if [ -z "$TOKEN" ]; then
  red "Failed to get token"
  exit 1
fi

# 2. Create Network
parse "$(request POST /api/networks "$TOKEN" '{"name":"Habit Test Network"}')"
NETWORK_ID=$(echo "$BODY" | jq -r '.id // empty')

# 3. Habits
echo "--- Testing Habits ---"
parse "$(request POST "/api/networks/$NETWORK_ID/habits" "$TOKEN" '{"name":"Beber Água","frequency":"DAILY","goal":8,"unit":"copos"}')"
assert_status "Create Habit" 201 "$STATUS"
HABIT_ID=$(echo "$BODY" | jq -r '.id // empty')

parse "$(request GET "/api/networks/$NETWORK_ID/habits" "$TOKEN")"
assert_status "List Habits" 200 "$STATUS"

parse "$(request GET "/api/habits/$HABIT_ID" "$TOKEN")"
assert_status "Get Habit Details" 200 "$STATUS"

parse "$(request POST "/api/habits/$HABIT_ID/records" "$TOKEN" '{"value":2,"notes":"Manhã"}')"
assert_status "Add Habit Record" 201 "$STATUS"

parse "$(request GET "/api/habits/$HABIT_ID" "$TOKEN")"
PROGRESS=$(echo "$BODY" | jq -r '.progress.percentage // empty')
[ "$PROGRESS" = "25" ] && green "Progress correctly calculated (25%)" || red "Wrong progress: $PROGRESS"

# 4. Emergency
echo "--- Testing Emergency ---"
parse "$(request POST "/api/networks/$NETWORK_ID/emergency" "$TOKEN" '{"message":"Preciso de ajuda!"}')"
assert_status "Trigger Emergency" 201 "$STATUS"
EMERGENCY_ID=$(echo "$BODY" | jq -r '.alert.id // empty')

parse "$(request GET "/api/networks/$NETWORK_ID/emergency" "$TOKEN")"
assert_status "List Emergencies" 200 "$STATUS"

parse "$(request PATCH "/api/emergency/$EMERGENCY_ID/resolve" "$TOKEN" '{}')"
assert_status "Resolve Emergency" 200 "$STATUS"

echo ""
echo "Summary: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
