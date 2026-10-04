import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import prerender from '@prerenderer/rollup-plugin';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    prerender({
      routes: ['/'],
      renderer: '@prerenderer/renderer-puppeteer',
      rendererOptions: {
        maxConcurrentRoutes: 1,
        // Boot overlay lifts at ~1.25s, typewriter + intro take ~2.5s more.
        renderAfterTime: 4000,
        skipThirdPartyRequests: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
      postProcess(renderedRoute) {
        renderedRoute.html = renderedRoute.html.replace(
          /(https:\/\/)?(localhost|127\.0\.0\.1):\d*/gi,
          'https://jedvportfolio.vercel.app'
        );
      },
    }),
  ],
});
