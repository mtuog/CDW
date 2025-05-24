import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

/**
 * Lấy tất cả kích thước của một sản phẩm
 */
export const getProductSizes = async (productId) => {
  try {
    const response = await axios.get(`${API_URL}/products/${productId}/sizes`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching sizes for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Lấy thông tin kích thước cụ thể của một sản phẩm
 */
export const getProductSizeByName = async (productId, sizeName) => {
  try {
    const response = await axios.get(`${API_URL}/products/${productId}/sizes/${sizeName}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching size ${sizeName} for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Thêm kích thước mới cho sản phẩm
 */
export const addProductSize = async (productId, sizeData) => {
  try {
    // Ensure we're only sending the necessary data, not a full product object
    // This avoids circular reference issues when serializing to JSON
    const simplifiedData = {
      size: sizeData.size,
      quantity: sizeData.quantity || 0,
      active: sizeData.active !== undefined ? sizeData.active : true
    };
    
    console.log(`Adding size for product ${productId}:`, simplifiedData);
    const jsonData = JSON.stringify(simplifiedData);
    
    const response = await axios({
      method: 'post',
      url: `${API_URL}/products/${productId}/sizes`,
      data: jsonData,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error adding size for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Cập nhật nhiều kích thước cùng lúc cho một sản phẩm
 */
export const addProductSizes = async (productId, sizesData) => {
  try {
    console.log(`Adding multiple sizes for product ${productId}:`, sizesData);
    const jsonData = JSON.stringify(sizesData);
    
    const response = await axios({
      method: 'post',
      url: `${API_URL}/products/${productId}/sizes/batch`,
      data: jsonData,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error adding multiple sizes for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Cập nhật thông tin kích thước
 */
export const updateProductSize = async (sizeId, sizeData) => {
  try {
    console.log(`Updating size ${sizeId}:`, sizeData);
    const jsonData = JSON.stringify(sizeData);
    
    const response = await axios({
      method: 'put',
      url: `${API_URL}/sizes/${sizeId}`,
      data: jsonData,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error updating size ${sizeId}:`, error);
    throw error;
  }
};

/**
 * Cập nhật số lượng cho một kích thước
 */
export const updateSizeQuantity = async (sizeId, quantity) => {
  try {
    await axios({
      method: 'put',
      url: `${API_URL}/sizes/${sizeId}/quantity?quantity=${quantity}`,
      data: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return true;
  } catch (error) {
    console.error(`Error updating quantity for size ${sizeId}:`, error);
    throw error;
  }
};

/**
 * Xóa một kích thước
 */
export const deleteSize = async (sizeId) => {
  try {
    await axios.delete(`${API_URL}/sizes/${sizeId}`);
    return true;
  } catch (error) {
    console.error(`Error deleting size ${sizeId}:`, error);
    throw error;
  }
}; 