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

// External API routes (these don't depend on MongoDB)
app.use('/external', require('./routes/external'));

// Connect to MongoDB with explicit database name
const mongoURI = process.env.MONGO_URI;
const dbName = 'product_inventory';

mongoose.connect(mongoURI, {
    dbName: dbName,
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log(`MongoDB Connected to database: ${dbName}`);
    
    // Setup database-dependent routes
    app.use('/api', require('./routes/api'));
    app.use('/api/products', require('./routes/products'));
})
.catch(err => {
    console.error('MongoDB Connection Error:', err);
    console.log('Continuing without database functionality');
});

// Static routes
app.get('/product-management', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/product-management.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ message: 'Server Error', details: err.message });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`External API routes available at http://localhost:${PORT}/external`);
}); 