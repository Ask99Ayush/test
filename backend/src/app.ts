import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

// Import configurations and utilities
import { config } from './config/environment';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { validationMiddleware } from './middleware/validation.middleware';

// Import database connections
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { connectMongoDB } from './config/mongodb';
import { connectInfluxDB } from './config/influxdb';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import projectRoutes from './routes/project.routes';
import creditRoutes from './routes/credit.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import certificateRoutes from './routes/certificate.routes';
import iotRoutes from './routes/iot.routes';
import aiRoutes from './routes/ai.routes';
import transactionRoutes from './routes/transaction.routes';
import adminRoutes from './routes/admin.routes';

// Import services
import { WebSocketService } from './services/websocket.service';
import { BlockchainService } from './services/blockchain.service';
import { IoTService } from './services/iot.service';

class App {
  public app: express.Application;
  public server: any;
  public io: SocketServer;
  private websocketService: WebSocketService;
  private blockchainService: BlockchainService;
  private iotService: IoTService;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketServer(this.server, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeServices();
    this.initializeWebSocket();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.corsOrigin,
      credentials: true,
      optionsSuccessStatus: 200
    }));

    // Compression
    this.app.use(compression());

    // Request logging
    this.app.use(morgan('combined', {
      stream: { write: (message: string) => logger.info(message.trim()) }
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimitWindowMs,
      max: config.rateLimitMaxRequests,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(config.rateLimitWindowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request ID for tracking
    this.app.use((req, res, next) => {
      req.id = Math.random().toString(36).substring(2, 15);
      res.setHeader('X-Request-ID', req.id);
      next();
    });

    // API health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.nodeEnv
      });
    });
  }

  private initializeRoutes(): void {
    const apiRouter = express.Router();

    // Public routes (no authentication required)
    apiRouter.use('/auth', authRoutes);

    // Protected routes (authentication required)
    apiRouter.use('/users', authMiddleware, userRoutes);
    apiRouter.use('/projects', authMiddleware, projectRoutes);
    apiRouter.use('/credits', authMiddleware, creditRoutes);
    apiRouter.use('/marketplace', authMiddleware, marketplaceRoutes);
    apiRouter.use('/certificates', authMiddleware, certificateRoutes);
    apiRouter.use('/iot', authMiddleware, iotRoutes);
    apiRouter.use('/ai', authMiddleware, aiRoutes);
    apiRouter.use('/transactions', authMiddleware, transactionRoutes);

    // Admin routes (admin authentication required)
    apiRouter.use('/admin', authMiddleware, adminRoutes);

    // Mount all routes under /api/v1
    this.app.use(`/api/${config.apiVersion}`, apiRouter);

    // API documentation
    this.app.get('/api/docs', (req, res) => {
      res.json({
        name: 'Carbon Offset Marketplace API',
        version: config.apiVersion,
        description: 'API for carbon credit trading on Aptos blockchain',
        endpoints: {
          auth: '/api/v1/auth',
          users: '/api/v1/users',
          projects: '/api/v1/projects',
          credits: '/api/v1/credits',
          marketplace: '/api/v1/marketplace',
          certificates: '/api/v1/certificates',
          iot: '/api/v1/iot',
          ai: '/api/v1/ai',
          transactions: '/api/v1/transactions',
          admin: '/api/v1/admin'
        }
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      this.server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      this.server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize blockchain service
      this.blockchainService = new BlockchainService();
      await this.blockchainService.initialize();

      // Initialize IoT service
      this.iotService = new IoTService();
      await this.iotService.initialize();

      logger.info('All services initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize services:', error);
      process.exit(1);
    }
  }

  private initializeWebSocket(): void {
    this.websocketService = new WebSocketService(this.io);
    this.websocketService.initialize();

    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });

      // Join user-specific room for notifications
      socket.on('join-user-room', (userId: string) => {
        socket.join(`user:${userId}`);
        logger.info(`Socket ${socket.id} joined room user:${userId}`);
      });

      // Join marketplace room for real-time updates
      socket.on('join-marketplace', () => {
        socket.join('marketplace');
        logger.info(`Socket ${socket.id} joined marketplace room`);
      });

      // Join IoT monitoring room
      socket.on('join-iot-monitoring', (projectId: string) => {
        socket.join(`iot:${projectId}`);
        logger.info(`Socket ${socket.id} joined IoT monitoring for project ${projectId}`);
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Connect to databases
      await connectDatabase();
      await connectRedis();
      await connectMongoDB();
      await connectInfluxDB();

      // Start server
      this.server.listen(config.port, () => {
        logger.info(`🚀 Carbon Offset Marketplace API server running on port ${config.port}`);
        logger.info(`📚 API Documentation: http://localhost:${config.port}/api/docs`);
        logger.info(`🏥 Health Check: http://localhost:${config.port}/health`);
        logger.info(`🌐 Environment: ${config.nodeEnv}`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }

  public getServer(): any {
    return this.server;
  }

  public getIO(): SocketServer {
    return this.io;
  }
}

// Create and export app instance
const app = new App();

export default app;
export { app };

// Start the server if this file is run directly
if (require.main === module) {
  app.start().catch((error) => {
    logger.error('Failed to start application:', error);
    process.exit(1);
  });
}