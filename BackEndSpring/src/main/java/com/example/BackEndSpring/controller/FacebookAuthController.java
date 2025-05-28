package com.example.BackEndSpring.controller;

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
                            System.out.println("Using existing user: " + user.getId() + ", " + user.getUsername());
                            
                            // Đảm bảo user được xác thực
                            if (!user.isVerified()) {
                                user.setVerified(true);
                            }

                            // Update Facebook info if needed
                            try {
                                if (pictureUrl != null) {
                                    user.setAvatar(pictureUrl);
                                }
                                user.setProvider("facebook");
                                user.setProviderId(userId);
                                userService.updateUser(user.getId(), user);
                            } catch (Exception e) {
                                System.out.println("Could not update Facebook-specific fields: " + e.getMessage());
                            }
                        }

                        // Generate JWT token
                        String token = jwtUtil.generateToken(user);
                        System.out.println("Generated token for user: " + user.getUsername());

                        Map<String, Object> responseBody = new HashMap<>();
                        responseBody.put("success", true);
                        responseBody.put("token", token);
                        responseBody.put("user", user);

                        return ResponseEntity.ok(responseBody);
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
} 