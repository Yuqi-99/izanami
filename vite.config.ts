import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
// @ts-expect-error remove error
import eslint from 'vite-plugin-eslint';
import svgr from 'vite-plugin-svgr';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		eslint(),
		svgr({
			include: '**/*.svg?react',
		}),
	],
	resolve: {
		alias: {
			src: path.resolve(__dirname, 'src'),
		},
	},
});
