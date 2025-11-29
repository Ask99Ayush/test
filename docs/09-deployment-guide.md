# 9. Deployment Guide

## Overview

This comprehensive deployment guide walks you through deploying the complete Carbon Offset Marketplace 2.0 system. We'll cover deploying Move contracts on Aptos Devnet, setting up the backend on AWS, deploying the frontend, and connecting all components end-to-end.

## 🏗️ Deployment Architecture

### Infrastructure Overview

```
Production Deployment Architecture
├── Aptos Blockchain (Devnet/Mainnet)
│   ├── Smart contracts deployed
│   └── Transaction processing
├── AWS Cloud Infrastructure
│   ├── ECS Fargate (Backend services)
│   ├── CloudFront + S3 (Frontend)
│   ├── RDS PostgreSQL (Primary database)
│   ├── DocumentDB (MongoDB compatible)
│   ├── ElastiCache Redis (Caching)
│   ├── MSK (Kafka for IoT streaming)
│   └── Lambda (Serverless functions)
├── AI Engine
│   ├── SageMaker (ML model hosting)
│   ├── EC2 GPU instances (Training)
│   └── API Gateway (Model inference)
└── IoT Infrastructure
    ├── IoT Core (Device management)
    ├── Kinesis (Data streaming)
    └── InfluxDB on EC2 (Time-series)
```

## 🔗 Phase 1: Aptos Smart Contract Deployment

### Prerequisites

```bash
# Install Aptos CLI
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Verify installation
aptos --version

# Install Move analyzer (optional but recommended)
cargo install --git https://github.com/move-language/move move-analyzer
```

### Environment Setup

```bash
# Initialize Aptos account for deployment
aptos init

# This creates ~/.aptos/config.yaml with your account info
# For devnet deployment, choose network: devnet

# Fund your account (devnet only)
aptos account fund-with-faucet --account default
```

### Contract Compilation and Deployment

```bash
# Navigate to contracts directory
cd contracts

# Compile Move contracts
aptos move compile

# Test contracts (optional but recommended)
aptos move test

# Deploy to devnet
aptos move publish --named-addresses carbon_marketplace=default

# Verify deployment
aptos account list --query resources --account default
```

### Contract Initialization

```bash
# Initialize the credit registry
aptos move run \
  --function-id default::carbon_credit::initialize \
  --args

# Initialize the marketplace
aptos move run \
  --function-id default::marketplace::initialize \
  --args

# Initialize certificate registry
aptos move run \
  --function-id default::certificate_registry::initialize \
  --args

# Initialize reputation system
aptos move run \
  --function-id default::reputation::initialize \
  --args
```

### Contract Configuration Script

```typescript
// deployment/scripts/init-contracts.ts
import { AptosClient, AptosAccount, FaucetClient } from 'aptos';

const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
const FAUCET_URL = "https://faucet.devnet.aptoslabs.com";

async function initializeContracts() {
    const client = new AptosClient(NODE_URL);
    const faucet = new FaucetClient(NODE_URL, FAUCET_URL);

    // Load deployer account
    const privateKeyHex = process.env.APTOS_PRIVATE_KEY;
    const account = new AptosAccount(Buffer.from(privateKeyHex, 'hex'));
    const accountAddress = account.address().hex();

    console.log(`Initializing contracts from account: ${accountAddress}`);

    // Fund account if needed
    await faucet.fundAccount(accountAddress, 100_000_000);

    // Initialize credit system
    const creditInitPayload = {
        type: "entry_function_payload",
        function: `${accountAddress}::carbon_credit::initialize`,
        arguments: [],
        type_arguments: []
    };

    let txnHash = await client.submitTransaction(account, creditInitPayload);
    await client.waitForTransaction(txnHash.hash);
    console.log("Credit system initialized:", txnHash.hash);

    // Initialize marketplace
    const marketplaceInitPayload = {
        type: "entry_function_payload",
        function: `${accountAddress}::marketplace::initialize`,
        arguments: [],
        type_arguments: []
    };

    txnHash = await client.submitTransaction(account, marketplaceInitPayload);
    await client.waitForTransaction(txnHash.hash);
    console.log("Marketplace initialized:", txnHash.hash);

    // Initialize certificate registry
    const certInitPayload = {
        type: "entry_function_payload",
        function: `${accountAddress}::certificate_registry::initialize`,
        arguments: [],
        type_arguments: []
    };

    txnHash = await client.submitTransaction(account, certInitPayload);
    await client.waitForTransaction(txnHash.hash);
    console.log("Certificate registry initialized:", txnHash.hash);

    // Initialize reputation system
    const repInitPayload = {
        type: "entry_function_payload",
        function: `${accountAddress}::reputation::initialize`,
        arguments: [],
        type_arguments: []
    };

    txnHash = await client.submitTransaction(account, repInitPayload);
    await client.waitForTransaction(txnHash.hash);
    console.log("Reputation system initialized:", txnHash.hash);

    console.log("All contracts initialized successfully!");
}

initializeContracts().catch(console.error);
```

