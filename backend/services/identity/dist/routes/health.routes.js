"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
// backend/services/identity/src/routes/health.routes.ts
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.healthRoutes = router;
router.get('/', (_req, res) => {
    res.json({ status: 'UP' });
});
