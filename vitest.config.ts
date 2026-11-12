import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Kept separate from vite.config.ts so tests don't spin up the Cloudflare runtime.
// Component tests opt into jsdom with a `// @vitest-environment jsdom` comment.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'worker/**/*.test.ts', 'shared/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
