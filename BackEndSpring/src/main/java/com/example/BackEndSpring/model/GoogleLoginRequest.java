package com.example.BackEndSpring.model;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Dữ liệu yêu cầu đăng nhập bằng Google")
public class GoogleLoginRequest {
    
    @Schema(description = "Địa chỉ email từ Google", example = "user@gmail.com", required = true)
    private String email;
    
    @Schema(description = "Tên người dùng từ Google", example = "John Doe", required = true)
    private String userName;
    
    // Constructors
    public GoogleLoginRequest() {
    }
    
    public GoogleLoginRequest(String email, String userName) {
        this.email = email;
        this.userName = userName;
    }
    
    // Getters and Setters
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getUserName() {
        return userName;
    }
    
    public void setUserName(String userName) {
        this.userName = userName;
    }
} 