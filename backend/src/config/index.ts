import dotenv from 'dotenv';

dotenv.config();

const env = process.env;

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_URL',
  'NODE_ENV',
];

for (const name of requiredEnvVars) {
  if (!env[name]) {
    throw new Error(`Missing environment variable: ${name}`);
  }
}

const cloudinaryName = env.CLOUDINARY_NAME || env.CLOUDINARY_CLOUD_NAME;
if (!cloudinaryName) {
  throw new Error('Missing environment variable: CLOUDINARY_NAME');
}

const cloudinaryKey = env.CLOUDINARY_KEY || env.CLOUDINARY_API_KEY;
if (!cloudinaryKey) {
  throw new Error('Missing environment variable: CLOUDINARY_KEY');
}

const cloudinarySecret = env.CLOUDINARY_SECRET || env.CLOUDINARY_API_SECRET;
if (!cloudinarySecret) {
  throw new Error('Missing environment variable: CLOUDINARY_SECRET');
}

const jwtExpiresIn = env.JWT_EXPIRES_IN || env.JWT_EXPIRY;
if (!jwtExpiresIn) {
  throw new Error('Missing environment variable: JWT_EXPIRES_IN');
}

// EMAIL credentials if enabled
if (env.EMAIL_ENABLED === 'true') {
  if (!env.EMAIL_USER) {
    throw new Error('Missing environment variable: EMAIL_USER');
  }
  if (!env.EMAIL_PASS) {
    throw new Error('Missing environment variable: EMAIL_PASS');
  }
}

export const config = {
  port: Number(env.PORT) || 4000,
  nodeEnv: env.NODE_ENV!,
  databaseUrl: env.DATABASE_URL!,
  jwtSecret: env.JWT_SECRET!,
  jwtExpiresIn: jwtExpiresIn,
  cloudinaryName: cloudinaryName,
  cloudinaryKey: cloudinaryKey,
  cloudinarySecret: cloudinarySecret,
  frontendUrl: env.FRONTEND_URL!,
  checkoutRadiusMeters: Number(env.CHECKOUT_RADIUS_METERS) || 100,
  emailEnabled: env.EMAIL_ENABLED === 'true',
  emailUser: env.EMAIL_USER,
  emailPass: env.EMAIL_PASS,
  emailHost: env.EMAIL_HOST,
  emailPort: Number(env.EMAIL_PORT) || 587,
};
