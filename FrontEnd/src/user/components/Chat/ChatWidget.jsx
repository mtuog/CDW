import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ChatWindow from './ChatWindow';
import chatService from '../../../services/chatService';
import { BACKEND_URL_HTTP } from '../../../config';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import './ChatWidget.css';

const ChatWidget = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [newIncomingMessage, setNewIncomingMessage] = useState(null);
  const stompClientRef = useRef(null);

  // Kiểm tra login status và setup chat connection
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const isCurrentlyLoggedIn = !!(token && userId);
      
      if (isCurrentlyLoggedIn !== isLoggedIn) {
        setIsLoggedIn(isCurrentlyLoggedIn);
        
        if (isCurrentlyLoggedIn) {
          // User vừa login
          console.log('🔐 User logged in, initializing chat...');
          setupWebSocketConnection();
          checkExistingConversation();
        } else {
          // User vừa logout
          console.log('🔓 User logged out, cleaning up chat connection...');
          cleanupChatConnection(); // Chỉ cleanup connection, không ẩn widget
        }
      }
    };

    // Check ngay lập tức
    checkLoginStatus();
    
    // Listen auth-change event để phản ứng ngay lập tức
    const handleAuthChange = () => {
      console.log('🔄 Auth change detected, rechecking login status...');
      checkLoginStatus();
    };
    
    window.addEventListener('auth-change', handleAuthChange);
    
    // Check định kỳ mỗi 2 giây để backup
    const interval = setInterval(checkLoginStatus, 2000);
    
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      clearInterval(interval);
      cleanupChatConnection();
    };
  }, [isLoggedIn]);

  const cleanupChatConnection = () => {
    console.log('🧹 Cleaning up chat connection...');
    
    // Đóng WebSocket connection
    if (stompClientRef.current) {
      try {
        stompClientRef.current.deactivate();
      } catch (error) {
        console.error('Error deactivating WebSocket:', error);
      }
      stompClientRef.current = null;
    }
    
    // Reset connection state nhưng giữ lại conversation và UI state
    setIsConnected(false);
  };

  const cleanupChat = () => {
    console.log('🧹 Full chat cleanup...');
    
    // Cleanup connection
    cleanupChatConnection();
    
    // Reset tất cả state
    setIsOpen(false);
    setHasUnreadMessages(false);
    setConversation(null);
  };

  const setupWebSocketConnection = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Cleanup trước khi tạo connection mới
      if (stompClientRef.current) {
        cleanupChatConnection();
      }

      const client = new Client({
        webSocketFactory: () => new SockJS(`${BACKEND_URL_HTTP}/ws`),
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        debug: (str) => {
          console.log('🔌 Chat WebSocket Debug:', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      client.onConnect = (frame) => {
        console.log('✅ Chat WebSocket connected');
        setIsConnected(true);
        stompClientRef.current = client;
        
        // Subscribe to user messages nếu có conversation
        if (conversation) {
          subscribeToConversation(conversation.id);
        }
      };

      client.onStompError = (frame) => {
        console.error('❌ Chat WebSocket STOMP error:', frame);
        setIsConnected(false);
      };

      client.onWebSocketError = (error) => {
        console.error('❌ Chat WebSocket connection error:', error);
        setIsConnected(false);
      };

      client.onDisconnect = () => {
        console.log('🔌 Chat WebSocket disconnected');
        setIsConnected(false);
      };

      client.activate();
    } catch (error) {
      console.error('❌ Error setting up chat WebSocket:', error);
    }
  };

  const subscribeToConversation = (conversationId) => {
    if (stompClientRef.current && isConnected) {
      console.log('🔔 Subscribing to conversation:', conversationId);
      
      // Subscribe to messages for this conversation
      stompClientRef.current.subscribe(`/topic/user/${conversationId}/messages`, (message) => {
        console.log('🔔 Received new message:', message.body);
        const messageData = JSON.parse(message.body);
        
        // FIXED VẤN ĐỀ 2: Truyền tin nhắn mới xuống ChatWindow khi đang mở
        if (isOpen) {
          console.log('💬 Message received while chat is open - forwarding to ChatWindow');
          setNewIncomingMessage(messageData);
        }
        
        // Nếu tin nhắn từ admin và widget đang đóng thì hiển thị notification
        if (messageData.isFromAdmin && !isOpen) {
          setHasUnreadMessages(true);
          showNotification(messageData);
        }
      });

      // FIXED VẤN ĐỀ 1: Subscribe to conversation status updates
      stompClientRef.current.subscribe('/topic/admin/chat/conversations-update', (message) => {
        console.log('🔔 Received conversation update:', message.body);
        const updatedConversationId = parseInt(message.body);
        
        // Nếu là conversation hiện tại, reload conversation data
        if (conversation && conversation.id === updatedConversationId) {
          console.log('🔄 Current conversation updated, refreshing...');
          refreshConversationData();
        }
      });
    }
  };

  const refreshConversationData = async () => {
    try {
      const conversations = await chatService.getUserConversations();
      if (conversations && conversations.length > 0) {
        const activeConversation = conversations.find(c => c.status === 'OPEN' || c.status === 'PENDING');
        if (activeConversation) {
          console.log('🔄 Conversation refreshed:', activeConversation);
          setConversation(activeConversation);
          
          // Re-subscribe to make sure we're getting all updates
          if (isConnected && activeConversation.id !== conversation?.id) {
            subscribeToConversation(activeConversation.id);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing conversation data:', error);
    }
  };

  const checkExistingConversation = async () => {
    try {
      const conversations = await chatService.getUserConversations();
      if (conversations && conversations.length > 0) {
        const activeConversation = conversations.find(c => c.status === 'OPEN' || c.status === 'PENDING');
        if (activeConversation) {
          setConversation(activeConversation);
          
          // FIXED VẤN ĐỀ 1: Không auto-set hasUnreadMessages khi check existing
          // Badge unread chỉ hiển thị khi nhận tin nhắn real-time từ admin
          // if (activeConversation.unreadCountUser > 0) {
          //   setHasUnreadMessages(true);
          // }
          
          // Subscribe to this conversation
          if (isConnected) {
            subscribeToConversation(activeConversation.id);
          }
        }
      }
    } catch (error) {
      console.error('Error checking existing conversation:', error);
    }
  };

  const handleOpenChat = async () => {
    setIsOpen(true);
    setHasUnreadMessages(false);

    const token = localStorage.getItem('token');
    
    if (token) {
      // User đã đăng nhập → chỉ kiểm tra conversation có sẵn, KHÔNG tạo mới
      if (!conversation) {
        try {
          // Chỉ lấy conversation active có sẵn (PENDING/OPEN)
          const conversations = await chatService.getUserConversations();
          const activeConversation = conversations.find(c => c.status === 'OPEN' || c.status === 'PENDING');
          
          if (activeConversation) {
            setConversation(activeConversation);
            
            // Subscribe to existing conversation
            if (isConnected) {
              subscribeToConversation(activeConversation.id);
            }
          }
          // Nếu không có conversation → ChatWindow sẽ hiển thị giao diện tạo mới
        } catch (error) {
          console.error('Error checking existing conversation:', error);
        }
      }
    } else {
      // User chưa đăng nhập → sử dụng anonymous chat
      // ChatWindow sẽ tự động khởi tạo anonymous chat
      console.log('🔓 Opening anonymous chat for guest user');
    }
  };

  const handleCloseChat = () => {
    setIsOpen(false);
  };

  const showNotification = (messageData) => {
    // Hiển thị browser notification nếu được phép
    if (Notification.permission === 'granted') {
      new Notification('Tin nhắn mới từ CDW', {
        body: messageData.content,
        icon: '/favicon.ico'
      });
    }
  };

  // Danh sách các trang không hiển thị chat widget
  const excludedPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-account'];
  
  // Không hiển thị chat widget chỉ khi:
  // 1. Đang ở trang login/register/... 
  // 2. Đang ở admin panel
  if (excludedPaths.includes(location.pathname) || 
      location.pathname.startsWith('/admin/')) {
    return null;
  }

  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <div 
          className={`chat-widget-button ${!isLoggedIn ? 'not-logged-in' : ''}`} 
          onClick={handleOpenChat}
        >
          <div className="chat-icon">
            <i className="fas fa-comments"></i>
            {hasUnreadMessages && <div className="unread-indicator"></div>}
            {!isLoggedIn && <div className="login-indicator">!</div>}
          </div>
          <div className="chat-tooltip">
            {isLoggedIn 
              ? 'Hỗ trợ trực tuyến 24/7' 
              : 'Chat hỗ trợ - Đăng nhập để có trải nghiệm tốt hơn'
            }
          </div>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <ChatWindow
          conversation={conversation}
          isConnected={isConnected}
          isLoggedIn={isLoggedIn}
          newIncomingMessage={newIncomingMessage}
          onClose={handleCloseChat}
          onNewMessage={() => setHasUnreadMessages(false)}
          onMessageProcessed={() => setNewIncomingMessage(null)}
        />
      )}
    </>
  );
};

export default ChatWidget; 