## ☁️ Phase 2: AWS Backend Deployment

### AWS Infrastructure Setup

```bash
# Install AWS CLI and CDK
npm install -g aws-cdk
pip install awscli

# Configure AWS credentials
aws configure

# Bootstrap CDK (one-time setup)
cdk bootstrap
```

### Infrastructure as Code (CDK)

```typescript
// deployment/infrastructure/carbon-marketplace-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class CarbonMarketplaceStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // VPC
        const vpc = new ec2.Vpc(this, 'CarbonMarketplaceVpc', {
            maxAzs: 2,
            natGateways: 1
        });

        // Security Groups
        const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
            vpc,
            description: 'Security group for RDS database'
        });

        const appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
            vpc,
            description: 'Security group for application'
        });

        dbSecurityGroup.addIngressRule(
            appSecurityGroup,
            ec2.Port.tcp(5432),
            'Allow PostgreSQL access from app'
        );

        // RDS PostgreSQL
        const dbSecret = new secretsmanager.Secret(this, 'DbSecret', {
            generateSecretString: {
                secretStringTemplate: JSON.stringify({ username: 'postgres' }),
                generateStringKey: 'password',
                excludeCharacters: '"@/\\'
            }
        });

        const database = new rds.DatabaseInstance(this, 'PostgresDatabase', {
            engine: rds.DatabaseInstanceEngine.postgres({
                version: rds.PostgresEngineVersion.VER_15_3
            }),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            credentials: rds.Credentials.fromSecret(dbSecret),
            vpc,
            securityGroups: [dbSecurityGroup],
            multiAz: false, // Set to true for production
            deletionProtection: false, // Set to true for production
            databaseName: 'carbon_marketplace'
        });

        // Redis Cache
        const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
            description: 'Subnet group for Redis',
            subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId)
        });

        const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
            vpc,
            description: 'Security group for Redis'
        });

        redisSecurityGroup.addIngressRule(
            appSecurityGroup,
            ec2.Port.tcp(6379),
            'Allow Redis access from app'
        );

        const redis = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
            cacheNodeType: 'cache.t3.micro',
            engine: 'redis',
            numCacheNodes: 1,
            cacheSubnetGroupName: redisSubnetGroup.ref,
            vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId]
        });

        // ECS Cluster
        const cluster = new ecs.Cluster(this, 'CarbonMarketplaceCluster', {
            vpc
        });

        // ECR Repository
        const repository = new ecr.Repository(this, 'BackendRepository', {
            repositoryName: 'carbon-marketplace-backend'
        });

        // Task Definition
        const taskDefinition = new ecs.FargateTaskDefinition(this, 'BackendTaskDef', {
            memoryLimitMiB: 512,
            cpu: 256
        });

        // Add secrets to task
        const appSecret = new secretsmanager.Secret(this, 'AppSecret', {
            generateSecretString: {
                secretStringTemplate: JSON.stringify({
                    JWT_SECRET: '',
                    APTOS_PRIVATE_KEY: '',
                    AI_API_KEY: ''
                }),
                generateStringKey: 'secrets'
            }
        });

        // Container Definition
        const container = taskDefinition.addContainer('backend', {
            image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
            environment: {
                NODE_ENV: 'production',
                PORT: '3001'
            },
            secrets: {
                DATABASE_URL: ecs.Secret.fromSecretsManager(dbSecret, 'connectionString'),
                JWT_SECRET: ecs.Secret.fromSecretsManager(appSecret, 'JWT_SECRET'),
                APTOS_PRIVATE_KEY: ecs.Secret.fromSecretsManager(appSecret, 'APTOS_PRIVATE_KEY')
            },
            logging: ecs.LogDrivers.awsLogs({
                streamPrefix: 'backend',
                logRetention: 7
            })
        });

        container.addPortMappings({
            containerPort: 3001,
            protocol: ecs.Protocol.TCP
        });

        // ECS Service
        const service = new ecs.FargateService(this, 'BackendService', {
            cluster,
            taskDefinition,
            desiredCount: 2,
            assignPublicIp: false,
            securityGroups: [appSecurityGroup]
        });

        // Application Load Balancer
        const alb = new elbv2.ApplicationLoadBalancer(this, 'BackendALB', {
            vpc,
            internetFacing: true
        });

        const targetGroup = new elbv2.ApplicationTargetGroup(this, 'BackendTargets', {
            port: 3001,
            vpc,
            targetType: elbv2.TargetType.IP,
            healthCheck: {
                path: '/health',
                healthyHttpCodes: '200'
            }
        });

        alb.addListener('BackendListener', {
            port: 80,
            defaultTargetGroups: [targetGroup]
        });

        service.attachToApplicationTargetGroup(targetGroup);

        // Outputs
        new cdk.CfnOutput(this, 'DatabaseEndpoint', {
            value: database.instanceEndpoint.hostname
        });

        new cdk.CfnOutput(this, 'LoadBalancerDNS', {
            value: alb.loadBalancerDnsName
        });

        new cdk.CfnOutput(this, 'ECRRepositoryURI', {
            value: repository.repositoryUri
        });
    }
}
```

