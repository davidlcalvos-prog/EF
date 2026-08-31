const { fixupPluginRules } = require("@eslint/compat")
const tsPlugin = require("@typescript-eslint/eslint-plugin")
const expoConfig = require("eslint-config-expo/flat")
const prettierRecommended = require("eslint-plugin-prettier/recommended")
const reactNative = require("eslint-plugin-react-native")
const reactotron = require("eslint-plugin-reactotron")

/**
 * ESLint 9 flat config for the mobile workspace.
 * Scripts resolve the monorepo root ESLint 9 binary to avoid nested ESLint 8.
 */
module.exports = [
  {
    ignores: [
      "node_modules/**",
      ".expo/**",
      "android/**",
      "ios/**",
      "dist/**",
      "coverage/**",
      ".vscode/**",
      "app-dependency-graph.*",
      "eslint.config.js",
      "ignite/ignite.json",
      "package.json",
      "scripts/**",
    ],
  },
  ...expoConfig,
  prettierRecommended,
  {
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-native": fixupPluginRules(reactNative),
      reactotron,
    },
    rules: {
      // Keep parity with previous Ignite .eslintrc (plugin:react-native/all),
      // but disable rules that flood CI without blocking unsafe patterns.
      ...(reactNative.configs.all?.rules ?? {}),
      "prettier/prettier": "error",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "no-use-before-define": "off",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              importNames: ["default"],
              message: "Import named exports from 'react' instead.",
            },
            {
              name: "react-native",
              importNames: ["SafeAreaView"],
              message:
                "Use the SafeAreaView from 'react-native-safe-area-context' instead.",
            },
            {
              name: "react-native",
              importNames: ["Text", "Button", "TextInput"],
              message: "Use the custom wrapper component from '@/components'.",
            },
            {
              name: "react-native",
              importNames: ["Alert"],
              message:
                "No uses Alert.alert directo — usá useAppAlert() de '@/components/AppAlert'.",
            },
          ],
        },
      ],
      "react/prop-types": "off",
      "react-native/no-raw-text": "off",
      "react-native/no-inline-styles": "off",
      "react-native/no-color-literals": "off",
      "reactotron/no-tron-in-production": "error",
      "comma-dangle": "off",
      "no-global-assign": "off",
      quotes: "off",
      "space-before-function-paren": "off",
      "import/order": [
        "error",
        {
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
          "newlines-between": "always",
          groups: [["builtin", "external"], "internal", "unknown", ["parent", "sibling"], "index"],
          distinctGroup: false,
          pathGroups: [
            {
              pattern: "react",
              group: "external",
              position: "before",
            },
            {
              pattern: "react-native",
              group: "external",
              position: "before",
            },
            {
              pattern: "expo{,-*}",
              group: "external",
              position: "before",
            },
            {
              pattern: "@/**",
              group: "unknown",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["react", "react-native", "expo", "expo-*"],
        },
      ],
      "import/newline-after-import": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: ["*.js", "*.cjs", "*.mjs", "metro.config.js", "babel.config.js", "react-native.config.js"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        process: "readonly",
      },
    },
  },
]
