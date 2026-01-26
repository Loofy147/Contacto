// backend/services/identity/src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../lib/prisma';

export const generateToken = (payload: object, expiresIn: string | number = config.jwt.expiresIn) => {
  const options = { expiresIn } as any;
  return jwt.sign(payload, config.jwt.secret, options);
};

export const generateRefreshToken = async (userId: string) => {
  const options = { expiresIn: config.jwt.refreshExpiresIn } as any;
  const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, options);

  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  return refreshToken;
};

export const verifyToken = (token: string, secret = config.jwt.secret) => {
  return jwt.verify(token, secret);
};
