package com.example.BackEndSpring.model;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Model class for password reset request
 */
public class PasswordResetRequest {

    @Schema(description = "Token đặt lại mật khẩu", 
            example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", 
            required = true)
    private String token;
    
    @Schema(description = "Mật khẩu mới", 
            example = "NewPassword123@", 
            required = true)
    private String newPassword;
    
    // Default constructor
    public PasswordResetRequest() {
    }
    
    // All-args constructor
    public PasswordResetRequest(String token, String newPassword) {
        this.token = token;
        this.newPassword = newPassword;
    }
    
    // Getters and setters
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public String getNewPassword() {
        return newPassword;
    }
    
    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
} 