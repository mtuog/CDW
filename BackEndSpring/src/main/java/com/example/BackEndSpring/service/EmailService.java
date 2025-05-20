package com.example.BackEndSpring.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.io.UnsupportedEncodingException;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    private final JavaMailSender mailSender;
    
    @Autowired
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    /**
     * Gửi email xác thực đăng ký tài khoản
     * 
     * @param to Địa chỉ email người nhận
     * @param username Tên người dùng
     * @param otp Mã OTP 6 chữ số
     * @throws MessagingException Nếu có lỗi khi gửi email
     * @throws UnsupportedEncodingException Nếu có lỗi mã hóa
     */
    @Async
    public void sendVerificationEmail(String to, String username, String otp) 
            throws MessagingException, UnsupportedEncodingException {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail, "CD Web Shop");
            helper.setTo(to);
            helper.setSubject("Xác thực tài khoản");
            
            String content = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">"
                    + "<h2 style=\"color: #333;\">Xác thực tài khoản</h2>"
                    + "<p>Xin chào " + username + ",</p>"
                    + "<p>Cảm ơn bạn đã đăng ký tài khoản tại CD Web Shop. Vui lòng sử dụng mã OTP dưới đây để xác thực tài khoản của bạn:</p>"
                    + "<div style=\"background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;\">"
                    + otp
                    + "</div>"
                    + "<p>Mã xác thực này sẽ hết hạn sau 30 phút.</p>"
                    + "<p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>"
                    + "<p>Trân trọng,<br>CD Web Shop</p>"
                    + "</div>";
            
            helper.setText(content, true);
            
            mailSender.send(message);
            logger.info("Verification email sent to: {}", to);
        } catch (MessagingException | UnsupportedEncodingException e) {
            logger.error("Failed to send verification email to: {}", to, e);
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error when sending verification email to: {}", to, e);
            throw new MessagingException("Unexpected error when sending email: " + e.getMessage(), e);
        }
    }
    
    @Async
    public void sendPasswordResetEmail(String to, String username, String resetToken) 
            throws MessagingException, UnsupportedEncodingException {
        
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        helper.setFrom(fromEmail, "CD Web Shop");
        helper.setTo(to);
        helper.setSubject("Đặt lại mật khẩu");
        
        String resetLink = "http://localhost:3000/reset-password?token=" + resetToken;
        
        String content = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">"
                + "<h2 style=\"color: #333;\">Đặt lại mật khẩu</h2>"
                + "<p>Xin chào " + username + ",</p>"
                + "<p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu:</p>"
                + "<div style=\"text-align: center; margin: 30px 0;\">"
                + "<a href=\"" + resetLink + "\" style=\"background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;\">ĐẶT LẠI MẬT KHẨU</a>"
                + "</div>"
                + "<p>Hoặc bạn có thể sao chép và dán đường dẫn sau vào trình duyệt của bạn:</p>"
                + "<p style=\"word-break: break-all;\">" + resetLink + "</p>"
                + "<p>Liên kết này sẽ hết hạn sau 30 phút.</p>"
                + "<p>Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể bỏ qua email này.</p>"
                + "<p>Trân trọng,<br>CD Web Shop</p>"
                + "</div>";
        
        helper.setText(content, true);
        
        mailSender.send(message);
        logger.info("Password reset email sent to: {}", to);
    }

    /**
     * Gửi email với nội dung HTML
     * 
     * @param to Địa chỉ email người nhận
     * @param subject Tiêu đề email
     * @param htmlContent Nội dung HTML của email
     * @throws MessagingException Nếu có lỗi khi gửi email
     */
    public void sendEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        try {
        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        
        mailSender.send(message);
            logger.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            logger.error("Error sending email to {}: {}", to, e.getMessage());
            throw new MessagingException("Failed to send email", e);
        }
    }

    /**
     * Kiểm tra cấu hình và kết nối SMTP
     * 
     * @return true nếu kết nối thành công, false nếu có lỗi
     */
    public boolean testConnection() {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(fromEmail);
            helper.setSubject("Test connection");
            helper.setText("This is a test email", false);
            
            // Chỉ kiểm tra kết nối, không gửi email
            mailSender.createMimeMessage();
            logger.info("SMTP connection test successful");
            return true;
        } catch (Exception e) {
            logger.error("SMTP connection test failed", e);
            return false;
        }
    }
} 