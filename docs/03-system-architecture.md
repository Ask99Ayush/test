# 3. Full System Architecture

## Architecture Overview

Carbon Offset Marketplace 2.0 is built on a modern, scalable architecture that combines blockchain, AI, IoT, and traditional web technologies. The system is designed for high availability, security, and global scale.

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Users & Interfaces                  │
├─────────────────────────────────────────────────────────┤
│  Web Dashboard  │  Mobile App   │  API Clients         │
└─────────────────┬───────────────┬─────────────────────┘
                  │               │
┌─────────────────┴───────────────┴─────────────────────┐
│                 Frontend Layer                        │
├───────────────────────────────────────────────────────┤
│  React/Next.js  │  React Native │  REST/GraphQL APIs  │
└─────────────────┬───────────────┬─────────────────────┘
                  │               │
┌─────────────────┴───────────────┴─────────────────────┐
│                  Backend Layer                        │
├───────────────────────────────────────────────────────┤
│  Node.js API    │  Authentication │  Business Logic   │
│  Express.js     │  JWT/OAuth2     │  Credit Management│
│  WebSockets     │  Role-based     │  Marketplace Logic│
└─────────────────┬───────────────┬─────────────────────┘
                  │               │
┌─────────────────┴───────────────┴─────────────────────┐
│                Blockchain Layer                       │
├───────────────────────────────────────────────────────┤
│  Aptos Network  │  Move Contracts │  Credit Tokens    │
│  Wallet Connect │  Marketplace    │  Certificates     │
│  Transaction    │  Reputation     │  Retirement       │
└─────────────────┬───────────────┬─────────────────────┘
                  │               │
┌─────────────────┴───────────────┴─────────────────────┐
│                 AI Engine Layer                       │
├───────────────────────────────────────────────────────┤
│  Python ML      │  TensorFlow     │  Emission Models  │
│  Data Pipeline  │  Real-time Calc │  Prediction API   │
│  Model Training │  Validation     │  Report Generation│
└─────────────────┬───────────────┬─────────────────────┘
                  │               │
┌─────────────────┴───────────────┴─────────────────────┐
│                 IoT Data Layer                        │
├───────────────────────────────────────────────────────┤
│  Sensor Network │  Edge Computing │  Data Validation  │
│  MQTT Brokers   │  InfluxDB       │  Blockchain Hash  │
│  Real-time API  │  Data Pipeline  │  Anomaly Detection│
└─────────────────┬───────────────┬─────────────────────┘
                  │               │
┌─────────────────┴───────────────┴─────────────────────┐
│                Database Layer                         │
├───────────────────────────────────────────────────────┤
│  PostgreSQL     │  MongoDB        │  Redis Cache      │
│  User Data      │  IoT Time-series│  Session Storage  │
│  Transactions   │  AI Training    │  API Rate Limit  │
└───────────────────────────────────────────────────────┘
```

## 🔗 Aptos Blockchain Layer

### Core Blockchain Infrastructure

**Aptos Network Integration**
- **Mainnet**: Production transactions and credit trading
- **Testnet**: Development and testing environment
- **Local Development**: Docker-based local Aptos node

**Wallet Integration**
- **Aptos Wallet**: Primary wallet for credit management
- **Multi-sig Support**: Corporate accounts with multiple approvers
- **Hardware Wallet**: Ledger integration for high-value accounts
- **Mobile Wallets**: Petra, Martian, and other mobile options

### Blockchain Components

**Move Smart Contracts** (Detailed in Section 4)
```
contracts/
├── CarbonCredit.move         # Core credit tokenization
├── Marketplace.move          # Trading and order matching
├── CertificateRegistry.move  # Blockchain certificates
├── ReputationSystem.move     # User and project reputation
└── GovernanceToken.move      # Platform governance (future)
```

**Transaction Types**
- **Credit Minting**: Create new credits from verified projects
- **Credit Transfer**: Buy/sell/gift credits between users
- **Credit Retirement**: Permanently remove credits from circulation
- **Certificate Issue**: Generate verification certificates
- **Reputation Update**: Update user/project reputation scores

## 🖥️ Move Smart Contracts

### Contract Architecture

**CarbonCredit Contract**
- ERC-721 style NFTs representing individual carbon credits
- Each credit contains metadata about origin project
- Fractional ownership supported through sub-tokens
- Automated retirement with certificate generation

**Marketplace Contract**
- Order book trading with limit and market orders
- Automated escrow and settlement
- Fee collection and distribution
- Price discovery and historical tracking

**Certificate Registry**
- Immutable certificate storage and verification
- Cryptographic signatures for authenticity
- Public verification API endpoints
- Integration with external audit systems

**Reputation System**
- Multi-dimensional scoring algorithm
- Weighted history with time-decay factors
- Community feedback integration
- Automated score updates based on IoT data

## 💻 Backend (Node.js/Express)

### Backend Architecture

```
backend/
├── src/
│   ├── controllers/         # API route handlers
│   ├── services/           # Business logic layer
│   ├── models/             # Database models
│   ├── middleware/         # Authentication, validation
│   ├── utils/              # Helper functions
│   ├── blockchain/         # Aptos integration
│   ├── ai/                 # AI model integration
│   └── iot/                # IoT data processing
├── config/                 # Environment configuration
├── migrations/             # Database schema changes
└── tests/                  # Automated tests
```

**Core Services**
- **Authentication Service**: JWT-based auth with role management
- **Credit Service**: Credit lifecycle management and validation
- **Marketplace Service**: Trading logic and order management
- **Payment Service**: Fiat payment processing integration
- **AI Service**: Emission calculation and model management
- **IoT Service**: Sensor data ingestion and validation
- **Notification Service**: Email, SMS, and push notifications

**API Architecture**
- **REST API**: Standard CRUD operations and marketplace actions
- **GraphQL**: Complex queries for dashboard data
- **WebSocket**: Real-time updates for trading and IoT data
- **Webhook**: Integration with external systems

### Database Design

**PostgreSQL (Primary Database)**
```sql
-- Users and authentication
users, user_profiles, user_roles

