package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.model.User;
import com.example.BackEndSpring.model.LoginRequest;
import com.example.BackEndSpring.model.RegisterRequest;
import com.example.BackEndSpring.model.GoogleLoginRequest;
import com.example.BackEndSpring.model.AuthResponse;
import com.example.BackEndSpring.model.VerifyAccountRequest;
import com.example.BackEndSpring.model.ResendVerificationRequest;
import com.example.BackEndSpring.model.PasswordResetRequest;
import com.example.BackEndSpring.model.ChangePasswordRequest;
import com.example.BackEndSpring.model.Order;
import com.example.BackEndSpring.model.Role;
import com.example.BackEndSpring.service.UserService;
import com.example.BackEndSpring.service.OrderService;
import com.example.BackEndSpring.repository.RoleRepository;
import com.example.BackEndSpring.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.Period;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api")
@Tag(name = "User Controller", description = "API để quản lý người dùng và xác thực")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true", 
    allowedHeaders = {"authorization", "content-type", "x-auth-token", "origin", "x-requested-with", "accept"},
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class UserController {

    private final UserService userService;
    private final OrderService orderService;
    private final RoleRepository roleRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    // Temporary storage for tokens (in production, use a database or Redis)
    private Map<String, String> tokens = new HashMap<>();
    private Map<String, String> refreshTokens = new HashMap<>();

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    public UserController(UserService userService, OrderService orderService, RoleRepository roleRepository) {
        this.userService = userService;
        this.orderService = orderService;
        this.roleRepository = roleRepository;
    }

    @Operation(summary = "Lấy danh sách tất cả người dùng")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @Operation(summary = "Lấy danh sách người dùng với thống kê đơn hàng")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @GetMapping("/users/with-stats")
    public ResponseEntity<List<Map<String, Object>>> getAllUsersWithStats() {
        List<User> users = userService.getAllUsers();
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (User user : users) {
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("username", user.getUsername());
            userMap.put("fullName", user.getFullName());
            userMap.put("email", user.getEmail());
            userMap.put("phone", user.getPhone());
            userMap.put("address", user.getAddress());
            userMap.put("createdAt", user.getCreatedAt());
            userMap.put("roles", user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()));
            userMap.put("enabled", user.isVerified());
            userMap.put("loyaltyPoints", user.getLoyaltyPoints());
            userMap.put("isSuperAdmin", user.isSuperAdmin()); // Add this field!
            
            // Lấy thông tin đơn hàng của người dùng
            List<Order> userOrders = orderService.getOrdersByUser(user);
            
            // Tính tổng số đơn hàng
            userMap.put("orderCount", userOrders.size());
            
            // Tính tổng chi tiêu
            double totalSpent = userOrders.stream()
                .filter(order -> order.getStatus() != Order.Status.CANCELLED)
                .mapToDouble(Order::getTotalAmount)
                .sum();
            userMap.put("totalSpent", totalSpent);
            
            // Lấy ngày đặt hàng gần nhất
            Optional<LocalDateTime> lastOrderDate = userOrders.stream()
                .map(Order::getCreatedAt)
                .max(LocalDateTime::compareTo);
            userMap.put("lastOrderDate", lastOrderDate.orElse(null));
            
            result.add(userMap);
        }
        
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Lấy thông tin người dùng theo ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tìm thấy người dùng"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy người dùng", content = @Content)
    })
    @GetMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> getUserById(
            @Parameter(description = "ID người dùng") @PathVariable Long id) {
        Optional<User> userOpt = userService.getUserById(id);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("username", user.getUsername());
            userMap.put("fullName", user.getFullName());
            userMap.put("email", user.getEmail());
            userMap.put("phone", user.getPhone());
            userMap.put("address", user.getAddress());
            userMap.put("createdAt", user.getCreatedAt());
            userMap.put("roles", user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()));
            userMap.put("enabled", user.isVerified());
            userMap.put("loyaltyPoints", user.getLoyaltyPoints());
            userMap.put("isSuperAdmin", user.isSuperAdmin()); // Add this field!
            
            // Lấy thông tin đơn hàng của người dùng
            List<Order> userOrders = orderService.getOrdersByUser(user);
            
            // Tính tổng số đơn hàng
            userMap.put("orderCount", userOrders.size());
            
            // Tính tổng chi tiêu
            double totalSpent = userOrders.stream()
                .filter(order -> order.getStatus() != Order.Status.CANCELLED)
                .mapToDouble(Order::getTotalAmount)
                .sum();
            userMap.put("totalSpent", totalSpent);
            
            // Lấy ngày đặt hàng gần nhất
            Optional<LocalDateTime> lastOrderDate = userOrders.stream()
                .map(Order::getCreatedAt)
                .max(LocalDateTime::compareTo);
            userMap.put("lastOrderDate", lastOrderDate.orElse(null));
            
            return ResponseEntity.ok(userMap);
        }
        
        return ResponseEntity.notFound().build();
    }

    @Operation(summary = "Lấy thông tin người dùng hiện tại từ token")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "401", description = "Không có quyền truy cập", content = @Content)
    })
    @GetMapping("/users/profile")
    public ResponseEntity<?> getCurrentUserProfile(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not authenticated"));
            }
            
            String username = authentication.getName();
            Optional<User> userOpt = userService.getUserByUsername(username);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found"));
            }
            
            User user = userOpt.get();
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("username", user.getUsername());
            userMap.put("fullName", user.getFullName());
            userMap.put("email", user.getEmail());
            userMap.put("phone", user.getPhone());
            userMap.put("address", user.getAddress());
            userMap.put("createdAt", user.getCreatedAt());
            userMap.put("roles", user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()));
            userMap.put("enabled", user.isVerified());
            userMap.put("loyaltyPoints", user.getLoyaltyPoints());
            
            return ResponseEntity.ok(userMap);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @Operation(summary = "Lấy thông tin người dùng theo tên người dùng")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tìm thấy người dùng"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy người dùng", content = @Content)
    })
    @GetMapping("/users/username/{username}")
    public ResponseEntity<User> getUserByUsername(
            @Parameter(description = "Tên người dùng") @PathVariable String username) {
        return userService.getUserByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Lấy thông tin người dùng theo email")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tìm thấy người dùng"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy người dùng", content = @Content)
    })
    @GetMapping("/users/email/{email}")
    public ResponseEntity<User> getUserByEmail(
            @Parameter(description = "Email của người dùng") @PathVariable String email) {
        return userService.getUserByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Tạo người dùng mới (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Người dùng được tạo thành công"),
        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    @PostMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(
            @Parameter(description = "Thông tin người dùng cần tạo") @RequestBody Map<String, Object> userRequest) {
        try {
            // Extract data from request
            String username = (String) userRequest.get("username");
            String email = (String) userRequest.get("email");
            String password = (String) userRequest.get("password");
            String fullName = (String) userRequest.get("fullName");
            String phone = (String) userRequest.get("phone");
            String address = (String) userRequest.get("address");
            @SuppressWarnings("unchecked")
            List<String> roleNames = (List<String>) userRequest.get("roles");
            Boolean enabled = (Boolean) userRequest.getOrDefault("enabled", true);

            // Validate required fields
            if (username == null || email == null || password == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Username, email và password là bắt buộc"));
            }

            // Check if username or email already exists
            if (userService.isUsernameExists(username)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Username đã tồn tại"));
            }
            
            if (userService.getUserByEmail(email).isPresent()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Email đã tồn tại"));
            }

            // Create new user
            User newUser = new User();
            newUser.setUsername(username);
            newUser.setEmail(email);
            newUser.setPassword(passwordEncoder.encode(password));
            newUser.setFullName(fullName);
            newUser.setPhone(phone);
            newUser.setAddress(address);
            newUser.setVerified(true); // Admin-created users are pre-verified
            newUser.setEnabled(enabled);

            // Assign roles
            if (roleNames != null && !roleNames.isEmpty()) {
                Set<Role> roles = new HashSet<>();
                for (String roleName : roleNames) {
                    Optional<Role> role = roleRepository.findByName(roleName);
                    if (role.isPresent()) {
                        roles.add(role.get());
                    }
                }
                newUser.setRoles(roles);
            }

            User createdUser = userService.createUser(newUser);
            
            // Return user info without password
            Map<String, Object> responseUser = formatUserResponse(createdUser);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Tạo người dùng thành công",
                "user", responseUser
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", e.getMessage()));
        }
    }

    @Operation(summary = "Cập nhật thông tin người dùng (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Người dùng được cập nhật thành công"),
        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy người dùng", content = @Content)
    })
    @PutMapping("/admin/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(
            @Parameter(description = "ID của người dùng") @PathVariable Long id,
            @Parameter(description = "Thông tin người dùng cần cập nhật") @RequestBody Map<String, Object> userRequest) {
        try {
            Optional<User> userOptional = userService.getUserById(id);
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy người dùng"));
            }

            User existingUser = userOptional.get();

            // Update basic info
            if (userRequest.containsKey("username")) {
                String newUsername = (String) userRequest.get("username");
                if (!newUsername.equals(existingUser.getUsername()) && userService.isUsernameExists(newUsername)) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Username đã tồn tại"));
                }
                existingUser.setUsername(newUsername);
            }

            if (userRequest.containsKey("email")) {
                String newEmail = (String) userRequest.get("email");
                if (!newEmail.equals(existingUser.getEmail()) && userService.getUserByEmail(newEmail).isPresent()) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Email đã tồn tại"));
                }
                existingUser.setEmail(newEmail);
            }

            if (userRequest.containsKey("fullName")) {
                existingUser.setFullName((String) userRequest.get("fullName"));
            }

            if (userRequest.containsKey("phone")) {
                existingUser.setPhone((String) userRequest.get("phone"));
            }

            if (userRequest.containsKey("address")) {
                existingUser.setAddress((String) userRequest.get("address"));
            }

            if (userRequest.containsKey("enabled")) {
                existingUser.setEnabled((Boolean) userRequest.get("enabled"));
            }

            // Update password if provided
            if (userRequest.containsKey("password")) {
                String newPassword = (String) userRequest.get("password");
                if (newPassword != null && !newPassword.isEmpty()) {
                    existingUser.setPassword(passwordEncoder.encode(newPassword));
                }
            }

            // Update roles if provided
            if (userRequest.containsKey("roles")) {
                @SuppressWarnings("unchecked")
                List<String> roleNames = (List<String>) userRequest.get("roles");
                if (roleNames != null) {
                    Set<Role> roles = new HashSet<>();
                    for (String roleName : roleNames) {
                        Optional<Role> role = roleRepository.findByName(roleName);
                        if (role.isPresent()) {
                            roles.add(role.get());
                        }
                    }
                    existingUser.setRoles(roles);
                }
            }

            User updatedUser = userService.updateUser(id, existingUser);
            Map<String, Object> responseUser = formatUserResponse(updatedUser);

            return ResponseEntity.ok(Map.of(
                "message", "Cập nhật thông tin người dùng thành công",
                "user", responseUser
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", e.getMessage()));
        }
    }

    @Operation(summary = "Xóa người dùng (Super Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Người dùng được xóa thành công"),
        @ApiResponse(responseCode = "403", description = "Chỉ Super Admin mới có quyền xóa người dùng"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy người dùng", content = @Content)
    })
    @DeleteMapping("/admin/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(
            @Parameter(description = "ID của người dùng") @PathVariable Long id,
            Authentication authentication) {
        try {
            // Check if user exists
            Optional<User> userOptional = userService.getUserById(id);
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy người dùng"));
            }

            User userToDelete = userOptional.get();
            
            // Get current admin user
            String currentUsername = authentication.getName();
            System.out.println("🔍 Authentication name: " + currentUsername);
            
            // Try to find user by email first, then by username
            Optional<User> currentUserOptional = userService.getUserByEmail(currentUsername);
            if (currentUserOptional.isEmpty()) {
                currentUserOptional = userService.getUserByUsername(currentUsername);
            }
            
            if (currentUserOptional.isEmpty()) {
                System.out.println("❌ Cannot find user with email/username: " + currentUsername);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Không thể xác thực người dùng hiện tại"));
            }
            
            User currentUser = currentUserOptional.get();
            
            // Check if current user is Super Admin using database field
            boolean isSuperAdmin = currentUser.isSuperAdmin();
                
            if (!isSuperAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Chỉ Super Admin mới có quyền xóa người dùng"));
            }
            
            // Prevent self-deletion
            if (currentUser.getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Không thể xóa chính mình"));
            }
            
            // Prevent deleting other super admins
            boolean isTargetSuperAdmin = userToDelete.isSuperAdmin();
                
            if (isTargetSuperAdmin && !currentUser.getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Không thể xóa Super Admin khác"));
            }

            userService.deleteUser(id);
            
            return ResponseEntity.ok(Map.of(
                "message", "Xóa người dùng thành công",
                "deletedUser", formatUserResponse(userToDelete)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", e.getMessage()));
        }
    }

    @Operation(summary = "Kích hoạt/Vô hiệu hóa tài khoản người dùng (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Trạng thái tài khoản được cập nhật thành công"),
        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy người dùng")
    })
    @PatchMapping("/admin/users/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> toggleUserStatus(
            @Parameter(description = "ID của người dùng") @PathVariable Long id,
            @Parameter(description = "Trạng thái mới") @RequestBody Map<String, Boolean> statusRequest) {
        try {
            Optional<User> userOptional = userService.getUserById(id);
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy người dùng"));
            }

            User user = userOptional.get();
            Boolean enabled = statusRequest.get("enabled");
            
            if (enabled == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Trạng thái 'enabled' là bắt buộc"));
            }

            user.setEnabled(enabled);
            User updatedUser = userService.updateUser(id, user);
            
            String action = enabled ? "kích hoạt" : "vô hiệu hóa";
            return ResponseEntity.ok(Map.of(
                "message", "Đã " + action + " tài khoản thành công",
                "user", formatUserResponse(updatedUser)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", e.getMessage()));
        }
    }

    @Operation(summary = "Cập nhật role cho người dùng (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Role được cập nhật thành công"),
        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy người dùng")
    })
    @PatchMapping("/admin/users/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserRoles(
            @Parameter(description = "ID của người dùng") @PathVariable Long id,
            @Parameter(description = "Danh sách roles mới") @RequestBody Map<String, List<String>> rolesRequest) {
        try {
            Optional<User> userOptional = userService.getUserById(id);
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy người dùng"));
            }

            User user = userOptional.get();
            List<String> roleNames = rolesRequest.get("roles");
            
            if (roleNames == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Danh sách 'roles' là bắt buộc"));
            }

            Set<Role> roles = new HashSet<>();
            for (String roleName : roleNames) {
                Optional<Role> role = roleRepository.findByName(roleName);
                if (role.isPresent()) {
                    roles.add(role.get());
                } else {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Role '" + roleName + "' không tồn tại"));
                }
            }

            user.setRoles(roles);
            User updatedUser = userService.updateUser(id, user);
            
            return ResponseEntity.ok(Map.of(
                "message", "Cập nhật roles thành công",
                "user", formatUserResponse(updatedUser)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", e.getMessage()));
        }
    }

    // UserServices endpoints
    
    @Operation(summary = "Đăng nhập")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Đăng nhập thành công", 
            content = @Content(schema = @Schema(implementation = AuthResponse.class))),
        @ApiResponse(responseCode = "400", description = "Thông tin đăng nhập không chính xác", 
            content = @Content(schema = @Schema(implementation = Map.class))),
        @ApiResponse(responseCode = "500", description = "Lỗi server", 
            content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @PostMapping("/UserServices/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            String email = loginRequest.getEmail();
            String password = loginRequest.getPassword();
            
            System.out.println("Đang xử lý đăng nhập cho: " + email);
            
            Optional<User> userOptional = userService.getUserByEmail(email);
            
            if (userOptional.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Tài khoản không tồn tại");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            User user = userOptional.get();
            System.out.println("Tìm thấy user: " + user.getUsername() + ", roles: " + user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()));
            
            if (!passwordEncoder.matches(password, user.getPassword())) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Mật khẩu không chính xác");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            // Check if user is verified
            if (!user.isVerified()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Tài khoản chưa được xác minh. Vui lòng kiểm tra email để xác minh tài khoản.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            // Check if user is enabled
            if (!user.isEnabled()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ với quản trị viên.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            // Create tokens
            String token = generateToken(user);
            String refreshToken = generateRefreshToken(user);
            
            // Convert roles to list for frontend compatibility
            Set<String> roleNames = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
            
            AuthResponse response = new AuthResponse(
                token,
                refreshToken,
                user.getId(),
                user.getUsername(),
                roleNames,
                user.isSuperAdmin()
            );
            
            System.out.println("🔍 LOGIN RESPONSE DEBUG:");
            System.out.println("  - User: " + user.getUsername());
            System.out.println("  - Roles: " + roleNames);
            System.out.println("  - isSuperAdmin from DB: " + user.isSuperAdmin());
            System.out.println("  - AuthResponse isSuperAdmin: " + response.isSuperAdmin());
            System.out.println("  - AuthResponse toString: " + response.toString());
            
            // Test manual JSON serialization
            Map<String, Object> testResponse = new HashMap<>();
            testResponse.put("token", token);
            testResponse.put("userId", user.getId());
            testResponse.put("userName", user.getUsername());
            testResponse.put("userRoles", roleNames);
            testResponse.put("isSuperAdmin", user.isSuperAdmin());
            System.out.println("🔍 Manual JSON test: " + testResponse);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("Lỗi đăng nhập: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Đăng nhập thất bại: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    @Operation(summary = "Đăng ký tài khoản mới")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Đăng ký thành công", 
            content = @Content(schema = @Schema(implementation = Map.class))),
        @ApiResponse(responseCode = "400", description = "Thông tin đăng ký không hợp lệ", 
            content = @Content(schema = @Schema(implementation = Map.class))),
        @ApiResponse(responseCode = "500", description = "Lỗi server", 
            content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @PostMapping("/UserServices/register")
    @CrossOrigin(origins = "http://localhost:3000")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        try {
            String username = registerRequest.getUserName();
            String email = registerRequest.getEmail();
            String password = registerRequest.getPassword();
            
            // Validate input
            if (username == null || email == null || password == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Vui lòng nhập đầy đủ thông tin");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            // Check if email already exists
            Optional<User> existingUser = userService.getUserByEmail(email);
            if (existingUser.isPresent()) {
                User user = existingUser.get();
                
                // Check if user is already verified
                if (user.isVerified()) {
                    Map<String, String> error = new HashMap<>();
                    error.put("message", "Email này đã được sử dụng");
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
                } else {
                    // User exists but not verified - resend OTP
                    boolean sent = userService.resendVerificationCode(email);
                    
                    Map<String, String> response = new HashMap<>();
                    response.put("message", "Đăng ký tài khoản thành công ! Vui lòng xác minh tài khoản");
                    return ResponseEntity.ok(response);
                }
            }
            
            // Check if username already exists
            if (userService.isUsernameExists(username)) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Tên người dùng đã tồn tại");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            // Create and save new user
            User newUser = new User();
            newUser.setUsername(username);
            newUser.setEmail(email);
            newUser.setPassword(passwordEncoder.encode(password));
            
            User createdUser = userService.createUser(newUser);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Đăng ký tài khoản thành công ! Vui lòng xác minh tài khoản");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace(); // Log error for debugging
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Đăng ký thất bại: " + e.getMessage());
            error.put("error", e.getClass().getName());
            error.put("stackTrace", e.getStackTrace()[0].toString());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    @Operation(summary = "Xác thực tài khoản bằng mã OTP")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công", 
            content = @Content(schema = @Schema(implementation = Map.class))),
        @ApiResponse(responseCode = "400", description = "Thông tin không hợp lệ", 
            content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @PostMapping("/UserServices/verifyAccount")
    public ResponseEntity<?> verifyAccount(@RequestBody VerifyAccountRequest request) {
        int result = userService.verifyAccount(request.getEmail(), request.getOtp());
        
        Map<String, String> response = new HashMap<>();
        
        switch (result) {
            case 0: // Thành công
                response.put("message", "Tài khoản xác thực thành công.");
                return ResponseEntity.ok(response);
            case 1: // Mã không đúng
                response.put("message", "Mã xác thực không đúng. Vui lòng nhập lại.");
                return ResponseEntity.ok(response);
            case 2: // Mã hết hạn
                response.put("message", "Thời gian mã xác thực đã quá 30 phút. Vui lòng đăng ký lại tài khoản.");
                return ResponseEntity.ok(response);
            default:
                response.put("message", "Đã xảy ra lỗi không xác định.");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @Operation(summary = "Gửi lại mã xác thực")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công", 
            content = @Content(schema = @Schema(implementation = Map.class))),
        @ApiResponse(responseCode = "400", description = "Thông tin không hợp lệ", 
            content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @PostMapping("/UserServices/resendVerification")
    public ResponseEntity<?> resendVerification(@RequestBody ResendVerificationRequest request) {
        boolean sent = userService.resendVerificationCode(request.getEmail());
        
        Map<String, String> response = new HashMap<>();
        
        if (sent) {
            response.put("message", "Mã xác thực mới đã được gửi đến email của bạn.");
            return ResponseEntity.ok(response);
        } else {
            response.put("message", "Không thể gửi lại mã xác thực. Email không hợp lệ hoặc tài khoản đã được xác thực.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    @Operation(summary = "Đăng nhập bằng Google")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Đăng nhập thành công",
            content = @Content(schema = @Schema(implementation = AuthResponse.class))),
        @ApiResponse(responseCode = "500", description = "Lỗi server",
            content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @PostMapping("/UserServices/login-google")
    public ResponseEntity<?> loginWithGoogle(@RequestBody GoogleLoginRequest googleRequest) {
        try {
            String email = googleRequest.getEmail();
            String userName = googleRequest.getUserName();
            
            Optional<User> existingUser = userService.getUserByEmail(email);
            User user;
            
            if (existingUser.isEmpty()) {
                // Create new user with Google data
                user = new User();
                user.setEmail(email);
                user.setUsername(userName);
                // Generate a random password for users registered with Google
                String randomPassword = UUID.randomUUID().toString();
                user.setPassword(passwordEncoder.encode(randomPassword));
                user.setVerified(true); // Users from Google are automatically verified
                user.setEnabled(true); // Users from Google are automatically enabled
                user.setProvider("google");
                user = userService.createUserFromSocialLogin(user);
                System.out.println("Created new Google user: " + user.getId() + ", " + user.getUsername());
            } else {
                user = existingUser.get();
                System.out.println("Using existing user: " + user.getId() + ", username: " + user.getUsername() + ", email: " + user.getEmail());
                
                // Ensure Google users are always verified and enabled
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
                
                // Update fullName from Google if it's empty or different
                if (user.getFullName() == null || user.getFullName().trim().isEmpty()) {
                    user.setFullName(userName);
                    needsUpdate = true;
                    System.out.println("Updated fullName from Google: " + userName);
                }
                
                // Update provider info
                if (!"google".equals(user.getProvider())) {
                    user.setProvider("google");
                    needsUpdate = true;
                }
                
                // Ensure user has USER role (important for existing users without roles)
                if (user.getRoles() == null || user.getRoles().isEmpty()) {
                    Optional<Role> userRole = roleRepository.findByName("USER");
                    if (userRole.isPresent()) {
                        user.setRoles(new HashSet<>());
                        user.getRoles().add(userRole.get());
                        needsUpdate = true;
                        System.out.println("Assigned USER role to existing Google user: " + user.getUsername());
                    } else {
                        System.err.println("Warning: USER role not found in database!");
                    }
                }
                
                if (needsUpdate) {
                    user = userService.updateUser(user.getId(), user);
                    System.out.println("Updated existing user with Google info");
                }
            }
            
            // Create tokens
            Set<String> roleNames = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
            System.out.println("Creating JWT for user: " + user.getUsername() + ", roles: " + roleNames);
            String token = generateToken(user);
            String refreshToken = generateRefreshToken(user);
            
            AuthResponse response = new AuthResponse(
                token,
                refreshToken,
                user.getId(),
                user.getUsername(),
                roleNames,
                user.isSuperAdmin()
            );
            
            System.out.println("Google login successful for user: " + user.getUsername() + " with roles: " + response.getUserRoles());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Đăng nhập Google thất bại: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    @Operation(summary = "Quên mật khẩu - Gửi mật khẩu mới qua email")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Mật khẩu mới đã được gửi qua email", 
            content = @Content(schema = @Schema(implementation = Map.class))),
        @ApiResponse(responseCode = "400", description = "Email không tồn tại", 
            content = @Content(schema = @Schema(implementation = Map.class))),
        @ApiResponse(responseCode = "500", description = "Lỗi server", 
            content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @PostMapping("/UserServices/ForgotPassword")
    public ResponseEntity<?> forgotPassword(@RequestParam("email") String email) {
        try {
            boolean sent = userService.forgotPassword(email);
            
            Map<String, String> response = new HashMap<>();
            if (sent) {
                response.put("message", "Hệ thống đã gửi mật khẩu mới vào email của bạn. Vui lòng kiểm tra thư của bạn");
                return ResponseEntity.ok(response);
            } else {
                response.put("message", "Email này không đăng ký trên hệ thống. Vui lòng nhập lại email của bạn");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Không thể gửi email đặt lại mật khẩu: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    @Operation(summary = "Xác thực token đặt lại mật khẩu")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Token hợp lệ", 
            content = @Content(schema = @Schema(implementation = Map.class))),
        @ApiResponse(responseCode = "400", description = "Token không hợp lệ hoặc đã hết hạn", 
            content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @GetMapping("/UserServices/validate-reset-token")
    public ResponseEntity<?> validateResetToken(@RequestParam("token") String token) {
        boolean valid = userService.validateResetToken(token);
        
        Map<String, Boolean> response = new HashMap<>();
        response.put("valid", valid);
        
        if (valid) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    @Operation(summary = "Đặt lại mật khẩu")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Mật khẩu đã được đặt lại thành công", 
            content = @Content(schema = @Schema(implementation = Map.class))),
        @ApiResponse(responseCode = "400", description = "Token không hợp lệ hoặc đã hết hạn", 
            content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @PostMapping("/UserServices/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody PasswordResetRequest request) {
        // Encode the password before resetting
        String encodedPassword = passwordEncoder.encode(request.getNewPassword());
        
        boolean reset = userService.resetPassword(request.getToken(), encodedPassword);
        
        Map<String, String> response = new HashMap<>();
        if (reset) {
            response.put("message", "Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập bằng mật khẩu mới.");
            return ResponseEntity.ok(response);
        } else {
            response.put("message", "Không thể đặt lại mật khẩu. Token không hợp lệ hoặc đã hết hạn.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    @Operation(summary = "Thay đổi mật khẩu")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Mật khẩu đã được thay đổi thành công", 
            content = @Content(schema = @Schema(implementation = Map.class))),
        @ApiResponse(responseCode = "400", description = "Thông tin không hợp lệ", 
            content = @Content(schema = @Schema(implementation = Map.class))),
        @ApiResponse(responseCode = "401", description = "Mật khẩu hiện tại không chính xác", 
            content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @PostMapping("/UserServices/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody ChangePasswordRequest request,
            @RequestParam("userId") Long userId) {
        
        // Verify password match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Mật khẩu mới và xác nhận mật khẩu không khớp.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
        
        // Get user from database
        Optional<User> userOptional = userService.getUserById(userId);
        
        if (userOptional.isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Người dùng không tồn tại.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
        
        User user = userOptional.get();
        
        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Mật khẩu hiện tại không chính xác.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
        
        // Encode and change password
        String encodedNewPassword = passwordEncoder.encode(request.getNewPassword());
        userService.changePassword(userId, request.getCurrentPassword(), encodedNewPassword);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Mật khẩu đã được thay đổi thành công.");
        return ResponseEntity.ok(response);
    }

    // Helper methods for token generation
    private String generateToken(User user) {
        return jwtUtil.generateToken(user);
    }
    
    private String generateRefreshToken(User user) {
        // Có thể giữ nguyên UUID cho refresh token
        String refreshToken = UUID.randomUUID().toString();
        refreshTokens.put(refreshToken, user.getId().toString());
        return refreshToken;
    }

    // Helper method to format user response without sensitive data
    private Map<String, Object> formatUserResponse(User user) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("fullName", user.getFullName());
        response.put("phone", user.getPhone());
        response.put("address", user.getAddress());
        response.put("enabled", user.isEnabled());
        response.put("verified", user.isVerified());
        response.put("createdAt", user.getCreatedAt());
        response.put("loyaltyPoints", user.getLoyaltyPoints());
        response.put("isSuperAdmin", user.isSuperAdmin()); // Add this field!
        response.put("roles", user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()));
        return response;
    }

    @GetMapping("/users/statistics")
    @Operation(summary = "Lấy thống kê tổng quan về người dùng", description = "Trả về dữ liệu thống kê về người dùng cho dashboard")
    public ResponseEntity<Map<String, Object>> getUserStatistics() {
        Map<String, Object> statistics = new HashMap<>();
        List<User> users = userService.getAllUsers();
        
        // Tính tổng số khách hàng
        int totalCustomers = users.size();
        statistics.put("totalCustomers", totalCustomers);
        
        // Tính số lượng khách hàng hoạt động (có đơn hàng trong 30 ngày gần đây)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long activeCustomers = users.stream()
            .filter(user -> {
                List<Order> userOrders = orderService.getOrdersByUser(user);
                return userOrders.stream()
                    .anyMatch(order -> order.getCreatedAt().isAfter(thirtyDaysAgo));
            })
            .count();
        statistics.put("activeCustomers", activeCustomers);
        
        // Tính số lượng khách hàng mới (đăng ký trong 30 ngày gần đây)
        long newCustomers = users.stream()
            .filter(user -> user.getCreatedAt().isAfter(thirtyDaysAgo))
            .count();
        statistics.put("newCustomersThisMonth", newCustomers);
        
        // Tính tỷ lệ giữ chân khách hàng
        double retentionRate = totalCustomers > 0 ? (double) activeCustomers / totalCustomers * 100 : 0;
        statistics.put("retentionRate", Math.round(retentionRate * 10) / 10.0);
        
        // Tính giá trị đơn hàng trung bình
        double totalSpent = 0;
        int totalOrders = 0;
        
        for (User user : users) {
            List<Order> userOrders = orderService.getOrdersByUser(user);
            totalOrders += userOrders.size();
            totalSpent += userOrders.stream()
                .filter(order -> order.getStatus() != Order.Status.CANCELLED)
                .mapToDouble(Order::getTotalAmount)
                .sum();
        }
        
        double averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalCustomers", totalCustomers);
        summary.put("activeCustomers", activeCustomers);
        summary.put("newCustomersThisMonth", newCustomers);
        summary.put("retentionRate", Math.round(retentionRate * 10) / 10.0);
        summary.put("averageOrderValue", Math.round(averageOrderValue));
        
        statistics.put("summary", summary);
        
        // Thống kê theo giới tính (Nam/Nữ/Không xác định)
        Map<String, Integer> genderCounts = new HashMap<>();
        genderCounts.put("Nam", 0);
        genderCounts.put("Nữ", 0);
        genderCounts.put("Không xác định", users.size());
        
        // Không có trường gender trong User, nên để mặc định là 'Không xác định'
        List<Map<String, Object>> customersByGender = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : genderCounts.entrySet()) {
            if (entry.getValue() > 0) {
                Map<String, Object> item = new HashMap<>();
                item.put("name", entry.getKey());
                item.put("value", entry.getValue());
                customersByGender.add(item);
            }
        }
        statistics.put("customersByGender", customersByGender);
        
        // Thống kê theo độ tuổi - phân bố mặc định vì không có trường dateOfBirth
        Map<String, Integer> ageCounts = new HashMap<>();
        ageCounts.put("18-24", users.size() / 5);
        ageCounts.put("25-34", users.size() / 3);
        ageCounts.put("35-44", users.size() / 6);
        ageCounts.put("45-54", users.size() / 8);
        ageCounts.put("55+", users.size() / 10);
        ageCounts.put("Không xác định", users.size() - (users.size() / 5 + users.size() / 3 + users.size() / 6 + users.size() / 8 + users.size() / 10));
        
        List<Map<String, Object>> customersByAge = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : ageCounts.entrySet()) {
            if (entry.getValue() > 0) {
                Map<String, Object> item = new HashMap<>();
                item.put("name", entry.getKey());
                item.put("value", entry.getValue());
                customersByAge.add(item);
            }
        }
        statistics.put("customersByAge", customersByAge);
        
        // Thống kê theo địa điểm
        Map<String, Integer> locationCounts = new HashMap<>();
        for (User user : users) {
            String address = user.getAddress();
            String location = "Không xác định";
            
            if (address != null && !address.isEmpty()) {
                String[] parts = address.split(",");
                if (parts.length > 0) {
                    location = parts[parts.length - 1].trim();
                    
                    // Kiểm tra các thành phố lớn
                    if (address.contains("Hồ Chí Minh") || address.contains("TP.HCM") || address.contains("HCM")) {
                        location = "TP.HCM";
                    } else if (address.contains("Hà Nội")) {
                        location = "Hà Nội";
                    } else if (address.contains("Đà Nẵng")) {
                        location = "Đà Nẵng";
                    } else if (address.contains("Cần Thơ")) {
                        location = "Cần Thơ";
                    }
                }
            }
            
            locationCounts.put(location, locationCounts.getOrDefault(location, 0) + 1);
        }
        
        List<Map<String, Object>> customersByLocation = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : locationCounts.entrySet()) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", entry.getKey());
            item.put("value", entry.getValue());
            customersByLocation.add(item);
        }
        statistics.put("customersByLocation", customersByLocation);
        
        // Tạo dữ liệu tăng trưởng khách hàng theo tháng (6 tháng gần đây)
        List<Map<String, Object>> customerGrowth = new ArrayList<>();
        LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6);
        
        for (int i = 0; i < 6; i++) {
            LocalDateTime startOfMonth = sixMonthsAgo.plusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime endOfMonth;
            
            if (i < 5) {
                endOfMonth = startOfMonth.plusMonths(1).minusNanos(1);
            } else {
                endOfMonth = LocalDateTime.now();
            }
            
            int monthNumber = startOfMonth.getMonthValue();
            String monthName = "T" + monthNumber;
            
            // Đếm khách hàng mới trong tháng
            long newCustomersInMonth = users.stream()
                .filter(u -> {
                    LocalDateTime createdAt = u.getCreatedAt();
                    return createdAt.isAfter(startOfMonth) && createdAt.isBefore(endOfMonth);
                })
                .count();
            
            // Đếm khách hàng hoạt động trong tháng
            long activeCustomersInMonth = users.stream()
                .filter(u -> {
                    List<Order> userOrders = orderService.getOrdersByUser(u);
                    return userOrders.stream()
                        .anyMatch(order -> {
                            LocalDateTime orderDate = order.getCreatedAt();
                            return orderDate.isAfter(startOfMonth) && orderDate.isBefore(endOfMonth);
                        });
                })
                .count();
            
            Map<String, Object> monthData = new HashMap<>();
            monthData.put("name", monthName);
            monthData.put("newCustomers", newCustomersInMonth);
            monthData.put("activeCustomers", activeCustomersInMonth);
            
            customerGrowth.add(monthData);
        }
        statistics.put("customerGrowth", customerGrowth);
        
        // Tạo dữ liệu tăng trưởng khách hàng theo tuần (4 tuần gần đây)
        List<Map<String, Object>> customerGrowthWeekly = new ArrayList<>();
        LocalDateTime fourWeeksAgo = LocalDateTime.now().minusWeeks(4);
        
        for (int i = 0; i < 4; i++) {
            LocalDateTime startOfWeek = fourWeeksAgo.plusWeeks(i);
            LocalDateTime endOfWeek;
            
            if (i < 3) {
                endOfWeek = startOfWeek.plusWeeks(1).minusNanos(1);
            } else {
                endOfWeek = LocalDateTime.now();
            }
            
            // Đếm khách hàng mới trong tuần
            long newCustomersInWeek = users.stream()
                .filter(u -> {
                    LocalDateTime createdAt = u.getCreatedAt();
                    return createdAt.isAfter(startOfWeek) && createdAt.isBefore(endOfWeek);
                })
                .count();
            
            // Đếm khách hàng hoạt động trong tuần
            long activeCustomersInWeek = users.stream()
                .filter(u -> {
                    List<Order> userOrders = orderService.getOrdersByUser(u);
                    return userOrders.stream()
                        .anyMatch(order -> {
                            LocalDateTime orderDate = order.getCreatedAt();
                            return orderDate.isAfter(startOfWeek) && orderDate.isBefore(endOfWeek);
                        });
                })
                .count();
            
            Map<String, Object> weekData = new HashMap<>();
            weekData.put("name", "Tuần " + (i + 1));
            weekData.put("newCustomers", newCustomersInWeek);
            weekData.put("activeCustomers", activeCustomersInWeek);
            
            customerGrowthWeekly.add(weekData);
        }
        statistics.put("customerGrowthWeekly", customerGrowthWeekly);
        
        // Tìm top khách hàng
        List<Map<String, Object>> topCustomers = users.stream()
            .filter(u -> u.getRoles().stream().map(Role::getName).collect(Collectors.toSet()).contains("USER"))
            .map(u -> {
                Map<String, Object> customerMap = new HashMap<>();
                customerMap.put("id", u.getId());
                customerMap.put("name", u.getFullName() != null ? u.getFullName() : u.getUsername());
                customerMap.put("email", u.getEmail());
                customerMap.put("phone", u.getPhone() != null ? u.getPhone() : "Chưa cập nhật");
                List<Order> userOrders = orderService.getOrdersByUser(u);
                int orderCount = userOrders.size();
                customerMap.put("orders", orderCount);
                double userTotalSpent = userOrders.stream()
                    .filter(order -> order.getStatus() != Order.Status.CANCELLED)
                    .mapToDouble(Order::getTotalAmount)
                    .sum();
                customerMap.put("totalSpent", userTotalSpent);
                Optional<LocalDateTime> lastOrderDate = userOrders.stream()
                    .map(Order::getCreatedAt)
                    .max(LocalDateTime::compareTo);
                customerMap.put("lastOrder", lastOrderDate.orElse(null));
                String status;
                if (!u.isVerified()) {
                    status = "inactive";
                } else if (orderCount == 0) {
                    status = "potential";
                } else {
                    status = "active";
                }
                customerMap.put("status", status);
                return customerMap;
            })
            .sorted((a, b) -> {
                Double aSpent = (Double) a.get("totalSpent");
                Double bSpent = (Double) b.get("totalSpent");
                return bSpent.compareTo(aSpent);
            })
            .limit(5)
            .collect(Collectors.toList());
        
        statistics.put("topCustomers", topCustomers);
        
        return ResponseEntity.ok(statistics);
    }

    @Operation(summary = "Quick set current user as Super Admin (for testing)")
    @PostMapping("/admin/make-me-super")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> makeMeSuperAdmin(Authentication authentication) {
        try {
            System.out.println("🔍 makeMeSuperAdmin - Authentication object: " + authentication);
            System.out.println("🔍 makeMeSuperAdmin - Authentication class: " + (authentication != null ? authentication.getClass().getName() : "null"));
            System.out.println("🔍 makeMeSuperAdmin - Is authenticated: " + (authentication != null ? authentication.isAuthenticated() : "null"));
            System.out.println("🔍 makeMeSuperAdmin - Principal: " + (authentication != null ? authentication.getPrincipal() : "null"));
            System.out.println("🔍 makeMeSuperAdmin - Authorities: " + (authentication != null ? authentication.getAuthorities() : "null"));
            
            if (authentication == null || !authentication.isAuthenticated()) {
                System.out.println("❌ Authentication is null or not authenticated");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Không có xác thực"));
            }
            
            String currentUsername = authentication.getName();
            System.out.println("🔍 makeMeSuperAdmin - Authentication name: " + currentUsername);
            
            // Try to find user by email first, then by username
            Optional<User> currentUserOptional = userService.getUserByEmail(currentUsername);
            System.out.println("🔍 Found user by email: " + currentUserOptional.isPresent());
            
            if (currentUserOptional.isEmpty()) {
                currentUserOptional = userService.getUserByUsername(currentUsername);
                System.out.println("🔍 Found user by username: " + currentUserOptional.isPresent());
            }
            
            if (currentUserOptional.isEmpty()) {
                System.out.println("❌ Cannot find user with email/username: " + currentUsername);
                
                // Additional debug: List all users
                List<User> allUsers = userService.getAllUsers();
                System.out.println("🔍 Total users in database: " + allUsers.size());
                allUsers.forEach(user -> {
                    System.out.println("   - User: " + user.getUsername() + " / " + user.getEmail());
                });
                
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Không thể xác thực người dùng hiện tại"));
            }
            
            User currentUser = currentUserOptional.get();
            currentUser.setSuperAdmin(true);
            User updatedUser = userService.updateUser(currentUser.getId(), currentUser);
            
            return ResponseEntity.ok(Map.of(
                "message", "Đã bổ nhiệm bạn thành Super Admin!",
                "user", formatUserResponse(updatedUser)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", e.getMessage()));
        }
    }

    @Operation(summary = "Set/Unset Super Admin status for a user (Admin only)")
    @PostMapping("/admin/users/{id}/super-admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> setSuperAdminStatus(
            @Parameter(description = "ID của người dùng") @PathVariable Long id,
            @Parameter(description = "Super Admin status") @RequestBody Map<String, Boolean> request) {
        try {
            Optional<User> userOptional = userService.getUserById(id);
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy người dùng"));
            }

            User user = userOptional.get();
            Boolean isSuperAdmin = request.get("isSuperAdmin");
            
            if (isSuperAdmin == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Trường 'isSuperAdmin' là bắt buộc"));
            }

            user.setSuperAdmin(isSuperAdmin);
            User updatedUser = userService.updateUser(id, user);
            
            String action = isSuperAdmin ? "bổ nhiệm" : "hủy bỏ";
            return ResponseEntity.ok(Map.of(
                "message", "Đã " + action + " Super Admin thành công",
                "user", formatUserResponse(updatedUser)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/admin/me")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateCurrentAdminInfo(Authentication authentication, @RequestBody Map<String, Object> updates) {
        String username = authentication.getName();
        Optional<User> userOpt = userService.getUserByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (updates.containsKey("fullName")) user.setFullName((String) updates.get("fullName"));
            if (updates.containsKey("phone")) user.setPhone((String) updates.get("phone"));
            if (updates.containsKey("address")) user.setAddress((String) updates.get("address"));
            userService.updateUser(user.getId(), user);
            return ResponseEntity.ok("Cập nhật thành công");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Admin not found");
    }
} 