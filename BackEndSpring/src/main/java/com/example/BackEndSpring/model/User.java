package com.example.BackEndSpring.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.Date;

@Entity
@Table(name = "users")
public class User {
    
    public enum Role {
        ADMIN,
        USER
    }
    
    public enum MembershipRank {
        BRONZE,
        SILVER,
        GOLD,
        PLATINUM
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false, length = 50)
    private String username;
    
    @Column(unique = true, nullable = false, length = 100)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Column(name = "full_name", length = 100)
    private String fullName;
    
    @Column(length = 20)
    private String phone;
    
    private String address;
    
    @Enumerated(EnumType.STRING)
    private Role role = Role.USER;
    
    @Column(name = "loyalty_points")
    private Integer loyaltyPoints = 0;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "membership_rank")
    private MembershipRank membershipRank = MembershipRank.BRONZE;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "verification_code")
    private String verificationCode;
    
    @Column(name = "is_verified")
    private boolean isVerified = false;
    
    @Column(name = "verification_expiry")
    private LocalDateTime verificationExpiry;
    
    @Column(name = "reset_password_token", length = 64)
    private String resetPasswordToken;
    
    @Column(name = "reset_password_token_expires_at")
    private LocalDateTime resetPasswordTokenExpiresAt;
    
    // Các trường hỗ trợ xác thực email
    @Column(name = "verification_token")
    private String verificationToken;
    
    @Column(name = "is_enabled")
    private boolean isEnabled = false;
    
    // Các trường hỗ trợ đặt lại mật khẩu
    @Column(name = "reset_password_expiry")
    private Date resetPasswordExpiry;
    
    // Các trường OTP
    @Column(name = "otp", length = 6)
    private String otp;
    
    @Column(name = "otp_expiry_time")
    private LocalDateTime otpExpiryTime;
    
    @Column(name = "avatar")
    private String avatar;
    
    @Column(name = "provider")
    private String provider;
    
    @Column(name = "provider_id")
    private String providerId;
    
    // Constructors
    public User() {
    }
    
    public User(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
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
    
    public String getAddress() {
        return address;
    }
    
    public void setAddress(String address) {
        this.address = address;
    }
    
    public Role getRole() {
        return role;
    }
    
    public void setRole(Role role) {
        this.role = role;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public String getVerificationCode() {
        return verificationCode;
    }
    
    public void setVerificationCode(String verificationCode) {
        this.verificationCode = verificationCode;
    }
    
    public boolean isVerified() {
        return isVerified;
    }
    
    public void setVerified(boolean verified) {
        this.isVerified = verified;
    }
    
    public LocalDateTime getVerificationExpiry() {
        return verificationExpiry;
    }
    
    public void setVerificationExpiry(LocalDateTime verificationExpiry) {
        this.verificationExpiry = verificationExpiry;
    }
    
    public String getResetPasswordToken() {
        return resetPasswordToken;
    }
    
    public void setResetPasswordToken(String resetPasswordToken) {
        this.resetPasswordToken = resetPasswordToken;
    }
    
    public LocalDateTime getResetPasswordTokenExpiresAt() {
        return resetPasswordTokenExpiresAt;
    }
    
    public void setResetPasswordTokenExpiresAt(LocalDateTime resetPasswordTokenExpiresAt) {
        this.resetPasswordTokenExpiresAt = resetPasswordTokenExpiresAt;
    }
    
    // Getters và setters cho các trường đặt lại mật khẩu
    public Date getResetPasswordExpiry() {
        return resetPasswordExpiry;
    }
    
    public void setResetPasswordExpiry(Date resetPasswordExpiry) {
        this.resetPasswordExpiry = resetPasswordExpiry;
    }
    
    public String getOtp() {
        return otp;
    }
    
    public void setOtp(String otp) {
        this.otp = otp;
    }
    
    public LocalDateTime getOtpExpiryTime() {
        return otpExpiryTime;
    }
    
    public void setOtpExpiryTime(LocalDateTime otpExpiryTime) {
        this.otpExpiryTime = otpExpiryTime;
    }
    
    public String getAvatar() {
        return avatar;
    }
    
    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }
    
    public String getProvider() {
        return provider;
    }
    
    public void setProvider(String provider) {
        this.provider = provider;
    }
    
    public String getProviderId() {
        return providerId;
    }
    
    public void setProviderId(String providerId) {
        this.providerId = providerId;
    }
    
    public Integer getLoyaltyPoints() {
        return loyaltyPoints;
    }
    
    public void setLoyaltyPoints(Integer loyaltyPoints) {
        this.loyaltyPoints = loyaltyPoints;
    }
    
    public MembershipRank getMembershipRank() {
        return membershipRank;
    }
    
    public void setMembershipRank(MembershipRank membershipRank) {
        this.membershipRank = membershipRank;
    }
} 