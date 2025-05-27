package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.dto.DiscountCodeDTO;
import com.example.BackEndSpring.exception.ResourceNotFoundException;
import com.example.BackEndSpring.model.DiscountCode;
import com.example.BackEndSpring.repository.DiscountCodeRepository;
import com.example.BackEndSpring.service.DiscountCodeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/discount-codes")
@RequiredArgsConstructor
@Slf4j
public class DiscountCodeController {

    private final DiscountCodeService discountCodeService;
    private final DiscountCodeRepository discountCodeRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<DiscountCodeDTO>> getAllDiscountCodes() {
        return ResponseEntity.ok(discountCodeService.getAllDiscountCodes());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DiscountCodeDTO> getDiscountCodeById(@PathVariable Long id) {
        return ResponseEntity.ok(discountCodeService.getDiscountCodeById(id));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<DiscountCodeDTO> getDiscountCodeByCode(@PathVariable String code) {
        return ResponseEntity.ok(discountCodeService.getDiscountCodeByCode(code));
    }

    @GetMapping("/active")
    public ResponseEntity<List<DiscountCodeDTO>> getAllActiveDiscountCodes() {
        return ResponseEntity.ok(discountCodeService.getAllActiveDiscountCodes());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DiscountCodeDTO> createDiscountCode(@Valid @RequestBody DiscountCodeDTO discountCodeDTO) {
        try {
            log.info("Creating discount code: {}", discountCodeDTO);
            
            // Log each field individually for better debugging
            log.info("Discount code details - code: {}, description: {}, type: {}, value: {}, minimumPurchaseAmount: {}, maximumDiscountAmount: {}, startDate: {}, endDate: {}, maxUsage: {}, active: {}",
                    discountCodeDTO.getCode(),
                    discountCodeDTO.getDescription(),
                    discountCodeDTO.getDiscountType(),
                    discountCodeDTO.getValue(),
                    discountCodeDTO.getMinimumPurchaseAmount(),
                    discountCodeDTO.getMaximumDiscountAmount(),
                    discountCodeDTO.getStartDate(),
                    discountCodeDTO.getEndDate(),
                    discountCodeDTO.getMaxUsage(),
                    discountCodeDTO.isActive());
            
            DiscountCodeDTO created = discountCodeService.createDiscountCode(discountCodeDTO);
            log.info("Discount code created successfully: {}", created);
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Error creating discount code: {}", e.getMessage(), e);
            
            // Log the exact type of exception and its cause
            if (e.getCause() != null) {
                log.error("Caused by: {}", e.getCause().getMessage());
                if (e.getCause().getCause() != null) {
                    log.error("Root cause: {}", e.getCause().getCause().getMessage());
                }
            }
            
            throw e;
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DiscountCodeDTO> updateDiscountCode(
            @PathVariable Long id, 
            @Valid @RequestBody DiscountCodeDTO discountCodeDTO) {
        log.info("Updating discount code {}: {}", id, discountCodeDTO);
        return ResponseEntity.ok(discountCodeService.updateDiscountCode(id, discountCodeDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDiscountCode(@PathVariable Long id) {
        discountCodeService.deleteDiscountCode(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DiscountCodeDTO> toggleDiscountCodeStatus(@PathVariable Long id) {
        return ResponseEntity.ok(discountCodeService.toggleDiscountCodeStatus(id));
    }



    @GetMapping("/validate")
    public ResponseEntity<?> validateDiscountCode(
            @RequestParam String code, 
            @RequestParam String orderTotal,
            @RequestParam(required = false) Long userId) {
        try {
            log.info("Validating discount code: {}, orderTotal: {}, userId: {}", code, orderTotal, userId);
            
            // Parse the orderTotal string to BigDecimal, handling formatting issues
            BigDecimal orderTotalValue;
            try {
                orderTotalValue = new BigDecimal(orderTotal.trim());
                log.info("Parsed orderTotal: {}", orderTotalValue);
            } catch (NumberFormatException e) {
                log.error("Failed to parse orderTotal: {}", orderTotal, e);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("message", "Invalid order total format: " + orderTotal);
                errorResponse.put("code", "INVALID_FORMAT");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // Apply discount code
            BigDecimal discountAmount = discountCodeService.applyDiscountCode(code, orderTotalValue, userId);
            log.info("Discount amount calculated: {}", discountAmount);
            
            return ResponseEntity.ok(discountAmount);
        } catch (ResourceNotFoundException e) {
            log.error("Error validating discount code: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "Mã giảm giá không tồn tại");
            errorResponse.put("code", "CODE_NOT_FOUND");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (IllegalArgumentException e) {
            log.error("Error validating discount code: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            
            String errorCode = "INVALID_CODE";
            String message = e.getMessage();
            
            if (message.contains("not valid")) {
                errorCode = "CODE_EXPIRED";
                message = "Mã giảm giá đã hết hạn hoặc không còn hiệu lực";
            } else if (message.contains("minimum purchase")) {
                errorCode = "ORDER_TOO_SMALL";
                message = "Giá trị đơn hàng chưa đạt mức tối thiểu để áp dụng mã giảm giá này";
            }
            
            errorResponse.put("message", message);
            errorResponse.put("code", errorCode);
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            log.error("Error validating discount code: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "Có lỗi xảy ra khi kiểm tra mã giảm giá");
            errorResponse.put("code", "SERVER_ERROR");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/apply")
    public ResponseEntity<?> applyDiscountCode(
            @RequestParam String code,
            @RequestParam(required = false) Long userId) {
        try {
            log.info("Recording usage of discount code: {}, userId: {}", code, userId);
            discountCodeService.recordDiscountCodeUsage(code, userId);
            log.info("Discount code usage recorded successfully");
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error recording discount code usage: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/check")
    public ResponseEntity<?> checkDiscountCode(
            @RequestParam String code,
            @RequestParam(required = false) Long userId) {
        try {
            log.info("Checking discount code validity: {}, userId: {}", code, userId);
            
            // Find the discount code directly using the repository
            DiscountCode discountCode = discountCodeRepository.findByCode(code)
                    .orElseThrow(() -> new ResourceNotFoundException("Discount code not found with code: " + code));
            
            // Get validation status and details
            Map<String, Object> response = new HashMap<>();
            boolean isValid = discountCode.isValid();
            
            response.put("valid", isValid);
            response.put("code", code);
            
            if (isValid) {
                response.put("discountType", discountCode.getDiscountType().toString());
                response.put("value", discountCode.getValue());
                response.put("minimumPurchaseAmount", discountCode.getMinimumPurchaseAmount());
                response.put("maximumDiscountAmount", discountCode.getMaximumDiscountAmount());
                response.put("message", "Mã giảm giá hợp lệ");
            } else {
                // Include reason why it's invalid
                LocalDateTime now = LocalDateTime.now();
                boolean active = discountCode.isActive();
                boolean withinDateRange = now.isEqual(discountCode.getStartDate()) || 
                                         (now.isAfter(discountCode.getStartDate()) && 
                                          now.isBefore(discountCode.getEndDate()));
                boolean withinUsageLimit = discountCode.getMaxUsage() == 0 || 
                                          discountCode.getUsageCount() < discountCode.getMaxUsage();
                
                String reason;
                if (!active) {
                    reason = "CODE_INACTIVE";
                    response.put("message", "Mã giảm giá không được kích hoạt");
                } else if (!withinDateRange) {
                    if (now.isBefore(discountCode.getStartDate())) {
                        reason = "CODE_NOT_STARTED";
                        response.put("message", "Mã giảm giá chưa có hiệu lực");
                    } else {
                        reason = "CODE_EXPIRED";
                        response.put("message", "Mã giảm giá đã hết hạn");
                    }
                } else if (!withinUsageLimit) {
                    reason = "USAGE_LIMIT_REACHED";
                    response.put("message", "Mã giảm giá đã đạt giới hạn sử dụng");
                } else {
                    reason = "UNKNOWN";
                    response.put("message", "Mã giảm giá không hợp lệ");
                }
                response.put("reason", reason);
            }
            
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("valid", false);
            errorResponse.put("reason", "CODE_NOT_FOUND");
            errorResponse.put("message", "Mã giảm giá không tồn tại");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Error checking discount code: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("valid", false);
            errorResponse.put("reason", "SERVER_ERROR");
            errorResponse.put("message", "Có lỗi xảy ra khi kiểm tra mã giảm giá");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
} 