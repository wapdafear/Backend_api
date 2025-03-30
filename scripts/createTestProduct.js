const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    
    try {
      const testProduct = new Product({
        vp_code: 'TEST-001',
        description: 'Test Product',
        manufacturer: 'Test Manufacturer',
        brand: 'Test Brand',
        status: 'Active',
        cost: 99.99,
        old_count: 10
      });

      await testProduct.save();
      console.log('Test product created');
      process.exit(0);
    } catch (err) {
      console.error('Error creating test product:', err);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }); 