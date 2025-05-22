package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.model.User;
import com.example.BackEndSpring.model.LoginRequest;
import com.example.BackEndSpring.model.AuthResponse;
import com.example.BackEndSpring.service.UserService;
import com.example.BackEndSpring.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import com.example.BackEndSpring.model.Role;
import com.example.BackEndSpring.model.RegisterRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import com.example.BackEndSpring.repository.RoleRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"}, 
    allowCredentials = "true", 
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class AdminController {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;

    public AdminController(UserService userService, JwtUtil jwtUtil, BCryptPasswordEncoder passwordEncoder, RoleRepository roleRepository) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.roleRepository = roleRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> adminLogin(@RequestBody LoginRequest loginRequest) {
        try {
            System.out.println("Received login request: " + loginRequest.getEmail());
            
            String email = loginRequest.getEmail();
            String password = loginRequest.getPassword();
            
            if (email == null || password == null) {
                System.out.println("Email hoặc password null");
                Map<String, String> error = new HashMap<>();
                error.put("message", "Email và mật khẩu không được để trống");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            Optional<User> userOptional = userService.getUserByEmail(email);
            
            if (userOptional.isEmpty()) {
                System.out.println("Không tìm thấy user với email: " + email);
                Map<String, String> error = new HashMap<>();
                error.put("message", "Tài khoản không tồn tại");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            User user = userOptional.get();
            System.out.println("Tìm thấy user: " + user.getUsername() + ", roles: " + user.getRoles().stream().map(r -> r.getName()).collect(java.util.stream.Collectors.toSet()));
            
            // Kiểm tra xem user có phải là admin không
            if (user.getRoles().stream().noneMatch(r -> r.getName().equals("ADMIN"))) {
                System.out.println("User không có quyền admin");
                Map<String, String> error = new HashMap<>();
                error.put("message", "Bạn không có quyền truy cập trang quản trị");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }
            
            if (!passwordEncoder.matches(password, user.getPassword())) {
                System.out.println("Mật khẩu không chính xác");
                Map<String, String> error = new HashMap<>();
                error.put("message", "Mật khẩu không chính xác");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            // Tạo token cho admin
            String token = jwtUtil.generateToken(user);
            String refreshToken = UUID.randomUUID().toString();
            
            AuthResponse response = new AuthResponse(
                token,
                refreshToken,
                user.getId(),
                user.getUsername(),
                user.getRoles().stream().map(r -> r.getName()).collect(java.util.stream.Collectors.toSet())
            );
            
            System.out.println("Đăng nhập thành công cho user: " + user.getUsername());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("Lỗi đăng nhập: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Lỗi đăng nhập: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    @GetMapping("/check-auth")
    public ResponseEntity<?> checkAdminAuth() {
        // Endpoint này đã được bảo vệ bởi Spring Security
        // Nếu đến được đây, nghĩa là người dùng đã xác thực thành công và có vai trò ADMIN
        Map<String, Object> response = new HashMap<>();
        response.put("status", "authenticated");
        response.put("role", "ADMIN");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardData() {
        // Dữ liệu mẫu cho trang dashboard
        Map<String, Object> data = new HashMap<>();
        data.put("totalOrders", 120);
        data.put("totalUsers", 450);
        data.put("totalRevenue", 25000000);
        data.put("newOrders", 15);
        
        return ResponseEntity.ok(data);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentAdminInfo(Authentication authentication) {
        String username = authentication.getName();
        Optional<User> userOpt = userService.getUserByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("username", user.getUsername());
            userInfo.put("email", user.getEmail());
            userInfo.put("fullName", user.getFullName());
            userInfo.put("phone", user.getPhone());
            userInfo.put("address", user.getAddress());
            userInfo.put("roles", user.getRoles().stream().map(Role::getName).collect(java.util.stream.Collectors.toSet()));
            return ResponseEntity.ok(userInfo);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Admin not found");
    }

    // Lấy danh sách admin (có phân trang đơn giản)
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllAdmins() {
        List<User> admins = userService.getAllUsers().stream()
            .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN")))
            .toList();
        List<Map<String, Object>> result = admins.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("username", u.getUsername());
            m.put("email", u.getEmail());
            m.put("fullName", u.getFullName());
            m.put("phone", u.getPhone());
            m.put("active", u.isEnabled());
            m.put("roles", u.getRoles().stream().map(Role::getName).toList());
            m.put("createdAt", u.getCreatedAt());
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }

    // Xem chi tiết admin
    @GetMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAdminById(@PathVariable Long id) {
        Optional<User> userOpt = userService.getUserById(id);
        if (userOpt.isPresent() && userOpt.get().getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"))) {
            User u = userOpt.get();
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("username", u.getUsername());
            m.put("email", u.getEmail());
            m.put("fullName", u.getFullName());
            m.put("phone", u.getPhone());
            m.put("active", u.isEnabled());
            m.put("roles", u.getRoles().stream().map(Role::getName).toList());
            m.put("createdAt", u.getCreatedAt());
            return ResponseEntity.ok(m);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Admin not found");
    }

    // Tạo mới admin
    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createAdmin(@RequestBody RegisterRequest req) {
        if (userService.getUserByUsername(req.getUserName()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username already exists");
        }
        if (userService.getUserByEmail(req.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email already exists");
        }
        User user = new User();
        user.setUsername(req.getUserName());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setEnabled(true);
        // Gán role ADMIN
        Role adminRole = roleRepository.findByName("ADMIN").orElse(null);
        if (adminRole == null) return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Role ADMIN not found");
        user.getRoles().add(adminRole);
        User created = userService.createUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", created.getId()));
    }

    // Cập nhật thông tin admin
    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateAdmin(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        Optional<User> userOpt = userService.getUserById(id);
        if (userOpt.isPresent() && userOpt.get().getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"))) {
            User user = userOpt.get();
            if (updates.containsKey("fullName")) user.setFullName((String) updates.get("fullName"));
            if (updates.containsKey("phone")) user.setPhone((String) updates.get("phone"));
            if (updates.containsKey("email")) user.setEmail((String) updates.get("email"));
            if (updates.containsKey("active")) user.setEnabled((Boolean) updates.get("active"));
            userService.updateUser(user.getId(), user);
            return ResponseEntity.ok("Cập nhật thành công");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Admin not found");
    }

    // Xoá admin
    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteAdmin(@PathVariable Long id) {
        Optional<User> userOpt = userService.getUserById(id);
        if (userOpt.isPresent() && userOpt.get().getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"))) {
            userService.deleteUser(id);
            return ResponseEntity.ok("Đã xoá admin");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Admin not found");
    }

    // Khoá/mở khoá admin
    @PatchMapping("/users/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> toggleActive(@PathVariable Long id) {
        Optional<User> userOpt = userService.getUserById(id);
        if (userOpt.isPresent() && userOpt.get().getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"))) {
            User user = userOpt.get();
            user.setEnabled(!user.isEnabled());
            userService.updateUser(user.getId(), user);
            return ResponseEntity.ok(Map.of("active", user.isEnabled()));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Admin not found");
    }
} 