import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

import stylistic from "@stylistic/eslint-plugin";

export default defineConfig([
	{
		files: [
			"**/*.{js,mjs,cjs,ts,mts,cts}"
		],
		plugins: {
			js,
			"@stylistic": stylistic,
		},
		extends: [
			"js/recommended"
		],
		languageOptions: {
			globals: globals.node
		},
		rules: {
			"@stylistic/semi": ["error", "always"],
			"no-restricted-imports": [
				"error",
				{
					patterns: [
						{
							group: ["../*"],
							message: "Use './../*' rather than '../*' when importing from a parent directory."
						}
					]
				}
			],
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					varsIgnorePattern: ".*",
					argsIgnorePattern: ".*"
				}
			],
			"@typescript-eslint/explicit-function-return-type": [
				"error",
				{
					allowExpressions: true
				}
			],
			"@typescript-eslint/array-type": [
				"error",
				{
					default: "array"
				}
			]
		}
	},
	tseslint.configs.recommended,
]);
