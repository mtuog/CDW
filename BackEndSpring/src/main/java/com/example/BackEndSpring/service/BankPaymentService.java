package com.example.BackEndSpring.service;

import com.example.BackEndSpring.model.BankAccount;
import com.example.BackEndSpring.model.BankPayment;
import com.example.BackEndSpring.model.Order;
import com.example.BackEndSpring.model.OrderItem;
import com.example.BackEndSpring.model.PaymentLog;
import com.example.BackEndSpring.model.User;
import com.example.BackEndSpring.repository.BankAccountRepository;
import com.example.BackEndSpring.repository.BankPaymentRepository;
import com.example.BackEndSpring.repository.PaymentLogRepository;
import com.example.BackEndSpring.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.mail.MessagingException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class BankPaymentService {
    
    @Autowired
    private BankPaymentRepository bankPaymentRepository;
    
    @Autowired
    private BankAccountRepository bankAccountRepository;
    
    @Autowired
    private PaymentLogRepository paymentLogRepository;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private OrderService orderService;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private ProductService productService;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    
    /**
     * Lấy danh sách tất cả tài khoản ngân hàng đang hoạt động
     */
    public List<BankAccount> getAllActiveBankAccounts() {
        return bankAccountRepository.findByIsActiveTrue();
    }
    
    /**
     * Tạo một giao dịch thanh toán qua ngân hàng mới
     */
    @Transactional
    public BankPayment createBankPayment(Long orderId, BankPayment bankPayment) {
        Optional<Order> orderOpt = orderService.getOrderById(orderId);
        if (!orderOpt.isPresent()) {
            throw new RuntimeException("Không tìm thấy đơn hàng với ID: " + orderId);
        }
        
        Order order = orderOpt.get();
        
        // Kiểm tra nếu đơn hàng đã thanh toán
        String paymentMethod = order.getPaymentMethod();
        if (paymentMethod == null 
            || (!paymentMethod.equalsIgnoreCase("COD") 
                && !paymentMethod.equalsIgnoreCase("Bank Transfer") 
                && !paymentMethod.equalsIgnoreCase("bank"))) {
            throw new RuntimeException("Phương thức thanh toán không hợp lệ, không thể thanh toán qua ngân hàng");
        }
        
        // Cập nhật thông tin đơn hàng - chỉ thay đổi phương thức thanh toán, không thay đổi trạng thái
        order.setPaymentMethod("Bank Transfer");
        
        // Lưu thông tin đơn hàng trực tiếp vào repository, không thay đổi trạng thái
        Order savedOrder = orderRepository.save(order);
        System.out.println("Đơn hàng #" + orderId + " đã được cập nhật phương thức thanh toán sang Bank Transfer");
        
        // Thiết lập thông tin giao dịch
        bankPayment.setOrder(savedOrder);
        bankPayment.setAmount(savedOrder.getTotalAmount());
        bankPayment.setStatus(BankPayment.PaymentStatus.PENDING);
        
        // Tạo mã giao dịch nếu chưa có
        if (bankPayment.getTransactionCode() == null || bankPayment.getTransactionCode().isEmpty()) {
            bankPayment.setTransactionCode(generateTransactionCode());
        }
        
        // Lưu giao dịch
        BankPayment savedPayment = bankPaymentRepository.save(bankPayment);
        
        // Ghi log giao dịch
        logPaymentAction(savedPayment, "CREATED", "SYSTEM", "Tạo giao dịch thanh toán mới cho đơn hàng #" + orderId);
        
        return savedPayment;
    }
    
    /**
     * Xác nhận giao dịch đã thanh toán
     */
    @Transactional
    public BankPayment verifyPayment(Long paymentId, String transactionCode, String note) {
        Optional<BankPayment> paymentOpt = bankPaymentRepository.findById(paymentId);
        if (!paymentOpt.isPresent()) {
            throw new RuntimeException("Không tìm thấy giao dịch với ID: " + paymentId);
        }
        
        BankPayment payment = paymentOpt.get();
        
        // Cập nhật thông tin xác nhận
        payment.setStatus(BankPayment.PaymentStatus.VERIFIED);
        payment.setVerifiedAt(LocalDateTime.now());
        payment.setVerificationNote(note);
        
        if (transactionCode != null && !transactionCode.isEmpty()) {
            payment.setTransactionCode(transactionCode);
        }
        
        // Cập nhật trạng thái đơn hàng nếu cần
        Order order = payment.getOrder();
        if (order.getStatus() == Order.Status.PENDING) {
            // Giảm số lượng sản phẩm trong kho khi xác nhận thanh toán thành công
            if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
                for (OrderItem item : order.getOrderItems()) {
                    if (item.getProduct() != null) {
                        productService.decreaseStock(item.getProduct().getId(), item.getQuantity(), item.getSize());
                    }
                }
                System.out.println("Đã giảm số lượng sản phẩm trong kho sau khi xác nhận thanh toán thành công cho đơn hàng #" + order.getId());
            }
            
            // Cập nhật trạng thái đơn hàng
            orderService.updateOrderStatus(order.getId(), Order.Status.PROCESSING);
        }
        
        // Lưu thông tin giao dịch
        BankPayment verifiedPayment = bankPaymentRepository.save(payment);
        
        // Ghi log xác nhận thanh toán
        logPaymentAction(verifiedPayment, "VERIFIED", "ADMIN", 
            "Xác nhận thanh toán cho đơn hàng #" + order.getId() + 
            (note != null && !note.isEmpty() ? ". Ghi chú: " + note : ""));
        
        // Gửi email thông báo cho khách hàng
        sendPaymentConfirmationEmail(verifiedPayment);
        
        return verifiedPayment;
    }
    
    /**
     * Từ chối giao dịch
     */
    @Transactional
    public BankPayment rejectPayment(Long paymentId, String note) {
        Optional<BankPayment> paymentOpt = bankPaymentRepository.findById(paymentId);
        if (!paymentOpt.isPresent()) {
            throw new RuntimeException("Không tìm thấy giao dịch với ID: " + paymentId);
        }
        
        BankPayment payment = paymentOpt.get();
        
        // Cập nhật thông tin từ chối
        payment.setStatus(BankPayment.PaymentStatus.FAILED);
        payment.setVerifiedAt(LocalDateTime.now());
        payment.setVerificationNote(note);
        
        // Cập nhật trạng thái đơn hàng nếu cần
        Order order = payment.getOrder();
        if (order.getStatus() == Order.Status.PENDING) {
            // Chuyển trạng thái đơn hàng sang CANCELLED nếu thanh toán bị từ chối
            // Cập nhật trạng thái đơn hàng trực tiếp mà không điều chỉnh kho
            order.setStatus(Order.Status.CANCELLED);
            orderService.saveOrder(order);
            System.out.println("Đơn hàng #" + order.getId() + " đã được chuyển sang trạng thái CANCELLED do thanh toán bị từ chối (không điều chỉnh kho)");
        }
        
        // Lưu thông tin giao dịch
        BankPayment rejectedPayment = bankPaymentRepository.save(payment);
        
        // Ghi log từ chối thanh toán
        logPaymentAction(rejectedPayment, "REJECTED", "ADMIN", 
            "Từ chối thanh toán cho đơn hàng #" + payment.getOrder().getId() + 
            (note != null && !note.isEmpty() ? ". Lý do: " + note : ""));
        
        // Gửi email thông báo cho khách hàng
        sendPaymentRejectionEmail(rejectedPayment);
        
        return rejectedPayment;
    }
    
    /**
     * Lấy thông tin thanh toán của đơn hàng
     */
    public List<BankPayment> getPaymentsByOrderId(Long orderId) {
        return bankPaymentRepository.findByOrderId(orderId);
    }
    
    /**
     * Lấy giao dịch thanh toán mới nhất của đơn hàng
     */
    public Optional<BankPayment> getLatestPaymentByOrder(Order order) {
        return bankPaymentRepository.findTopByOrderOrderByCreatedAtDesc(order);
    }
    
    /**
     * Lấy danh sách giao dịch theo trạng thái
     */
    @Transactional(readOnly = true)
    public List<BankPayment> getPaymentsByStatus(BankPayment.PaymentStatus status) {
        // Use fetch join to eagerly load the Order to avoid LazyInitializationException
        List<BankPayment> payments = bankPaymentRepository.findByStatus(status);
        
        // Initialize lazy associations to avoid serialization issues
        for (BankPayment payment : payments) {
            if (payment.getOrder() != null) {
                payment.getOrder().getId(); // Access a property to initialize
            }
        }
        
        return payments;
    }
    
    /**
     * Tạo tài khoản ngân hàng mới
     */
    @Transactional
    public BankAccount createBankAccount(BankAccount bankAccount) {
        return bankAccountRepository.save(bankAccount);
    }
    
    /**
     * Cập nhật tài khoản ngân hàng
     */
    @Transactional
    public BankAccount updateBankAccount(Long accountId, BankAccount bankAccountDetails) {
        Optional<BankAccount> accountOpt = bankAccountRepository.findById(accountId);
        if (!accountOpt.isPresent()) {
            throw new RuntimeException("Không tìm thấy tài khoản ngân hàng với ID: " + accountId);
        }
        
        BankAccount account = accountOpt.get();
        
        account.setBankName(bankAccountDetails.getBankName());
        account.setAccountNumber(bankAccountDetails.getAccountNumber());
        account.setAccountName(bankAccountDetails.getAccountName());
        account.setBankBranch(bankAccountDetails.getBankBranch());
        account.setSwiftCode(bankAccountDetails.getSwiftCode());
        account.setQrCodeUrl(bankAccountDetails.getQrCodeUrl());
        account.setIsActive(bankAccountDetails.getIsActive());
        
        return bankAccountRepository.save(account);
    }
    
    /**
     * Vô hiệu hóa tài khoản ngân hàng
     */
    @Transactional
    public void disableBankAccount(Long accountId) {
        Optional<BankAccount> accountOpt = bankAccountRepository.findById(accountId);
        if (accountOpt.isPresent()) {
            BankAccount account = accountOpt.get();
            account.setIsActive(false);
            bankAccountRepository.save(account);
        }
    }
    
    /**
     * Tạo mã giao dịch ngẫu nhiên
     */
    private String generateTransactionCode() {
        return "TXN" + UUID.randomUUID().toString().replaceAll("-", "").substring(0, 8).toUpperCase();
    }
    
    /**
     * Lấy giao dịch thanh toán theo ID
     */
    public Optional<BankPayment> findById(Long paymentId) {
        return bankPaymentRepository.findById(paymentId);
    }
    
    /**
     * Ghi log hoạt động liên quan đến giao dịch thanh toán
     */
    private void logPaymentAction(BankPayment payment, String action, String performedBy, String notes) {
        PaymentLog log = new PaymentLog(payment, action, performedBy, notes);
        paymentLogRepository.save(log);
    }
    
    /**
     * Gửi email xác nhận thanh toán cho khách hàng
     */
    private void sendPaymentConfirmationEmail(BankPayment payment) {
        try {
            Order order = payment.getOrder();
            if (order != null && order.getUser() != null) {
                User user = order.getUser();
                String email = user.getEmail();
                String customerName = user.getFullName() != null ? user.getFullName() : user.getUsername();
                
                String subject = "Xác nhận thanh toán thành công cho đơn hàng #" + order.getId();
                
                StringBuilder content = new StringBuilder();
                content.append("<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">");
                content.append("<h2 style=\"color: #4CAF50;\">Thanh toán thành công</h2>");
                content.append("<p>Xin chào ").append(customerName).append(",</p>");
                content.append("<p>Chúng tôi xác nhận đã nhận được thanh toán của bạn cho đơn hàng <strong>#").append(order.getId()).append("</strong>.</p>");
                content.append("<p><strong>Thông tin thanh toán:</strong></p>");
                content.append("<ul>");
                content.append("<li>Mã đơn hàng: ").append(order.getId()).append("</li>");
                content.append("<li>Mã giao dịch: ").append(payment.getTransactionCode()).append("</li>");
                content.append("<li>Số tiền: ").append(formatCurrency(payment.getAmount())).append(" VNĐ</li>");
                content.append("<li>Thời gian xác nhận: ").append(formatDateTime(payment.getVerifiedAt())).append("</li>");
                content.append("<li>Phương thức thanh toán: Chuyển khoản ngân hàng</li>");
                content.append("</ul>");
                
                content.append("<p>Đơn hàng của bạn sẽ được giao trong thời gian sớm nhất.</p>");
                content.append("<p>Bạn có thể theo dõi trạng thái đơn hàng tại <a href=\"http://localhost:3000/account?tab=orders\">đây</a>.</p>");
                content.append("<p>Cảm ơn bạn đã mua sắm cùng chúng tôi!</p>");
                content.append("<p>Trân trọng,<br>CD Web Shop</p>");
                content.append("</div>");
                
                emailService.sendEmail(email, subject, content.toString());
            }
        } catch (MessagingException e) {
            // Log the error but don't throw exception to avoid disrupting the transaction
            System.err.println("Failed to send payment confirmation email: " + e.getMessage());
        }
    }
    
    /**
     * Gửi email thông báo từ chối thanh toán cho khách hàng
     */
    private void sendPaymentRejectionEmail(BankPayment payment) {
        try {
            Order order = payment.getOrder();
            if (order != null && order.getUser() != null) {
                User user = order.getUser();
                String email = user.getEmail();
                
                String subject = "Thông báo về thanh toán đơn hàng #" + order.getId();
                
                String content = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">"
                    + "<h2 style=\"color: #f44336;\">Thanh toán không thành công</h2>"
                    + "<p>Xin chào " + user.getFullName() + ",</p>"
                    + "<p>Chúng tôi rất tiếc phải thông báo rằng thanh toán của bạn cho đơn hàng <strong>#" + order.getId() + "</strong> chưa được xác nhận.</p>"
                    + "<p><strong>Thông tin thanh toán:</strong></p>"
                    + "<ul>"
                    + "<li>Mã giao dịch: " + payment.getTransactionCode() + "</li>"
                    + "<li>Số tiền: " + formatCurrency(payment.getAmount()) + " VNĐ</li>"
                    + "<li>Thời gian: " + formatDateTime(payment.getVerifiedAt()) + "</li>"
                    + "</ul>"
                    + "<p><strong>Lý do:</strong> " + (payment.getVerificationNote() != null ? payment.getVerificationNote() : "Không tìm thấy giao dịch thanh toán") + "</p>"
                    + "<p>Vui lòng kiểm tra lại thông tin chuyển khoản hoặc liên hệ với chúng tôi để được hỗ trợ.</p>"
                    + "<p>Bạn có thể thực hiện lại thanh toán tại <a href=\"http://localhost:3000/account\">đây</a>.</p>"
                    + "<p>Cảm ơn bạn đã mua sắm cùng chúng tôi!</p>"
                    + "<p>Trân trọng,<br>CD Web Shop</p>"
                    + "</div>";
                
                emailService.sendEmail(email, subject, content);
            }
        } catch (MessagingException e) {
            System.err.println("Failed to send payment rejection email: " + e.getMessage());
        }
    }
    
    /**
     * Format số tiền thành định dạng tiền tệ
     */
    private String formatCurrency(Double amount) {
        if (amount == null) return "0";
        return String.format("%,.0f", amount);
    }
    
    /**
     * Format thời gian
     */
    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return "N/A";
        return dateTime.format(DATE_FORMATTER);
    }
    
    /**
     * Lấy lịch sử log của một giao dịch
     */
    public List<PaymentLog> getPaymentLogs(Long paymentId) {
        Optional<BankPayment> paymentOpt = bankPaymentRepository.findById(paymentId);
        if (!paymentOpt.isPresent()) {
            throw new RuntimeException("Không tìm thấy giao dịch với ID: " + paymentId);
        }
        
        return paymentLogRepository.findByPayment(paymentOpt.get());
    }
    
    /**
     * Lấy lịch sử log thanh toán của một đơn hàng
     */
    public List<PaymentLog> getOrderPaymentLogs(Long orderId) {
        return paymentLogRepository.findByOrderIdOrderByTimestampDesc(orderId);
    }
    
    /**
     * Khởi tạo tài khoản ngân hàng mặc định nếu chưa có
     * Phương thức này có thể được gọi thủ công khi cần thiết, không tự động chạy khi khởi động
     */
    @Transactional
    public void initializeBankAccounts() {
        // Kiểm tra xem đã có tài khoản nào chưa
        if (getAllActiveBankAccounts().isEmpty()) {
            // Tạo tài khoản Vietcombank
            BankAccount vietcombank = new BankAccount();
            vietcombank.setBankName("Vietcombank");
            vietcombank.setAccountNumber("1234567890");
            vietcombank.setAccountName("CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ ABC");
            vietcombank.setBankBranch("Chi nhánh Hà Nội");
            vietcombank.setSwiftCode("BFTVVNVX");
            vietcombank.setIsActive(true);
            createBankAccount(vietcombank);
            
            // Tạo tài khoản Techcombank
            BankAccount techcombank = new BankAccount();
            techcombank.setBankName("Techcombank");
            techcombank.setAccountNumber("9876543210");
            techcombank.setAccountName("CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ ABC");
            techcombank.setBankBranch("Chi nhánh Hồ Chí Minh");
            techcombank.setSwiftCode("VTCBVNVX");
            techcombank.setIsActive(true);
            createBankAccount(techcombank);
            
            System.out.println("Đã khởi tạo các tài khoản ngân hàng mặc định");
        }
    }
} 