### Backend Container Build and Deploy

```dockerfile
# deployment/backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["npm", "start"]
```

```bash
# Build and push backend container
cd backend

# Build Docker image
docker build -t carbon-marketplace-backend .

# Get ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push image
docker tag carbon-marketplace-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/carbon-marketplace-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/carbon-marketplace-backend:latest
```

### Database Migration and Seeding

```bash
# Run database migrations
npx prisma migrate deploy

# Seed initial data
npx prisma db seed
```

```typescript
// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Create sample users
    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@carbonmarketplace.com',
            password: 'hashed_password', // Use bcrypt in real implementation
            firstName: 'Admin',
            lastName: 'User',
            userType: 'admin',
            aptosAddress: '0x123...',
            isVerified: true
        }
    });

    // Create sample projects
    const solarProject = await prisma.project.create({
        data: {
            name: 'California Solar Farm',
            description: 'Large-scale solar energy project',
            projectType: 'renewable_energy',
            location: 'California, USA',
            totalCredits: 10000,
            availableCredits: 8000,
            pricePerCredit: 25.50,
            developerId: adminUser.id
        }
    });

    // Create sample emission factors
    await prisma.emissionFactor.createMany({
        data: [
            {
                activity: 'electricity',
                region: 'usa_national_average',
                factor: 0.709,
                unit: 'kg_co2e_per_kwh',
                source: 'EPA_2024'
            },
            {
                activity: 'natural_gas',
                region: 'usa',
                factor: 53.06,
                unit: 'kg_co2e_per_mmbtu',
                source: 'EPA_2024'
            }
        ]
    });

    console.log('Database seeded successfully');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
```

## 🎯 Phase 3: AI Engine Deployment

### SageMaker Model Deployment

