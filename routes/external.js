/**
 * External API Routes
 * Handles proxying requests to external APIs
 */

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

/**
 * Delay function for rate limiting
 * @param {number} ms - Time to delay in milliseconds
 * @returns {Promise} - Promise that resolves after the specified time
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * GET /surgimac/products - Fetch all products from Surgimaccare API
 * Handles pagination automatically to retrieve all available products
 */
router.get('/surgimac/products', async (req, res) => {
    console.log('Starting fetch of all Surgimaccare products');
    
    try {
        // Pagination parameters
        let currentPage = 1;
        let hasMorePages = true;
        let allProducts = [];
        const pageSize = 200; // Number of items per page
        
        // Loop through all pages
        while (hasMorePages) {
            console.log(`Fetching page ${currentPage} with limit ${pageSize}`);
            
            // Construct API URL with pagination parameters
            const apiUrl = `https://surgimaccare.com/webapp/api/products?page=${currentPage}&limit=${pageSize}`;
            
            // Make the API request with the API key
            const response = await fetch(apiUrl, {
                headers: {
                    'API-Key': '61ae8ec8-2db7-47b1-9bb4-1975db2c00e8'
                }
            });
            
            // Handle response status
            if (!response.ok) {
                // Handle rate limiting or server errors with retry
                if (response.status === 429 || response.status >= 500) {
                    console.log(`Rate limited or server error (${response.status}). Waiting 2 seconds before retry...`);
                    await delay(2000);
                    continue; // Retry the same page
                }
                
                // Otherwise, throw an error
                throw new Error(`API responded with status: ${response.status} on page ${currentPage}`);
            }
            
            // Parse response JSON
            const pageData = await response.json();
            
            // Validate response format
            if (!pageData.data || !Array.isArray(pageData.data)) {
                throw new Error('Invalid data format from API');
            }
            
            // Add this page's products to our collection
            const pageProducts = pageData.data;
            allProducts = allProducts.concat(pageProducts);
            console.log(`Added ${pageProducts.length} products from page ${currentPage}. Running total: ${allProducts.length}`);
            
            // Check if we should fetch more pages
            if (pageProducts.length < pageSize) {
                // We received fewer products than requested, so we've reached the end
                hasMorePages = false;
                console.log('Reached final page of products');
            } else {
                // Move to next page and add a small delay to be nice to the API
                currentPage++;
                await delay(300);
            }
        }

        // Return all products in a formatted response
        console.log(`Successfully fetched all products. Total: ${allProducts.length}`);
        res.json({
            status: 200,
            totalReturned: allProducts.length,
            data: allProducts
        });
        
    } catch (error) {
        console.error('Error fetching products from Surgimaccare:', error);
        res.status(500).json({ 
            error: 'Failed to fetch from Surgimaccare API',
            details: error.message 
        });
    }
});

module.exports = router; 