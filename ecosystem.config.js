module.exports = {
  apps: [
    {
      name: "endgame-trainer-dev",
      script: "./node_modules/.bin/next",
      args: "dev -p 3002",
      cwd: "/home/thehu/coolProjects/EndgameTrainer",
      env: {
        NODE_ENV: "development",
        NEXT_PUBLIC_USE_FIRESTORE: "true",
        NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSyAtMncqDwhbZtbIjYjTlL1ViKqW3sJSHjs",
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
          "chess-endgame-trainer-c1ea6.firebaseapp.com",
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: "chess-endgame-trainer-c1ea6",
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
          "chess-endgame-trainer-c1ea6.firebasestorage.app",
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "884956836859",
        NEXT_PUBLIC_FIREBASE_APP_ID:
          "1:884956836859:web:e8fef7fd2bcdc3cd46115e",
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
