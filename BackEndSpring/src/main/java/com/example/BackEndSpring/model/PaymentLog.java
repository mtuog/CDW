package com.example.BackEndSpring.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_logs")
public class PaymentLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    private BankPayment payment;
    
    @Column(nullable = false)
    private String action;  // CREATED, VERIFIED, REJECTED, etc
    
    @Column(nullable = false, name = "performed_by")
    private String performedBy;  // Username of the admin who performed the action
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(nullable = false)
    private LocalDateTime timestamp;
    
    @Column(name = "order_id")
    private Long orderId;
    
    @Column(name = "transaction_code")
    private String transactionCode;
    
    @Column(name = "amount")
    private Double amount;
    
    @PrePersist
    protected void onCreate() {
        this.timestamp = LocalDateTime.now();
    }
    
    // Constructors
    public PaymentLog() {
    }
    
    public PaymentLog(BankPayment payment, String action, String performedBy, String notes) {
        this.payment = payment;
        this.action = action;
        this.performedBy = performedBy;
        this.notes = notes;
        if (payment != null) {
            this.orderId = payment.getOrder() != null ? payment.getOrder().getId() : null;
            this.transactionCode = payment.getTransactionCode();
            this.amount = payment.getAmount();
        }
    }
    
    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BankPayment getPayment() {
        return payment;
    }

    public void setPayment(BankPayment payment) {
        this.payment = payment;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(String performedBy) {
        this.performedBy = performedBy;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getTransactionCode() {
        return transactionCode;
    }

    public void setTransactionCode(String transactionCode) {
        this.transactionCode = transactionCode;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }
} 