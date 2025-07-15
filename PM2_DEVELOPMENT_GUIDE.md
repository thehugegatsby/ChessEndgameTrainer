# PM2 Development Server Guide

## 🚀 Quick Start

### Start Development Server
```bash
# Option 1: Using script
./scripts/start-dev-server.sh

# Option 2: Using npm
npm run dev:pm2

# Option 3: Using PM2 directly
pm2 start ecosystem.config.js
```

### Stop Development Server
```bash
# Option 1: Using script
./scripts/stop-dev-server.sh

# Option 2: Using npm
npm run dev:pm2:stop

# Option 3: Using PM2 directly
pm2 stop endgame-trainer-dev
```

## 📊 Monitoring & Management

### Check Status
```bash
pm2 status
```

### View Logs
```bash
# Live logs
pm2 logs endgame-trainer-dev

# Using npm script
npm run dev:pm2:logs

# Tail logs
pm2 logs endgame-trainer-dev --lines 50
```

### Restart Server
```bash
# Using npm script
npm run dev:pm2:restart

# Using PM2 directly
pm2 restart endgame-trainer-dev
```

### Monitor Resources
```bash
pm2 monit
```

## 🔧 Configuration

### PM2 Configuration (ecosystem.config.js)
- **Port**: 3002
- **Environment**: Development
- **Auto-restart**: Yes
- **Max Memory**: 1GB
- **Log Location**: `./logs/`

### Environment Variables
- `NEXT_PUBLIC_USE_FIRESTORE=true`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID=chess-endgame-trainer-c1ea6`
- All Firebase config variables included

## 📋 Log Files

### Location
- **Combined**: `./logs/pm2.log`
- **Errors**: `./logs/pm2-error.log`
- **Output**: `./logs/pm2-out.log`

### View Logs
```bash
# Real-time logs
tail -f ./logs/pm2.log

# Error logs only
tail -f ./logs/pm2-error.log

# PM2 logs command
pm2 logs endgame-trainer-dev --lines 100
```

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Find process using port 3002
lsof -ti:3002

# Kill process
kill -9 $(lsof -ti:3002)

# Or use the start script (handles this automatically)
./scripts/start-dev-server.sh
```

### Process Not Starting
```bash
# Check PM2 status
pm2 status

# View error logs
pm2 logs endgame-trainer-dev --err

# Delete and recreate process
pm2 delete endgame-trainer-dev
pm2 start ecosystem.config.js
```

### High Memory Usage
```bash
# Check memory usage
pm2 monit

# Restart if needed
pm2 restart endgame-trainer-dev
```

## 💡 Best Practices

### Daily Development
1. **Start**: `./scripts/start-dev-server.sh`
2. **Work**: Development as usual
3. **Monitor**: `pm2 monit` (optional)
4. **Stop**: `./scripts/stop-dev-server.sh` (at end of day)

### Persistence
```bash
# Save current PM2 process list
pm2 save

# Setup PM2 to start on boot (optional)
pm2 startup
```

### Debugging
```bash
# Real-time logs with colors
pm2 logs endgame-trainer-dev --raw

# Clear logs
pm2 flush

# Restart with fresh logs
pm2 restart endgame-trainer-dev
```

## 🌐 Access

- **Application**: http://localhost:3002
- **Firebase**: Configured and ready
- **Hot Reload**: Enabled
- **Auto-restart**: On file changes

## 🔄 Common Commands

```bash
# Start everything
./scripts/start-dev-server.sh

# Check if running
pm2 status

# View logs
pm2 logs endgame-trainer-dev

# Restart
pm2 restart endgame-trainer-dev

# Stop everything
./scripts/stop-dev-server.sh
```

## ⚡ Why PM2?

- **Stability**: Auto-restart on crashes
- **Monitoring**: Built-in process monitoring
- **Logging**: Centralized log management
- **Memory**: Automatic restart on memory limits
- **Performance**: Better resource management
- **Reliability**: Production-grade process management

---

**Remember**: Always use PM2 for development to prevent crashes and maintain stability! 🚀