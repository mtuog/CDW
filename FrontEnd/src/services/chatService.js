import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

// Tạo instance của axios với các config mặc định
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
});

// Thêm interceptor để tự động gắn token vào header
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

const chatService = {
  // User APIs
  
  /**
   * Tạo cuộc hội thoại mới hoặc lấy cuộc hội thoại hiện có
   */
  createOrGetConversation: async (subject = '') => {
    const response = await apiClient.post('/chat/conversations', {
      subject: subject
    });
    return response.data;
  },

  /**
   * Lấy danh sách cuộc hội thoại của user
   */
  getUserConversations: async () => {
    const response = await apiClient.get('/chat/conversations');
    return response.data;
  },

  /**
   * Lấy tin nhắn trong cuộc hội thoại
   */
  getConversationMessages: async (conversationId, page = 0, size = 20) => {
    const response = await apiClient.get(`/chat/conversations/${conversationId}/messages`, {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Gửi tin nhắn
   */
  sendMessage: async (conversationId, content) => {
    const response = await apiClient.post(`/chat/conversations/${conversationId}/messages`, {
      content: content
    });
    return response.data;
  },

  /**
   * Đánh dấu tin nhắn đã đọc
   */
  markMessagesAsRead: async (conversationId) => {
    const response = await apiClient.put(`/chat/conversations/${conversationId}/read`);
    return response.data;
  },

  // Auto Chat APIs

  /**
   * Khởi tạo auto chat conversation
   */
  initAutoChat: async (conversationId) => {
    const response = await apiClient.post('/chat/autochat/init', {
      conversationId: conversationId.toString()
    });
    return response.data;
  },

  /**
   * Gửi selection cho auto chat
   */
  sendAutoChatSelection: async (conversationId, userSelection) => {
    const response = await apiClient.post('/chat/autochat/response', {
      conversationId: conversationId,
      message: userSelection
    });
    return response.data;
  },

  // Admin APIs

  /**
   * Lấy tất cả cuộc hội thoại cho admin
   */
  getAdminConversations: async (page = 0, size = 10) => {
    const response = await apiClient.get('/admin/chat/conversations', {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Lấy cuộc hội thoại chờ xử lý
   */
  getPendingConversations: async () => {
    const response = await apiClient.get('/admin/chat/conversations/pending');
    return response.data;
  },

  /**
   * Đếm số cuộc hội thoại chờ xử lý
   */
  getPendingConversationsCount: async () => {
    const response = await apiClient.get('/admin/chat/conversations/pending/count');
    return response.data;
  },

  /**
   * Gán admin xử lý cuộc hội thoại
   */
  assignAdminToConversation: async (conversationId, adminId = null) => {
    const requestBody = adminId ? { adminId } : {};
    const response = await apiClient.put(`/admin/chat/conversations/${conversationId}/assign`, requestBody);
    return response.data;
  },

  /**
   * Gửi tin nhắn từ admin
   */
  sendAdminMessage: async (conversationId, content) => {
    const response = await apiClient.post(`/admin/chat/conversations/${conversationId}/messages`, {
      content: content
    });
    return response.data;
  },

  /**
   * Đánh dấu tin nhắn đã đọc (admin)
   */
  markAdminMessagesAsRead: async (conversationId) => {
    const response = await apiClient.put(`/admin/chat/conversations/${conversationId}/read`);
    return response.data;
  },

  /**
   * Đóng cuộc hội thoại
   */
  closeConversation: async (conversationId) => {
    const response = await apiClient.put(`/admin/chat/conversations/${conversationId}/close`);
    return response.data;
  },

  /**
   * Xóa cuộc hội thoại đã đóng
   */
  deleteConversation: async (conversationId) => {
    const response = await apiClient.delete(`/admin/chat/conversations/${conversationId}`);
    return response.data;
  },

  /**
   * Xóa tất cả cuộc hội thoại đã đóng
   */
  deleteAllClosedConversations: async () => {
    const response = await apiClient.delete('/admin/chat/conversations/closed/all');
    return response.data;
  },

  /**
   * Lấy thống kê chat
   */
  getChatStats: async () => {
    const response = await apiClient.get('/admin/chat/stats');
    return response.data;
  }
};

export default chatService; 