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
        `${BACKEND_URL_HTTP}/api/admin/chat/conversations/pending/count`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('✅ Pending chat count response:', response.data);
      setPendingChatCount(response.data.count || 0);
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
    if (!dropdownOpen && avatarBtnRef.current) {
      const rect = avatarBtnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
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
  
  return (
    <div className="admin-header">
      <div className="header-left">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <i className="fa fa-bars"></i>
        </button>
        
        <div className="search-box">
          <input type="text" placeholder="Tìm kiếm..." />
          <button type="button">
            <i className="fa fa-search"></i>
          </button>
        </div>
      </div>
      
      <div className="header-right">
        <div className="header-icons">
          <div className="notification-container">
            <button 
              className="icon-button" 
              onClick={() => setNotificationOpen(!notificationOpen)}
              title="Thông báo"
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
        
        <div className="user-dropdown" ref={dropdownRef}>
          <button 
            ref={avatarBtnRef}
            className="dropdown-toggle" 
            onClick={toggleDropdown}
          >
            {adminAvatar ? (
              <img src={adminAvatar} alt={adminName} className="user-avatar" />
            ) : (
              <FaUserCircle size={32} color="#6c757d" />
            )}
            <span className="user-name">{adminName}</span>
            <i className={`fa fa-chevron-down ${dropdownOpen ? 'rotate' : ''}`}></i>
          </button>
          
          {dropdownOpen && createPortal(
            <div 
              className="dropdown-menu"
              style={{
                position: 'fixed',
                top: `${dropdownPos.top}px`,
                left: `${dropdownPos.left}px`,
                zIndex: 99999
              }}
            >
              <Link to="/admin/account" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                <i className="fa fa-user"></i>
                Thông tin tài khoản
              </Link>
              <Link to="/admin/settings/store" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                <i className="fa fa-cog"></i>
                Cài đặt
              </Link>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={handleLogout}>
                <i className="fa fa-sign-out-alt"></i>
                Đăng xuất
              </button>
            </div>,
            document.body
          )}
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
          margin-left: 15px;
        }
        
        .dropdown-toggle {
          display: flex;
          align-items: center;
          background: none;
          border: none;
          cursor: pointer;
          padding: 5px 10px;
          border-radius: 25px;
          transition: background-color 0.2s;
        }
        
        .dropdown-toggle:hover {
          background-color: #f8f9fa;
        }
        
        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          margin-right: 8px;
        }
        
        .user-name {
          margin-right: 8px;
          font-weight: 500;
          color: #495057;
        }
        
        .dropdown-toggle i {
          transition: transform 0.2s;
          color: #6c757d;
        }
        
        .dropdown-toggle i.rotate {
          transform: rotate(180deg);
        }
        
        .dropdown-menu {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          min-width: 200px;
          padding: 8px 0;
          margin-top: 8px;
        }
        
        .dropdown-item {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 10px 16px;
          color: #495057;
          text-decoration: none;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }
        
        .dropdown-item:hover {
          background-color: #f8f9fa;
          color: #495057;
          text-decoration: none;
        }
        
        .dropdown-item i {
          margin-right: 12px;
          width: 16px;
          color: #6c757d;
        }
        
        .dropdown-divider {
          height: 1px;
          background-color: #e9ecef;
          margin: 8px 0;
        }
      `}</style>
    </div>
  );
};

export default Header; 