package com.example.BackEndSpring.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "discount_codes")
public class DiscountCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;

    @Column(nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false)
    private DiscountType discountType = DiscountType.PERCENTAGE;

    // Value can be percentage or fixed amount
    @Column(name = "discount_value", nullable = false)
    private BigDecimal discountValue = BigDecimal.ZERO;
    
    // This is to handle the value column
    @Column(name = "value", nullable = false)
    private BigDecimal value = BigDecimal.ZERO;

    // Optional minimum purchase amount
    @Column(name = "min_order_value", nullable = false)
    private BigDecimal minimumPurchaseAmount = BigDecimal.ZERO;

    // Maximum discount amount (for percentage discounts)
    @Column(name = "max_discount_amount", nullable = false)
    private BigDecimal maximumDiscountAmount = BigDecimal.ZERO;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate = LocalDateTime.now();

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate = LocalDateTime.now().plusMonths(1);

    // Maximum number of times this code can be used
    @Column(name = "usage_limit", nullable = false)
    private Integer maxUsage = 0;

    // Number of times this code has been used
    @Column(name = "usage_count", nullable = false)
    private Integer usageCount = 0;

    @Column(nullable = false)
    private boolean active = true;

    // Whether the discount code can be used only once per user
    @Column(name = "one_time_per_user", nullable = false)
    private boolean oneTimePerUser = false;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Getter nâng cao để đảm bảo không bao giờ trả về null
    public BigDecimal getValue() {
        if (value != null) {
            return value;
        }
        if (discountValue != null) {
            return discountValue;
        }
        return BigDecimal.ZERO;
    }
    
    // Override setter to keep both fields in sync
    public void setValue(BigDecimal newValue) {
        this.value = newValue != null ? newValue : BigDecimal.ZERO;
        this.discountValue = this.value;
    }
    
    // Add getter and setter for discountValue that keeps both in sync
    public BigDecimal getDiscountValue() {
        return getValue();
    }
    
    public void setDiscountValue(BigDecimal newValue) {
        setValue(newValue);
    }
    
    public BigDecimal getMinimumPurchaseAmount() {
        return minimumPurchaseAmount != null ? minimumPurchaseAmount : BigDecimal.ZERO;
    }
    
    public BigDecimal getMaximumDiscountAmount() {
        return maximumDiscountAmount != null ? maximumDiscountAmount : BigDecimal.ZERO;
    }
    
    public Integer getUsageCount() {
        return usageCount != null ? usageCount : 0;
    }

    public Integer getMaxUsage() {
        return maxUsage != null ? maxUsage : 0;
    }

    public boolean isOneTimePerUser() {
        return oneTimePerUser;
    }

    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        return active 
                && (now.isEqual(startDate) || now.isAfter(startDate)) 
                && now.isBefore(endDate) 
                && (getMaxUsage() == 0 || getUsageCount() < getMaxUsage());
    }

    public enum DiscountType {
        PERCENTAGE,
        FIXED_AMOUNT
    }

    @PostLoad
    public void postLoad() {
        // This method is called after the entity is loaded from the database
        // You can use this method to synchronize the two value fields
        if (value == null && discountValue != null) {
            value = discountValue;
        }
    }
} 