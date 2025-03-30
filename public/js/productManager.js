const API_URL = '/api';

// Function to get all products
async function getProducts() {
  try {
    const response = await fetch(`${API_URL}/products`);
    console.log(response);
    
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

// Function to get product by SKU
async function getProductBySku(sku) {
  try {
    const response = await fetch(`${API_URL}/products/${sku}`);
    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching product with SKU ${sku}:`, error);
    throw error;
  }
}

// Function to create a new product
async function createProduct(productData) {
  try {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create product');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

// Function to update a product
async function updateProduct(sku, productData) {
  try {
    const response = await fetch(`${API_URL}/products/${sku}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update product');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating product with SKU ${sku}:`, error);
    throw error;
  }
}

// Function to delete a product
async function deleteProduct(sku) {
  try {
    const response = await fetch(`${API_URL}/products/${sku}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete product');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error deleting product with SKU ${sku}:`, error);
    throw error;
  }
}

// Function to bulk import products
async function bulkImportProducts(productsArray) {
  try {
    const response = await fetch(`${API_URL}/products/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productsArray),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to import products');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error importing products:', error);
    throw error;
  }
}

// Function to render products table
function renderProductsTable(products, tableSelector) {
  const table = document.querySelector(tableSelector);
  if (!table) return;
  
  // Clear existing rows
  table.querySelector('tbody').innerHTML = '';
  
  products.forEach(product => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${product.sku}</td>
      <td contenteditable="true" class="editable" data-field="brand_name" data-sku="${product.sku}">${product.brand_name}</td>
      <td contenteditable="true" class="editable" data-field="cost_price" data-sku="${product.sku}">${product.cost_price}</td>
      <td>${new Date(product.last_updated).toLocaleString()}</td>
      <td>
        <button class="btn btn-sm btn-primary save-btn" data-sku="${product.sku}">Save</button>
        <button class="btn btn-sm btn-danger delete-btn" data-sku="${product.sku}">Delete</button>
      </td>
    `;
    table.querySelector('tbody').appendChild(row);
  });
  
  // Add event listeners for inline editing
  setupEditableFields();
}

// Function to setup editable fields
function setupEditableFields() {
  // Save button click handler
  document.querySelectorAll('.save-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const sku = e.target.getAttribute('data-sku');
      const row = e.target.closest('tr');
      const brand_name = row.querySelector('[data-field="brand_name"]').textContent;
      const cost_price = parseFloat(row.querySelector('[data-field="cost_price"]').textContent);
      
      try {
        await updateProduct(sku, { brand_name, cost_price });
        showAlert('Product updated successfully', 'success');
        // Refresh the products list
        const products = await getProducts();
        renderProductsTable(products, '#products-table');
      } catch (error) {
        showAlert(`Error: ${error.message}`, 'danger');
      }
    });
  });
  
  // Delete button click handler
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      if (!confirm('Are you sure you want to delete this product?')) return;
      
      const sku = e.target.getAttribute('data-sku');
      try {
        await deleteProduct(sku);
        showAlert('Product deleted successfully', 'success');
        // Refresh the products list
        const products = await getProducts();
        renderProductsTable(products, '#products-table');
      } catch (error) {
        showAlert(`Error: ${error.message}`, 'danger');
      }
    });
  });
}

// Function to show alert message
function showAlert(message, type = 'info') {
  const alertBox = document.createElement('div');
  alertBox.className = `alert alert-${type} alert-dismissible fade show`;
  alertBox.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  const alertContainer = document.querySelector('#alert-container');
  if (alertContainer) {
    alertContainer.appendChild(alertBox);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      alertBox.remove();
    }, 5000);
  }
}

// Initialize the product manager
document.addEventListener('DOMContentLoaded', () => {
  const productForm = document.querySelector('#product-form');
  const importForm = document.querySelector('#import-form');
  
  // Load and display products
  getProducts()
    .then(products => {
      renderProductsTable(products, '#products-table');
    })
    .catch(error => {
      showAlert(`Error loading products: ${error.message}`, 'danger');
    });
  
  // Handle product form submission
  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const sku = document.querySelector('#sku').value;
      const brand_name = document.querySelector('#brand_name').value;
      const cost_price = parseFloat(document.querySelector('#cost_price').value);
      
      try {
        await createProduct({ sku, brand_name, cost_price });
        showAlert('Product added successfully', 'success');
        productForm.reset();
        
        // Refresh the products list
        const products = await getProducts();
        renderProductsTable(products, '#products-table');
      } catch (error) {
        showAlert(`Error: ${error.message}`, 'danger');
      }
    });
  }
  
  // Handle file import
  if (importForm) {
    importForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const fileInput = document.querySelector('#import-file');
      if (!fileInput.files.length) {
        showAlert('Please select a file to import', 'warning');
        return;
      }
      
      const file = fileInput.files[0];
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        showAlert('Please select a JSON file', 'warning');
        return;
      }
      
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const productsData = JSON.parse(e.target.result);
            
            if (!Array.isArray(productsData)) {
              showAlert('Invalid file format. Expected an array of products', 'danger');
              return;
            }
            
            const result = await bulkImportProducts(productsData);
            showAlert(`Import completed: ${result.inserted} inserted, ${result.updated} updated, ${result.errors.length} errors`, 'success');
            
            // Refresh the products list
            const products = await getProducts();
            renderProductsTable(products, '#products-table');
          } catch (error) {
            showAlert(`Error parsing file: ${error.message}`, 'danger');
          }
        };
        reader.readAsText(file);
      } catch (error) {
        showAlert(`Error importing file: ${error.message}`, 'danger');
      }
    });
  }
}); 