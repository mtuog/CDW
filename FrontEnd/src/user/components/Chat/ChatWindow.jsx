import React, { useState, useEffect, useRef } from 'react';
import chatService from '../../../services/chatService';
import autoChatService from '../../../services/autoChatService';
import ChatPopup from './ChatPopup';
import './ChatWindow.css';

const ChatWindow = ({ 
  conversation, 
  isConnected, 
  isLoggedIn, 
  newIncomingMessage,
  chatMode,
  onClose, 
  onNewMessage, 
  onMessageProcessed,
  onModeChange
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentConversation, setCurrentConversation] = useState(conversation);
  const [connectionStatus, setConnectionStatus] = useState('PENDING'); // PENDING, CONNECTED, CLOSED
  const [supportAgent, setSupportAgent] = useState(null);
  const [popup, setPopup] = useState({ show: false, type: '', title: '', message: '' });
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [autoInitialized, setAutoInitialized] = useState(false);
  const [currentMenuId, setCurrentMenuId] = useState('welcome');
  const [showConnectionNotification, setShowConnectionNotification] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load messages khi conversation thay đổi
  useEffect(() => {
    if (currentConversation) {
      loadMessages();
      updateConnectionStatus();
    }
  }, [currentConversation]);

  // Theo dõi chatMode và khởi tạo auto chat
  useEffect(() => {
    setIsAutoMode(chatMode === 'auto');
    
    if (chatMode === 'auto' && currentConversation && !autoInitialized) {
      // Delay một chút để đảm bảo conversation đã được load xong
      const timer = setTimeout(() => {
        initializeAutoChat();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [chatMode, currentConversation, autoInitialized]);

  // Sync conversation từ parent component
  useEffect(() => {
    if (conversation && conversation !== currentConversation) {
      setCurrentConversation(conversation);
    }
  }, [conversation]);

  // Xử lý tin nhắn mới từ WebSocket
  useEffect(() => {
    if (newIncomingMessage) {
      console.log('📨 Processing new incoming message:', newIncomingMessage);
      
      // CHỈ thêm tin nhắn từ admin/system, KHÔNG thêm tin nhắn của user
      if (newIncomingMessage.isFromAdmin || newIncomingMessage.messageSource === 'SYSTEM' || newIncomingMessage.messageSource === 'CHATBOT') {
        setMessages(prev => {
          // Kiểm tra duplicate theo ID
          const exists = prev.some(msg => msg.id === newIncomingMessage.id);
          if (!exists) {
            console.log('✅ Adding new message from WebSocket:', newIncomingMessage.id);
            return [...prev, newIncomingMessage];
          } else {
            console.log('⚠️ Duplicate message ignored:', newIncomingMessage.id);
            return prev;
          }
        });

        // Scroll to bottom
        setTimeout(scrollToBottom, 100);
        
        // Đánh dấu đã đọc tin nhắn
        if (currentConversation) {
          markMessagesAsRead();
        }
      }

      // Kiểm tra nếu là tin nhắn admin assignment (kết nối)
      if (newIncomingMessage.isFromAdmin && 
          newIncomingMessage.content.includes('đã được kết nối để hỗ trợ')) {
        setConnectionStatus('CONNECTED');
        setSupportAgent(newIncomingMessage.senderName);
        // Hiển thị thông báo kết nối ngắn
        setShowConnectionNotification(true);
        setTimeout(() => setShowConnectionNotification(false), 3000);
        console.log('✅ Đã kết nối với nhân viên:', newIncomingMessage.senderName);
      }

      // Đánh dấu đã xử lý message
      if (onMessageProcessed) {
        onMessageProcessed();
      }
    }
  }, [newIncomingMessage]);

  // Auto scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const updateConnectionStatus = () => {
    if (!currentConversation) {
      setConnectionStatus('PENDING');
      return;
    }

    switch (currentConversation.status) {
      case 'PENDING':
        setConnectionStatus('PENDING');
        setSupportAgent(null);
        break;
      case 'OPEN':
        setConnectionStatus('CONNECTED');
        // Tìm tin nhắn assignment gần nhất để lấy tên agent
        const assignmentMessage = messages.find(msg => 
          msg.isFromAdmin && msg.content.includes('đã được kết nối để hỗ trợ')
        );
        if (assignmentMessage) {
          setSupportAgent(assignmentMessage.senderName);
        }
        break;
      case 'CLOSED':
        setConnectionStatus('CLOSED');
        break;
      default:
        setConnectionStatus('PENDING');
    }
  };

  const loadMessages = async () => {
    if (!currentConversation) return;
    
    try {
      setLoading(true);
      const messagesData = await chatService.getConversationMessages(
        currentConversation.id, 0, 50
      );
      setMessages(messagesData.reverse());
      
      // Đánh dấu tin nhắn đã đọc
      markMessagesAsRead();
      
      // Update connection status based on messages
      updateConnectionStatus();
      
    } catch (error) {
      console.error('Error loading messages:', error);
      showPopup('error', 'Lỗi', 'Không thể tải tin nhắn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!currentConversation) return;
    
    try {
      await chatService.markMessagesAsRead(currentConversation.id);
      if (onNewMessage) {
        onNewMessage();
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const initializeAutoChat = async () => {
    if (!currentConversation || autoInitialized) return;
    
    try {
      console.log('🤖 Initializing auto chat...');
      const welcomeMessage = await autoChatService.initAutoChat(currentConversation.id);
      
      // Tạo fake message object với id và timestamp
      const messageObj = {
        id: Date.now(),
        content: welcomeMessage.content,
        messageSource: 'CHATBOT',
        quickReplies: welcomeMessage.quickReplies,
        sentAt: new Date().toISOString(),
        isFromAdmin: false,
        senderName: 'VTX Hỗ Trợ'
      };
      
      // Thêm welcome message vào messages
      setMessages(prev => [...prev, messageObj]);
      setAutoInitialized(true);
      setCurrentMenuId('welcome');
      
    } catch (error) {
      console.error('Error initializing auto chat:', error);
      showPopup('error', 'Lỗi', 'Không thể khởi tạo hỗ trợ tự động. Vui lòng thử lại.');
    }
  };

  const handleAutoChatSelection = async (selection) => {
    if (!currentConversation) return;
    
    try {
      setSending(true);
      
      // Tạo user message ngay lập tức
      const userMessageObj = {
        id: Date.now(),
        content: selection,
        messageSource: 'USER',
        isFromAdmin: false,
        sentAt: new Date().toISOString(),
        senderName: 'Bạn'
      };
      console.log('✅ Adding auto chat user selection:', userMessageObj.id);
      setMessages(prev => [...prev, userMessageObj]);
      
      // Kiểm tra nếu user muốn chuyển sang live chat
      if (selection.includes('📞 Liên hệ nhân viên')) {
        showPopup('info', 'Chuyển sang nhân viên', 'Đang chuyển bạn đến nhân viên hỗ trợ...');
        
        // Clear quickReplies từ messages khi chuyển mode
        setMessages(prev => prev.map(msg => ({
          ...msg,
          quickReplies: msg.messageSource === 'CHATBOT' ? [] : msg.quickReplies
        })));
        
        // Chuyển mode sang live
        setIsAutoMode(false);
        if (onModeChange) {
          onModeChange('live');
        }
        return;
      }
      
      // Xử lý selection và lấy response từ autoChatService
      const menuOption = getMenuOptionFromSelection(selection);
      const response = autoChatService.processSelection(currentMenuId, menuOption);
      
      // Tạo chatbot response message
      const chatbotMessageObj = {
        id: Date.now() + 1,
        content: `${response.title}\n\n${response.message}`,
        messageSource: 'CHATBOT',
        quickReplies: response.options?.map(opt => opt.label) || [],
        sentAt: new Date().toISOString(),
        isFromAdmin: false,
        senderName: 'VTX Hỗ Trợ'
      };
      
      console.log('✅ Adding auto chat bot response:', chatbotMessageObj.id);
      setMessages(prev => [...prev, chatbotMessageObj]);
      setCurrentMenuId(response.id);
      
      // Scroll to bottom
      setTimeout(scrollToBottom, 100);
      
    } catch (error) {
      console.error('Error handling auto chat selection:', error);
      showPopup('error', 'Lỗi', 'Không thể xử lý lựa chọn. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  // Helper function để lấy menu option ID từ selection text
  const getMenuOptionFromSelection = (selection) => {
    // Map các selection text về menu option IDs
    const selectionMap = {
      '🛍️ Sản phẩm & Danh mục': 'products',
      '📦 Đơn hàng & Vận chuyển': 'orders',
      '👤 Tài khoản & Bảo mật': 'account',
      '💳 Thanh toán & Khuyến mãi': 'payment',
      '🎧 Hỗ trợ kỹ thuật': 'support',
      '📞 Liên hệ nhân viên': 'contact',
      '⬅️ Quay lại menu chính': 'back_main',
      '🔍 Tìm kiếm sản phẩm': 'product_search',
      'ℹ️ Thông tin chi tiết sản phẩm': 'product_info',
      '📏 Hướng dẫn chọn size': 'size_guide',
      '⚖️ So sánh sản phẩm': 'product_compare',
      '📋 Kiểm tra trạng thái đơn hàng': 'order_status',
      '❌ Hủy/Thay đổi đơn hàng': 'order_cancel',
      '🚚 Thông tin vận chuyển': 'shipping_info',
      '↩️ Chính sách đổi trả': 'return_policy',
      '💰 Phương thức thanh toán': 'payment_methods',
      '⚠️ Lỗi thanh toán': 'payment_issues',
      '🎁 Mã giảm giá & Khuyến mãi': 'promotions',
      '💸 Chính sách hoàn tiền': 'refund_policy',
      '⬅️ Quay lại menu sản phẩm': 'products',
      '⬅️ Quay lại menu đơn hàng': 'orders',
      '⬅️ Quay lại menu thanh toán': 'payment'
    };
    
    return selectionMap[selection] || 'welcome';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;
    
    if (!isLoggedIn) {
      showPopup('warning', 'Cần đăng nhập', 
        'Bạn cần đăng nhập để gửi tin nhắn. Vui lòng đăng nhập và thử lại.');
      return;
    }

    try {
      setSending(true);
      
      let conversationToUse = currentConversation;
      
      // Nếu chưa có conversation, tạo mới
      if (!conversationToUse) {
        const newConversation = await chatService.createOrGetConversation('Yêu cầu hỗ trợ');
        setCurrentConversation(newConversation);
        conversationToUse = newConversation;
      }

      // Gửi tin nhắn
      const messageData = await chatService.sendMessage(
        conversationToUse.id, 
        newMessage.trim()
      );
      
      // LUÔN LUÔN thêm tin nhắn của user ngay lập tức (không chờ WebSocket)
      if (messageData) {
        console.log('✅ Adding user message immediately:', messageData.id);
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === messageData.id);
          if (!exists) {
            return [...prev, messageData];
          }
          return prev;
        });
        
        // Scroll to bottom ngay
        setTimeout(scrollToBottom, 50);
      }
      
      // Clear input
      setNewMessage('');
      
      // Focus input
      if (inputRef.current) {
        inputRef.current.focus();
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      showPopup('error', 'Lỗi gửi tin nhắn', 
        'Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setSending(false);
    }
  };

  const handleStartNewConversation = async () => {
    if (!isLoggedIn) {
      showPopup('warning', 'Cần đăng nhập', 
        'Bạn cần đăng nhập để bắt đầu cuộc hội thoại. Vui lòng đăng nhập và thử lại.');
      return;
    }

    try {
      setLoading(true);
      const newConversation = await chatService.createOrGetConversation('Yêu cầu hỗ trợ');
      setCurrentConversation(newConversation);
      setMessages([]);
      setConnectionStatus('PENDING');
      setSupportAgent(null);
      
      showPopup('info', 'Đã tạo cuộc hội thoại', 
        'Cuộc hội thoại mới đã được tạo. Nhân viên hỗ trợ sẽ kết nối với bạn sớm nhất.');
        
    } catch (error) {
      console.error('Error starting conversation:', error);
      showPopup('error', 'Lỗi', 'Không thể tạo cuộc hội thoại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const showPopup = (type, title, message) => {
    setPopup({ show: true, type, title, message });
  };

  const closePopup = () => {
    setPopup({ show: false, type: '', title: '', message: '' });
  };

  const formatTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'PENDING':
        return {
          text: 'Đang chờ kết nối...',
          color: '#fbbf24',
          icon: '⏳'
        };
      case 'CONNECTED':
        return {
          text: supportAgent ? `Đang chat với ${supportAgent}` : 'Đã kết nối',
          color: '#10b981',
          icon: '✅'
        };
      case 'CLOSED':
        return {
          text: 'Cuộc hội thoại đã kết thúc',
          color: '#ef4444',
          icon: '❌'
        };
      default:
        return {
          text: 'Không xác định',
          color: '#6b7280',
          icon: '❓'
        };
    }
  };

  const connectionDisplay = getConnectionStatusDisplay();

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-title">
          <div className="header-main">
            <h3>
              {isAutoMode ? (
                <>
                  <i className="fas fa-robot"></i>
                  Hỗ trợ tự động
                </>
              ) : (
                <>
                  <i className="fas fa-user-tie"></i>
                  Chat với chuyên viên
                </>
              )}
            </h3>
            {isAutoMode && (
              <div className="mode-badge auto">
                <i className="fas fa-bolt"></i>
                Nhanh chóng
              </div>
            )}
            {!isAutoMode && connectionStatus === 'CONNECTED' && (
              <div className="mode-badge live">
                <i className="fas fa-check-circle"></i>
                Đã kết nối
              </div>
            )}
          </div>
          <div className="connection-status" style={{ color: connectionDisplay.color }}>
            <span className="status-icon">{connectionDisplay.icon}</span>
            <span className="status-text">{connectionDisplay.text}</span>
          </div>
        </div>
        <div className="chat-actions">
          <div className="connection-indicator">
            <span className={`indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span className="indicator-text">
              {isConnected ? 'Trực tuyến' : 'Mất kết nối'}
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="chat-body">
        {/* Connection Notification */}
        {showConnectionNotification && (
          <div className="connection-notification">
            <i className="fas fa-check-circle"></i>
            <span>Đã kết nối với nhân viên hỗ trợ!</span>
          </div>
        )}

        {!isLoggedIn && (
          <div className="login-notice">
            <div className="notice-icon">⚠️</div>
            <p>Bạn chưa đăng nhập. Để có trải nghiệm chat tốt nhất, vui lòng đăng nhập.</p>
          </div>
        )}

        {!currentConversation && isLoggedIn ? (
          <div className="no-conversation">
            <div className="no-conversation-content">
              <div className="welcome-icon">💬</div>
              <h4>Chào mừng đến với hỗ trợ khách hàng!</h4>
              <p>Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7</p>
              <button 
                className="start-chat-btn" 
                onClick={handleStartNewConversation}
                disabled={loading}
              >
                {loading ? 'Đang tạo...' : 'Bắt đầu chat'}
              </button>
            </div>
          </div>
        ) : (
          <div className="messages-container">
            {loading && (
              <div className="loading-indicator">
                <div className="spinner"></div>
                <span>Đang tải tin nhắn...</span>
              </div>
            )}
            
            <div className="messages-list">
              {messages.map((message) => {
                // USER PERSPECTIVE: Tin nhắn của mình (user) ở bên phải, của người khác ở bên trái
                const isChatbot = message.messageSource === 'CHATBOT';
                const currentUserId = localStorage.getItem('userId');
                
                // Debug để kiểm tra
                console.log('🔍 User Message Debug:', {
                  messageId: message.id,
                  senderId: message.senderId,
                  currentUserId: currentUserId,
                  senderName: message.senderName,
                  isFromAdmin: message.isFromAdmin,
                  messageSource: message.messageSource,
                  content: message.content?.substring(0, 30) + '...'
                });
                
                // SIMPLIFIED LOGIC: Dựa trên isFromAdmin và messageSource
                let isMyMessage;
                if (isChatbot) {
                  isMyMessage = false; // Chatbot không phải tin nhắn của user
                } else {
                  isMyMessage = !message.isFromAdmin; // Không phải admin = là user
                }
                
                // USER PERSPECTIVE LOGIC:
                // - isMyMessage = false → Hiển thị bên TRÁI (admin/chatbot)  
                // - isMyMessage = true → Hiển thị bên PHẢI (user)
                const isAdmin = !isMyMessage;
                const isUser = isMyMessage;
                
                // DEBUG: In ra TẤT CẢ tin nhắn để kiểm tra
                console.log('🔍 Message Analysis:', {
                  id: message.id,
                  content: message.content?.substring(0, 50) + '...',
                  isFromAdmin: message.isFromAdmin,
                  messageSource: message.messageSource,
                  senderName: message.senderName,
                  calculated_isAdmin: isAdmin,
                  calculated_isUser: isUser,
                  isChatbot,
                  className: `message ${isAdmin ? 'admin' : 'user'} ${isChatbot ? 'chatbot' : ''}`,
                  expectedPosition: isAdmin ? 'LEFT (admin/chatbot)' : 'RIGHT (user)',
                  actualCSS: isAdmin ? 'align-self: flex-start' : 'align-self: flex-end'
                });
                
                // Debug log để kiểm tra positioning (commented out to reduce spam)
                // console.log('🎯 Message debug:', { 
                //   id: message.id, 
                //   isFromAdmin: message.isFromAdmin, 
                //   messageSource: message.messageSource,
                //   content: message.content?.substring(0, 30) + '...',
                //   senderName: message.senderName,
                //   isAdmin,
                //   isUser,
                //   isChatbot,
                //   className: `message ${isAdmin ? 'admin' : 'user'} ${isChatbot ? 'chatbot' : ''}`,
                //   expectedPosition: isAdmin ? 'LEFT (admin)' : 'RIGHT (user)'
                // });
                
                return (
                  <div 
                    key={message.id} 
                    className={`message ${isAdmin ? 'admin' : 'user'} ${isChatbot ? 'chatbot' : ''}`}
                  >
                    <div className="message-content">
                      <div className="message-text">{message.content}</div>
                      
                      {/* Quick replies cho auto chat */}
                      {isChatbot && message.quickReplies && message.quickReplies.length > 0 && (
                        <div className="quick-replies">
                          {message.quickReplies.map((reply, index) => (
                            <button
                              key={index}
                              className="quick-reply-btn"
                              onClick={() => handleAutoChatSelection(reply)}
                              disabled={sending}
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <div className="message-meta">
                        <span className="message-sender">
                          {isChatbot ? '🤖 VTX Hỗ Trợ' : 
                           isAdmin ? (message.senderName || 'Nhân viên hỗ trợ') : 'Bạn'}
                        </span>
                        <span className="message-time">
                          {formatTime(message.sentAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Message Input - Chỉ hiển thị khi không phải auto mode */}
      {currentConversation && connectionStatus !== 'CLOSED' && !isAutoMode && (
        <div className="chat-footer">
          <form onSubmit={handleSendMessage} className="message-form">
            <div className="input-container">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isLoggedIn ? "Nhập tin nhắn..." : "Vui lòng đăng nhập để chat"}
                className="message-input"
                rows="1"
                disabled={!isLoggedIn || sending}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <button 
                type="submit" 
                className="send-btn" 
                disabled={!newMessage.trim() || !isLoggedIn || sending}
              >
                {sending ? '⏳' : '📤'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Auto Mode Footer */}
      {isAutoMode && currentConversation && (
        <div className="chat-footer auto-mode">
          <div className="auto-mode-info">
            <div className="mode-indicator">
              <i className="fas fa-robot"></i>
              <span>Chế độ hỗ trợ tự động</span>
            </div>
            <button 
              className="switch-mode-btn"
              onClick={() => {
                // Clear quickReplies từ messages khi chuyển mode
                setMessages(prev => prev.map(msg => ({
                  ...msg,
                  quickReplies: msg.messageSource === 'CHATBOT' ? [] : msg.quickReplies
                })));
                
                setIsAutoMode(false);
                if (onModeChange) {
                  onModeChange('live');
                }
              }}
            >
              <i className="fas fa-user-headset"></i>
              Chuyển sang nhân viên
            </button>
          </div>
        </div>
      )}

      {/* Popup */}
      <ChatPopup 
        show={popup.show}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={closePopup}
      />
    </div>
  );
};

export default ChatWindow; 