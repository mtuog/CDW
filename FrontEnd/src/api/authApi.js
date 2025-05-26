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

const authApi = {
    // Login admin user
    login: async (email, password) => {
        try {
            console.log(`Đang gửi yêu cầu đăng nhập với email: ${email}`);
            
            // Sử dụng API login thông thường thay vì API admin riêng biệt
            const response = await apiClient.post('/UserServices/login', {
                email,
                password
            });
            
            console.log('Phản hồi từ server:', response);
            console.log('Response data:', JSON.stringify(response.data));
            
            if (!response.data) {
                throw new Error('Không nhận được dữ liệu phản hồi từ server');
            }
            
            // Kiểm tra userRoles (mảng)
            if (!response.data.userRoles || !Array.isArray(response.data.userRoles) || response.data.userRoles.length === 0) {
                console.error('Không tìm thấy thông tin role trong response:', response.data);
                throw new Error('Thông tin xác thực không hợp lệ');
            }
            
            // Kiểm tra quyền ADMIN
            if (!response.data.userRoles.includes('ADMIN')) {
                console.error('Tài khoản không có quyền admin, roles:', response.data.userRoles);
                throw new Error('Bạn không có quyền truy cập trang quản trị');
            }
            
            // Lưu thông tin đăng nhập vào localStorage
            localStorage.setItem('adminToken', response.data.token);
            localStorage.setItem('adminUsername', response.data.userName);
            localStorage.setItem('adminId', response.data.userId);
            localStorage.setItem('adminRole', 'ADMIN');
            
            console.log('Đăng nhập thành công với roles:', response.data.userRoles);
            
            return response.data;
        } catch (error) {
            console.error('Admin login error:', error);
            
            if (error.response) {
                console.error('Server response status:', error.response.status);
                console.error('Server response data:', JSON.stringify(error.response.data));
                
                // Xử lý thông báo lỗi cụ thể từ server
                const errorMessage = error.response.data.message || 'Đã xảy ra lỗi khi đăng nhập';
                throw { message: errorMessage, status: error.response.status };
            } else if (error.request) {
                console.error('No response received:', error.request);
                throw { message: 'Không nhận được phản hồi từ server. Vui lòng kiểm tra kết nối mạng.', status: 0 };
            } else {
                console.error('Error message:', error.message);
                throw { message: error.message || 'Đã xảy ra lỗi khi đăng nhập', status: 500 };
            }
        }
    },
    
    // Check if admin is authenticated
    checkAuth: async () => {
        const token = localStorage.getItem('adminToken');
        const role = localStorage.getItem('adminRole');
        if (!token || role !== 'ADMIN') {
            return { authenticated: false };
        }
        return { authenticated: true };
    },
    
    // Logout admin user
    logout: () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUsername');
        localStorage.removeItem('adminId');
        localStorage.removeItem('adminRole');
    },
    
    // Get admin dashboard data
    getDashboardData: async () => {
        try {
            const token = localStorage.getItem('adminToken');
            
            if (!token) {
                throw new Error('Không có token xác thực');
            }
            
            // Sử dụng API thống kê người dùng
            const response = await apiClient.get('/users/statistics', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            return response.data;
        } catch (error) {
            console.error('Get dashboard data error:', error);
            
            if (error.response) {
                throw error.response.data || { message: 'Đã xảy ra lỗi khi lấy dữ liệu dashboard' };
            } else {
                throw { message: error.message || 'Đã xảy ra lỗi khi lấy dữ liệu dashboard' };
            }
        }
    },
    
    // Get admin token from localStorage
    getToken: () => {
        return localStorage.getItem('adminToken');
    },
    
    // Check if user has admin role
    isAdmin: () => {
        const role = localStorage.getItem('adminRole');
        return role === 'ADMIN';
    },

    // Get current admin info
    getAdminInfo: async () => {
        const token = localStorage.getItem('adminToken');
        console.log('Token gửi lên:', token);
        if (!token) throw new Error('Chưa đăng nhập');
        // Gọi trực tiếp axios để đảm bảo header Authorization luôn được gửi
        const response = await axios.get('http://localhost:8080/api/admin/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Update current admin info
    updateAdminInfo: async (updates) => {
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error('Chưa đăng nhập');
        const response = await apiClient.put('/admin/me', updates, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Change admin password
    changePassword: async (currentPassword, newPassword, confirmPassword) => {
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error('Chưa đăng nhập');
        const response = await apiClient.post('/admin/change-password', {
            currentPassword,
            newPassword,
            confirmPassword
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

export default authApi; 
