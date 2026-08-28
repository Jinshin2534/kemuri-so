import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5410 },
  test: { environment: 'node', include: ['src/**/*.test.js'] },
});
