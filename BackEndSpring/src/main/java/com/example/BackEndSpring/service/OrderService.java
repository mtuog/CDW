package com.example.BackEndSpring.service;

import com.example.BackEndSpring.model.Order;
import com.example.BackEndSpring.model.OrderItem;
import com.example.BackEndSpring.model.Product;
import com.example.BackEndSpring.model.ProductSize;
import com.example.BackEndSpring.model.User;
import com.example.BackEndSpring.repository.OrderRepository;
import com.example.BackEndSpring.repository.OrderItemRepository;
import com.example.BackEndSpring.repository.LoyaltyTransactionRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.mail.MessagingException;
import java.text.NumberFormat;
import java.util.Locale;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final LoyaltyService loyaltyService;
    private final ProductService productService;
    private final SettingService settingService;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @Autowired
    public OrderService(OrderRepository orderRepository, OrderItemRepository orderItemRepository, 
                        LoyaltyService loyaltyService, ProductService productService,
                        SettingService settingService, LoyaltyTransactionRepository loyaltyTransactionRepository,
                        EmailService emailService, NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.loyaltyService = loyaltyService;
        this.productService = productService;
        this.settingService = settingService;
        this.loyaltyTransactionRepository = loyaltyTransactionRepository;
        this.emailService = emailService;
        this.notificationService = notificationService;
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
    
    /**
     * Lấy tất cả đơn hàng với phân trang
     * @param pageable Thông tin phân trang
     * @return Page chứa các đơn hàng
     */
    public Page<Order> getAllOrdersWithPaging(Pageable pageable) {
        return orderRepository.findAll(pageable);
    }
    
    /**
     * Lấy đơn hàng với các bộ lọc và tìm kiếm
     * @param search Từ khóa tìm kiếm (tên, email, số điện thoại, mã đơn hàng)
     * @param status Trạng thái đơn hàng cần lọc
     * @param fromDate Ngày bắt đầu
     * @param toDate Ngày kết thúc
     * @param pageable Thông tin phân trang
     * @return Page đơn hàng đã được lọc
     */
    public Page<Order> getOrdersWithFilters(String search, Order.Status status, 
                                        LocalDateTime fromDate, LocalDateTime toDate, 
                                        Pageable pageable) {
        return orderRepository.findOrdersWithFilters(search, status, fromDate, toDate, pageable);
    }
    
    /**
     * Lấy đơn hàng theo ID
     * @param id ID của đơn hàng
     * @return Optional chứa đơn hàng nếu tìm thấy
     */
    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }
    
    /**
     * Lấy danh sách đơn hàng theo người dùng
     * @param user Đối tượng người dùng
     * @return Danh sách đơn hàng
     */
    public List<Order> getOrdersByUser(User user) {
        return orderRepository.findByUser(user);
    }
    
    /**
     * Lấy danh sách đơn hàng theo trạng thái
     * @param status Trạng thái cần lọc
     * @return Danh sách đơn hàng
     */
    public List<Order> getOrdersByStatus(Order.Status status) {
        return orderRepository.findByStatus(status);
    }
    
    /**
     * Tạo đơn hàng mới
     * @param order Đơn hàng cần tạo
     * @return Đơn hàng đã được lưu
     */
    @Transactional
    public Order createOrder(Order order) {
        // Tạo mã đơn hàng nếu chưa có
        if (order.getOrderCode() == null || order.getOrderCode().isEmpty()) {
            String orderCode = generateOrderCode();
            order.setOrderCode(orderCode);
        }
        
        // Không set thời gian thủ công, để @PrePersist tự động xử lý
        System.out.println("Tạo đơn hàng, thời gian sẽ được set tự động bởi @PrePersist");
        
        // Lưu đơn hàng trước
        Order savedOrder = orderRepository.save(order);
        
        System.out.println("Đơn hàng đã lưu với ID: " + savedOrder.getId() + ", thời gian tạo: " + savedOrder.getCreatedAt());
        
        // Chỉ cập nhật số lượng sản phẩm trong kho ngay lập tức nếu là thanh toán COD
        // Các phương thức khác sẽ chờ xác nhận thanh toán thành công
        if (order.getPaymentMethod() != null && order.getPaymentMethod().equalsIgnoreCase("COD")) {
            if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
                for (OrderItem item : order.getOrderItems()) {
                    if (item.getProduct() != null) {
                        productService.decreaseStock(item.getProduct().getId(), item.getQuantity(), item.getSize());
                    }
                }
            }
            System.out.println("Đơn hàng COD #" + savedOrder.getId() + ": Đã giảm số lượng sản phẩm trong kho");
        } else {
            System.out.println("Đơn hàng #" + savedOrder.getId() + " với phương thức " + order.getPaymentMethod() + ": Chờ xác nhận thanh toán trước khi giảm số lượng");
        }
        
        // Gửi email xác nhận đơn hàng
        try {
            // Always attempt to send order confirmation email
            System.out.println("Attempting to send order confirmation email for order #" + savedOrder.getId());
            
            if (order.getUser() == null) {
                System.err.println("Cannot send confirmation email: User is null for order #" + savedOrder.getId());
            } else if (order.getUser().getEmail() == null || order.getUser().getEmail().trim().isEmpty()) {
                System.err.println("Cannot send confirmation email: User email is null or empty for order #" + savedOrder.getId());
            } else {
                // Print email details for debugging
                System.out.println("User email: " + order.getUser().getEmail());
                System.out.println("Username: " + order.getUser().getUsername());
                
                // Use the simple direct method for sending the email
                sendSimpleOrderConfirmationEmail(savedOrder);
            }
        } catch (Exception e) {
            // Log lỗi nhưng không gián đoạn quá trình tạo đơn hàng
            System.err.println("Error sending order confirmation email: " + e.getMessage());
            e.printStackTrace();
        }
        
        // Tạo thông báo cho admin về đơn hàng mới
        try {
            String customerName = savedOrder.getUser() != null ? 
                (savedOrder.getUser().getFullName() != null ? savedOrder.getUser().getFullName() : savedOrder.getUser().getUsername()) 
                : "Khách vãng lai";
            System.out.println("Đang tạo thông báo đơn hàng mới cho đơn hàng #" + savedOrder.getId() + " - Khách hàng: " + customerName);
            notificationService.createNewOrderNotification(
                savedOrder.getId(), 
                customerName, 
                savedOrder.getTotalAmount()
            );
            System.out.println("Đã tạo thông báo đơn hàng mới thành công");
        } catch (Exception e) {
            System.err.println("Lỗi khi tạo thông báo đơn hàng mới: " + e.getMessage());
            e.printStackTrace();
        }
        
        return savedOrder;
    }
    
    /**
     * Send a simplified order confirmation email using a direct approach similar to BankPaymentService
     */
    private void sendSimpleOrderConfirmationEmail(Order order) {
        try {
            if (order == null || order.getUser() == null || order.getUser().getEmail() == null) {
                return;
            }
            
            User user = order.getUser();
            String email = user.getEmail();
            String customerName = user.getFullName() != null ? user.getFullName() : user.getUsername();
            
            String subject = "Xác nhận đơn hàng " + order.getOrderCode();
            
            // Create a simplified email content
            StringBuilder content = new StringBuilder();
            content.append("<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">");
            content.append("<h2 style=\"color: #e65540;\">Đơn hàng của bạn đã được xác nhận</h2>");
            content.append("<p>Xin chào ").append(customerName).append(",</p>");
            content.append("<p>Cảm ơn bạn đã đặt hàng tại CD Web Shop. Chúng tôi đã nhận được đơn hàng của bạn và sẽ xử lý trong thời gian sớm nhất.</p>");
            content.append("<p><strong>Thông tin đơn hàng:</strong></p>");
            content.append("<ul>");
            content.append("<li>Mã đơn hàng: ").append(order.getOrderCode()).append("</li>");
            content.append("<li>Ngày đặt hàng: ").append(formatDateTime(order.getCreatedAt())).append("</li>");
            content.append("<li>Phương thức thanh toán: ").append(getPaymentMethodName(order.getPaymentMethod())).append("</li>");
            content.append("<li>Địa chỉ giao hàng: ").append(order.getShippingAddress()).append("</li>");
            content.append("<li>Số điện thoại: ").append(order.getPhone()).append("</li>");
            content.append("</ul>");
            
            // Add order items summary
            content.append("<h3>Chi tiết đơn hàng</h3>");
            content.append("<table style=\"width:100%; border-collapse: collapse; margin-bottom: 20px;\">");
            content.append("<tr style=\"background-color: #f2f2f2;\">");
            content.append("<th style=\"padding: 10px; text-align: left; border: 1px solid #ddd;\">Sản phẩm</th>");
            content.append("<th style=\"padding: 10px; text-align: center; border: 1px solid #ddd;\">Số lượng</th>");
            content.append("<th style=\"padding: 10px; text-align: right; border: 1px solid #ddd;\">Thành tiền</th>");
            content.append("</tr>");
            
            if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
                for (OrderItem item : order.getOrderItems()) {
                    String productName = item.getProduct() != null ? item.getProduct().getName() : "Sản phẩm";
                    int quantity = item.getQuantity();
                    double price = item.getPrice();
                    double total = price * quantity;
                    
                    content.append("<tr>");
                    content.append("<td style=\"padding: 10px; text-align: left; border: 1px solid #ddd;\">").append(productName).append("</td>");
                    content.append("<td style=\"padding: 10px; text-align: center; border: 1px solid #ddd;\">").append(quantity).append("</td>");
                    content.append("<td style=\"padding: 10px; text-align: right; border: 1px solid #ddd;\">").append(formatCurrency(total)).append("</td>");
                    content.append("</tr>");
                }
            }
            
            content.append("<tr>");
            content.append("<td colspan=\"2\" style=\"padding: 10px; text-align: right; border: 1px solid #ddd;\"><strong>Tổng cộng:</strong></td>");
            content.append("<td style=\"padding: 10px; text-align: right; border: 1px solid #ddd;\"><strong>").append(formatCurrency(order.getTotalAmount())).append("</strong></td>");
            content.append("</tr>");
            content.append("</table>");
            
            // Special instructions for bank transfer
            if ("Bank Transfer".equals(order.getPaymentMethod())) {
                content.append("<p><strong>Thông tin thanh toán chuyển khoản:</strong></p>");
                content.append("<p>Vui lòng chuyển khoản theo thông tin dưới đây để hoàn tất đơn hàng:</p>");
                content.append("<ul>");
                content.append("<li>Ngân hàng: Vietcombank</li>");
                content.append("<li>Số tài khoản: 1234567890</li>");
                content.append("<li>Chủ tài khoản: CD Web Shop</li>");
                content.append("<li>Nội dung chuyển khoản: ").append(order.getOrderCode()).append("</li>");
                content.append("</ul>");
                content.append("<p>Đơn hàng của bạn sẽ được xử lý sau khi chúng tôi nhận được thanh toán.</p>");
            }
            
            content.append("<p>Bạn có thể theo dõi trạng thái đơn hàng tại <a href=\"http://localhost:3000/account?tab=orders\">đây</a>.</p>");
            content.append("<p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email hoặc hotline.</p>");
            content.append("<p>Trân trọng,<br>CD Web Shop</p>");
            content.append("</div>");
            
            System.out.println("Directly sending email to: " + email);
            emailService.sendEmail(email, subject, content.toString());
            System.out.println("Simple order confirmation email sent successfully to: " + email);
        } catch (Exception e) {
            System.err.println("Failed to send simple order confirmation email: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Publicly accessible method to send order confirmation emails for testing
     */
    public void sendOrderConfirmationEmail(Order order) {
        // Delegate to the private implementation
        sendSimpleOrderConfirmationEmail(order);
    }
    
    /**
     * Gửi email theo trạng thái của đơn hàng
     * @param order Đơn hàng cần gửi email
     * @return true nếu gửi email thành công
     */
    public boolean sendOrderStatusEmail(Order order) {
        try {
            if (order == null || order.getUser() == null || order.getUser().getEmail() == null) {
                return false;
            }
            
            switch (order.getStatus()) {
                case PENDING:
                    sendSimpleOrderConfirmationEmail(order);
                    break;
                case PROCESSING:
                    sendOrderProcessingEmail(order);
                    break;
                case SHIPPED:
                    sendOrderShippedEmail(order);
                    break;
                case DELIVERED:
                    sendOrderDeliveredEmail(order);
                    break;
                case CANCELLED:
                    sendOrderCancelledEmail(order);
                    break;
                default:
                    sendSimpleOrderConfirmationEmail(order);
                    break;
            }
            return true;
        } catch (Exception e) {
            System.err.println("Failed to send order status email: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Gửi email thông báo đơn hàng đang được xử lý
     */
    private void sendOrderProcessingEmail(Order order) {
        try {
            User user = order.getUser();
            String email = user.getEmail();
            String customerName = user.getFullName() != null ? user.getFullName() : user.getUsername();
            
            String subject = "Đơn hàng " + order.getOrderCode() + " đang được xử lý";
            
            StringBuilder content = new StringBuilder();
            content.append("<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">");
            content.append("<h2 style=\"color: #e65540;\">Đơn hàng của bạn đang được xử lý</h2>");
            content.append("<p>Xin chào ").append(customerName).append(",</p>");
            
            // Thông báo khác nhau tùy theo phương thức thanh toán
            if ("VNPAY".equals(order.getPaymentMethod())) {
                content.append("<p>Cảm ơn bạn đã thanh toán qua VNPAY. Chúng tôi đã nhận được thanh toán của bạn và đang xử lý đơn hàng.</p>");
            } else if ("Bank Transfer".equals(order.getPaymentMethod())) {
                content.append("<p>Cảm ơn bạn đã thanh toán qua chuyển khoản ngân hàng. Chúng tôi đã xác nhận thanh toán của bạn và đang xử lý đơn hàng.</p>");
            } else {
                content.append("<p>Chúng tôi đang xử lý đơn hàng của bạn và sẽ sớm giao hàng đến bạn.</p>");
            }
            
            content.append("<p><strong>Thông tin đơn hàng:</strong></p>");
            content.append("<ul>");
            content.append("<li>Mã đơn hàng: ").append(order.getOrderCode()).append("</li>");
            content.append("<li>Ngày đặt hàng: ").append(formatDateTime(order.getCreatedAt())).append("</li>");
            content.append("<li>Phương thức thanh toán: ").append(getPaymentMethodName(order.getPaymentMethod())).append("</li>");
            content.append("<li>Địa chỉ giao hàng: ").append(order.getShippingAddress()).append("</li>");
            content.append("<li>Số điện thoại: ").append(order.getPhone()).append("</li>");
            content.append("</ul>");
            
            // Thêm thông tin sản phẩm
            addOrderItemsToEmail(content, order);
            
            content.append("<p>Bạn có thể theo dõi trạng thái đơn hàng tại <a href=\"http://localhost:3000/account?tab=orders\">đây</a>.</p>");
            content.append("<p>Cảm ơn bạn đã mua sắm cùng chúng tôi!</p>");
            content.append("<p>Trân trọng,<br>CD Web Shop</p>");
            content.append("</div>");
            
            emailService.sendEmail(email, subject, content.toString());
        } catch (Exception e) {
            System.err.println("Failed to send order processing email: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Gửi email thông báo đơn hàng đang được giao
     */
    private void sendOrderShippedEmail(Order order) {
        try {
            User user = order.getUser();
            String email = user.getEmail();
            String customerName = user.getFullName() != null ? user.getFullName() : user.getUsername();
            
            String subject = "Đơn hàng " + order.getOrderCode() + " đang được giao";
            
            StringBuilder content = new StringBuilder();
            content.append("<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">");
            content.append("<h2 style=\"color: #e65540;\">Đơn hàng của bạn đang được giao</h2>");
            content.append("<p>Xin chào ").append(customerName).append(",</p>");
            content.append("<p>Đơn hàng của bạn hiện đang được giao đến địa chỉ bạn đã cung cấp. Vui lòng đảm bảo có người nhận hàng.</p>");
            content.append("<p><strong>Thông tin đơn hàng:</strong></p>");
            content.append("<ul>");
            content.append("<li>Mã đơn hàng: ").append(order.getOrderCode()).append("</li>");
            content.append("<li>Ngày đặt hàng: ").append(formatDateTime(order.getCreatedAt())).append("</li>");
            content.append("<li>Phương thức thanh toán: ").append(getPaymentMethodName(order.getPaymentMethod())).append("</li>");
            content.append("<li>Địa chỉ giao hàng: ").append(order.getShippingAddress()).append("</li>");
            content.append("<li>Số điện thoại: ").append(order.getPhone()).append("</li>");
            content.append("</ul>");
            
            // Thêm thông tin sản phẩm
            addOrderItemsToEmail(content, order);
            
            content.append("<p>Bạn có thể theo dõi trạng thái đơn hàng tại <a href=\"http://localhost:3000/account?tab=orders\">đây</a>.</p>");
            content.append("<p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email hoặc hotline.</p>");
            content.append("<p>Trân trọng,<br>CD Web Shop</p>");
            content.append("</div>");
            
            emailService.sendEmail(email, subject, content.toString());
        } catch (Exception e) {
            System.err.println("Failed to send order shipped email: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Gửi email thông báo đơn hàng đã giao thành công
     */
    private void sendOrderDeliveredEmail(Order order) {
        try {
            User user = order.getUser();
            String email = user.getEmail();
            String customerName = user.getFullName() != null ? user.getFullName() : user.getUsername();
            
            String subject = "Đơn hàng " + order.getOrderCode() + " đã giao thành công";
            
            StringBuilder content = new StringBuilder();
            content.append("<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">");
            content.append("<h2 style=\"color: #e65540;\">Đơn hàng của bạn đã được giao thành công</h2>");
            content.append("<p>Xin chào ").append(customerName).append(",</p>");
            content.append("<p>Đơn hàng của bạn đã được giao thành công. Cảm ơn bạn đã mua sắm tại CD Web Shop!</p>");
            content.append("<p><strong>Thông tin đơn hàng:</strong></p>");
            content.append("<ul>");
            content.append("<li>Mã đơn hàng: ").append(order.getOrderCode()).append("</li>");
            content.append("<li>Ngày đặt hàng: ").append(formatDateTime(order.getCreatedAt())).append("</li>");
            content.append("<li>Ngày giao hàng: ").append(formatDateTime(LocalDateTime.now())).append("</li>");
            content.append("<li>Phương thức thanh toán: ").append(getPaymentMethodName(order.getPaymentMethod())).append("</li>");
            content.append("</ul>");
            
            // Thêm thông tin sản phẩm
            addOrderItemsToEmail(content, order);
            
            // Thêm phần đánh giá sản phẩm
            content.append("<p>Bạn có thể đánh giá sản phẩm tại <a href=\"http://localhost:3000/account?tab=reviews\">đây</a>.</p>");
            
            content.append("<p>Chúng tôi rất mong nhận được phản hồi của bạn về trải nghiệm mua sắm và sản phẩm.</p>");
            content.append("<p>Trân trọng,<br>CD Web Shop</p>");
            content.append("</div>");
            
            emailService.sendEmail(email, subject, content.toString());
        } catch (Exception e) {
            System.err.println("Failed to send order delivered email: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Gửi email thông báo đơn hàng đã bị hủy
     */
    private void sendOrderCancelledEmail(Order order) {
        try {
            User user = order.getUser();
            String email = user.getEmail();
            String customerName = user.getFullName() != null ? user.getFullName() : user.getUsername();
            
            String subject = "Đơn hàng " + order.getOrderCode() + " đã bị hủy";
            
            StringBuilder content = new StringBuilder();
            content.append("<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">");
            content.append("<h2 style=\"color: #e65540;\">Đơn hàng của bạn đã bị hủy</h2>");
            content.append("<p>Xin chào ").append(customerName).append(",</p>");
            content.append("<p>Đơn hàng của bạn đã bị hủy. Nếu bạn không yêu cầu hủy đơn hàng này, vui lòng liên hệ với chúng tôi ngay.</p>");
            content.append("<p><strong>Thông tin đơn hàng:</strong></p>");
            content.append("<ul>");
            content.append("<li>Mã đơn hàng: ").append(order.getOrderCode()).append("</li>");
            content.append("<li>Ngày đặt hàng: ").append(formatDateTime(order.getCreatedAt())).append("</li>");
            content.append("<li>Ngày hủy: ").append(formatDateTime(LocalDateTime.now())).append("</li>");
            content.append("</ul>");
            
            // Thêm thông tin sản phẩm
            addOrderItemsToEmail(content, order);
            
            content.append("<p>Nếu bạn đã thanh toán cho đơn hàng này, chúng tôi sẽ hoàn tiền trong vòng 3-5 ngày làm việc.</p>");
            content.append("<p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email hoặc hotline.</p>");
            content.append("<p>Trân trọng,<br>CD Web Shop</p>");
            content.append("</div>");
            
            emailService.sendEmail(email, subject, content.toString());
        } catch (Exception e) {
            System.err.println("Failed to send order cancelled email: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Helper method để thêm thông tin sản phẩm vào email
     */
    private void addOrderItemsToEmail(StringBuilder content, Order order) {
        content.append("<h3>Chi tiết đơn hàng</h3>");
        content.append("<table style=\"width:100%; border-collapse: collapse; margin-bottom: 20px;\">");
        content.append("<tr style=\"background-color: #f2f2f2;\">");
        content.append("<th style=\"padding: 10px; text-align: left; border: 1px solid #ddd;\">Sản phẩm</th>");
        content.append("<th style=\"padding: 10px; text-align: center; border: 1px solid #ddd;\">Số lượng</th>");
        content.append("<th style=\"padding: 10px; text-align: right; border: 1px solid #ddd;\">Thành tiền</th>");
        content.append("</tr>");
        
        if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
            for (OrderItem item : order.getOrderItems()) {
                String productName = item.getProduct() != null ? item.getProduct().getName() : "Sản phẩm";
                int quantity = item.getQuantity();
                double price = item.getPrice();
                double total = price * quantity;
                
                content.append("<tr>");
                content.append("<td style=\"padding: 10px; text-align: left; border: 1px solid #ddd;\">").append(productName).append("</td>");
                content.append("<td style=\"padding: 10px; text-align: center; border: 1px solid #ddd;\">").append(quantity).append("</td>");
                content.append("<td style=\"padding: 10px; text-align: right; border: 1px solid #ddd;\">").append(formatCurrency(total)).append("</td>");
                content.append("</tr>");
            }
        }
        
        content.append("<tr>");
        content.append("<td colspan=\"2\" style=\"padding: 10px; text-align: right; border: 1px solid #ddd;\"><strong>Tổng cộng:</strong></td>");
        content.append("<td style=\"padding: 10px; text-align: right; border: 1px solid #ddd;\"><strong>").append(formatCurrency(order.getTotalAmount())).append("</strong></td>");
        content.append("</tr>");
        content.append("</table>");
    }
    
    /**
     * Cập nhật trạng thái đơn hàng và gửi email thông báo
     * @param id ID của đơn hàng
     * @param status Trạng thái mới
     * @param sendEmail Có gửi email thông báo không
     * @return Đơn hàng đã được cập nhật
     */
    @Transactional
    public Order updateOrderStatusAndNotify(Long id, Order.Status status, boolean sendEmail) {
        // Cập nhật trạng thái đơn hàng trước
        Order updatedOrder = updateOrderStatus(id, status);
        
        // Sau khi đã cập nhật thành công, mới gửi email thông báo trạng thái mới
        if (sendEmail) {
            sendOrderStatusEmail(updatedOrder);
        }
        
        return updatedOrder;
    }
    
    /**
     * Cập nhật trạng thái đơn hàng
     * @param id ID của đơn hàng
     * @param status Trạng thái mới
     * @return Đơn hàng đã được cập nhật
     */
    @Transactional
    public Order updateOrderStatus(Long id, Order.Status status) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + id));
        
        Order.Status oldStatus = order.getStatus();
        order.setStatus(status);
        
        // Xử lý cập nhật kho khi thay đổi trạng thái
        if (oldStatus == Order.Status.CANCELLED && status != Order.Status.CANCELLED) {
            // Nếu đơn hàng đã bị hủy, và giờ được kích hoạt lại (không còn là CANCELLED)
            // Cần giảm số lượng trong kho
            for (OrderItem item : order.getOrderItems()) {
                productService.decreaseStock(item.getProduct().getId(), item.getQuantity(), item.getSize());
            }
        } else if (oldStatus != Order.Status.CANCELLED && status == Order.Status.CANCELLED) {
            // Nếu đơn hàng đang hoạt động, và giờ bị hủy (chuyển sang CANCELLED)
            // Cần tăng số lượng trong kho
            for (OrderItem item : order.getOrderItems()) {
                productService.increaseStock(item.getProduct().getId(), item.getQuantity(), item.getSize());
            }
            
            // Tạo thông báo cho admin về đơn hàng bị hủy
            try {
                String customerName = order.getUser() != null ? 
                    (order.getUser().getFullName() != null ? order.getUser().getFullName() : order.getUser().getUsername()) 
                    : "Khách vãng lai";
                notificationService.createOrderCancelledNotification(
                    order.getId(), 
                    customerName, 
                    "Đơn hàng bị hủy bởi admin"
                );
            } catch (Exception e) {
                System.err.println("Lỗi khi tạo thông báo đơn hàng bị hủy: " + e.getMessage());
            }
        }
        
        // Lưu đơn hàng với trạng thái mới
        Order updatedOrder = orderRepository.save(order);
        
        // Nếu đơn hàng chuyển sang trạng thái DELIVERED (đã giao hàng), tự động thêm điểm tích lũy
        if (status == Order.Status.DELIVERED && oldStatus != Order.Status.DELIVERED) {
            try {
                // Kiểm tra xem đơn hàng có người dùng không
                if (order.getUser() != null) {
                    Long userId = order.getUser().getId();
                    
                    // Kiểm tra xem đơn hàng đã được tích điểm chưa
                    boolean alreadyEarnedPoints = loyaltyTransactionRepository.existsByOrderIdAndTypeEarn(order.getId());
                    
                    if (!alreadyEarnedPoints) {
                        String description = "Hoàn thành đơn hàng #" + order.getOrderCode();
                        
                        // Gọi service để thêm điểm
                        loyaltyService.addPointsFromOrder(userId, updatedOrder, description);
                        
                        System.out.println("Đã tự động thêm điểm tích lũy cho đơn hàng #" + order.getOrderCode());
                    } else {
                        System.out.println("Đơn hàng #" + order.getOrderCode() + " đã được tích điểm trước đó");
                    }
                }
            } catch (Exception e) {
                // Log lỗi nhưng không dừng quy trình cập nhật trạng thái đơn hàng
                System.err.println("Lỗi khi thêm điểm tích lũy: " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        return updatedOrder;
    }
    
    /**
     * Xóa đơn hàng
     * @param id ID của đơn hàng cần xóa
     */
    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
    }
    
    /**
     * Đếm tổng số đơn hàng
     * @return Số lượng đơn hàng
     */
    public long countTotalOrders() {
        return orderRepository.count();
    }
    
    /**
     * Tính tổng doanh thu từ tất cả đơn hàng đã giao
     * @return Tổng doanh thu
     */
    public double calculateTotalRevenue() {
        Double revenue = orderRepository.sumTotalAmountByStatus(Order.Status.DELIVERED);
        return revenue != null ? revenue : 0;
    }
    
    /**
     * Đếm số đơn hàng theo trạng thái
     * @return Map chứa số lượng đơn hàng theo trạng thái
     */
    public Map<Order.Status, Long> countOrdersByStatus() {
        Map<Order.Status, Long> result = new HashMap<>();
        for (Order.Status status : Order.Status.values()) {
            result.put(status, orderRepository.countByStatus(status));
        }
        return result;
    }
    
    /**
     * Đếm số đơn hàng sau một ngày cụ thể
     * @param date Ngày bắt đầu
     * @return Số lượng đơn hàng
     */
    public long countOrdersAfterDate(LocalDateTime date) {
        return orderRepository.findByCreatedAtAfter(date).size();
    }
    
    /**
     * Tính tổng doanh thu sau một ngày cụ thể
     * @param date Ngày bắt đầu
     * @return Tổng doanh thu
     */
    public double calculateRevenueAfterDate(LocalDateTime date) {
        double revenue = 0;
        List<Order> orders = orderRepository.findByCreatedAtAfter(date);
        for (Order order : orders) {
            if (order.getStatus() == Order.Status.DELIVERED) {
                revenue += order.getTotalAmount();
            }
        }
        return revenue;
    }
    
    /**
     * Đếm số đơn hàng theo ngày trong 7 ngày gần đây
     * @return Map chứa số lượng đơn hàng theo ngày
     */
    public Map<String, Long> countOrdersByDayLast7Days() {
        Map<String, Long> result = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");
        
        for (int i = 6; i >= 0; i--) {
            LocalDateTime day = now.minusDays(i);
            LocalDateTime startOfDay = day.withHour(0).withMinute(0).withSecond(0);
            LocalDateTime endOfDay = day.withHour(23).withMinute(59).withSecond(59);
            
            List<Order> orders = orderRepository.findOrdersBetweenDates(startOfDay, endOfDay);
            String dayStr = day.format(formatter);
            result.put(dayStr, (long) orders.size());
        }
        
        return result;
    }
    
    /**
     * Đếm số đơn hàng giữa hai ngày
     * @param startDate Ngày bắt đầu
     * @param endDate Ngày kết thúc
     * @return Số lượng đơn hàng
     */
    public long countOrdersBetweenDates(LocalDateTime startDate, LocalDateTime endDate) {
        return orderRepository.findOrdersBetweenDates(startDate, endDate).size();
    }
    
    /**
     * Tính tổng doanh thu giữa hai ngày
     * @param startDate Ngày bắt đầu
     * @param endDate Ngày kết thúc
     * @return Tổng doanh thu
     */
    public double calculateRevenueBetweenDates(LocalDateTime startDate, LocalDateTime endDate) {
        double revenue = 0;
        List<Order> orders = orderRepository.findOrdersBetweenDates(startDate, endDate);
        for (Order order : orders) {
            if (order.getStatus() == Order.Status.DELIVERED) {
                revenue += order.getTotalAmount();
            }
        }
        return revenue;
    }
    
    /**
     * Tạo mã đơn hàng ngẫu nhiên
     * @return Mã đơn hàng với tiền tố từ cài đặt + số ngẫu nhiên
     */
    private String generateOrderCode() {
        // Lấy tiền tố từ cài đặt, sử dụng "ORD-" nếu không tìm thấy
        String prefix = settingService.getSettingValue("order_prefix", "ORD-");
        String randomPart = String.valueOf((int) (Math.random() * 900000 + 100000));
        return prefix + randomPart;
    }

    /**
     * Format số tiền thành định dạng tiền tệ VNĐ
     */
    private String formatCurrency(double amount) {
        NumberFormat currencyFormatter = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
        return currencyFormatter.format(amount);
    }

    /**
     * Format thời gian theo định dạng Việt Nam
     */
    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return "N/A";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy");
        return dateTime.format(formatter);
    }

    /**
     * Chuyển đổi mã phương thức thanh toán thành tên hiển thị
     */
    private String getPaymentMethodName(String paymentMethod) {
        if (paymentMethod == null) return "Không xác định";
        
        switch (paymentMethod.toUpperCase()) {
            case "COD":
                return "Thanh toán khi nhận hàng (COD)";
            case "BANK TRANSFER":
                return "Chuyển khoản ngân hàng";
            case "VNPAY":
                return "Thanh toán qua VNPAY";
            default:
                return paymentMethod;
        }
    }

    /**
     * Chuyển đổi mã trạng thái đơn hàng thành tên hiển thị
     */
    private String getStatusName(Order.Status status) {
        if (status == null) return "Không xác định";
        
        switch (status) {
            case PENDING:
                return "Đang chờ xử lý";
            case PROCESSING:
                return "Đang xử lý";
            case SHIPPED:
                return "Đang giao hàng";
            case DELIVERED:
                return "Đã giao hàng";
            case CANCELLED:
                return "Đã hủy";
            default:
                return status.toString();
        }
    }

    /**
     * Lưu đơn hàng trực tiếp mà không thay đổi trạng thái kho
     * @param order Đơn hàng cần lưu
     * @return Đơn hàng đã được lưu
     */
    @Transactional
    public Order saveOrder(Order order) {
        return orderRepository.save(order);
    }
}