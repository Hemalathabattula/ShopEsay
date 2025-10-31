const express = require('express');
const Order = require('../models/Order');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/seller/orders
// @desc    Get all orders for a seller
// @access  Private (Seller)
router.get('/', [auth, authorize('SELLER')], async (req, res) => {
    try {
        const orders = await Order.find({ 'items.seller': req.user.id }).populate('customer');
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Get seller orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/seller/orders/:id/status
// @desc    Update order status
// @access  Private (Seller)
router.put('/:id/status', [auth, authorize('SELLER')], async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, 'items.seller': req.user.id },
            { status },
            { new: true }
        );
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.json({ success: true, message: 'Order status updated successfully', data: order });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
