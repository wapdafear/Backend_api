const axios = require('axios');

const API_URL = 'https://backend-api-4679.onrender.com/api'; // adjust if your port is different

async function testAPI() {
  try {
    // Test GET all products
    console.log('Testing GET all products...');
    const response = await axios.get(`${API_URL}/products`); 
    console.log(`Found ${response.data.length} products`);
    console.log('Sample product:', response.data[0]);

    // Test GET single product
    const sampleVpCode = response.data[0].vp_code;
    console.log(`\nTesting GET single product (${sampleVpCode})...`);
    const singleProduct = await axios.get(`${API_URL}/products/${sampleVpCode}`);
    console.log('Single product:', singleProduct.data); 

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAPI(); 