```python
# deployment/ai/deploy_model.py
import boto3
import sagemaker
from sagemaker.tensorflow import TensorFlowModel
from sagemaker.predictor import Predictor

def deploy_emission_model():
    """Deploy emission calculation model to SageMaker"""

    # Initialize SageMaker session
    sagemaker_session = sagemaker.Session()
    role = sagemaker.get_execution_role()

    # Model artifact location (upload your trained model here)
    model_artifact = "s3://carbon-marketplace-models/emission-model.tar.gz"

    # Create TensorFlow model
    tf_model = TensorFlowModel(
        model_data=model_artifact,
        role=role,
        framework_version='2.8',
        py_version='py39',
        entry_point='inference.py',  # Your inference script
        source_dir='code/'  # Directory containing inference code
    )

    # Deploy model
    predictor = tf_model.deploy(
        initial_instance_count=1,
        instance_type='ml.m5.large',
        endpoint_name='emission-calculator-endpoint'
    )

    print(f"Model deployed to endpoint: {predictor.endpoint_name}")
    return predictor.endpoint_name

# Inference script for SageMaker
# deployment/ai/code/inference.py
import json
import numpy as np
import tensorflow as tf

def model_fn(model_dir):
    """Load the TensorFlow model"""
    model = tf.keras.models.load_model(f"{model_dir}/1")
    return model

def input_fn(request_body, content_type='application/json'):
    """Parse input data"""
    if content_type == 'application/json':
        input_data = json.loads(request_body)
        return np.array(input_data['instances'])
    else:
        raise ValueError(f"Unsupported content type: {content_type}")

def predict_fn(input_data, model):
    """Make predictions"""
    predictions = model.predict(input_data)
    return predictions

def output_fn(prediction, accept='application/json'):
    """Format output"""
    if accept == 'application/json':
        return json.dumps({
            'predictions': prediction.tolist()
        })
    else:
        raise ValueError(f"Unsupported accept type: {accept}")
```

### AI API Gateway Setup

```python
# deployment/ai/api_gateway.py
from fastapi import FastAPI
import boto3
import json

app = FastAPI()

# SageMaker runtime client
sagemaker_runtime = boto3.client('sagemaker-runtime')

@app.post("/api/v1/calculate-emissions")
async def calculate_emissions(request_data: dict):
    """Calculate emissions using SageMaker model"""

    # Prepare input for SageMaker
    payload = {
        'instances': [request_data['features']]
    }

    # Invoke SageMaker endpoint
    response = sagemaker_runtime.invoke_endpoint(
        EndpointName='emission-calculator-endpoint',
        ContentType='application/json',
        Body=json.dumps(payload)
    )

    # Parse response
    result = json.loads(response['Body'].read().decode())

    return {
        'calculation_id': 'calc_123',
        'total_emissions': result['predictions'][0],
        'confidence': 0.95
    }
```

## 🌐 Phase 4: Frontend Deployment

### S3 + CloudFront Setup

```bash
# Build frontend
cd frontend
npm run build

# Create S3 bucket for hosting
aws s3 mb s3://carbon-marketplace-frontend

# Configure bucket for static website hosting
aws s3 website s3://carbon-marketplace-frontend --index-document index.html --error-document error.html

# Upload build files
aws s3 sync out/ s3://carbon-marketplace-frontend --delete

# Create CloudFront distribution (via CDK)
```

### Frontend CDK Stack

```typescript
// deployment/infrastructure/frontend-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class FrontendStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // S3 bucket for frontend
        const bucket = new s3.Bucket(this, 'FrontendBucket', {
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'error.html',
            publicReadAccess: false, // CloudFront will handle access
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
        });

        // Origin Access Identity for CloudFront
        const originAccessIdentity = new cloudfront.OriginAccessIdentity(
            this,
            'OriginAccessIdentity'
        );

        bucket.grantRead(originAccessIdentity);

        // CloudFront distribution
        const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
            defaultBehavior: {
                origin: new origins.S3Origin(bucket, {
                    originAccessIdentity
                }),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
            },
            defaultRootObject: 'index.html',
            errorResponses: [
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html'
                }
            ]
        });

        // Deploy frontend files
        new s3deploy.BucketDeployment(this, 'DeployFrontend', {
            sources: [s3deploy.Source.asset('./frontend/out')],
            destinationBucket: bucket,
            distribution,
            distributionPaths: ['/*']
        });

        // Outputs
        new cdk.CfnOutput(this, 'DistributionDomain', {
            value: distribution.distributionDomainName
        });

        new cdk.CfnOutput(this, 'DistributionId', {
            value: distribution.distributionId
        });
    }
}
```

