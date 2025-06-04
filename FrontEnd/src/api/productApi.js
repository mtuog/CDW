import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

// Tạo axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - thêm token nếu có
apiClient.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle lỗi cơ bản
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
);

// ==================== PRODUCT API FUNCTIONS ====================

// Hàm lấy tất cả sản phẩm
export const getAllProducts = async () => {
  try {
    const response = await apiClient.get('/products');
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Hàm lấy sản phẩm theo ID
export const getProductById = async (id) => {
  try {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product with ID ${id}:`, error);
    throw error;
  }
};

// Hàm lấy sản phẩm theo danh mục
export const getProductsByCategory = async (categoryName) => {
  try {
    const response = await apiClient.get(`/products/category/${categoryName}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching products in category ${categoryName}:`, error);
    throw error;
  }
};

// Hàm lấy sản phẩm theo ID danh mục
export const getProductsByCategoryId = async (categoryId) => {
  try {
    const response = await apiClient.get(`/products/category-id/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching products with category ID ${categoryId}:`, error);
    throw error;
  }
};

// Hàm lấy sản phẩm bán chạy
export const getBestSellerProducts = async () => {
  try {
    const response = await apiClient.get('/products/bestseller');
    return response.data;
  } catch (error) {
    console.error('Error fetching bestseller products:', error);
    throw error;
  }
};

// Hàm lấy sản phẩm mới
export const getNewProducts = async () => {
  try {
    const response = await apiClient.get('/products/new');
    return response.data;
  } catch (error) {
    console.error('Error fetching new products:', error);
    throw error;
  }
};

// Hàm lấy sản phẩm được yêu thích
export const getFavoriteProducts = async () => {
  try {
    const response = await apiClient.get('/products/favorite');
    return response.data;
  } catch (error) {
    console.error('Error fetching favorite products:', error);
    throw error;
  }
};

// Hàm lấy top 10 sản phẩm bán chạy nhất
export const getTopSellingProducts = async () => {
  try {
    const response = await apiClient.get('/products/top-selling');
    return response.data;
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    throw error;
  }
};

// Hàm lấy sản phẩm nổi bật
export const getFeaturedProducts = async () => {
  try {
    const response = await apiClient.get('/products/featured');
    return response.data;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    throw error;
  }
};

// Hàm tạo sản phẩm mới
export const createProduct = async (productData) => {
  try {
    console.log('Sending create product request:', productData);

    const response = await apiClient.post('/products', productData);

    console.log('Create product response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Hàm cập nhật sản phẩm
export const updateProduct = async (id, productData) => {
  try {
    console.log('Sending update product request:', { id, productData });

    const response = await apiClient.put(`/products/${id}`, productData);

    console.log('Update product response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating product with ID ${id}:`, error);
    throw error;
  }
};

// Hàm cập nhật trạng thái tồn kho của sản phẩm
export const updateProductStock = async (id, inStock) => {
  try {
    const response = await apiClient.put(`/products/${id}/stock?inStock=${inStock}`, {});
    return response.data;
  } catch (error) {
    console.error(`Error updating stock status for product with ID ${id}:`, error);
    throw error;
  }
};

// Hàm cập nhật số lượng sản phẩm
export const updateProductQuantity = async (id, quantity) => {
  try {
    const response = await apiClient.put(`/products/${id}/quantity?quantity=${quantity}`, {});
    return response.data;
  } catch (error) {
    console.error(`Error updating quantity for product with ID ${id}:`, error);
    throw error;
  }
};

// Hàm xóa sản phẩm
export const deleteProduct = async (id) => {
  try {
    await apiClient.delete(`/products/${id}`);
  } catch (error) {
    console.error(`Error deleting product with ID ${id}:`, error);
    throw error;
  }
};

export default {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  getProductsByCategoryId,
  getBestSellerProducts,
  getNewProducts,
  getFavoriteProducts,
  getTopSellingProducts,
  getFeaturedProducts,
  createProduct,
  updateProduct,
  updateProductStock,
  updateProductQuantity,
  deleteProduct
};
