const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Product = require('../models/Product');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

// Sample data
const sampleProducts = [
    {
        vp_code: "VP001",
        description: "Dental Implant Kit",
        manufacturer: "DentalCo",
        brand: "ImplantPro",
        status: "Active",
        cost: 299.99,
        old_count: 25
    },
    {
        vp_code: "VP002",
        description: "Orthodontic Brackets",
        manufacturer: "OrthoTech",
        brand: "BraceMaster",
        status: "Active",
        cost: 149.99,
        old_count: 50
    },
    {
        vp_code: "VP003",
        description: "Surgical Forceps",
        manufacturer: "SurgicalPro",
        brand: "PrecisionGrip",
        status: "Active",
        cost: 79.99,
        old_count: 15
    },
    {
        vp_code: "VP004",
        description: "Dental Chair Unit",
        manufacturer: "MedEquip",
        brand: "ComfortDent",
        status: "Active",
        cost: 1999.99,
        old_count: 5
    },
    {
        vp_code: "VP005",
        description: "Sterilization Unit",
        manufacturer: "SterilTech",
        brand: "AutoClave",
        status: "Active",
        cost: 599.99,
        old_count: 8
    }
];

async function insertSampleData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Clear existing data (optional)
        await Product.deleteMany({});
        console.log('Cleared existing products');

        // Insert sample data
        const result = await Product.insertMany(sampleProducts);
        console.log(`Inserted ${result.length} sample products`);

        // Verify the data
        const count = await Product.countDocuments();
        console.log(`Total products in database: ${count}`);

        // Close the connection
        await mongoose.connection.close();
        console.log('Database connection closed');

    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the function
insertSampleData(); 