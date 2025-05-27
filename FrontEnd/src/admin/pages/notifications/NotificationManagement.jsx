import React, { useState, useEffect } from 'react';
import './NotificationManagement.css';

const NotificationManagement = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Load notifications
    setLoading(false);
  }, []);

  return (
    <div className="notification-management">
      <div className="notification-management-header">
        <h1 className="notification-management-title">Quản lý Thông báo</h1>
        <p>Hệ thống quản lý thông báo tự động sẽ được phát triển ở Phase 2</p>
      </div>
      
      <div className="notification-management-content">
        <div className="coming-soon">
          <div className="coming-soon-icon">🔔</div>
          <h2>Sắp có</h2>
          <p>Tính năng quản lý thông báo tự động đang được phát triển</p>
          <ul className="features-list">
            <li>✨ Thông báo tự động dựa trên hành vi người dùng</li>
            <li>📧 Email marketing tự động</li>
            <li>🎯 Phân đoạn khách hàng thông minh</li>
            <li>📊 Báo cáo hiệu quả thông báo</li>
            <li>⚙️ Cài đặt quy tắc thông báo</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotificationManagement; 