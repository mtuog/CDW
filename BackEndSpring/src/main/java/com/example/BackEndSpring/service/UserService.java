package com.example.BackEndSpring.service;

import com.example.BackEndSpring.model.User;
import com.example.BackEndSpring.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Date;
import java.util.Random;

import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.UnsupportedEncodingException;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    @Value("${app.verification.expiration}")
    private long verificationExpirationMs;
    
    // Verification code expiry time in hours
    private static final int VERIFICATION_CODE_EXPIRY_HOURS = 24;
    
    // Password reset token expiry time in minutes
    private static final int RESET_TOKEN_EXPIRY_MINUTES = 30;

    @Autowired
    public UserService(UserRepository userRepository, EmailService emailService, PasswordEncoder passwordEncoder, NotificationService notificationService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public boolean isUsernameExists(String username) {
        return userRepository.existsByUsername(username);
    }

    public boolean isEmailExists(String email) {
        return userRepository.existsByEmail(email);
    }

    /**
     * Tạo ngẫu nhiên mã OTP 6 chữ số
     * 
     * @return Mã OTP 6 chữ số
     */
    private String generateOTP() {
        int otpLength = 6;
        String numbers = "0123456789";
        Random random = new Random();
        
        StringBuilder otp = new StringBuilder(otpLength);
        for (int i = 0; i < otpLength; i++) {
            otp.append(numbers.charAt(random.nextInt(numbers.length())));
        }
        
        return otp.toString();
    }

    @Transactional
    public User createUser(User user) {
        try {
            // Validate user
            if (userRepository.existsByUsername(user.getUsername())) {
                throw new RuntimeException("Username already exists");
            }
            if (userRepository.existsByEmail(user.getEmail())) {
                throw new RuntimeException("Email already exists");
            }
            // Set up user data
            user.setCreatedAt(LocalDateTime.now());
            // Nếu user chưa xác thực (tức là đăng ký thường), tạo OTP và gửi mail xác thực
            if (!user.isVerified()) {
            String otp = generateOTP();
            user.setOtp(otp);
            user.setVerified(false);
            user.setOtpExpiryTime(LocalDateTime.now().plusMinutes(30)); // OTP có hiệu lực 30 phút
            // Lưu user vào database
            User savedUser = userRepository.save(user);
            // Gửi email xác thực
            try {
                emailService.sendVerificationEmail(
                    user.getEmail(), 
                    user.getUsername(), 
                    otp
                );
            } catch (MessagingException | UnsupportedEncodingException e) {
                throw new RuntimeException("Failed to send verification email: " + e.getMessage(), e);
            }
            
            // Tạo thông báo cho admin về người dùng mới đăng ký
            try {
                notificationService.createNewUserNotification(
                    savedUser.getId(),
                    savedUser.getUsername(),
                    savedUser.getEmail()
                );
            } catch (Exception e) {
                System.err.println("Lỗi khi tạo thông báo người dùng mới: " + e.getMessage());
            }
            
            return savedUser;
            } else {
                // Nếu là user Google/Facebook đã xác thực, không gửi mail xác thực
                user.setOtp(null);
                user.setOtpExpiryTime(null);
                return userRepository.save(user);
            }
        } catch (Exception e) {
            throw new RuntimeException("Error creating user: " + e.getMessage(), e);
        }
    }
    
    /**
     * Xác thực tài khoản người dùng bằng mã OTP
     * 
     * @param email Email của người dùng
     * @param otp Mã OTP
     * @return Kết quả xác thực (0: thành công, 1: mã không đúng, 2: mã hết hạn)
     */
    @Transactional
    public int verifyAccount(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElse(null);
                
        if (user == null || user.isVerified()) {
            return 1; // Mã không đúng hoặc người dùng đã xác thực
        }
        
        // Kiểm tra mã OTP
        if (!user.getOtp().equals(otp)) {
            return 1; // Mã OTP không đúng
        }
        
        // Kiểm tra thời gian hết hạn
        LocalDateTime now = LocalDateTime.now();
        if (user.getOtpExpiryTime().isBefore(now)) {
            return 2; // Mã OTP đã hết hạn
        }
        
        // Xác thực thành công
        user.setVerified(true);
        user.setOtp(null);
        user.setOtpExpiryTime(null);
        userRepository.save(user);
        
        return 0; // Xác thực thành công
    }
    
    /**
     * Gửi lại mã OTP
     * 
     * @param email Email người dùng
     * @return true nếu gửi thành công, false nếu không tìm thấy người dùng hoặc người dùng đã xác thực
     */
    @Transactional
    public boolean resendVerificationCode(String email) {
        User user = userRepository.findByEmail(email)
                .orElse(null);
        
        if (user == null) {
            return false; // Người dùng không tồn tại
        }
        
        if (user.isVerified()) {
            return false; // Người dùng đã xác thực
        }
        
        // Tạo mã OTP mới
        String otp = generateOTP();
        user.setOtp(otp);
        user.setOtpExpiryTime(LocalDateTime.now().plusMinutes(30));
        userRepository.save(user);
        
        try {
            emailService.sendVerificationEmail(
                user.getEmail(), 
                user.getUsername(), 
                otp
            );
            return true;
        } catch (MessagingException | UnsupportedEncodingException e) {
            throw new RuntimeException("Failed to send verification email", e);
        }
    }
    
    /**
     * Khởi tạo quá trình đặt lại mật khẩu bằng cách tạo token và gửi email
     * 
     * @param email Email của người dùng
     * @return true nếu thành công, false nếu không tìm thấy email
     */
    public boolean initiatePasswordReset(String email) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        
        if (userOptional.isEmpty()) {
            return false;
        }
        
        User user = userOptional.get();
        
        // Tạo token
        String token = UUID.randomUUID().toString();
        user.setResetPasswordToken(token);
        user.setResetPasswordExpiry(new Date(System.currentTimeMillis() + 1000 * 60 * 30)); // Token có hiệu lực 30 phút
        userRepository.save(user);
        
        // Gửi email
        String resetLink = "http://localhost:3000/reset-password?token=" + token;
        String subject = "Đặt lại mật khẩu - CD Web";
        String content = "<p>Xin chào,</p>"
                + "<p>Bạn đã yêu cầu đặt lại mật khẩu.</p>"
                + "<p>Vui lòng nhấp vào liên kết sau để đặt lại mật khẩu của bạn:</p>"
                + "<p><a href=\"" + resetLink + "\">Đặt lại mật khẩu</a></p>"
                + "<p>Liên kết này sẽ hết hạn sau 30 phút.</p>"
                + "<p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>"
                + "<p>Trân trọng,<br>CD Web</p>";
        
        try {
            emailService.sendEmail(email, subject, content);
            return true;
        } catch (MessagingException e) {
            throw new RuntimeException("Không thể gửi email đặt lại mật khẩu", e);
        }
    }
    
    /**
     * Kiểm tra xem token đặt lại mật khẩu có hợp lệ và chưa hết hạn không
     * 
     * @param token Token đặt lại mật khẩu
     * @return true nếu token hợp lệ và chưa hết hạn
     */
    public boolean validateResetToken(String token) {
        Optional<User> userOptional = userRepository.findByResetPasswordToken(token);
        
        if (userOptional.isEmpty()) {
            return false;
        }
        
        User user = userOptional.get();
        Date now = new Date();
        
        return user.getResetPasswordExpiry() != null && user.getResetPasswordExpiry().after(now);
    }
    
    /**
     * Đặt lại mật khẩu bằng token
     * 
     * @param token Token đặt lại mật khẩu
     * @param newPassword Mật khẩu mới đã được mã hóa
     * @return true nếu đặt lại mật khẩu thành công
     */
    public boolean resetPassword(String token, String newPassword) {
        Optional<User> userOptional = userRepository.findByResetPasswordToken(token);
        
        if (userOptional.isEmpty()) {
            return false;
        }
        
        User user = userOptional.get();
        Date now = new Date();
        
        if (user.getResetPasswordExpiry() == null || user.getResetPasswordExpiry().before(now)) {
            return false;
        }
        
        user.setPassword(newPassword);
        user.setResetPasswordToken(null);
        user.setResetPasswordExpiry(null);
        userRepository.save(user);
        
        return true;
    }
    
    /**
     * Thay đổi mật khẩu người dùng
     * 
     * @param userId ID của người dùng
     * @param currentPassword Mật khẩu hiện tại
     * @param newPassword Mật khẩu mới đã được mã hóa
     * @return true nếu thay đổi mật khẩu thành công
     */
    public boolean changePassword(Long userId, String currentPassword, String newPassword) {
        Optional<User> userOptional = getUserById(userId);
        
        if (userOptional.isEmpty()) {
            return false;
        }
        
        User user = userOptional.get();
        user.setPassword(newPassword);
        userRepository.save(user);
        
        return true;
    }

    @Transactional
    public User updateUser(Long id, User userDetails) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        // Check if username is being changed and if it already exists
        if (!user.getUsername().equals(userDetails.getUsername()) 
                && userRepository.existsByUsername(userDetails.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        // Check if email is being changed and if it already exists
        if (!user.getEmail().equals(userDetails.getEmail()) 
                && userRepository.existsByEmail(userDetails.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        user.setUsername(userDetails.getUsername());
        user.setEmail(userDetails.getEmail());
        user.setFullName(userDetails.getFullName());
        user.setPhone(userDetails.getPhone());
        user.setAddress(userDetails.getAddress());
        user.setVerified(userDetails.isVerified()); // Cập nhật trạng thái xác thực
        // Don't update password here, should be done in a separate method with proper validation
        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
    
    // Helper methods
    private String generateVerificationCode() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 32);
    }
    
    private String generateResetToken() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 32);
    }

    /**
     * Xử lý quên mật khẩu - tạo mật khẩu mới và gửi qua email
     * 
     * @param email Email của người dùng
     * @return true nếu thành công, false nếu email không tồn tại
     */
    public boolean forgotPassword(String email) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        
        if (userOptional.isEmpty()) {
            return false;
        }
        
        User user = userOptional.get();
        
        // Tạo mật khẩu mới (8 ký tự ngẫu nhiên)
        String newPassword = generateRandomPassword();
        String encodedPassword = passwordEncoder.encode(newPassword);
        
        // Cập nhật mật khẩu trong database
        user.setPassword(encodedPassword);
        userRepository.save(user);
        
        // Gửi email với mật khẩu mới
        String subject = "Mật khẩu mới - CD Web";
        String content = "<p>Xin chào " + user.getUsername() + ",</p>"
                + "<p>Bạn đã yêu cầu đặt lại mật khẩu.</p>"
                + "<p>Đây là mật khẩu mới của bạn: <strong>" + newPassword + "</strong></p>"
                + "<p>Vui lòng đăng nhập bằng mật khẩu mới và thay đổi mật khẩu ngay sau khi đăng nhập.</p>"
                + "<p>Trân trọng,<br>CD Web</p>";
        
        try {
            emailService.sendEmail(email, subject, content);
            return true;
        } catch (MessagingException e) {
            throw new RuntimeException("Không thể gửi email đặt lại mật khẩu", e);
        }
    }
    
    /**
     * Tạo mật khẩu ngẫu nhiên 8 ký tự
     */
    private String generateRandomPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < 8; i++) {
            int index = random.nextInt(chars.length());
            sb.append(chars.charAt(index));
        }
        return sb.toString();
    }

    /**
     * Tạo người dùng từ đăng nhập mạng xã hội (Facebook, Google) không cần xác thực OTP
     * 
     * @param user Đối tượng User với thông tin từ mạng xã hội
     * @return User đã được lưu vào database
     */
    @Transactional
    public User createUserFromSocialLogin(User user) {
        try {
            // Validate user
            if (userRepository.existsByUsername(user.getUsername())) {
                throw new RuntimeException("Username already exists");
            }
            if (userRepository.existsByEmail(user.getEmail())) {
                throw new RuntimeException("Email already exists");
            }
            
            // Set up user data if not set
            if (user.getCreatedAt() == null) {
                user.setCreatedAt(LocalDateTime.now());
            }
            
            // Đảm bảo user đã được xác thực
            user.setVerified(true);
            
            // Lưu user vào database
            User savedUser = userRepository.save(user);
            
            // Tạo thông báo cho admin về người dùng mới từ social login
            try {
                notificationService.createNewUserNotification(
                    savedUser.getId(),
                    savedUser.getUsername(),
                    savedUser.getEmail()
                );
            } catch (Exception e) {
                System.err.println("Lỗi khi tạo thông báo người dùng mới từ social login: " + e.getMessage());
            }
            
            return savedUser;
        } catch (Exception e) {
            throw new RuntimeException("Error creating user from social login: " + e.getMessage(), e);
        }
    }
} 