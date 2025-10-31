const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const Seller = require('../models/Seller');
const { auth } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();

console.log('🔧 Auth routes module loaded');

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is running',
    timestamp: new Date().toISOString(),
    mockUsers: {
      customers: 3,
      sellers: 3
    }
  });
});

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new customer
// @access  Public
router.post('/register', [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { name, email, password } = req.body;
        console.log('📝 Customer signup attempt:', { name, email, password: '***' });

        // Try database first, then fallback to mock data
        let existingCustomer = null;
        try {
            existingCustomer = await Customer.findOne({ email });
        } catch (dbError) {
            console.log('📝 Database not available, using mock data for signup');
        }

        // Check mock data for existing user
        if (!existingCustomer) {
            existingCustomer = mockUsers.customers.find(c => c.email === email);
        }

        if (existingCustomer) {
            return res.status(400).json({
                success: false,
                message: 'A customer with this email already exists'
            });
        }

        // Try to save to database, fallback to mock
        let customer = null;
        try {
            customer = new Customer({ name, email, password });
            await customer.save();
        } catch (dbError) {
            console.log('📝 Database save failed, creating mock user');
            // Create mock user
            const newCustomer = {
                id: `customer_${Date.now()}`,
                name,
                email,
                password,
                role: 'CUSTOMER'
            };
            mockUsers.customers.push(newCustomer);
            customer = newCustomer;
        }

        const token = generateToken(customer._id || customer.id);

        res.status(201).json({
            success: true,
            message: 'Customer registered successfully',
            data: {
                user: {
                    id: customer._id || customer.id,
                    name: customer.name,
                    email: customer.email,
                    role: customer.role || 'CUSTOMER',
                    isActive: true,
                    isEmailVerified: true
                },
                token
            }
        });
    } catch (error) {
        console.error('Customer registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during customer registration'
        });
    }
});

// @route   POST /api/auth/seller/register
// @desc    Register a new seller
// @access  Public
router.post('/seller/register', [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('storeName').trim().isLength({ min: 2 }).withMessage('Store name must be at least 2 characters'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { name, email, password, storeName } = req.body;

        const existingSeller = await Seller.findOne({ email });
        if (existingSeller) {
            return res.status(400).json({
                success: false,
                message: 'A seller with this email already exists'
            });
        }

        const seller = new Seller({ name, email, password, storeName });
        await seller.save();

        const token = generateToken(seller._id);

        res.status(201).json({
            success: true,
            message: 'Seller registered successfully',
            data: {
                user: {
                    id: seller._id,
                    name: seller.name,
                    email: seller.email,
                    role: seller.role,
                    storeName: seller.storeName
                },
                token
            }
        });
    } catch (error) {
        console.error('Seller registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during seller registration'
        });
    }
});

// Mock users for testing (in production, use database)
const mockUsers = {
    customers: [
        { id: 'customer1', name: 'John Doe', email: 'customer@example.com', password: 'password123', role: 'CUSTOMER' },
        { id: 'customer2', name: 'Jane Smith', email: 'jane@example.com', password: 'password123', role: 'CUSTOMER' },
        { id: 'customer3', name: 'Mike Johnson', email: 'mike@example.com', password: 'password123', role: 'CUSTOMER' }
    ],
    sellers: [
        { id: 'seller1', name: 'Fashion Store Owner', email: 'seller@example.com', password: 'password123', role: 'SELLER', storeName: 'Fashion Era Store' },
        { id: 'seller2', name: 'Tech Hub Owner', email: 'tech@example.com', password: 'password123', role: 'SELLER', storeName: 'Tech Hub Store' },
        { id: 'seller3', name: 'Home Decor Owner', email: 'home@example.com', password: 'password123', role: 'SELLER', storeName: 'Home Decor Plus' }
    ]
};

