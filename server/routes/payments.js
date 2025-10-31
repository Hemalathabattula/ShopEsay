const express = require('express');
const paypal = require('paypal-rest-sdk');
const { auth } = require('../middleware/auth');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// Configure PayPal
paypal.configure({
  mode: process.env.PAYPAL_MODE || 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET
});

// @route   POST /api/payments/paypal/create-order
// @desc    Create PayPal payment
// @access  Private
router.post('/paypal/create-order', auth, async (req, res) => {
  try {
    const { orderData } = req.body;
    const userId = req.user.id;

    // Get user's cart
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Create PayPal payment object
    const create_payment_json = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: `${process.env.CLIENT_URL}/payment/success`,
        cancel_url: `${process.env.CLIENT_URL}/payment/cancel`
      },
      transactions: [{
        item_list: {
          items: cart.items.map(item => ({
            name: item.title,
            sku: `${item.productId._id}-${item.size}-${item.color}`,
            price: item.price.toFixed(2),
            currency: 'USD',
            quantity: item.quantity
          }))
        },
        amount: {
          currency: 'USD',
          total: cart.total.toFixed(2),
          details: {
            subtotal: cart.subtotal.toFixed(2),
            tax: cart.tax.toFixed(2)
          }
        },
        description: `FashionVR Order - ${cart.items.length} items`
      }]
    };

    paypal.payment.create(create_payment_json, async (error, payment) => {
      if (error) {
        console.error('PayPal payment creation error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to create PayPal payment'
        });
      }

      // Create order in database with pending status
      const order = new Order({
        userId,
        items: cart.items.map(item => ({
          productId: item.productId._id,
          sellerId: item.productId.sellerId,
          title: item.title,
          image: item.image,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        subtotal: cart.subtotal,
        tax: cart.tax,
        shipping: 0,
        total: cart.total,
        paymentMethod: 'paypal',
        paymentDetails: {
          paypalOrderId: payment.id
        },
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress || orderData.shippingAddress
      });

      await order.save();

      // Find approval URL
      const approvalUrl = payment.links.find(link => link.rel === 'approval_url');

      res.json({
        success: true,
        data: {
          paymentId: payment.id,
          orderId: order._id,
          approvalUrl: approvalUrl.href
        }
      });
    });
  } catch (error) {
    console.error('Create PayPal order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating payment'
    });
  }
});

// @route   POST /api/payments/paypal/capture
// @desc    Capture PayPal payment
// @access  Private
router.post('/paypal/capture', auth, async (req, res) => {
  try {
    const { paymentId, payerId, orderId } = req.body;

    const execute_payment_json = {
      payer_id: payerId
    };

    paypal.payment.execute(paymentId, execute_payment_json, async (error, payment) => {
      if (error) {
        console.error('PayPal payment execution error:', error);
        return res.status(500).json({
          success: false,
          message: 'Payment execution failed'
        });
      }

      if (payment.state === 'approved') {
        // Update order status
        const order = await Order.findById(orderId).populate('userId');
        if (!order) {
          return res.status(404).json({
            success: false,
            message: 'Order not found'
          });
        }

        order.status = 'confirmed';
        order.paymentStatus = 'paid';
        order.paymentDetails.paypalPaymentId = payment.id;
        order.paymentDetails.paymentDate = new Date();
        order.paymentDetails.transactionId = payment.transactions[0].related_resources[0].sale.id;

        await order.save();

        // Clear user's cart
        await Cart.findOneAndUpdate(
          { userId: req.user.id },
          { items: [], subtotal: 0, tax: 0, total: 0 }
        );

        // Send confirmation email
        try {
          await sendEmail({
            to: order.userId.email,
            subject: `Order Confirmation - ${order.orderNumber}`,
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
          console.error('Order confirmation email failed:', emailError);
        }

        // Emit socket event for real-time updates
        if (req.io) {
          req.io.to(`user-${req.user.id}`).emit('order-confirmed', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            status: order.status
          });

          // Notify sellers
          const sellerIds = [...new Set(order.items.map(item => item.sellerId.toString()))];
          sellerIds.forEach(sellerId => {
            req.io.to(`seller-${sellerId}`).emit('new-order', {
              orderId: order._id,
              orderNumber: order.orderNumber,
              items: order.items.filter(item => item.sellerId.toString() === sellerId)
            });
          });
        }

        res.json({
          success: true,
          message: 'Payment successful',
          data: {
            orderId: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Payment not approved'
        });
      }
    });
  } catch (error) {
    console.error('Capture PayPal payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error capturing payment'
    });
  }
});

module.exports = router;