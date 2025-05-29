import axios from 'axios';
import { BACKEND_URL_HTTP } from '../config';

const API_URL = `${BACKEND_URL_HTTP}/api`;

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Add request interceptor to add token to all requests
apiClient.interceptors.request.use(
    (config) => {
        // Check if this is an admin request
        const isAdminRequest = config.url?.includes('/admin/') || config.url?.includes('/UserServices/');
        const token = isAdminRequest 
            ? localStorage.getItem('adminToken') 
            : localStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Check if this is an admin request
                const isAdminRequest = originalRequest.url?.includes('/admin/') || originalRequest.url?.includes('/UserServices/');
                const refreshToken = isAdminRequest 
                    ? localStorage.getItem('adminRefreshToken') 
                    : localStorage.getItem('refreshToken');

                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                // Call refresh token endpoint
                const response = await axios.post(`${API_URL}/auth/refresh-token`, {
                    refreshToken: refreshToken
                });

                const { token, refreshToken: newRefreshToken } = response.data;

                // Update tokens in localStorage based on request type
                if (isAdminRequest) {
                    localStorage.setItem('adminToken', token);
                    localStorage.setItem('adminRefreshToken', newRefreshToken);
                } else {
                    localStorage.setItem('token', token);
                    localStorage.setItem('refreshToken', newRefreshToken);
                }

                // Update the failed request's token
                originalRequest.headers.Authorization = `Bearer ${token}`;

                // Retry the original request
                return apiClient(originalRequest);
            } catch (refreshError) {
                // If refresh token fails, logout user
                if (originalRequest.url?.includes('/admin/') || originalRequest.url?.includes('/UserServices/')) {
                    authService.adminLogout();
                } else {
                    authService.logout();
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

const authService = {
    // Login with email/password (for regular users)
    login: async (email, password) => {
        try {
            const response = await apiClient.post('/UserServices/login', {
                email,
                password
            });

            const { token, refreshToken, userId, userName, userRole, userRoles } = response.data;

            // Store auth data
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('userId', userId);
            localStorage.setItem('userName', userName);
            localStorage.setItem('userRole', userRole);
            localStorage.setItem('userRoles', JSON.stringify(userRoles));

            // Trigger auth change event
            window.dispatchEvent(new Event('auth-change'));

            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Admin login
    adminLogin: async (email, password) => {
        try {
            const response = await apiClient.post('/UserServices/login', {
                email,
                password
            });

            const { token, refreshToken, userId, userName, userRole, userRoles } = response.data;

            // Verify admin role
            if (!userRoles || !userRoles.includes('ADMIN')) {
                throw new Error('Tài khoản không có quyền quản trị');
            }

            // Store admin auth data
            localStorage.setItem('adminToken', token);
            localStorage.setItem('adminRefreshToken', refreshToken);
            localStorage.setItem('adminId', userId);
            localStorage.setItem('adminName', userName);
            localStorage.setItem('adminRole', userRole);
            localStorage.setItem('adminRoles', JSON.stringify(userRoles));

            // Trigger auth change event
            window.dispatchEvent(new Event('auth-change'));

            return response.data;
        } catch (error) {
            console.error('Admin login error:', error);
            throw error;
        }
    },

    // Login with Google (for regular users)
    loginWithGoogle: async (googleToken, userInfo) => {
        try {
            const response = await apiClient.post('/UserServices/login-google', {
                email: userInfo.email,
                userName: userInfo.name
            });

            const { token, refreshToken, userId, userName, userRole, userRoles } = response.data;

            // Store auth data
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('userId', userId);
            localStorage.setItem('userName', userName);
            localStorage.setItem('userRole', userRole);
            localStorage.setItem('userRoles', JSON.stringify(userRoles));

            // Trigger auth change event
            window.dispatchEvent(new Event('auth-change'));

            return response.data;
        } catch (error) {
            console.error('Google login error:', error);
            throw error;
        }
    },

    // Login with Facebook (for regular users)
    loginWithFacebook: async (facebookData) => {
        try {
            const response = await axios.post(`${BACKEND_URL_HTTP}/api/auth/facebook`, facebookData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                withCredentials: true
            });

            const { token, refreshToken, userId, userName, userRole, userRoles } = response.data;

            // Store auth data (consistent with Google login)
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('userId', userId);
            localStorage.setItem('userName', userName);
            localStorage.setItem('userRole', userRole);
            localStorage.setItem('userRoles', JSON.stringify(userRoles));

            // Trigger auth change event
            window.dispatchEvent(new Event('auth-change'));

            return response.data;
        } catch (error) {
            console.error('Facebook login error:', error);
            throw error;
        }
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        const token = localStorage.getItem('token');
        return !!token;
    },

    // Check if admin is authenticated
    isAdminAuthenticated: () => {
        const token = localStorage.getItem('adminToken');
        return !!token;
    },

    // Check if user is admin
    isAdmin: () => {
        const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
        const adminRoles = JSON.parse(localStorage.getItem('adminRoles') || '[]');
        return userRoles.includes('ADMIN') || adminRoles.includes('ADMIN');
    },

    // Get current user info
    getCurrentUser: () => {
        return {
            userId: localStorage.getItem('userId'),
            userName: localStorage.getItem('userName'),
            userRole: localStorage.getItem('userRole'),
            userRoles: JSON.parse(localStorage.getItem('userRoles') || '[]')
        };
    },

    // Get current admin info
    getCurrentAdmin: () => {
        return {
            adminId: localStorage.getItem('adminId'),
            adminName: localStorage.getItem('adminName'),
            adminRole: localStorage.getItem('adminRole'),
            adminRoles: JSON.parse(localStorage.getItem('adminRoles') || '[]')
        };
    },

    // Logout regular user
    logout: () => {
        // Clear user auth data
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userRoles');

        // Trigger auth change event
        window.dispatchEvent(new Event('auth-change'));
    },

    // Logout admin
    adminLogout: () => {
        // Clear admin auth data
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminId');
        localStorage.removeItem('adminName');
        localStorage.removeItem('adminRole');
        localStorage.removeItem('adminRoles');

        // Trigger auth change event
        window.dispatchEvent(new Event('auth-change'));
    }
};

export default authService; 
