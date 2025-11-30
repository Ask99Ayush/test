import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }
  next();
};

export const validationMiddleware = {
  validateRegister: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('username')
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username must be 3-30 characters long and contain only letters, numbers, and underscores'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    body('fullName')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Full name must be 1-100 characters long'),
    body('companyName')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Company name must be 1-100 characters long'),
    body('role')
      .optional()
      .isIn(['COMPANY', 'PROJECT_DEVELOPER', 'AUDITOR', 'ADMIN'])
      .withMessage('Invalid role'),
    body('aptosAddress')
      .optional()
      .matches(/^0x[a-fA-F0-9]{64}$/)
      .withMessage('Invalid Aptos address format'),
    handleValidationErrors
  ],

  validateLogin: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],

  validateProfileUpdate: [
    body('fullName')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Full name must be 1-100 characters long'),
    body('companyName')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Company name must be 1-100 characters long'),
    body('bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Bio must be at most 500 characters long'),
    body('website')
      .optional()
      .isURL()
      .withMessage('Please provide a valid website URL'),
    handleValidationErrors
  ],

  validatePasswordChange: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    handleValidationErrors
  ],

  validateCreditMint: [
    body('recipientAddress')
      .matches(/^0x[a-fA-F0-9]{64}$/)
      .withMessage('Invalid recipient Aptos address'),
    body('amount')
      .isFloat({ min: 0.1 })
      .withMessage('Amount must be at least 0.1'),
    body('vintage')
      .isInt({ min: 2020, max: new Date().getFullYear() })
      .withMessage('Vintage must be between 2020 and current year'),
    body('creditType')
      .isIn(['VCS', 'GOLD_STANDARD', 'CAR', 'CDM', 'JI', 'CUSTOM'])
      .withMessage('Invalid credit type'),
    body('projectName')
      .isLength({ min: 1, max: 200 })
      .withMessage('Project name is required and must be at most 200 characters'),
    body('location')
      .isLength({ min: 1, max: 100 })
      .withMessage('Location is required and must be at most 100 characters'),
    body('standard')
      .isLength({ min: 1, max: 100 })
      .withMessage('Standard is required and must be at most 100 characters'),
    handleValidationErrors
  ],

  validateCreditTransfer: [
    body('fromAddress')
      .matches(/^0x[a-fA-F0-9]{64}$/)
      .withMessage('Invalid from Aptos address'),
    body('toAddress')
      .matches(/^0x[a-fA-F0-9]{64}$/)
      .withMessage('Invalid to Aptos address'),
    body('creditId')
      .notEmpty()
      .withMessage('Credit ID is required'),
    body('amount')
      .isFloat({ min: 0.1 })
      .withMessage('Amount must be at least 0.1'),
    handleValidationErrors
  ],

  validateOrderPlacement: [
    body('amount')
      .isFloat({ min: 0.1 })
      .withMessage('Amount must be at least 0.1'),
    body('pricePerCredit')
      .isFloat({ min: 0.01 })
      .withMessage('Price per credit must be at least 0.01'),
    body('creditType')
      .optional()
      .isIn(['VCS', 'GOLD_STANDARD', 'CAR', 'CDM', 'JI', 'CUSTOM'])
      .withMessage('Invalid credit type'),
    body('vintage')
      .optional()
      .isInt({ min: 2020, max: new Date().getFullYear() })
      .withMessage('Vintage must be between 2020 and current year'),
    body('expiresAt')
      .optional()
      .isISO8601()
      .withMessage('Invalid expiration date'),
    handleValidationErrors
  ],

  validateProjectCreation: [
    body('name')
      .isLength({ min: 1, max: 200 })
      .withMessage('Project name is required and must be at most 200 characters'),
    body('description')
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be 10-2000 characters long'),
    body('projectType')
      .isIn([
        'RENEWABLE_ENERGY',
        'REFORESTATION',
        'CARBON_CAPTURE',
        'ENERGY_EFFICIENCY',
        'METHANE_REDUCTION',
        'SUSTAINABLE_AGRICULTURE',
        'WASTE_MANAGEMENT'
      ])
      .withMessage('Invalid project type'),
    body('location')
      .isLength({ min: 1, max: 200 })
      .withMessage('Location is required and must be at most 200 characters'),
    body('totalCreditCapacity')
      .isInt({ min: 1 })
      .withMessage('Total credit capacity must be at least 1'),
    body('creditPrice')
      .isFloat({ min: 0.01 })
      .withMessage('Credit price must be at least 0.01'),
    body('certificationStandard')
      .isLength({ min: 1, max: 100 })
      .withMessage('Certification standard is required'),
    body('startDate')
      .isISO8601()
      .withMessage('Invalid start date'),
    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date'),
    handleValidationErrors
  ],

  validateEmissionCalculation: [
    body('industry')
      .isIn([
        'manufacturing',
        'technology',
        'retail',
        'healthcare',
        'finance',
        'agriculture',
        'transportation',
        'energy'
      ])
      .withMessage('Invalid industry'),
    body('activityType')
      .notEmpty()
      .withMessage('Activity type is required'),
    body('activityData')
      .isObject()
      .withMessage('Activity data must be an object'),
    body('calculationMethod')
      .optional()
      .isIn(['standard', 'detailed', 'ai_enhanced'])
      .withMessage('Invalid calculation method'),
    handleValidationErrors
  ],

  validateIoTData: [
    body('deviceId')
      .notEmpty()
      .withMessage('Device ID is required'),
    body('sensorData')
      .isArray({ min: 1 })
      .withMessage('Sensor data must be a non-empty array'),
    body('sensorData.*.sensorType')
      .notEmpty()
      .withMessage('Sensor type is required'),
    body('sensorData.*.value')
      .isNumeric()
      .withMessage('Sensor value must be numeric'),
    body('sensorData.*.timestamp')
      .isISO8601()
      .withMessage('Invalid timestamp'),
    handleValidationErrors
  ]
};