import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

// Date formatting follows the default locale and time zone; the test workers inherit these, so
// results do not depend on the developer's machine.
process.env.LC_ALL = 'en_US.UTF-8';
process.env.TZ = 'UTC';

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify('test'),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // The gate fails below these values: the coverage at the time they were set, rounded
      // down. Raise them when coverage grows; never lower them to make a change pass.
      thresholds: {
        statements: 73,
        branches: 62,
        functions: 72,
        lines: 73,
      },
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/main.tsx',
      ],
    },
  },
});
