const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const templates = {
  welcome: (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">Welcome to Fashion Era!</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hello ${data.name}!</h2>
        <p>Welcome to Fashion Era, where fashion meets excellence!</p>
        <p>Your ${data.role.toLowerCase()} account has been created successfully.</p>
        ${data.role === 'SELLER' ? 
          '<p>You can now start adding products to your store and manage your business through the seller dashboard.</p>' :
          '<p>Start exploring our amazing collection and try our revolutionary virtual try-on feature!</p>'
        }
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
            Get Started
          </a>
        </div>
        <p>Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `,
  
  'order-confirmation': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #28a745; padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">Order Confirmed!</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hello ${data.name}!</h2>
        <p>Thank you for your order! Your order <strong>${data.orderNumber}</strong> has been confirmed.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details:</h3>
          ${data.items.map(item => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
              <strong>${item.title}</strong><br>
              Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity}<br>
              <span style="color: #28a745;">$${item.total.toFixed(2)}</span>
            </div>
          `).join('')}
          <div style="text-align: right; margin-top: 15px; font-size: 18px;">
            <strong>Total: $${data.total.toFixed(2)}</strong>
          </div>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Shipping Address:</h3>
          <p>
            ${data.shippingAddress.firstName} ${data.shippingAddress.lastName}<br>
            ${data.shippingAddress.address}<br>
            ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/orders/${data.orderNumber}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
            Track Your Order
          </a>
        </div>
        
        <p>We'll send you another email when your order ships.</p>
        <p>Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `,

  'order-shipped': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #007bff; padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">Your Order Has Shipped!</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hello ${data.name}!</h2>
        <p>Great news! Your order <strong>${data.orderNumber}</strong> has been shipped.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Tracking Information:</h3>
          <p><strong>Carrier:</strong> ${data.carrier}</p>
          <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
          <p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/track/${data.trackingNumber}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
            Track Package
          </a>
        </div>
        
        <p>Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `,

  'password-reset': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc3545; padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">Password Reset Request</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hello ${data.name}!</h2>
        <p>You requested a password reset for your Fashion Era account.</p>
        <p>Click the button below to reset your password. This link will expire in 1 hour.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetUrl}" style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
        </div>

        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `,

  'seller-new-order': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #ffc107; padding: 40px; text-align: center;">
        <h1 style="color: #212529; margin: 0;">New Order Received!</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hello ${data.sellerName}!</h2>
        <p>You have received a new order <strong>${data.orderNumber}</strong>!</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Items:</h3>
          ${data.items.map(item => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
              <strong>${item.title}</strong><br>
              Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity}<br>
              <span style="color: #28a745;">$${item.total.toFixed(2)}</span>
            </div>
          `).join('')}
          <div style="text-align: right; margin-top: 15px; font-size: 18px;">
            <strong>Your Earnings: $${data.sellerEarnings.toFixed(2)}</strong>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/seller-dashboard/orders" style="background: #ffc107; color: #212529; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
            Manage Order
          </a>
        </div>

        <p>Please process this order as soon as possible.</p>
        <p>Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `,

  'low-stock-alert': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #fd7e14; padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">Low Stock Alert</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hello ${data.sellerName}!</h2>
        <p>Some of your products are running low on stock:</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${data.products.map(product => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
              <strong>${product.title}</strong><br>
              <span style="color: #fd7e14;">Only ${product.stock} left in stock</span>
            </div>
          `).join('')}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/seller-dashboard/products" style="background: #fd7e14; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
            Update Inventory
          </a>
        </div>

        <p>Consider restocking these items to avoid missing sales.</p>
        <p>Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `,

  'refund-notification': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #6c757d; padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">Refund Processed</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hello ${data.name}!</h2>
        <p>Your refund for order <strong>${data.orderNumber}</strong> has been processed.</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Refund Details:</h3>
          <p><strong>Refund Amount:</strong> $${data.refundAmount.toFixed(2)}</p>
          <p><strong>Processing Time:</strong> 3-5 business days</p>
          <p><strong>Refund Method:</strong> Original payment method</p>
        </div>

        <p>The refund will appear on your statement within 3-5 business days.</p>
        <p>Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `
};

// Send email function
const sendEmail = async ({ to, subject, template, data }) => {
  try {
    const transporter = createTransporter();
    
    // Get HTML template
    const html = templates[template] ? templates[template](data) : data.html;
    
    const mailOptions = {
      from: `"Fashion Era" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', {
      message: error.message,
      code: error.code,
      response: error.response,
      stack: error.stack
    });
    throw new Error('Failed to send email. Please check server logs for details.');
  }
};

// Send bulk emails
const sendBulkEmails = async (emails) => {
  const results = [];
  
  for (const email of emails) {
    try {
      const result = await sendEmail(email);
      results.push({ success: true, messageId: result.messageId, to: email.to });
    } catch (error) {
      results.push({ success: false, error: error.message, to: email.to });
    }
  }
  
  return results;
};

module.exports = {
  sendEmail,
  sendBulkEmails
};
