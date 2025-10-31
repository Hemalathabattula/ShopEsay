const mongoose = require('mongoose');

const trackingEventSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  location: String,
  description: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const shipmentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  trackingNumber: {
    type: String,
    required: true,
    unique: true
  },
  carrier: {
    type: String,
    required: true,
    enum: ['fedex', 'ups', 'usps', 'dhl', 'other']
  },
  status: {
    type: String,
    enum: ['label_created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception'],
    default: 'label_created'
  },
  shippingAddress: {
    firstName: String,
    lastName: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  events: [trackingEventSchema],
  estimatedDelivery: Date,
  actualDelivery: Date,
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  shippingCost: {
    type: Number,
    min: 0
  },
  notes: String
}, {
  timestamps: true
});

// Add tracking event when status changes
shipmentSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.events.push({
      status: this.status,
      timestamp: new Date(),
      description: `Package ${this.status.replace('_', ' ')}`
    });
  }
  next();
});

module.exports = mongoose.model('Shipment', shipmentSchema);