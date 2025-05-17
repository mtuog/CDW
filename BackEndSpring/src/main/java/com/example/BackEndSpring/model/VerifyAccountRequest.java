package com.example.BackEndSpring.model;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * DTO cho yêu cầu xác thực tài khoản
 */
public class VerifyAccountRequest {
    
    @Schema(description = "Email đăng ký tài khoản", example = "example@gmail.com", required = true)
    private String email;
    
    @Schema(description = "Mã OTP xác thực", example = "123456", required = true)
    private String otp;
    
    // Default constructor
    public VerifyAccountRequest() {
    }
    
    // Constructor with parameters
    public VerifyAccountRequest(String email, String otp) {
        this.email = email;
        this.otp = otp;
    }
    
    // Getters and setters
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getOtp() {
        return otp;
    }
    
    public void setOtp(String otp) {
        this.otp = otp;
    }
} 