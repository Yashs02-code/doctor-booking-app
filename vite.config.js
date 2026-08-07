import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { pathToFileURL } from 'url'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'local-api-handler',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url.startsWith('/api/make-call') || req.url.startsWith('/api/voice-webhook')) {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                req.body = body ? JSON.parse(body) : {};
                const fileName = req.url.startsWith('/api/voice-webhook') ? 'voice-webhook.js' : 'make-call.js';
                const absolutePath = path.resolve(process.cwd(), 'api', fileName);
                const fileUrl = pathToFileURL(absolutePath).href;
                const apiModule = await import(fileUrl);
                const handler = apiModule.default;
                
                // Polyfill Vercel response helper methods
                res.status = (code) => { res.statusCode = code; return res; };
                res.json = (data) => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                  return res;
                };

                await handler(req, res);
              } catch (err) {
                console.error('Local API dev handler error:', err);
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
            return;
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 3000,
    proxy: {
      '/api/omnidim': {
        target: 'https://omnidim.io',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/omnidim/, '')
      }
    }
  },
})
