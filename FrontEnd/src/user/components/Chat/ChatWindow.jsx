import React, { useState, useEffect, useRef } from 'react';
import chatService from '../../../services/chatService';
import ChatPopup from './ChatPopup';

const ChatWindow = ({ conversation: initialConversation, isConnected, isLoggedIn, newIncomingMessage, onClose, onNewMessage, onMessageProcessed }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showChatModeSelection, setShowChatModeSelection] = useState(false);
  const [chatMode, setChatMode] = useState(null); // null, 'auto' hoặc 'direct'
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [conversation, setConversation] = useState(initialConversation);
  const [popup, setPopup] = useState({ show: false, type: 'info', title: '', message: '' });
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 ChatWindow state:', {
      isLoggedIn,
      loading,
      showChatModeSelection,
      chatMode,
      messagesCount: messages.length,
      conversation
    });
  }, [isLoggedIn, loading, showChatModeSelection, chatMode, messages.length, conversation]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isLoggedIn && conversation) {
      loadMessages();
      // Mark messages as read when opening chat
      chatService.markMessagesAsRead(conversation.id);
    } else if (!isLoggedIn) {
      // Anonymous user - chỉ hiển thị mode selection
      setLoading(false);
    }
  }, [conversation, isLoggedIn]);
  
  // Hiển thị mode selection khi cần
  useEffect(() => {
    if (!loading && chatMode === null) {
      console.log('🔧 Showing chat mode selection');
      setShowChatModeSelection(true);
    }
  }, [loading, chatMode]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!conversation) return;
    
    setLoading(true);
    try {
      const messagesData = await chatService.getConversationMessages(conversation.id, 0, 50);
      // Reverse để hiển thị tin nhắn cũ nhất ở trên
      setMessages(messagesData.reverse());
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update conversation when initialConversation changes
  useEffect(() => {
    setConversation(initialConversation);
  }, [initialConversation]);

  // FIXED VẤN ĐỀ 2: Xử lý tin nhắn mới từ WebSocket
  useEffect(() => {
    if (newIncomingMessage) {
      console.log('📨 ChatWindow processing new incoming message:', newIncomingMessage);
      
      // Thêm tin nhắn mới vào danh sách
      setMessages(prev => {
        // Kiểm tra xem tin nhắn đã tồn tại chưa để tránh duplicate
        const exists = prev.some(msg => msg.id === newIncomingMessage.id);
        if (!exists) {
          console.log('✅ Adding new message to chat window');
          return [...prev, newIncomingMessage];
        }
        console.log('⚠️ Message already exists, skipping duplicate');
        return prev;
      });
      
      // Thông báo đã xử lý tin nhắn
      if (onMessageProcessed) {
        onMessageProcessed();
      }
    }
  }, [newIncomingMessage, onMessageProcessed]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      if (isLoggedIn && chatMode === 'direct') {
        if (!conversation) {
          // Chưa có conversation - tạo conversation khi user gửi tin nhắn đầu tiên
          console.log('🔄 Creating conversation when user sends first message...');
          const newConversation = await chatService.createOrGetConversation('Hỗ trợ trực tiếp');
          setConversation(newConversation);
          
          // Gửi tin nhắn sau khi tạo conversation
          const messageData = await chatService.sendMessage(newConversation.id, newMessage.trim());
          
          // Cập nhật messages với tin nhắn vừa gửi + thông báo chờ admin
          setMessages([{
            id: Date.now() - 1,
            content: "🔄 Yêu cầu hỗ trợ đã được tạo!\n\nTin nhắn của bạn đã được gửi đến đội ngũ hỗ trợ. Vui lòng chờ nhân viên phản hồi...",
            messageType: 'SYSTEM',
            senderName: 'Hệ thống',
            sentAt: new Date().toISOString()
          }, messageData]);
          
          // Notify parent to update conversation state
          if (onNewMessage) {
            onNewMessage();
          }
        } else {
          // Đã có conversation - kiểm tra trạng thái trước khi gửi
          if (conversation.status === 'CLOSED') {
            setPopup({
              show: true,
              type: 'info',
              title: 'Cuộc hội thoại đã kết thúc',
              message: 'Cuộc hội thoại này đã được đóng. Vui lòng tạo cuộc hội thoại mới để được hỗ trợ.'
            });
            return;
          }
          
          // FIXED VẤN ĐỀ 3: Kiểm tra PENDING state trước khi gửi
          if (conversation.status === 'PENDING') {
            setPopup({
              show: true,
              type: 'warning',
              title: 'Đang chờ nhân viên hỗ trợ',
              message: 'Vui lòng chờ nhân viên kết nối trước khi gửi tin nhắn. Yêu cầu của bạn đang trong hàng đợi.'
            });
            return;
          }
          
          // Gửi tin nhắn bình thường
          const messageData = await chatService.sendMessage(conversation.id, newMessage.trim());
          setMessages(prev => [...prev, messageData]);
        }
      } else if (!isLoggedIn && chatMode === 'direct') {
        // Anonymous user muốn chat trực tiếp - yêu cầu đăng nhập
        setPopup({
          show: true,
          type: 'warning',
          title: 'Yêu cầu đăng nhập',
          message: 'Vui lòng đăng nhập để chat trực tiếp với nhân viên hỗ trợ.'
        });
        return;
      } else {
        // Không cho phép gửi tin nhắn text trong chế độ auto
        setPopup({
          show: true,
          type: 'info',
          title: 'Chế độ hỗ trợ tự động',
          message: 'Vui lòng chọn từ menu bên dưới hoặc chuyển sang chế độ chat trực tiếp.'
        });
        return;
      }
      
      setNewMessage('');
      
      // Focus lại input
      inputRef.current?.focus();
      
      // Notify parent component
      onNewMessage?.();
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Xử lý lỗi specific cho PENDING state
      if (error.message && error.message.includes('Please wait for an agent')) {
        setPopup({
          show: true,
          type: 'warning',
          title: 'Đang chờ nhân viên hỗ trợ',
          message: 'Vui lòng chờ nhân viên kết nối trước khi gửi tin nhắn. Yêu cầu của bạn đang trong hàng đợi.'
        });
      } else {
        setPopup({
          show: true,
          type: 'error',
          title: 'Lỗi gửi tin nhắn',
          message: 'Không thể gửi tin nhắn. Vui lòng thử lại.'
        });
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleChatModeSelection = async (mode) => {
    if (!isLoggedIn && mode === 'direct') {
      // Yêu cầu đăng nhập cho chế độ chat trực tiếp
      setPopup({
        show: true,
        type: 'confirm',
        title: 'Yêu cầu đăng nhập',
        message: 'Để chat trực tiếp với nhân viên hỗ trợ, bạn cần đăng nhập.\n\nBạn có muốn đăng nhập ngay bây giờ không?'
      });
      return;
    }
    
    setChatMode(mode);
    setShowChatModeSelection(false);
    
    try {
      if (!isLoggedIn && mode === 'auto') {
        // Anonymous user chọn chế độ auto - chỉ hiển thị UI tĩnh
        setMessages([{
          id: Date.now(),
          content: "🤖 Chào mừng bạn đến với VTX STORE!\n\nBạn đã chọn chế độ hỗ trợ tự động. Vui lòng chọn chủ đề từ menu bên dưới để được hỗ trợ nhanh chóng! 😊",
          messageType: 'SYSTEM',
          senderName: 'Hệ thống',
          sentAt: new Date().toISOString()
        }]);
      } else if (isLoggedIn) {
        // User đã đăng nhập - load messages theo mode
        if (mode === 'auto') {
          // Chế độ auto cho user đã đăng nhập - có thể dùng anonymous service hoặc tạo logic riêng
          setMessages([{
            id: Date.now(),
            content: "🤖 Bạn đã chọn chế độ hỗ trợ tự động. Vui lòng chọn chủ đề từ menu bên dưới.",
            messageType: 'SYSTEM',
            senderName: 'Hệ thống',
            sentAt: new Date().toISOString()
          }]);
        } else if (mode === 'direct') {
          // Chế độ Live Agent - CHƯA tạo conversation, chỉ hiển thị giao diện
          if (conversation) {
            // Nếu đã có conversation, load messages
            await loadMessages();
            
            // Nếu vẫn PENDING, hiển thị trạng thái chờ
            if (conversation.status === 'PENDING') {
              setMessages(prev => {
                const hasWaitingMessage = prev.some(msg => 
                  msg.content && msg.content.includes("Đang kết nối với nhân viên"));
                
                if (!hasWaitingMessage) {
                  return [{
                    id: Date.now(),
                    content: "🔄 Đang chờ nhân viên xử lý yêu cầu...\n\nYêu cầu của bạn đang trong hàng đợi. Nhân viên sẽ sớm phản hồi!",
                    messageType: 'SYSTEM',
                    senderName: 'Hệ thống',
                    sentAt: new Date().toISOString()
                  }, ...prev];
                }
                return prev;
              });
            }
          } else {
            // Chưa có conversation - hiển thị giao diện sẵn sàng nhận tin nhắn
            setMessages([{
              id: Date.now(),
              content: "👋 Chào mừng bạn đến với Live Support!\n\n💬 Hãy nhập tin nhắn bên dưới để bắt đầu cuộc trò chuyện với nhân viên hỗ trợ.",
              messageType: 'SYSTEM',
              senderName: 'Hệ thống',
              sentAt: new Date().toISOString()
            }]);
          }
        }
      }
      
    } catch (error) {
      console.error('Error updating chat mode:', error);
      setPopup({
        show: true,
        type: 'error',
        title: 'Lỗi cập nhật',
        message: 'Không thể cập nhật chế độ chat. Vui lòng thử lại.'
      });
    }
  };

  // Định nghĩa các topic và sub-options
  const topics = {
    products: {
      title: "📱 Sản phẩm",
      desc: "Laptop, smartphone, PC gaming",
      icon: "📱",
      color: "products",
      options: [
        { key: "laptop", title: "💻 Laptop", desc: "Dell, HP, Asus, MSI, Lenovo" },
        { key: "smartphone", title: "📱 Smartphone", desc: "iPhone, Samsung, Xiaomi, Oppo" },
        { key: "pc_gaming", title: "🎮 PC Gaming", desc: "Cấu hình mạnh, giá tốt" },
        { key: "accessories", title: "🖱️ Phụ kiện", desc: "Chuột, bàn phím, tai nghe" }
      ]
    },
    pricing: {
      title: "💰 Giá cả & Khuyến mãi",
      desc: "Báo giá, ưu đãi đặc biệt",
      icon: "💰",
      color: "pricing",
      options: [
        { key: "price_policy", title: "🏷️ Chính sách giá", desc: "Cam kết giá tốt nhất" },
        { key: "promotions", title: "🎉 Khuyến mãi", desc: "Ưu đãi hiện tại" },
        { key: "student_discount", title: "🎓 Ưu đãi sinh viên", desc: "Giảm 10-15%" },
        { key: "enterprise_discount", title: "💼 Ưu đãi doanh nghiệp", desc: "Giảm giá số lượng lớn" }
      ]
    },
    shipping: {
      title: "🚚 Giao hàng",
      desc: "Vận chuyển, miễn phí ship",
      icon: "🚚", 
      color: "shipping",
      options: [
        { key: "delivery_time", title: "⏰ Thời gian giao", desc: "2-4 giờ nội thành" },
        { key: "shipping_cost", title: "💰 Phí vận chuyển", desc: "Miễn phí từ 800k" },
        { key: "packaging", title: "📦 Đóng gói", desc: "Bảo vệ an toàn" },
        { key: "tracking", title: "📍 Theo dõi đơn", desc: "Realtime tracking" }
      ]
    },
    warranty: {
      title: "🛡️ Bảo hành",
      desc: "Chính sách, thời gian",
      icon: "🛡️",
      color: "warranty", 
      options: [
        { key: "warranty_period", title: "⏳ Thời gian bảo hành", desc: "12-36 tháng" },
        { key: "warranty_process", title: "🔧 Quy trình bảo hành", desc: "3 bước đơn giản" },
        { key: "warranty_policy", title: "📋 Chính sách", desc: "Điều kiện bảo hành" },
        { key: "extended_warranty", title: "⭐ Bảo hành mở rộng", desc: "VTX Care Plus" }
      ]
    },
    payment: {
      title: "💳 Thanh toán",
      desc: "Trả góp, ví điện tử",
      icon: "💳",
      color: "payment",
      options: [
        { key: "payment_methods", title: "💵 Phương thức", desc: "COD, chuyển khoản, thẻ" },
        { key: "installment", title: "📅 Trả góp 0%", desc: "6-24 tháng" },
        { key: "e_wallet", title: "📱 Ví điện tử", desc: "MoMo, ZaloPay, VNPay" },
        { key: "corporate_payment", title: "🏢 Thanh toán B2B", desc: "Hóa đơn VAT, công nợ" }
      ]
    },
    contact: {
      title: "📞 Liên hệ",
      desc: "Hotline, địa chỉ, email",
      icon: "📞",
      color: "contact",
      options: [
        { key: "hotline", title: "📞 Hotline", desc: "1900-8888 (24/7)" },
        { key: "store_locations", title: "🏪 Cửa hàng", desc: "TP.HCM, Hà Nội" },
        { key: "online_channels", title: "🌐 Kênh online", desc: "Website, Facebook, Zalo" },
        { key: "business_hours", title: "🕒 Giờ làm việc", desc: "8:00-22:00 hằng ngày" }
      ]
    }
  };

  // Xử lý chọn topic chính
  const handleTopicSelect = (topicKey) => {
    setCurrentTopic(topicKey);
    setShowSubMenu(true);
  };

  // Xử lý chọn option con
  const handleOptionSelect = async (topicKey, optionKey) => {
    setShowSubMenu(false);
    
    // Tạo message từ user
    const optionData = topics[topicKey].options.find(opt => opt.key === optionKey);
    const userMessage = `Tôi muốn biết về: ${optionData.title}`;
    
    // Tạo user message object
    const userMessageObj = {
      id: Date.now(),
      content: userMessage,
      messageType: 'USER',
      senderName: 'Khách hàng',
      sentAt: new Date().toISOString(),
      isBotResponse: false
    };
    
    // Tạo bot response object với thông tin chi tiết
    const botResponse = getBotResponse(topicKey, optionKey);
    const botMessageObj = {
      id: Date.now() + 1,
      content: botResponse,
      messageType: 'BOT',
      senderName: 'VTX Bot',
      sentAt: new Date().toISOString(),
      isBotResponse: true
    };
    
    // Thêm cả 2 tin nhắn vào state
    setMessages(prev => [...prev, userMessageObj, botMessageObj]);
  };

  // Hàm tạo bot response dựa trên topic và option
  const getBotResponse = (topicKey, optionKey) => {
    const responses = {
      products: {
        laptop: "💻 **LAPTOP TẠI VTX STORE**\n\n🔥 **Thương hiệu hot:**\n• Dell XPS, Inspiron, Vostro\n• HP Pavilion, Envy, EliteBook\n• Asus VivoBook, ZenBook, ROG\n• MSI Gaming, Creator, Modern\n• Lenovo ThinkPad, IdeaPad\n\n💰 **Mức giá:**\n• Văn phòng: 10-20 triệu\n• Gaming: 20-40 triệu\n• Workstation: 30-80 triệu\n\n📞 Gọi 1900-8888 để được tư vấn chi tiết!",
        smartphone: "📱 **SMARTPHONE TẠI VTX STORE**\n\n🍎 **iPhone:**\n• iPhone 15 Series: 22-35 triệu\n• iPhone 14 Series: 18-28 triệu\n• iPhone 13 Series: 15-22 triệu\n\n🤖 **Android:**\n• Samsung Galaxy S24: 20-30 triệu\n• Xiaomi 14 Series: 12-18 triệu\n• Oppo Find X7: 15-25 triệu\n\n🎁 **Ưu đãi:** Trả góp 0%, tặng phụ kiện\n📞 Hotline: 1900-8888",
        pc_gaming: "🎮 **PC GAMING TẠI VTX STORE**\n\n⚡ **Cấu hình phổ biến:**\n• Entry Gaming: 15-25 triệu\n  - CPU: i5/Ryzen 5\n  - GPU: RTX 4060/RX 7600\n  - RAM: 16GB\n\n• High-end Gaming: 35-60 triệu\n  - CPU: i7/Ryzen 7\n  - GPU: RTX 4070 Ti/RX 7800 XT\n  - RAM: 32GB\n\n🛠️ **Dịch vụ:** Lắp ráp miễn phí, test 24h\n📞 Tư vấn: 1900-8888",
        accessories: "🖱️ **PHỤ KIỆN CÔNG NGHỆ**\n\n⌨️ **Bàn phím:**\n• Cơ học: Corsair, Razer, Logitech\n• Văn phòng: Dell, HP, Microsoft\n\n🖱️ **Chuột:**\n• Gaming: Razer, SteelSeries\n• Văn phòng: Logitech, Microsoft\n\n🎧 **Tai nghe:**\n• Gaming: HyperX, SteelSeries\n• Âm thanh: Sony, Audio-Technica\n\n📞 Xem thêm: 1900-8888"
      },
      pricing: {
        price_policy: "💰 **CHÍNH SÁCH GIÁ VTX STORE**\n\n✅ **Cam kết:**\n• Giá tốt nhất thị trường\n• Hoàn tiền 200% nếu có nơi rẻ hơn\n• Không phụ thu, phí ẩn\n• Minh bạch 100%\n\n🏷️ **Báo giá:**\n• Online: Cập nhật realtime\n• Hotline: 1900-8888\n• Tại cửa hàng: Tư vấn trực tiếp\n\n💎 **VIP:** Khách hàng thân thiết giảm thêm 3-5%",
        promotions: "🎉 **KHUYẾN MÃI HOT THÁNG NÀY**\n\n🔥 **Ưu đãi đặc biệt:**\n• 🎓 Sinh viên: Giảm 10-15%\n• 💼 Doanh nghiệp: Giảm 5-20%\n• 🎁 Mua laptop tặng chuột + balo\n• 📱 Trade-in điện thoại cũ lấy mới\n\n💳 **Trả góp:**\n• 0% lãi suất 6-12 tháng\n• Duyệt nhanh trong 30 phút\n\n📞 Hotline: 1900-8888",
        student_discount: "🎓 **ƯU ĐÃI SINH VIÊN**\n\n📋 **Điều kiện:**\n• Thẻ sinh viên còn hạn\n• CMND/CCCD dưới 25 tuổi\n\n💰 **Mức giảm:**\n• Laptop: 10-15%\n• Smartphone: 5-10%\n• Phụ kiện: 10-20%\n\n🎁 **Tặng thêm:**\n• Balo laptop cao cấp\n• Chuột không dây\n• Miếng dán màn hình\n\n📞 Liên hệ: 1900-8888",
        enterprise_discount: "💼 **ƯU ĐÃI DOANH NGHIỆP**\n\n🏢 **Đối tượng:**\n• Công ty, tổ chức\n• Mua số lượng lớn (từ 5 sản phẩm)\n• Khách hàng thân thiết\n\n💰 **Mức giảm:**\n• 5-10 sản phẩm: 5-8%\n• 10-20 sản phẩm: 8-15%\n• Trên 20 sản phẩm: 15-20%\n\n📋 **Hỗ trợ thêm:**\n• Báo giá chính thức\n• Hóa đơn VAT\n• Bảo hành mở rộng\n\n📞 Hotline B2B: 1900-8888"
      },
      shipping: {
        delivery_time: "🚚 **THỜI GIAN GIAO HÀNG**\n\n⚡ **Nội thành TP.HCM:**\n• Giao nhanh: 2-4 giờ\n• Giao tiêu chuẩn: 1 ngày\n• Giao trong ngày: +50k\n\n🌍 **Toàn quốc:**\n• Miền Nam: 1-2 ngày\n• Miền Trung: 2-3 ngày\n• Miền Bắc: 2-4 ngày\n\n📦 **Cam kết:**\n• Đóng gói cẩn thận\n• Bảo hiểm 100% giá trị\n• Theo dõi đơn hàng realtime",
        shipping_cost: "💰 **PHÍ GIAO HÀNG**\n\n🆓 **MIỄN PHÍ khi:**\n• Đơn hàng từ 800.000đ\n• Khách VIP (mua từ 3 lần)\n• Khu vực nội thành TP.HCM\n\n💵 **Có phí:**\n• Dưới 800k: 30.000đ\n• Giao nhanh trong ngày: +50.000đ\n• Vùng xa, hải đảo: 50-100.000đ\n\n📞 **Tư vấn phí ship:** 1900-8888",
        packaging: "📦 **ĐÓNG GÓI & BẢO VỆ**\n\n🛡️ **Quy trình đóng gói:**\n• Kiểm tra sản phẩm kỹ lưỡng\n• Bọc bubble, foam chống sốc\n• Thùng carton chuyên dụng\n• Dán fragile cho hàng dễ vỡ\n\n📋 **Bảo hiểm:**\n• 100% giá trị sản phẩm\n• Đền bù nếu hư hỏng do vận chuyển\n• Chụp ảnh trước khi giao\n\n✅ **Cam kết:** Hàng nguyên seal, chính hãng",
        tracking: "📍 **THEO DÕI ĐÔN HÀNG**\n\n📱 **Cách theo dõi:**\n• SMS thông báo tự động\n• Website: vtxstore.vn/tracking\n• Hotline: 1900-8888\n• App VTX Store\n\n📊 **Thông tin cập nhật:**\n• Xác nhận đơn hàng\n• Đóng gói xong\n• Bàn giao vận chuyển\n• Đang giao hàng\n• Giao thành công\n\n🔔 **Thông báo:** Realtime qua SMS/Email"
      },
      warranty: {
        warranty_period: "🛡️ **THỜI GIAN BẢO HÀNH**\n\n💻 **Laptop:**\n• Chính hãng: 24-36 tháng\n• VTX Care: +12 tháng\n• Bàn phím, pin: 12 tháng\n\n📱 **Smartphone:**\n• Chính hãng: 12-24 tháng\n• Màn hình: 6 tháng\n• Pin, sạc: 6 tháng\n\n🖥️ **PC & Linh kiện:**\n• CPU, RAM: 36 tháng\n• Mainboard, VGA: 24-36 tháng\n• SSD, HDD: 36-60 tháng",
        warranty_process: "🔧 **QUY TRÌNH BẢO HÀNH**\n\n📞 **Bước 1:** Liên hệ\n• Hotline: 1900-8888\n• Mô tả lỗi chi tiết\n• Cung cấp serial number\n\n🏪 **Bước 2:** Mang sản phẩm\n• Đến trung tâm bảo hành\n• Kèm hóa đơn, phiếu bảo hành\n• Nhận phiếu tiếp nhận\n\n⚡ **Bước 3:** Xử lý\n• Kiểm tra, chẩn đoán\n• Sửa chữa hoặc thay thế\n• Thông báo kết quả",
        warranty_policy: "📋 **CHÍNH SÁCH BẢO HÀNH**\n\n✅ **Được bảo hành:**\n• Lỗi do nhà sản xuất\n• Hư hỏng trong sử dụng bình thường\n• Linh kiện chính hãng\n\n❌ **Không bảo hành:**\n• Rơi vỡ, ngấm nước\n• Tự ý sửa chữa\n• Hết hạn bảo hành\n• Sử dụng sai mục đích\n\n🔄 **Đổi mới:** 15 ngày đầu nếu lỗi từ NSX\n📞 Hỗ trợ: 1900-8888",
        extended_warranty: "⭐ **BẢO HÀNH MỞ RỘNG**\n\n🛡️ **VTX Care Plus:**\n• Gia hạn thêm 12-24 tháng\n• Bảo hành rơi vỡ, ngấm nước\n• Hỗ trợ kỹ thuật 24/7\n• Đổi mới nếu sửa quá 3 lần\n\n💰 **Chi phí:**\n• Laptop: 5-10% giá trị\n• Smartphone: 8-15% giá trị\n• PC: 3-8% giá trị\n\n📞 **Đăng ký:** 1900-8888\n⏰ **Thời hạn:** Trong 30 ngày từ khi mua"
      },
      payment: {
        payment_methods: "💳 **PHƯƠNG THỨC THANH TOÁN**\n\n💵 **Tiền mặt:**\n• Tại cửa hàng\n• Khi nhận hàng (COD)\n\n🏦 **Chuyển khoản:**\n• Vietcombank: 0123456789\n• Techcombank: 9876543210\n• BIDV: 1122334455\n\n💳 **Thẻ tín dụng:**\n• Visa, Mastercard, JCB\n• Trả góp 0% lãi suất\n\n📱 **Ví điện tử:**\n• MoMo, ZaloPay, VNPay\n• ShopeePay, Moca",
        installment: "💳 **TRẢ GÓP 0% LÃI SUẤT**\n\n🏦 **Qua thẻ tín dụng:**\n• 3-6 tháng: Tất cả ngân hàng\n• 9-12 tháng: Sacombank, TPBank\n• 18-24 tháng: VIB, FE Credit\n\n📋 **Hồ sơ cần:**\n• CMND/CCCD + Thẻ tín dụng\n• Hóa đơn lương (nếu cần)\n\n⚡ **Duyệt nhanh:**\n• Online: 5-15 phút\n• Tại cửa hàng: 30 phút\n\n📞 Tư vấn: 1900-8888",
        e_wallet: "📱 **VÍ ĐIỆN TỬ**\n\n🔥 **Ví phổ biến:**\n• 🟢 MoMo: Quét QR, chuyển tiền\n• 🔵 ZaloPay: Ưu đãi 50% phí ship\n• 🟡 VNPay: Liên kết ngân hàng\n• 🟠 ShopeePay: Hoàn xu mua sắm\n• ⚫ Moca: Grab, thanh toán nhanh\n\n💰 **Ưu đãi:**\n• Cashback 1-5%\n• Voucher giảm giá\n• Miễn phí chuyển tiền\n\n✅ **Bảo mật:** Xác thực 2 lớp, mã PIN\n📞 Hỗ trợ: 1900-8888",
        corporate_payment: "🏢 **THANH TOÁN DOANH NGHIỆP**\n\n📋 **Hình thức:**\n• Chuyển khoản công ty\n• Séc công ty\n• Thẻ tín dụng doanh nghiệp\n• Công nợ (khách hàng VIP)\n\n📄 **Hóa đơn:**\n• Hóa đơn VAT đầy đủ\n• Xuất trong ngày\n• Giao hóa đơn tận nơi\n\n💼 **Ưu đãi B2B:**\n• Giảm giá theo số lượng\n• Chính sách công nợ 30-60 ngày\n• Hỗ trợ báo giá, đấu thầu\n\n📞 Hotline B2B: 1900-8888"
      },
      contact: {
        hotline: "📞 **HOTLINE HỖ TRỢ**\n\n🔥 **Tổng đài chính:**\n📞 1900-8888 (Miễn phí)\n🕒 Hỗ trợ: 8:00-22:00 hằng ngày\n\n📱 **Hotline chuyên biệt:**\n• Bán hàng: 0901-234-567\n• Bảo hành: 0901-234-568\n• Khiếu nại: 0901-234-569\n• B2B: 0901-234-570\n\n💬 **Chat online:**\n• Website: vtxstore.vn\n• Facebook Messenger\n• Zalo OA: VTX STORE",
        store_locations: "🏪 **HỆ THỐNG CỬA HÀNG**\n\n🌟 **TP. Hồ Chí Minh:**\n• Q1: 123 Nguyễn Huệ\n• Q3: 456 Võ Văn Tần\n• Q7: 789 Nguyễn Thị Thập\n• Thủ Đức: 321 Võ Văn Ngân\n\n🌟 **Hà Nội:**\n• Hoàn Kiếm: 111 Tràng Tiền\n• Cầu Giấy: 222 Xuân Thủy\n• Thanh Xuân: 333 Nguyễn Trãi\n\n🕒 **Giờ mở cửa:**\n• T2-T6: 8:00-22:00\n• T7-CN: 9:00-21:00",
        online_channels: "🌐 **KÊNH TRỰC TUYẾN**\n\n💻 **Website:**\n• vtxstore.vn\n• Mua hàng online 24/7\n• Tra cứu bảo hành\n• Theo dõi đơn hàng\n\n📱 **Social Media:**\n• Facebook: VTX STORE Official\n• Instagram: @vtxstore\n• YouTube: VTX STORE Channel\n• TikTok: @vtxstore_official\n\n📧 **Email:**\n• Tư vấn: sales@vtxstore.vn\n• Hỗ trợ: support@vtxstore.vn\n• Bảo hành: warranty@vtxstore.vn",
        business_hours: "🕒 **GIỜ LÀM VIỆC**\n\n🏪 **Cửa hàng:**\n• Thứ 2 - Thứ 6: 8:00 - 22:00\n• Thứ 7 - Chủ nhật: 9:00 - 21:00\n• Lễ, Tết: 9:00 - 18:00\n\n📞 **Hotline:**\n• 1900-8888: 8:00 - 22:00\n• Bảo hành: 8:00 - 17:00\n• Khẩn cấp: 24/7\n\n💬 **Chat online:**\n• Website: 8:00 - 22:00\n• Facebook: 8:00 - 22:00\n• Zalo: 24/7 (bot + nhân viên)"
      }
    };

    return responses[topicKey]?.[optionKey] || "Xin lỗi, thông tin này hiện chưa có sẵn. Vui lòng liên hệ hotline 1900-8888 để được hỗ trợ chi tiết.";
  };

  // Quay lại menu chính
  const handleBackToMainMenu = () => {
    setShowSubMenu(false);
    setCurrentTopic(null);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getCurrentUserId = () => {
    return localStorage.getItem('userId');
  };

  // Kiểm tra xem có thể gửi tin nhắn không
  const canSendMessage = () => {
    if (isLoggedIn && chatMode === 'direct') {
      // User đã đăng nhập và chọn chế độ direct - cần WebSocket và conversation chưa đóng
      return isConnected && conversation?.status !== 'CLOSED';
    } else if (isLoggedIn && chatMode === 'auto') {
      // User đã đăng nhập nhưng chọn chế độ auto - không cho gửi tin nhắn text
      return false;
    } else if (!isLoggedIn && chatMode === 'auto') {
      // Anonymous user chọn chế độ auto - không cho gửi tin nhắn text
      return false;
    } else if (!isLoggedIn && chatMode === 'direct') {
      // Anonymous user chọn chế độ direct - yêu cầu đăng nhập
      return false;
    }
    return false;
  };

  // Xử lý popup
  const handlePopupClose = () => {
    setPopup({ show: false, type: 'info', title: '', message: '' });
  };

  const handlePopupConfirm = () => {
    if (popup.title === 'Yêu cầu đăng nhập') {
      // Đóng chat và redirect đến trang đăng nhập
      onClose();
      window.location.href = '/login';
    }
    handlePopupClose();
  };

  const handlePopupCancel = () => {
    handlePopupClose();
  };

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className={`chat-status ${canSendMessage() ? '' : 'offline'}`}></div>
          <div>
            <h3 className="chat-header-title">
              Hỗ trợ VTX STORE
              {chatMode === 'auto' && (
                <span className="chat-mode-badge">🤖 Tự động</span>
              )}
              {chatMode === 'direct' && (
                <span className="chat-mode-badge">👤 Trực tiếp</span>
              )}
            </h3>
            <p className="chat-header-subtitle">
              {chatMode === 'auto' 
                ? 'Chọn chủ đề từ menu bên dưới'
                : chatMode === 'direct'
                  ? (isLoggedIn 
                      ? (conversation?.status === 'PENDING'
                          ? '🔄 Đang chờ nhân viên kết nối...'
                          : conversation?.status === 'OPEN'
                            ? '✅ Đã kết nối với nhân viên'
                            : conversation?.status === 'CLOSED'
                              ? '❌ Cuộc hội thoại đã kết thúc'
                              : (isConnected ? 'Đang trực tuyến' : 'Mất kết nối')
                        )
                      : 'Yêu cầu đăng nhập để chat trực tiếp'
                    )
                  : 'Chọn cách thức hỗ trợ'
              }
            </p>
          </div>
        </div>
        <button className="chat-close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {loading ? (
          <div className="chat-loading">
            <i className="fas fa-spinner fa-spin"></i>
            <span style={{ marginLeft: '8px' }}>Đang tải tin nhắn...</span>
          </div>
        ) : (
          <>
            {/* Chat Mode Selection */}
            {showChatModeSelection && (
              <div className="chat-mode-selection">
                <div className="welcome-message">
                  <h4>👋 Chào mừng bạn đến với VTX STORE!</h4>
                  <p>Bạn muốn được hỗ trợ như thế nào?</p>
                </div>
                
                <div className="chat-mode-options">
                  <button 
                    className="chat-mode-option auto"
                    onClick={() => handleChatModeSelection('auto')}
                  >
                    <div className="mode-icon">🤖</div>
                    <div className="mode-content">
                      <h4>Hỗ trợ tự động</h4>
                      <p>Chọn chủ đề từ menu có sẵn, nhận thông tin chi tiết ngay lập tức</p>
                    </div>
                  </button>
                  
                  <button 
                    className="chat-mode-option direct"
                    onClick={() => handleChatModeSelection('direct')}
                  >
                    <div className="mode-icon">👤</div>
                    <div className="mode-content">
                      <h4>Chat trực tiếp</h4>
                      <p>
                        {isLoggedIn 
                          ? 'Kết nối với nhân viên hỗ trợ để được tư vấn chi tiết'
                          : 'Kết nối với nhân viên hỗ trợ (Yêu cầu đăng nhập)'
                        }
                      </p>
                    </div>
                  </button>
                </div>
                
                <div className="chat-mode-note">
                  <p>💡 Bạn có thể chuyển đổi giữa các chế độ bất kỳ lúc nào</p>
                </div>
              </div>
            )}

            {/* Regular Messages */}
            {!showChatModeSelection && messages.length === 0 && (
              <div className="welcome-message">
                <h4>Chào mừng bạn đến với VTX STORE!</h4>
                <p>Chúng tôi sẵn sàng hỗ trợ bạn. Hãy nhắn tin cho chúng tôi nhé!</p>
              </div>
            )}

            {/* Hiển thị tất cả tin nhắn */}
            {messages.length > 0 && (
              messages.map((message) => {
                // Lấy ID user hiện tại
                const currentUserId = localStorage.getItem('userId');
                
                // Kiểm tra xem có phải tin nhắn hệ thống không
                const isSystemMessage = message.senderName === "Hệ thống" || 
                                       message.senderName === "system@vtxstore.com" ||
                                       (message.content && (
                                         message.content.includes("Cuộc hội thoại đã được đóng") || 
                                         message.content.includes("THÔNG BÁO")
                                       ));
                
                // Xác định tin nhắn của user hiện tại
                const isOwnMessage = !isSystemMessage && (message.senderId == currentUserId);
                const isAdminMessage = !isSystemMessage && message.isFromAdmin;
                
                // Xác định class cho styling: user messages bên phải, admin bên trái
                let messageClass = 'bot'; // default
                if (isSystemMessage) {
                  messageClass = 'system';
                } else if (isOwnMessage) {
                  messageClass = 'own'; // Tin nhắn của user hiện tại - bên phải (CSS sử dụng 'own')
                } else if (isAdminMessage) {
                  messageClass = 'admin'; // Tin nhắn từ admin - bên trái
                }
                
                return (
                  <div 
                    key={message.id} 
                    className={`chat-message ${messageClass}`}
                  >
                    <div className="message-content">
                      {message.content}
                      <div className="message-time">
                        {formatTime(message.sentAt)}
                        {message.isBotResponse && <span className="bot-tag">🤖 Bot</span>}
                        {(message.messageType === 'SYSTEM' || isSystemMessage) && <span className="system-tag">📢 Hệ thống</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Main Menu - luôn hiển thị ở cuối khi ở chế độ auto */}
            {chatMode === 'auto' && !showChatModeSelection && !showSubMenu && (
              <div className="topic-menu-container">
                <div className="topic-menu-header">
                  <h4>🤖 Chọn chủ đề bạn quan tâm</h4>
                  <p>VTX STORE - Hỗ trợ tự động 24/7</p>
                </div>
                
                <div className="topic-grid">
                  {Object.entries(topics).map(([key, topic]) => (
                    <button
                      key={key}
                      className={`topic-btn ${topic.color}`}
                      onClick={() => handleTopicSelect(key)}
                      disabled={sending}
                    >
                      <div className="topic-icon">{topic.icon}</div>
                      <div className="topic-content">
                        <span className="topic-title">{topic.title}</span>
                        <span className="topic-desc">{topic.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="topic-menu-footer">
                  <p>💬 Hoặc <strong>chuyển sang chế độ chat trực tiếp</strong> để tư vấn chi tiết</p>
                </div>
              </div>
            )}

            {/* Sub Menu - chỉ hiện khi chọn chế độ auto */}
            {showSubMenu && currentTopic && chatMode === 'auto' && (
              <div className="submenu-container">
                <div className="submenu-header">
                  <button className="back-btn" onClick={handleBackToMainMenu}>
                    ← Quay lại
                  </button>
                  <h4>{topics[currentTopic].icon} {topics[currentTopic].title}</h4>
                  <p>Chọn thông tin chi tiết:</p>
                </div>
                
                <div className="submenu-options">
                  {topics[currentTopic].options.map((option) => (
                    <button
                      key={option.key}
                      className={`submenu-option ${topics[currentTopic].color}`}
                      onClick={() => handleOptionSelect(currentTopic, option.key)}
                      disabled={sending}
                    >
                      <div className="option-content">
                        <span className="option-title">{option.title}</span>
                        <span className="option-desc">{option.desc}</span>
                      </div>
                      <div className="option-arrow">→</div>
                    </button>
                  ))}
                </div>
                
                <div className="submenu-footer">
                  <button className="back-to-main-btn" onClick={handleBackToMainMenu}>
                    🏠 Menu chính
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Mode Switch */}
      {!showChatModeSelection && chatMode && (
        <div className="chat-mode-switch">
          <button 
            className={`mode-switch-btn ${chatMode === 'auto' ? 'active' : ''}`}
            onClick={() => handleChatModeSelection('auto')}
            disabled={sending}
          >
            🤖 Tự động
          </button>
          <button 
            className={`mode-switch-btn ${chatMode === 'direct' ? 'active' : ''}`}
            onClick={() => handleChatModeSelection('direct')}
            disabled={sending}
          >
            👤 Chat trực tiếp
          </button>
        </div>
      )}

      {/* Input */}
      <div className="chat-input-container">
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder={
              showChatModeSelection 
                ? "Vui lòng chọn chế độ hỗ trợ ở trên..."
                : chatMode === 'auto'
                  ? "Vui lòng chọn từ menu ở trên..."
                  : chatMode === 'direct'
                    ? (isLoggedIn 
                        ? (conversation?.status === 'CLOSED' 
                            ? "Cuộc hội thoại đã kết thúc - vui lòng tạo mới"
                            : "Nhập tin nhắn..."
                          )
                        : "Vui lòng đăng nhập để chat trực tiếp..."
                      )
                    : "Nhập tin nhắn..."
            }
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={1}
            disabled={sending || !canSendMessage() || showChatModeSelection}
          />
          <button 
            type="submit" 
            className="chat-send-btn"
            disabled={!newMessage.trim() || sending || !canSendMessage() || showChatModeSelection}
          >
            {sending ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-paper-plane"></i>
            )}
          </button>
        </form>
      </div>

      {/* Popup */}
      <ChatPopup
        show={popup.show}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onConfirm={handlePopupConfirm}
        onCancel={handlePopupCancel}
        onClose={handlePopupClose}
      />
    </div>
  );
};

export default ChatWindow; 