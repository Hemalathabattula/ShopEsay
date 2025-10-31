const express = require('express');
const { body, validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/customer/profile
// @desc    Get customer profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
    try {
        const customer = await Customer.findById(req.user.id);
        res.json({ success: true, data: { user: customer } });
    } catch (error) {
        console.error('Get customer profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/customer/profile
// @desc    Update customer profile
// @access  Private
router.put('/profile', [
    auth,
    body('name').optional().trim().isLength({ min: 2 }),
    body('phone').optional().trim().isMobilePhone(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
        }

        const { name, phone } = req.body;
        const updates = { name, phone };

        const customer = await Customer.findByIdAndUpdate(req.user.id, updates, { new: true });
        res.json({ success: true, message: 'Profile updated successfully', data: { user: customer } });
    } catch (error) {
        console.error('Update customer profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ... (address management routes for customers)

module.exports = router;
