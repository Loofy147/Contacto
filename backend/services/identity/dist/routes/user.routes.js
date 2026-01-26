"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
// backend/services/identity/src/routes/user.routes.ts
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.userRoutes = router;
// Placeholder for user routes
router.get('/', (_req, res) => {
    res.json({ message: 'User service' });
});
