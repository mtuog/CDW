import axios from 'axios';
import { BACKEND_URL_HTTP } from '../config';

const API_URL = `${BACKEND_URL_HTTP}/api/discount-codes`;

const discountCodeApi = {
  /**
   * Lấy tất cả mã giảm giá
   * @returns {Promise<Array>} - danh sách mã giảm giá
   */
  getAllDiscountCodes: async () => {
    try {
      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching discount codes:', error);
      throw error;
    }
  },

  /**
   * Lấy mã giảm giá theo ID
   * @param {number} id - ID của mã giảm giá
   * @returns {Promise<Object>} - thông tin mã giảm giá
   */
  getDiscountCodeById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching discount code with id ${id}:`, error);
      throw error;
    }
  },

  /**
   * Lấy mã giảm giá theo mã code
   * @param {string} code - Mã code
   * @returns {Promise<Object>} - thông tin mã giảm giá
   */
  getDiscountCodeByCode: async (code) => {
    try {
      const response = await axios.get(`${API_URL}/code/${code}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching discount code with code ${code}:`, error);
      throw error;
    }
  },

  /**
   * Lấy tất cả mã giảm giá đang hoạt động
   * @returns {Promise<Array>} - danh sách mã giảm giá đang hoạt động
   */
  getAllActiveDiscountCodes: async () => {
    try {
      const response = await axios.get(`${API_URL}/active`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active discount codes:', error);
      throw error;
    }
  },

  /**
   * Tạo mã giảm giá mới
   * @param {Object} discountCodeData - Dữ liệu mã giảm giá
   * @returns {Promise<Object>} - Thông tin mã giảm giá đã tạo
   */
  createDiscountCode: async (discountCodeData) => {
    try {
      console.log("Sending data to create discount code:", JSON.stringify(discountCodeData));
      
      // Ensure all required number fields have valid values
      const sanitizedData = {
        ...discountCodeData,
        value: discountCodeData.value || "0",
        minimumPurchaseAmount: discountCodeData.minimumPurchaseAmount || "0",
        maximumDiscountAmount: discountCodeData.maximumDiscountAmount || "0"
      };
      
      console.log("Sanitized data for discount code creation:", JSON.stringify(sanitizedData));
      
      const response = await axios.post(API_URL, sanitizedData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating discount code:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        
        // Log specific error details if available
        if (error.response.data && error.response.data.error) {
          console.error('Specific error:', error.response.data.error);
        }
        if (error.response.data && error.response.data.message) {
          console.error('Error message:', error.response.data.message);
        }
        if (error.response.data && error.response.data.details) {
          console.error('Error details:', error.response.data.details);
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      throw error;
    }
  },

  /**
   * Cập nhật mã giảm giá
   * @param {number} id - ID của mã giảm giá
   * @param {Object} discountCodeData - Dữ liệu cập nhật
   * @returns {Promise<Object>} - Thông tin mã giảm giá đã cập nhật
   */
  updateDiscountCode: async (id, discountCodeData) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, discountCodeData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating discount code with id ${id}:`, error);
      throw error;
    }
  },

  /**
   * Xóa mã giảm giá
   * @param {number} id - ID của mã giảm giá cần xóa
   * @returns {Promise<void>}
   */
  deleteDiscountCode: async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
    } catch (error) {
      console.error(`Error deleting discount code with id ${id}:`, error);
      throw error;
    }
  },

  /**
   * Thay đổi trạng thái hoạt động của mã giảm giá
   * @param {number} id - ID của mã giảm giá
   * @returns {Promise<Object>} - Thông tin mã giảm giá đã cập nhật
   */
  toggleDiscountCodeStatus: async (id) => {
    try {
      console.log(`Sending status toggle request for discount code ID: ${id}`);
      
      const response = await axios.get(
        `${API_URL}/${id}/toggle-status`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );
      
      console.log('Toggle status response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error toggling status for discount code with id ${id}:`, error);
      
      // Log more detailed error information
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      } else if (error.request) {
        console.error('No response received:', error.request);
      }
      
      throw error;
    }
  },

  /**
   * Kiểm tra tính hợp lệ của mã giảm giá
   * @param {string} code - Mã code
   * @param {number} orderTotal - Tổng giá trị đơn hàng
   * @param {number} userId - ID của người dùng (tùy chọn)
   * @returns {Promise<number>} - Số tiền giảm giá
   */
  validateDiscountCode: async (code, orderTotal, userId = null) => {
    try {
      // Ensure orderTotal is properly formatted (convert to string with two decimal places)
      const formattedOrderTotal = typeof orderTotal === 'number' 
        ? orderTotal.toFixed(2)
        : orderTotal.toString();
      
      console.log(`Validating discount code: ${code} for order total: ${formattedOrderTotal} and userId: ${userId}`);
      
      // Prepare URL parameters
      const params = new URLSearchParams();
      params.append('code', code);
      params.append('orderTotal', formattedOrderTotal);
      if (userId) params.append('userId', userId);
      
      // Use a direct URL to avoid query parameter encoding issues
      const url = `${API_URL}/validate?${params.toString()}`;
      console.log(`Sending request to: ${url}`);
      
      const response = await axios.get(url);
      
      console.log('Discount validation response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error validating discount code ${code}:`, error);
      throw error;
    }
  },

  /**
   * Áp dụng mã giảm giá (ghi nhận việc sử dụng)
   * @param {string} code - Mã code
   * @param {number} userId - ID của người dùng (tùy chọn)
   * @returns {Promise<void>}
   */
  applyDiscountCode: async (code, userId = null) => {
    try {
      console.log(`Applying discount code: ${code} for userId: ${userId}`);
      
      // Prepare URL parameters
      const params = new URLSearchParams();
      params.append('code', code);
      if (userId) params.append('userId', userId);
      
      // Use a direct URL to avoid query parameter encoding issues
      const url = `${API_URL}/apply?${params.toString()}`;
      console.log(`Sending request to: ${url}`);
      
      await axios.get(url);
      
      console.log('Discount code applied successfully');
    } catch (error) {
      console.error(`Error applying discount code ${code}:`, error);
      throw error;
    }
  },

  /**
   * Kiểm tra tính hợp lệ của mã giảm giá (không tính toán số tiền giảm)
   * @param {string} code - Mã code
   * @param {number} userId - ID của người dùng (tùy chọn)
   * @returns {Promise<Object>} - Thông tin về tính hợp lệ của mã giảm giá
   */
  checkDiscountCode: async (code, userId = null) => {
    try {
      console.log(`Checking discount code validity: ${code} for userId: ${userId}`);
      
      // Prepare URL parameters
      const params = new URLSearchParams();
      params.append('code', code);
      if (userId) params.append('userId', userId);
      
      // Use a direct URL to avoid query parameter encoding issues
      const url = `${API_URL}/check?${params.toString()}`;
      console.log(`Sending request to: ${url}`);
      
      const response = await axios.get(url);
      
      console.log('Discount code validity check response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error checking discount code ${code}:`, error);
      
      // Handle error responses and provide structured data
      if (error.response) {
        return error.response.data;
      }
      
      // Return a default error object if no response
      return {
        valid: false,
        reason: 'REQUEST_FAILED',
        message: 'Không thể kết nối đến máy chủ để kiểm tra mã giảm giá'
      };
    }
  }
};

export default discountCodeApi; 