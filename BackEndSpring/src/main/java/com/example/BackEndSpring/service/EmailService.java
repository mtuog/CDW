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
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    private final JavaMailSender mailSender;
    private final SettingService settingService;
    
    @Autowired
    public EmailService(JavaMailSender mailSender, SettingService settingService) {
        this.mailSender = mailSender;
        this.settingService = settingService;
    }
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    /**
     * Lấy chân trang email từ cài đặt
     * @return Chuỗi HTML chân trang email
     */
    private String getEmailFooter() {
        String footer = settingService.getSettingValue("email_footer", "");
        if (footer == null || footer.trim().isEmpty()) {
            // Chân trang mặc định nếu không có trong cài đặt
            return "<div style=\"margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #666;\">"
                + "<p>© " + LocalDateTime.now().getYear() + " CD Web Shop. Tất cả quyền được bảo lưu.</p>"
                + "</div>";
        }
        return footer;
    }
    
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
                    + getEmailFooter()
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
                + getEmailFooter()
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
            
            // Đính kèm chân trang vào nội dung email nếu nội dung chưa có chân trang
            if (!htmlContent.contains(getEmailFooter())) {
                htmlContent = htmlContent + getEmailFooter();
            }
            
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

    /**
     * Gửi email xác nhận thanh toán VNPAY
     * 
     * @param email Địa chỉ email người nhận
     * @param orderId Mã đơn hàng
     * @param amount Số tiền thanh toán
     * @param orderInfo Thông tin giao dịch
     * @throws MessagingException Nếu có lỗi khi gửi email
     */
    public void sendVNPaySuccessEmail(String email, String orderId, String amount, String orderInfo) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        try {
            helper.setFrom(fromEmail);
            helper.setTo(email);
            helper.setSubject("Xác nhận đã nhận thanh toán qua VNPAY cho đơn hàng " + orderId);
            
            // Format số tiền từ VNPay (đã được nhân 100)
            long amountLong = Long.parseLong(amount);
            double actualAmount = amountLong / 100.0;
            
            // Format thành tiền VND
            NumberFormat currencyFormatter = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
            String formattedAmount = currencyFormatter.format(actualAmount);
            
            // Format thời gian hiện tại
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy");
            String formattedDateTime = LocalDateTime.now().format(formatter);
            
            StringBuilder content = new StringBuilder();
            content.append("<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">");
            content.append("<h2 style=\"color: #4CAF50;\">Thanh toán thành công</h2>");
            content.append("<p>Xin chào,</p>");
            content.append("<p>Chúng tôi xác nhận đã nhận được thanh toán của bạn cho đơn hàng <strong>").append(orderId).append("</strong> qua cổng thanh toán VNPAY.</p>");
            content.append("<p><strong>Thông tin thanh toán:</strong></p>");
            content.append("<ul>");
            content.append("<li>Mã đơn hàng: ").append(orderId).append("</li>");
            content.append("<li>Mã giao dịch: ").append(orderInfo).append("</li>");
            content.append("<li>Số tiền: ").append(formattedAmount).append("</li>");
            content.append("<li>Thời gian thanh toán: ").append(formattedDateTime).append("</li>");
            content.append("<li>Phương thức thanh toán: VNPAY</li>");
            content.append("</ul>");
            
            content.append("<p>Thanh toán của bạn đã được xác nhận. Đơn hàng của bạn sẽ được xử lý và giao trong thời gian sớm nhất.</p>");
            content.append("<p>Bạn có thể theo dõi trạng thái đơn hàng tại <a href=\"http://localhost:3000/account?tab=orders\">đây</a>.</p>");
            content.append("<p>Cảm ơn bạn đã mua sắm cùng chúng tôi!</p>");
            content.append("<p>Trân trọng,<br>CD Web Shop</p>");
            content.append(getEmailFooter());
            content.append("</div>");
            
            helper.setText(content.toString(), true);
            mailSender.send(message);
            logger.info("VNPay success email sent to: {}", email);
        } catch (Exception e) {
            logger.error("Error sending VNPay success email to {}: {}", email, e.getMessage());
            throw new MessagingException("Failed to send VNPay success email", e);
        }
    }
} 