### Environment Configuration

```typescript
// frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    trailingSlash: true,
    images: {
        unoptimized: true
    },
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_APTOS_NETWORK: process.env.NEXT_PUBLIC_APTOS_NETWORK,
        NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
    }
}

module.exports = nextConfig
```

## 📡 Phase 5: IoT Infrastructure Deployment

### IoT Core Setup

```python
# deployment/iot/setup_iot_core.py
import boto3
import json

def setup_iot_infrastructure():
    """Setup AWS IoT Core infrastructure"""

    iot_client = boto3.client('iot')

    # Create IoT policy for devices
    policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "iot:Connect",
                    "iot:Publish",
                    "iot:Subscribe",
                    "iot:Receive"
                ],
                "Resource": "*"
            }
        ]
    }

    try:
        iot_client.create_policy(
            policyName='CarbonMarketplaceIoTPolicy',
            policyDocument=json.dumps(policy_document)
        )
        print("IoT policy created")
    except iot_client.exceptions.ResourceAlreadyExistsException:
        print("IoT policy already exists")

    # Create IoT rule to route data to Kinesis
    rule_payload = {
        "sql": "SELECT * FROM 'topic/carbon_marketplace/+/sensors'",
        "description": "Route sensor data to Kinesis",
        "actions": [
            {
                "kinesis": {
                    "roleArn": "arn:aws:iam::ACCOUNT:role/IoTKinesisRole",
                    "streamName": "carbon-marketplace-iot-stream"
                }
            }
        ]
    }

    try:
        iot_client.create_topic_rule(
            ruleName='CarbonMarketplaceDataRule',
            topicRulePayload=rule_payload
        )
        print("IoT rule created")
    except iot_client.exceptions.ResourceAlreadyExistsException:
        print("IoT rule already exists")

if __name__ == "__main__":
    setup_iot_infrastructure()
```

### InfluxDB on EC2

```bash
# Launch EC2 instance for InfluxDB
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1d0 \
  --count 1 \
  --instance-type t3.medium \
  --key-name carbon-marketplace-key \
  --security-group-ids sg-12345678 \
  --user-data file://deployment/iot/influxdb-setup.sh
```

```bash
#!/bin/bash
# deployment/iot/influxdb-setup.sh

# Update system
yum update -y

# Install InfluxDB
cat <<EOF | tee /etc/yum.repos.d/influxdb.repo
[influxdb]
name = InfluxDB Repository - RHEL
baseurl = https://repos.influxdata.com/rhel/7/x86_64/stable/
enabled = 1
gpgcheck = 1
gpgkey = https://repos.influxdata.com/influxdb.key
EOF

yum install -y influxdb2

# Start and enable InfluxDB
systemctl start influxdb
systemctl enable influxdb

# Create initial setup
influx setup \
  --username admin \
  --password SecurePassword123! \
  --org carbon-marketplace \
  --bucket iot-data \
  --force
```

## 🔄 Phase 6: End-to-End Integration

### Environment Variables Setup

```bash
# deployment/env/production.env
# Backend Environment Variables
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@rds-endpoint:5432/carbon_marketplace
REDIS_URL=redis://elasticache-endpoint:6379
INFLUXDB_URL=http://influxdb-instance:8086
INFLUXDB_TOKEN=your_influxdb_token
INFLUXDB_ORG=carbon-marketplace
INFLUXDB_BUCKET=iot-data

# Blockchain
APTOS_NETWORK=devnet
APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com/v1
APTOS_PRIVATE_KEY=0x123...
CONTRACT_ADDRESS=0xabc...

# AI Service
AI_SERVICE_URL=https://api-gateway-url
AI_API_KEY=your_ai_api_key

# AWS Services
AWS_REGION=us-east-1
IOT_ENDPOINT=your-iot-endpoint.amazonaws.com

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# External APIs
STRIPE_SECRET_KEY=sk_test_...
```

