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
  const [chatMode, setChatMode] = useState(null); // 'auto' hoặc 'live'
  const [showModeSelector, setShowModeSelector] = useState(false);
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
          
          // Reset chat mode để hiển thị mode selector khi mở lại
          setChatMode(null);
          setShowModeSelector(false);
          setConversation(null);
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
        
        // FIXED VẤN ĐỀ 1: Kiểm tra nếu là tin nhắn admin assignment để update conversation status
        if (messageData.isFromAdmin && 
            messageData.content.includes('đã được kết nối để hỗ trợ')) {
          console.log('✅ Admin connected - updating conversation status');
          // Reload conversation để cập nhật status từ PENDING → OPEN
          checkExistingConversation();
        }
        
        // Nếu tin nhắn từ admin và widget đang đóng thì hiển thị notification
        if (messageData.isFromAdmin && !isOpen) {
          setHasUnreadMessages(true);
          showNotification(messageData);
        }
      });

      // FIXED VẤN ĐỀ 1: Subscribe to conversation status updates
      stompClientRef.current.subscribe(`/topic/user/${conversationId}/status`, (message) => {
        console.log('🔔 Conversation status update:', message.body);
        const statusData = JSON.parse(message.body);
        
        // Update local conversation object
        setConversation(prev => prev ? { ...prev, status: statusData.status } : prev);
        
        // If chat is open, conversation will be automatically updated via ChatWindow
        if (isOpen && newIncomingMessage) {
          // ChatWindow will handle the status update
        }
      });
    }
  };

  const checkExistingConversation = async () => {
    try {
      console.log('🔍 Checking for existing conversation...');
      const response = await chatService.getCurrentConversation();
      
      if (response.data) {
        const activeConversation = response.data;
        console.log('✅ Found existing conversation:', activeConversation);
        setConversation(activeConversation);

        // Subscribe to this conversation
        if (isConnected) {
          subscribeToConversation(activeConversation.id);
        }
      } else {
        console.log('ℹ️ No existing conversation found');
        setConversation(null);
      }
    } catch (error) {
      console.error('❌ Error checking existing conversation:', error);
      setConversation(null);
    }
  };

  const handleOpenChat = async () => {
    if (!isLoggedIn) {
      showPopup('warning', 'Cần đăng nhập', 'Vui lòng đăng nhập để sử dụng tính năng chat!');
      return;
    }

    // Mở widget trước để user thấy UI
    setIsOpen(true);
    setHasUnreadMessages(false);

    try {
      // Nếu chưa có conversation, tạo mới
      if (!conversation) {
        console.log('🆕 Creating new conversation...');
        
        // Hiển thị mode selector nếu chưa chọn mode
        if (!chatMode) {
          setShowModeSelector(true);
          return; // Dừng lại đây, đợi user chọn mode
        }

        const newConversation = await chatService.createConversation(chatMode);
        console.log('✅ New conversation created:', newConversation.data);
        setConversation(newConversation.data);

        // Subscribe to the new conversation
        if (isConnected) {
          subscribeToConversation(newConversation.data.id);
        }
      } else {
        console.log('🔄 Using existing conversation:', conversation.id);
        
        // Nếu đã có conversation nhưng chưa subscribe (do connection mới)
        if (isConnected) {
          subscribeToConversation(conversation.id);
        }
      }
    } catch (error) {
      console.error('❌ Error handling chat open:', error);
      showPopup('error', 'Lỗi', 'Không thể mở chat, vui lòng thử lại sau!');
      setIsOpen(false);
    }
  };

  const handleModeSelection = async (selectedMode) => {
    setChatMode(selectedMode);
    setShowModeSelector(false);
    
    try {
      console.log(`🎯 Creating conversation with mode: ${selectedMode}`);
      const newConversation = await chatService.createConversation(selectedMode);
      console.log('✅ New conversation created:', newConversation.data);
      setConversation(newConversation.data);

      // Subscribe to the new conversation
      if (isConnected) {
        subscribeToConversation(newConversation.data.id);
      }
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      showPopup('error', 'Lỗi', 'Không thể tạo cuộc trò chuyện, vui lòng thử lại!');
      setIsOpen(false);
    }
  };

  const showPopup = (type, title, message) => {
    // Implement popup logic here
    alert(`${title}: ${message}`);
  };

  const handleCloseChat = () => {
    setIsOpen(false);
    setHasUnreadMessages(false);
  };

  const showNotification = (messageData) => {
    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification('Tin nhắn mới từ hỗ trợ viên', {
        body: messageData.content,
        icon: '/favicon.ico'
      });
    }
  };

  // Request notification permission when component mounts
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Ẩn chat widget trên trang admin và login
  const shouldHideWidget = location.pathname.startsWith('/admin') || 
                          location.pathname.includes('/login') || 
                          location.pathname.includes('/register');

  if (shouldHideWidget) {
    return null;
  }

  return (
    <>
      {/* Chat Widget Button */}
      <div className={`chat-widget ${isOpen ? 'hidden' : ''}`}>
        <button className="chat-button" onClick={handleOpenChat}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="currentColor"/>
          </svg>
          {hasUnreadMessages && <div className="notification-badge"></div>}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <ChatWindow
          conversation={conversation}
          onClose={handleCloseChat}
          isConnected={isConnected}
          newIncomingMessage={newIncomingMessage}
          onNewMessageProcessed={() => setNewIncomingMessage(null)}
          chatMode={chatMode}
          showModeSelector={showModeSelector}
          onModeSelection={handleModeSelection}
        />
      )}
    </>
  );
};

export default ChatWidget; 