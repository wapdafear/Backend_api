const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  Sku: {
    type: String,
    required: true,
    // unique: true
  },
  Description: {
    type: String
  },
  Manufacturer: {
    type: String
  },
  Cost: {
    type: Number,
    default: 0
  }
}, { collection: 'products' });

module.exports = mongoose.model('Product', ProductSchema, 'products'); 