const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const mongoose = require("mongoose");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// Configure multer for file upload
const upload = multer({ dest: "uploads/" });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Add this diagnostic route
router.get("/debug", async (req, res) => {
  try {
    const products = await Product.find({}).lean();
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    res.json({
      connectionState: mongoose.connection.readyState,
      databaseName: mongoose.connection.db.databaseName,
      collections: collections.map((c) => c.name),
      productCount: products.length,
      sampleProduct: products[0] || null,
    });
  } catch (err) {
    console.error("Debug route error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all products
router.get("/products", async (req, res) => {
  try {
    console.log("Fetching all products...");
    const products = await Product.find({}).lean();
    console.log(`Found ${products.length} products`);

    // Map the data to include only required fields with consistent naming
    const mappedProducts = products.map((product) => ({
      Sku: product.Sku,
      Description: product.Description || "",
      Manufacturer: product.Manufacturer || "",
      Cost: product.Cost || 0,
      LastUpdated: new Date().toISOString(),
    }));

    res.json(mappedProducts);
  } catch (err) {
    console.error("Error in /products route:", err);
    res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
});

// Get single product
router.get("/products/:Sku", async (req, res) => {
  try {
    const product = await Product.findOne({ Sku: req.params.Sku });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Create new product
router.post("/products", async (req, res) => {
  try {
    const { Sku, Description, Manufacturer, Cost } = req.body;
    
    // Ensure SKU is converted to string
    const skuAsString = String(Sku);

    // Check if product with Sku already exists - search for both string and number versions
    let product = await Product.findOne({ 
      $or: [
        { Sku: skuAsString },
        { Sku: Number(skuAsString) } // In case it's stored as a number
      ] 
    });

    if (product) {
      return res
        .status(400)
        .json({ message: "Product with this Sku already exists" });
    }

    // Create new product
    product = new Product({
      Sku: skuAsString, // Ensure it's stored as string
      Description,
      Manufacturer,
      Cost,
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Update product
router.put("/products/:Sku", async (req, res) => {
  try {
    const { Description, Manufacturer, Cost } = req.body;
    const sku = String(req.params.Sku); // Ensure SKU is converted to string

    console.log('Updating product:', { sku, Description, Manufacturer, Cost });

    // Update the product - search for both string and number versions
    const product = await Product.findOneAndUpdate(
      { 
        $or: [
          { Sku: sku },
          { Sku: Number(sku) } // In case it's stored as a number
        ] 
      },
      {
        $set: {
          Sku: sku, // Ensure it's stored as string
          Description: Description || '',
          Manufacturer: Manufacturer || '',
          Cost: Cost !== undefined ? parseFloat(Cost) : 0,
          LastUpdated: new Date()
        }
      },
      { 
        new: true,
        upsert: false // Don't create if doesn't exist
      }
    );

    if (!product) {
      console.log('Product not found for update:', sku);
      return res.status(404).json({ message: "Product not found" });
    }

    console.log('Updated product:', product);
    res.json(product);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Delete product
router.delete("/products/:Sku", async (req, res) => {
  try {
    const product = await Product.findOne({ Sku: req.params.Sku });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await Product.deleteOne({ Sku: req.params.Sku });
    res.json({ message: "Product removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Bulk import products
router.post("/products/bulk", async (req, res) => {
  try {
    const products = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Invalid products data" });
    }

    const result = {
      inserted: 0,
      updated: 0,
      errors: [],
    };

    for (const item of products) {
      try {
        const { Sku, Description, Manufacturer, Cost } = item;

        if (!Sku) {
          result.errors.push({ Sku: "missing", error: "Sku is required" });
          continue;
        }

        // Try to find existing product
        let product = await Product.findOne({ Sku });

        if (product) {
          // Update existing product
          product.Description = Description || product.Description;
          product.Manufacturer = Manufacturer || product.Manufacturer;
          product.Cost = Cost !== undefined ? Cost : product.Cost;
          await product.save();
          result.updated++;
        } else {
          // Create new product
          product = new Product({
            Sku,
            Description: Description || "",
            Manufacturer: Manufacturer || "",
            Cost: Cost || 0,
          });
          await product.save();
          result.inserted++;
        }
      } catch (err) {
        result.errors.push({ Sku: item.Sku || "unknown", error: err.message });
      }
    }

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});
function csvToJson(csvFilePath) {
  return new Promise((resolve, reject) => {
      const results = [];

      fs.createReadStream(csvFilePath)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', (err) => reject(err));
  });
}
async function uploadCSVdata(data) {
  const result = {
    inserted: 0,
    updated: 0,
    errors: [],
  };

  for (const row of data) {
    try {
      const { Sku, Description, Manufacturer, Cost } = row;
      
      // Ensure SKU is converted to string
      const skuAsString = String(Sku);

      // Try to find existing product - search for both string and number versions
      let product = await Product.findOne({ 
        $or: [
          { Sku: skuAsString },
          { Sku: Number(skuAsString) } // In case it's stored as a number
        ] 
      });

      if (product) {
        // Update existing product
        product.Sku = skuAsString; // Ensure it's stored as string
        product.Description = Description || product.Description;
        product.Manufacturer = Manufacturer || product.Manufacturer;
        product.Cost = Cost !== undefined ? Cost : product.Cost;
        await product.save();
        result.updated++;
      } else {
        // Create new product
        product = new Product({
          Sku: skuAsString, // Ensure it's stored as string
          Description: Description || "",
          Manufacturer: Manufacturer || "",
          Cost: Cost || 0,
        });
        await product.save();
        result.inserted++;
      }
    }
    catch (err) {
      result.errors.push({ Sku: row.Sku || "unknown", error: err.message });
    }
  }
  return result;
}
// Upload products from CSV
router.post("/upload-products", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    console.log(req.file);
    const results = [];
    const filedata = await csvToJson(req.file.path);
    const result = await uploadCSVdata(filedata);
    res.json(result);
 
  } catch (err) {
    console.error("Error processing CSV:", err);
    res.status(500).json({ error: "Error processing CSV file" });
  }
});

// Download CSV template
router.get("/download-template", (req, res) => {
  const headers = ["Sku", "Description", "Manufacturer", "Cost"];
  const csvContent = [
    headers.join(","),
    "Sku123,Product Description,Manufacturer Name,10.99",
    "Sku456,Another Product,Another Manufacturer,15.50",
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=product_template.csv"
  );
  res.send(csvContent);
});

module.exports = router;
