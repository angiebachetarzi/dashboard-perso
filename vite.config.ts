import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import netlify from '@netlify/vite-plugin';

export default defineConfig(({ mode }) => {
  // Netlify Functions read process.env, but Vite's .env loader does not add
  // unprefixed variables there by default. Load only this server-side secret.
  const localEnv = loadEnv(mode, process.cwd(), 'DASHBOARD_PASSWORD');
  if (!process.env.DASHBOARD_PASSWORD && localEnv.DASHBOARD_PASSWORD) {
    process.env.DASHBOARD_PASSWORD = localEnv.DASHBOARD_PASSWORD;
  }

  return {
    plugins: [
      react(),
      netlify({ edgeFunctions: { enabled: false } }),
      {
        name: 'remove-local-csp',
        configureServer(server) {
          return () => {
            server.middlewares.use((_request, response, next) => {
              response.removeHeader('Content-Security-Policy');
              next();
            });
          };
        },
      },
    ],
  };
});
