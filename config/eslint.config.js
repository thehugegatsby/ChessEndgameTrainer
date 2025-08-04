const { FlatCompat } = require("@eslint/eslintrc");
const path = require("path");
const jsdoc = require("eslint-plugin-jsdoc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  // Extend Next.js config
  ...compat.extends("next/core-web-vitals"),

  // JSDoc plugin
  {
    plugins: {
      jsdoc,
    },
  },

  // Global rules
  {
    rules: {
      // JSDoc rules (warnings for gradual improvement)
      "jsdoc/require-jsdoc": [
        "warn",
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: false,
            ArrowFunctionExpression: true,
            FunctionExpression: true,
          },
          contexts: [
            "TSEnumDeclaration",
            "TSInterfaceDeclaration",
            "TSTypeAliasDeclaration",
            // Only enforce for exported functions
            "ExportNamedDeclaration > FunctionDeclaration",
            "ExportNamedDeclaration > VariableDeclaration",
            "ExportDefaultDeclaration > FunctionDeclaration",
          ],
          checkConstructors: false,
        },
      ],
      "jsdoc/require-param": "warn",
      "jsdoc/require-param-description": "warn",
      "jsdoc/require-returns": ["warn", { checkGetters: false }],
      "jsdoc/require-returns-description": "warn",
      "jsdoc/no-types": "error", // No types in JSDoc for TypeScript
      "jsdoc/check-param-names": "warn",
      "jsdoc/check-alignment": "warn",
      "jsdoc/check-tag-names": "warn",
      // Prevent console.log in production code - use Logger service instead
      "no-console": "error",
    },
  },

  // Test files - Allow all console calls
  {
    files: [
      "tests/**/*.ts",
      "tests/**/*.tsx",
      "tests/**/*.js",
      "tests/**/*.jsx",
    ],
    rules: {
      "no-console": "off", // Allow console in all test files for debugging
    },
  },

  // Next.js pages and app router files - disable redundant JSDoc rules
  {
    files: ["pages/**/*.tsx", "pages/**/*.ts", "app/**/*.tsx", "app/**/*.ts"],
    rules: {
      // These components are framework-defined entry points.
      // JSDoc on props and return values is often redundant.
      "jsdoc/require-param-description": "off",
      "jsdoc/require-returns": "off",
      "jsdoc/require-returns-description": "off",
      "jsdoc/require-jsdoc": "off",
    },
  },
];
