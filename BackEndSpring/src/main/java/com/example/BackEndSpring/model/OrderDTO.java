package com.example.BackEndSpring.model;

import java.time.LocalDateTime;
import java.util.List;

public class OrderDTO {
    private Long id;
    private String orderCode;
    private UserShortDTO user;
    private Double totalAmount;
    private Double subtotalAmount;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String paymentMethod;
    private String phone;
    private String shippingAddress;
    private Long discountCodeId;
    private String discountCodeValue;
    private List<OrderItem> orderItems;

    // Getter & Setter
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getOrderCode() { return orderCode; }
    public void setOrderCode(String orderCode) { this.orderCode = orderCode; }
    
    public UserShortDTO getUser() { return user; }
    public void setUser(UserShortDTO user) { this.user = user; }
    
    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    
    public Double getSubtotalAmount() { return subtotalAmount; }
    public void setSubtotalAmount(Double subtotalAmount) { this.subtotalAmount = subtotalAmount; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public String getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(String shippingAddress) { this.shippingAddress = shippingAddress; }
    
    public Long getDiscountCodeId() { return discountCodeId; }
    public void setDiscountCodeId(Long discountCodeId) { this.discountCodeId = discountCodeId; }
    
    public String getDiscountCodeValue() { return discountCodeValue; }
    public void setDiscountCodeValue(String discountCodeValue) { this.discountCodeValue = discountCodeValue; }
    
    public List<OrderItem> getOrderItems() { return orderItems; }
    public void setOrderItems(List<OrderItem> orderItems) { this.orderItems = orderItems; }
} 