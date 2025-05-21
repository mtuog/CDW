package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.model.Order;
import com.example.BackEndSpring.model.OrderItem;
import com.example.BackEndSpring.service.OrderService;
import com.example.BackEndSpring.service.PaymentSettingsService;
import com.example.BackEndSpring.service.ProductService;
import com.example.BackEndSpring.service.EmailService;
import com.example.BackEndSpring.config.VNPayConfig;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.Locale;

@RestController
@RequestMapping("/api/vnpay")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"}, allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class VNPayController {

    private final PaymentSettingsService paymentSettingsService;
    private final OrderService orderService;
    private final ProductService productService;
    private final EmailService emailService;

    @Autowired
    public VNPayController(PaymentSettingsService paymentSettingsService, OrderService orderService, ProductService productService, EmailService emailService) {
        this.paymentSettingsService = paymentSettingsService;
        this.orderService = orderService;
        this.productService = productService;
        this.emailService = emailService;
    }

    @PostMapping("/create-payment")
    public ResponseEntity<?> createPayment(HttpServletRequest request, @RequestBody Map<String, String> paymentInfo) {
        try {
            // Log thông tin chi tiết
            System.out.println("==================================================");
            System.out.println("VNPAY CREATE PAYMENT REQUEST [POST]");
            System.out.println("Thời gian: " + new Date());
            System.out.println("Client IP: " + request.getRemoteAddr());
            System.out.println("User-Agent: " + request.getHeader("User-Agent"));
            
            // Log thông tin thanh toán nhận được
            System.out.println("Dữ liệu thanh toán: " + paymentInfo);
            
            try {
                // Lấy cấu hình VNPAY từ service
                Map<String, String> vnpConfig;
                try {
                    vnpConfig = paymentSettingsService.getVNPayConfig();
                    System.out.println("Cấu hình VNPAY: " + vnpConfig);
                } catch (Exception configEx) {
                    System.err.println("Lỗi cấu hình thanh toán: " + configEx.getMessage());
                    configEx.printStackTrace();
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Lỗi cấu hình thanh toán", "message", configEx.getMessage()));
                }
                
                // Lấy thông tin đơn hàng
                String orderId = paymentInfo.get("orderId");
                String orderInfo = paymentInfo.get("orderInfo");
                String amount = paymentInfo.get("amount");
                String bankCode = paymentInfo.get("bankCode");
                String locale = paymentInfo.get("locale");
                
                System.out.println("OrderId: " + orderId);
                System.out.println("OrderInfo: " + orderInfo);
                System.out.println("Amount: " + amount);
                
                // Kiểm tra thông tin đơn hàng
                if (orderId == null || orderInfo == null || amount == null) {
                    System.out.println("Missing required payment info");
                    return ResponseEntity.badRequest().body(Map.of("error", "Thông tin đơn hàng không đầy đủ"));
                }

                // Chuyển đổi amount sang số nguyên an toàn
                long amountLong;
                try {
                    // Loại bỏ dấu phẩy, dấu chấm và chuyển đổi sang long
                    String cleanAmount = amount.replaceAll("[,.]", "");
                    amountLong = Long.parseLong(cleanAmount);
                    System.out.println("Parsed amount: " + amountLong);
                } catch (NumberFormatException e) {
                    System.out.println("Invalid amount format: " + amount);
                    return ResponseEntity.badRequest().body(Map.of("error", "Định dạng số tiền không hợp lệ"));
                }

                // Tham số thanh toán
                Map<String, String> vnp_Params = new HashMap<>();
                
                try {
                    vnp_Params.put("vnp_Version", "2.1.0");
                    vnp_Params.put("vnp_Command", "pay");
                    vnp_Params.put("vnp_TmnCode", vnpConfig.get("vnp_TmnCode"));
                    vnp_Params.put("vnp_Amount", String.valueOf(amountLong * 100)); // Nhân 100 để loại bỏ phần thập phân
                    vnp_Params.put("vnp_CurrCode", "VND");
                    
                    // Thêm mã ngân hàng nếu có
                    if (bankCode != null && !bankCode.isEmpty()) {
                        vnp_Params.put("vnp_BankCode", bankCode);
                    }
                    
                    // Tạo mã tham chiếu giao dịch
                    String vnp_TxnRef = orderId + "_" + System.currentTimeMillis();
                    vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
                    vnp_Params.put("vnp_OrderInfo", orderInfo);
                    vnp_Params.put("vnp_OrderType", "other");
                    
                    // Thêm ngôn ngữ hiển thị
                    if (locale != null && !locale.isEmpty()) {
                        vnp_Params.put("vnp_Locale", locale);
                    } else {
                        vnp_Params.put("vnp_Locale", "vn");
                    }
                    
                    // URL trả về sau khi thanh toán
                    String returnUrl = vnpConfig.get("vnp_ReturnUrl");
                    if (returnUrl == null || returnUrl.isEmpty()) {
                        returnUrl = "http://localhost:3000/payment/vnpay-return";
                    }
                    vnp_Params.put("vnp_ReturnUrl", returnUrl);
                    System.out.println("Return URL: " + returnUrl);
                    
                    // Địa chỉ IP của khách hàng
                    String ipAddr = VNPayConfig.getIpAddress(request);
                    vnp_Params.put("vnp_IpAddr", ipAddr);
                    System.out.println("Client IP: " + ipAddr);
                    
                    // Thời gian tạo giao dịch
                    Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
                    SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
                    String vnp_CreateDate = formatter.format(cld.getTime());
                    vnp_Params.put("vnp_CreateDate", vnp_CreateDate);
                    
                    // Thời gian hết hạn giao dịch (15 phút từ lúc tạo)
                    cld.add(Calendar.MINUTE, 15);
                    String vnp_ExpireDate = formatter.format(cld.getTime());
                    vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);
                    
                    // Thêm thông tin thanh toán
                    if (paymentInfo.containsKey("billingMobile")) {
                        vnp_Params.put("vnp_Bill_Mobile", paymentInfo.get("billingMobile"));
                    }
                    if (paymentInfo.containsKey("billingEmail")) {
                        vnp_Params.put("vnp_Bill_Email", paymentInfo.get("billingEmail"));
                    }
                    if (paymentInfo.containsKey("billingFullName")) {
                        String fullName = paymentInfo.get("billingFullName").trim();
                        if (!fullName.isEmpty()) {
                            int idx = fullName.lastIndexOf(' ');
                            if (idx != -1) {
                                String firstName = fullName.substring(0, idx);
                                String lastName = fullName.substring(idx + 1);
                                vnp_Params.put("vnp_Bill_FirstName", firstName);
                                vnp_Params.put("vnp_Bill_LastName", lastName);
                            } else {
                                vnp_Params.put("vnp_Bill_FirstName", fullName);
                                vnp_Params.put("vnp_Bill_LastName", "");
                            }
                        }
                    }
                    if (paymentInfo.containsKey("billingAddress")) {
                        vnp_Params.put("vnp_Bill_Address", paymentInfo.get("billingAddress"));
                    }
                    if (paymentInfo.containsKey("billingCity")) {
                        vnp_Params.put("vnp_Bill_City", paymentInfo.get("billingCity"));
                    }
                    if (paymentInfo.containsKey("billingCountry")) {
                        vnp_Params.put("vnp_Bill_Country", paymentInfo.get("billingCountry"));
                    }
                } catch (Exception paramEx) {
                    System.err.println("Error preparing VNPAY parameters: " + paramEx.getMessage());
                    paramEx.printStackTrace();
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Lỗi chuẩn bị tham số thanh toán", "message", paramEx.getMessage()));
                }
                
                // Xây dựng chuỗi dữ liệu để mã hóa và tạo URL truy vấn
                String paymentUrl = "";
                
                try {
                    List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
                    Collections.sort(fieldNames);
                    StringBuilder hashData = new StringBuilder();
                    StringBuilder query = new StringBuilder();
                    
                    for (String fieldName : fieldNames) {
                        String fieldValue = vnp_Params.get(fieldName);
                        if (fieldValue != null && !fieldValue.isEmpty()) {
                            // Xây dựng dữ liệu hash
                            hashData.append(fieldName).append('=');
                            hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                            
                            // Xây dựng URL truy vấn
                            query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                            query.append('=');
                            query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                            
                            if (fieldNames.indexOf(fieldName) < fieldNames.size() - 1) {
                                query.append('&');
                                hashData.append('&');
                            }
                        }
                    }
                    
                    // Tạo mã hash bảo mật
                    String queryUrl = query.toString();
                    
                    String hashSecret = vnpConfig.get("vnp_HashSecret");
                    if (hashSecret == null || hashSecret.isEmpty()) {
                        hashSecret = "XBJ021BXQPW37S8PPLQK5CNIOMBT632U"; // Giá trị mặc định
                    }
                    
                    System.out.println("Using hash secret: " + hashSecret);
                    System.out.println("Hash data: " + hashData.toString());
                    
                    String vnp_SecureHash = VNPayConfig.hmacSHA512(hashSecret, hashData.toString());
                    System.out.println("Secure hash: " + vnp_SecureHash);
                    
                    queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
                    
                    // Tạo URL thanh toán hoàn chỉnh
                    String payUrl = vnpConfig.get("vnp_PayUrl");
                    if (payUrl == null || payUrl.isEmpty()) {
                        payUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"; // Giá trị mặc định
                    }
                    
                    paymentUrl = payUrl + "?" + queryUrl;
                    System.out.println("Payment URL: " + paymentUrl);
                } catch (UnsupportedEncodingException e) {
                    System.err.println("URL encoding error: " + e.getMessage());
                    e.printStackTrace();
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Lỗi mã hóa URL", "message", e.getMessage()));
                } catch (Exception e) {
                    System.err.println("Error building payment URL: " + e.getMessage());
                    e.printStackTrace();
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Lỗi tạo URL thanh toán", "message", e.getMessage()));
                }
                
                // Trả về URL thanh toán
                Map<String, String> response = new HashMap<>();
                response.put("code", "00");
                response.put("message", "success");
                response.put("paymentUrl", paymentUrl);
                
                return ResponseEntity.ok(response);
                
            } catch (Exception e) {
                System.err.println("Unexpected inner error in VNPAY payment creation: " + e.getMessage());
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi xử lý bên trong", "message", e.getMessage()));
            }
            
        } catch (Exception e) {
            System.err.println("Unexpected outer error in VNPAY payment creation: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Lỗi không xác định", "message", e.getMessage(), "stack", e.getStackTrace()[0].toString()));
        }
    }

    @GetMapping("/payment-return")
    public ResponseEntity<?> paymentReturnGet(HttpServletRequest request) {
        return paymentReturn(request);
    }

    @PostMapping("/payment-return")
    public ResponseEntity<?> paymentReturnPost(HttpServletRequest request) {
        return paymentReturn(request);
    }

    private ResponseEntity<?> paymentReturn(HttpServletRequest request) {
        Map<String, String> vnpConfig = paymentSettingsService.getVNPayConfig();
        
        // Log full URL and query string for debugging
        System.out.println("==================================================");
        System.out.println("VNPAY PAYMENT RETURN PROCESSING");
        System.out.println("Thời gian: " + new Date());
        System.out.println("Payment Return - Full URL: " + request.getRequestURL().toString() + 
                          (request.getQueryString() != null ? "?" + request.getQueryString() : ""));
        
        // Get VNPay parameters
        Map<String, String> fields = VNPayConfig.getVNPayParameters(request);
        
        // Lấy mã bảo mật
        String vnp_SecureHash = request.getParameter("vnp_SecureHash");
        
        // Xóa các tham số không cần thiết khi kiểm tra mã bảo mật
        if (fields.containsKey("vnp_SecureHashType")) {
            fields.remove("vnp_SecureHashType");
        }
        if (fields.containsKey("vnp_SecureHash")) {
            fields.remove("vnp_SecureHash");
        }
        
        // Validation check
        if (fields.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Không nhận được dữ liệu từ VNPAY, vui lòng thử lại");
            System.out.println("ERROR: VNPay fields empty");
            return ResponseEntity.badRequest().body(response);
        }
        
        // Sắp xếp các tham số
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        
        for (String fieldName : fieldNames) {
            String fieldValue = fields.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                hashData.append(fieldName).append('=');
                try {
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                } catch (UnsupportedEncodingException e) {
                    e.printStackTrace();
                }
                
                if (fieldNames.indexOf(fieldName) < fieldNames.size() - 1) {
                    hashData.append('&');
                }
            }
        }
        
        String signValue = VNPayConfig.hmacSHA512(vnpConfig.get("vnp_HashSecret"), hashData.toString());
        
        System.out.println("VERIFY SIGNATURE - From VNPAY");
        System.out.println("VNPAY Secure Hash: " + vnp_SecureHash);
        System.out.println("Calculated Hash:   " + signValue);
        
        Map<String, Object> response = new HashMap<>();
        
        // Kiểm tra mã bảo mật
        if (signValue.equals(vnp_SecureHash)) {
            System.out.println("Signature verification: SUCCESS");
            // Mã bảo mật hợp lệ, kiểm tra kết quả giao dịch
            String vnp_ResponseCode = fields.get("vnp_ResponseCode");
            String vnp_TransactionStatus = fields.get("vnp_TransactionStatus");
            String vnp_TxnRef = fields.get("vnp_TxnRef");
            String vnp_Amount = fields.get("vnp_Amount");
            String vnp_OrderInfo = fields.get("vnp_OrderInfo");
            
            System.out.println("Response Code: " + vnp_ResponseCode);
            System.out.println("Transaction Status: " + vnp_TransactionStatus);
            System.out.println("Transaction Reference: " + vnp_TxnRef);
            System.out.println("Amount: " + vnp_Amount);
            System.out.println("Order Info: " + vnp_OrderInfo);
            
            // Kiểm tra mã đơn hàng
            if (vnp_TxnRef != null && vnp_TxnRef.contains("_")) {
                String orderId = vnp_TxnRef.split("_")[0];
                System.out.println("Order ID: " + orderId);
                
                try {
                    Long orderIdLong = Long.parseLong(orderId);
                    Optional<Order> orderOpt = orderService.getOrderById(orderIdLong);
                    
                    if (orderOpt.isPresent()) {
                        Order order = orderOpt.get();
                        System.out.println("Found order: " + order.getId() + " with status: " + order.getStatus());
                        
                        // Nếu giao dịch thành công
                        if ("00".equals(vnp_ResponseCode) && "00".equals(vnp_TransactionStatus)) {
                            System.out.println("Transaction successful (code 00)");
                            // Cập nhật trạng thái đơn hàng
                            if (order.getStatus() == Order.Status.PENDING) {
                                // Cập nhật trạng thái đơn hàng và giảm số lượng sản phẩm
                                System.out.println("Updating order status to PROCESSING and decreasing product stock");
                                
                                // Giảm số lượng sản phẩm trong kho
                                if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
                                    for (OrderItem item : order.getOrderItems()) {
                                        if (item.getProduct() != null) {
                                            productService.decreaseStock(item.getProduct().getId(), item.getQuantity(), item.getSize());
                                        }
                                    }
                                }
                                
                                // First, send the order confirmation email if it wasn't sent during order creation
                                try {
                                    if (order.getUser() != null && order.getUser().getEmail() != null) {
                                        System.out.println("Sending order confirmation email to: " + order.getUser().getEmail());
                                        orderService.sendOrderConfirmationEmail(order);
                                        System.out.println("Order confirmation email sent to: " + order.getUser().getEmail());
                                    }
                                } catch (Exception e) {
                                    System.err.println("Error sending order confirmation email: " + e.getMessage());
                                    e.printStackTrace();
                                }
                                
                                // Cập nhật trạng thái đơn hàng nhưng không gửi email thông báo trạng thái
                                orderService.updateOrderStatusAndNotify(orderIdLong, Order.Status.PROCESSING, false);
                                
                                // Gửi email xác nhận thanh toán thành công riêng
                                try {
                                    if (order.getUser() != null && order.getUser().getEmail() != null) {
                                        System.out.println("Sending VNPay success email to: " + order.getUser().getEmail());
                                        sendVNPaySuccessEmail(order, vnp_Amount, vnp_OrderInfo);
                                        System.out.println("VNPay success email sent to: " + order.getUser().getEmail());
                                    } else {
                                        System.out.println("Cannot send email: User or user email is null");
                                    }
                                } catch (Exception e) {
                                    System.err.println("Error sending VNPay success email: " + e.getMessage());
                                    e.printStackTrace();
                                }
                                
                                response.put("success", true);
                                response.put("message", "Thanh toán thành công");
                                response.put("orderId", orderId);
                            } else {
                                System.out.println("Order not in PENDING status, current status: " + order.getStatus());
                                response.put("success", true);
                                response.put("message", "Đơn hàng đã được xử lý trước đó");
                                response.put("orderId", orderId);
                            }
                        } else {
                            // Giao dịch thất bại
                            System.out.println("Transaction failed with code: " + vnp_ResponseCode);
                            response.put("success", false);
                            response.put("message", getVNPayResponseMessage(vnp_ResponseCode));
                            response.put("orderId", orderId);
                            
                            // Nếu đơn hàng vẫn ở trạng thái PENDING, cập nhật thành CANCELLED
                            // Đối với đơn hàng VNPAY thất bại, không cần tăng số lượng trong kho vì chưa giảm
                            if (order.getStatus() == Order.Status.PENDING) {
                                System.out.println("Updating order status to CANCELLED without stock adjustment");
                                // Cập nhật trạng thái đơn hàng trực tiếp mà không điều chỉnh kho
                                order.setStatus(Order.Status.CANCELLED);
                                orderService.saveOrder(order);
                            }
                        }
                    } else {
                        System.out.println("Order not found: " + orderId);
                        response.put("success", false);
                        response.put("message", "Không tìm thấy đơn hàng");
                    }
                } catch (NumberFormatException e) {
                    System.out.println("Invalid order ID format: " + orderId);
                    response.put("success", false);
                    response.put("message", "Mã đơn hàng không hợp lệ");
                    e.printStackTrace();
                } catch (Exception e) {
                    System.err.println("Error processing order: " + e.getMessage());
                    response.put("success", false);
                    response.put("message", "Lỗi xử lý đơn hàng: " + e.getMessage());
                    e.printStackTrace();
                }
            } else {
                System.out.println("Invalid transaction reference: " + vnp_TxnRef);
                response.put("success", false);
                response.put("message", "Mã tham chiếu giao dịch không hợp lệ");
            }
        } else {
            // Mã bảo mật không hợp lệ
            System.out.println("Signature verification: FAILED");
            response.put("success", false);
            response.put("message", "Chữ ký không hợp lệ");
        }
        
        System.out.println("Response to client: " + response);
        System.out.println("==================================================");
        return ResponseEntity.ok(response);
    }
    
    /**
     * Gửi email xác nhận thanh toán VNPay thành công
     * Lưu ý: Email này chỉ xác nhận việc thanh toán, không phải xác nhận đơn hàng
     */
    private void sendVNPaySuccessEmail(Order order, String amount, String orderInfo) throws MessagingException {
        if (order == null || order.getUser() == null || order.getUser().getEmail() == null) {
            throw new RuntimeException("Không đủ thông tin để gửi email");
        }
        
        String email = order.getUser().getEmail();
        String orderId = order.getId().toString();
        
        // Gọi phương thức trong EmailService để gửi email xác nhận thanh toán
        emailService.sendVNPaySuccessEmail(email, orderId, amount, orderInfo);
    }

    @GetMapping("/payment-ipn")
    public ResponseEntity<?> paymentIPN(HttpServletRequest request) {
        Map<String, String> vnpConfig = paymentSettingsService.getVNPayConfig();
        Map<String, String> fields = VNPayConfig.getVNPayParameters(request);
        
        String vnp_SecureHash = request.getParameter("vnp_SecureHash");
        
        if (fields.containsKey("vnp_SecureHashType")) {
            fields.remove("vnp_SecureHashType");
        }
        if (fields.containsKey("vnp_SecureHash")) {
            fields.remove("vnp_SecureHash");
        }
        
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        
        for (String fieldName : fieldNames) {
            String fieldValue = fields.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                hashData.append(fieldName).append('=');
                try {
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                } catch (UnsupportedEncodingException e) {
                    e.printStackTrace();
                }
                
                if (fieldNames.indexOf(fieldName) < fieldNames.size() - 1) {
                    hashData.append('&');
                }
            }
        }
        
        String signValue = VNPayConfig.hmacSHA512(vnpConfig.get("vnp_HashSecret"), hashData.toString());
        
        System.out.println("IPN VERIFY SIGNATURE - From VNPAY");
        System.out.println("VNPAY Secure Hash: " + vnp_SecureHash);
        System.out.println("Calculated Hash:   " + signValue);
        System.out.println("Hash Data: " + hashData.toString());
        
        Map<String, String> response = new HashMap<>();
        
        if (signValue.equals(vnp_SecureHash)) {
            // Mã bảo mật hợp lệ
            String vnp_TxnRef = fields.get("vnp_TxnRef");
            String vnp_TransactionStatus = fields.get("vnp_TransactionStatus");
            
            if (vnp_TxnRef != null && vnp_TxnRef.contains("_")) {
                String orderId = vnp_TxnRef.split("_")[0];
                try {
                    Optional<Order> optionalOrder = orderService.getOrderById(Long.parseLong(orderId));
                    
                    if (optionalOrder.isPresent()) {
                        Order order = optionalOrder.get();
                        if ("00".equals(vnp_TransactionStatus)) {
                            // Giao dịch thành công
                            if (order.getStatus() == Order.Status.PENDING) {
                                // Cập nhật trạng thái thanh toán
                                orderService.updateOrderStatus(Long.parseLong(orderId), Order.Status.PROCESSING);
                            }
                            response.put("RspCode", "00");
                            response.put("Message", "Confirm Success");
                        } else {
                            // Giao dịch thất bại
                            response.put("RspCode", "00");
                            response.put("Message", "Confirm Success");
                        }
                    } else {
                        response.put("RspCode", "01");
                        response.put("Message", "Order not found");
                    }
                } catch (Exception e) {
                    response.put("RspCode", "99");
                    response.put("Message", "Unknown error");
                }
            } else {
                response.put("RspCode", "02");
                response.put("Message", "Invalid reference number");
            }
        } else {
            response.put("RspCode", "97");
            response.put("Message", "Invalid signature");
        }
        
        return ResponseEntity.ok(response);
    }
    
    // Hàm phụ trợ để hiển thị thông báo lỗi VNPAY
    private String getVNPayResponseMessage(String responseCode) {
        switch (responseCode) {
            case "00":
                return "Giao dịch thành công";
            case "07":
                return "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)";
            case "09":
                return "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking";
            case "10":
                return "Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần";
            case "11":
                return "Giao dịch không thành công do: Đã hết hạn chờ thanh toán";
            case "12":
                return "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa";
            case "13":
                return "Giao dịch không thành công do: Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)";
            case "24":
                return "Giao dịch không thành công do: Khách hàng hủy giao dịch";
            case "51":
                return "Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch";
            case "65":
                return "Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày";
            case "75":
                return "Ngân hàng thanh toán đang bảo trì";
            case "79":
                return "Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định";
            default:
                return "Giao dịch không thành công";
        }
    }

    @GetMapping("/check")
    public ResponseEntity<?> checkVNPayStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "up");
        response.put("message", "VNPAY API is working");

        // Kiểm tra cấu hình
        try {
            Map<String, String> vnpConfig = paymentSettingsService.getVNPayConfig();
            response.put("config", Map.of(
                "tmnCode", vnpConfig.get("vnp_TmnCode"),
                "returnUrl", vnpConfig.get("vnp_ReturnUrl"),
                "payUrl", vnpConfig.get("vnp_PayUrl")
            ));
        } catch (Exception e) {
            response.put("configError", e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/send-email")
    public ResponseEntity<?> sendVNPaySuccessEmail(@RequestBody Map<String, String> emailInfo) throws MessagingException {
        String email = emailInfo.get("email");
        String orderId = emailInfo.get("orderId");
        String amount = emailInfo.get("amount");
        String orderInfo = emailInfo.get("orderInfo");

        if (email == null || email.isEmpty() || orderId == null || orderId.isEmpty() || amount == null || amount.isEmpty() || orderInfo == null || orderInfo.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thông tin email không đầy đủ"));
        }

        try {
            // Kiểm tra xem đơn hàng có tồn tại không
            Optional<Order> orderOpt = orderService.getOrderById(Long.parseLong(orderId));
            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();
                System.out.println("Found order: " + order.getId() + " with status: " + order.getStatus());

                // Kiểm tra xem đơn hàng có trạng thái là PROCESSING không
                if (order.getStatus() == Order.Status.PROCESSING) {
                    // Gửi email xác nhận thanh toán
                    emailService.sendVNPaySuccessEmail(email, orderId, amount, orderInfo);
                    return ResponseEntity.ok(Map.of("message", "Email xác nhận thanh toán đã được gửi thành công"));
                } else {
                    return ResponseEntity.badRequest().body(Map.of("error", "Đơn hàng không ở trạng thái PROCESSING"));
                }
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Không tìm thấy đơn hàng"));
            }
        } catch (Exception e) {
            System.err.println("Error sending email: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Lỗi gửi email", "message", e.getMessage()));
        }
    }
} 