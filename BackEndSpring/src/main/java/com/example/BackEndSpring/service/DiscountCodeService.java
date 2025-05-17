package com.example.BackEndSpring.service;

import com.example.BackEndSpring.dto.DiscountCodeDTO;
import com.example.BackEndSpring.exception.ResourceNotFoundException;
import com.example.BackEndSpring.model.DiscountCode;
import com.example.BackEndSpring.repository.DiscountCodeRepository;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DiscountCodeService {

    private final DiscountCodeRepository discountCodeRepository;

    public List<DiscountCodeDTO> getAllDiscountCodes() {
        return discountCodeRepository.findAll().stream()
                .map(DiscountCodeDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public DiscountCodeDTO getDiscountCodeById(Long id) {
        return discountCodeRepository.findById(id)
                .map(DiscountCodeDTO::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Discount code not found with id: " + id));
    }

    public DiscountCodeDTO getDiscountCodeByCode(String code) {
        return discountCodeRepository.findByCode(code)
                .map(DiscountCodeDTO::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Discount code not found with code: " + code));
    }

    public List<DiscountCodeDTO> getAllActiveDiscountCodes() {
        return discountCodeRepository.findAllActiveAndValid(LocalDateTime.now()).stream()
                .map(DiscountCodeDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public DiscountCodeDTO createDiscountCode(DiscountCodeDTO discountCodeDTO) {
        log.info("Creating discount code with data: {}", discountCodeDTO);
        
        if (discountCodeRepository.existsByCode(discountCodeDTO.getCode())) {
            throw new IllegalArgumentException("Discount code already exists with code: " + discountCodeDTO.getCode());
        }

        DiscountCode discountCode = new DiscountCode();
        updateDiscountCodeFromDTO(discountCode, discountCodeDTO);
        
        log.info("Saving discount code to database: {}", discountCode);
        DiscountCode savedDiscountCode = discountCodeRepository.save(discountCode);
        return DiscountCodeDTO.fromEntity(savedDiscountCode);
    }

    @Transactional
    public DiscountCodeDTO updateDiscountCode(Long id, DiscountCodeDTO discountCodeDTO) {
        log.info("Updating discount code {} with data: {}", id, discountCodeDTO);
        
        DiscountCode discountCode = discountCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Discount code not found with id: " + id));

        // Check if code is being changed and if the new code already exists
        if (!discountCode.getCode().equals(discountCodeDTO.getCode()) && 
                discountCodeRepository.existsByCode(discountCodeDTO.getCode())) {
            throw new IllegalArgumentException("Discount code already exists with code: " + discountCodeDTO.getCode());
        }

        updateDiscountCodeFromDTO(discountCode, discountCodeDTO);
        
        log.info("Saving updated discount code to database: {}", discountCode);
        DiscountCode updatedDiscountCode = discountCodeRepository.save(discountCode);
        return DiscountCodeDTO.fromEntity(updatedDiscountCode);
    }

    @Transactional
    public void deleteDiscountCode(Long id) {
        if (!discountCodeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Discount code not found with id: " + id);
        }
        discountCodeRepository.deleteById(id);
    }

    @Transactional
    public DiscountCodeDTO toggleDiscountCodeStatus(Long id) {
        DiscountCode discountCode = discountCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Discount code not found with id: " + id));
        
        discountCode.setActive(!discountCode.isActive());
        return DiscountCodeDTO.fromEntity(discountCodeRepository.save(discountCode));
    }

    @Transactional
    public BigDecimal applyDiscountCode(String code, BigDecimal orderTotal, Long userId) {
        log.info("Validating discount code: {} for orderTotal: {} and userId: {}", code, orderTotal, userId);
        
        // Find discount code
        DiscountCode discountCode = discountCodeRepository.findByCode(code)
                .orElseThrow(() -> {
                    log.error("Discount code not found: {}", code);
                    return new ResourceNotFoundException("Discount code not found with code: " + code);
                });
        
        log.info("Found discount code: {}", discountCode);

        // Check if valid
        if (!discountCode.isValid()) {
            log.error("Discount code is not valid: {}", code);
            boolean active = discountCode.isActive();
            LocalDateTime now = LocalDateTime.now();
            boolean withinDateRange = now.isEqual(discountCode.getStartDate()) || 
                                     (now.isAfter(discountCode.getStartDate()) && 
                                      now.isBefore(discountCode.getEndDate()));
            boolean withinUsageLimit = discountCode.getMaxUsage() == 0 || 
                                      discountCode.getUsageCount() < discountCode.getMaxUsage();
            
            log.error("Validity check details - active: {}, withinDateRange: {}, withinUsageLimit: {}", 
                     active, withinDateRange, withinUsageLimit);
            log.error("Current time: {}, Start date: {}, End date: {}", 
                     now, discountCode.getStartDate(), discountCode.getEndDate());
            log.error("Max usage: {}, Current usage: {}", 
                     discountCode.getMaxUsage(), discountCode.getUsageCount());
            
            throw new IllegalArgumentException("Discount code is not valid");
        }

        // Check minimum purchase amount
        BigDecimal minPurchaseAmount = discountCode.getMinimumPurchaseAmount();
        log.info("Minimum purchase amount: {}", minPurchaseAmount);
        
        if (minPurchaseAmount.compareTo(BigDecimal.ZERO) > 0 && 
                orderTotal.compareTo(minPurchaseAmount) < 0) {
            log.error("Order total ({}) does not meet minimum purchase amount ({})", 
                     orderTotal, minPurchaseAmount);
            throw new IllegalArgumentException("Order total does not meet minimum purchase amount for this discount code");
        }

        // Calculate discount amount
        BigDecimal discountAmount;
        BigDecimal valueToApply = discountCode.getValue();
        log.info("Discount value to apply: {}, Discount type: {}", valueToApply, discountCode.getDiscountType());

        if (discountCode.getDiscountType() == DiscountCode.DiscountType.PERCENTAGE) {
            // Calculate percentage discount
            try {
                // Use proper BigDecimal division with scale and rounding mode
                BigDecimal percentage = valueToApply.divide(new BigDecimal("100"), 10, java.math.RoundingMode.HALF_UP);
                log.info("Percentage as decimal: {}", percentage);
                discountAmount = orderTotal.multiply(percentage);
                log.info("Calculated percentage discount: {} ({}% of {})", 
                        discountAmount, valueToApply, orderTotal);
            } catch (Exception e) {
                log.error("Error calculating percentage discount", e);
                // Fallback calculation
                double percentValue = valueToApply.doubleValue() / 100.0;
                discountAmount = BigDecimal.valueOf(orderTotal.doubleValue() * percentValue);
                log.info("Fallback percentage calculation: {}", discountAmount);
            }
            
            // Apply maximum discount if set
            BigDecimal maxDiscount = discountCode.getMaximumDiscountAmount();
            if (maxDiscount.compareTo(BigDecimal.ZERO) > 0 && 
                    discountAmount.compareTo(maxDiscount) > 0) {
                log.info("Discount amount exceeds maximum, capping at: {}", maxDiscount);
                discountAmount = maxDiscount;
            }
        } else {
            // Fixed amount discount
            discountAmount = valueToApply;
            log.info("Using fixed discount amount: {}", discountAmount);
            
            // Ensure discount doesn't exceed order total
            if (discountAmount.compareTo(orderTotal) > 0) {
                log.info("Discount amount exceeds order total, capping at: {}", orderTotal);
                discountAmount = orderTotal;
            }
        }

        log.info("Final discount amount: {}", discountAmount);
        return discountAmount;
    }

    @Transactional
    public void recordDiscountCodeUsage(String code, Long userId) {
        DiscountCode discountCode = discountCodeRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Discount code not found with code: " + code));
        
        discountCode.setUsageCount(discountCode.getUsageCount() + 1);
        discountCodeRepository.save(discountCode);
    }

    private void updateDiscountCodeFromDTO(DiscountCode discountCode, DiscountCodeDTO dto) {
        log.info("Mapping DTO to entity: {}", dto);
        
        discountCode.setCode(dto.getCode());
        discountCode.setDescription(dto.getDescription());
        discountCode.setDiscountType(dto.getDiscountType());
        
        // Explicitly log the value field
        log.info("Setting value field: {}", dto.getValue());
        BigDecimal valueToSet = dto.getValue() != null ? dto.getValue() : BigDecimal.ZERO;
        discountCode.setValue(valueToSet);
        discountCode.setDiscountValue(valueToSet); // Ensure both fields have the same value
        
        // Đảm bảo minimum purchase amount không null
        BigDecimal minPurchase = dto.getMinimumPurchaseAmount() != null ? 
                dto.getMinimumPurchaseAmount() : BigDecimal.ZERO;
        discountCode.setMinimumPurchaseAmount(minPurchase);
        
        // Ensure maximumDiscountAmount is never null
        log.info("Setting maximumDiscountAmount field: {}", dto.getMaximumDiscountAmount());
        discountCode.setMaximumDiscountAmount(dto.getMaximumDiscountAmount() != null ? 
                dto.getMaximumDiscountAmount() : BigDecimal.ZERO);
        
        // Xử lý ngày bắt đầu và kết thúc
        if (dto.getStartDate() != null) {
            discountCode.setStartDate(dto.getStartDate());
        } else {
            discountCode.setStartDate(LocalDateTime.now());
            log.info("No start date provided, using current time as start date");
        }
        
        if (dto.getEndDate() != null) {
            discountCode.setEndDate(dto.getEndDate());
        } else {
            // Mặc định kết thúc sau 1 tháng nếu không được cung cấp
            discountCode.setEndDate(LocalDateTime.now().plusMonths(1));
            log.info("No end date provided, setting end date to 1 month from now");
        }
        
        // Ensure maxUsage is never null
        discountCode.setMaxUsage(dto.getMaxUsage() != null ? dto.getMaxUsage() : 0);
        discountCode.setActive(dto.isActive());
        discountCode.setOneTimePerUser(dto.isOneTimePerUser());
        
        log.info("Entity after mapping: {}", discountCode);
    }

    @PostConstruct
    @Transactional
    public void initializeDefaultValues() {
        log.info("Kiểm tra và cập nhật giá trị mặc định cho các trường NULL trong bảng discount_codes");
        
        List<DiscountCode> allDiscountCodes = discountCodeRepository.findAll();
        
        for (DiscountCode discountCode : allDiscountCodes) {
            boolean needsUpdate = false;
            
            if (discountCode.getValue() == null) {
                discountCode.setValue(BigDecimal.ZERO);
                needsUpdate = true;
            }
            
            try {
                discountCode.getDiscountValue();
            } catch (Exception e) {
                // If there's an exception when accessing discountValue, initialize it
                discountCode.setDiscountValue(discountCode.getValue());
                needsUpdate = true;
                log.info("Initialized discountValue field for discount code: {}", discountCode.getCode());
            }
            
            if (discountCode.getMinimumPurchaseAmount() == null) {
                discountCode.setMinimumPurchaseAmount(BigDecimal.ZERO);
                needsUpdate = true;
            }
            
            if (discountCode.getMaximumDiscountAmount() == null) {
                discountCode.setMaximumDiscountAmount(BigDecimal.ZERO);
                needsUpdate = true;
            }
            
            if (discountCode.getUsageCount() == null) {
                discountCode.setUsageCount(0);
                needsUpdate = true;
            }
            
            // Handle one_time_per_user field
            try {
                discountCode.isOneTimePerUser(); // This will throw an exception if the field is not initialized
            } catch (Exception e) {
                discountCode.setOneTimePerUser(false);
                needsUpdate = true;
                log.info("Set default false value for one_time_per_user field on discount: {}", discountCode.getCode());
            }
            
            if (needsUpdate) {
                log.info("Cập nhật giá trị mặc định cho mã giảm giá: {}", discountCode.getCode());
                discountCodeRepository.save(discountCode);
            }
        }
    }
} 