import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { config } from './environment';

// Create Prisma client instance
export const prisma = new PrismaClient({
  log: config.enableQueryLogging ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
  datasources: {
    db: {
      url: config.databaseUrl
    }
  }
});

// Database connection function
export async function connectDatabase(): Promise<void> {
  try {
    // Test the connection
    await prisma.$connect();

    // Test query to ensure database is working
    await prisma.$queryRaw`SELECT 1`;

    logger.info('✅ PostgreSQL database connected successfully');

    // Set up connection event handlers
    prisma.$on('beforeExit', async () => {
      logger.info('Prisma client disconnecting...');
    });

  } catch (error) {
    logger.error('❌ Failed to connect to PostgreSQL database:', error);
    throw new Error('Database connection failed');
  }
}

// Graceful shutdown function
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('✅ Database disconnected successfully');
  } catch (error) {
    logger.error('❌ Error disconnecting from database:', error);
  }
}

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

// Transaction helper
export async function withTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback);
}

export default prisma;