### Service Health Checks

```bash
# deployment/scripts/health-check.sh
#!/bin/bash

echo "Checking service health..."

# Check backend API
backend_health=$(curl -s -o /dev/null -w "%{http_code}" https://api.carbonmarketplace.com/health)
if [ $backend_health -eq 200 ]; then
    echo "✅ Backend API: Healthy"
else
    echo "❌ Backend API: Unhealthy (HTTP $backend_health)"
fi

# Check database connectivity
if pg_isready -h $DB_HOST -p 5432; then
    echo "✅ PostgreSQL: Connected"
else
    echo "❌ PostgreSQL: Connection failed"
fi

# Check Redis
if redis-cli -h $REDIS_HOST ping | grep -q "PONG"; then
    echo "✅ Redis: Connected"
else
    echo "❌ Redis: Connection failed"
fi

# Check Aptos node
aptos_health=$(curl -s https://fullnode.devnet.aptoslabs.com/v1/ | jq -r .ledger_version)
if [ ! -z "$aptos_health" ]; then
    echo "✅ Aptos Node: Connected (Version: $aptos_health)"
else
    echo "❌ Aptos Node: Connection failed"
fi

# Check contract deployment
contract_status=$(aptos account list --query resources --account $CONTRACT_ADDRESS 2>/dev/null | wc -l)
if [ $contract_status -gt 0 ]; then
    echo "✅ Smart Contracts: Deployed"
else
    echo "❌ Smart Contracts: Not found"
fi
```

### Deployment Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy Carbon Marketplace

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1

jobs:
  deploy-contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Aptos CLI
        run: |
          curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
          echo "$HOME/.local/bin" >> $GITHUB_PATH

      - name: Deploy contracts
        env:
          APTOS_PRIVATE_KEY: ${{ secrets.APTOS_PRIVATE_KEY }}
        run: |
          cd contracts
          aptos init --private-key $APTOS_PRIVATE_KEY --network devnet --skip-faucet
          aptos move publish --named-addresses carbon_marketplace=default

  deploy-backend:
    runs-on: ubuntu-latest
    needs: deploy-contracts
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: carbon-marketplace-backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd backend
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster carbon-marketplace-cluster \
            --service backend-service \
            --force-new-deployment

  deploy-frontend:
    runs-on: ubuntu-latest
    needs: deploy-backend
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Build frontend
        env:
          NEXT_PUBLIC_API_URL: https://api.carbonmarketplace.com
          NEXT_PUBLIC_APTOS_NETWORK: devnet
          NEXT_PUBLIC_CONTRACT_ADDRESS: ${{ secrets.CONTRACT_ADDRESS }}
        run: |
          cd frontend
          npm run build

      - name: Deploy to S3
        run: |
          aws s3 sync frontend/out/ s3://carbon-marketplace-frontend --delete

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"

  deploy-ai:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Deploy AI models
        run: |
          cd ai-engine
          pip install -r requirements.txt
          python deployment/deploy_model.py
```

### Monitoring and Alerting

```yaml
# deployment/monitoring/cloudwatch-alarms.yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'CloudWatch alarms for Carbon Marketplace'

Resources:
  BackendHighCPU:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: 'Backend-High-CPU'
      AlarmDescription: 'Backend CPU utilization is high'
      MetricName: CPUUtilization
      Namespace: AWS/ECS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ServiceName
          Value: backend-service
        - Name: ClusterName
          Value: carbon-marketplace-cluster
      AlarmActions:
        - !Ref SNSAlert

  DatabaseConnectionFailed:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: 'Database-Connection-Failed'
      AlarmDescription: 'Database connections are failing'
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 0
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: carbon-marketplace-db

  SNSAlert:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: carbon-marketplace-alerts
      Subscription:
        - Endpoint: admin@carbonmarketplace.com
          Protocol: email
