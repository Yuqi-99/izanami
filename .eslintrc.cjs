module.exports = {
	env: {
		browser: true,
		es2021: true,
	},
	extends: [
		'airbnb',
		'airbnb-typescript',
		'airbnb/hooks',
		'plugin:react/recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:prettier/recommended',
		'plugin:storybook/recommended',
	],
	overrides: [
		{
			env: {
				node: true,
			},
			files: ['.eslintrc.{js,cjs}'],
			parserOptions: {
				sourceType: 'script',
			},
		},
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
		project: ['./tsconfig.json', './tsconfig.node.json'],
	},
	plugins: ['@typescript-eslint', 'check-file', 'react', 'prettier'],
	rules: {
		'jsx-a11y/click-events-have-key-events': 'off',
		'jsx-a11y/no-noninteractive-element-interactions': 'off',
		'@typescript-eslint/no-use-before-define': 'warn',
		'@typescript-eslint/ban-ts-comment': 'warn',
		'check-file/no-index': 'error',
		'check-file/filename-naming-convention': [
			'error',
			{
				'src/**/assets/*.{svg,png,jpg,jpeg,gif,json}': 'KEBAB_CASE',
				'src/**/components/*.{ts,tsx}': 'PASCAL_CASE',
				'src/**/constants/*.{ts,tsx}': 'CAMEL_CASE',
				'src/**/contexts/*.{ts,tsx}': 'PASCAL_CASE',
				'src/**/data/*.{ts,tsx}': 'CAMEL_CASE',
				'src/**/hooks/*.{ts,tsx}': 'CAMEL_CASE',
				'src/**/layouts/*.{ts,tsx}': 'PASCAL_CASE',
				'src/**/services/*.{ts,tsx}}': 'CAMEL_CASE',
				'src/**/store/*.{ts,tsx}': 'CAMEL_CASE',
				'src/**/types/*.{ts,tsx}': 'CAMEL_CASE',
				'src/**/utils/*.{ts,tsx}': 'CAMEL_CASE',
			},
			{
				ignoreMiddleExtensions: true,
			},
		],
		'check-file/folder-naming-convention': [
			'error',
			{
				'src/**/': 'KEBAB_CASE',
			},
		],
		'import/no-absolute-path': 'off',
		'import/no-extraneous-dependencies': 'off',
		'import/no-unresolved': 'off',
		'import/prefer-default-export': 'off',
		'no-underscore-dangle': 'off',
		'prettier/prettier': 'warn',
		'react/forbid-prop-types': 'warn',
		'react/function-component-definition': 'off',
		'react/jsx-props-no-spreading': 'off',
		'react/require-default-props': 'off',
		'react/no-unstable-nested-components': [
			'off',
			{
				allowAsProps: true,
			},
		],
		'react/react-in-jsx-scope': 'off',
		'react-hooks/exhaustive-deps': 'off',
		'spaced-comment': 'warn',
	},
};
