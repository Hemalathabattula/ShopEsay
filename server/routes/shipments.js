const express = require('express');
const { body, validationResult } = require('express-validator');
const Shipment = require('../models/Shipment');
const Order = require('../models/Order');
const { auth, authorize } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// @route   POST /api/shipments
// @desc    Create shipment
// @access  Private (Seller/Admin)
router.post('/', [
  auth,
  authorize('SELLER', 'ADMIN'),
  body('orderId').isMongoId().withMessage('Invalid order ID'),
  body('trackingNumber').trim().isLength({ min: 5 }).withMessage('Tracking number is required'),
  body('carrier').isIn(['fedex', 'ups', 'usps', 'dhl', 'other']).withMessage('Invalid carrier')
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

    const { orderId, trackingNumber, carrier, weight, dimensions } = req.body;

    // Verify order exists and user has permission
    const order = await Order.findById(orderId).populate('userId', 'name email');
    
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
          message: 'Not authorized to create shipment for this order'
        });
      }
    }

    // Check if shipment already exists
    const existingShipment = await Shipment.findOne({ orderId });
    if (existingShipment) {
      return res.status(400).json({
        success: false,
        message: 'Shipment already exists for this order'
      });
    }

    // Create shipment
    const shipment = new Shipment({
      orderId,
      trackingNumber,
      carrier,
      shippingAddress: order.shippingAddress,
      weight,
      dimensions,
      events: [{
        status: 'label_created',
        description: 'Shipping label created',
        timestamp: new Date()
      }]
    });

    await shipment.save();

    // Update order status
    order.status = 'shipped';
    order.trackingNumber = trackingNumber;
    order.carrier = carrier;
    await order.save();

    // Send shipping notification
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

    // Emit socket event
    if (req.io) {
      req.io.to(`user-${order.userId._id}`).emit('order-shipped', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        trackingNumber,
        carrier
      });
    }

    res.status(201).json({
      success: true,
      message: 'Shipment created successfully',
      data: { shipment }
    });
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating shipment'
    });
  }
});

// @route   GET /api/shipments/track/:trackingNumber
// @desc    Track shipment
// @access  Public
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ 
      trackingNumber: req.params.trackingNumber 
    })
      .populate({
        path: 'orderId',
        select: 'orderNumber items shippingAddress',
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
    console.error('Track shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error tracking shipment'
    });
  }
});

// @route   PATCH /api/shipments/:id/status
// @desc    Update shipment status
// @access  Private (Seller/Admin)
router.patch('/:id/status', [
  auth,
  authorize('SELLER', 'ADMIN'),
  body('status').isIn(['label_created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception']).withMessage('Invalid status'),
  body('location').optional().trim().isLength({ min: 2 }).withMessage('Location must be at least 2 characters'),
  body('description').optional().trim().isLength({ min: 5 }).withMessage('Description must be at least 5 characters')
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

    const { status, location, description } = req.body;
    
    const shipment = await Shipment.findById(req.params.id)
      .populate({
        path: 'orderId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    // Check authorization for sellers
    if (req.user.role === 'SELLER') {
      const hasSellerItems = shipment.orderId.items.some(item => 
        item.sellerId.toString() === req.user.id
      );
      
      if (!hasSellerItems) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this shipment'
        });
      }
    }

    // Update shipment status
    shipment.status = status;
    
    // Add tracking event
    shipment.events.push({
      status,
      location,
      description: description || `Package ${status.replace('_', ' ')}`,
      timestamp: new Date()
    });

    // Set delivery date if delivered
    if (status === 'delivered') {
      shipment.actualDelivery = new Date();
      
      // Update order status
      shipment.orderId.status = 'delivered';
      await shipment.orderId.save();
    }

    await shipment.save();

    // Emit socket event
    if (req.io) {
      req.io.to(`user-${shipment.orderId.userId._id}`).emit('shipment-updated', {
        trackingNumber: shipment.trackingNumber,
        status,
        location,
        description
      });
    }

    res.json({
      success: true,
      message: 'Shipment status updated successfully',
      data: { shipment }
    });
  } catch (error) {
    console.error('Update shipment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating shipment status'
    });
  }
});

module.exports = router;