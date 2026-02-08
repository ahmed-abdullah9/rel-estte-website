#!/bin/bash

echo "🧪 Testing LinkShort API..."

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s http://localhost:3000/health | jq '.'

# Test shorten endpoint
echo "2. Testing shorten endpoint..."
curl -s -X POST http://localhost:3000/api/urls/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://google.com"}' | jq '.'

echo "✅ API tests complete!"