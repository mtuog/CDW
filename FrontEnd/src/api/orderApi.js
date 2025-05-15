import axios from 'axios';
import { BACKEND_URL_HTTP } from '../config';

const API_URL = `http://${BACKEND_URL_HTTP}/api`;

// Hàm lấy tất cả đơn hàng với phân trang
export const getAllOrders = async (params = {}) => {
  try {
    const { page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc' } = params;
    let url = `${API_URL}/orders?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`;
    
    // Thêm các filter nếu có
    if (params.status && params.status !== 'all') {
      url += `&status=${params.status}`;
    }
    
    if (params.dateFrom) {
      url += `&dateFrom=${params.dateFrom}`;
    }
    
    if (params.dateTo) {
      url += `&dateTo=${params.dateTo}`;
    }
    
    if (params.search) {
      url += `&search=${encodeURIComponent(params.search)}`;
    }
    
    const token = localStorage.getItem('token');
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

// Hàm lấy đơn hàng theo ID
export const getOrderById = async (id) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/orders/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching order with ID ${id}:`, error);
    throw error;
  }
};

// Hàm lấy đơn hàng theo trạng thái
export const getOrdersByStatus = async (status) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/orders/status/${status}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching orders with status ${status}:`, error);
    throw error;
  }
};

// Hàm lấy đơn hàng của một người dùng
export const getOrdersByUser = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/orders/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching orders for user ${userId}:`, error);
    throw error;
  }
};

// Hàm tạo đơn hàng mới
export const createOrder = async (orderData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/orders`, orderData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Hàm cập nhật trạng thái đơn hàng
export const updateOrderStatus = async (id, status) => {
  try {
    console.log(`API call: Updating order ${id} status to ${status}`);
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${API_URL}/orders/${id}/status?status=${status}`, 
      {}, // Empty request body since we're using query params
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Status update response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating status for order ${id}:`, error);
    throw error;
  }
};

// Hàm cập nhật toàn bộ thông tin đơn hàng
export const updateOrder = async (id, orderData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/orders/${id}`, orderData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating order with ID ${id}:`, error);
    throw error;
  }
};

// Hàm hủy đơn hàng
export const cancelOrder = async (id, reason) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${API_URL}/orders/${id}/cancel`, 
      { reason }, 
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error canceling order with ID ${id}:`, error);
    throw error;
  }
};

// Hàm lấy thống kê đơn hàng
export const getOrdersStatistics = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/orders/statistics`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching orders statistics:', error);
    throw error;
  }
}; 