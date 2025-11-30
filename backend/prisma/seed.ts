import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@carbonmarketplace.com' },
    update: {},
    create: {
      email: 'admin@carbonmarketplace.com',
      username: 'admin',
      password: adminPassword,
      fullName: 'Carbon Marketplace Admin',
      role: 'ADMIN',
      isVerified: true,
      kycStatus: 'APPROVED',
    },
  });

  console.log('✅ Admin user created');

  // Create sample companies
  const company1Password = await bcrypt.hash('company123!', 12);
  const company1 = await prisma.user.upsert({
    where: { email: 'company1@example.com' },
    update: {},
    create: {
      email: 'company1@example.com',
      username: 'greentech_corp',
      password: company1Password,
      fullName: 'John Smith',
      companyName: 'GreenTech Corporation',
      role: 'COMPANY',
      isVerified: true,
      kycStatus: 'APPROVED',
      aptosAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    },
  });

  const company2Password = await bcrypt.hash('company456!', 12);
  const company2 = await prisma.user.upsert({
    where: { email: 'company2@example.com' },
    update: {},
    create: {
      email: 'company2@example.com',
      username: 'sustainable_solutions',
      password: company2Password,
      fullName: 'Sarah Johnson',
      companyName: 'Sustainable Solutions Inc.',
      role: 'COMPANY',
      isVerified: true,
      kycStatus: 'APPROVED',
      aptosAddress: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    },
  });

  console.log('✅ Sample companies created');

  // Create sample project developer
  const projectDevPassword = await bcrypt.hash('developer789!', 12);
  const projectDev = await prisma.user.upsert({
    where: { email: 'developer@example.com' },
    update: {},
    create: {
      email: 'developer@example.com',
      username: 'forest_guardian',
      password: projectDevPassword,
      fullName: 'Maria Rodriguez',
      companyName: 'Forest Guardian Initiative',
      role: 'PROJECT_DEVELOPER',
      isVerified: true,
      kycStatus: 'APPROVED',
      aptosAddress: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
    },
  });

  console.log('✅ Sample project developer created');

  // Create sample projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Amazon Rainforest Conservation',
      description: 'Large-scale rainforest conservation project in the Brazilian Amazon, protecting 100,000 hectares of pristine forest and supporting indigenous communities.',
      projectType: 'REFORESTATION',
      location: 'Amazon Basin, Brazil',
      totalCreditCapacity: 500000,
      creditPrice: 12.50,
      certificationStandard: 'Verified Carbon Standard (VCS)',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2034-12-31'),
      isVerified: true,
      verifiedBy: 'VCS Auditor',
      verifiedAt: new Date(),
      ownerId: projectDev.id,
      documents: {
        methodology: 'REDD+ Methodology',
        pdd: 'Project Design Document v2.1',
        monitoring: 'Annual Monitoring Report 2024'
      },
      images: [
        'https://example.com/amazon1.jpg',
        'https://example.com/amazon2.jpg'
      ],
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Solar Power Plant Kenya',
      description: 'Utility-scale solar photovoltaic power plant providing clean energy to the Kenyan national grid and reducing reliance on fossil fuels.',
      projectType: 'RENEWABLE_ENERGY',
      location: 'Garissa County, Kenya',
      totalCreditCapacity: 750000,
      creditPrice: 8.75,
      certificationStandard: 'Gold Standard',
      startDate: new Date('2023-06-01'),
      endDate: new Date('2043-05-31'),
      isVerified: true,
      verifiedBy: 'Gold Standard Auditor',
      verifiedAt: new Date(),
      ownerId: projectDev.id,
      documents: {
        methodology: 'ACM0002 Grid Connected Renewable Energy',
        pdd: 'Project Design Document Kenya Solar',
        environmental: 'Environmental Impact Assessment'
      },
      images: [
        'https://example.com/solar1.jpg',
        'https://example.com/solar2.jpg'
      ],
    },
  });

  console.log('✅ Sample projects created');

  // Create sample carbon credits
  const credit1 = await prisma.carbonCredit.create({
    data: {
      aptosTokenId: 'token_amazon_001',
      amount: 1000,
      vintage: 2024,
      creditType: 'VCS',
      projectName: project1.name,
      location: project1.location,
      standard: project1.certificationStandard,
      currentPrice: 12.50,
      originalPrice: 12.50,
      issuanceHash: '0xabc123def456ghi789jkl012mno345pqr678stu901vwx234yzab567cdef890',
      projectId: project1.id,
      ownerId: projectDev.id,
      verificationData: {
        auditor: 'VCS Auditor',
        certificationDate: new Date().toISOString(),
        methodology: 'REDD+ Methodology',
        co2Equivalent: 1000,
      },
    },
  });

  const credit2 = await prisma.carbonCredit.create({
    data: {
      aptosTokenId: 'token_solar_001',
      amount: 2500,
      vintage: 2024,
      creditType: 'GOLD_STANDARD',
      projectName: project2.name,
      location: project2.location,
      standard: project2.certificationStandard,
      currentPrice: 8.75,
      originalPrice: 8.75,
      issuanceHash: '0xdef456ghi789jkl012mno345pqr678stu901vwx234yzab567cdef890abc123',
      projectId: project2.id,
      ownerId: projectDev.id,
      verificationData: {
        auditor: 'Gold Standard Auditor',
        certificationDate: new Date().toISOString(),
        methodology: 'ACM0002',
        co2Equivalent: 2500,
      },
    },
  });

  console.log('✅ Sample carbon credits created');

  // Create sample buy orders
  await prisma.buyOrder.create({
    data: {
      amount: 500,
      pricePerCredit: 10.00,
      totalPrice: 5000,
      creditType: 'VCS',
      vintage: 2024,
      location: 'Brazil',
      standard: 'VCS',
      userId: company1.id,
    },
  });

  await prisma.buyOrder.create({
    data: {
      amount: 1000,
      pricePerCredit: 9.00,
      totalPrice: 9000,
      creditType: 'GOLD_STANDARD',
      vintage: 2024,
      userId: company2.id,
    },
  });

  console.log('✅ Sample buy orders created');

  // Create sample sell orders
  await prisma.sellOrder.create({
    data: {
      amount: 500,
      pricePerCredit: 12.50,
      totalPrice: 6250,
      userId: projectDev.id,
      creditId: credit1.id,
    },
  });

  // Create sample IoT devices
  const device1 = await prisma.ioTDevice.create({
    data: {
      deviceId: 'DEVICE_AMZ_001',
      name: 'Amazon Weather Station 1',
      deviceType: 'WEATHER_STATION',
      latitude: -3.4653,
      longitude: -62.2159,
      location: 'Amazon Basin, Brazil',
      status: 'ACTIVE',
      isOnline: true,
      config: {
        samplingRate: 300, // 5 minutes
        sensors: ['temperature', 'humidity', 'precipitation', 'wind'],
        transmissionInterval: 3600, // 1 hour
      },
      firmware: 'v2.1.3',
      projectId: project1.id,
    },
  });

  const device2 = await prisma.ioTDevice.create({
    data: {
      deviceId: 'DEVICE_KEN_001',
      name: 'Solar Plant Energy Meter',
      deviceType: 'ENERGY_METER',
      latitude: -0.4536,
      longitude: 39.6682,
      location: 'Garissa County, Kenya',
      status: 'ACTIVE',
      isOnline: true,
      config: {
        samplingRate: 60, // 1 minute
        sensors: ['power_generation', 'voltage', 'current', 'irradiance'],
        transmissionInterval: 600, // 10 minutes
      },
      firmware: 'v1.8.2',
      projectId: project2.id,
    },
  });

  console.log('✅ Sample IoT devices created');

  // Create sample sensor data
  const now = new Date();
  const sensorData = [];

  // Generate 24 hours of sample data for Amazon weather station
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);

    sensorData.push(
      {
        sensorType: 'temperature',
        value: 26 + Math.random() * 6, // 26-32°C
        unit: '°C',
        quality: 0.95 + Math.random() * 0.05,
        timestamp,
        deviceId: device1.id,
        isValidated: true,
        confidence: 0.98,
      },
      {
        sensorType: 'humidity',
        value: 75 + Math.random() * 20, // 75-95%
        unit: '%',
        quality: 0.95 + Math.random() * 0.05,
        timestamp,
        deviceId: device1.id,
        isValidated: true,
        confidence: 0.97,
      }
    );
  }

  // Generate 24 hours of sample data for Kenya solar plant
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
    const hour = timestamp.getHours();

    // Simulate solar generation curve (0 at night, peak at midday)
    let powerGeneration = 0;
    if (hour >= 6 && hour <= 18) {
      const solarCurve = Math.sin(((hour - 6) / 12) * Math.PI);
      powerGeneration = solarCurve * 50000 + Math.random() * 5000; // Peak 50MW
    }

    sensorData.push({
      sensorType: 'power_generation',
      value: powerGeneration,
      unit: 'W',
      quality: 0.99,
      timestamp,
      deviceId: device2.id,
      isValidated: true,
      confidence: 0.99,
    });
  }

  await prisma.sensorData.createMany({
    data: sensorData,
  });

  console.log('✅ Sample sensor data created');

  // Create sample certificates
  await prisma.certificate.create({
    data: {
      certificateType: 'VERIFICATION',
      title: 'Amazon Rainforest Conservation Verification Certificate',
      description: 'This certificate verifies the Amazon Rainforest Conservation project meets all VCS standards for REDD+ methodology.',
      certificateHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
      signature: 'VCS_SIG_2024_001',
      publicKey: '0x987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba09',
      metadata: {
        standard: 'VCS',
        methodology: 'REDD+',
        auditDate: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      },
      userId: projectDev.id,
      projectId: project1.id,
    },
  });

  console.log('✅ Sample certificates created');

  // Create sample emission calculations
  await prisma.emissionCalculation.create({
    data: {
      industry: 'manufacturing',
      activityType: 'production',
      inputData: {
        electricityUsage: 50000, // kWh
        naturalGasUsage: 2000, // m³
        dieselUsage: 500, // liters
        productionVolume: 1000, // units
      },
      scope1Emissions: 5340, // kg CO₂e
      scope2Emissions: 25000, // kg CO₂e
      scope3Emissions: 8200, // kg CO₂e
      totalEmissions: 38540, // kg CO₂e
      confidence: 0.92,
      modelVersion: 'v2.1.0',
      algorithm: 'ensemble_ml',
      isValidated: true,
      validatedBy: 'AI Validator',
      validatedAt: new Date(),
      userId: company1.id,
    },
  });

  console.log('✅ Sample emission calculations created');

  console.log('🎉 Database seed completed successfully!');
  console.log('');
  console.log('📋 Test Accounts Created:');
  console.log('Admin: admin@carbonmarketplace.com / admin123!');
  console.log('Company 1: company1@example.com / company123!');
  console.log('Company 2: company2@example.com / company456!');
  console.log('Project Developer: developer@example.com / developer789!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });