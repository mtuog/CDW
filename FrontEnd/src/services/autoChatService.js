import chatService from './chatService';

class AutoChatService {
  constructor() {
    this.menuStructure = {
      welcome: {
        id: 'welcome',
        type: 'menu',
        title: 'Chào mừng bạn đến với VTX Store! 👋',
        message: 'Tôi là trợ lý ảo của VTX Store. Tôi có thể giúp bạn:',
        options: [
          { id: 'products', label: '🛍️ Sản phẩm & Danh mục', emoji: '🛍️' },
          { id: 'orders', label: '📦 Đơn hàng & Vận chuyển', emoji: '📦' },
          { id: 'account', label: '👤 Tài khoản & Bảo mật', emoji: '👤' },
          { id: 'payment', label: '💳 Thanh toán & Khuyến mãi', emoji: '💳' },
          { id: 'support', label: '🎧 Hỗ trợ kỹ thuật', emoji: '🎧' },
          { id: 'contact', label: '📞 Liên hệ nhân viên', emoji: '📞' }
        ]
      },

      // LEVEL 1: Products
      products: {
        id: 'products',
        type: 'menu',
        title: '🛍️ Sản phẩm & Danh mục',
        message: 'Bạn cần hỗ trợ gì về sản phẩm?',
        options: [
          { id: 'product_search', label: '🔍 Tìm kiếm sản phẩm', emoji: '🔍' },
          { id: 'product_info', label: 'ℹ️ Thông tin chi tiết sản phẩm', emoji: 'ℹ️' },
          { id: 'size_guide', label: '📏 Hướng dẫn chọn size', emoji: '📏' },
          { id: 'product_compare', label: '⚖️ So sánh sản phẩm', emoji: '⚖️' },
          { id: 'back_main', label: '⬅️ Quay lại menu chính', emoji: '⬅️' }
        ]
      },

      // LEVEL 1: Orders  
      orders: {
        id: 'orders',
        type: 'menu',
        title: '📦 Đơn hàng & Vận chuyển',
        message: 'Bạn cần hỗ trợ gì về đơn hàng?',
        options: [
          { id: 'order_status', label: '📋 Kiểm tra trạng thái đơn hàng', emoji: '📋' },
          { id: 'order_cancel', label: '❌ Hủy/Thay đổi đơn hàng', emoji: '❌' },
          { id: 'shipping_info', label: '🚚 Thông tin vận chuyển', emoji: '🚚' },
          { id: 'return_policy', label: '↩️ Chính sách đổi trả', emoji: '↩️' },
          { id: 'back_main', label: '⬅️ Quay lại menu chính', emoji: '⬅️' }
        ]
      },

      // LEVEL 1: Account
      account: {
        id: 'account',
        type: 'menu', 
        title: '👤 Tài khoản & Bảo mật',
        message: 'Bạn cần hỗ trợ gì về tài khoản?',
        options: [
          { id: 'login_help', label: '🔐 Hỗ trợ đăng nhập', emoji: '🔐' },
          { id: 'password_reset', label: '🔑 Đặt lại mật khẩu', emoji: '🔑' },
          { id: 'profile_update', label: '✏️ Cập nhật thông tin', emoji: '✏️' },
          { id: 'security_tips', label: '🛡️ Bảo mật tài khoản', emoji: '🛡️' },
          { id: 'back_main', label: '⬅️ Quay lại menu chính', emoji: '⬅️' }
        ]
      },

      // LEVEL 1: Payment
      payment: {
        id: 'payment',
        type: 'menu',
        title: '💳 Thanh toán & Khuyến mãi',
        message: 'Bạn cần hỗ trợ gì về thanh toán?',
        options: [
          { id: 'payment_methods', label: '💰 Phương thức thanh toán', emoji: '💰' },
          { id: 'payment_issues', label: '⚠️ Lỗi thanh toán', emoji: '⚠️' },
          { id: 'promotions', label: '🎁 Mã giảm giá & Khuyến mãi', emoji: '🎁' },
          { id: 'refund_policy', label: '💸 Chính sách hoàn tiền', emoji: '💸' },
          { id: 'back_main', label: '⬅️ Quay lại menu chính', emoji: '⬅️' }
        ]
      },

      // LEVEL 1: Support
      support: {
        id: 'support',
        type: 'menu',
        title: '🎧 Hỗ trợ kỹ thuật',
        message: 'Bạn gặp vấn đề kỹ thuật nào?',
        options: [
          { id: 'website_issues', label: '🌐 Lỗi website/ứng dụng', emoji: '🌐' },
          { id: 'mobile_app', label: '📱 Ứng dụng di động', emoji: '📱' },
          { id: 'browser_help', label: '🔧 Hỗ trợ trình duyệt', emoji: '🔧' },
          { id: 'technical_faq', label: '❓ Câu hỏi kỹ thuật thường gặp', emoji: '❓' },
          { id: 'back_main', label: '⬅️ Quay lại menu chính', emoji: '⬅️' }
        ]
      },

      // LEVEL 2: Detailed responses
      product_search: {
        id: 'product_search',
        type: 'info',
        title: '🔍 Cách tìm kiếm sản phẩm',
        message: `Để tìm kiếm sản phẩm hiệu quả:

🔸 **Sử dụng thanh tìm kiếm**: Nhập tên sản phẩm, thương hiệu hoặc từ khóa
🔸 **Lọc theo danh mục**: Chọn danh mục phù hợp từ menu
🔸 **Sử dụng bộ lọc**: Lọc theo giá, màu sắc, kích cỡ, thương hiệu
🔸 **Sắp xếp kết quả**: Theo giá, độ phổ biến, đánh giá

💡 **Mẹo**: Sử dụng từ khóa cụ thể sẽ cho kết quả chính xác hơn!`,
        options: [
          { id: 'products', label: '⬅️ Quay lại menu sản phẩm', emoji: '⬅️' },
          { id: 'contact', label: '📞 Liên hệ nhân viên', emoji: '📞' }
        ]
      },

      size_guide: {
        id: 'size_guide',
        type: 'info',
        title: '📏 Hướng dẫn chọn size',
        message: `Để chọn size phù hợp:

👕 **Quần áo**:
• Đo số đo 3 vòng: Ngực - Eo - Mông
• Tham khảo bảng size của từng thương hiệu
• Đọc review về size từ khách hàng khác

👟 **Giày dép**:
• Đo chiều dài bàn chân (cm)
• Chọn size lớn hơn 0.5-1cm so với số đo
• Lưu ý form giày: ôm hay rộng

📐 **Bảng size chi tiết** có trong mỗi sản phẩm, bạn kéo xuống phần mô tả để xem nhé!`,
        options: [
          { id: 'products', label: '⬅️ Quay lại menu sản phẩm', emoji: '⬅️' },
          { id: 'contact', label: '📞 Liên hệ nhân viên', emoji: '📞' }
        ]
      },

      order_status: {
        id: 'order_status',
        type: 'info',
        title: '📋 Kiểm tra trạng thái đơn hàng',
        message: `Để kiểm tra đơn hàng của bạn:

🔐 **Đã đăng nhập**:
• Vào "Tài khoản" → "Đơn hàng của tôi"
• Xem chi tiết từng đơn và trạng thái

📧 **Chưa có tài khoản**:
• Kiểm tra email xác nhận đơn hàng
• Dùng mã đơn hàng để tra cứu

📍 **Các trạng thái đơn hàng**:
• ⏳ Chờ xác nhận
• 📦 Đang chuẩn bị
• 🚚 Đang vận chuyển  
• ✅ Đã giao thành công`,
        options: [
          { id: 'orders', label: '⬅️ Quay lại menu đơn hàng', emoji: '⬅️' },
          { id: 'contact', label: '📞 Liên hệ nhân viên', emoji: '📞' }
        ]
      },

      // Thêm các info responses còn thiếu
      product_info: {
        id: 'product_info',
        type: 'info', 
        title: 'ℹ️ Thông tin chi tiết sản phẩm',
        message: `Để xem thông tin chi tiết sản phẩm:

📝 **Mô tả sản phẩm**:
• Thông tin từ nhà sản xuất
• Chất liệu, xuất xứ
• Hướng dẫn sử dụng, bảo quản

⭐ **Đánh giá khách hàng**:
• Rating và review từ người mua
• Hình ảnh thực tế từ khách hàng
• Chia sẻ kinh nghiệm sử dụng

📊 **Thông số kỹ thuật**:
• Kích thước, trọng lượng
• Tính năng đặc biệt
• Bảo hành, cam kết

💡 **Mẹo**: Cuộn xuống phần mô tả chi tiết của mỗi sản phẩm để xem đầy đủ thông tin!`,
        options: [
          { id: 'products', label: '⬅️ Quay lại menu sản phẩm', emoji: '⬅️' },
          { id: 'contact', label: '📞 Liên hệ nhân viên', emoji: '📞' }
        ]
      },

      product_compare: {
        id: 'product_compare',
        type: 'info',
        title: '⚖️ So sánh sản phẩm',
        message: `Để so sánh các sản phẩm:

🔍 **Chọn sản phẩm**:
• Thêm sản phẩm vào "Danh sách so sánh"
• Tối đa 3-4 sản phẩm cùng lúc
• Chọn sản phẩm cùng loại để so sánh hiệu quả

📋 **Bảng so sánh**:
• So sánh giá, tính năng
• Đánh giá từ khách hàng
• Ưu nhược điểm của từng sản phẩm

✅ **Quyết định**:
• Dựa trên nhu cầu cá nhân
• Cân nhắc ngân sách
• Đọc review chi tiết

💡 **Lưu ý**: Nút "So sánh" xuất hiện khi bạn chọn từ 2 sản phẩm trở lên!`,
        options: [
          { id: 'products', label: '⬅️ Quay lại menu sản phẩm', emoji: '⬅️' },
          { id: 'contact', label: '📞 Liên hệ nhân viên', emoji: '📞' }
        ]
      },

      order_cancel: {
        id: 'order_cancel',
        type: 'info',
        title: '❌ Hủy/Thay đổi đơn hàng',
        message: `Để hủy hoặc thay đổi đơn hàng:

⏰ **Thời gian cho phép**:
• Trong vòng 30 phút sau khi đặt hàng
• Trước khi đơn hàng chuyển sang trạng thái "Đang chuẩn bị"
• Liên hệ hotline nếu quá thời gian

📞 **Cách thực hiện**:
• Vào "Tài khoản" → "Đơn hàng của tôi"
• Chọn đơn hàng cần hủy/sửa
• Hoặc gọi hotline: 1900-xxxx

💰 **Hoàn tiền**:
• Hoàn tiền tự động cho thanh toán online
• 1-3 ngày làm việc
• Không thu phí hủy đơn`,
        options: [
          { id: 'orders', label: '⬅️ Quay lại menu đơn hàng', emoji: '⬅️' },
          { id: 'contact', label: '📞 Liên hệ nhân viên', emoji: '📞' }
        ]
      },

      shipping_info: {
        id: 'shipping_info',
        type: 'info',
        title: '🚚 Thông tin vận chuyển',
        message: `Dịch vụ vận chuyển VTX Store:

🚛 **Đối tác vận chuyển**:
• Giao hàng nhanh: Now, AhaMove
• Giao hàng tiêu chuẩn: GHN, J&T, Viettel Post
• Giao hàng toàn quốc

⏱️ **Thời gian giao hàng**:
• Nội thành TP.HCM, Hà Nội: 1-2 ngày
• Tỉnh thành khác: 2-5 ngày
• Vùng xa: 3-7 ngày

💸 **Phí vận chuyển**:
• MIỄN PHÍ với đơn hàng > 500.000đ
• Phí cố định: 25.000đ - 35.000đ
• Phí COD: 20.000đ (nếu có)`,
        options: [
          { id: 'orders', label: '⬅️ Quay lại menu đơn hàng', emoji: '⬅️' },
          { id: 'contact', label: '📞 Liên hệ nhân viên', emoji: '📞' }
        ]
      },

      return_policy: {
        id: 'return_policy',
        type: 'info',
        title: '↩️ Chính sách đổi trả',
        message: `Chính sách đổi trả VTX Store:

⏰ **Thời gian**:
• Đổi trả trong vòng 7 ngày
• Tính từ ngày nhận hàng
• Không áp dụng cho hàng sale > 50%

✅ **Điều kiện đổi trả**:
• Sản phẩm còn nguyên tem, mác
• Chưa qua sử dụng
• Có hóa đơn mua hàng

🔄 **Quy trình**:
• Liên hệ hotline báo đổi trả
• Đóng gói sản phẩm gửi về
• Kiểm tra và xử lý trong 3-5 ngày

💰 **Chi phí**:
• Lỗi từ shop: Miễn phí
• Đổi ý: Khách hàng chịu phí ship`,
        options: [
          { id: 'orders', label: '⬅️ Quay lại menu đơn hàng', emoji: '⬅️' },
          { id: 'contact', label: '📞 Liên hệ nhân viên', emoji: '📞' }
        ]
      },

      payment_methods: {
        id: 'payment_methods',
        type: 'info',
        title: '💰 Phương thức thanh toán',
        message: `VTX Store hỗ trợ các phương thức:

💳 **Thẻ tín dụng/ghi nợ**:
• Visa, Mastercard, JCB
• Thanh toán an toàn với SSL

🏪 **Ví điện tử**:
• MoMo, ZaloPay, VNPay
• ShopeePay, Airpay

🏧 **Chuyển khoản ngân hàng**:
• Hỗ trợ tất cả ngân hàng Việt Nam
• Chuyển khoản nhanh 24/7

💵 **Thanh toán khi nhận hàng (COD)**:
• Áp dụng cho đơn hàng < 2.000.000đ
• Phí COD: 20.000đ`,
        options: [
          { id: 'payment', label: '⬅️ Quay lại menu thanh toán', emoji: '⬅️' },
          { id: 'contact', label: '📞 Liên hệ nhân viên', emoji: '📞' }
        ]
      }
    };
  }

