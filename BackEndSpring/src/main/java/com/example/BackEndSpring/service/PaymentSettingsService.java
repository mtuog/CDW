package com.example.BackEndSpring.service;

import com.example.BackEndSpring.model.PaymentSettings;
import com.example.BackEndSpring.repository.PaymentSettingsRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

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
    
    // Lấy cấu hình VNPAY đầy đủ (chỉ dành cho admin)
    public Map<String, Object> getVNPaySettings() {
        PaymentSettings settings = getSettings();
        Map<String, Object> vnpayConfig = new HashMap<>();
        
        vnpayConfig.put("vnpTmnCode", settings.getVnpTmnCode());
        // Che giấu vnpHashSecret - chỉ hiển thị thông tin có hash secret hay không
        vnpayConfig.put("hasSecretKey", settings.getVnpHashSecret() != null && !settings.getVnpHashSecret().isEmpty());
        vnpayConfig.put("vnpHashSecret", settings.getVnpHashSecret());
        vnpayConfig.put("vnpPayUrl", settings.getVnpPayUrl());
        vnpayConfig.put("vnpReturnUrl", settings.getVnpReturnUrl());
        vnpayConfig.put("vnpApiUrl", settings.getVnpApiUrl());
        vnpayConfig.put("testMode", settings.isTestMode());
        vnpayConfig.put("vnpProduction", settings.isVnpProduction());
        
        return vnpayConfig;
    }
    
    // Lấy cấu hình VNPAY dưới dạng Map<String, String> cho tương thích với code cũ
    public Map<String, String> getVNPayConfig() {
        PaymentSettings settings = getSettings();
        Map<String, String> vnpayConfig = new HashMap<>();
        
        vnpayConfig.put("vnp_TmnCode", settings.getVnpTmnCode());
        vnpayConfig.put("vnp_HashSecret", settings.getVnpHashSecret());
        vnpayConfig.put("vnp_PayUrl", settings.getVnpPayUrl());
        vnpayConfig.put("vnp_ReturnUrl", settings.getVnpReturnUrl());
        vnpayConfig.put("vnp_ApiUrl", settings.getVnpApiUrl());
        
        return vnpayConfig;
    }
    
    // Lấy danh sách phương thức thanh toán khả dụng cho người dùng
    public List<Map<String, Object>> getAvailablePaymentMethods() {
        PaymentSettings settings = getSettings();
        
        if (settings.getPaymentMethods() == null || settings.getPaymentMethods().isEmpty()) {
            return new ArrayList<>();
        }
        
        return settings.getPaymentMethods().stream()
            .filter(method -> method.isEnabled())
            .map(method -> {
                Map<String, Object> methodInfo = new HashMap<>();
                methodInfo.put("id", method.getId());
                methodInfo.put("name", method.getName());
                methodInfo.put("description", method.getDescription());
                methodInfo.put("fee", method.getFee());
                methodInfo.put("icon", method.getIcon());
                return methodInfo;
            })
            .collect(Collectors.toList());
    }

    /**
     * Lấy cài đặt chuyển khoản ngân hàng
     * @return Map chứa cài đặt chuyển khoản
     */
    public Map<String, Object> getBankTransferSettings() {
        PaymentSettings settings = getSettings();
        Map<String, Object> bankTransferConfig = new HashMap<>();
        
        // Đặt các giá trị mặc định nếu chưa có trong settings
        bankTransferConfig.put("accountName", "FASHION STORE JSC");
        bankTransferConfig.put("accountNumber", "1234567890");
        bankTransferConfig.put("bankName", "Vietcombank");
        bankTransferConfig.put("bankBranch", "Hồ Chí Minh");
        bankTransferConfig.put("instructions", settings.getBankTransferInstructions() != null ? 
                settings.getBankTransferInstructions() : 
                "Vui lòng chuyển khoản với nội dung: [Mã đơn hàng]");
        
        return bankTransferConfig;
    }
    
    /**
     * Lấy cài đặt chung về thanh toán
     * @return Map chứa cài đặt chung
     */
    public Map<String, Object> getGeneralSettings() {
        PaymentSettings settings = getSettings();
        Map<String, Object> generalConfig = new HashMap<>();
        
        generalConfig.put("defaultPaymentMethod", settings.getDefaultPaymentMethod());
        generalConfig.put("showPaymentIcons", settings.isShowPaymentIcons());
        generalConfig.put("enablePaymentFees", settings.isEnablePaymentFees());
        generalConfig.put("orderConfirmationRequired", settings.isOrderConfirmationRequired());
        generalConfig.put("pendingOrderTimeout", settings.getPendingOrderTimeout());
        
        return generalConfig;
    }
} 