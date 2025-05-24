import axios from 'axios';
import { BACKEND_URL_HTTP } from '../../config';

const API_URL = `${BACKEND_URL_HTTP}/api`;

const paymentSettingsApi = {
  // Lấy cài đặt thanh toán
  getSettings: async () => {
    const token = localStorage.getItem('adminToken');
    
    try {
      const response = await axios.get(`${API_URL}/admin/payment-settings`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      throw error;
    }
  },
  
  // Lưu cài đặt thanh toán
  saveSettings: async (settings) => {
    const token = localStorage.getItem('adminToken');
    console.log('Token admin:', token ? token.substring(0, 20) + '...' : 'Không có token');
    
    try {
      const response = await axios.post(`${API_URL}/admin/payment-settings`, settings, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error saving payment settings:', error);
      console.error('Status:', error.response?.status);
      console.error('Error message:', error.response?.data);
      throw error;
    }
  },
  
  // Lấy cấu hình VNPAY
  getVnpaySettings: async () => {
    const token = localStorage.getItem('adminToken');
    
    try {
      const response = await axios.get(`${API_URL}/admin/payment-settings/vnpay`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching VNPAY settings:', error);
      throw error;
    }
  },
  
  // Cập nhật cấu hình VNPAY
  saveVnpaySettings: async (vnpaySettings) => {
    const token = localStorage.getItem('adminToken');
    
    try {
      const response = await axios.post(`${API_URL}/admin/payment-settings/vnpay`, vnpaySettings, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error saving VNPAY settings:', error);
      throw error;
    }
  },
  
  // Lấy phương thức thanh toán khả dụng
  getAvailablePaymentMethods: async () => {
    try {
      const response = await axios.get(`${API_URL}/payment-settings/available-methods`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available payment methods:', error);
      throw error;
    }
  }
};

export default paymentSettingsApi; 