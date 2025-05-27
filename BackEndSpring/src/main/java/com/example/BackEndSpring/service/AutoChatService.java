package com.example.BackEndSpring.service;

import com.example.BackEndSpring.dto.ChatMessageDTO;
import com.example.BackEndSpring.model.ChatConversation;
import com.example.BackEndSpring.model.ChatMessage;
import com.example.BackEndSpring.model.ChatMessage.MessageType;
import com.example.BackEndSpring.model.ChatMessage.MessageSource;
import com.example.BackEndSpring.model.User;
import com.example.BackEndSpring.repository.ChatConversationRepository;
import com.example.BackEndSpring.repository.ChatMessageRepository;
import com.example.BackEndSpring.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class AutoChatService {
    
    @Autowired
    private ChatMessageRepository messageRepository;
    
    @Autowired
    private ChatConversationRepository conversationRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ChatService chatService;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // Predefined auto-chat responses với selection options
    private final Map<String, Map<String, Object>> autoResponses = new HashMap<>();
    
    public AutoChatService() {
        initializeAutoResponses();
    }
    
    private void initializeAutoResponses() {
        // Welcome menu - Main entry point
        Map<String, Object> welcomeMenu = new HashMap<>();
        welcomeMenu.put("message", "🌟 **Chào mừng bạn đến với VTX STORE!**\n\n" +
            "Chúng tôi cung cấp hỗ trợ tự động 24/7. Bạn cần hỗ trợ về:");
        welcomeMenu.put("options", Arrays.asList(
            "🛍️ Sản phẩm & Mua hàng",
            "📦 Đơn hàng của tôi", 
            "💳 Thanh toán & Khuyến mãi",
            "🔄 Đổi trả & Bảo hành",
            "👤 Tài khoản & Thành viên",
            "👨‍💼 Kết nối nhân viên"
        ));
        autoResponses.put("WELCOME", welcomeMenu);
        
        // Product & Shopping
        Map<String, Object> productMenu = new HashMap<>();
        productMenu.put("message", "🛍️ **Sản phẩm & Mua hàng**\n\nBạn cần hỗ trợ gì?");
        productMenu.put("options", Arrays.asList(
            "👕 Tìm sản phẩm",
            "📏 Hướng dẫn chọn size",
            "💰 Giá & Khuyến mãi hiện tại",
            "📱 Cách đặt hàng",
            "🎁 Sản phẩm mới",
            "⬅️ Quay lại menu chính"
        ));
        autoResponses.put("PRODUCT_MENU", productMenu);
        
        // Order Management
        Map<String, Object> orderMenu = new HashMap<>();
        orderMenu.put("message", "📦 **Đơn hàng của tôi**\n\nBạn muốn:");
        orderMenu.put("options", Arrays.asList(
            "🔍 Kiểm tra trạng thái đơn hàng",
            "🚚 Thông tin vận chuyển",
            "📍 Thay đổi địa chỉ giao hàng",
            "❌ Hủy đơn hàng",
            "📞 Liên hệ shipper",
            "⬅️ Quay lại menu chính"
        ));
        autoResponses.put("ORDER_MENU", orderMenu);
        
        // Payment & Promotions
        Map<String, Object> paymentMenu = new HashMap<>();
        paymentMenu.put("message", "💳 **Thanh toán & Khuyến mãi**\n\nChọn vấn đề cần hỗ trợ:");
        paymentMenu.put("options", Arrays.asList(
            "💳 Phương thức thanh toán",
            "🎫 Mã giảm giá",
            "❓ Lỗi thanh toán",
            "💰 Chính sách hoàn tiền",
            "🧾 Hóa đơn VAT",
            "⬅️ Quay lại menu chính"
        ));
        autoResponses.put("PAYMENT_MENU", paymentMenu);
        
        // Return & Warranty
        Map<String, Object> returnMenu = new HashMap<>();
        returnMenu.put("message", "🔄 **Đổi trả & Bảo hành**\n\nBạn cần:");
        returnMenu.put("options", Arrays.asList(
            "📋 Quy trình đổi hàng",
            "↩️ Quy trình trả hàng",
            "🛡️ Chính sách bảo hành",
            "⏰ Thời hạn đổi trả",
            "📞 Tạo yêu cầu đổi trả",
            "⬅️ Quay lại menu chính"
        ));
        autoResponses.put("RETURN_MENU", returnMenu);
        
        // Account & Membership
        Map<String, Object> accountMenu = new HashMap<>();
        accountMenu.put("message", "👤 **Tài khoản & Thành viên**\n\nChọn hỗ trợ:");
        accountMenu.put("options", Arrays.asList(
            "🔑 Đăng nhập/Đăng ký",
            "🔒 Quên mật khẩu",
            "📝 Cập nhật thông tin",
            "🎁 Điểm tích lũy & Ưu đãi",
            "⭐ Chương trình thành viên",
            "⬅️ Quay lại menu chính"
        ));
        autoResponses.put("ACCOUNT_MENU", accountMenu);
        
        // Detailed responses
        addDetailedAutoResponses();
    }
    
    private void addDetailedAutoResponses() {
        // Size guide
        Map<String, Object> sizeGuide = new HashMap<>();
        sizeGuide.put("message", "📏 **Hướng dẫn chọn size**\n\n" +
            "**QUẦN ÁO:**\n" +
            "• Size S: Ngực 80-84cm | Eo 60-64cm\n" +
            "• Size M: Ngực 84-88cm | Eo 64-68cm\n" +
            "• Size L: Ngực 88-92cm | Eo 68-72cm\n" +
            "• Size XL: Ngực 92-96cm | Eo 72-76cm\n\n" +
            "**GIÀY:**\n" +
            "• Size 38: 24cm | Size 39: 24.5cm\n" +
            "• Size 40: 25cm | Size 41: 25.5cm\n" +
            "• Size 42: 26cm | Size 43: 26.5cm\n\n" +
            "💡 **Lưu ý:** Đo vào buổi chiều để có kích thước chính xác nhất!");
        sizeGuide.put("options", Arrays.asList(
            "📐 Cách đo size chính xác",
            "🛍️ Xem bảng size chi tiết",
            "👕 Quay lại sản phẩm",
            "⬅️ Menu chính"
        ));
        autoResponses.put("SIZE_GUIDE", sizeGuide);
        
        // Shipping info
        Map<String, Object> shippingInfo = new HashMap<>();
        shippingInfo.put("message", "🚚 **Thông tin vận chuyển**\n\n" +
            "**THỜI GIAN GIAO HÀNG:**\n" +
            "• Nội thành HN/HCM: 1-2 ngày\n" +
            "• Ngoại thành: 2-3 ngày\n" +
            "• Tỉnh khác: 3-5 ngày\n\n" +
            "**PHÍ SHIP:**\n" +
            "• Đơn < 300k: 30k\n" +
            "• Đơn ≥ 300k: MIỄN PHÍ\n" +
            "• Giao nhanh (trong ngày): +20k\n\n" +
            "**ĐỐI TÁC VẬN CHUYỂN:**\n" +
            "Giao Hàng Nhanh, Giao Hàng Tiết Kiệm, VNPost");
        shippingInfo.put("options", Arrays.asList(
            "📋 Tra cứu đơn hàng",
            "📞 Liên hệ shipper",
            "📦 Quay lại đơn hàng",
            "⬅️ Menu chính"
        ));
        autoResponses.put("SHIPPING_INFO", shippingInfo);
        
        // Payment methods
        Map<String, Object> paymentMethods = new HashMap<>();
        paymentMethods.put("message", "💳 **Phương thức thanh toán**\n\n" +
            "**THANH TOÁN ONLINE:**\n" +
            "• VNPay: Visa, MasterCard, JCB\n" +
            "• ATM nội địa: Vietcombank, Techcombank...\n" +
            "• Ví điện tử: MoMo, ZaloPay\n" +
            "• Chuyển khoản ngân hàng\n\n" +
            "**THANH TOÁN KHI NHẬN HÀNG:**\n" +
            "• COD (Cash on Delivery)\n" +
            "• Áp dụng toàn quốc\n\n" +
            "🎁 **ƯU ĐÃI:** Giảm thêm 2% khi thanh toán online!");
        paymentMethods.put("options", Arrays.asList(
            "❓ Hỗ trợ lỗi thanh toán",
            "🎫 Cách sử dụng mã giảm giá",
            "💳 Quay lại thanh toán",
            "⬅️ Menu chính"
        ));
        autoResponses.put("PAYMENT_METHODS", paymentMethods);
        
        // Return policy
        Map<String, Object> returnPolicy = new HashMap<>();
        returnPolicy.put("message", "🔄 **Chính sách đổi trả**\n\n" +
            "**THỜI GIAN:**\n" +
            "• Đổi hàng: 7 ngày kể từ ngày nhận\n" +
            "• Trả hàng: 3 ngày kể từ ngày nhận\n\n" +
            "**ĐIỀU KIỆN:**\n" +
            "• Hàng còn nguyên tem, nhãn mác\n" +
            "• Chưa qua sử dụng, giặt ủi\n" +
            "• Có hóa đơn mua hàng\n\n" +
            "**PHÍ DỊCH VỤ:**\n" +
            "• Lỗi từ shop: MIỄN PHÍ\n" +
            "• Đổi ý: 20k/lần\n\n" +
            "📞 **Hotline:** 1900-2024 (8h-22h)");
        returnPolicy.put("options", Arrays.asList(
            "📋 Tạo yêu cầu đổi/trả",
            "📞 Gọi hotline",
            "🔄 Quay lại đổi trả",
            "⬅️ Menu chính"
        ));
        autoResponses.put("RETURN_POLICY", returnPolicy);
        
        // Login help
        Map<String, Object> loginHelp = new HashMap<>();
        loginHelp.put("message", "🔑 **Hỗ trợ đăng nhập**\n\n" +
            "**ĐĂNG NHẬP:**\n" +
            "• Sử dụng Email hoặc SĐT\n" +
            "• Mật khẩu phải có ít nhất 6 ký tự\n\n" +
            "**QUÊN MẬT KHẨU:**\n" +
            "• Click 'Quên mật khẩu' tại trang đăng nhập\n" +
            "• Nhập email đăng ký\n" +
            "• Kiểm tra email và làm theo hướng dẫn\n\n" +
            "**ĐĂNG KÝ MỚI:**\n" +
            "• Click 'Đăng ký' tại trang chủ\n" +
            "• Điền đầy đủ thông tin\n" +
            "• Xác thực qua email\n\n" +
            "🎁 **ƯU ĐÃI:** Giảm 15% đơn hàng đầu tiên cho thành viên mới!");
        loginHelp.put("options", Arrays.asList(
            "🔒 Hướng dẫn reset mật khẩu",
            "📞 Liên hệ hỗ trợ",
            "👤 Quay lại tài khoản",
            "⬅️ Menu chính"
        ));
        autoResponses.put("LOGIN_HELP", loginHelp);
    }
    
    /**
     * Xử lý tin nhắn user và trả về response tự động với selection options
     */
    public ChatMessageDTO processAutoMessage(Long conversationId, String userSelection) {
        try {
            ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
            
            User autoUser = getAutoUser();
            
            // Determine response based on user selection
            String responseKey = determineResponseKey(userSelection);
            Map<String, Object> response = autoResponses.get(responseKey);
            
            if (response == null) {
                response = autoResponses.get("WELCOME");
            }
            
            // Create auto response message
            ChatMessage autoMessage = new ChatMessage();
            autoMessage.setConversation(conversation);
            autoMessage.setSender(autoUser);
            autoMessage.setContent((String) response.get("message"));
            autoMessage.setType(MessageType.CHATBOT_RESPONSE);
            autoMessage.setMessageSource(MessageSource.CHATBOT);
            autoMessage.setSentAt(LocalDateTime.now());
            
            // Set selection options
            @SuppressWarnings("unchecked")
            List<String> options = (List<String>) response.get("options");
            if (options != null && !options.isEmpty()) {
                autoMessage.setQuickReplies(objectMapper.writeValueAsString(options));
            }
            
            // Save message
            autoMessage = messageRepository.save(autoMessage);
            
            // Convert to DTO (auto messages are not from admin context)
            return chatService.convertToMessageDTO(autoMessage, false);
            
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error processing auto response: " + e.getMessage());
        }
    }
    
    /**
     * Determine response key based on user selection
     */
    private String determineResponseKey(String userSelection) {
        String selection = userSelection.toLowerCase().trim();
        
        // Main menu selections
        if (selection.contains("sản phẩm") || selection.contains("mua hàng") || selection.contains("🛍️")) {
            return "PRODUCT_MENU";
        } else if (selection.contains("đơn hàng") || selection.contains("📦")) {
            return "ORDER_MENU";
        } else if (selection.contains("thanh toán") || selection.contains("khuyến mãi") || selection.contains("💳")) {
            return "PAYMENT_MENU";
        } else if (selection.contains("đổi trả") || selection.contains("bảo hành") || selection.contains("🔄")) {
            return "RETURN_MENU";
        } else if (selection.contains("tài khoản") || selection.contains("thành viên") || selection.contains("👤")) {
            return "ACCOUNT_MENU";
        } else if (selection.contains("kết nối nhân viên") || selection.contains("👨‍💼")) {
            return "TRANSFER_TO_AGENT";
        }
        
        // Detailed selections
        else if (selection.contains("chọn size") || selection.contains("📏")) {
            return "SIZE_GUIDE";
        } else if (selection.contains("vận chuyển") || selection.contains("🚚")) {
            return "SHIPPING_INFO";
        } else if (selection.contains("phương thức thanh toán") || selection.contains("💳")) {
            return "PAYMENT_METHODS";
        } else if (selection.contains("chính sách") || selection.contains("quy trình")) {
            return "RETURN_POLICY";
        } else if (selection.contains("đăng nhập") || selection.contains("🔑")) {
            return "LOGIN_HELP";
        } else if (selection.contains("quay lại menu chính") || selection.contains("⬅️")) {
            return "WELCOME";
        }
        
        // Default to welcome menu
        return "WELCOME";
    }
    
    /**
     * Get auto system user
     */
    private User getAutoUser() {
        return userRepository.findByEmail("autochat@vtxstore.com")
            .orElseGet(() -> {
                User autoUser = new User();
                autoUser.setUsername("VTX Hỗ Trợ Tự Động");
                autoUser.setEmail("autochat@vtxstore.com");
                autoUser.setPassword("N/A");
                autoUser.setEnabled(true);
                return userRepository.save(autoUser);
            });
    }
    
    /**
     * Check if user wants to transfer to human agent
     */
    public boolean shouldTransferToAgent(String userSelection) {
        return userSelection.toLowerCase().contains("kết nối nhân viên") || 
               userSelection.toLowerCase().contains("nhân viên") ||
               userSelection.toLowerCase().contains("chat trực tiếp") ||
               userSelection.toLowerCase().contains("hỗ trợ trực tiếp");
    }
    
    /**
     * Get welcome message để bắt đầu auto chat
     */
    public ChatMessageDTO getWelcomeMessage(Long conversationId) {
        return processAutoMessage(conversationId, "welcome");
    }
} 