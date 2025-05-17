package com.example.BackEndSpring.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.CascadeType;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String img;
    
    @Column(columnDefinition = "TEXT")
    private String des;
    
    private boolean bestSeller;
    private boolean newProduct;
    private boolean favorite = false;
    
    @Column(name = "likes_count")
    private Integer likesCount = 0;
    
    private boolean featured;
    private double price;
    private boolean inStock = true;
    private int quantity = 0;
    private int soldCount = 0;
    
    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;
    
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<ProductSize> sizes = new ArrayList<>();
    
    // Constructors
    public Product() {
    }
    
    public Product(Long id, String name, String img, String des, boolean bestSeller, 
                  boolean newProduct, boolean favorite, boolean featured, double price, boolean inStock, int quantity, int soldCount, Category category) {
        this.id = id;
        this.name = name;
        this.img = img;
        this.des = des;
        this.bestSeller = bestSeller;
        this.newProduct = newProduct;
        this.favorite = favorite;
        this.featured = featured;
        this.price = price;
        this.inStock = inStock;
        this.quantity = quantity;
        this.soldCount = soldCount;
        this.category = category;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getImg() {
        return img;
    }
    
    public void setImg(String img) {
        this.img = img;
    }
    
    public String getDes() {
        return des;
    }
    
    public void setDes(String des) {
        this.des = des;
    }
    
    public boolean isBestSeller() {
        return bestSeller;
    }
    
    public void setBestSeller(boolean bestSeller) {
        this.bestSeller = bestSeller;
    }
    
    public boolean isNewProduct() {
        return newProduct;
    }
    
    public void setNewProduct(boolean newProduct) {
        this.newProduct = newProduct;
    }
    
    public boolean isFavorite() {
        return favorite;
    }
    
    public void setFavorite(boolean favorite) {
        this.favorite = favorite;
    }
    
    public Integer getLikesCount() {
        return likesCount;
    }
    
    public void setLikesCount(Integer likesCount) {
        this.likesCount = likesCount;
    }
    
    public boolean isFeatured() {
        return featured;
    }
    
    public void setFeatured(boolean featured) {
        this.featured = featured;
    }
    
    public double getPrice() {
        return price;
    }
    
    public void setPrice(double price) {
        this.price = price;
    }
    
    public boolean isInStock() {
        return inStock;
    }
    
    public void setInStock(boolean inStock) {
        this.inStock = inStock;
    }
    
    public int getQuantity() {
        return quantity;
    }
    
    public void setQuantity(int quantity) {
        this.quantity = quantity;
        // Tự động cập nhật trạng thái inStock dựa vào số lượng
        this.inStock = quantity > 0;
    }
    
    public int getSoldCount() {
        return soldCount;
    }
    
    public void setSoldCount(int soldCount) {
        this.soldCount = soldCount;
    }
    
    public Category getCategory() {
        return category;
    }
    
    public void setCategory(Category category) {
        this.category = category;
    }
    
    public List<ProductSize> getSizes() {
        return sizes;
    }
    
    public void setSizes(List<ProductSize> sizes) {
        this.sizes = sizes;
    }
    
    // Helper methods
    public void addSize(ProductSize size) {
        sizes.add(size);
        size.setProduct(this);
        updateTotalQuantity();
    }
    
    public void removeSize(ProductSize size) {
        sizes.remove(size);
        size.setProduct(null);
        updateTotalQuantity();
    }
    
    // Cập nhật tổng số lượng từ tất cả các sizes
    public int updateTotalQuantity() {
        this.quantity = sizes.stream()
                .filter(ProductSize::isActive)
                .mapToInt(ProductSize::getQuantity)
                .sum();
        
        // Cập nhật trạng thái inStock
        this.inStock = this.quantity > 0;
        
        // Trả về quantity sau khi cập nhật để dễ theo dõi
        return this.quantity;
    }
} 