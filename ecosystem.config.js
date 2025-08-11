// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

module.exports = {
  apps: [
    {
      name: "endgame-trainer-dev",
      script: "./node_modules/.bin/next",
      args: "dev -p 3002 --turbopack",
      cwd: "/home/thehu/coolProjects/EndgameTrainer",
      env: {
        NODE_ENV: "development",
        // Load Firebase config from environment variables
        NEXT_PUBLIC_USE_FIRESTORE: process.env.NEXT_PUBLIC_USE_FIRESTORE,
        NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      },
      watch: false,
      ignore_watch: ["node_modules", ".next", "coverage"],
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "1G",
      log_file: "./logs/pm2.log",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
