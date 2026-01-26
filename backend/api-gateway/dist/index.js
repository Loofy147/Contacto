"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middleware
app.use((0, morgan_1.default)('dev'));
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
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
app.use('/api/identity', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: services.identity,
    changeOrigin: true,
    pathRewrite: {
        '^/api/identity': '', // remove /api/identity from the path
    },
    onProxyReq: (proxyReq, _req, _res) => {
        console.log(`[API Gateway] Proxying request to: ${services.identity}${proxyReq.path}`);
    },
    onError: (err, _req, res) => {
        console.error('[API Gateway] Proxy error:', err);
        res.status(500).json({ message: 'Proxy error', error: err.message });
    },
}));
// Start the server
app.listen(port, () => {
    console.log(`[API Gateway] Server is running on port ${port}`);
});
