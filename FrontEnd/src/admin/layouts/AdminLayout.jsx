import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';

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
  { 
    icon: 'fas fa-cog', 
    text: 'Cài đặt',
    submenu: [
      { to: '/admin/settings/store', text: 'Cửa hàng' },
      { to: '/admin/settings/payment', text: 'Thanh toán' }
    ]
  }
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="admin-layout">
      <Sidebar isOpen={sidebarOpen} links={sidebarLinks} />
      
      <div className={`admin-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Header toggleSidebar={toggleSidebar} />
        
        <main className="admin-content">
          <Outlet />
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