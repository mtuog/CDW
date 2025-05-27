import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import AdminRoutes from '../routes/AdminRoutes';
import authApi from '../../api/authApi';

// Sidebar links
const sidebarLinks = [
  { to: '/admin/dashboard', icon: 'fas fa-tachometer-alt', text: 'Dashboard' },
  {
    icon: 'fas fa-box',
    text: 'Sản phẩm',
    submenu: [
      { to: '/admin/products', text: 'Danh sách sản phẩm' },
      { to: '/admin/products/stock', text: 'Quản lý tồn kho' },
      { to: '/admin/products/add', text: 'Thêm sản phẩm mới' },
      { to: '/admin/products/bulk-upload', text: 'Nhập hàng loạt' }
    ]
  },
  { to: '/admin/categories', icon: 'fas fa-tags', text: 'Danh mục' },
  { to: '/admin/orders', icon: 'fas fa-shopping-cart', text: 'Đơn hàng' },
  { to: '/admin/customers', icon: 'fas fa-users', text: 'Khách hàng' },
  { to: '/admin/discount', icon: 'fas fa-percent', text: 'Mã giảm giá' },
  { to: '/admin/loyalty', icon: 'fas fa-award', text: 'Tích điểm' },
  { to: '/admin/chat', icon: 'fas fa-comments', text: 'Chat hỗ trợ' },
  { to: '/admin/notifications', icon: 'fas fa-bell', text: 'Thông báo' },
  { to: '/admin/settings/payment', icon: 'fas fa-credit-card', text: 'Thanh toán' },
  {
    icon: 'fas fa-cog',
    text: 'Cài đặt',
    submenu: [
      { to: '/admin/settings/store', text: 'Cửa hàng' }
    ]
  },
  { to: '/admin/account', icon: 'fas fa-user', text: 'Tài khoản' },
  { to: '/admin/admins', icon: 'fas fa-user-shield', text: 'Quản lý Admin' },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      // Nếu đang ở trang login, không cần kiểm tra xác thực
      if (location.pathname === '/admin/login') {
        setIsAuthenticated(false);
        return;
      }

      try {
        const result = await authApi.checkAuth();
        setIsAuthenticated(result.authenticated);

        // Nếu không xác thực và không phải trang login, chuyển về trang login
        if (!result.authenticated && location.pathname !== '/admin/login') {
          // navigate('/admin/login');
        }
      } catch (error) {
        console.error('Lỗi kiểm tra xác thực:', error);
        setIsAuthenticated(false);
        navigate('/admin/login');
      }
    };

    checkAuth();
  }, [location.pathname, navigate]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Hiển thị loading trong khi kiểm tra xác thực
  if (isAuthenticated === null && location.pathname !== '/admin/login') {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải...</p>

        <style jsx>{`
          .admin-loading {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f8f9fa;
          }
          
          .loading-spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top: 4px solid #3498db;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Không hiển thị sidebar và header trên trang login
  const isLoginPage = location.pathname === '/admin/login';

  if (isLoginPage) {
    return <AdminRoutes />;
  }

  return (
    <div className="admin-layout">
      <Sidebar isOpen={sidebarOpen} links={sidebarLinks} />

      <div className={`admin-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Header toggleSidebar={toggleSidebar} />

        <main className="admin-content">
          <AdminRoutes />
        </main>
      </div>

      <style jsx>{`
        .admin-layout {
          display: flex;
          width: 100%;
          min-height: 100vh;
          background-color: #f8f9fa;
        }
        
        .admin-main {
          flex: 1;
          transition: margin-left 0.3s;
        }
        
        .sidebar-open {
          margin-left: 250px;
        }
        
        .sidebar-closed {
          margin-left: 70px;
        }
        
        .admin-content {
          padding: 20px;
          min-height: calc(100vh - 70px);
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
