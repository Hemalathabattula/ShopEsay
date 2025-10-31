const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Shipment = require('../models/Shipment');
const { auth, authorize } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// @route   GET /api/orders
// @desc    Get user's orders or seller's orders
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filter = {};

    if (req.user.role === 'CUSTOMER') {
      filter.userId = req.user.id;
    } else if (req.user.role === 'SELLER') {
      filter['items.sellerId'] = req.user.id;
    }

    if (status) {
      filter.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'name email')
        .populate('items.productId', 'title images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(filter)
    ]);

    // Filter items for sellers to show only their products
    if (req.user.role === 'SELLER') {
      orders.forEach(order => {
        order.items = order.items.filter(item => 
          item.sellerId.toString() === req.user.id
        );
      });
    }

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalOrders: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching orders'
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('items.productId', 'title images')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    const isOwner = order.userId._id.toString() === req.user.id;
    const isSeller = req.user.role === 'SELLER' && 
      order.items.some(item => item.sellerId.toString() === req.user.id);
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isSeller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    // Filter items for sellers
    if (req.user.role === 'SELLER' && !isAdmin) {
      order.items = order.items.filter(item => 
        item.sellerId.toString() === req.user.id
      );
    }

    // Get shipment info if exists
    const shipment = await Shipment.findOne({ orderId: order._id }).lean();

    res.json({
      success: true,
      data: {
        order,
        shipment
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching order'
    });
  }
});

// @route   PATCH /api/orders/:id/status
// @desc    Update order status
// @access  Private (Seller/Admin only)
router.patch('/:id/status', [
  auth,
  authorize('SELLER', 'ADMIN'),
  body('status').isIn(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  body('trackingNumber').optional().trim().isLength({ min: 5 }).withMessage('Invalid tracking number'),
  body('carrier').optional().isIn(['fedex', 'ups', 'usps', 'dhl', 'other']).withMessage('Invalid carrier')
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

    const { status, trackingNumber, carrier, note } = req.body;
    
    const order = await Order.findById(req.params.id).populate('userId', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if seller owns items in this order
    if (req.user.role === 'SELLER') {
      const hasSellerItems = order.items.some(item => 
        item.sellerId.toString() === req.user.id
      );
      
      if (!hasSellerItems) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this order'
        });
      }
    }

    // Update order status
    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (carrier) order.carrier = carrier;

    // Add to status timeline
    order.statusTimeline.push({
      status,
      timestamp: new Date(),
      note,
      updatedBy: req.user.id
    });

    await order.save();

    // Create or update shipment if status is shipped
    if (status === 'shipped' && trackingNumber && carrier) {
      let shipment = await Shipment.findOne({ orderId: order._id });
      
      if (!shipment) {
        shipment = new Shipment({
          orderId: order._id,
          trackingNumber,
          carrier,
          status: 'picked_up',
          shippingAddress: order.shippingAddress
        });
      } else {
        shipment.status = 'picked_up';
        shipment.trackingNumber = trackingNumber;
        shipment.carrier = carrier;
      }
      
      await shipment.save();

      // Send shipping notification email
      try {
        await sendEmail({
          to: order.userId.email,
          subject: `Your Order Has Shipped - ${order.orderNumber}`,
          template: 'order-shipped',
          data: {
            name: order.userId.name,
            orderNumber: order.orderNumber,
            trackingNumber,
            carrier: carrier.toUpperCase(),
            estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()
          }
        });
      } catch (emailError) {
        console.error('Shipping email failed:', emailError);
      }
    }

    // Emit socket event
    if (req.io) {
      req.io.to(`user-${order.userId._id}`).emit('order-updated', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating order status'
    });
  }
});

// @route   GET /api/orders/track/:trackingNumber
// @desc    Track order by tracking number
// @access  Public
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    const shipment = await Shipment.findOne({ trackingNumber })
      .populate({
        path: 'orderId',
        select: 'orderNumber status items shippingAddress',
        populate: {
          path: 'items.productId',
          select: 'title images'
        }
      })
      .lean();

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Tracking number not found'
      });
    }

    res.json({
      success: true,
      data: { shipment }
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error tracking order'
    });
  }
});

module.exports = router;