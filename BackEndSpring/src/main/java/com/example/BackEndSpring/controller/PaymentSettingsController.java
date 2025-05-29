package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.model.PaymentSettings;
import com.example.BackEndSpring.model.PaymentMethod;
import com.example.BackEndSpring.service.PaymentSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment-settings")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"}, allowCredentials = "true")
public class PaymentSettingsController {

    private final PaymentSettingsService paymentSettingsService;

    @Autowired
    public PaymentSettingsController(PaymentSettingsService paymentSettingsService) {
        this.paymentSettingsService = paymentSettingsService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentSettings> getSettings() {
        return ResponseEntity.ok(paymentSettingsService.getSettings());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentSettings> saveSettings(@RequestBody PaymentSettings settings) {
        // Xóa trường secretKey nếu nó là chuỗi rỗng để không ghi đè lên giá trị đã lưu
        if (settings.getSecretKey() != null && settings.getSecretKey().trim().isEmpty()) {
            PaymentSettings existingSettings = paymentSettingsService.getSettings();
            settings.setSecretKey(existingSettings.getSecretKey());
        }
        
        return ResponseEntity.ok(paymentSettingsService.saveSettings(settings));
    }

    // Endpoint cho frontend để lấy thông tin cấu hình thanh toán thẻ (không yêu cầu quyền admin)
    @GetMapping("/credit-card")
    public ResponseEntity<Map<String, Object>> getCreditCardSettings() {
        return ResponseEntity.ok(paymentSettingsService.getCreditCardSettings());
    }
    
    /**
     * Lấy danh sách các phương thức thanh toán đã được kích hoạt (cho người dùng)
     */
    @GetMapping("/available-methods")
    public ResponseEntity<?> getAvailablePaymentMethods() {
        try {
            List<Map<String, Object>> methods = paymentSettingsService.getAvailablePaymentMethods();
            return ResponseEntity.ok(methods);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Không thể lấy phương thức thanh toán", "message", e.getMessage()));
        }
    }

    /**
     * Lấy cấu hình VNPAY (cho người dùng - chỉ lấy thông tin công khai)
     */
    @GetMapping("/vnpay-config")
    public ResponseEntity<?> getVnpayConfig() {
        try {
            Map<String, Object> config = paymentSettingsService.getVNPaySettings();
            
            // Loại bỏ các thông tin nhạy cảm
            Map<String, Object> publicConfig = new HashMap<>();
            publicConfig.put("vnpTmnCode", config.get("vnpTmnCode"));
            publicConfig.put("vnpPayUrl", config.get("vnpPayUrl"));
            publicConfig.put("vnpReturnUrl", config.get("vnpReturnUrl"));
            publicConfig.put("testMode", config.get("testMode"));
            
            return ResponseEntity.ok(publicConfig);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Không thể lấy cấu hình VNPAY", "message", e.getMessage()));
        }
    }

    /**
     * Lấy cấu hình thanh toán chuyển khoản ngân hàng (cho người dùng)
     */
    @GetMapping("/bank-transfer-config")
    public ResponseEntity<?> getBankTransferConfig() {
        try {
            Map<String, Object> config = paymentSettingsService.getBankTransferSettings();
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Không thể lấy cấu hình chuyển khoản", "message", e.getMessage()));
        }
    }

    /**
     * Endpoint để lấy cài đặt chung về thanh toán (cho người dùng)
     */
    @GetMapping("/general-config")
    public ResponseEntity<?> getGeneralConfig() {
        try {
            Map<String, Object> config = paymentSettingsService.getGeneralSettings();
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Không thể lấy cài đặt chung", "message", e.getMessage()));
        }
    }
} 