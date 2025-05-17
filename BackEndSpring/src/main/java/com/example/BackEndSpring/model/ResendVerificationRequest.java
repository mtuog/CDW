package com.example.BackEndSpring.model;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * DTO cho yêu cầu gửi lại mã xác thực
 */
public class ResendVerificationRequest {
    
    @Schema(description = "Email đăng ký tài khoản", example = "example@gmail.com", required = true)
    private String email;
    
    // Default constructor
    public ResendVerificationRequest() {
    }
    
    // Constructor with parameters
    public ResendVerificationRequest(String email) {
        this.email = email;
    }
    
    // Getters and setters
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
} 