"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const authenticate = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer '))) {
        return next(new errors_1.AppError(401, 'UNAUTHORIZED', 'No token provided'));
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        if (typeof decoded === 'object' && decoded !== null) {
            req.user = decoded;
        }
        next();
    }
    catch (error) {
        next(new errors_1.AppError(401, 'UNAUTHORIZED', 'Invalid token'));
    }
};
exports.authenticate = authenticate;
