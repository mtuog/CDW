package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.model.AuthResponse;
import com.example.BackEndSpring.model.Role;
import com.example.BackEndSpring.model.User;
import com.example.BackEndSpring.service.UserService;
import com.example.BackEndSpring.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"}, allowedHeaders = "*", allowCredentials = "true")
public class FacebookAuthController {

    @Value("${facebook.app.id}")
    private String facebookAppId;

    @Value("${facebook.app.secret}")
    private String facebookAppSecret;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private RestTemplate restTemplate;

    // Add refreshTokens map like in UserController
    private Map<String, String> refreshTokens = new HashMap<>();

    @PostMapping("/facebook")
    public ResponseEntity<?> facebookLogin(@RequestBody Map<String, String> body) {
        String accessToken = body.get("accessToken");
        String userId = body.get("userId");

        if (accessToken == null || userId == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "AccessToken and userId are required"
            ));
        }

        try {
            System.out.println("Facebook login request received. Token: " + accessToken.substring(0, 10) + "..., UserId: " + userId);
            
            // Verify Facebook access token
            String url = String.format("https://graph.facebook.com/debug_token?input_token=%s&access_token=%s|%s",
                    accessToken, facebookAppId, facebookAppSecret);

            Map<String, Object> tokenResponse = restTemplate.getForObject(url, Map.class);
            System.out.println("Token verification response: " + tokenResponse);

            if (tokenResponse != null && tokenResponse.containsKey("data")) {
                Map<String, Object> data = (Map<String, Object>) tokenResponse.get("data");
                
                if (Boolean.TRUE.equals(data.get("is_valid")) && userId.equals(data.get("user_id"))) {
                    // Get user info from Facebook
                    String userInfoUrl = String.format("https://graph.facebook.com/v18.0/%s?fields=id,name,email,picture&access_token=%s",
                            userId, accessToken);
                    Map<String, Object> userInfo = restTemplate.getForObject(userInfoUrl, Map.class);
                    System.out.println("User info from Facebook: " + userInfo);

                    if (userInfo != null) {
                        String email = (String) userInfo.get("email");
                        String name = (String) userInfo.get("name");
                        
                        if (email == null) {
                            return ResponseEntity.badRequest().body(Map.of(
                                "success", false,
                                "message", "Facebook account does not have an associated email"
                            ));
                        }
                        
                        // Get profile picture URL if available
                        String pictureUrl = null;
                        if (userInfo.containsKey("picture")) {
                            Map<String, Object> picture = (Map<String, Object>) userInfo.get("picture");
                            Map<String, Object> pictureData = (Map<String, Object>) picture.get("data");
                            pictureUrl = (String) pictureData.get("url");
                        }

                        // Check if user exists by email
                        Optional<User> existingUser = userService.getUserByEmail(email);
                        User user;

                        if (existingUser.isEmpty()) {
                            // Create new user
                            user = new User();
                            user.setEmail(email);
                            user.setUsername(email); // Use email as username to avoid duplicates
                            user.setFullName(name);
                            
                            // Generate random password for Facebook users
                            String randomPassword = UUID.randomUUID().toString();
                            user.setPassword(passwordEncoder.encode(randomPassword));
                            
                            // Set Facebook specific fields if they exist in the User model
                            try {
                                user.setAvatar(pictureUrl);
                                user.setProvider("facebook");
                                user.setProviderId(userId);
                            } catch (Exception e) {
                                System.out.println("Could not set Facebook-specific fields: " + e.getMessage());
                            }
                            
                            // Facebook users are already verified
                            user.setVerified(true);
                            user.setCreatedAt(LocalDateTime.now());
                            
                            // Create user in database
                            user = userService.createUserFromSocialLogin(user);
                            System.out.println("Created new user: " + user.getId() + ", " + user.getUsername());
                        } else {
                            user = existingUser.get();
                            System.out.println("Using existing user: " + user.getId() + ", username: " + user.getUsername() + ", email: " + user.getEmail());
                            
                            // Đảm bảo user được xác thực và kích hoạt
                            boolean needsUpdate = false;
                            if (!user.isVerified()) {
                                user.setVerified(true);
                                needsUpdate = true;
                                System.out.println("Setting user as verified");
                            }
                            if (!user.isEnabled()) {
                                user.setEnabled(true);
                                needsUpdate = true;
                                System.out.println("Setting user as enabled");
                            }
                            
                            // Update fullName from Facebook if it's empty
                            if (user.getFullName() == null || user.getFullName().trim().isEmpty()) {
                                user.setFullName(name);
                                needsUpdate = true;
                                System.out.println("Updated fullName from Facebook: " + name);
                            }

                            // Update Facebook info if needed
                            try {
                                if (pictureUrl != null && !pictureUrl.equals(user.getAvatar())) {
                                    user.setAvatar(pictureUrl);
                                    needsUpdate = true;
                                    System.out.println("Updated avatar from Facebook");
                                }
                                if (!"facebook".equals(user.getProvider())) {
                                    user.setProvider("facebook");
                                    needsUpdate = true;
                                }
                                if (!userId.equals(user.getProviderId())) {
                                    user.setProviderId(userId);
                                    needsUpdate = true;
                                }
                                
                                if (needsUpdate) {
                                    userService.updateUser(user.getId(), user);
                                    System.out.println("Updated existing user with Facebook info");
                                }
                            } catch (Exception e) {
                                System.out.println("Could not update Facebook-specific fields: " + e.getMessage());
                            }
                        }

                        // Generate JWT token and refresh token
                        String token = generateToken(user);
                        String refreshToken = generateRefreshToken(user);
                        System.out.println("Generated token for user: " + user.getUsername());

                        // Return AuthResponse like Google login
                        AuthResponse response = new AuthResponse(
                            token,
                            refreshToken,
                            user.getId(),
                            user.getUsername(),
                            user.getRoles().stream().map(Role::getName).collect(Collectors.toSet())
                        );

                        return ResponseEntity.ok(response);
                    }
                } else {
                    System.out.println("Token validation failed. Valid: " + data.get("is_valid") + ", UserID match: " + userId.equals(data.get("user_id")));
                }
            } else {
                System.out.println("Invalid token response: " + tokenResponse);
            }

            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Invalid Facebook token"
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error processing Facebook login: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/facebook")
    public ResponseEntity<?> facebookLoginInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("status", "API is working");
        info.put("method", "This is GET method for testing only");
        info.put("usage", "Please use POST method with 'accessToken' and 'userId' in the request body");
        info.put("appId", facebookAppId);
        
        return ResponseEntity.ok(info);
    }

    // Helper methods for token generation (like in UserController)
    private String generateToken(User user) {
        return jwtUtil.generateToken(user);
    }
    
    private String generateRefreshToken(User user) {
        // Generate refresh token like in UserController
        String refreshToken = UUID.randomUUID().toString();
        refreshTokens.put(refreshToken, user.getId().toString());
        return refreshToken;
    }
} 