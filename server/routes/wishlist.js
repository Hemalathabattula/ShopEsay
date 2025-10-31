const express = require('express');
const Wishlist = require('../models/Wishlist');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/wishlist
// @desc    Get customer's wishlist
// @access  Private (Customer)
router.get('/', [auth, authorize('CUSTOMER')], async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ customer: req.user.id }).populate('products');
        if (!wishlist) {
            return res.json({ success: true, data: { products: [] } });
        }
        res.json({ success: true, data: wishlist });
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/wishlist/add
// @desc    Add a product to the wishlist
// @access  Private (Customer)
router.post('/add', [auth, authorize('CUSTOMER')], async (req, res) => {
    try {
        const { productId } = req.body;
        let wishlist = await Wishlist.findOne({ customer: req.user.id });

        if (!wishlist) {
            wishlist = new Wishlist({ customer: req.user.id, products: [productId] });
        } else {
            if (!wishlist.products.includes(productId)) {
                wishlist.products.push(productId);
            }
        }

        await wishlist.save();
        res.json({ success: true, message: 'Product added to wishlist', data: wishlist });
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/wishlist/remove/:productId
// @desc    Remove a product from the wishlist
// @access  Private (Customer)
router.delete('/remove/:productId', [auth, authorize('CUSTOMER')], async (req, res) => {
    try {
        const { productId } = req.params;
        const wishlist = await Wishlist.findOne({ customer: req.user.id });

        if (wishlist) {
            wishlist.products = wishlist.products.filter(p => p.toString() !== productId);
            await wishlist.save();
        }

        res.json({ success: true, message: 'Product removed from wishlist', data: wishlist });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
