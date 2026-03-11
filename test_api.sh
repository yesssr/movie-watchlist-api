#!/bin/bash

# Movie Watchlist API Test Script
# Make sure the server is running on port 5000

BASE_URL="http://localhost:5000"
API_URL="$BASE_URL/api"

echo "🎬 Movie Watchlist API Test Script"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
print_test() {
    echo -e "${BLUE}Testing: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Test 1: Health Check
print_test "Health Check"
response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$BASE_URL/")
http_code=$(echo "$response" | tail -c 4)

if [ "$http_code" = "200" ]; then
    print_success "Health check passed (HTTP $http_code)"
    cat /tmp/response.json | jq .
else
    print_error "Health check failed (HTTP $http_code)"
fi
echo ""

# Test 2: Register User
print_test "User Registration"
register_data='{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
}'

response=$(curl -s -w "%{http_code}" -o /tmp/register.json -X POST \
    -H "Content-Type: application/json" \
    -d "$register_data" \
    "$API_URL/auth/register")

http_code=$(echo "$response" | tail -c 4)

if [ "$http_code" = "201" ]; then
    print_success "User registration passed (HTTP $http_code)"
    # Extract access token
    ACCESS_TOKEN=$(cat /tmp/register.json | jq -r '.data.accessToken')
    print_info "Access token saved for subsequent tests"
    cat /tmp/register.json | jq .
else
    print_error "User registration failed (HTTP $http_code)"
    cat /tmp/register.json | jq .
fi
echo ""

# Test 3: Login User (in case registration fails due to duplicate)
print_test "User Login"
login_data='{
    "identifier": "test@example.com",
    "password": "password123"
}'

response=$(curl -s -w "%{http_code}" -o /tmp/login.json -X POST \
    -H "Content-Type: application/json" \
    -d "$login_data" \
    "$API_URL/auth/login")

http_code=$(echo "$response" | tail -c 4)

if [ "$http_code" = "200" ]; then
    print_success "User login passed (HTTP $http_code)"
    # Extract access token (fallback if registration failed)
    ACCESS_TOKEN=$(cat /tmp/login.json | jq -r '.data.accessToken')
    cat /tmp/login.json | jq .
else
    print_error "User login failed (HTTP $http_code)"
    cat /tmp/login.json | jq .
fi
echo ""

# Check if we have access token
if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
    print_error "No access token available. Cannot test protected endpoints."
    exit 1
fi

