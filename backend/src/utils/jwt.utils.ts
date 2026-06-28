import jwt from 'jsonwebtoken';

export const generateToken = (payload: {
  id: string;
  role: string;
  email: string;
}): string => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRY || '7d',
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string);
  } catch {
    throw new Error('Invalid token');
  }
};