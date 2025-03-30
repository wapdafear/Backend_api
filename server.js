const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB with explicit database name
const mongoURI = process.env.MONGO_URI;
const dbName = 'product_inventory';

mongoose.connect(mongoURI, {
    dbName: dbName, // Explicitly set database name
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log(`MongoDB Connected to database: ${dbName}`);
    
    // Only setup routes after MongoDB is connected
    app.use('/api', require('./routes/api'));
    
    // Start the server after MongoDB connection
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
.catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
});

// Routes
app.get('/product-management', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/product-management.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server Error' });
}); 