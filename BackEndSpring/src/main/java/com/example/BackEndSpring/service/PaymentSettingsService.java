package com.example.BackEndSpring.service;

import com.example.BackEndSpring.model.PaymentSettings;
import com.example.BackEndSpring.repository.PaymentSettingsRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class PaymentSettingsService {

    private final PaymentSettingsRepository paymentSettingsRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public PaymentSettingsService(PaymentSettingsRepository paymentSettingsRepository, ObjectMapper objectMapper) {
        this.paymentSettingsRepository = paymentSettingsRepository;
        this.objectMapper = objectMapper;
    }

    public PaymentSettings getSettings() {
        PaymentSettings settings = paymentSettingsRepository.findFirstByOrderByIdDesc();
        if (settings == null) {
            // Nếu chưa có cài đặt, tạo cài đặt mặc định
            settings = new PaymentSettings();
            settings = paymentSettingsRepository.save(settings);
        }
        return settings;
    }

    public PaymentSettings saveSettings(PaymentSettings settings) {
        return paymentSettingsRepository.save(settings);
    }

    public Map<String, Object> getCreditCardSettings() {
        PaymentSettings settings = getSettings();
        Map<String, Object> creditCardSettings = new HashMap<>();
        
        creditCardSettings.put("enabled", settings.getPaymentMethods().stream()
                .anyMatch(method -> "credit".equals(method.getId()) && method.isEnabled()));
        
        creditCardSettings.put("providerName", settings.getCreditCardProvider());
        creditCardSettings.put("publicKey", settings.getPublicKey());
        creditCardSettings.put("testMode", settings.isTestMode());
        creditCardSettings.put("supportedCards", settings.getSupportedCards());
        creditCardSettings.put("currency", settings.getCurrency());
        
        // Nếu là VNPAY, thêm một số thông tin cần thiết
        if ("VNPAY".equals(settings.getCreditCardProvider())) {
            creditCardSettings.put("vnpTmnCode", settings.getVnpTmnCode());
            creditCardSettings.put("vnpPayUrl", settings.getVnpPayUrl());
            // Không trả về vnpHashSecret vì lý do bảo mật
        }
        
        // Secret key không được trả về client
        
        return creditCardSettings;
    }
    
    // Lấy cấu hình VNPAY
    public Map<String, String> getVNPayConfig() {
        Map<String, String> vnpayConfig = new HashMap<>();
        
        // Lấy cấu hình từ DB
        PaymentSettings settings = paymentSettingsRepository.findById(1L)
            .orElse(new PaymentSettings());
        
        boolean isProduction = settings.isVnpProduction(); // Thêm trường isVnpProduction vào DB
        
        // Terminal ID
        String tmnCode = settings.getVnpTmnCode();
        if (tmnCode == null || tmnCode.isEmpty()) {
            // Sử dụng TMN mặc định tùy theo môi trường
            tmnCode = isProduction ? "YOUR_PRODUCTION_TMN_CODE" : "TX30V45K";
            System.out.println("Using default TMN Code: " + tmnCode);
        }
        vnpayConfig.put("vnp_TmnCode", tmnCode);
        
        // Hash Secret 
        String hashSecret = settings.getVnpHashSecret();
        if (hashSecret == null || hashSecret.isEmpty()) {
            // Sử dụng Secret mặc định tùy theo môi trường
            hashSecret = isProduction ? "YOUR_PRODUCTION_HASH_SECRET" : "Y8WNT38V7MHWL0NZNRHYMTUCBDAELILN";
            System.out.println("Using default Hash Secret: " + hashSecret);
        }
        vnpayConfig.put("vnp_HashSecret", hashSecret);
        
        // Payment URL
        String payUrl = settings.getVnpPayUrl();
        if (payUrl == null || payUrl.isEmpty()) {
            // Sử dụng URL mặc định tùy theo môi trường
            payUrl = isProduction ? "https://pay.vnpay.vn/vpcpay.html" : "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
            System.out.println("Using default Pay URL: " + payUrl);
        }
        vnpayConfig.put("vnp_PayUrl", payUrl);
        
        // Return URL
        String returnUrl = settings.getVnpReturnUrl();
        if (returnUrl == null || returnUrl.isEmpty()) {
            // URL trả về chính xác (phải truy cập được từ internet nếu là production)
            returnUrl = isProduction ? "https://your-domain.com/payment/vnpay-return" : "http://localhost:3000/payment/vnpay-return";
            System.out.println("Using default Return URL: " + returnUrl);
        } else if (!returnUrl.contains("://")) {
            returnUrl = (isProduction ? "https://your-domain.com" : "http://localhost:3000") + (returnUrl.startsWith("/") ? "" : "/") + returnUrl;
            System.out.println("Fixed Return URL: " + returnUrl);
        }
        vnpayConfig.put("vnp_ReturnUrl", returnUrl);
        
        // API URL
        String apiUrl = settings.getVnpApiUrl();
        if (apiUrl == null || apiUrl.isEmpty()) {
            // API URL cho các chức năng query giao dịch
            apiUrl = isProduction ? "https://merchant.vnpay.vn/merchant_webapi/api/transaction" : "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction";
            System.out.println("Using default API URL: " + apiUrl);
        }
        vnpayConfig.put("vnp_ApiUrl", apiUrl);
        
        return vnpayConfig;
    }
} 