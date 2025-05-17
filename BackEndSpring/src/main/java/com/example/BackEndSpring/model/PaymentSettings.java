package com.example.BackEndSpring.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "payment_settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PaymentSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Cài đặt chung
    private String defaultPaymentMethod = "cod"; // cod, bank, credit
    private boolean showPaymentIcons = true;
    private boolean enablePaymentFees = false;
    private boolean orderConfirmationRequired = true;
    private int pendingOrderTimeout = 24; // hours

    // Cài đặt payment methods
    @ElementCollection
    @CollectionTable(name = "payment_methods", joinColumns = @JoinColumn(name = "settings_id"))
    private List<PaymentMethod> paymentMethods;

    // Cài đặt thẻ tín dụng
    private String creditCardProvider = "Stripe"; // Stripe, VNPAY, PayPal
    private String publicKey;
    private String secretKey;
    
    // Cấu hình VNPAY
    private String vnpTmnCode; // Terminal ID / Merchant ID từ VNPAY
    private String vnpHashSecret; // Secret Key / Hash Key từ VNPAY
    private String vnpPayUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"; // URL thanh toán
    private String vnpReturnUrl; // URL return sau khi thanh toán
    private String vnpApiUrl = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"; // URL truy vấn kết quả giao dịch
    
    @Column(columnDefinition = "TEXT")
    private String additionalConfig; // Store JSON for any additional provider-specific config
    
    private boolean testMode = true;
    
    @ElementCollection
    private List<String> supportedCards; // visa, mastercard, etc.
    
    private String currency = "VND";
    private boolean autoCapture = true;

    // Cài đặt bank transfer
    @Column(columnDefinition = "TEXT")
    private String bankTransferInstructions;

    // Timestamps
    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private boolean vnpProduction;

    public boolean isVnpProduction() {
        return vnpProduction;
    }

    public void setVnpProduction(boolean vnpProduction) {
        this.vnpProduction = vnpProduction;
    }
} 