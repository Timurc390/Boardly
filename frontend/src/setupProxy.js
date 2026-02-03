const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  // Proxy API requests to Django backend in dev.
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      logLevel: 'warn',
    })
  );

  // Proxy WebSocket traffic for realtime board updates.
  app.use(
    '/ws',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      ws: true,
      logLevel: 'warn',
    })
  );
};
