import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  // All exports in the icons barrel are React components produced by createFaIcon().
  // The react-refresh rule can't see through the factory call, so suppress the
  // false positives for this file only.
  {
    files: ['src/components/icons/index.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
