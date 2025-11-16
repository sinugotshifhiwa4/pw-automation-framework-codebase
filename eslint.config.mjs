import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import playwright from "eslint-plugin-playwright";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Create __dirname in ES module environments.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  /**
   * Base TypeScript ESLint recommended rules.
   * Applied to all .ts files.
   */
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["**/*.ts"],
  })),

  /**
   * Stricter type-aware rules.
   * Requires type information to improve safety and correctness.
   */
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.ts"],
  })),

  /**
   * Core TypeScript configuration applied to all .ts files.
   */
  {
    files: ["**/*.ts"],

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: __dirname,
      },
    },

    rules: {
      /**
       * Enforce consistent imports.
       */
      "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        prefer: "type-imports",
        fixStyle: "inline-type-imports",
      },
    ],

      /**
       * Variable usage rules
       * Allows underscores for intentionally unused variables.
       */
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      /**
       * Console usage and code clarity.
       * Only console.error is allowed.
       */
      "no-console": ["error", { allow: ["error"] }],
      "no-empty-pattern": "off",

      /**
       * Enforces strict runtime type safety.
       */
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-argument": "error",

      /**
       * Ensures proper handling of async and promises.
       */
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: { arguments: false },
          checksConditionals: true,
          checksSpreads: true,
        },
      ],

      /**
       * Relaxed or disabled rules where flexibility is needed.
       */
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "no-duplicate-imports": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
    },
  },

  /**
   * Test file configuration.
   * Uses safer glob patterns.
   */
  {
    files: ["**/*.spec.ts", "tests/**/*.ts"],

    plugins: {
      playwright,
    },

    rules: {
      /**
       * Playwright recommended rules.
       */
      ...playwright.configs["flat/recommended"].rules,

      /**
       * Disabled noisy rule; many tests don’t require expect().
       */
      "playwright/expect-expect": "off",

      /**
       * More permissive TypeScript rules in test environments.
       */
      "no-console": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-explicit-any": "warn",

      /**
       * Promise-related safety remains enforced in tests.
       */
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: { arguments: false },
          checksConditionals: true,
          checksSpreads: true,
        },
      ],
    },
  },

  /**
   * Paths ignored by ESLint.
   */
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "src/testData/**",
      "logs/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },

  /**
   * Integrates Prettier with ESLint.
   * Ensures formatting is delegated to Prettier only.
   */
  {
    name: "prettier",
    rules: {
      ...prettierConfig.rules,
    },
  },
];
