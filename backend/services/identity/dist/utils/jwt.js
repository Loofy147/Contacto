"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateRefreshToken = exports.generateToken = void 0;
// backend/services/identity/src/utils/jwt.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const prisma_1 = require("../lib/prisma");
const generateToken = (payload, expiresIn = config_1.config.jwt.expiresIn) => {
    const options = { expiresIn };
    return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secret, options);
};
exports.generateToken = generateToken;
const generateRefreshToken = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const options = { expiresIn: config_1.config.jwt.refreshExpiresIn };
    const refreshToken = jsonwebtoken_1.default.sign({ userId }, config_1.config.jwt.refreshSecret, options);
    yield prisma_1.prisma.refreshToken.create({
        data: {
            userId,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
    });
    return refreshToken;
});
exports.generateRefreshToken = generateRefreshToken;
const verifyToken = (token, secret = config_1.config.jwt.secret) => {
    return jsonwebtoken_1.default.verify(token, secret);
};
exports.verifyToken = verifyToken;
