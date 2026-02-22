import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = Number(env.FRONTEND_PORT || 5173);

  return {
    server: {
      port,
      strictPort: true
    },
    preview: {
      port,
      strictPort: true
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts'
    }
  };
});