  getWelcomeMessage() {
    return this.menuStructure.welcome;
  }

  processSelection(currentMenuId, selectedOptionId) {
    // Xử lý các action đặc biệt
    if (selectedOptionId === 'back_main') {
      return this.menuStructure.welcome;
    }

    if (selectedOptionId === 'contact') {
      return {
        id: 'contact_agent',
        type: 'transfer',
        title: '📞 Chuyển đến nhân viên hỗ trợ',
        message: 'Đang kết nối bạn với nhân viên hỗ trợ... Vui lòng đợi trong giây lát.',
        options: []
      };
    }

    // Trả về menu/info tương ứng
    return this.menuStructure[selectedOptionId] || this.menuStructure.welcome;
  }

  async sendAutoMessage(conversationId, userSelection) {
    try {
      // Gửi tin nhắn của user trước
      await chatService.sendMessage(conversationId, userSelection);
      
      // Xử lý selection và trả về response
      const response = this.processSelection(null, userSelection);
      
      // Tạo response message
      const responseMessage = {
        content: response.message,
        messageSource: 'CHATBOT',
        quickReplies: response.options?.map(opt => opt.label) || [],
        metadata: {
          menuId: response.id,
          menuType: response.type,
          title: response.title
        }
      };

      return responseMessage;
    } catch (error) {
      console.error('Error in auto chat:', error);
      throw error;
    }
  }

  async initAutoChat(conversationId) {
    try {
      const welcomeMenu = this.getWelcomeMessage();
      
      const welcomeMessage = {
        content: `${welcomeMenu.title}\n\n${welcomeMenu.message}`,
        messageSource: 'CHATBOT',
        quickReplies: welcomeMenu.options.map(opt => opt.label),
        metadata: {
          menuId: welcomeMenu.id,
          menuType: welcomeMenu.type,
          title: welcomeMenu.title
        }
      };

      return welcomeMessage;
    } catch (error) {
      console.error('Error initializing auto chat:', error);
      throw error;
    }
  }
}

export default new AutoChatService(); 