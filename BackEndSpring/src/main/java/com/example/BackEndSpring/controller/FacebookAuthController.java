package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.model.User;
import com.example.BackEndSpring.service.UserService;
import com.example.BackEndSpring.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth/facebook")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"}, allowCredentials = "true",
        allowedHeaders = {"authorization", "content-type", "x-auth-token", "origin", "x-requested-with", "accept"},
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class FacebookAuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> facebookLogin(@RequestBody Map<String, String> facebookData) {
        try {
            System.out.println("Facebook login attempt with data: " + facebookData);
            
            String email = facebookData.get("email");
            String name = facebookData.get("name");
            String facebookId = facebookData.get("id");

            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            }

            // Tìm user theo email
            Optional<User> existingUser = userService.getUserByEmail(email);

            User user;
            if (existingUser.isPresent()) {
                user = existingUser.get();
                System.out.println("Found existing user: " + user.getUsername());
            } else {
                // Tạo user mới với Facebook
                System.out.println("Creating new Facebook user");
                user = new User();
                user.setEmail(email);
                user.setFullName(name != null ? name : "Facebook User");
                
                // Tạo username unique từ email
                String baseUsername = email.split("@")[0];
                String username = baseUsername;
                int counter = 1;
                while (userService.isUsernameExists(username)) {
                    username = baseUsername + counter;
                    counter++;
                }
                
                user.setUsername(username);
                user.setPassword(""); // Facebook user không cần password
                user.setVerified(true); // Facebook user được verify tự động
                user.setCreatedAt(LocalDateTime.now());
                
                try {
                    user = userService.createUserFromSocialLogin(user);
                    System.out.println("Created new user: " + user.getUsername());
                } catch (Exception e) {
                    System.err.println("Error creating user: " + e.getMessage());
                    return ResponseEntity.status(500).body(Map.of("error", "Failed to create user"));
                }
            }

            // Tạo JWT token
            String token = jwtUtil.generateToken(user);

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "role", "USER"
            ));
            response.put("message", "Facebook login successful");

            System.out.println("Facebook login successful for user: " + user.getUsername());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Facebook login error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Facebook login failed: " + e.getMessage()));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> getFacebookStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("available", true);
        response.put("message", "Facebook authentication is available");
        response.put("endpoint", "/api/auth/facebook/login");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/test")
    public ResponseEntity<?> testEndpoint(@RequestBody(required = false) Map<String, Object> testData) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Facebook auth controller is working");
        response.put("timestamp", LocalDateTime.now());
        response.put("receivedData", testData);
        return ResponseEntity.ok(response);
    }
} 