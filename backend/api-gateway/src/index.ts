import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true
}));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'api-gateway' });
});

// Proxy routes
const services = [
  {
    path: ['/api/v1/auth', '/api/v1/users'],
    target: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3002',
  },
  {
    path: ['/api/v1/professionals'],
    target: process.env.PROFESSIONALS_SERVICE_URL || 'http://localhost:3003',
  },
  {
    path: ['/api/v1/crm'],
    target: process.env.CRM_SERVICE_URL || 'http://localhost:3001',
  }
];

services.forEach(service => {
  service.path.forEach(path => {
    app.use(path, createProxyMiddleware({
      target: service.target,
      changeOrigin: true,
    }));
  });
});

// Error handling for proxy
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Proxy Error]', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'GATEWAY_ERROR',
      message: 'Error communicating with backend service',
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
});
