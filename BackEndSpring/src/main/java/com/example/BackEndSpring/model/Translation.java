package com.example.BackEndSpring.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "translations")
public class Translation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "source_text", nullable = false, columnDefinition = "TEXT")
    private String sourceText;
    
    @Column(name = "target_language", nullable = false, length = 5)
    private String targetLanguage;
    
    @Column(name = "translated_text", nullable = false, columnDefinition = "TEXT")
    private String translatedText;
    
    @Column(name = "category", length = 50)
    private String category;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public Translation() {
    }
    
    public Translation(String sourceText, String targetLanguage, String translatedText, String category) {
        this.sourceText = sourceText;
        this.targetLanguage = targetLanguage;
        this.translatedText = translatedText;
        this.category = category;
    }
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getSourceText() {
        return sourceText;
    }
    
    public void setSourceText(String sourceText) {
        this.sourceText = sourceText;
    }
    
    public String getTargetLanguage() {
        return targetLanguage;
    }
    
    public void setTargetLanguage(String targetLanguage) {
        this.targetLanguage = targetLanguage;
    }
    
    public String getTranslatedText() {
        return translatedText;
    }
    
    public void setTranslatedText(String translatedText) {
        this.translatedText = translatedText;
    }
    
    public String getCategory() {
        return category;
    }
    
    public void setCategory(String category) {
        this.category = category;
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
    
    @Override
    public String toString() {
        return "Translation{" +
                "id=" + id +
                ", sourceText='" + sourceText + '\'' +
                ", targetLanguage='" + targetLanguage + '\'' +
                ", translatedText='" + translatedText + '\'' +
                ", category='" + category + '\'' +
                '}';
    }
} 