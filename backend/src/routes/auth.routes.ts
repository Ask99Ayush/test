import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword
} from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';

const router = Router();

// Public routes
router.post('/register', validationMiddleware.validateRegister, register);
router.post('/login', validationMiddleware.validateLogin, login);
router.post('/refresh', refreshToken);

// Protected routes
router.use(authMiddleware); // Apply auth middleware to all routes below
router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/profile', validationMiddleware.validateProfileUpdate, updateProfile);
router.put('/change-password', validationMiddleware.validatePasswordChange, changePassword);

export default router;