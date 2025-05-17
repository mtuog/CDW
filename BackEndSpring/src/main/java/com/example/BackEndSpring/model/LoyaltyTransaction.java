package com.example.BackEndSpring.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "loyalty_transactions")
public class LoyaltyTransaction {
    
    public enum TransactionType {
        EARN,  // Tích điểm
        REDEEM  // Đổi điểm
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private Integer points;
    
    @Column(name = "transaction_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private TransactionType type;
    
    @Column(nullable = false, length = 255)
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;
    
    @Column(name = "order_code")
    private String orderCode;
    
    @Column(name = "order_amount")
    private Double orderAmount;
    
    @Column(name = "subtotal_amount")
    private Double subtotalAmount;
    
    @Column(name = "discount_code_value")
    private String discountCodeValue;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
    
    // Constructors
    public LoyaltyTransaction() {
    }
    
    public LoyaltyTransaction(User user, Integer points, TransactionType type, String description) {
        this.user = user;
        this.points = points;
        this.type = type;
        this.description = description;
    }
    
    public LoyaltyTransaction(User user, Integer points, TransactionType type, String description, Order order) {
        this.user = user;
        this.points = points;
        this.type = type;
        this.description = description;
        this.order = order;
        
        if (order != null) {
            this.orderCode = order.getOrderCode();
            this.orderAmount = order.getTotalAmount();
            this.subtotalAmount = order.getSubtotalAmount();
            this.discountCodeValue = order.getDiscountCodeValue();
        }
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public Integer getPoints() {
        return points;
    }
    
    public void setPoints(Integer points) {
        this.points = points;
    }
    
    public TransactionType getType() {
        return type;
    }
    
    public void setType(TransactionType type) {
        this.type = type;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Order getOrder() {
        return order;
    }
    
    public void setOrder(Order order) {
        this.order = order;
    }
    
    public String getOrderCode() {
        return orderCode;
    }
    
    public void setOrderCode(String orderCode) {
        this.orderCode = orderCode;
    }
    
    public Double getOrderAmount() {
        return orderAmount;
    }
    
    public void setOrderAmount(Double orderAmount) {
        this.orderAmount = orderAmount;
    }
    
    public Double getSubtotalAmount() {
        return subtotalAmount;
    }
    
    public void setSubtotalAmount(Double subtotalAmount) {
        this.subtotalAmount = subtotalAmount;
    }
    
    public String getDiscountCodeValue() {
        return discountCodeValue;
    }
    
    public void setDiscountCodeValue(String discountCodeValue) {
        this.discountCodeValue = discountCodeValue;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
} 