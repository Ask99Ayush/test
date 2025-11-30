import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

interface Config {
  // Server Configuration
  nodeEnv: string;
  port: number;
  apiVersion: string;
  corsOrigin: string;

  // Database Configuration
  databaseUrl: string;
  mongodbUrl: string;
  redisUrl: string;
  influxdbUrl: string;
  influxdbToken: string;
  influxdbOrg: string;
  influxdbBucket: string;

  // JWT Configuration
  jwtSecret: string;
  jwtExpiration: string;
  refreshTokenSecret: string;
  refreshTokenExpiration: string;

  // Aptos Blockchain Configuration
  aptosNodeUrl: string;
  aptosFaucetUrl: string;
  aptosPrivateKey: string;
  aptosPublicKey: string;
  aptosAccountAddress: string;

  // Smart Contract Addresses
  carbonCreditContractAddress: string;
  marketplaceContractAddress: string;
  reputationContractAddress: string;
  certificateContractAddress: string;

  // AI Service Configuration
  aiServiceUrl: string;
  aiServiceApiKey: string;
  openaiApiKey?: string;
  huggingFaceApiKey?: string;

  // IoT Configuration
  mqttBrokerUrl: string;
  mqttUsername: string;
  mqttPassword: string;
  kafkaBrokerUrl: string;
  iotDataRetentionDays: number;

  // Payment Configuration
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret: string;

  // Email Configuration
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  emailFrom: string;

  // File Upload Configuration
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsRegion: string;
  awsS3Bucket: string;

  // Monitoring & Analytics
  sentryDsn?: string;
  newRelicLicenseKey?: string;
  amplitudeApiKey?: string;

  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;

  // Security
  bcryptRounds: number;
  csrfSecret: string;
  cookieSecret: string;

  // External APIs
  weatherApiKey?: string;
  carbonRegistryApiKey?: string;
  kycApiKey?: string;

  // Development/Testing
  logLevel: string;
  enableQueryLogging: boolean;
  mockBlockchain: boolean;
  mockAiService: boolean;
  mockIotData: boolean;
}

const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value || defaultValue!;
};

const getEnvVarAsNumber = (name: string, defaultValue?: number): number => {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value ? parseInt(value, 10) : defaultValue!;
};

