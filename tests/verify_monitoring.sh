#!/bin/bash
set -e

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0
TIMESTAMP=$(date +%s)
EMAIL="mon_test_${TIMESTAMP}@test.com"

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

echo "=== Monitoring Module Verification ==="

# 1. Setup
parse "$(request POST /auth/register "" "{\"email\":\"$EMAIL\",\"password\":\"123456\",\"name\":\"Mon Tester\"}")"
TOKEN=$(echo "$BODY" | jq -r '.accessToken // empty')
parse "$(request POST /api/networks "$TOKEN" '{"name":"Monitoring Network"}')"
NETWORK_ID=$(echo "$BODY" | jq -r '.id // empty')

# 2. Add some data
request POST "/api/networks/$NETWORK_ID/occurrences" "$TOKEN" '{"title":"Teste","description":"Ocorrência de teste","type":"OBSERVACAO","occurredAt":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > /dev/null

# 3. Test Timeline
echo "--- Testing Timeline ---"
parse "$(request GET "/api/networks/$NETWORK_ID/timeline" "$TOKEN")"
assert_status "Get Timeline" 200 "$STATUS"
[ "$(echo "$BODY" | jq 'length')" -gt 0 ] && green "Timeline has items" || red "Timeline empty"

# 4. Test Dashboards
echo "--- Testing Dashboards ---"
parse "$(request GET "/api/networks/$NETWORK_ID/dashboard/patient" "$TOKEN")"
assert_status "Get Patient Dashboard" 200 "$STATUS"
parse "$(request GET "/api/networks/$NETWORK_ID/dashboard/caregiver" "$TOKEN")"
assert_status "Get Caregiver Dashboard" 200 "$STATUS"

# 5. Test Reports
echo "--- Testing Reports ---"
parse "$(request GET "/api/networks/$NETWORK_ID/reports/adherence" "$TOKEN")"
assert_status "Get Adherence Report" 200 "$STATUS"
parse "$(request GET "/api/networks/$NETWORK_ID/reports/habits" "$TOKEN")"
assert_status "Get Habits Report" 200 "$STATUS"

echo ""
echo "Summary: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
