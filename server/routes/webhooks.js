const express = require('express');
const crypto = require('crypto');
const Order = require('../models/Order');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// @route   POST /api/webhooks/paypal
// @desc    Handle PayPal webhooks
// @access  Public (but verified)
router.post('/paypal', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const payload = req.body;
    const headers = req.headers;

    // Verify PayPal webhook signature (simplified - in production use proper verification)
    const webhookId = headers['paypal-transmission-id'];
    const timestamp = headers['paypal-transmission-time'];
    const signature = headers['paypal-transmission-sig'];

    // Log webhook for debugging
    console.log('PayPal Webhook received:', {
      event_type: payload.event_type,
      resource_type: payload.resource_type,
      webhook_id: webhookId
    });

    // Handle different webhook events
    switch (payload.event_type) {
      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(payload);
        break;
      
      case 'PAYMENT.SALE.DENIED':
        await handlePaymentDenied(payload);
        break;
      
      case 'PAYMENT.SALE.REFUNDED':
        await handlePaymentRefunded(payload);
        break;
      
      default:
        console.log('Unhandled webhook event:', payload.event_type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle payment completed
const handlePaymentCompleted = async (payload) => {
  try {
    const saleId = payload.resource.id;
    const parentPayment = payload.resource.parent_payment;

    // Find order by PayPal payment ID
    const order = await Order.findOne({
      'paymentDetails.paypalOrderId': parentPayment
    }).populate('userId', 'name email');

    if (!order) {
      console.log('Order not found for PayPal payment:', parentPayment);
      return;
    }

    // Update order if not already processed
    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      order.paymentDetails.transactionId = saleId;
      order.paymentDetails.paymentDate = new Date();

      await order.save();

      // Send confirmation email
      try {
        await sendEmail({
          to: order.userId.email,
          subject: `Payment Confirmed - ${order.orderNumber}`,
          template: 'order-confirmation',
          data: {
            name: order.userId.name,
            orderNumber: order.orderNumber,
            items: order.items,
            total: order.total,
            shippingAddress: order.shippingAddress
          }
        });
      } catch (emailError) {
        console.error('Payment confirmation email failed:', emailError);
      }

      console.log('Payment completed for order:', order.orderNumber);
    }
  } catch (error) {
    console.error('Handle payment completed error:', error);
  }
};

// Handle payment denied
const handlePaymentDenied = async (payload) => {
  try {
    const parentPayment = payload.resource.parent_payment;

    const order = await Order.findOne({
      'paymentDetails.paypalOrderId': parentPayment
    }).populate('userId', 'name email');

    if (order) {
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      await order.save();

      console.log('Payment denied for order:', order.orderNumber);
    }
  } catch (error) {
    console.error('Handle payment denied error:', error);
  }
};

// Handle payment refunded
const handlePaymentRefunded = async (payload) => {
  try {
    const saleId = payload.resource.sale_id;
    const refundAmount = parseFloat(payload.resource.amount.total);

    const order = await Order.findOne({
      'paymentDetails.transactionId': saleId
    }).populate('userId', 'name email');

    if (order) {
      order.paymentStatus = 'refunded';
      order.status = 'refunded';
      order.refundAmount = refundAmount;
      await order.save();

      // Send refund notification email
      try {
        await sendEmail({
          to: order.userId.email,
          subject: `Refund Processed - ${order.orderNumber}`,
          template: 'refund-notification',
          data: {
            name: order.userId.name,
            orderNumber: order.orderNumber,
            refundAmount: refundAmount
          }
        });
      } catch (emailError) {
        console.error('Refund notification email failed:', emailError);
      }

      console.log('Refund processed for order:', order.orderNumber);
    }
  } catch (error) {
    console.error('Handle payment refunded error:', error);
  }
};

module.exports = router;