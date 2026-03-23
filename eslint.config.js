import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.vite/**",
      "**/coverage/**",
      "**/.turbo/**",
      ".agents/**",
      ".local/**",
      ".cache/**",
      "scripts/operational/**",
      "scripts/node_modules/**",
    ],
  },

  js.configs.recommended,

  {
    rules: {
      "no-case-declarations": "warn",
    },
  },

  {
    files: ["artifacts/api-server/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-namespace": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "no-console": "off",
      "no-empty": "warn",
      "no-undef": "off",
      "no-prototype-builtins": "warn",
      "no-useless-escape": "warn",
      "no-case-declarations": "warn",
    },
  },

  {
    files: [
      "artifacts/ffpma/**/*.ts",
      "artifacts/ffpma/**/*.tsx",
      "artifacts/doctor-pitch-deck/**/*.ts",
      "artifacts/doctor-pitch-deck/**/*.tsx",
      "artifacts/handbook-pitch-deck/**/*.ts",
      "artifacts/handbook-pitch-deck/**/*.tsx",
      "artifacts/protocol-presentation/**/*.ts",
      "artifacts/protocol-presentation/**/*.tsx",
      "artifacts/mockup-sandbox/**/*.ts",
      "artifacts/mockup-sandbox/**/*.tsx",
    ],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-namespace": "warn",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "warn",
      "react/no-unknown-property": "warn",
      "no-console": "off",
      "no-empty": "warn",
      "no-undef": "off",
      "no-prototype-builtins": "warn",
      "no-useless-escape": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
    },
  },

  {
    files: ["lib/**/*.ts", "lib/**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2022,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-namespace": "warn",
      "no-console": "off",
      "no-empty": "warn",
      "no-undef": "off",
      "no-prototype-builtins": "warn",
      "no-useless-escape": "warn",
    },
  },

  {
    files: ["scripts/**/*.ts", "scripts/pre-deploy.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-namespace": "warn",
      "no-console": "off",
      "no-empty": "warn",
      "no-undef": "off",
      "no-useless-escape": "warn",
    },
  },

  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "no-console": "off",
      "no-empty": "warn",
      "no-undef": "off",
    },
  },

  {
    files: ["vitest.config.ts", "*.config.ts", "*.config.js"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-require-imports": "warn",
      "no-console": "off",
      "no-undef": "off",
    },
  },
];
