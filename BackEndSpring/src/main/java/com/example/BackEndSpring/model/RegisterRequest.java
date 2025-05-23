package com.example.BackEndSpring.model;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * DTO cho yêu cầu đăng ký tài khoản
 */
public class RegisterRequest {
    
    @Schema(description = "Tên người dùng", example = "john_doe", required = true)
    private String userName;
    
    @Schema(description = "Địa chỉ email", example = "john.doe@example.com", required = true)
    private String email;
    
    @Schema(description = "Mật khẩu", example = "Password123", required = true)
    private String password;
    
    @Schema(description = "Họ và tên", example = "John Doe", required = true)
    private String fullName;
    
    @Schema(description = "Số điện thoại", example = "+1-541-754-3010", required = true)
    private String phone;
    
    // Default constructor
    public RegisterRequest() {
    }
    
    // Constructor with parameters
    public RegisterRequest(String userName, String email, String password) {
        this.userName = userName;
        this.email = email;
        this.password = password;
    }
    
    // Getters and setters
    public String getUserName() {
        return userName;
    }
    
    public void setUserName(String userName) {
        this.userName = userName;
    }
    
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
    
    public String getFullName() {
        return fullName;
    }
    
    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
} 