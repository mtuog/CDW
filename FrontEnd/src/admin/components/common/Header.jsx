import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../../../api/authApi';
import { toast } from 'react-toastify';
import { FaUserCircle } from 'react-icons/fa';
import { createPortal } from 'react-dom';
import NotificationDropdown from './NotificationDropdown';
import axios from 'axios';
import { BACKEND_URL_HTTP } from '../../../config';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const Header = ({ toggleSidebar }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [adminName, setAdminName] = useState('Admin');
  const [adminAvatar, setAdminAvatar] = useState('');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingChatCount, setPendingChatCount] = useState(0);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const avatarBtnRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const stompClientRef = useRef(null);
  
  useEffect(() => {
    // Lấy thông tin admin từ localStorage nếu có
    const adminInfo = localStorage.getItem('adminInfo');
    let displayName = 'Admin';
    let avatarUrl = '';
    if (adminInfo) {
      try {
        const info = JSON.parse(adminInfo);
        displayName = info.fullName || info.username || 'Admin';
        avatarUrl = info.avatar || '';
      } catch {}
    } else {
      // fallback cũ
      const username = localStorage.getItem('adminUsername');
      if (username) displayName = username;
    }
    setAdminName(displayName);
    setAdminAvatar(avatarUrl);
    
    // Lấy số lượng thông báo chưa đọc
    fetchUnreadCount();
    
    // Lấy số lượng chat pending
    fetchPendingChatCount();
    
    // Thiết lập WebSocket connection để nhận thông báo real-time
    setupWebSocketConnection();
    
    // Thiết lập interval để cập nhật số lượng thông báo định kỳ (backup)
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchPendingChatCount();
    }, 60000); // 60 giây
    
    return () => {
      clearInterval(interval);
      if (stompClientRef.current) {
        console.log('🔌 Deactivating WebSocket connection...');
        stompClientRef.current.deactivate();
      }
    };
  }, []);
  
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        console.log('❌ No admin token found');
        return;
      }
      
      console.log('🔍 Fetching unread count...');
      const response = await axios.get(
        `${BACKEND_URL_HTTP}/api/admin/notifications/unread/count`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('✅ Unread count response:', response.data);
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
      console.error('❌ Error details:', error.response?.data);
    }
  };

  const fetchPendingChatCount = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        console.log('❌ No admin token found for chat count');
        return;
      }
      
      console.log('💬 Fetching pending chat count...');
      const response = await axios.get(
        `${BACKEND_URL_HTTP}/api/admin/chat/pending/count`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('✅ Pending chat count response:', response.data);
      setPendingChatCount(response.data || 0);
    } catch (error) {
      console.error('❌ Error fetching pending chat count:', error);
      console.error('❌ Error details:', error.response?.data);
    }
  };

  const setupWebSocketConnection = () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        console.log('❌ No token for WebSocket connection');
        return;
      }

      console.log('🔌 Setting up WebSocket connection...');
      
      const client = new Client({
        webSocketFactory: () => new SockJS(`${BACKEND_URL_HTTP}/ws`),
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        debug: (str) => {
          console.log('🔌 STOMP Debug:', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      client.onConnect = (frame) => {
        console.log('✅ WebSocket connected:', frame);
        stompClientRef.current = client;
        
        // Subscribe to notification updates
        client.subscribe('/topic/admin/notifications', (message) => {
          console.log('🔔 Received notification:', message.body);
          // Refresh unread count when new notification arrives
          fetchUnreadCount();
        });
        
        // Subscribe to unread count updates
        client.subscribe('/topic/admin/unread-count', (message) => {
          console.log('🔢 Received unread count update:', message.body);
          const count = parseInt(message.body);
          setUnreadCount(count);
        });
        
        // Subscribe to chat pending count updates
        client.subscribe('/topic/admin/chat/new-conversation', (message) => {
          console.log('💬 New chat conversation, refreshing count...');
          fetchPendingChatCount();
        });
        
        // Subscribe to chat conversation updates
        client.subscribe('/topic/admin/chat/conversations-update', (message) => {
          console.log('💬 Chat conversation updated, refreshing count...');
          fetchPendingChatCount();
        });
      };

      client.onStompError = (frame) => {
        console.error('❌ WebSocket STOMP error:', frame.headers['message']);
        console.error('❌ Error details:', frame.body);
      };

      client.onWebSocketError = (error) => {
        console.error('❌ WebSocket connection error:', error);
      };

      client.onDisconnect = () => {
        console.log('🔌 WebSocket disconnected');
      };

      client.activate();
    } catch (error) {
      console.error('❌ Error setting up WebSocket:', error);
    }
  };
  
  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);
  
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  
  const handleLogout = () => {
    authApi.logout();
    toast.success('Đăng xuất thành công');
    navigate('/admin/login');
  };

  const handleChatNavigation = () => {
    navigate('/admin/chat');
  };

  // Tính toán vị trí dropdown khi mở
  useEffect(() => {
    if (dropdownOpen && avatarBtnRef.current) {
      const rect = avatarBtnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right - 200 + window.scrollX // 200 là width dropdown
      });
    }
  }, [dropdownOpen]);

  return (
    <header className="admin-header">
      <div className="header-left">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <i className="fa fa-bars"></i>
        </button>
        <div className="search-box">
          <input type="text" placeholder="Tìm kiếm..." />
          <button><i className="fa fa-search"></i></button>
        </div>
      </div>
      
      <div className="header-right">
        <div className="header-icons">
          <div className="notification-container">
            <button 
              className="icon-button"
              onClick={() => setNotificationOpen(!notificationOpen)}
            >
              <i className="fa fa-bell"></i>
              {unreadCount > 0 && (
                <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>
            <NotificationDropdown
              isOpen={notificationOpen}
              onClose={() => setNotificationOpen(false)}
              unreadCount={unreadCount}
              onUnreadCountChange={setUnreadCount}
            />
          </div>
          <button 
            className="icon-button"
            onClick={handleChatNavigation}
            title="Chat Management"
          >
            <i className="fa fa-envelope"></i>
            {pendingChatCount > 0 && (
              <span className="badge chat-badge">{pendingChatCount > 99 ? '99+' : pendingChatCount}</span>
            )}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 70px;
          padding: 0 20px;
          background-color: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: sticky;
          top: 0;
          z-index: 100;
          overflow: visible !important;
        }
        
        .header-left, .header-right {
          display: flex;
          align-items: center;
        }
        
        .sidebar-toggle {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          margin-right: 20px;
          color: #495057;
        }
        
        .search-box {
          display: flex;
          background-color: #f1f3f5;
          border-radius: 20px;
          padding: 5px 15px;
        }
        
        .search-box input {
          border: none;
          background: none;
          outline: none;
          width: 250px;
        }
        
        .search-box button {
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
        }
        
        .header-icons {
          display: flex;
          margin-right: 20px;
        }
        
        .notification-container {
          position: relative;
        }
        
        .icon-button {
          background: none;
          border: none;
          font-size: 18px;
          color: #495057;
          position: relative;
          margin-left: 15px;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }
        
        .icon-button:hover {
          background-color: #f8f9fa;
          color: #333;
          transform: translateY(-1px);
        }
        
        .badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: #dc3545;
          color: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: badgePulse 2s infinite;
        }
        
        .chat-badge {
          background-color: #ffc107;
          color: #000;
          font-weight: 600;
        }
        
        @keyframes badgePulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        
        .user-dropdown {
          position: relative;
          overflow: visible !important;
        }
        
        .dropdown-toggle {
          display: flex;
          align-items: center;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        
        .user-name {
          margin-right: 5px;
          color: #495057;
        }
        
        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          width: 200px;
          background-color: #fff;
          border-radius: 6px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.18);
          border: 1px solid #e9ecef;
          padding: 10px 0;
          z-index: 9999 !important;
          animation: fadeInDropdown 0.2s;
        }
        
        .dropdown-item {
          display: flex;
          align-items: center;
          padding: 10px 24px;
          color: #495057;
          text-decoration: none;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          font-size: 15px;
          transition: background 0.15s;
        }
        
        .dropdown-item:hover {
          background-color: #f1f3f5;
        }
        
        .dropdown-item i {
          margin-right: 10px;
          width: 20px;
          text-align: center;
        }
        
        .dropdown-divider {
          height: 1px;
          background-color: #e9ecef;
          margin: 8px 0;
        }
        
        .dropdown-menu.dropdown-animate {
          animation: fadeInDropdown 0.2s;
        }
        @keyframes fadeInDropdown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
};

export default Header; 