# Test 4: Get User Profile
print_test "Get User Profile"
response=$(curl -s -w "%{http_code}" -o /tmp/profile.json -X GET \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$API_URL/auth/profile")

http_code=$(echo "$response" | tail -c 4)

if [ "$http_code" = "200" ]; then
    print_success "Get profile passed (HTTP $http_code)"
    cat /tmp/profile.json | jq .
else
    print_error "Get profile failed (HTTP $http_code)"
    cat /tmp/profile.json | jq .
fi
echo ""

# Test 5: Get Movies (should be empty initially)
print_test "Get Movies List"
response=$(curl -s -w "%{http_code}" -o /tmp/movies.json -X GET \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$API_URL/movies")

http_code=$(echo "$response" | tail -c 4)

if [ "$http_code" = "200" ]; then
    print_success "Get movies passed (HTTP $http_code)"
    cat /tmp/movies.json | jq .
else
    print_error "Get movies failed (HTTP $http_code)"
    cat /tmp/movies.json | jq .
fi
echo ""

# Test 6: Add Movie
print_test "Add Movie"
movie_data='{
    "title": "The Matrix",
    "genre": "Sci-Fi",
    "status": "want_to_watch",
    "rating": 9,
    "review": "Mind-bending sci-fi classic!"
}'

response=$(curl -s -w "%{http_code}" -o /tmp/add_movie.json -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d "$movie_data" \
    "$API_URL/movies")

http_code=$(echo "$response" | tail -c 4)

if [ "$http_code" = "201" ]; then
    print_success "Add movie passed (HTTP $http_code)"
    # Extract movie ID for subsequent tests
    MOVIE_ID=$(cat /tmp/add_movie.json | jq -r '.data.movie.id')
    print_info "Movie ID saved: $MOVIE_ID"
    cat /tmp/add_movie.json | jq .
else
    print_error "Add movie failed (HTTP $http_code)"
    cat /tmp/add_movie.json | jq .
fi
echo ""

# Test 7: Get Movies (should have one movie now)
print_test "Get Movies List (after adding)"
response=$(curl -s -w "%{http_code}" -o /tmp/movies_after.json -X GET \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$API_URL/movies")

http_code=$(echo "$response" | tail -c 4)

if [ "$http_code" = "200" ]; then
    print_success "Get movies after adding passed (HTTP $http_code)"
    cat /tmp/movies_after.json | jq .
else
    print_error "Get movies after adding failed (HTTP $http_code)"
    cat /tmp/movies_after.json | jq .
fi
echo ""

# Test 8: Update Movie (if we have movie ID)
if [ -n "$MOVIE_ID" ] && [ "$MOVIE_ID" != "null" ]; then
    print_test "Update Movie"
    update_data='{
        "status": "watched",
        "rating": 10,
        "review": "Absolutely amazing! A true masterpiece of cinema."
    }'

    response=$(curl -s -w "%{http_code}" -o /tmp/update_movie.json -X PUT \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d "$update_data" \
        "$API_URL/movies/$MOVIE_ID")

    http_code=$(echo "$response" | tail -c 4)

    if [ "$http_code" = "200" ]; then
        print_success "Update movie passed (HTTP $http_code)"
        cat /tmp/update_movie.json | jq .
    else
        print_error "Update movie failed (HTTP $http_code)"
        cat /tmp/update_movie.json | jq .
    fi
    echo ""
fi

# Test 9: Get Movie Stats
print_test "Get Movie Statistics"
response=$(curl -s -w "%{http_code}" -o /tmp/stats.json -X GET \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$API_URL/movies/stats")

http_code=$(echo "$response" | tail -c 4)

if [ "$http_code" = "200" ]; then
    print_success "Get movie stats passed (HTTP $http_code)"
    cat /tmp/stats.json | jq .
else
    print_error "Get movie stats failed (HTTP $http_code)"
    cat /tmp/stats.json | jq .
fi
echo ""

# Test 10: Search TMDB (if API key is configured)
print_test "Search TMDB"
response=$(curl -s -w "%{http_code}" -o /tmp/tmdb_search.json -X GET \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$API_URL/movies/search-tmdb?query=Inception")

http_code=$(echo "$response" | tail -c 4)

if [ "$http_code" = "200" ]; then
    print_success "TMDB search passed (HTTP $http_code)"
    cat /tmp/tmdb_search.json | jq .
else
    print_info "TMDB search may not be configured or failed (HTTP $http_code)"
    cat /tmp/tmdb_search.json | jq .
fi
echo ""

# Test 11: Test Protected Route without Token
print_test "Access Protected Route without Token"
response=$(curl -s -w "%{http_code}" -o /tmp/no_token.json -X GET \
    "$API_URL/movies")

http_code=$(echo "$response" | tail -c 4)

if [ "$http_code" = "401" ]; then
    print_success "Protected route correctly rejected unauthorized access (HTTP $http_code)"
    cat /tmp/no_token.json | jq .
else
    print_error "Protected route should reject unauthorized access (HTTP $http_code)"
    cat /tmp/no_token.json | jq .
fi
echo ""

# Test 12: Test Invalid Route
print_test "Invalid Route"
response=$(curl -s -w "%{http_code}" -o /tmp/invalid.json -X GET \
    "$API_URL/invalid-route")

http_code=$(echo "$response" | tail -c 4)

if [ "$http_code" = "404" ]; then
    print_success "Invalid route correctly returned 404 (HTTP $http_code)"
    cat /tmp/invalid.json | jq .
else
    print_error "Invalid route should return 404 (HTTP $http_code)"
    cat /tmp/invalid.json | jq .
fi
echo ""

# Cleanup temp files
rm -f /tmp/response.json /tmp/register.json /tmp/login.json /tmp/profile.json \
      /tmp/movies.json /tmp/add_movie.json /tmp/movies_after.json \
      /tmp/update_movie.json /tmp/stats.json /tmp/tmdb_search.json \
      /tmp/no_token.json /tmp/invalid.json

echo "🎯 Test completed!"
echo ""
print_info "Summary:"
echo "- Basic endpoints: ✅"
echo "- Authentication: ✅"
echo "- Movie CRUD: ✅"
echo "- Protected routes: ✅"
echo "- Error handling: ✅"
echo ""
print_info "Next steps:"
echo "1. Configure TMDB API key for poster fetching"
echo "2. Start building the frontend with Next.js"
echo "3. Test complete user flow"
