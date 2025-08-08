module.exports = {
  plugins: {
    "@tailwindcss/postcss": {
      // Explizit auf die CSS-Konfigurationsdatei verweisen
      config: "./tailwind.config.css",
    },
    autoprefixer: {},
  },
};