-- Credit and project management
projects, credits, credit_transfers, credit_retirements

-- Marketplace and trading
market_orders, trade_history, price_history

-- Certificates and verification
certificates, audit_logs, verification_records
```

**MongoDB (IoT and Analytics)**
```javascript
// IoT sensor data (time-series)
{
  sensorId: "sensor-001",
  timestamp: ISODate(),
  projectId: "solar-farm-001",
  measurements: {
    co2Reduced: 1.5,
    energyGenerated: 100,
    temperature: 25.5
  },
  dataHash: "blockchain-hash"
}

// AI model results
{
  calculationId: "calc-001",
  companyId: "company-001",
  timestamp: ISODate(),
  inputData: {...},
  results: {
    totalEmissions: 1000,
    confidence: 0.95,
    breakdown: {...}
  }
}
```

**Redis (Caching and Sessions)**
- User session storage
- API rate limiting
- Real-time trading data cache
- Background job queues

## 🎨 Frontend (React/Next.js)

### Frontend Architecture

```
frontend/
├── components/             # Reusable UI components
│   ├── common/            # Buttons, forms, modals
│   ├── marketplace/       # Trading interface
│   ├── dashboard/         # Analytics and charts
│   └── wallet/           # Blockchain wallet integration
├── pages/                 # Next.js pages and routing
├── hooks/                # Custom React hooks
├── services/             # API integration layer
├── utils/               # Helper functions
├── styles/              # CSS and styling
└── public/              # Static assets
```

**Key Pages and Components**
- **Dashboard**: Company emission tracking and credit management
- **Marketplace**: Credit browsing, filtering, and purchasing
- **Project Portal**: Project developer interface
- **Wallet Interface**: Blockchain wallet integration
- **Verification Portal**: Certificate viewing and validation
- **Admin Panel**: Platform administration tools

**State Management**
- **Redux Toolkit**: Global state management
- **React Query**: API data caching and synchronization
- **Context API**: Authentication and user preferences
- **Local Storage**: Persistent user settings

### User Interface Design

**Design System**
- Material-UI based component library
- Consistent color scheme and typography
- Responsive design for mobile and desktop
- Accessibility compliance (WCAG 2.1)

**User Experience**
- Progressive web app (PWA) capabilities
- Offline functionality for critical features
- Real-time updates using WebSockets
- Guided onboarding for new users

## 🤖 AI Engine

### AI Architecture

```
ai-engine/
├── models/                # Trained ML models
├── data/                 # Training and validation data
├── preprocessing/        # Data cleaning and preparation
├── training/            # Model training scripts
├── inference/           # Real-time prediction API
├── evaluation/          # Model performance monitoring
└── pipelines/           # MLOps pipelines
```

**AI Components**
- **Emission Calculation Models**: Industry-specific calculation engines
- **Anomaly Detection**: IoT data validation and outlier detection
- **Prediction Models**: Future emission and credit demand forecasting
- **Optimization Engine**: Credit portfolio optimization recommendations
- **Natural Language Processing**: Document analysis for project verification

**Model Training Pipeline**
1. Data ingestion from multiple sources
2. Data cleaning and feature engineering
3. Model training with cross-validation
4. Performance evaluation and comparison
5. Model deployment to production API
6. Continuous monitoring and retraining

## 📡 IoT Data Pipeline

### IoT Architecture

```
iot-pipeline/
├── edge-computing/       # Device-side processing
├── data-ingestion/      # MQTT and API gateways
├── data-processing/     # Real-time stream processing
├── data-storage/        # Time-series database
├── validation/          # Data quality and integrity
└── blockchain-sync/     # Hash storage on Aptos
```

**Data Flow**
1. **Sensor Data Collection**: Environmental sensors collect measurements
2. **Edge Processing**: Local validation and aggregation
3. **Secure Transmission**: Encrypted data sent to cloud
4. **Real-time Processing**: Stream processing for immediate insights
5. **Data Storage**: Time-series storage in InfluxDB
6. **Blockchain Hashing**: Data integrity hashes stored on Aptos
7. **AI Integration**: Processed data used for emission calculations

**Supported Sensor Types**
- Environmental: Temperature, humidity, air quality
- Energy: Solar panel output, wind generation, grid consumption
- Industrial: Factory emissions, fuel consumption, efficiency
- Transportation: Vehicle tracking, fuel usage, route optimization
- Agriculture: Soil carbon, biomass measurement, water usage

## 💾 Database

### Multi-Database Strategy

**PostgreSQL (Transactional Data)**
- User accounts and authentication
- Credit ownership and transaction records
- Marketplace orders and trade history
- Financial transactions and payments
- Audit logs and compliance records

**MongoDB (Document and Time-Series)**
- IoT sensor data and measurements
- AI model training data and results
- Project documentation and metadata
- Certificate templates and generated certificates
- Analytics and reporting data

**InfluxDB (IoT Time-Series)**
- High-frequency sensor measurements
- Real-time environmental monitoring data
- Performance metrics and system monitoring
- Historical trend analysis
- Automated data retention policies

**Redis (Caching and Real-time)**
- User session management
- API response caching
- Real-time trading data
- Background job queues
- Rate limiting and throttling

### Data Synchronization

**Blockchain-Database Sync**
- Real-time sync of blockchain transactions to database
- Event listeners for contract state changes
- Automatic rollback handling for blockchain forks
- Consistency checks between blockchain and database state

**Cross-Database Consistency**
- Transaction coordination between PostgreSQL and MongoDB
- Eventual consistency for non-critical data
- Automated reconciliation processes
- Data integrity monitoring and alerts

## 👥 User Flow

### Company User Journey

**1. Registration and Setup**
```
Register → Email Verification → Company Profile →
Connect Wallet → Upload Business Data → AI Emission Calculation
```

**2. Credit Purchase Process**
```
Browse Marketplace → Filter Credits → View Project Details →
Check IoT Verification → Purchase Credits → Receive in Wallet
```

**3. Credit Management**
```
View Portfolio → Track Credit Performance →
Retire Credits → Generate Certificates → Download Reports
```

**4. Compliance and Reporting**
```
Set Reduction Goals → Monitor Progress →
Generate Reports → Share Certificates → Audit Preparation
```

### Project Developer Journey

**1. Project Registration**
```
Register → Project Profile → Upload Documentation →
Install IoT Sensors → Verify Methodology → Get Approved
```

**2. Credit Minting**
```
IoT Data Collection → AI Verification →
Submit Mint Request → Community Review → Credits Minted
```

**3. Credit Sales**
```
List on Marketplace → Set Pricing →
Market Credits → Receive Payments → Build Reputation
```

**4. Project Management**
```
Monitor IoT Data → Track Performance →
Update Stakeholders → Maintain Equipment → Expand Project
```

## 🔄 Data Flow Architecture

### Real-time Data Processing

**IoT to Blockchain Flow**
```
Sensors → Edge Gateway → MQTT Broker →
Stream Processor → Database → Blockchain Hash Storage
```

**AI Calculation Flow**
```
Business Data Upload → Data Validation →
AI Model Processing → Results Storage →
Certificate Generation → Blockchain Recording
```

**Trading Flow**
```
Order Placement → Smart Contract Escrow →
Order Matching → Trade Execution →
Settlement → Ownership Transfer
```

### Security Architecture

**Multi-Layer Security**
- **Blockchain Security**: Move language safety and formal verification
- **API Security**: JWT authentication, rate limiting, input validation
- **Data Security**: Encryption at rest and in transit
- **Network Security**: VPC isolation, firewall rules, DDoS protection
- **IoT Security**: Device authentication, encrypted communication
- **Database Security**: Access controls, audit logging, backup encryption

**Compliance and Privacy**
- **GDPR Compliance**: User data privacy and right to deletion
- **SOC 2 Type II**: Security controls and audit requirements
- **ISO 27001**: Information security management system
- **Financial Regulations**: KYC/AML compliance for high-value transactions
- **Environmental Standards**: Carbon accounting methodology compliance

This architecture provides a robust, scalable foundation for Carbon Offset Marketplace 2.0, combining the security of blockchain with the power of AI and IoT for transparent, verifiable carbon credit management.