import axios from 'axios';
import { BACKEND_URL_HTTP } from '../config';
import authApi from './authApi';

const API_BASE_URL = BACKEND_URL_HTTP;

const paymentSettingsApi = {
  // Lấy cài đặt thanh toán (admin)
  getSettings: async () => {
    try {
      console.log('=== Payment Settings API: Getting settings ===');
      
      const token = authApi.getToken();
      console.log('Token available:', !!token);
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/admin/payment-settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Settings retrieved successfully:', data);
      return data;
    } catch (error) {
      console.error('Error getting payment settings:', error);
      throw error;
    }
  },
  
  // Lưu cài đặt thanh toán (admin)
  saveSettings: async (settings) => {
    try {
      console.log('=== Payment Settings API: Saving settings ===');
      console.log('Settings to save:', settings);
      
      const token = authApi.getToken();
      console.log('Token available:', !!token);
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/admin/payment-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      });
      
      console.log('Save response status:', response.status);
      console.log('Save response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Save API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Settings saved successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error saving payment settings:', error);
      throw error;
    }
  },
  
  // Lấy cấu hình VNPAY
  getVnpaySettings: async () => {
    const token = authApi.getToken();
    
    try {
      const response = await axios.get(`${BACKEND_URL_HTTP}/api/admin/payment-settings/vnpay`, {
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
    const token = authApi.getToken();
    
    try {
      const response = await axios.post(`${BACKEND_URL_HTTP}/api/admin/payment-settings/vnpay`, vnpaySettings, {
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
      const response = await axios.get(`${BACKEND_URL_HTTP}/api/payment-settings/available-methods`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available payment methods:', error);
      throw error;
    }
  }
};

export default paymentSettingsApi; 