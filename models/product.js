const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { 
    type: Number, 
    required: [true, "Product price is required"],
    min: [0.01, "Price must be greater than 0"]
  },
  imageUrl: String,
  collectionRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    required: true
  },
  quantity: { type: Number, required: true, default: 0 },
  salesCount: { type: Number, default: 0 }
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);

