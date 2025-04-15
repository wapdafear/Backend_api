const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  Sku: {
    type: String,
    required: true,
    unique: true,
    set: value => String(value) // Force conversion to string
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
  },
  LastUpdated: {
    type: Date,
    default: Date.now
  }
}, { collection: 'products' });

// Add pre-save hook to ensure SKU is always a string
ProductSchema.pre('save', function(next) {
  if (typeof this.Sku !== 'string') {
    this.Sku = String(this.Sku);
  }
  next();
});

module.exports = mongoose.model('Product', ProductSchema, 'products'); 