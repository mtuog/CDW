package com.example.BackEndSpring.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.CascadeType;

@Entity
@Table(name = "orders")
public class Order {
    
    public enum Status {
        PENDING,
        PROCESSING,
        SHIPPED,
        DELIVERED,
        CANCELLED
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "order_code", unique = true)
    private String orderCode;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(name = "discount_code_id")
    private Long discountCodeId;
    
    @Column(name = "discount_code_value")
    private String discountCodeValue;
    
    @Column(name = "subtotal_amount")
    private Double subtotalAmount;
    
    @Column(name = "total_amount", nullable = false)
    private double totalAmount;
    
    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;
    
    @Column(name = "shipping_address", nullable = false)
    private String shippingAddress;
    
    @Column(nullable = false, length = 20)
    private String phone;
    
    @Column(name = "payment_method", nullable = false, length = 50)
    private String paymentMethod;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<OrderItem> orderItems = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // Constructors
    public Order() {
    }
    
    public Order(User user, double totalAmount, String shippingAddress, String phone, String paymentMethod) {
        this.user = user;
        this.totalAmount = totalAmount;
        this.shippingAddress = shippingAddress;
        this.phone = phone;
        this.paymentMethod = paymentMethod;
    }
    
    public Order(User user, double totalAmount, Double subtotalAmount, Long discountCodeId, 
                String discountCodeValue, String shippingAddress, String phone, String paymentMethod) {
        this.user = user;
        this.totalAmount = totalAmount;
        this.subtotalAmount = subtotalAmount;
        this.discountCodeId = discountCodeId;
        this.discountCodeValue = discountCodeValue;
        this.shippingAddress = shippingAddress;
        this.phone = phone;
        this.paymentMethod = paymentMethod;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getOrderCode() {
        return orderCode;
    }
    
    public void setOrderCode(String orderCode) {
        this.orderCode = orderCode;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public double getTotalAmount() {
        return totalAmount;
    }
    
    public void setTotalAmount(double totalAmount) {
        this.totalAmount = totalAmount;
    }
    
    public Status getStatus() {
        return status;
    }
    
    public void setStatus(Status status) {
        this.status = status;
    }
    
    public String getShippingAddress() {
        return shippingAddress;
    }
    
    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public String getPaymentMethod() {
        return paymentMethod;
    }
    
    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public List<OrderItem> getOrderItems() {
        return orderItems;
    }
    
    public void setOrderItems(List<OrderItem> orderItems) {
        this.orderItems = orderItems;
    }
    
    public Long getDiscountCodeId() {
        return discountCodeId;
    }
    
    public void setDiscountCodeId(Long discountCodeId) {
        this.discountCodeId = discountCodeId;
    }
    
    public String getDiscountCodeValue() {
        return discountCodeValue;
    }
    
    public void setDiscountCodeValue(String discountCodeValue) {
        this.discountCodeValue = discountCodeValue;
    }
    
    public Double getSubtotalAmount() {
        return subtotalAmount;
    }
    
    public void setSubtotalAmount(Double subtotalAmount) {
        this.subtotalAmount = subtotalAmount;
    }
    
    // Helper method để thêm OrderItem vào Order
    public void addOrderItem(OrderItem item) {
        orderItems.add(item);
        item.setOrder(this);
    }
    
    // Helper method để xóa OrderItem khỏi Order
    public void removeOrderItem(OrderItem item) {
        orderItems.remove(item);
        item.setOrder(null);
    }
} 