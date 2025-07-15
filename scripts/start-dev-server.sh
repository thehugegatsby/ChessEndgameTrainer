#!/bin/bash

# Development Server Start Script with PM2
# This script ensures stable development server operation

echo "🚀 Starting Endgame Trainer Development Server with PM2..."

# Kill any existing process on port 3002
echo "🔄 Checking for existing processes on port 3002..."
if lsof -ti:3002 >/dev/null 2>&1; then
    echo "⚠️  Port 3002 is in use. Stopping existing process..."
    pm2 stop endgame-trainer-dev 2>/dev/null || true
    pm2 delete endgame-trainer-dev 2>/dev/null || true
    sleep 2
fi

# Start the development server with PM2
echo "🏃 Starting development server..."
pm2 start ecosystem.config.js

# Show PM2 status
echo "📊 PM2 Status:"
pm2 status

# Show logs
echo "📋 Recent logs:"
pm2 logs endgame-trainer-dev --lines 10

echo ""
echo "✅ Development server started successfully!"
echo "🌐 Server URL: http://localhost:3002"
echo "📊 Monitor: pm2 monit"
echo "📋 Logs: pm2 logs endgame-trainer-dev"
echo "🔄 Restart: pm2 restart endgame-trainer-dev"
echo "🛑 Stop: pm2 stop endgame-trainer-dev"
echo ""
echo "💡 Tip: Use 'pm2 save' to persist the process list"
echo "💡 Tip: Use 'pm2 startup' to start PM2 on boot"