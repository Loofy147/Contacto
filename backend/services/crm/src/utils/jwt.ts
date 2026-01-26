import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../lib/prisma';

export const generateToken = (payload: any, expiresIn: any = config.jwt.expiresIn): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
};

export const generateRefreshToken = async (userId: string): Promise<string> => {
  const token = jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as any,
  });

  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  return token;
};

export const verifyToken = (token: string, secret: string = config.jwt.secret): any => {
  return jwt.verify(token, secret);
};
