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
      // No restricted imports currently configured
    },
  },

  // E2E specific rules
  {
    files: ["tests/e2e/**/*.ts", "tests/e2e/**/*.tsx"],
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];
