/* Dev-only Gemini proxy.

   The browser calls /api/gemini/<model> with no credentials; this proxy runs
   inside the dev server (Node side) and attaches GEMINI_API_KEY from .env, so
   the key never reaches the client bundle.

   The model is part of the path so AiService can fall back to another one
   when a model returns 503 ("high demand"), which happens in bursts.

   This covers `ng serve` only. A deployed build needs a real backend endpoint
   doing the same job — AiService points at the same /api/gemini path either
   way, so nothing in the app changes. */

const fs = require('fs');
const path = require('path');

const DEFAULT_MODEL = 'gemini-3.6-flash';
const ALLOWED = /^[a-z0-9.\-]+$/i;

function apiKey() {
  try {
    const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    const match = env.match(/^GEMINI_API_KEY=(.+)$/m);
    return match ? match[1].trim() : '';
  } catch {
    return '';
  }
}

function toUpstream(requestPath) {
  const [pathname] = requestPath.split('?');
  const model = pathname.replace(/^\/api\/gemini\/?/, '').trim();
  const safe = model && ALLOWED.test(model) ? model : DEFAULT_MODEL;
  return `/v1beta/models/${safe}:generateContent`;
}

module.exports = {
  '/api/gemini': {
    target: 'https://generativelanguage.googleapis.com',
    changeOrigin: true,
    secure: true,
    logLevel: 'warn',
    pathRewrite: toUpstream,
    rewrite: toUpstream,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        const key = apiKey();
        if (key) proxyReq.setHeader('x-goog-api-key', key);
      });
    },
  },
};
