const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Add this diagnostic route
router.get('/debug', async (req, res) => {
    try {
        const products = await Product.find({}).lean();
        const collections = await mongoose.connection.db.listCollections().toArray();
        
        res.json({
            connectionState: mongoose.connection.readyState,
            databaseName: mongoose.connection.db.databaseName,
            collections: collections.map(c => c.name),
            productCount: products.length,
            sampleProduct: products[0] || null
        });
    } catch (err) {
        console.error('Debug route error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get all products
router.get('/products', async (req, res) => {
    try {
        console.log('Fetching all products...');
        const products = await Product.find({}).lean();
        console.log(`Found ${products.length} products`);
        
        // Send the raw data without mapping
        res.json(products);
    } catch (err) {
        console.error('Error in /products route:', err);
        res.status(500).json({ 
            message: 'Server Error',
            error: err.message 
        });
    }
});

// Get single product
router.get('/products/:vp_code', async (req, res) => {
  try {
    const product = await Product.findOne({ vp_code: req.params.vp_code });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create new product
router.post('/products', async (req, res) => {
  try {
    const { vp_code, manufacturer, brand, status, cost } = req.body;
    
    // Check if product with VP_code already exists
    let product = await Product.findOne({ vp_code });
    
    if (product) {
      return res.status(400).json({ message: 'Product with this VP_code already exists' });
    }
    
    // Create new product
    product = new Product({
      vp_code,
      manufacturer,
      brand,
      status,
      cost
    });
    
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update product
router.put('/products/:vp_code', async (req, res) => {
    try {
        const product = await Product.findOneAndUpdate(
            { VP_code: req.params.vp_code },
            { Manufacturer: req.body.manufacturer },
            { new: true }
        );
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Delete product
router.delete('/products/:vp_code', async (req, res) => {
  try {
    const product = await Product.findOne({ vp_code: req.params.vp_code });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    await Product.deleteOne({ vp_code: req.params.vp_code });
    res.json({ message: 'Product removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Bulk import products
router.post('/products/bulk', async (req, res) => {
  try {
    const products = req.body;
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Invalid products data' });
    }
    
    const result = {
      inserted: 0,
      updated: 0,
      errors: []
    };
    
    for (const item of products) {
      try {
        const { vp_code, manufacturer, brand, status, cost } = item;
        
        if (!vp_code) {
          result.errors.push({ vp_code: 'missing', error: 'VP_code is required' });
          continue;
        }
        
        // Try to find existing product
        let product = await Product.findOne({ vp_code });
        
        if (product) {
          // Update existing product
          product.manufacturer = manufacturer || product.manufacturer;
          product.brand = brand || product.brand;
          product.status = status || product.status;
          product.cost = cost !== undefined ? cost : product.cost;
          product.last_updated = Date.now();
          await product.save();
          result.updated++;
        } else {
          // Create new product
          product = new Product({
            vp_code,
            manufacturer: manufacturer || '',
            brand: brand || '',
            status: status || 'Active',
            cost: cost || 0
          });
          await product.save();
          result.inserted++;
        }
      } catch (err) {
        result.errors.push({ vp_code: item.vp_code || 'unknown', error: err.message });
      }
    }
    
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router; 