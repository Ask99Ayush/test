# Carbon Offset Marketplace 2.0 🌱

> **Trade verified carbon credits on Aptos blockchain with AI-powered emission tracking and IoT environmental verification.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.9%2B-blue)](https://python.org/)
[![Aptos](https://img.shields.io/badge/Blockchain-Aptos-red)](https://aptoslabs.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://docker.com/)

## ⚡ READY TO RUN

This is a **complete, production-ready implementation** with all components fully coded and integrated:

- ✅ **Smart Contracts**: 4 Move contracts (2,136 lines) deployed on Aptos
- ✅ **Backend API**: Complete Node.js/Express server with authentication
- ✅ **Frontend**: React/Next.js application with wallet integration
- ✅ **AI Engine**: Python/FastAPI ML service for emissions
- ✅ **IoT Pipeline**: Real-time sensor data processing
- ✅ **Database**: Complete schemas with seed data
- ✅ **Docker**: Full containerization for easy deployment

## 🚀 Quick Start (One Command)

```bash
# Clone and start everything
git clone <repository-url>
cd carbon-offset-marketplace-2.0
docker-compose up -d

# Access the application
open http://localhost:3000
```

**That's it!** 🎉 The entire system is now running.

## 📊 Project Structure

```
carbon-offset-marketplace-2.0/
├── 📄 README.md                    # This comprehensive guide
├── 🐳 docker-compose.yml          # Complete infrastructure
├── 📚 docs/                       # Extensive documentation (10 files)
├── ⛓️ contracts/                  # ✅ Aptos Move smart contracts (COMPLETE)
│   ├── Move.toml
│   └── sources/
│       ├── CarbonCredit.move       # 381 lines - Credit tokenization
│       ├── Marketplace.move        # 523 lines - Trading system
│       ├── CertificateRegistry.move # 536 lines - Blockchain certificates
│       └── ReputationSystem.move   # 696 lines - User reputation
├── 🔧 backend/                    # ✅ Node.js/Express API (COMPLETE)
│   ├── package.json               # All dependencies configured
│   ├── prisma/schema.prisma       # Complete database schema (15 models)
│   ├── src/
│   │   ├── app.ts                 # Main application server
│   │   ├── controllers/           # API controllers
│   │   ├── services/              # Business logic & blockchain integration
│   │   ├── middleware/            # Authentication, validation, errors
│   │   ├── routes/                # API endpoints
│   │   └── utils/                 # Helper functions
│   └── .env.example               # Environment configuration
├── 🎨 frontend/                   # ✅ React/Next.js App (COMPLETE)
│   ├── package.json               # All dependencies configured
│   ├── next.config.js             # Next.js configuration
│   ├── tailwind.config.js         # Custom carbon marketplace theme
│   ├── src/
│   │   ├── app/                   # Next.js 14 app router
│   │   ├── components/            # React components
│   │   ├── hooks/                 # Custom hooks
│   │   ├── lib/                   # Utility functions
│   │   └── types/                 # TypeScript definitions
│   └── .env.example               # Frontend configuration
├── 🤖 ai-engine/                  # ✅ Python AI/ML Service (COMPLETE)
│   ├── requirements.txt           # ML dependencies
│   ├── main.py                    # FastAPI application
│   ├── app/
│   │   ├── config.py              # AI configuration
│   │   ├── models/                # ML model implementations
│   │   └── services/              # AI business logic
│   └── .env.example               # AI service configuration
└── 📡 iot-pipeline/               # ✅ IoT Infrastructure (COMPLETE)
    ├── docker-compose.yml         # IoT services (MQTT, Kafka, InfluxDB)
    ├── services/
    │   ├── ingestion/main.py       # MQTT data ingestion
    │   ├── processor/              # Data processing
    │   └── dashboard/              # Monitoring API
    └── config/                     # IoT configurations
```

## 🌐 Service URLs (After docker-compose up)

| Service | URL | Credentials |
|---------|-----|-------------|
| **🎨 Frontend App** | http://localhost:3000 | See test accounts below |
| **🔧 Backend API** | http://localhost:3001 | JWT authentication |
| **🤖 AI Engine** | http://localhost:8000 | API key authentication |
| **📊 Grafana Dashboards** | http://localhost:3030 | admin / carbon_grafana_123 |
| **💾 InfluxDB UI** | http://localhost:8086 | admin / carbon_influx_123 |

## 👥 Test Accounts (Pre-seeded)

```bash
# Admin Account
Email: admin@carbonmarketplace.com
Password: admin123!

# Company Account
Email: company1@example.com
Password: company123!

# Project Developer
Email: developer@example.com
Password: developer789!
```

## ✨ Key Features

### 🔗 Blockchain Layer (Aptos)
- **Carbon Credit Tokens** with complete lifecycle (mint → trade → retire)
- **Decentralized Marketplace** with order book and automated matching
- **Digital Certificates** with cryptographic signatures
- **Reputation System** with 5-category scoring
- **Immutable Audit Trails** for all transactions

### 🎨 Frontend Features
- **Aptos Wallet Integration** (Petra, Martian, Pontem, etc.)
- **Real-time Trading Interface** with WebSocket updates
- **AI Emission Calculator** with industry-specific models
- **IoT Device Monitoring** with live sensor data
- **Certificate Management** with PDF generation
- **Analytics Dashboards** with comprehensive insights

### 🔧 Backend Features
- **JWT Authentication** with refresh tokens
- **RESTful API** with comprehensive endpoints
- **Real-time WebSocket** connections
- **Database Integration** (PostgreSQL, MongoDB, Redis)
- **Blockchain Integration** via Aptos SDK
- **Rate Limiting & Security** middleware

### 🤖 AI Engine Features
- **Emission Calculations** for 8 industries with ML models
- **IoT Data Validation** with anomaly detection
- **Quality Scoring** for sensor data reliability
- **Certificate Generation** with digital signatures
- **Blockchain Hashing** for data integrity

### 📡 IoT Pipeline Features
- **MQTT Data Ingestion** from edge devices
- **Real-time Processing** via Apache Kafka
- **Time-series Storage** in InfluxDB
- **Device Management** with status monitoring
- **Data Quality Assessment** with validation

## 🏗️ Technology Stack

## 📚 Documentation

All comprehensive guides are available in the `/docs` directory:

1. [Project Summary](docs/01-project-summary.md)
2. [Key Features](docs/02-key-features.md)
3. [System Architecture](docs/03-system-architecture.md)
4. [Aptos Integration](docs/04-aptos-integration.md)
5. [Backend Guide](docs/05-backend-guide.md)
6. [Frontend Guide](docs/06-frontend-guide.md)
7. [AI Integration](docs/07-ai-integration.md)
8. [IoT Integration](docs/08-iot-integration.md)
9. [Deployment Guide](docs/09-deployment-guide.md)
10. [Final Deliverables](docs/10-final-deliverables.md)

## 🔗 Quick Links

- [Aptos Documentation](https://aptos.dev/)
- [Move Language Guide](https://move-language.github.io/move/)
- [Project Architecture Diagram](architecture/system-architecture.png)
- [API Documentation](docs/api-reference.md)

## 📞 Support

For technical support and questions, refer to the comprehensive documentation in the `/docs` directory.