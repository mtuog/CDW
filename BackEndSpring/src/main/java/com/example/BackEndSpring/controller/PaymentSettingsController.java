package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.model.PaymentSettings;
import com.example.BackEndSpring.service.PaymentSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment-settings")
@CrossOrigin(origins = "*", maxAge = 3600)
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
} 