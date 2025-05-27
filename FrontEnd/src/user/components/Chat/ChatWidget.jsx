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
<<<<<<< Updated upstream
=======
  const [chatMode, setChatMode] = useState(null); // 'auto' hoặc 'live'
  const [showModeSelector, setShowModeSelector] = useState(false);
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
          
          // Reset chat mode để hiển thị mode selector khi mở lại
          setChatMode(null);
          setShowModeSelector(false);
          setConversation(null);
>>>>>>> Stashed changes
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
        
<<<<<<< Updated upstream
=======
        // FIXED VẤN ĐỀ 1: Kiểm tra nếu là tin nhắn admin assignment để update conversation status
        if (messageData.isFromAdmin && 
            messageData.content.includes('đã được kết nối để hỗ trợ')) {
          console.log('✅ Admin connected - updating conversation status');
          // Reload conversation để cập nhật status từ PENDING → OPEN
          checkExistingConversation();
        }
        
>>>>>>> Stashed changes
        // Nếu tin nhắn từ admin và widget đang đóng thì hiển thị notification
        if (messageData.isFromAdmin && !isOpen) {
          setHasUnreadMessages(true);
          showNotification(messageData);
        }
      });

      // FIXED VẤN ĐỀ 1: Subscribe to conversation status updates
<<<<<<< Updated upstream
      stompClientRef.current.subscribe('/topic/admin/chat/conversations-update', (message) => {
        console.log('🔔 Received conversation update:', message.body);
        const updatedConversationId = parseInt(message.body);
        
        // Nếu là conversation hiện tại, reload conversation data
        if (conversation && conversation.id === updatedConversationId) {
          console.log('🔄 Current conversation updated, refreshing...');
          refreshConversationData();
=======
      stompClientRef.current.subscribe(`/topic/user/${conversationId}/status`, (message) => {
        console.log('🔔 Conversation status update:', message.body);
        const statusData = JSON.parse(message.body);
        
        // Update local conversation object
        setConversation(prev => prev ? { ...prev, status: statusData.status } : prev);
        
        // If chat is open, conversation will be automatically updated via ChatWindow
        if (isOpen && newIncomingMessage) {
          // ChatWindow will handle the status update
>>>>>>> Stashed changes
        }
      });
    }
  };

<<<<<<< Updated upstream
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

=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
    // Luôn hiển thị mode selector cho user mới hoặc khi chưa có mode
    if (!chatMode) {
      setShowModeSelector(true);
      setIsOpen(true);
      return;
    }
    
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
  const handleModeSelect = async (selectedMode) => {
    // Kiểm tra nếu guest user chọn live mode
    if (selectedMode === 'live' && !isLoggedIn) {
      showPopup('warning', 'Cần đăng nhập', 
        'Để chat với nhân viên hỗ trợ, bạn cần đăng nhập. Vui lòng đăng nhập hoặc sử dụng hỗ trợ tự động.');
      return;
    }

    setChatMode(selectedMode);
    setShowModeSelector(false);
    
    try {
      if (selectedMode === 'live' && isLoggedIn) {
        console.log('🔄 Creating conversation for live chat...');
        const response = await chatService.createOrGetConversation('Chat trực tiếp với nhân viên');
        console.log('✅ Live chat conversation created:', response);
        setConversation(response);
        
        if (stompClientRef.current && isConnected) {
          subscribeToConversation(response.id);
        }
      } else if (selectedMode === 'auto') {
        // Auto mode cho cả logged in và guest user
        console.log('🔄 Creating conversation for auto chat...');
        const conversationTitle = isLoggedIn ? 'Hỗ trợ tự động' : 'Hỗ trợ tự động (Khách)';
        const response = await chatService.createOrGetConversation(conversationTitle);
        console.log('✅ Auto chat conversation created:', response);
        setConversation(response);
        
        if (stompClientRef.current && isConnected && isLoggedIn) {
          subscribeToConversation(response.id);
        }
      }
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      showPopup('error', 'Lỗi', 'Không thể tạo cuộc hội thoại. Vui lòng thử lại.');
    }
  };

  const showPopup = (type, title, message) => {
    // Simple popup implementation for error handling
    alert(`${title}: ${message}`);
  };

>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
      {/* Chat Window */}
      {isOpen && (
=======
      {/* Chat Mode Selector */}
      {isOpen && showModeSelector && (
        <div className="chat-mode-selector">
          <div className="mode-selector-header">
            <div className="header-content">
              <h3>Chọn cách bạn muốn được hỗ trợ</h3>
              <p>Chúng tôi có 2 cách để giúp bạn giải quyết vấn đề</p>
            </div>
            <button className="close-btn" onClick={handleCloseChat}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="mode-options">
            <div className="mode-option auto-option" onClick={() => handleModeSelect('auto')}>
              <div className="mode-header">
                <div className="mode-icon auto-icon">
                  <i className="fas fa-bolt"></i>
                </div>
                <div className="mode-badge">Nhanh chóng</div>
              </div>
              <div className="mode-content">
                <h4>Hỗ trợ tự động</h4>
                <p>Giải đáp tức thì các câu hỏi phổ biến</p>
                <div className="mode-features">
                  <div className="feature-item">
                    <i className="fas fa-check-circle"></i>
                    <span>Phản hồi ngay lập tức</span>
                  </div>
                  <div className="feature-item">
                    <i className="fas fa-check-circle"></i>
                    <span>Hoạt động 24/7</span>
                  </div>
                  <div className="feature-item">
                    <i className="fas fa-check-circle"></i>
                    <span>Hướng dẫn từng bước</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div 
              className={`mode-option live-option ${!isLoggedIn ? 'disabled' : ''}`} 
              onClick={() => handleModeSelect('live')}
            >
              <div className="mode-header">
                <div className="mode-icon live-icon">
                  <i className="fas fa-user-tie"></i>
                </div>
                <div className="mode-badge">
                  {isLoggedIn ? 'Chuyên nghiệp' : 'Cần đăng nhập'}
                </div>
              </div>
              <div className="mode-content">
                <h4>Chat với chuyên viên</h4>
                <p>
                  {isLoggedIn 
                    ? 'Tư vấn trực tiếp từ đội ngũ chuyên gia'
                    : 'Đăng nhập để chat trực tiếp với nhân viên hỗ trợ'
                  }
                </p>
                {isLoggedIn ? (
                  <div className="mode-features">
                    <div className="feature-item">
                      <i className="fas fa-check-circle"></i>
                      <span>Tư vấn cá nhân hóa</span>
                    </div>
                    <div className="feature-item">
                      <i className="fas fa-check-circle"></i>
                      <span>Giải quyết vấn đề phức tạp</span>
                    </div>
                    <div className="feature-item">
                      <i className="fas fa-check-circle"></i>
                      <span>Hỗ trợ chuyên sâu</span>
                    </div>
                  </div>
                ) : (
                  <div className="login-required">
                    <div className="login-icon">
                      <i className="fas fa-lock"></i>
                    </div>
                    <span>Vui lòng đăng nhập để sử dụng tính năng này</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mode-selector-footer">
            <p>
              {isLoggedIn 
                ? '💡 Bạn có thể chuyển đổi giữa các chế độ bất cứ lúc nào'
                : '🔐 Đăng nhập để truy cập đầy đủ tính năng hỗ trợ'
              }
            </p>
          </div>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && !showModeSelector && (
>>>>>>> Stashed changes
        <ChatWindow
          conversation={conversation}
          isConnected={isConnected}
          isLoggedIn={isLoggedIn}
          newIncomingMessage={newIncomingMessage}
<<<<<<< Updated upstream
          onClose={handleCloseChat}
          onNewMessage={() => setHasUnreadMessages(false)}
          onMessageProcessed={() => setNewIncomingMessage(null)}
=======
          chatMode={chatMode}
          onClose={handleCloseChat}
          onNewMessage={() => setHasUnreadMessages(false)}
          onMessageProcessed={() => setNewIncomingMessage(null)}
          onModeChange={setChatMode}
>>>>>>> Stashed changes
        />
      )}
    </>
  );
};

export default ChatWidget; 