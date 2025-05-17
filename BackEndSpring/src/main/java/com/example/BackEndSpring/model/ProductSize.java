package com.example.BackEndSpring.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "product_sizes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"product_id", "size"})
})
public class ProductSize {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    @JsonBackReference
    private Product product;
    
    private String size;
    
    private int quantity = 0;
    
    private boolean active = true;
    
    // Constructors
    public ProductSize() {
    }
    
    public ProductSize(Product product, String size, int quantity) {
        this.product = product;
        this.size = size;
        this.quantity = quantity;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Product getProduct() {
        return product;
    }
    
    public void setProduct(Product product) {
        this.product = product;
    }
    
    public String getSize() {
        return size;
    }
    
    public void setSize(String size) {
        this.size = size;
    }
    
    public int getQuantity() {
        return quantity;
    }
    
    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
    
    public boolean isActive() {
        return active;
    }
    
    public void setActive(boolean active) {
        this.active = active;
    }
} 