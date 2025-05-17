package com.example.BackEndSpring.dto;

import com.example.BackEndSpring.model.DiscountCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscountCodeDTO {
    
    private Long id;
    private String code;
    private String description;
    private DiscountCode.DiscountType discountType;
    private BigDecimal value;
    private BigDecimal minimumPurchaseAmount;
    private BigDecimal maximumDiscountAmount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer maxUsage;
    private Integer usageCount;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isValid;
    private boolean oneTimePerUser;
    
    public static DiscountCodeDTO fromEntity(DiscountCode discountCode) {
        return DiscountCodeDTO.builder()
                .id(discountCode.getId())
                .code(discountCode.getCode())
                .description(discountCode.getDescription())
                .discountType(discountCode.getDiscountType())
                .value(discountCode.getValue())
                .minimumPurchaseAmount(discountCode.getMinimumPurchaseAmount())
                .maximumDiscountAmount(discountCode.getMaximumDiscountAmount())
                .startDate(discountCode.getStartDate())
                .endDate(discountCode.getEndDate())
                .maxUsage(discountCode.getMaxUsage())
                .usageCount(discountCode.getUsageCount())
                .active(discountCode.isActive())
                .createdAt(discountCode.getCreatedAt())
                .updatedAt(discountCode.getUpdatedAt())
                .isValid(discountCode.isValid())
                .oneTimePerUser(discountCode.isOneTimePerUser())
                .build();
    }
} 