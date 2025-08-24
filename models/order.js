const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    priceAtPurchase: {
      type: Number,
      required: true
    }
  }],
  shippingInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    shippingMethod: String,
    shippingCost: Number,
    deliveryInstructions: String
  },
  paymentInfo: {
    method: String,
    cardLast4: String,
    reference: String
  },
  subtotal: Number,
  tax: Number,
  shippingCost: Number,
  total: Number,
  status: {
    type: String,
    enum: ['pending-payment', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'processing'
  }
}, { timestamps: true });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
