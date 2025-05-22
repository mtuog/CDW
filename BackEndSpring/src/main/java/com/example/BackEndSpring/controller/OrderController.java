package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.model.Order;
import com.example.BackEndSpring.model.User;
import com.example.BackEndSpring.model.OrderItem;
import com.example.BackEndSpring.model.Product;
import com.example.BackEndSpring.model.OrderDTO;
import com.example.BackEndSpring.model.UserShortDTO;
import com.example.BackEndSpring.service.OrderService;
import com.example.BackEndSpring.service.UserService;
import com.example.BackEndSpring.service.ProductService;
import com.example.BackEndSpring.repository.OrderRepository;
import com.example.BackEndSpring.repository.ReviewRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMethod;

@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"}, allowCredentials = "true", 
    allowedHeaders = {"authorization", "content-type", "x-auth-token", "origin", "x-requested-with", "accept"},
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RestController
@RequestMapping("/api/orders")
@Tag(name = "Order Controller", description = "API để quản lý đơn hàng")
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;
    private final ProductService productService;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;

    @Autowired
    public OrderController(OrderService orderService, UserService userService, ProductService productService, 
                          OrderRepository orderRepository, ReviewRepository reviewRepository) {
        this.orderService = orderService;
        this.userService = userService;
        this.productService = productService;
        this.orderRepository = orderRepository;
        this.reviewRepository = reviewRepository;
    }

    @Operation(summary = "Lấy danh sách tất cả đơn hàng")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công", 
                    content = @Content(schema = @Schema(implementation = Order.class)))
    })
    @GetMapping
    public ResponseEntity<?> getAllOrders(
            @Parameter(description = "Số trang (bắt đầu từ 0)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Số lượng đơn hàng mỗi trang (mặc định 10)")
            @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sắp xếp theo trường (mặc định là createdAt)")
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Thứ tự sắp xếp (asc hoặc desc)")
            @RequestParam(defaultValue = "desc") String sortDir,
            @Parameter(description = "Tìm kiếm theo mã đơn hàng, tên, email, số điện thoại")
            @RequestParam(required = false) String search,
            @Parameter(description = "Lọc theo trạng thái")
            @RequestParam(required = false) String status,
            @Parameter(description = "Lọc từ ngày (định dạng yyyy-MM-dd)")
            @RequestParam(required = false) String dateFrom,
            @Parameter(description = "Lọc đến ngày (định dạng yyyy-MM-dd)")
            @RequestParam(required = false) String dateTo) {
        
        try {
            System.out.println("Received search query: " + search);
            System.out.println("Received status filter: " + status);
            System.out.println("Received date range: " + dateFrom + " to " + dateTo);
            
            // Xử lý sắp xếp
            Sort sort = sortDir.equalsIgnoreCase("asc") ? 
                Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
            
            Pageable pageable = PageRequest.of(page, size, sort);
            
            // Xử lý tìm kiếm và lọc
            Page<Order> ordersPage;
            
            // Chuyển đổi trạng thái thành enum nếu có
            Order.Status statusEnum = null;
            if (status != null && !status.equals("all")) {
                try {
                    statusEnum = Order.Status.valueOf(status.toUpperCase());
                } catch (IllegalArgumentException e) {
                    // Bỏ qua nếu trạng thái không hợp lệ
                    System.out.println("Invalid status: " + status);
                }
            }
            
            // Chuyển đổi ngày từ string sang LocalDateTime nếu có
            LocalDateTime fromDate = null;
            if (dateFrom != null && !dateFrom.isEmpty()) {
                try {
                    fromDate = LocalDate.parse(dateFrom).atStartOfDay();
                } catch (Exception e) {
                    System.out.println("Invalid dateFrom format: " + dateFrom);
                }
            }
            
            LocalDateTime toDate = null;
            if (dateTo != null && !dateTo.isEmpty()) {
                try {
                    toDate = LocalDate.parse(dateTo).atTime(23, 59, 59);
                } catch (Exception e) {
                    System.out.println("Invalid dateTo format: " + dateTo);
                }
            }
            
            // Gọi service để lấy đơn hàng với các bộ lọc
            ordersPage = orderService.getOrdersWithFilters(
                search, statusEnum, fromDate, toDate, pageable);
            
            // Map sang DTO
            List<OrderDTO> orderDTOs = ordersPage.getContent().stream().map(order -> {
                OrderDTO dto = new OrderDTO();
                dto.setId(order.getId());
                dto.setOrderCode(order.getOrderCode());
                dto.setTotalAmount(order.getTotalAmount());
                dto.setStatus(order.getStatus().name());
                dto.setCreatedAt(order.getCreatedAt());
                if (order.getUser() != null) {
                    User user = order.getUser();
                    dto.setUser(new UserShortDTO(user.getId(), user.getUsername(), user.getFullName(), user.getPhone()));
                }
                return dto;
            }).collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("orders", orderDTOs);
            response.put("currentPage", ordersPage.getNumber());
            response.put("totalItems", ordersPage.getTotalElements());
            response.put("totalPages", ordersPage.getTotalPages());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi tải danh sách đơn hàng: " + e.getMessage());
        }
    }

    @Operation(summary = "Lấy chi tiết đơn hàng theo ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tìm thấy đơn hàng"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy đơn hàng")
    })
    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        return orderService.getOrderById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Lấy đơn hàng theo người dùng")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy người dùng")
    })
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Order>> getOrdersByUser(@PathVariable Long userId) {
        Optional<User> user = userService.getUserById(userId);
        if (user.isPresent()) {
            List<Order> orders = orderService.getOrdersByUser(user.get());
            return ResponseEntity.ok(orders);
        }
        return ResponseEntity.notFound().build();
    }

    @Operation(summary = "Lấy đơn hàng theo trạng thái")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "400", description = "Trạng thái không hợp lệ")
    })
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Order>> getOrdersByStatus(@PathVariable String status) {
        try {
            Order.Status orderStatus = Order.Status.valueOf(status.toUpperCase());
            List<Order> orders = orderService.getOrdersByStatus(orderStatus);
            return ResponseEntity.ok(orders);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @Operation(summary = "Tạo đơn hàng mới")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Đơn hàng được tạo thành công"),
        @ApiResponse(responseCode = "400", description = "Dữ liệu đơn hàng không hợp lệ")
    })
    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody Order order) {
        try {
            // Kiểm tra thông tin cơ bản
            if (order.getShippingAddress() == null || order.getPhone() == null) {
                return ResponseEntity.badRequest().build();
            }

            // Đặt trạng thái mặc định là PENDING nếu chưa có
            if (order.getStatus() == null) {
                order.setStatus(Order.Status.PENDING);
            }

            // Đặt thời gian tạo đơn hàng
            if (order.getCreatedAt() == null) {
                order.setCreatedAt(LocalDateTime.now());
            }

            // Log thông tin đơn hàng
            System.out.println("====================== CREATING NEW ORDER ======================");
            System.out.println("User: " + (order.getUser() != null ? order.getUser().getUsername() : "Guest"));
            if (order.getUser() != null) {
                System.out.println("User Email: " + order.getUser().getEmail());
            }
            System.out.println("Shipping Address: " + order.getShippingAddress());
            System.out.println("Phone: " + order.getPhone());
            System.out.println("Total Amount: " + order.getTotalAmount());
            System.out.println("Payment Method: " + order.getPaymentMethod());
            System.out.println("==============================================================");
            
            if (order.getOrderItems() != null) {
                System.out.println("Order Items Count: " + order.getOrderItems().size());
                order.getOrderItems().forEach(item -> {
                    System.out.println("Item Product ID: " + (item.getProduct() != null ? item.getProduct().getId() : "null"));
                    System.out.println("Item Quantity: " + item.getQuantity());
                    System.out.println("Item Price: " + item.getPrice());
                });
            } else {
                System.out.println("No order items provided");
            }

            // Tạo đơn hàng
            Order createdOrder = orderService.createOrder(order);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdOrder);
        } catch (Exception e) {
            System.err.println("Error creating order: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Cập nhật trạng thái đơn hàng")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Trạng thái được cập nhật thành công"),
        @ApiResponse(responseCode = "400", description = "Trạng thái không hợp lệ"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy đơn hàng")
    })
    @PutMapping("/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false, defaultValue = "true") boolean sendEmail) {
        try {
            Order.Status orderStatus = Order.Status.valueOf(status.toUpperCase());
            System.out.println("Controller - Updating order " + id + " to status: " + orderStatus);
            
            // Lấy order trước khi cập nhật để log
            Optional<Order> orderBeforeUpdate = orderService.getOrderById(id);
            if (orderBeforeUpdate.isPresent()) {
                System.out.println("Order " + id + " current status: " + orderBeforeUpdate.get().getStatus());
            }
            
            // Gọi service để cập nhật trạng thái và gửi email thông báo
            System.out.println("Cập nhật trạng thái đơn hàng trước, sau đó mới gửi email...");
            Order updatedOrder = orderService.updateOrderStatusAndNotify(id, orderStatus, sendEmail);
            
            // Log sau khi cập nhật
            System.out.println("Order " + id + " updated status: " + updatedOrder.getStatus());
            if (sendEmail) {
                System.out.println("Email notification sent based on the updated status: " + updatedOrder.getStatus());
            }
            
            // Cập nhật xong trả về kết quả
            return ResponseEntity.ok(updatedOrder);
        } catch (IllegalArgumentException e) {
            System.err.println("Invalid status value: " + status);
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            System.err.println("Error updating order status: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Xóa đơn hàng")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Đơn hàng được xóa thành công"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy đơn hàng")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        if (orderService.getOrderById(id).isPresent()) {
            orderService.deleteOrder(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @Operation(summary = "Lấy thống kê tổng quan về đơn hàng")
    @ApiResponse(responseCode = "200", description = "Thống kê thành công")
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getOrderStats() {
        Map<String, Object> stats = new HashMap<>();
        
        long totalOrders = orderService.countTotalOrders();
        double totalRevenue = orderService.calculateTotalRevenue();
        
        // Thống kê theo trạng thái
        Map<Order.Status, Long> ordersByStatus = orderService.countOrdersByStatus();
        
        // Thống kê theo thời gian (30 ngày gần đây)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long recentOrders = orderService.countOrdersAfterDate(thirtyDaysAgo);
        double recentRevenue = orderService.calculateRevenueAfterDate(thirtyDaysAgo);
        
        // Đơn hàng theo ngày trong 7 ngày gần đây
        Map<String, Long> ordersByDay = orderService.countOrdersByDayLast7Days();
        
        // Tỷ lệ hoàn thành đơn hàng
        double completionRate = (double) ordersByStatus.getOrDefault(Order.Status.DELIVERED, 0L) / totalOrders;
        
        stats.put("totalOrders", totalOrders);
        stats.put("totalRevenue", totalRevenue);
        stats.put("ordersByStatus", ordersByStatus);
        stats.put("recentOrders", recentOrders);
        stats.put("recentRevenue", recentRevenue);
        stats.put("ordersByDay", ordersByDay);
        stats.put("completionRate", completionRate);
        
        return ResponseEntity.ok(stats);
    }

    @Operation(summary = "Tạo đơn hàng mẫu để test")
    @ApiResponse(responseCode = "201", description = "Đơn hàng mẫu được tạo thành công")
    @GetMapping("/test-create")
    public ResponseEntity<Order> createTestOrder() {
        try {
            Order testOrder = new Order();
            testOrder.setTotalAmount(100000);
            testOrder.setStatus(Order.Status.PENDING);
            testOrder.setShippingAddress("123 Test Street, Test City");
            testOrder.setPhone("0123456789");
            testOrder.setPaymentMethod("COD");
            
            // Lưu order trước và lấy ID
            Order savedOrder = orderService.createOrder(testOrder);
            
            // Tạo một order item mẫu
            OrderItem item = new OrderItem();
            item.setOrder(savedOrder);
            item.setQuantity(1);
            item.setPrice(100000);
            item.setSize("M");
            item.setColor("Blue");
            
            // Cần một product từ database để gán vào order item
            // Giả sử có một product với ID = 1
            Optional<Product> product = productService.getProductById(1L);
            if (product.isPresent()) {
                item.setProduct(product.get());
                // Thêm item vào order và lưu
                savedOrder.getOrderItems().add(item);
                return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(savedOrder));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(savedOrder); // Trả về order không có item nếu không có product
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/statistics")
    @Operation(summary = "Get order statistics", description = "Retrieves aggregated order statistics for dashboard")
    public ResponseEntity<Map<String, Object>> getOrderStatistics() {
        Map<String, Object> statistics = new HashMap<>();
        
        // Lấy tổng doanh thu
        double totalRevenue = orderService.calculateTotalRevenue();
        statistics.put("totalRevenue", totalRevenue);
        
        // Lấy tổng số đơn hàng
        long totalOrders = orderService.countTotalOrders();
        statistics.put("totalOrders", totalOrders);
        
        // Tính giá trị đơn hàng trung bình
        double averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        statistics.put("averageOrderValue", averageOrderValue);
        
        // Đếm số lượng đơn hàng theo trạng thái
        Map<Order.Status, Long> countByStatus = orderService.countOrdersByStatus();
        statistics.put("countByStatus", countByStatus);
        
        // Tạo dữ liệu doanh thu theo tháng (6 tháng gần đây)
        List<Map<String, Object>> revenueByMonth = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime startOfMonth = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime endOfMonth;
            if (i > 0) {
                endOfMonth = startOfMonth.plusMonths(1).minusNanos(1);
            } else {
                endOfMonth = now;
            }
            
            double revenue = orderService.calculateRevenueBetweenDates(startOfMonth, endOfMonth);
            long orders = orderService.countOrdersBetweenDates(startOfMonth, endOfMonth);
            
            Map<String, Object> monthData = new HashMap<>();
            monthData.put("name", "Tháng " + startOfMonth.getMonthValue());
            monthData.put("revenue", revenue);
            monthData.put("orders", orders);
            
            revenueByMonth.add(monthData);
        }
        statistics.put("revenueByMonth", revenueByMonth);
        
        // Tạo dữ liệu doanh thu theo tuần (4 tuần gần đây)
        List<Map<String, Object>> revenueByWeek = new ArrayList<>();
        for (int i = 3; i >= 0; i--) {
            LocalDateTime startOfWeek = now.minusWeeks(i).with(java.time.DayOfWeek.MONDAY).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime endOfWeek;
            if (i > 0) {
                endOfWeek = startOfWeek.plusWeeks(1).minusNanos(1);
            } else {
                endOfWeek = now;
            }
            
            double revenue = orderService.calculateRevenueBetweenDates(startOfWeek, endOfWeek);
            long orders = orderService.countOrdersBetweenDates(startOfWeek, endOfWeek);
            
            Map<String, Object> weekData = new HashMap<>();
            weekData.put("name", "Tuần " + (4 - i));
            weekData.put("revenue", revenue);
            weekData.put("orders", orders);
            
            revenueByWeek.add(weekData);
        }
        statistics.put("revenueByWeek", revenueByWeek);
        
        return ResponseEntity.ok(statistics);
    }

    @Operation(summary = "Lấy danh sách sản phẩm chưa đánh giá của người dùng")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy người dùng")
    })
    @GetMapping("/pending-reviews/{userId}")
    public ResponseEntity<?> getPendingReviewProducts(@PathVariable Long userId) {
        try {
            // Kiểm tra xem người dùng có tồn tại không
            Optional<User> userOpt = userService.getUserById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
            }
            
            User user = userOpt.get();
            
            // Lấy tất cả đơn hàng đã hoàn thành của người dùng
            List<Order> completedOrders = orderRepository.findByUserAndStatus(user, Order.Status.DELIVERED);
            
            List<Map<String, Object>> pendingReviewItems = new ArrayList<>();
            
            for (Order order : completedOrders) {
                for (OrderItem item : order.getOrderItems()) {
                    // Kiểm tra xem sản phẩm này đã được đánh giá chưa
                    boolean hasReviewed = false;
                    try {
                        hasReviewed = reviewRepository.existsByUserIdAndProductId(userId, item.getProduct().getId());
                    } catch (Exception e) {
                        System.out.println("Error checking if product has been reviewed: " + e.getMessage());
                    }
                    
                    if (!hasReviewed) {
                        Map<String, Object> pendingItem = new HashMap<>();
                        pendingItem.put("orderId", order.getId());
                        pendingItem.put("orderDate", order.getCreatedAt());
                        pendingItem.put("productId", item.getProduct().getId());
                        pendingItem.put("productName", item.getProduct().getName());
                        pendingItem.put("productImage", item.getProduct().getImg());
                        pendingItem.put("price", item.getPrice());
                        pendingItem.put("quantity", item.getQuantity());
                        
                        pendingReviewItems.add(pendingItem);
                    }
                }
            }
            
            return ResponseEntity.ok(pendingReviewItems);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }
}