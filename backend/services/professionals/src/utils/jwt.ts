import jwt from 'jsonwebtoken';
import { config } from '../config';

export const generateToken = (payload: any, expiresIn: any = '7d'): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, config.jwt.secret);
};

// Placeholder for compatibility if needed
export const generateRefreshToken = async (userId: string): Promise<string> => {
  return jwt.sign({ userId }, config.jwt.secret, { expiresIn: '30d' });
};
