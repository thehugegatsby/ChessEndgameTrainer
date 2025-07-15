#!/bin/bash

# Development Server Stop Script
# Safely stops the PM2 development server

echo "🛑 Stopping Endgame Trainer Development Server..."

# Stop PM2 process
pm2 stop endgame-trainer-dev 2>/dev/null || echo "⚠️  Process not running"

# Delete PM2 process
pm2 delete endgame-trainer-dev 2>/dev/null || echo "⚠️  Process not found"

# Show PM2 status
echo "📊 PM2 Status:"
pm2 status

echo "✅ Development server stopped successfully!"