const express = require('express');
const { body, validationResult } = require('express-validator');
const Seller = require('../models/Seller');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/seller/profile
// @desc    Get seller profile
// @access  Private
router.get('/profile', [auth, authorize('SELLER')], async (req, res) => {
    try {
        const seller = await Seller.findById(req.user.id);
        res.json({ success: true, data: { user: seller } });
    } catch (error) {
        console.error('Get seller profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/seller/profile
// @desc    Update seller profile
// @access  Private
router.put('/profile', [
    auth,
    authorize('SELLER'),
    body('name').optional().trim().isLength({ min: 2 }),
    body('phone').optional().trim().isMobilePhone(),
    body('storeName').optional().trim().isLength({ min: 2 }),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
        }

        const { name, phone, storeName } = req.body;
        const updates = { name, phone, storeName };

        const seller = await Seller.findByIdAndUpdate(req.user.id, updates, { new: true });
        res.json({ success: true, message: 'Profile updated successfully', data: { user: seller } });
    } catch (error) {
        console.error('Update seller profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
