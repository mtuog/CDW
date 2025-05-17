package com.example.BackEndSpring.model;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Model class for change password request
 */
public class ChangePasswordRequest {

    @Schema(description = "Mật khẩu hiện tại", 
            example = "CurrentPassword123@", 
            required = true)
    private String currentPassword;
    
    @Schema(description = "Mật khẩu mới", 
            example = "NewPassword123@", 
            required = true)
    private String newPassword;
    
    @Schema(description = "Xác nhận mật khẩu mới", 
            example = "NewPassword123@", 
            required = true)
    private String confirmPassword;
    
    // Default constructor
    public ChangePasswordRequest() {
    }
    
    // All-args constructor
    public ChangePasswordRequest(String currentPassword, String newPassword, String confirmPassword) {
        this.currentPassword = currentPassword;
        this.newPassword = newPassword;
        this.confirmPassword = confirmPassword;
    }
    
    // Getters and setters
    public String getCurrentPassword() {
        return currentPassword;
    }
    
    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }
    
    public String getNewPassword() {
        return newPassword;
    }
    
    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
    
    public String getConfirmPassword() {
        return confirmPassword;
    }
    
    public void setConfirmPassword(String confirmPassword) {
        this.confirmPassword = confirmPassword;
    }
} 