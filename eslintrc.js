export default {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "import", "unicorn"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:unicorn/recommended",
    "prettier"
  ],
  rules: {
    "import/no-commonjs": "error",
    "unicorn/prefer-module": "error",
    "no-restricted-syntax": [
      "error",
      { "selector": "CallExpression[callee.name='require']", "message": "Kein CommonJS: verwende ESM import" },
      { "selector": "MemberExpression[object.name='module'][property.name='exports']", "message": "Kein CommonJS: verwende ESM export" }
    ]
  },
  settings: { "import/resolver": { "typescript": true } }
};