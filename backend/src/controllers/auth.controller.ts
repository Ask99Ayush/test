import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  fullName?: string;
  companyName?: string;
  role?: 'COMPANY' | 'PROJECT_DEVELOPER' | 'AUDITOR';
  aptosAddress?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiration,
  });
};

const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, config.refreshTokenSecret, {
    expiresIn: config.refreshTokenExpiration,
  });
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const {
    email,
    username,
    password,
    fullName,
    companyName,
    role = 'COMPANY',
    aptosAddress
  }: RegisterRequest = req.body;

  // Validate required fields
  if (!email || !username || !password) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Email, username, and password are required'
      }
    });
  }

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { username }
      ]
    }
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: {
        message: 'User with this email or username already exists'
      }
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      fullName,
      companyName,
      role,
      aptosAddress
    },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      companyName: true,
      role: true,
      aptosAddress: true,
      isVerified: true,
      createdAt: true
    }
  });

  // Generate tokens
  const accessToken = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Store refresh token in database
  await prisma.session.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || ''
    }
  });

  logger.info(`User registered: ${user.email}`);

  res.status(201).json({
    success: true,
    data: {
      user,
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password }: LoginRequest = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Email and password are required'
      }
    });
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
      password: true,
      fullName: true,
      companyName: true,
      role: true,
      aptosAddress: true,
      isVerified: true,
      lastLogin: true
    }
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid credentials'
      }
    });
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid credentials'
      }
    });
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  });

  // Generate tokens
  const accessToken = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Store refresh token
  await prisma.session.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || ''
    }
  });

  const { password: _, ...userWithoutPassword } = user;

  logger.info(`User logged in: ${user.email}`);

  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Refresh token is required'
      }
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(token, config.refreshTokenSecret) as any;

    // Check if token exists in database
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            aptosAddress: true,
            isVerified: true
          }
        }
      }
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired refresh token'
        }
      });
    }

    // Generate new access token
    const accessToken = generateToken(session.user.id);

    res.json({
      success: true,
      data: {
        user: session.user,
        tokens: {
          accessToken
        }
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid refresh token'
      }
    });
  }
});

export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { refreshToken: token } = req.body;

  if (token) {
    // Remove refresh token from database
    await prisma.session.deleteMany({
      where: { token }
    });
  }

  logger.info(`User logged out: ${req.user?.email}`);

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      companyName: true,
      role: true,
      aptosAddress: true,
      isVerified: true,
      kycStatus: true,
      profileImage: true,
      bio: true,
      website: true,
      createdAt: true,
      lastLogin: true,
      _count: {
        select: {
          projects: true,
          credits: true,
          transactions: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: { user }
  });
});

export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    fullName,
    companyName,
    bio,
    website,
    profileImage
  } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      fullName,
      companyName,
      bio,
      website,
      profileImage
    },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      companyName: true,
      role: true,
      aptosAddress: true,
      isVerified: true,
      profileImage: true,
      bio: true,
      website: true
    }
  });

  logger.info(`Profile updated: ${user.email}`);

  res.json({
    success: true,
    data: { user }
  });
});

export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Current password and new password are required'
      }
    });
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      password: true
    }
  });

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user!.password);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Current password is incorrect'
      }
    });
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, config.bcryptRounds);

  // Update password
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { password: hashedNewPassword }
  });

  // Invalidate all sessions
  await prisma.session.deleteMany({
    where: { userId: req.user!.id }
  });

  logger.info(`Password changed: ${req.user!.email}`);

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});