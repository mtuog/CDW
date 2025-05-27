import React, { useState, useEffect, useRef } from 'react';
import chatService from '../../../services/chatService';
import { BACKEND_URL_HTTP } from '../../../config';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import './ChatManagement.css';

const ChatManagement = () => {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'active', 'closed'
  const [conversations, setConversations] = useState([]);
  const [pendingConversations, setPendingConversations] = useState([]);
  const [activeConversations, setActiveConversations] = useState([]);
  const [closedConversations, setClosedConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    active: 0,
    closed: 0,
    total: 0
  });
  
  const [popup, setPopup] = useState({ 
    show: false, 
    type: '', 
    title: '', 
    message: '', 
    onConfirm: null,
    onCancel: null
  });
  
  const [pendingNotification, setPendingNotification] = useState(false);
  
  const stompClientRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const currentConversationSubscription = useRef(null);

  useEffect(() => {
    loadAllConversations();
    setupWebSocketConnection();

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupWebSocketConnection = () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const client = new Client({
        webSocketFactory: () => new SockJS(`${BACKEND_URL_HTTP}/ws`),
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        debug: (str) => {
          console.log('🔌 Admin Chat WebSocket Debug:', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      client.onConnect = (frame) => {
        console.log('✅ Admin Chat WebSocket connected');
        setIsConnected(true);
        stompClientRef.current = client;
        
        // Subscribe to admin chat topics
        subscribeToAdminTopics();
      };

      client.onStompError = (frame) => {
        console.error('❌ Admin Chat WebSocket STOMP error:', frame);
        setIsConnected(false);
      };

      client.onWebSocketError = (error) => {
        console.error('❌ Admin Chat WebSocket connection error:', error);
        setIsConnected(false);
      };

      client.onDisconnect = () => {
        console.log('🔌 Admin Chat WebSocket disconnected');
        setIsConnected(false);
      };

      client.activate();
    } catch (error) {
      console.error('❌ Error setting up admin chat WebSocket:', error);
    }
  };

  const subscribeToAdminTopics = () => {
    if (!stompClientRef.current) return;

    // Unsubscribe from all previous subscriptions
    if (stompClientRef.current.subscriptions) {
      Object.keys(stompClientRef.current.subscriptions).forEach(key => {
        stompClientRef.current.unsubscribe(key);
      });
    }

    // Subscribe to new conversations
    stompClientRef.current.subscribe('/topic/admin/chat/new-conversation', (message) => {
      console.log('🔔 New conversation:', message.body);
      const conversationData = JSON.parse(message.body);
      
      // Add to pending list
      setPendingConversations(prev => [conversationData, ...prev]);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pending: prev.pending + 1,
        total: prev.total + 1
      }));
      
      // Trigger notification animation
      setPendingNotification(true);
      setTimeout(() => setPendingNotification(false), 3000);
    });

    // Subscribe to conversation updates
    stompClientRef.current.subscribe('/topic/admin/chat/conversations-update', (message) => {
      console.log('🔔 Conversation updated:', message.body);
      loadAllConversations(); // Reload để cập nhật
    });

    // Subscribe to ALL conversations for real-time updates
    stompClientRef.current.subscribe('/topic/admin/chat/messages', (message) => {
      console.log('🔔 New message received:', message.body);
      const messageData = JSON.parse(message.body);
      
      // Nếu tin nhắn thuộc conversation đang được chọn, thêm vào messages
      if (selectedConversation && messageData.conversationId === selectedConversation.id) {
        setMessages(prev => {
          // Kiểm tra xem tin nhắn đã tồn tại chưa để tránh duplicate
          const exists = prev.some(msg => msg.id === messageData.id);
          if (!exists) {
            console.log('✅ Adding new message to admin chat:', messageData.id);
            return [...prev, messageData];
          } else {
            console.log('⚠️ Duplicate message ignored in admin:', messageData.id);
            return prev;
          }
        });
        
        // Scroll to bottom after adding message
        setTimeout(scrollToBottom, 100);
      }
      
      // Cập nhật conversation list để hiển thị unread count và last message
      loadAllConversations();
    });
  };

  const loadAllConversations = async () => {
    try {
      setLoading(true);
      const response = await chatService.getAdminConversations(0, 100);
      const allConversations = response.content || [];
      
      // Phân loại conversations theo status
      const pending = allConversations.filter(c => c.status === 'PENDING');
      const active = allConversations.filter(c => c.status === 'OPEN');
      const closed = allConversations.filter(c => c.status === 'CLOSED');
      
      setConversations(allConversations);
      setPendingConversations(pending);
      setActiveConversations(active);
      setClosedConversations(closed);
      
      // Update stats
      setStats({
        pending: pending.length,
        active: active.length,
        closed: closed.length,
        total: allConversations.length
      });
      
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      console.log('📥 Loading messages for conversation:', conversationId);
      const messagesData = await chatService.getConversationMessages(conversationId, 0, 50);
      console.log('📥 Loaded messages:', messagesData.length);
      setMessages(messagesData.reverse());
      
      // Mark messages as read
      await chatService.markAdminMessagesAsRead(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
    
    // Cleanup previous conversation subscription
    if (currentConversationSubscription.current) {
      currentConversationSubscription.current.unsubscribe();
      currentConversationSubscription.current = null;
    }
    
    // Subscribe to specific conversation updates
    if (stompClientRef.current && isConnected) {
      // Subscribe to conversation-specific updates
      currentConversationSubscription.current = stompClientRef.current.subscribe(`/topic/conversation/${conversation.id}/messages`, (message) => {
        console.log('🔔 Message from specific conversation:', message.body);
        const messageData = JSON.parse(message.body);
        
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === messageData.id);
          if (!exists) {
            console.log('✅ Adding message from conversation subscription:', messageData.id);
            return [...prev, messageData];
          }
          return prev;
        });
        
        setTimeout(scrollToBottom, 100);
      });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending || !selectedConversation) return;

    // Kiểm tra trạng thái conversation - không cho gửi tin nhắn trong conversation đã đóng
    if (selectedConversation.status === 'CLOSED') {
      alert('Cuộc hội thoại đã đóng. Không thể gửi tin nhắn mới.\n\nKhách hàng cần tạo cuộc hội thoại mới để được hỗ trợ.');
      return;
    }

    setSending(true);
    try {
      const messageData = await chatService.sendAdminMessage(selectedConversation.id, newMessage.trim());
      
      // Thêm tin nhắn vào danh sách ngay lập tức
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === messageData.id);
        if (!exists) {
          console.log('✅ Adding admin message immediately:', messageData.id);
          return [...prev, messageData];
        }
        return prev;
      });
      
      setNewMessage('');
      
      // Focus lại input
      inputRef.current?.focus();
      
      // Scroll to bottom
      setTimeout(scrollToBottom, 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const handleAssignConversation = async (conversationId) => {
    try {
      await chatService.assignAdminToConversation(conversationId);
      
      // Reload conversations để cập nhật trạng thái
      loadAllConversations();
      
      // Nếu đang chọn conversation này, cập nhật selected conversation
      if (selectedConversation?.id === conversationId) {
        const updatedConversation = { ...selectedConversation, status: 'OPEN' };
        setSelectedConversation(updatedConversation);
      }
      
    } catch (error) {
      console.error('Error assigning conversation:', error);
      
      // Xử lý lỗi khi admin đã có conversation active
      if (error.message && error.message.includes('already handling another active conversation')) {
        alert('Bạn đang xử lý một cuộc hội thoại khác. Vui lòng đóng cuộc hội thoại hiện tại trước khi nhận cuộc hội thoại mới.');
      } else {
        alert('Không thể nhận cuộc hội thoại. Vui lòng thử lại.');
      }
    }
  };

  const handleCloseConversation = async (conversationId) => {
    if (!window.confirm('Bạn có chắc muốn đóng cuộc hội thoại này?')) return;
    
    try {
      // Đóng cuộc hội thoại
      await chatService.closeConversation(conversationId);
      
      // Nếu đang chọn cuộc hội thoại này, tải tin nhắn đóng
      if (selectedConversation?.id === conversationId) {
        // Load lại tin nhắn để hiển thị thông báo đóng
        const messagesData = await chatService.getConversationMessages(conversationId, 0, 50);
        setMessages(messagesData.reverse());
        
        // Cập nhật trạng thái conversation trong UI
        setSelectedConversation({
          ...selectedConversation,
          status: 'CLOSED'
        });
      }
      
      // Tải lại danh sách hội thoại
      loadAllConversations();
      
    } catch (error) {
      console.error('Error closing conversation:', error);
      alert('Không thể đóng cuộc hội thoại. Vui lòng thử lại.');
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    setPopup({
      show: true,
      type: 'confirm',
      title: 'Xóa cuộc hội thoại',
      message: 'Bạn có chắc muốn XÓA VĨNH VIỄN cuộc hội thoại này?\n\nHành động này không thể hoàn tác!',
      onConfirm: async () => {
        try {
          await chatService.deleteConversation(conversationId);
          
          // Nếu đang chọn conversation này, clear selection
          if (selectedConversation?.id === conversationId) {
            setSelectedConversation(null);
            setMessages([]);
          }
          
          // Tải lại danh sách hội thoại
          loadAllConversations();
          
          setPopup({
            show: true,
            type: 'success',
            title: 'Thành công',
            message: 'Đã xóa cuộc hội thoại thành công!',
            onConfirm: () => setPopup({ show: false })
          });
          
        } catch (error) {
          console.error('Error deleting conversation:', error);
          setPopup({
            show: true,
            type: 'error',
            title: 'Lỗi',
            message: 'Không thể xóa cuộc hội thoại. Vui lòng thử lại.',
            onConfirm: () => setPopup({ show: false })
          });
        }
      },
      onCancel: () => setPopup({ show: false })
    });
  };

  const handleDeleteAllClosedConversations = async () => {
    setPopup({
      show: true,
      type: 'confirm',
      title: 'Xóa tất cả hội thoại đã đóng',
      message: 'Bạn có chắc muốn XÓA TẤT CẢ cuộc hội thoại đã đóng?\n\nHành động này sẽ xóa vĩnh viễn tất cả dữ liệu và không thể hoàn tác!',
      onConfirm: async () => {
        try {
          const result = await chatService.deleteAllClosedConversations();
          
          // Clear selection nếu đang chọn conversation đã đóng
          if (selectedConversation?.status === 'CLOSED') {
            setSelectedConversation(null);
            setMessages([]);
          }
          
          // Tải lại danh sách hội thoại
          loadAllConversations();
          
          setPopup({
            show: true,
            type: 'success',
            title: 'Thành công',
            message: result,
            onConfirm: () => setPopup({ show: false })
          });
          
        } catch (error) {
          console.error('Error deleting all closed conversations:', error);
          setPopup({
            show: true,
            type: 'error',
            title: 'Lỗi',
            message: 'Không thể xóa cuộc hội thoại. Vui lòng thử lại.',
            onConfirm: () => setPopup({ show: false })
          });
        }
      },
      onCancel: () => setPopup({ show: false })
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: { text: 'Chờ xử lý', class: 'status-pending', icon: '⏳' },
      OPEN: { text: 'Đang mở', class: 'status-open', icon: '✅' },
      CLOSED: { text: 'Đã đóng', class: 'status-closed', icon: '❌' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'status-unknown', icon: '❓' };
    
    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {statusInfo.icon} {statusInfo.text}
      </span>
    );
  };

  const getConversationsForActiveTab = () => {
    switch (activeTab) {
      case 'pending':
        return pendingConversations;
      case 'active':
        return activeConversations;
      case 'closed':
        return closedConversations;
      default:
        return [];
    }
  };

  const renderConversationItem = (conversation) => (
    <div 
      key={conversation.id} 
      className={`conversation-item ${selectedConversation?.id === conversation.id ? 'selected' : ''}`}
      onClick={() => handleSelectConversation(conversation)}
    >
      <div className="conversation-info">
        <div className="conversation-header">
          <h4 className="user-name">{conversation.userName || 'Người dùng'}</h4>
          <div className="conversation-meta">
            {getStatusBadge(conversation.status)}
            <span className="conversation-time">
              {formatDate(conversation.lastMessageAt || conversation.createdAt)}
            </span>
          </div>
        </div>
        
        <div className="conversation-preview">
          <p className="conversation-subject">
            <strong>Chủ đề:</strong> {conversation.subject || 'Hỗ trợ khách hàng'}
          </p>
          <p className="last-message">
            {conversation.lastMessage || 'Chưa có tin nhắn'}
          </p>
          {conversation.unreadCountAdmin > 0 && (
            <span className="unread-badge">{conversation.unreadCountAdmin}</span>
          )}
        </div>
        
        <div className="conversation-actions">
          {conversation.status === 'PENDING' && (
            <button 
              className="assign-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleAssignConversation(conversation.id);
              }}
            >
              <i className="fas fa-hand-paper"></i>
              Nhận yêu cầu
            </button>
          )}
          
          {conversation.status === 'OPEN' && (
            <button 
              className="close-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleCloseConversation(conversation.id);
              }}
            >
              <i className="fas fa-times"></i>
              Đóng
            </button>
          )}
          
          {conversation.status === 'CLOSED' && (
            <button 
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteConversation(conversation.id);
              }}
              title="Xóa vĩnh viễn cuộc hội thoại"
            >
              <i className="fas fa-trash"></i>
              Xóa
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="chat-management">
      {/* Header */}
      <div className="chat-management-header">
        <div className="header-title">
          <h2>🎧 Live Support Management</h2>
          {stats.pending > 0 && (
            <div className={`pending-notification ${pendingNotification ? 'pulse' : ''}`}>
              <i className="fas fa-bell"></i>
              <span className="notification-text">
                {stats.pending} yêu cầu đang chờ kết nối
              </span>
              <span className="notification-badge">{stats.pending}</span>
            </div>
          )}
          <div className="connection-status">
            <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
            <span>{isConnected ? 'Đang kết nối' : 'Mất kết nối'}</span>
          </div>
        </div>
        
        <div className="chat-stats">
          <div className="stat-item pending">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">⏳ Chờ xử lý</span>
          </div>
          <div className="stat-item active">
            <span className="stat-number">{stats.active}</span>
            <span className="stat-label">✅ Đang mở</span>
          </div>
          <div className="stat-item closed">
            <span className="stat-number">{stats.closed}</span>
            <span className="stat-label">❌ Đã đóng</span>
          </div>
          <div className="stat-item total">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">📊 Tổng cộng</span>
          </div>
        </div>
      </div>

      <div className="chat-management-content">
        {/* Conversations Panel with Tabs */}
        <div className="conversations-panel">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <span className="tab-icon">⏳</span>
              <span className="tab-label">Chờ xử lý</span>
              <span className="tab-count">{stats.pending}</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              <span className="tab-icon">✅</span>
              <span className="tab-label">Đang mở</span>
              <span className="tab-count">{stats.active}</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'closed' ? 'active' : ''}`}
              onClick={() => setActiveTab('closed')}
            >
              <span className="tab-icon">❌</span>
              <span className="tab-label">Đã đóng</span>
              <span className="tab-count">{stats.closed}</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            <div className="conversations-header">
              <h3>
                {activeTab === 'pending' && '⏳ Hàng đợi hỗ trợ'}
                {activeTab === 'active' && '✅ Cuộc hội thoại đang mở'}
                {activeTab === 'closed' && '❌ Lịch sử hội thoại'}
              </h3>
              <div className="header-actions">
                {activeTab === 'closed' && stats.closed > 0 && (
                  <button 
                    className="delete-all-btn" 
                    onClick={handleDeleteAllClosedConversations}
                    title="Xóa tất cả cuộc hội thoại đã đóng"
                  >
                    <i className="fas fa-trash-alt"></i>
                    Xóa tất cả
                  </button>
                )}
                <button className="refresh-btn" onClick={loadAllConversations} disabled={loading}>
                  <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
                </button>
              </div>
            </div>
            
            <div className="conversations-list">
              {loading ? (
                <div className="loading-state">
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Đang tải...</span>
                </div>
              ) : getConversationsForActiveTab().length === 0 ? (
                <div className="empty-state">
                  {activeTab === 'pending' && (
                    <>
                      <i className="fas fa-clock"></i>
                      <h3>Không có yêu cầu chờ xử lý</h3>
                      <p>Tất cả yêu cầu hỗ trợ đã được xử lý</p>
                    </>
                  )}
                  {activeTab === 'active' && (
                    <>
                      <i className="fas fa-comments"></i>
                      <h3>Không có cuộc hội thoại đang mở</h3>
                      <p>Chưa có cuộc hội thoại nào đang hoạt động</p>
                    </>
                  )}
                  {activeTab === 'closed' && (
                    <>
                      <i className="fas fa-archive"></i>
                      <h3>Chưa có lịch sử</h3>
                      <p>Chưa có cuộc hội thoại nào được đóng</p>
                    </>
                  )}
                  <button 
                    className="refresh-btn-empty"
                    onClick={loadAllConversations}
                  >
                    <i className="fas fa-sync-alt"></i> Làm mới
                  </button>
                </div>
              ) : (
                getConversationsForActiveTab().map(renderConversationItem)
              )}
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="chat-panel">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="chat-panel-header">
                <div className="chat-user-info">
                  <div className="chat-user-details">
                    <h3>{selectedConversation.userName || 'Người dùng'}</h3>
                    <p>{selectedConversation.userEmail || ''}</p>
                    <div className="chat-subject">
                      <strong>Chủ đề:</strong> {selectedConversation.subject || 'Hỗ trợ khách hàng'}
                    </div>
                  </div>
                </div>
                
                <div className="chat-header-actions">
                  {getStatusBadge(selectedConversation.status)}
                  {selectedConversation.status === 'PENDING' && (
                    <button 
                      className="assign-conversation-btn"
                      onClick={() => handleAssignConversation(selectedConversation.id)}
                    >
                      <i className="fas fa-hand-paper"></i>
                      Nhận yêu cầu
                    </button>
                  )}
                  {selectedConversation.status === 'OPEN' && (
                    <button 
                      className="close-conversation-btn"
                      onClick={() => handleCloseConversation(selectedConversation.id)}
                    >
                      <i className="fas fa-times"></i>
                      Đóng hội thoại
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages-panel">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <i className="fas fa-comments"></i>
                    <h4>
                      {selectedConversation.status === 'PENDING' 
                        ? 'Yêu cầu hỗ trợ đang chờ xử lý' 
                        : 'Chưa có tin nhắn nào'
                      }
                    </h4>
                    <p>
                      {selectedConversation.status === 'PENDING' 
                        ? 'Nhấn "Nhận yêu cầu" để bắt đầu hỗ trợ khách hàng'
                        : 'Hãy gửi tin nhắn để bắt đầu cuộc trò chuyện'
                      }
                    </p>
                    {selectedConversation.status === 'OPEN' && (
                      <div className="message-suggestions">
                        <button 
                          className="message-suggestion-btn"
                          onClick={() => setNewMessage("Xin chào! Tôi có thể giúp gì cho bạn?")}
                        >
                          Xin chào! Tôi có thể giúp gì cho bạn?
                        </button>
                        <button 
                          className="message-suggestion-btn"
                          onClick={() => setNewMessage("Cảm ơn bạn đã liên hệ với VTX STORE. Tôi có thể hỗ trợ gì cho bạn?")}
                        >
                          Cảm ơn bạn đã liên hệ với VTX STORE
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  messages.map((message) => {
                    // Lấy ID admin hiện tại
                    const currentAdminId = localStorage.getItem('adminId');
                    
                    // Kiểm tra xem có phải tin nhắn hệ thống không
                    const isSystemMessage = message.senderName === "Hệ thống" || 
                                           message.senderName === "system@vtxstore.com" ||
                                           (message.content && (
                                             message.content.includes("Cuộc hội thoại đã được đóng") || 
                                             message.content.includes("THÔNG BÁO")
                                           ));
                    
                    // Xác định loại tin nhắn đơn giản
                    let messageClass = "user-message"; // default: tin nhắn từ user
                    let senderLabel = selectedConversation.userName || "User";
                    
                    if (isSystemMessage) {
                      messageClass = "system-message";
                      senderLabel = "Hệ thống";
                    } else if (message.isFromAdmin) {
                      // Tin nhắn từ admin - luôn hiển thị tên admin thật
                      const isCurrentAdmin = message.senderId == currentAdminId;
                      messageClass = isCurrentAdmin ? "admin-message current" : "admin-message other";
                      senderLabel = message.senderName || "Admin";
                      
                      // Thêm indicator cho admin hiện tại
                      if (isCurrentAdmin) {
                        senderLabel += " (Bạn)";
                      }
                    }
                    
                    return (
                      <div 
                        key={message.id} 
                        className={`chat-message ${messageClass}`}
                      >
                        <div className="message-content">
                          <div className="message-text">{message.content}</div>
                          <div className="message-meta">
                            <span className="message-sender">{senderLabel}</span>
                            <span className="message-time">{formatTime(message.sentAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="chat-input-panel">
                <form className="chat-input-form" onSubmit={handleSendMessage}>
                  <div className="input-container">
                    <textarea
                      ref={inputRef}
                      className="message-input"
                      placeholder={
                        selectedConversation.status === 'PENDING'
                          ? "Nhận yêu cầu trước để có thể trả lời..."
                          : selectedConversation.status === 'CLOSED' 
                            ? "Cuộc hội thoại đã đóng - không thể gửi tin nhắn"
                            : !isConnected 
                              ? "Mất kết nối..."
                              : "Nhập tin nhắn..."
                      }
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      rows={1}
                      disabled={sending || !isConnected || selectedConversation.status === 'CLOSED' || selectedConversation.status === 'PENDING'}
                    />
                    <button 
                      type="submit" 
                      className="send-btn"
                      disabled={!newMessage.trim() || sending || !isConnected || selectedConversation.status === 'CLOSED' || selectedConversation.status === 'PENDING'}
                      title="Gửi tin nhắn"
                    >
                      {sending ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-paper-plane"></i>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="no-conversation-selected">
              <i className="fas fa-headset"></i>
              <h3>Chọn một yêu cầu hỗ trợ</h3>
              <p>Chọn yêu cầu từ danh sách bên trái để bắt đầu hỗ trợ khách hàng</p>
              <div className="quick-stats">
                <div className="quick-stat">
                  <span className="stat-icon">⏳</span>
                  <span className="stat-text">{stats.pending} đang chờ</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-icon">✅</span>
                  <span className="stat-text">{stats.active} đang mở</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popup Modal */}
      {popup.show && (
        <div className="popup-overlay" onClick={() => popup.onCancel && popup.onCancel()}>
          <div className="popup-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`popup-header ${popup.type}`}>
              <h3>{popup.title}</h3>
              <button className="popup-close" onClick={() => popup.onCancel && popup.onCancel()}>×</button>
            </div>
            <div className="popup-body">
              <p style={{ whiteSpace: 'pre-line' }}>{popup.message}</p>
            </div>
            <div className="popup-footer">
              {popup.type === 'confirm' ? (
                <>
                  <button className="popup-btn cancel" onClick={popup.onCancel}>
                    Hủy
                  </button>
                  <button className="popup-btn confirm" onClick={popup.onConfirm}>
                    Xác nhận
                  </button>
                </>
              ) : (
                <button className="popup-btn confirm" onClick={popup.onConfirm}>
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatManagement; 