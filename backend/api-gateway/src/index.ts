import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(helmet());
app.use(express.json());

// Service registry
const services = {
  identity: 'http://localhost:3002',
  // Add other services here as they are created
};

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Proxy middleware for identity service
app.use(
  '/api/identity',
  createProxyMiddleware({
    target: services.identity,
    changeOrigin: true,
    pathRewrite: {
      '^/api/identity': '', // remove /api/identity from the path
    },
    onProxyReq: (proxyReq, _req, _res) => {
      console.log(
        `[API Gateway] Proxying request to: ${services.identity}${proxyReq.path}`
      );
    },
    onError: (err, _req, res) => {
      console.error('[API Gateway] Proxy error:', err);
      res.status(500).json({ message: 'Proxy error', error: err.message });
    },
  })
);

// Start the server
app.listen(port, () => {
  console.log(`[API Gateway] Server is running on port ${port}`);
});
