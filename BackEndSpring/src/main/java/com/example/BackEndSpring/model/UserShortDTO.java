package com.example.BackEndSpring.model;

public class UserShortDTO {
    private Long id;
    private String username;
    private String fullName;
    private String phone;

    public UserShortDTO() {}
    public UserShortDTO(Long id, String username, String fullName, String phone) {
        this.id = id;
        this.username = username;
        this.fullName = fullName;
        this.phone = phone;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
} 