const express = require('express');
const Product = require('../models/Product');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/seller/products
// @desc    Get all products for a seller
// @access  Private (Seller)
router.get('/', [auth, authorize('SELLER')], async (req, res) => {
    try {
        const products = await Product.find({ seller: req.user.id });
        res.json({ success: true, data: products });
    } catch (error) {
        console.error('Get seller products error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/seller/products
// @desc    Create a new product
// @access  Private (Seller)
router.post('/', [auth, authorize('SELLER')], async (req, res) => {
    try {
        const product = new Product({ ...req.body, seller: req.user.id });
        await product.save();
        res.status(201).json({ success: true, message: 'Product created successfully', data: product });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/seller/products/:id
// @desc    Update a product
// @access  Private (Seller)
router.put('/:id', [auth, authorize('SELLER')], async (req, res) => {
    try {
        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, seller: req.user.id },
            req.body,
            { new: true }
        );
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, message: 'Product updated successfully', data: product });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/seller/products/:id
// @desc    Delete a product
// @access  Private (Seller)
router.delete('/:id', [auth, authorize('SELLER')], async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({ _id: req.params.id, seller: req.user.id });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
