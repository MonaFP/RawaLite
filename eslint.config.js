import typescriptParser from '@typescript-eslint/parser';
import typescript from '@typescript-eslint/eslint-plugin';

export default [
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    ignores: [
      'tests/scripts/**/*.{js,cjs}',
      'dist/**',
      'dist-electron/**',
      'release/**',
      '_cleanup_backup/**',
      '_final_cleanup_legacy_docs/**',
      'resources/update-launcher.js',
      'electron/updater-integration-example.ts'
    ],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        { 
          selector: "CallExpression[callee.name='require']", 
          message: "Kein CommonJS: verwende ESM import" 
        },
        { 
          selector: "MemberExpression[object.name='module'][property.name='exports']", 
          message: "Kein CommonJS: verwende ESM export" 
        }
      ]
    }
  },
  {
    files: ['electron/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        Buffer: 'readonly'
      }
    }
  },
  {
    ignores: [
      'node_modules/**', 
      'dist/**', 
      'dist-electron/**', 
      'build/**',
      '_cleanup_backup/**',
      '_final_cleanup_legacy_docs/**',
      // Legacy CommonJS utility scripts (to be migrated)
      '*.cjs',
      'fix-*.js',
      'debug-*.js',
      'test-*.cjs',
      '*-migration.js',
      'tests/integration/**/*.cjs'
    ]
  }
];
