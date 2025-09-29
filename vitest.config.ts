import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const srcPath = resolve(__dirname, 'src');

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./vitest.setup.ts'],
	css: false, // disable css processing to avoid postcss plugin loading during unit tests
		coverage: {
			reporter: ['text', 'lcov'],
		},
	},
	resolve: {
		alias: {
			'@': srcPath,
		},
	},
});