const getEnvVarAsBoolean = (name: string, defaultValue: boolean = false): boolean => {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

export const config: Config = {
  // Server Configuration
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  port: getEnvVarAsNumber('PORT', 3001),
  apiVersion: getEnvVar('API_VERSION', 'v1'),
  corsOrigin: getEnvVar('CORS_ORIGIN', 'http://localhost:3000'),

  // Database Configuration
  databaseUrl: getEnvVar('DATABASE_URL'),
  mongodbUrl: getEnvVar('MONGODB_URL'),
  redisUrl: getEnvVar('REDIS_URL'),
  influxdbUrl: getEnvVar('INFLUXDB_URL'),
  influxdbToken: getEnvVar('INFLUXDB_TOKEN'),
  influxdbOrg: getEnvVar('INFLUXDB_ORG'),
  influxdbBucket: getEnvVar('INFLUXDB_BUCKET'),

  // JWT Configuration
  jwtSecret: getEnvVar('JWT_SECRET'),
  jwtExpiration: getEnvVar('JWT_EXPIRATION', '7d'),
  refreshTokenSecret: getEnvVar('REFRESH_TOKEN_SECRET'),
  refreshTokenExpiration: getEnvVar('REFRESH_TOKEN_EXPIRATION', '30d'),

  // Aptos Blockchain Configuration
  aptosNodeUrl: getEnvVar('APTOS_NODE_URL', 'https://fullnode.devnet.aptoslabs.com/v1'),
  aptosFaucetUrl: getEnvVar('APTOS_FAUCET_URL', 'https://faucet.devnet.aptoslabs.com'),
  aptosPrivateKey: getEnvVar('APTOS_PRIVATE_KEY'),
  aptosPublicKey: getEnvVar('APTOS_PUBLIC_KEY'),
  aptosAccountAddress: getEnvVar('APTOS_ACCOUNT_ADDRESS'),

  // Smart Contract Addresses
  carbonCreditContractAddress: getEnvVar('CARBON_CREDIT_CONTRACT_ADDRESS'),
  marketplaceContractAddress: getEnvVar('MARKETPLACE_CONTRACT_ADDRESS'),
  reputationContractAddress: getEnvVar('REPUTATION_CONTRACT_ADDRESS'),
  certificateContractAddress: getEnvVar('CERTIFICATE_CONTRACT_ADDRESS'),

  // AI Service Configuration
  aiServiceUrl: getEnvVar('AI_SERVICE_URL', 'http://localhost:8000'),
  aiServiceApiKey: getEnvVar('AI_SERVICE_API_KEY'),
  openaiApiKey: process.env.OPENAI_API_KEY,
  huggingFaceApiKey: process.env.HUGGING_FACE_API_KEY,

  // IoT Configuration
  mqttBrokerUrl: getEnvVar('MQTT_BROKER_URL', 'mqtt://localhost:1883'),
  mqttUsername: getEnvVar('MQTT_USERNAME'),
  mqttPassword: getEnvVar('MQTT_PASSWORD'),
  kafkaBrokerUrl: getEnvVar('KAFKA_BROKER_URL', 'localhost:9092'),
  iotDataRetentionDays: getEnvVarAsNumber('IOT_DATA_RETENTION_DAYS', 90),

  // Payment Configuration
  stripeSecretKey: getEnvVar('STRIPE_SECRET_KEY'),
  stripePublishableKey: getEnvVar('STRIPE_PUBLISHABLE_KEY'),
  stripeWebhookSecret: getEnvVar('STRIPE_WEBHOOK_SECRET'),

  // Email Configuration
  smtpHost: getEnvVar('SMTP_HOST', 'smtp.gmail.com'),
  smtpPort: getEnvVarAsNumber('SMTP_PORT', 587),
  smtpSecure: getEnvVarAsBoolean('SMTP_SECURE', false),
  smtpUser: getEnvVar('SMTP_USER'),
  smtpPass: getEnvVar('SMTP_PASS'),
  emailFrom: getEnvVar('EMAIL_FROM', 'Carbon Marketplace <noreply@carbonmarketplace.com>'),

  // File Upload Configuration
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: getEnvVar('AWS_REGION', 'us-east-1'),
  awsS3Bucket: getEnvVar('AWS_S3_BUCKET'),

  // Monitoring & Analytics
  sentryDsn: process.env.SENTRY_DSN,
  newRelicLicenseKey: process.env.NEW_RELIC_LICENSE_KEY,
  amplitudeApiKey: process.env.AMPLITUDE_API_KEY,

  // Rate Limiting
  rateLimitWindowMs: getEnvVarAsNumber('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
  rateLimitMaxRequests: getEnvVarAsNumber('RATE_LIMIT_MAX_REQUESTS', 1000),

  // Security
  bcryptRounds: getEnvVarAsNumber('BCRYPT_ROUNDS', 12),
  csrfSecret: getEnvVar('CSRF_SECRET'),
  cookieSecret: getEnvVar('COOKIE_SECRET'),

  // External APIs
  weatherApiKey: process.env.WEATHER_API_KEY,
  carbonRegistryApiKey: process.env.CARBON_REGISTRY_API_KEY,
  kycApiKey: process.env.KYC_API_KEY,

  // Development/Testing
  logLevel: getEnvVar('LOG_LEVEL', 'info'),
  enableQueryLogging: getEnvVarAsBoolean('ENABLE_QUERY_LOGGING', false),
  mockBlockchain: getEnvVarAsBoolean('MOCK_BLOCKCHAIN', false),
  mockAiService: getEnvVarAsBoolean('MOCK_AI_SERVICE', false),
  mockIotData: getEnvVarAsBoolean('MOCK_IOT_DATA', false),
};

// Validate critical configuration
if (config.nodeEnv === 'production') {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'APTOS_PRIVATE_KEY',
    'AI_SERVICE_API_KEY',
    'STRIPE_SECRET_KEY',
    'SMTP_USER',
    'SMTP_PASS',
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Environment variable ${varName} is required in production`);
    }
  }
}

export default config;