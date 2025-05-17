package com.example.BackEndSpring.service;

import com.example.BackEndSpring.model.Order;
import com.example.BackEndSpring.model.OrderItem;
import com.example.BackEndSpring.model.Product;
import com.example.BackEndSpring.model.ProductSize;
import com.example.BackEndSpring.model.User;
import com.example.BackEndSpring.repository.OrderRepository;
import com.example.BackEndSpring.repository.OrderItemRepository;
import com.example.BackEndSpring.repository.LoyaltyTransactionRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final LoyaltyService loyaltyService;
    private final ProductService productService;
    private final SettingService settingService;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;

    @Autowired
    public OrderService(OrderRepository orderRepository, OrderItemRepository orderItemRepository, 
                        LoyaltyService loyaltyService, ProductService productService,
                        SettingService settingService, LoyaltyTransactionRepository loyaltyTransactionRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.loyaltyService = loyaltyService;
        this.productService = productService;
        this.settingService = settingService;
        this.loyaltyTransactionRepository = loyaltyTransactionRepository;
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
    
    /**
     * Lấy tất cả đơn hàng với phân trang
     * @param pageable Thông tin phân trang
     * @return Page chứa các đơn hàng
     */
    public Page<Order> getAllOrdersWithPaging(Pageable pageable) {
        return orderRepository.findAll(pageable);
    }
    
    /**
     * Lấy đơn hàng với các bộ lọc và tìm kiếm
     * @param search Từ khóa tìm kiếm (tên, email, số điện thoại, mã đơn hàng)
     * @param status Trạng thái đơn hàng cần lọc
     * @param fromDate Ngày bắt đầu
     * @param toDate Ngày kết thúc
     * @param pageable Thông tin phân trang
     * @return Page đơn hàng đã được lọc
     */
    public Page<Order> getOrdersWithFilters(String search, Order.Status status, 
                                        LocalDateTime fromDate, LocalDateTime toDate, 
                                        Pageable pageable) {
        return orderRepository.findOrdersWithFilters(search, status, fromDate, toDate, pageable);
    }
    
    /**
     * Lấy đơn hàng theo ID
     * @param id ID của đơn hàng
     * @return Optional chứa đơn hàng nếu tìm thấy
     */
    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }
    
    /**
     * Lấy danh sách đơn hàng theo người dùng
     * @param user Đối tượng người dùng
     * @return Danh sách đơn hàng
     */
    public List<Order> getOrdersByUser(User user) {
        return orderRepository.findByUser(user);
    }
    
    /**
     * Lấy danh sách đơn hàng theo trạng thái
     * @param status Trạng thái cần lọc
     * @return Danh sách đơn hàng
     */
    public List<Order> getOrdersByStatus(Order.Status status) {
        return orderRepository.findByStatus(status);
    }
    
    /**
     * Tạo đơn hàng mới
     * @param order Đơn hàng cần tạo
     * @return Đơn hàng đã được lưu
     */
    @Transactional
    public Order createOrder(Order order) {
        // Đặt thời gian tạo đơn nếu chưa có
        if (order.getCreatedAt() == null) {
            order.setCreatedAt(LocalDateTime.now());
        }
        
        // Tạo mã đơn hàng nếu chưa có
        if (order.getOrderCode() == null || order.getOrderCode().isEmpty()) {
            String orderCode = generateOrderCode();
            order.setOrderCode(orderCode);
        }
        
        // Lưu đơn hàng trước
        Order savedOrder = orderRepository.save(order);
        
        // Cập nhật số lượng sản phẩm trong kho nếu cần
        if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
            for (OrderItem item : order.getOrderItems()) {
                if (item.getProduct() != null) {
                    productService.decreaseStock(item.getProduct().getId(), item.getQuantity(), item.getSize());
                }
            }
        }
        
        return savedOrder;
    }
    
    /**
     * Cập nhật trạng thái đơn hàng
     * @param id ID của đơn hàng
     * @param status Trạng thái mới
     * @return Đơn hàng đã được cập nhật
     */
    @Transactional
    public Order updateOrderStatus(Long id, Order.Status status) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + id));
        
        Order.Status oldStatus = order.getStatus();
        order.setStatus(status);
        
        // Xử lý cập nhật kho khi thay đổi trạng thái
        if (oldStatus == Order.Status.CANCELLED && status != Order.Status.CANCELLED) {
            // Nếu đơn hàng đã bị hủy, và giờ được kích hoạt lại (không còn là CANCELLED)
            // Cần giảm số lượng trong kho
            for (OrderItem item : order.getOrderItems()) {
                productService.decreaseStock(item.getProduct().getId(), item.getQuantity(), item.getSize());
            }
        } else if (oldStatus != Order.Status.CANCELLED && status == Order.Status.CANCELLED) {
            // Nếu đơn hàng đang hoạt động, và giờ bị hủy (chuyển sang CANCELLED)
            // Cần tăng số lượng trong kho
            for (OrderItem item : order.getOrderItems()) {
                productService.increaseStock(item.getProduct().getId(), item.getQuantity(), item.getSize());
            }
        }
        
        // Lưu đơn hàng với trạng thái mới
        Order updatedOrder = orderRepository.save(order);
        
        // Nếu đơn hàng chuyển sang trạng thái DELIVERED (đã giao hàng), tự động thêm điểm tích lũy
        if (status == Order.Status.DELIVERED && oldStatus != Order.Status.DELIVERED) {
            try {
                // Kiểm tra xem đơn hàng có người dùng không
                if (order.getUser() != null) {
                    Long userId = order.getUser().getId();
                    
                    // Kiểm tra xem đơn hàng đã được tích điểm chưa
                    boolean alreadyEarnedPoints = loyaltyTransactionRepository.existsByOrderIdAndTypeEarn(order.getId());
                    
                    if (!alreadyEarnedPoints) {
                        String description = "Hoàn thành đơn hàng #" + order.getOrderCode();
                        
                        // Gọi service để thêm điểm
                        loyaltyService.addPointsFromOrder(userId, updatedOrder, description);
                        
                        System.out.println("Đã tự động thêm điểm tích lũy cho đơn hàng #" + order.getOrderCode());
                    } else {
                        System.out.println("Đơn hàng #" + order.getOrderCode() + " đã được tích điểm trước đó");
                    }
                }
            } catch (Exception e) {
                // Log lỗi nhưng không dừng quy trình cập nhật trạng thái đơn hàng
                System.err.println("Lỗi khi thêm điểm tích lũy: " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        return updatedOrder;
    }
    
    /**
     * Xóa đơn hàng
     * @param id ID của đơn hàng cần xóa
     */
    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
    }
    
    /**
     * Đếm tổng số đơn hàng
     * @return Số lượng đơn hàng
     */
    public long countTotalOrders() {
        return orderRepository.count();
    }
    
    /**
     * Tính tổng doanh thu từ tất cả đơn hàng đã giao
     * @return Tổng doanh thu
     */
    public double calculateTotalRevenue() {
        Double revenue = orderRepository.sumTotalAmountByStatus(Order.Status.DELIVERED);
        return revenue != null ? revenue : 0;
    }
    
    /**
     * Đếm số đơn hàng theo trạng thái
     * @return Map chứa số lượng đơn hàng theo trạng thái
     */
    public Map<Order.Status, Long> countOrdersByStatus() {
        Map<Order.Status, Long> result = new HashMap<>();
        for (Order.Status status : Order.Status.values()) {
            result.put(status, orderRepository.countByStatus(status));
        }
        return result;
    }
    
    /**
     * Đếm số đơn hàng sau một ngày cụ thể
     * @param date Ngày bắt đầu
     * @return Số lượng đơn hàng
     */
    public long countOrdersAfterDate(LocalDateTime date) {
        return orderRepository.findByCreatedAtAfter(date).size();
    }
    
    /**
     * Tính tổng doanh thu sau một ngày cụ thể
     * @param date Ngày bắt đầu
     * @return Tổng doanh thu
     */
    public double calculateRevenueAfterDate(LocalDateTime date) {
        double revenue = 0;
        List<Order> orders = orderRepository.findByCreatedAtAfter(date);
        for (Order order : orders) {
            if (order.getStatus() == Order.Status.DELIVERED) {
                revenue += order.getTotalAmount();
            }
        }
        return revenue;
    }
    
    /**
     * Đếm số đơn hàng theo ngày trong 7 ngày gần đây
     * @return Map chứa số lượng đơn hàng theo ngày
     */
    public Map<String, Long> countOrdersByDayLast7Days() {
        Map<String, Long> result = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");
        
        for (int i = 6; i >= 0; i--) {
            LocalDateTime day = now.minusDays(i);
            LocalDateTime startOfDay = day.withHour(0).withMinute(0).withSecond(0);
            LocalDateTime endOfDay = day.withHour(23).withMinute(59).withSecond(59);
            
            List<Order> orders = orderRepository.findOrdersBetweenDates(startOfDay, endOfDay);
            String dayStr = day.format(formatter);
            result.put(dayStr, (long) orders.size());
        }
        
        return result;
    }
    
    /**
     * Đếm số đơn hàng giữa hai ngày
     * @param startDate Ngày bắt đầu
     * @param endDate Ngày kết thúc
     * @return Số lượng đơn hàng
     */
    public long countOrdersBetweenDates(LocalDateTime startDate, LocalDateTime endDate) {
        return orderRepository.findOrdersBetweenDates(startDate, endDate).size();
    }
    
    /**
     * Tính tổng doanh thu giữa hai ngày
     * @param startDate Ngày bắt đầu
     * @param endDate Ngày kết thúc
     * @return Tổng doanh thu
     */
    public double calculateRevenueBetweenDates(LocalDateTime startDate, LocalDateTime endDate) {
        double revenue = 0;
        List<Order> orders = orderRepository.findOrdersBetweenDates(startDate, endDate);
        for (Order order : orders) {
            if (order.getStatus() == Order.Status.DELIVERED) {
                revenue += order.getTotalAmount();
            }
        }
        return revenue;
    }
    
    /**
     * Tạo mã đơn hàng ngẫu nhiên
     * @return Mã đơn hàng với tiền tố từ cài đặt + số ngẫu nhiên
     */
    private String generateOrderCode() {
        // Lấy tiền tố từ cài đặt, sử dụng "ORD-" nếu không tìm thấy
        String prefix = settingService.getSettingValue("order_prefix", "ORD-");
        String randomPart = String.valueOf((int) (Math.random() * 900000 + 100000));
        return prefix + randomPart;
    }
}