import jwt from 'jsonwebtoken';
import { config } from '../config';

export const generateToken = (payload: {
  id: string;
  role: string;
  email: string;
  mustChangePassword?: boolean;
}): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    throw new Error('Invalid token');
  }
};