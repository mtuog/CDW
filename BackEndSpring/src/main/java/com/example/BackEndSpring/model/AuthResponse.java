package com.example.BackEndSpring.model;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.Set;

@Schema(description = "Dữ liệu phản hồi sau khi xác thực thành công")
public class AuthResponse {
    
    @Schema(description = "Token xác thực", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String token;
    
    @Schema(description = "Refresh token để làm mới token xác thực", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String refreshToken;
    
    @Schema(description = "ID của người dùng", example = "1")
    private Long userId;
    
    @Schema(description = "Tên người dùng", example = "johndoe")
    private String userName;
    
    @Schema(description = "Vai trò của người dùng", example = "USER")
    private Set<String> userRoles;
    
    // Constructors
    public AuthResponse() {
    }
    
    public AuthResponse(String token, String refreshToken, Long userId, String userName, Set<String> userRoles) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.userId = userId;
        this.userName = userName;
        this.userRoles = userRoles;
    }
    
    // Getters and Setters
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public String getRefreshToken() {
        return refreshToken;
    }
    
    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public String getUserName() {
        return userName;
    }
    
    public void setUserName(String userName) {
        this.userName = userName;
    }
    
    public Set<String> getUserRoles() {
        return userRoles;
    }
    
    public void setUserRoles(Set<String> userRoles) {
        this.userRoles = userRoles;
    }
} 