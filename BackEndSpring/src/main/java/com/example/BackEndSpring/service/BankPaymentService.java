package com.example.BackEndSpring.service;

import com.example.BackEndSpring.model.BankAccount;
import com.example.BackEndSpring.model.BankPayment;
import com.example.BackEndSpring.model.Order;
import com.example.BackEndSpring.repository.BankAccountRepository;
import com.example.BackEndSpring.repository.BankPaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
    private OrderService orderService;
    
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
        if (!"COD".equals(order.getPaymentMethod()) && !"Bank Transfer".equals(order.getPaymentMethod())) {
            throw new RuntimeException("Phương thức thanh toán không hợp lệ, không thể thanh toán qua ngân hàng");
        }
        
        // Cập nhật thông tin đơn hàng
        order.setPaymentMethod("Bank Transfer");
        orderService.updateOrderStatus(orderId, Order.Status.PROCESSING);
        
        // Thiết lập thông tin giao dịch
        bankPayment.setOrder(order);
        bankPayment.setAmount(order.getTotalAmount());
        bankPayment.setStatus(BankPayment.PaymentStatus.PENDING);
        
        // Tạo mã giao dịch nếu chưa có
        if (bankPayment.getTransactionCode() == null || bankPayment.getTransactionCode().isEmpty()) {
            bankPayment.setTransactionCode(generateTransactionCode());
        }
        
        return bankPaymentRepository.save(bankPayment);
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
            orderService.updateOrderStatus(order.getId(), Order.Status.PROCESSING);
        }
        
        return bankPaymentRepository.save(payment);
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
        
        return bankPaymentRepository.save(payment);
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
    public List<BankPayment> getPaymentsByStatus(BankPayment.PaymentStatus status) {
        return bankPaymentRepository.findByStatus(status);
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