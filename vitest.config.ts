import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/components/ui/**', // shadcn/ui generated components
        '**/*.config.*',
        '**/test-*.mjs',
        '**/*.d.ts',
      ],
      // Coverage thresholds - CI will fail if coverage drops below these values
      thresholds: {
        lines: 70,        // 70% of lines must be covered
        functions: 70,    // 70% of functions must be covered
        branches: 60,     // 60% of branches must be covered (lower for edge cases)
        statements: 70,   // 70% of statements must be covered
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
