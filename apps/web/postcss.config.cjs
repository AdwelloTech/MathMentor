const path = require('path');

/**
 * PostCSS (CommonJS) — force Tailwind to use the per-app config
 * This prevents Tailwind from picking up a root config without tokens.
 */
module.exports = {
  plugins: {
    tailwindcss: { config: path.resolve(__dirname, './tailwind.config.cjs') },
    autoprefixer: {},
  },
};