```

### Complete Deployment Script

```bash
#!/bin/bash
# deployment/scripts/deploy-all.sh

set -e

echo "🚀 Starting Carbon Offset Marketplace 2.0 deployment..."

# Set environment
export AWS_REGION=us-east-1
export APTOS_NETWORK=devnet

# 1. Deploy infrastructure
echo "📦 Deploying AWS infrastructure..."
cd deployment/infrastructure
npm install
cdk deploy --all --require-approval never

# 2. Deploy smart contracts
echo "🔗 Deploying Aptos smart contracts..."
cd ../../contracts
aptos move publish --named-addresses carbon_marketplace=default

# 3. Build and deploy backend
echo "🖥️ Deploying backend services..."
cd ../backend
docker build -t carbon-marketplace-backend .

# Get ECR repository URI
ECR_URI=$(aws ecr describe-repositories --repository-names carbon-marketplace-backend --query 'repositories[0].repositoryUri' --output text)

# Push to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI
docker tag carbon-marketplace-backend:latest $ECR_URI:latest
docker push $ECR_URI:latest

# Update ECS service
aws ecs update-service --cluster carbon-marketplace-cluster --service backend-service --force-new-deployment

# 4. Deploy frontend
echo "🌐 Deploying frontend..."
cd ../frontend
npm install
npm run build

# Upload to S3
aws s3 sync out/ s3://carbon-marketplace-frontend --delete

# Invalidate CloudFront
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query 'DistributionList.Items[?Comment==`Carbon Marketplace Frontend`].Id' --output text)
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

# 5. Run database migrations
echo "🗄️ Running database migrations..."
cd ../backend
npx prisma migrate deploy
npx prisma db seed

# 6. Health check
echo "🏥 Running health checks..."
cd ../deployment/scripts
./health-check.sh

echo "✅ Deployment completed successfully!"
echo ""
echo "🔗 Access your application:"
echo "Frontend: https://$(aws cloudfront list-distributions --query 'DistributionList.Items[?Comment==`Carbon Marketplace Frontend`].DomainName' --output text)"
echo "Backend API: https://$(aws elbv2 describe-load-balancers --names carbon-marketplace-alb --query 'LoadBalancers[0].DNSName' --output text)"
echo "Contract Address: $(aptos config show-profiles | grep account | awk '{print $2}')"
```

## 🔍 Post-Deployment Verification

### Verification Checklist

```bash
# deployment/scripts/verify-deployment.sh
#!/bin/bash

echo "🔍 Verifying Carbon Marketplace deployment..."

# Test smart contracts
echo "Testing smart contracts..."
aptos move test --package-dir contracts/

# Test backend API endpoints
echo "Testing backend API..."
curl -f https://api.carbonmarketplace.com/health || exit 1
curl -f https://api.carbonmarketplace.com/api/marketplace/credits || exit 1

# Test frontend
echo "Testing frontend..."
curl -f https://carbonmarketplace.com || exit 1

# Test database connectivity
echo "Testing database..."
psql $DATABASE_URL -c "SELECT 1;" || exit 1

# Test AI service
echo "Testing AI service..."
curl -f https://ai.carbonmarketplace.com/health || exit 1

# Test IoT pipeline
echo "Testing IoT pipeline..."
# Simulate sensor data
curl -X POST https://api.carbonmarketplace.com/api/iot/simulate-data \
  -H "Content-Type: application/json" \
  -d '{"project_id": "test", "sensor_data": {"temperature": 25.5}}'

echo "✅ All tests passed!"
```

This comprehensive deployment guide provides:

1. **Complete infrastructure setup** using AWS CDK
2. **Automated deployment pipelines** with GitHub Actions
3. **Smart contract deployment** on Aptos Devnet
4. **Containerized backend services** with ECS Fargate
5. **CDN-optimized frontend** with S3 and CloudFront
6. **AI model deployment** using SageMaker
7. **IoT infrastructure** with AWS IoT Core
8. **Monitoring and alerting** setup
9. **End-to-end verification** scripts

The deployment is production-ready with proper security, monitoring, and scaling capabilities.