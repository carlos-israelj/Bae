#!/bin/bash
# examples/test-api.sh

API_URL="${API_URL:-http://localhost:3000}"

echo "🧪 Testing Bae API"
echo "API URL: $API_URL"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  
  echo -n "Testing $method $endpoint... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X POST \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$API_URL$endpoint")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "${GREEN}✓ $http_code${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  else
    echo -e "${RED}✗ $http_code${NC}"
    echo "$body"
  fi
  echo ""
}

# Tests
test_endpoint GET "/health"
test_endpoint GET "/api/v1/sensors/ESP32-001/latest"
test_endpoint GET "/api/v1/sensors/ESP32-001?limit=5"
test_endpoint GET "/api/v1/sensors/ESP32-001/alerts?limit=10"
test_endpoint GET "/api/v1/analytics/ESP32-001/summary?period=24h"
test_endpoint GET "/api/v1/analytics/ESP32-001/trends?period=24h"
test_endpoint POST "/api/v1/babies" \
  '{"name":"Emma Test","birth_date":"2024-01-15"}'
test_endpoint GET "/api/v1/babies/test-baby-id"

echo "🎉 Tests completed!"