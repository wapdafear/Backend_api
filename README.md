# SurgiMac Reporting System Backend

This is the backend server for the SurgiMac Reporting System. It provides APIs for managing product data including SKU, Brand Name, and Cost Price information.

## Setup Instructions

1. Install dependencies:
   ```
   cd backend
   npm install
   ```

2. Configure environment variables:
   - Review the `.env` file and update the MongoDB connection string if needed

3. Start the server:
   - Development mode: `npm run dev`
   - Production mode: `npm start`

## API Endpoints

### Products API

- **GET /api/products** - Get all products
- **GET /api/products/:sku** - Get product by SKU
- **POST /api/products** - Create a new product
- **PUT /api/products/:sku** - Update product details
- **DELETE /api/products/:sku** - Delete a product
- **POST /api/products/bulk** - Bulk import products

## Frontend

The system includes a simple product management interface accessible at:
- `/product-management`

## Database Schema

The product schema includes:
- `sku` (String, required, unique)
- `brand_name` (String, required)
- `cost_price` (Number, required)
- `last_updated` (Date, auto-generated)

## Tools Used

- Node.js & Express - Backend framework
- MongoDB & Mongoose - Database
- Bootstrap - Frontend CSS framework 