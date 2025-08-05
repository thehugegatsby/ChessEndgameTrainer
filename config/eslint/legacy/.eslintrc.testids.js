/**
 * ESLint configuration for enforcing test ID usage
 * This configuration ensures that all data-testid attributes use the centralized TEST_IDS constants
 */

module.exports = {
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector: 'JSXAttribute[name.name="data-testid"][value.type="Literal"]',
        message:
          "Use TEST_IDS constants instead of hardcoded data-testid strings. Import from @shared/constants/testIds",
      },
    ],
  },
  overrides: [
    {
      // Allow hardcoded test IDs only in the constants file itself
      files: ["**/constants/testIds.ts"],
      rules: {
        "no-restricted-syntax": "off",
      },
    },
  ],
};
