package com.example.BackEndSpring.service;

import com.example.BackEndSpring.dto.ChatConversationDTO;
import com.example.BackEndSpring.dto.ChatMessageDTO;
import com.example.BackEndSpring.model.ChatConversation;
import com.example.BackEndSpring.model.ChatConversation.ConversationStatus;
import com.example.BackEndSpring.model.ChatMessage;
import com.example.BackEndSpring.model.Role;
import com.example.BackEndSpring.model.User;
import com.example.BackEndSpring.repository.ChatConversationRepository;
import com.example.BackEndSpring.repository.ChatMessageRepository;
import com.example.BackEndSpring.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ChatService {
    
    @Autowired
    private ChatConversationRepository conversationRepository;
    
    @Autowired
    private ChatMessageRepository messageRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    /**
     * Tạo cuộc hội thoại mới hoặc lấy cuộc hội thoại hiện có
     */
    public ChatConversationDTO createOrGetConversation(Long userId, String subject) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Live Support: User chỉ có thể có 1 conversation PENDING hoặc OPEN tại 1 thời điểm
        Optional<ChatConversation> pendingConversation = 
            conversationRepository.findByUserAndStatus(user, ConversationStatus.PENDING);
        
        Optional<ChatConversation> openConversation = 
            conversationRepository.findByUserAndStatus(user, ConversationStatus.OPEN);
        
        ChatConversation conversation;
        
        if (openConversation.isPresent()) {
            // User đã có conversation đang OPEN - return existing
            conversation = openConversation.get();
        } else if (pendingConversation.isPresent()) {
            // User đã có conversation đang PENDING - return existing
            conversation = pendingConversation.get();
            // Cập nhật subject nếu có
            if (subject != null && !subject.trim().isEmpty()) {
                conversation.setSubject(subject);
                conversation = conversationRepository.save(conversation);
            }
        } else {
            // Tạo conversation mới với trạng thái PENDING (chờ admin)
            conversation = new ChatConversation(user, subject);
            conversation.setStatus(ConversationStatus.PENDING);
            conversation = conversationRepository.save(conversation);
            
            // KHÔNG gửi tin nhắn chào mừng tự động nữa
            // User sẽ gửi tin nhắn đầu tiên khi sẵn sàng
            
            // Thông báo cho admin có yêu cầu hỗ trợ mới
            notifyAdminsNewConversation(conversation);
        }
        
        return convertToConversationDTO(conversation);
    }
    
    /**
     * Gửi tin nhắn
     */
    public ChatMessageDTO sendMessage(Long conversationId, Long senderId, String content) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new RuntimeException("Conversation not found"));
        
        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Debug log
        System.out.println("🔍 ChatService.sendMessage:");
        System.out.println("   - Conversation ID: " + conversationId);
        System.out.println("   - Sender ID: " + senderId);
        System.out.println("   - Sender name: " + sender.getUsername());
        System.out.println("   - Sender roles: " + sender.getRoles().stream()
            .map(role -> role.getName()).reduce("", (a, b) -> a + "," + b));
        
        boolean isFromAdmin = isUserAdmin(sender);
        System.out.println("   - Is from admin: " + isFromAdmin);
        System.out.println("   - Conversation status: " + conversation.getStatus());
        
        // Kiểm tra trạng thái conversation - Không cho phép gửi tin nhắn trong conversation đã đóng
        if (conversation.getStatus() == ConversationStatus.CLOSED) {
            throw new RuntimeException("Conversation is closed. Please create a new conversation for further support.");
        }
        
        // LIVE SUPPORT RULE: User không thể gửi tin nhắn khi PENDING (chưa có admin)
        if (!isFromAdmin && conversation.getStatus() == ConversationStatus.PENDING) {
            throw new RuntimeException("Please wait for an agent to be connected. Your conversation is in queue.");
        }
        
        // LIVE SUPPORT RULE: Chỉ admin mới có thể chuyển PENDING → OPEN bằng cách ASSIGN conversation
        ConversationStatus currentStatus = conversation.getStatus();
        
        // Tạo tin nhắn mới
        ChatMessage message = new ChatMessage(conversation, sender, content);
        message = messageRepository.save(message);
        
        // Cập nhật thời gian tin nhắn cuối của cuộc hội thoại
        conversation.setLastMessageAt(LocalDateTime.now());
        
        // KHÔNG TỰ ĐỘNG chuyển trạng thái từ PENDING → OPEN khi gửi tin nhắn
        // Trạng thái chỉ thay đổi khi admin ASSIGN conversation thông qua assignAdminToConversation()
        System.out.println("   - Message sent, conversation status remains: " + currentStatus);
        
        // Cập nhật unread count
        if (isFromAdmin) {
            conversation.incrementUnreadCountUser();
        } else {
            conversation.incrementUnreadCountAdmin();
        }
        
        conversationRepository.save(conversation);
        
        // Gửi tin nhắn real-time
        ChatMessageDTO messageDTO = convertToMessageDTO(message);
        sendRealTimeMessage(messageDTO, isFromAdmin);
        
        return messageDTO;
    }
    
    /**
     * Lấy conversation ACTIVE của user (PENDING hoặc OPEN) - Live Support chỉ có 1
     */
    public ChatConversationDTO getUserActiveConversation(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Live Support: User chỉ có thể xem conversation đang ACTIVE
        Optional<ChatConversation> activeConversation = 
            conversationRepository.findByUserAndStatus(user, ConversationStatus.OPEN);
        
        if (activeConversation.isEmpty()) {
            activeConversation = conversationRepository.findByUserAndStatus(user, ConversationStatus.PENDING);
        }
        
        return activeConversation.map(this::convertToConversationDTO).orElse(null);
    }
    
    /**
     * Lấy danh sách cuộc hội thoại của user (deprecated - chỉ dùng cho admin)
     */
    @Deprecated
    public List<ChatConversationDTO> getUserConversations(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<ChatConversation> conversations = conversationRepository.findByUserOrderByLastMessageAtDesc(user);
        return conversations.stream()
            .map(this::convertToConversationDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Lấy danh sách cuộc hội thoại cho admin
     */
    public Page<ChatConversationDTO> getAdminConversations(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ChatConversation> conversations = conversationRepository.findAllOrderByLastMessageAtDesc(pageable);
        
        return conversations.map(this::convertToConversationDTO);
    }
    
    /**
     * Lấy cuộc hội thoại chờ xử lý
     */
    public List<ChatConversationDTO> getPendingConversations() {
        List<ChatConversation> conversations = 
            conversationRepository.findByStatusAndAdminIsNullOrderByCreatedAtAsc(ConversationStatus.PENDING);
        
        return conversations.stream()
            .map(this::convertToConversationDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Gán admin xử lý cuộc hội thoại
     */
    public ChatConversationDTO assignAdminToConversation(Long conversationId, Long adminId) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new RuntimeException("Conversation not found"));
        
        User admin = userRepository.findById(adminId)
            .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        if (!isUserAdmin(admin)) {
            throw new RuntimeException("User is not an admin");
        }
        
        // LIVE SUPPORT RULE: Admin chỉ được handle 1 conversation active tại một thời điểm
        Optional<ChatConversation> adminActiveConversation = conversationRepository.findByAdminAndStatus(admin, ConversationStatus.OPEN);
        if (adminActiveConversation.isPresent() && !adminActiveConversation.get().getId().equals(conversationId)) {
            throw new RuntimeException("Admin is already handling another active conversation. Please finish the current conversation first.");
        }
        
        // Lưu admin cũ để so sánh
        User previousAdmin = conversation.getAdmin();
        
        conversation.setAdmin(admin);
        conversation.setStatus(ConversationStatus.OPEN);
        conversation = conversationRepository.save(conversation);
        
        // Tạo tin nhắn thông báo admin assignment
        String adminName = admin.getFullName() != null ? admin.getFullName() : admin.getUsername();
        String notificationContent;
        
        if (previousAdmin == null) {
            // Admin đầu tiên nhận cuộc hội thoại
            notificationContent = String.format(
                "👤 %s đã được kết nối để hỗ trợ bạn.\n\nXin chào! Tôi có thể giúp gì cho bạn hôm nay?", 
                adminName
            );
        } else if (!previousAdmin.getId().equals(adminId)) {
            // Chuyển giao giữa các admin
            String previousAdminName = previousAdmin.getFullName() != null ? 
                                     previousAdmin.getFullName() : previousAdmin.getUsername();
            notificationContent = String.format(
                "🔄 Cuộc hội thoại đã được chuyển giao từ %s cho %s.\n\nXin chào! Tôi sẽ tiếp tục hỗ trợ bạn.", 
                previousAdminName, adminName
            );
        } else {
            // Cùng admin mở lại conversation đã đóng
            notificationContent = String.format(
                "🔓 %s đã mở lại cuộc hội thoại.\n\nTôi có thể tiếp tục hỗ trợ bạn!", 
                adminName
            );
        }
        
        // Gửi tin nhắn thông báo
        ChatMessage assignmentMessage = new ChatMessage(conversation, admin, notificationContent);
        assignmentMessage = messageRepository.save(assignmentMessage);
        
        // Gửi realtime notification
        ChatMessageDTO messageDTO = convertToMessageDTO(assignmentMessage);
        sendRealTimeMessage(messageDTO, true);
        
        return convertToConversationDTO(conversation);
    }
    
    /**
     * Lấy tin nhắn trong cuộc hội thoại
     */
    public List<ChatMessageDTO> getConversationMessages(Long conversationId, int page, int size) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new RuntimeException("Conversation not found"));
        
        Pageable pageable = PageRequest.of(page, size);
        Page<ChatMessage> messages = messageRepository.findByConversationOrderBySentAtDesc(conversation, pageable);
        
        return messages.getContent().stream()
            .map(this::convertToMessageDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Đánh dấu tin nhắn đã đọc
     */
    public void markMessagesAsRead(Long conversationId, Long userId) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new RuntimeException("Conversation not found"));
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Đánh dấu tin nhắn đã đọc
        messageRepository.markMessagesAsReadInConversation(conversation, user, LocalDateTime.now());
        
        // Reset unread count
        boolean isFromAdmin = isUserAdmin(user);
        if (isFromAdmin) {
            conversation.resetUnreadCountAdmin();
        } else {
            conversation.resetUnreadCountUser();
        }
        
        conversationRepository.save(conversation);
    }
    
    /**
     * Admin đóng cuộc hội thoại và thông báo cho user
     */
    public void closeConversation(Long conversationId) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new RuntimeException("Conversation not found"));
        
        // Tạo tin nhắn hệ thống thông báo cuộc hội thoại đã đóng
        User systemUser = getSystemUser();
        ChatMessage closeMessage = new ChatMessage(
            conversation, 
            systemUser, 
            "📢 THÔNG BÁO: Cuộc hội thoại đã được đóng bởi nhân viên hỗ trợ.\n\n" +
            "Cảm ơn bạn đã liên hệ với VTX STORE! Nếu bạn cần hỗ trợ thêm, vui lòng tạo cuộc hội thoại mới."
        );
        messageRepository.save(closeMessage);
        
        // Cập nhật trạng thái cuộc hội thoại
        conversation.setStatus(ConversationStatus.CLOSED);
        conversationRepository.save(conversation);
        
        // Gửi thông báo realtime cho user
        ChatMessageDTO messageDTO = convertToMessageDTO(closeMessage);
        sendRealTimeMessage(messageDTO, isUserAdmin(systemUser));
        
        // Cập nhật danh sách cuộc hội thoại
        messagingTemplate.convertAndSend(
            "/topic/admin/chat/conversations-update", 
            conversation.getId()
        );
    }
    
    /**
     * Lấy user hệ thống để gửi tin nhắn hệ thống
     */
    private User getSystemUser() {
        // Kiểm tra xem có system user chưa
        Optional<User> systemUser = userRepository.findByEmail("system@vtxstore.com");
        if (systemUser.isPresent()) {
            return systemUser.get();
        }
        
        // Nếu chưa có, tìm một admin user để dùng
        Optional<User> adminUser = userRepository.findAll().stream()
            .filter(user -> user.getRoles().stream()
                .anyMatch(role -> role.getName().equals("ADMIN")))
            .findFirst();
            
        if (adminUser.isPresent()) {
            return adminUser.get();
        }
        
        // Nếu không tìm thấy admin, dùng user đầu tiên
        return userRepository.findAll().stream()
            .findFirst()
            .orElseThrow(() -> new RuntimeException("No users found to send system message"));
    }
    
    /**
     * User đóng conversation (logout hoặc đóng tab)
     */
    public void closeConversationByUser(Long conversationId, Long userId) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new RuntimeException("Conversation not found"));
        
        // Kiểm tra user có quyền đóng conversation này không
        if (!conversation.getUser().getId().equals(userId)) {
            throw new RuntimeException("User not authorized to close this conversation");
        }
        
        // Live Support: User logout/đóng tab = kết thúc conversation
        conversation.setStatus(ConversationStatus.CLOSED);
        conversationRepository.save(conversation);
        
        // Thông báo admin nếu có
        if (conversation.getAdmin() != null) {
            ChatMessage closeMessage = new ChatMessage(conversation, conversation.getUser(), 
                "📢 Khách hàng đã rời khỏi cuộc hội thoại.");
            messageRepository.save(closeMessage);
            
            // Gửi realtime notification
            ChatMessageDTO messageDTO = convertToMessageDTO(closeMessage);
            sendRealTimeMessage(messageDTO, false);
        }
        
        // Cập nhật danh sách cuộc hội thoại cho admin
        messagingTemplate.convertAndSend(
            "/topic/admin/chat/conversations-update", 
            conversation.getId()
        );
    }
    
    /**
     * Đếm số cuộc hội thoại chờ xử lý
     */
    public long getPendingConversationsCount() {
        return conversationRepository.countByStatusAndAdminIsNull(ConversationStatus.PENDING);
    }
    
    // Helper methods
    
    private boolean isUserAdmin(User user) {
        if (user == null) {
            return false;
        }
        return user.getRoles().stream()
            .anyMatch(role -> "ADMIN".equals(role.getName()) || user.isSuperAdmin());
    }
    
    private ChatConversationDTO convertToConversationDTO(ChatConversation conversation) {
        ChatConversationDTO dto = new ChatConversationDTO();
        dto.setId(conversation.getId());
        dto.setUserId(conversation.getUser().getId());
        dto.setUserName(conversation.getUser().getFullName() != null ? 
                       conversation.getUser().getFullName() : conversation.getUser().getUsername());
        dto.setUserEmail(conversation.getUser().getEmail());
        
        if (conversation.getAdmin() != null) {
            dto.setAdminId(conversation.getAdmin().getId());
            dto.setAdminName(conversation.getAdmin().getFullName() != null ? 
                           conversation.getAdmin().getFullName() : conversation.getAdmin().getUsername());
        }
        
        dto.setStatus(conversation.getStatus());
        dto.setCreatedAt(conversation.getCreatedAt());
        dto.setLastMessageAt(conversation.getLastMessageAt());
        dto.setSubject(conversation.getSubject());
        dto.setUnreadCountUser(conversation.getUnreadCountUser());
        dto.setUnreadCountAdmin(conversation.getUnreadCountAdmin());
        
        // Lấy tin nhắn cuối cùng
        List<ChatMessage> latestMessages = messageRepository.findLatestMessageByConversation(
            conversation, PageRequest.of(0, 1));
        if (!latestMessages.isEmpty()) {
            ChatMessage lastMessage = latestMessages.get(0);
            dto.setLastMessage(lastMessage.getContent());
            dto.setLastMessageSender(lastMessage.getSender().getFullName() != null ? 
                                   lastMessage.getSender().getFullName() : lastMessage.getSender().getUsername());
        }
        
        return dto;
    }
    
    private ChatMessageDTO convertToMessageDTO(ChatMessage message) {
        ChatMessageDTO dto = new ChatMessageDTO();
        dto.setId(message.getId());
        dto.setConversationId(message.getConversation().getId());
        dto.setSenderId(message.getSender().getId());
        dto.setSenderName(message.getSender().getFullName() != null ? 
                         message.getSender().getFullName() : message.getSender().getUsername());
        dto.setContent(message.getContent());
        dto.setType(message.getType());
        dto.setFileUrl(message.getFileUrl());
        dto.setFileName(message.getFileName());
        dto.setSentAt(message.getSentAt());
        dto.setIsRead(message.getIsRead());
        dto.setReadAt(message.getReadAt());
        
        // Debug log để kiểm tra isUserAdmin
        boolean isFromAdmin = isUserAdmin(message.getSender());
        System.out.println("🔍 convertToMessageDTO debug:");
        System.out.println("   - Message ID: " + message.getId());
        System.out.println("   - Sender ID: " + message.getSender().getId());
        System.out.println("   - Sender username: " + message.getSender().getUsername());
        System.out.println("   - Sender roles: " + message.getSender().getRoles().stream()
            .map(role -> role.getName()).reduce("", (a, b) -> a + "," + b));
        System.out.println("   - Is from admin: " + isFromAdmin);
        
        dto.setIsFromAdmin(isFromAdmin);
        
        return dto;
    }
    
    private void sendRealTimeMessage(ChatMessageDTO messageDTO, boolean isFromAdmin) {
        try {
            // Gửi tin nhắn đến admin channel chung để tất cả admin nhận được ngay lập tức
            messagingTemplate.convertAndSend("/topic/admin/chat/messages", messageDTO);
            
            // Gửi tin nhắn đến specific admin conversation (cho backward compatibility)
            messagingTemplate.convertAndSend("/topic/admin/chat/conversation/" + messageDTO.getConversationId(), messageDTO);
            
            // Gửi tin nhắn đến user channel (luôn gửi để user có thể thấy tin nhắn từ admin)
            messagingTemplate.convertAndSend("/topic/user/" + messageDTO.getConversationId() + "/messages", messageDTO);
            
            // Cập nhật danh sách cuộc hội thoại cho admin
            messagingTemplate.convertAndSend("/topic/admin/chat/conversations-update", messageDTO.getConversationId());
            
        } catch (Exception e) {
            System.err.println("Error sending real-time message: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void notifyAdminsNewConversation(ChatConversation conversation) {
        try {
            ChatConversationDTO conversationDTO = convertToConversationDTO(conversation);
            messagingTemplate.convertAndSend("/topic/admin/chat/new-conversation", conversationDTO);
        } catch (Exception e) {
            System.err.println("Error notifying admins of new conversation: " + e.getMessage());
            e.printStackTrace();
        }
    }
} 