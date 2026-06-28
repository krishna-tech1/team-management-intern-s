import dotenv from 'dotenv';

dotenv.config();

const env = process.env;

export const config = {
  port: Number(env.PORT) || 4000,
  nodeEnv: env.NODE_ENV || 'development',
  databaseUrl: env.DATABASE_URL || '',
};

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL must be defined in environment variables');
}
