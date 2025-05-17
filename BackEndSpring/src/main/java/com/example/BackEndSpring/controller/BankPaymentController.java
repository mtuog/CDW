package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.model.BankAccount;
import com.example.BackEndSpring.model.BankPayment;
import com.example.BackEndSpring.model.Order;
import com.example.BackEndSpring.service.BankPaymentService;
import com.example.BackEndSpring.service.OrderService;
import com.example.BackEndSpring.service.VietQRService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"}, allowCredentials = "true",
        allowedHeaders = {"authorization", "content-type", "x-auth-token", "origin", "x-requested-with", "accept"},
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RestController
@RequestMapping("/api/bank-payments")
@Tag(name = "Bank Payment Controller", description = "API để quản lý thanh toán qua ngân hàng")
public class BankPaymentController {

    @Autowired
    private BankPaymentService bankPaymentService;
    
    @Autowired
    private OrderService orderService;
    
    @Autowired
    private VietQRService vietQRService;
    
    @Operation(summary = "Lấy danh sách tài khoản ngân hàng hoạt động")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @GetMapping("/accounts")
    public ResponseEntity<List<BankAccount>> getActiveBankAccounts() {
        List<BankAccount> accounts = bankPaymentService.getAllActiveBankAccounts();
        return ResponseEntity.ok(accounts);
    }
    
    @Operation(summary = "Tạo yêu cầu thanh toán qua ngân hàng")
    @ApiResponse(responseCode = "201", description = "Tạo yêu cầu thanh toán thành công")
    @PostMapping("/orders/{orderId}")
    public ResponseEntity<?> createBankPayment(
            @PathVariable Long orderId,
            @RequestBody BankPayment bankPayment) {
        try {
            BankPayment createdPayment = bankPaymentService.createBankPayment(orderId, bankPayment);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdPayment);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @Operation(summary = "Lấy thông tin thanh toán của đơn hàng")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @GetMapping("/orders/{orderId}")
    public ResponseEntity<?> getOrderPayments(@PathVariable Long orderId) {
        Optional<Order> orderOpt = orderService.getOrderById(orderId);
        if (!orderOpt.isPresent()) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Không tìm thấy đơn hàng với ID: " + orderId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
        
        List<BankPayment> payments = bankPaymentService.getPaymentsByOrderId(orderId);
        return ResponseEntity.ok(payments);
    }
    
    @Operation(summary = "Lấy thông tin chi tiết giao dịch thanh toán")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @GetMapping("/{paymentId}")
    public ResponseEntity<?> getPaymentDetails(@PathVariable Long paymentId) {
        Optional<BankPayment> paymentOpt = bankPaymentService.findById(paymentId);
        if (!paymentOpt.isPresent()) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Không tìm thấy giao dịch với ID: " + paymentId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
        
        return ResponseEntity.ok(paymentOpt.get());
    }
    
    @Operation(summary = "Xác nhận giao dịch thanh toán")
    @ApiResponse(responseCode = "200", description = "Xác nhận thành công")
    @PutMapping("/{paymentId}/verify")
    public ResponseEntity<?> verifyPayment(
            @PathVariable Long paymentId,
            @RequestParam(required = false) String transactionCode,
            @RequestParam(required = false) String note) {
        try {
            BankPayment verifiedPayment = bankPaymentService.verifyPayment(paymentId, transactionCode, note);
            return ResponseEntity.ok(verifiedPayment);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @Operation(summary = "Từ chối giao dịch thanh toán")
    @ApiResponse(responseCode = "200", description = "Từ chối thành công")
    @PutMapping("/{paymentId}/reject")
    public ResponseEntity<?> rejectPayment(
            @PathVariable Long paymentId,
            @RequestParam(required = false) String note) {
        try {
            BankPayment rejectedPayment = bankPaymentService.rejectPayment(paymentId, note);
            return ResponseEntity.ok(rejectedPayment);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @Operation(summary = "Lấy danh sách giao dịch thanh toán theo trạng thái")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @GetMapping("/status/{status}")
    public ResponseEntity<List<BankPayment>> getPaymentsByStatus(@PathVariable String status) {
        try {
            BankPayment.PaymentStatus paymentStatus = BankPayment.PaymentStatus.valueOf(status.toUpperCase());
            List<BankPayment> payments = bankPaymentService.getPaymentsByStatus(paymentStatus);
            return ResponseEntity.ok(payments);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @Operation(summary = "Tạo tài khoản ngân hàng mới")
    @ApiResponse(responseCode = "201", description = "Tạo tài khoản thành công")
    @PostMapping("/accounts")
    public ResponseEntity<BankAccount> createBankAccount(@RequestBody BankAccount bankAccount) {
        BankAccount createdAccount = bankPaymentService.createBankAccount(bankAccount);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdAccount);
    }
    
    @Operation(summary = "Cập nhật tài khoản ngân hàng")
    @ApiResponse(responseCode = "200", description = "Cập nhật thành công")
    @PutMapping("/accounts/{accountId}")
    public ResponseEntity<?> updateBankAccount(
            @PathVariable Long accountId,
            @RequestBody BankAccount bankAccount) {
        try {
            BankAccount updatedAccount = bankPaymentService.updateBankAccount(accountId, bankAccount);
            return ResponseEntity.ok(updatedAccount);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
    
    @Operation(summary = "Vô hiệu hóa tài khoản ngân hàng")
    @ApiResponse(responseCode = "204", description = "Vô hiệu hóa thành công")
    @DeleteMapping("/accounts/{accountId}")
    public ResponseEntity<Void> disableBankAccount(@PathVariable Long accountId) {
        bankPaymentService.disableBankAccount(accountId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/bank-codes")
    public ResponseEntity<Map<String, String>> getBankCodes() {
        return ResponseEntity.ok(vietQRService.getBankCodes());
    }
    
    @PostMapping("/generate-qr")
    public ResponseEntity<Map<String, String>> generateVietQR(@RequestBody Map<String, Object> request) {
        try {
            String bankId = (String) request.get("bankId");
            String accountNo = (String) request.get("accountNo");
            String accountName = (String) request.get("accountName");
            Long amount = null;
            
            if (request.containsKey("amount") && request.get("amount") != null) {
                if (request.get("amount") instanceof Integer) {
                    amount = ((Integer) request.get("amount")).longValue();
                } else if (request.get("amount") instanceof Long) {
                    amount = (Long) request.get("amount");
                } else if (request.get("amount") instanceof String) {
                    amount = Long.parseLong((String) request.get("amount"));
                }
            }
            
            String description = (String) request.get("description");
            
            // Validate required fields
            if (bankId == null || accountNo == null) {
                return ResponseEntity.badRequest().body(
                    Map.of("error", "Thiếu thông tin bắt buộc (bankId, accountNo)")
                );
            }
            
            String qrUrl = vietQRService.generateVietQRUrl(
                bankId, accountNo, accountName, amount, description
            );
            
            Map<String, String> response = new HashMap<>();
            response.put("qrUrl", qrUrl);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Không thể tạo mã QR: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
} 