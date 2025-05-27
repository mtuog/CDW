import React, { useState, useEffect, useRef } from 'react';
import chatService from '../../../services/chatService';
import autoChatService from '../../../services/autoChatService';
import ChatPopup from './ChatPopup';
import './ChatWindow.css';

const ChatWindow = ({ 
  conversation, 
  isConnected, 
  newIncomingMessage,
  chatMode,
  showModeSelector,
  onClose, 
  onNewMessageProcessed,
  onModeSelection
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentConversation, setCurrentConversation] = useState(conversation);
  const [connectionStatus, setConnectionStatus] = useState('PENDING');
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
        setShowConnectionNotification(true);
        setTimeout(() => setShowConnectionNotification(false), 3000);
        console.log('✅ Đã kết nối với nhân viên:', newIncomingMessage.senderName);
      }

      // Đánh dấu đã xử lý message
      if (onNewMessageProcessed) {
        onNewMessageProcessed();
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
    
    setLoading(true);
    try {
      const messagesData = await chatService.getConversationMessages(currentConversation.id, 0, 50);
      setMessages(messagesData.reverse());
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeAutoChat = async () => {
    try {
      console.log('🤖 Initializing auto chat...');
      const response = await autoChatService.initializeChat(currentConversation.id);
      
      if (response.success) {
        console.log('✅ Auto chat initialized successfully');
        setAutoInitialized(true);
        loadMessages(); // Reload để lấy tin nhắn welcome
      }
    } catch (error) {
      console.error('❌ Error initializing auto chat:', error);
    }
  };

  const handleSendMessage = async (messageContent = null) => {
    const content = messageContent || newMessage.trim();
    if (!content || sending || !currentConversation) return;

    setSending(true);
    
    // Thêm tin nhắn của user vào UI ngay lập tức
    const tempMessage = {
      id: Date.now(),
      content: content,
      isFromAdmin: false,
      timestamp: new Date().toISOString(),
      senderName: 'Bạn'
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      let response;
      
      if (isAutoMode) {
        // Gửi tin nhắn qua auto chat service
        response = await autoChatService.sendMessage(currentConversation.id, content, currentMenuId);
      } else {
        // Gửi tin nhắn qua chat service thông thường
        response = await chatService.sendMessage(currentConversation.id, content);
      }

      if (response.success) {
        console.log('✅ Message sent successfully');
        // Reload messages để đồng bộ với server
        loadMessages();
        
        if (isAutoMode && response.menuId) {
          setCurrentMenuId(response.menuId);
        }
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      showPopup('error', 'Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại!');
      
      // Xóa tin nhắn tạm nếu gửi thất bại
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    } finally {
      setSending(false);
    }
  };

  const handleQuickReply = (reply) => {
    handleSendMessage(reply);
  };

  const markMessagesAsRead = async () => {
    if (!currentConversation) return;
    
    try {
      await chatService.markMessagesAsRead(currentConversation.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showPopup = (type, title, message) => {
    setPopup({ show: true, type, title, message });
  };

  const closePopup = () => {
    setPopup({ show: false, type: '', title: '', message: '' });
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'PENDING':
        return 'Đang chờ kết nối...';
      case 'CONNECTED':
        return supportAgent ? `Đang chat với ${supportAgent}` : 'Đã kết nối';
      case 'CLOSED':
        return 'Cuộc trò chuyện đã kết thúc';
      default:
        return 'Đang kết nối...';
    }
  };

  const getConnectionStatusClass = () => {
    switch (connectionStatus) {
      case 'PENDING':
        return 'status-pending';
      case 'CONNECTED':
        return 'status-connected';
      case 'CLOSED':
        return 'status-closed';
      default:
        return 'status-pending';
    }
  };

  // Render mode selector nếu cần
  if (showModeSelector) {
    return (
      <div className="chat-window">
        <div className="chat-header">
          <div className="chat-title">
            <h4>Chọn loại hỗ trợ</h4>
          </div>
          <button className="close-button" onClick={onClose}>
            <i className="fa fa-times"></i>
          </button>
        </div>
        
        <div className="mode-selector">
          <div className="mode-option" onClick={() => onModeSelection('auto')}>
            <div className="mode-icon">
              <i className="fa fa-robot"></i>
            </div>
            <div className="mode-content">
              <h5>Hỗ trợ tự động</h5>
              <p>Nhận hỗ trợ nhanh với chatbot thông minh</p>
            </div>
          </div>
          
          <div className="mode-option" onClick={() => onModeSelection('live')}>
            <div className="mode-icon">
              <i className="fa fa-user"></i>
            </div>
            <div className="mode-content">
              <h5>Chat với nhân viên</h5>
              <p>Trò chuyện trực tiếp với nhân viên hỗ trợ</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-title">
          <div className="avatar">
            {isAutoMode ? (
              <i className="fa fa-robot"></i>
            ) : (
              <i className="fa fa-headset"></i>
            )}
          </div>
          <div className="title-content">
            <h4>{isAutoMode ? 'Hỗ trợ tự động' : 'Hỗ trợ khách hàng'}</h4>
            <span className={`status ${getConnectionStatusClass()}`}>
              {getConnectionStatusText()}
            </span>
          </div>
        </div>
        <button className="close-button" onClick={onClose}>
          <i className="fa fa-times"></i>
        </button>
      </div>

      {/* Connection notification */}
      {showConnectionNotification && (
        <div className="connection-notification">
          <i className="fa fa-check-circle"></i>
          <span>Đã kết nối với {supportAgent}</span>
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {loading ? (
          <div className="loading-indicator">
            <i className="fa fa-spinner fa-spin"></i>
            <span>Đang tải tin nhắn...</span>
          </div>
        ) : (
          <>
            {messages.length === 0 ? (
              <div className="empty-messages">
                <div className="welcome-message">
                  <i className="fa fa-comments"></i>
                  <h5>Chào mừng bạn!</h5>
                  <p>
                    {isAutoMode 
                      ? 'Tôi là trợ lý ảo, sẵn sàng hỗ trợ bạn.'
                      : 'Chúng tôi sẽ hỗ trợ bạn trong thời gian sớm nhất.'
                    }
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`message ${message.isFromAdmin ? 'admin' : 'user'}`}
                >
                  <div className="message-content">
                    <div className="message-text">
                      {message.content}
                    </div>
                    <div className="message-time">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="chat-input">
        <div className="input-container">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Nhập tin nhắn..."
            disabled={sending}
          />
          <button
            className="send-button"
            onClick={() => handleSendMessage()}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <i className="fa fa-spinner fa-spin"></i>
            ) : (
              <i className="fa fa-paper-plane"></i>
            )}
          </button>
        </div>
      </div>

      {/* Popup */}
      {popup.show && (
        <ChatPopup
          type={popup.type}
          title={popup.title}
          message={popup.message}
          onClose={closePopup}
        />
      )}
    </div>
  );
};

export default ChatWindow; 