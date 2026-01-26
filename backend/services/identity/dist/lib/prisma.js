"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// backend/services/identity/src/lib/prisma.ts
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient();
