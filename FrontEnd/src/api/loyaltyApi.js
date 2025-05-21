import axios from 'axios';
import { BACKEND_URL_HTTP, CORS_CONFIG } from '../config';

const API_URL = `${BACKEND_URL_HTTP}/api/loyalty`;

const loyaltyApi = {
  /**
   * Get loyalty information for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Loyalty info including points, rank, transactions
   */
  getUserLoyaltyInfo: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/${userId}`, {
        ...CORS_CONFIG,
        // Tạm thời bỏ yêu cầu token để test
        // headers: {
        //   ...CORS_CONFIG.headers,
        //   Authorization: `Bearer ${localStorage.getItem('token')}`
        // }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user loyalty info:', error);
      throw error;
    }
  },
  
  /**
   * Get all users with their loyalty information
   * @returns {Promise<Array>} - List of users with loyalty info
   */
  getAllUsersWithLoyaltyInfo: async () => {
    try {
      const response = await axios.get(`${API_URL}/users`, {
        ...CORS_CONFIG,
        // Tạm thời bỏ yêu cầu token để test
        // headers: {
        //   ...CORS_CONFIG.headers,
        //   Authorization: `Bearer ${localStorage.getItem('token')}`
        // }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users with loyalty info:', error);
      throw error;
    }
  },
  
  /**
   * Add loyalty points to a user
   * @param {number} userId - User ID
   * @param {number} points - Points to add
   * @param {string} description - Description of the transaction
   * @returns {Promise<Object>} - Transaction details
   */
  addPoints: async (userId, points, description) => {
    try {
      const response = await axios.post(
        `${API_URL}/add-points/${userId}?points=${points}&description=${encodeURIComponent(description)}`, 
        null,
        {
          ...CORS_CONFIG,
          // Tạm thời bỏ yêu cầu token để test
          // headers: {
          //   ...CORS_CONFIG.headers,
          //   Authorization: `Bearer ${localStorage.getItem('token')}`
          // }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding loyalty points:', error);
      throw error;
    }
  },
  
  /**
   * Redeem (use) loyalty points for a user
   * @param {number} userId - User ID
   * @param {number} points - Points to redeem
   * @param {string} description - Description of the transaction
   * @returns {Promise<Object>} - Transaction details
   */
  redeemPoints: async (userId, points, description) => {
    try {
      const response = await axios.post(
        `${API_URL}/redeem-points/${userId}?points=${points}&description=${encodeURIComponent(description)}`, 
        null,
        {
          ...CORS_CONFIG,
          // Tạm thời bỏ yêu cầu token để test
          // headers: {
          //   ...CORS_CONFIG.headers,
          //   Authorization: `Bearer ${localStorage.getItem('token')}`
          // }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error redeeming loyalty points:', error);
      throw error;
    }
  },
  
  /**
   * Get transaction history for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - List of transactions
   */
  getUserTransactions: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/transactions/${userId}`, {
        ...CORS_CONFIG,
        // Tạm thời bỏ yêu cầu token để test
        // headers: {
        //   ...CORS_CONFIG.headers,
        //   Authorization: `Bearer ${localStorage.getItem('token')}`
        // }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      throw error;
    }
  },
  
  /**
   * Process all delivered orders that haven't had loyalty points added yet
   * @returns {Promise<Object>} - Processing results
   */
  processDeliveredOrders: async () => {
    try {
      const response = await axios.post(`${API_URL}/process-delivered-orders`, null, {
        ...CORS_CONFIG,
        // Tạm thời bỏ yêu cầu token để test
        // headers: {
        //   ...CORS_CONFIG.headers,
        //   Authorization: `Bearer ${localStorage.getItem('token')}`
        // }
      });
      return response.data;
    } catch (error) {
      console.error('Error processing delivered orders:', error);
      throw error;
    }
  }
};

export default loyaltyApi; 