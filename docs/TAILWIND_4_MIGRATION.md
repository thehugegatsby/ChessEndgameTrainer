# TailwindCSS 4.x Migration Guide

## Overview

This project has been migrated from TailwindCSS 3.4.1 to 4.1.11 using the new CSS-first configuration approach.

## Key Changes

### 1. Configuration Structure

**Before (v3.x)**: JavaScript configuration file

```javascript
// tailwind.config.js
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', ...],
  theme: { extend: { ... } },
  plugins: []
}
```

**After (v4.x)**: CSS configuration file

```css
/* tailwind.config.css */
@import "tailwindcss";

@source "./pages/**/*.{js,ts,jsx,tsx}";
@source "./shared/**/*.{js,ts,jsx,tsx}";

@theme {
  --color-primary-500: #0ea5e9;
  /* ... other theme customizations ... */
}
```

### 2. PostCSS Configuration

Updated to use `@tailwindcss/postcss` package:

```javascript
// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### 3. Main CSS Import

The main CSS file now imports the configuration:

```css
/* styles/globals.css */
@import "../tailwind.config.css";
```

## Migration Steps

1. **Install New Packages**:

   ```bash
   npm install tailwindcss@latest @tailwindcss/postcss@latest
   ```

2. **Convert Configuration**:
   - Move `content` paths to `@source` declarations
   - Convert `theme.extend` to CSS custom properties under `@theme`
   - Remove JavaScript configuration file

3. **Update PostCSS**:
   - Replace `tailwindcss` and `autoprefixer` with `@tailwindcss/postcss`

4. **Fix Known Issues**:
   - Ensure TailwindCSS version is 4.1.0+ to avoid `negated` field error
   - Update imports in globals.css

## Benefits

- **Performance**: Faster build times with CSS-first approach
- **Simplicity**: CSS-based configuration is more intuitive
- **Future-proof**: Aligned with TailwindCSS's future direction
- **Type Safety**: Better IDE support for CSS custom properties

## Troubleshooting

### Error: "Missing field `negated` on ScannerOptions.sources"

**Solution**: Upgrade to TailwindCSS 4.1.0 or later

### Build warnings about missing classes

**Solution**: Ensure all source paths are correctly specified with `@source`

## Resources

- [TailwindCSS v4 Documentation](https://tailwindcss.com/docs/v4)
- [Migration Guide](https://tailwindcss.com/docs/v4/migration-guide)
- [CSS-First Configuration](https://tailwindcss.com/docs/v4/configuration)
