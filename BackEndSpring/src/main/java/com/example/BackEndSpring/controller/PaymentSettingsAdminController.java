package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.model.PaymentSettings;
import com.example.BackEndSpring.service.PaymentSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/admin/payment-settings")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"}, allowCredentials = "true")
public class PaymentSettingsAdminController {

    private final PaymentSettingsService paymentSettingsService;

    @Autowired
    public PaymentSettingsAdminController(PaymentSettingsService paymentSettingsService) {
        this.paymentSettingsService = paymentSettingsService;
    }

    // Lấy tất cả thông tin cài đặt thanh toán (chỉ admin)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentSettings> getSettings() {
        // Debug authentication
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("=== DEBUG GET SETTINGS ===");
        System.out.println("Authentication: " + auth);
        if (auth != null) {
            System.out.println("Principal: " + auth.getPrincipal());
            System.out.println("Authorities: " + auth.getAuthorities());
            System.out.println("Is authenticated: " + auth.isAuthenticated());
        }
        
        return ResponseEntity.ok(paymentSettingsService.getSettings());
    }

    // Lưu cài đặt thanh toán (chỉ admin)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentSettings> saveSettings(@RequestBody PaymentSettings settings) {
        try {
            System.out.println("=== ADMIN SAVE PAYMENT SETTINGS ===");
            System.out.println("Received settings: " + settings.getDefaultPaymentMethod());
            System.out.println("Payment methods count: " + (settings.getPaymentMethods() != null ? settings.getPaymentMethods().size() : "null"));
            
            // Xóa trường secretKey nếu nó là chuỗi rỗng để không ghi đè lên giá trị đã lưu
            if (settings.getSecretKey() != null && settings.getSecretKey().trim().isEmpty()) {
                PaymentSettings existingSettings = paymentSettingsService.getSettings();
                settings.setSecretKey(existingSettings.getSecretKey());
                System.out.println("Kept existing secret key");
            }
            
            // Xử lý tương tự cho vnpHashSecret
            if (settings.getVnpHashSecret() != null && settings.getVnpHashSecret().trim().isEmpty()) {
                PaymentSettings existingSettings = paymentSettingsService.getSettings();
                settings.setVnpHashSecret(existingSettings.getVnpHashSecret());
                System.out.println("Kept existing VNP hash secret");
            }
            
            PaymentSettings savedSettings = paymentSettingsService.saveSettings(settings);
            System.out.println("✅ PAYMENT SETTINGS SAVED SUCCESSFULLY - ID: " + savedSettings.getId());
            
            return ResponseEntity.ok(savedSettings);
        } catch (Exception e) {
            System.err.println("❌ ERROR SAVING PAYMENT SETTINGS: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    // Lấy cấu hình VNPAY (chỉ admin)
    @GetMapping("/vnpay")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getVnpaySettings() {
        Map<String, Object> settings = paymentSettingsService.getVNPaySettings();
        return ResponseEntity.ok(settings);
    }
    
    // Cập nhật cấu hình VNPAY (chỉ admin)
    @PostMapping("/vnpay")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> saveVnpaySettings(@RequestBody Map<String, Object> vnpaySettings) {
        PaymentSettings existingSettings = paymentSettingsService.getSettings();
        
        // Cập nhật các cài đặt VNPAY
        if (vnpaySettings.containsKey("vnpTmnCode")) {
            existingSettings.setVnpTmnCode((String) vnpaySettings.get("vnpTmnCode"));
        }
        
        if (vnpaySettings.containsKey("vnpHashSecret") && vnpaySettings.get("vnpHashSecret") != null) {
            String secretKey = (String) vnpaySettings.get("vnpHashSecret");
            if (!secretKey.trim().isEmpty()) {
                existingSettings.setVnpHashSecret(secretKey);
            }
        }
        
        if (vnpaySettings.containsKey("vnpPayUrl")) {
            existingSettings.setVnpPayUrl((String) vnpaySettings.get("vnpPayUrl"));
        }
        
        if (vnpaySettings.containsKey("vnpReturnUrl")) {
            existingSettings.setVnpReturnUrl((String) vnpaySettings.get("vnpReturnUrl"));
        }
        
        if (vnpaySettings.containsKey("vnpApiUrl")) {
            existingSettings.setVnpApiUrl((String) vnpaySettings.get("vnpApiUrl"));
        }
        
        if (vnpaySettings.containsKey("testMode")) {
            existingSettings.setTestMode((Boolean) vnpaySettings.get("testMode"));
        }
        
        if (vnpaySettings.containsKey("vnpProduction")) {
            existingSettings.setVnpProduction((Boolean) vnpaySettings.get("vnpProduction"));
        }
        
        // Lưu cài đặt
        paymentSettingsService.saveSettings(existingSettings);
        
        // Trả về cài đặt đã cập nhật
        return ResponseEntity.ok(paymentSettingsService.getVNPaySettings());
    }
} 