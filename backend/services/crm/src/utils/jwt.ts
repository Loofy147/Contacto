import jwt from 'jsonwebtoken';
import { config } from '../config';

export const generateToken = (payload: any, expiresIn: any = config.jwt.expiresIn): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
};

export const verifyToken = (token: string, secret: string = config.jwt.secret): any => {
  return jwt.verify(token, secret);
};
