package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.model.AddressBook;
import com.example.BackEndSpring.model.User;
import com.example.BackEndSpring.repository.AddressBookRepository;
import com.example.BackEndSpring.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/address-book")
@CrossOrigin(
    origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:5500"},
    allowCredentials = "true",
    allowedHeaders = {"Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"},
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class AddressBookController {

    @Autowired
    private AddressBookRepository addressBookRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Lấy tất cả địa chỉ của một người dùng
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getAddressesByUser(@PathVariable Long userId) {
        try {
            System.out.println("DEBUG: Fetching addresses for user ID: " + userId);
            
            // Kiểm tra user có tồn tại không
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                System.out.println("DEBUG: User not found with ID: " + userId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found with ID: " + userId));
            }
            System.out.println("DEBUG: User found: " + userOpt.get().getUsername() + " (ID: " + userId + ")");
            
            try {
                // Lấy danh sách địa chỉ 
                List<AddressBook> addresses = addressBookRepository.findByUserId(userId);
                System.out.println("DEBUG: Found " + addresses.size() + " addresses for user " + userId);
                
                // Log chi tiết cho từng địa chỉ
                for (AddressBook address : addresses) {
                    System.out.println("DEBUG: Address ID: " + address.getId() + 
                                      ", Recipient: " + address.getRecipientName() +
                                      ", Address: " + address.getAddressLine1());
                }
                
                return ResponseEntity.ok(addresses);
            } catch (Exception e) {
                System.err.println("DEBUG: Error querying address repository: " + e.getMessage());
                e.printStackTrace();
                throw e; // Re-throw to be caught by outer catch
            }
        } catch (Exception e) {
            System.err.println("DEBUG: Error fetching addresses: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            error.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
            error.put("timestamp", LocalDateTime.now().toString());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Lấy địa chỉ mặc định của người dùng
     */
    @GetMapping("/default/{userId}")
    public ResponseEntity<?> getDefaultAddress(@PathVariable Long userId) {
        try {
            Optional<AddressBook> defaultAddress = addressBookRepository.findDefaultByUserId(userId);
            return defaultAddress.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            e.printStackTrace();
            return createErrorResponse(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lấy một địa chỉ theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getAddressById(@PathVariable Long id) {
        try {
            Optional<AddressBook> address = addressBookRepository.findById(id);
            return address.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            e.printStackTrace();
            return createErrorResponse(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Thêm địa chỉ mới
     */
    @PostMapping("/add")
    public ResponseEntity<?> addAddress(@RequestBody AddressBook address) {
        try {
            Optional<User> userOpt = userRepository.findById(address.getUser().getId());
            if (!userOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found"));
            }

            address.setUser(userOpt.get());
            
            // Nếu là địa chỉ mặc định, bỏ mặc định của các địa chỉ khác
            if (Boolean.TRUE.equals(address.getIsDefault())) {
                handleDefaultAddressChange(address.getUser().getId());
            }
            
            AddressBook savedAddress = addressBookRepository.save(address);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedAddress);
        } catch (Exception e) {
            e.printStackTrace();
            return createErrorResponse(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Cập nhật địa chỉ
     */
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateAddress(@PathVariable Long id, @RequestBody AddressBook address) {
        try {
            Optional<AddressBook> existingAddress = addressBookRepository.findById(id);
            if (!existingAddress.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Address not found"));
            }

            // Giữ nguyên user và ngày tạo
            AddressBook existing = existingAddress.get();
            address.setId(id);
            address.setUser(existing.getUser());
            address.setCreatedAt(existing.getCreatedAt());
            
            // Nếu đang cập nhật thành địa chỉ mặc định
            if (Boolean.TRUE.equals(address.getIsDefault()) && 
                (existing.getIsDefault() == null || !existing.getIsDefault())) {
                handleDefaultAddressChange(existing.getUser().getId());
            }
            
            AddressBook updatedAddress = addressBookRepository.save(address);
            return ResponseEntity.ok(updatedAddress);
        } catch (Exception e) {
            e.printStackTrace();
            return createErrorResponse(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Xóa địa chỉ
     */
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteAddress(@PathVariable Long id) {
        try {
            Optional<AddressBook> existingAddress = addressBookRepository.findById(id);
            if (!existingAddress.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Address not found"));
            }
            
            addressBookRepository.deleteById(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Address deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return createErrorResponse(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Đánh dấu địa chỉ là mặc định
     */
    @PutMapping("/set-default/{id}")
    public ResponseEntity<?> setDefaultAddress(@PathVariable Long id) {
        try {
            Optional<AddressBook> addressOpt = addressBookRepository.findById(id);
            if (!addressOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Address not found"));
            }
            
            AddressBook address = addressOpt.get();
            
            // Bỏ đánh dấu mặc định cho các địa chỉ khác
            handleDefaultAddressChange(address.getUser().getId());
            
            // Đánh dấu địa chỉ này là mặc định
            address.setIsDefault(true);
            address.setUpdatedAt(LocalDateTime.now());
            addressBookRepository.save(address);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Default address set successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return createErrorResponse(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Hỗ trợ bỏ đánh dấu mặc định cho các địa chỉ khác
     */
    private void handleDefaultAddressChange(Long userId) {
        List<AddressBook> addresses = addressBookRepository.findByUserId(userId);
        for (AddressBook address : addresses) {
            if (Boolean.TRUE.equals(address.getIsDefault())) {
                address.setIsDefault(false);
                address.setUpdatedAt(LocalDateTime.now());
                addressBookRepository.save(address);
            }
        }
    }
    
    /**
     * Tạo response báo lỗi với thông tin chi tiết
     */
    private ResponseEntity<?> createErrorResponse(Exception e, HttpStatus status) {
        Map<String, Object> error = new HashMap<>();
        error.put("message", e.getMessage());
        error.put("status", status.value());
        return ResponseEntity.status(status).body(error);
    }

    /**
     * API kiểm tra - Lấy địa chỉ bằng native query để debugger
     */
    @GetMapping("/debug/{userId}")
    public ResponseEntity<?> debugAddresses(@PathVariable Long userId) {
        try {
            System.out.println("DEBUG: Testing with native query for user ID: " + userId);
            
            // Kiểm tra bảng có tồn tại không bằng cách đếm tất cả
            long totalCount = addressBookRepository.count();
            System.out.println("DEBUG: Total addresses in database: " + totalCount);
            
            // Sử dụng native query để trực tiếp truy vấn database
            List<AddressBook> addresses = addressBookRepository.findByUserIdNative(userId);
            System.out.println("DEBUG: Native query found " + addresses.size() + " addresses for user " + userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("count", addresses.size());
            response.put("total_in_db", totalCount);
            response.put("addresses", addresses);
            response.put("userId", userId);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("DEBUG: Error in native query: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            error.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
} 