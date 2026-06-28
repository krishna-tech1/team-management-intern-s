import http from 'http';
import app from './app';
import { config } from './config/index';
import { logger } from './utils/logger';
import prisma from './config/prisma';
import { createSuperAdmin } from './modules/auth/createsuperadmin';

const server = http.createServer(app);
const port = config.port;

async function main() {
  try {
    await prisma.$connect();

    await createSuperAdmin();

    logger.info('✅ Database connected');

    server.listen(port, () => {
      logger.info(`🚀 Server listening on http://localhost:${port}`);
    });

  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

main();

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close();
  logger.info('Server closed');
});