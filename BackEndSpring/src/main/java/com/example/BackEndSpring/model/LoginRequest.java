package com.example.BackEndSpring.model;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Dữ liệu yêu cầu đăng nhập")
public class LoginRequest {
    
    @Schema(description = "Địa chỉ email", example = "user@example.com", required = true)
    private String email;
    
    @Schema(description = "Mật khẩu", example = "password123", required = true)
    private String password;
    
    // Constructors
    public LoginRequest() {
    }
    
    public LoginRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }
    
    // Getters and Setters
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
} 