// @route   POST /api/auth/login
// @desc    Login a customer
// @access  Public
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;
        console.log('🔐 Customer login attempt:', { email, password: '***' });

        // Try database first, then fallback to mock data
        let customer = null;
        try {
            customer = await Customer.findOne({ email }).select('+password');
        } catch (dbError) {
            console.log('📝 Database not available, using mock data');
        }

        // Fallback to mock data if database is not available
        if (!customer) {
            const mockCustomer = mockUsers.customers.find(c => c.email === email && c.password === password);
            if (mockCustomer) {
                const token = generateToken(mockCustomer.id);
                return res.json({
                    success: true,
                    message: 'Customer login successful (mock)',
                    data: {
                        user: {
                            id: mockCustomer.id,
                            name: mockCustomer.name,
                            email: mockCustomer.email,
                            role: mockCustomer.role,
                            isActive: true,
                            isEmailVerified: true
                        },
                        token
                    }
                });
            }
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isMatch = await customer.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = generateToken(customer._id);

        res.json({
            success: true,
            message: 'Customer login successful',
            data: {
                user: {
                    id: customer._id,
                    name: customer.name,
                    email: customer.email,
                    role: customer.role,
                    isActive: customer.isActive,
                    isEmailVerified: customer.isEmailVerified
                },
                token
            }
        });
    } catch (error) {
        console.error('Customer login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during customer login'
        });
    }
});

// @route   POST /api/auth/seller/login
// @desc    Login a seller
// @access  Public
router.post('/seller/login', [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;
        console.log('🏪 Seller login attempt:', { email, password: '***' });

        // Try database first, then fallback to mock data
        let seller = null;
        try {
            seller = await Seller.findOne({ email }).select('+password');
        } catch (dbError) {
            console.log('📝 Database not available, using mock data');
        }

        // Fallback to mock data if database is not available
        if (!seller) {
            const mockSeller = mockUsers.sellers.find(s => s.email === email && s.password === password);
            if (mockSeller) {
                const token = generateToken(mockSeller.id);
                return res.json({
                    success: true,
                    message: 'Seller login successful (mock)',
                    data: {
                        user: {
                            id: mockSeller.id,
                            name: mockSeller.name,
                            email: mockSeller.email,
                            role: mockSeller.role,
                            storeName: mockSeller.storeName,
                            isActive: true,
                            isEmailVerified: true
                        },
                        token
                    }
                });
            }
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isMatch = await seller.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = generateToken(seller._id);

        res.json({
            success: true,
            message: 'Seller login successful',
            data: {
                user: {
                    id: seller._id,
                    name: seller.name,
                    email: seller.email,
                    role: seller.role,
                    storeName: seller.storeName,
                    isActive: seller.isActive,
                    isEmailVerified: seller.isEmailVerified
                },
                token
            }
        });
    } catch (error) {
        console.error('Seller login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during seller login'
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    let user = await Customer.findById(req.user.id);
    if (!user) {
        user = await Seller.findById(req.user.id);
    }
    
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeName: user.storeName,
        avatar: user.avatar,
        addresses: user.addresses,
        paymentMethods: user.paymentMethods,
        businessType: user.businessType,
        gstin: user.gstin,
        phoneNumber: user.phoneNumber,
        pickupAddress: user.pickupAddress,
        bankDetails: user.bankDetails,
        isVerified: user.isVerified,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email',
        errors: errors.array()
      });
    }

    const { email } = req.body;
    let user = await Customer.findOne({ email });
    if (!user) {
        user = await Seller.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        template: 'password-reset',
        data: {
          name: user.name,
          resetUrl
        }
      });

      res.json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (emailError) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', [
    body('token').notEmpty().withMessage('Token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
        }

        const { token, password } = req.body;

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        let user = await Customer.findOne({ _id: decoded.id, passwordResetToken: token, passwordResetExpires: { $gt: Date.now() } });
        if (!user) {
            user = await Seller.findOne({ _id: decoded.id, passwordResetToken: token, passwordResetExpires: { $gt: Date.now() } });
        }

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
        }

        // Set new password
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Password has been reset successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
