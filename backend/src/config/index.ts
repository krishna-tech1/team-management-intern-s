import dotenv from 'dotenv';

dotenv.config();

const env = process.env;

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_URL',
  'NODE_ENV',
];

const missingEnvVars: string[] = [];

for (const name of requiredEnvVars) {
  if (!env[name]) {
    missingEnvVars.push(name);
  }
}

const cloudinaryName = env.CLOUDINARY_NAME || env.CLOUDINARY_CLOUD_NAME;
if (!cloudinaryName) {
  missingEnvVars.push('CLOUDINARY_NAME');
}

const cloudinaryKey = env.CLOUDINARY_KEY || env.CLOUDINARY_API_KEY;
if (!cloudinaryKey) {
  missingEnvVars.push('CLOUDINARY_KEY');
}

const cloudinarySecret = env.CLOUDINARY_SECRET || env.CLOUDINARY_API_SECRET;
if (!cloudinarySecret) {
  missingEnvVars.push('CLOUDINARY_SECRET');
}

const jwtExpiresIn = env.JWT_EXPIRES_IN || env.JWT_EXPIRY;
if (!jwtExpiresIn) {
  missingEnvVars.push('JWT_EXPIRES_IN');
}

// EMAIL credentials if enabled
if (env.EMAIL_ENABLED === 'true') {
  if (!env.EMAIL_USER) {
    missingEnvVars.push('EMAIL_USER');
  }
  if (!env.EMAIL_PASS) {
    missingEnvVars.push('EMAIL_PASS');
  }
}

if (missingEnvVars.length > 0) {
  console.error('⚠️ Startup Warning: The following environment variables are missing:', missingEnvVars.join(', '));
}

export const config = {
  port: Number(env.PORT) || 4000,
  nodeEnv: env.NODE_ENV || 'production',
  databaseUrl: env.DATABASE_URL || '',
  jwtSecret: env.JWT_SECRET || '',
  jwtExpiresIn: jwtExpiresIn || '7d',
  cloudinaryName: cloudinaryName || '',
  cloudinaryKey: cloudinaryKey || '',
  cloudinarySecret: cloudinarySecret || '',
  frontendUrl: env.FRONTEND_URL || '',
  checkoutRadiusMeters: Number(env.CHECKOUT_RADIUS_METERS) || 100,
  emailEnabled: env.EMAIL_ENABLED === 'true',
  emailUser: env.EMAIL_USER,
  emailPass: env.EMAIL_PASS,
  emailHost: env.EMAIL_HOST,
  emailPort: Number(env.EMAIL_PORT) || 587,
  missingEnvVars,
};
