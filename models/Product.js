const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  VP_code: {
    type: String,
    required: true,
    unique: true
  },
  Description: {
    type: String
  },
  Manufacturer: {
    type: String
  },
  Brand: {
    type: String
  },
  Status: {
    type: String,
    default: 'Active'
  },
  Cost: {
    type: Number,
    default: 0
  },
  old_count: {
    type: Number,
    default: 0
  }
}, { collection: 'products' });

module.exports = mongoose.model('Product', ProductSchema, 'products'); 