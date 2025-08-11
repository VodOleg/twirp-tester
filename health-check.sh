#!/bin/bash

# Health check script for Twirp Proto Tester

PORT=8765
HOST="localhost"
TIMEOUT=5

echo "Checking Twirp Proto Tester health on $HOST:$PORT..."

# Check if service is responding
response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT http://$HOST:$PORT)

if [ "$response" = "200" ]; then
    echo "✅ Service is healthy - HTTP $response"
    
    # Check PM2 status
    pm2_status=$(pm2 jlist | jq -r '.[] | select(.name=="twirp-proto-tester") | .pm2_env.status')
    echo "📊 PM2 Status: $pm2_status"
    
    # Check memory usage
    memory=$(pm2 jlist | jq -r '.[] | select(.name=="twirp-proto-tester") | .monit.memory')
    memory_mb=$((memory / 1024 / 1024))
    echo "💾 Memory usage: ${memory_mb}MB"
    
    # Check CPU usage
    cpu=$(pm2 jlist | jq -r '.[] | select(.name=="twirp-proto-tester") | .monit.cpu')
    echo "🔥 CPU usage: ${cpu}%"
    
    exit 0
else
    echo "❌ Service is unhealthy - HTTP $response"
    echo "🔍 Checking PM2 status..."
    pm2 status twirp-proto-tester
    exit 1
fi
