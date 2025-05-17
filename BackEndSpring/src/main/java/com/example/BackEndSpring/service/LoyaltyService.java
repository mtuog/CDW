package com.example.BackEndSpring.service;

import com.example.BackEndSpring.model.LoyaltyTransaction;
import com.example.BackEndSpring.model.Order;
import com.example.BackEndSpring.model.User;
import com.example.BackEndSpring.repository.LoyaltyTransactionRepository;
import com.example.BackEndSpring.repository.UserRepository;
import com.example.BackEndSpring.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class LoyaltyService {
    
    @Autowired
    private LoyaltyTransactionRepository loyaltyTransactionRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private OrderRepository orderRepository;
    
    // Định nghĩa ngưỡng điểm cho các hạng thành viên
    private static final Map<User.MembershipRank, Integer> RANK_THRESHOLDS = new HashMap<>();
    static {
        RANK_THRESHOLDS.put(User.MembershipRank.BRONZE, 0);
        RANK_THRESHOLDS.put(User.MembershipRank.SILVER, 100);
        RANK_THRESHOLDS.put(User.MembershipRank.GOLD, 300);
        RANK_THRESHOLDS.put(User.MembershipRank.PLATINUM, 1000);
    }
    
    // Định nghĩa tỷ lệ tích điểm cho mỗi hạng thành viên (điểm trên 10,000 đồng chi tiêu)
    private static final Map<User.MembershipRank, Double> EARN_RATE = new HashMap<>();
    static {
        EARN_RATE.put(User.MembershipRank.BRONZE, 1.0);
        EARN_RATE.put(User.MembershipRank.SILVER, 1.2);
        EARN_RATE.put(User.MembershipRank.GOLD, 1.5);
        EARN_RATE.put(User.MembershipRank.PLATINUM, 2.0);
    }
    
    /**
     * Lấy thông tin điểm tích lũy của người dùng
     */
    public Map<String, Object> getLoyaltyInfo(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        
        User user = userOpt.get();
        List<LoyaltyTransaction> transactions = loyaltyTransactionRepository.findByUserId(userId);
        
        // Xác định hạng thành viên tiếp theo và số điểm cần để đạt được
        User.MembershipRank nextRank = getNextRank(user.getMembershipRank());
        Integer pointsToNextRank = nextRank != null ? 
            RANK_THRESHOLDS.get(nextRank) - user.getLoyaltyPoints() : 0;
        
        Map<String, Object> result = new HashMap<>();
        result.put("points", user.getLoyaltyPoints());
        result.put("rank", user.getMembershipRank());
        result.put("nextRank", nextRank);
        result.put("pointsToNextRank", pointsToNextRank);
        result.put("transactions", transactions);
        
        return result;
    }
    
    /**
     * Thêm điểm cho người dùng từ đơn hàng
     */
    @Transactional
    public LoyaltyTransaction addPointsFromOrder(Long userId, Order order, String description) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        
        User user = userOpt.get();
        
        // Kiểm tra xem đơn hàng đã được tích điểm chưa
        if (order != null && order.getId() != null) {
            boolean alreadyEarnedPoints = loyaltyTransactionRepository.existsByOrderIdAndTypeEarn(order.getId());
            if (alreadyEarnedPoints) {
                throw new RuntimeException("Order #" + order.getOrderCode() + " already has loyalty points");
            }
        }
        
        // Tính số điểm dựa trên giá trị đơn hàng và hạng thành viên
        // Nếu có subtotalAmount (đơn hàng có giảm giá), sử dụng giá trị này để tính điểm,
        // điều này khuyến khích người dùng sử dụng giảm giá mà không bị giảm điểm tích lũy
        double amountForPoints = order.getSubtotalAmount() != null && order.getSubtotalAmount() > 0 ? 
            order.getSubtotalAmount() : order.getTotalAmount();
        
        int points = calculateOrderPoints(amountForPoints, user.getMembershipRank());
        
        // Tạo mô tả chi tiết hơn nếu có mã giảm giá
        String finalDescription = description;
        if (order.getDiscountCodeValue() != null && !order.getDiscountCodeValue().isEmpty()) {
            finalDescription = description + " (Áp dụng mã giảm giá: " + order.getDiscountCodeValue() + ")";
        }
        
        // Tạo giao dịch mới
        LoyaltyTransaction transaction = new LoyaltyTransaction(
            user, 
            points, 
            LoyaltyTransaction.TransactionType.EARN, 
            finalDescription,
            order
        );
        
        loyaltyTransactionRepository.save(transaction);
        
        // Cập nhật điểm người dùng
        user.setLoyaltyPoints(user.getLoyaltyPoints() + points);
        
        // Kiểm tra và cập nhật hạng thành viên nếu cần
        updateMembershipRank(user);
        
        userRepository.save(user);
        
        return transaction;
    }
    
    /**
     * Thêm điểm cho người dùng (không liên quan đến đơn hàng)
     */
    @Transactional
    public LoyaltyTransaction addPoints(Long userId, int points, String description) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        
        User user = userOpt.get();
        
        // Tạo giao dịch mới
        LoyaltyTransaction transaction = new LoyaltyTransaction(
            user, 
            points, 
            LoyaltyTransaction.TransactionType.EARN, 
            description
        );
        
        loyaltyTransactionRepository.save(transaction);
        
        // Cập nhật điểm người dùng
        user.setLoyaltyPoints(user.getLoyaltyPoints() + points);
        
        // Kiểm tra và cập nhật hạng thành viên nếu cần
        updateMembershipRank(user);
        
        userRepository.save(user);
        
        return transaction;
    }
    
    /**
     * Sử dụng điểm của người dùng
     */
    @Transactional
    public LoyaltyTransaction redeemPoints(Long userId, int points, String description) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        
        User user = userOpt.get();
        
        // Kiểm tra xem người dùng có đủ điểm không
        if (user.getLoyaltyPoints() < points) {
            throw new RuntimeException("Not enough loyalty points");
        }
        
        // Tạo giao dịch mới
        LoyaltyTransaction transaction = new LoyaltyTransaction(
            user, 
            points, 
            LoyaltyTransaction.TransactionType.REDEEM, 
            description
        );
        
        loyaltyTransactionRepository.save(transaction);
        
        // Cập nhật điểm người dùng
        user.setLoyaltyPoints(user.getLoyaltyPoints() - points);
        
        // Kiểm tra và cập nhật hạng thành viên nếu cần (hiếm khi cần khi đổi điểm)
        updateMembershipRank(user);
        
        userRepository.save(user);
        
        return transaction;
    }
    
    /**
     * Cập nhật hạng thành viên dựa trên số điểm
     */
    private void updateMembershipRank(User user) {
        Integer points = user.getLoyaltyPoints();
        
        if (points >= RANK_THRESHOLDS.get(User.MembershipRank.PLATINUM)) {
            user.setMembershipRank(User.MembershipRank.PLATINUM);
        } else if (points >= RANK_THRESHOLDS.get(User.MembershipRank.GOLD)) {
            user.setMembershipRank(User.MembershipRank.GOLD);
        } else if (points >= RANK_THRESHOLDS.get(User.MembershipRank.SILVER)) {
            user.setMembershipRank(User.MembershipRank.SILVER);
        } else {
            user.setMembershipRank(User.MembershipRank.BRONZE);
        }
    }
    
    /**
     * Xác định hạng thành viên tiếp theo
     */
    private User.MembershipRank getNextRank(User.MembershipRank currentRank) {
        switch (currentRank) {
            case BRONZE:
                return User.MembershipRank.SILVER;
            case SILVER:
                return User.MembershipRank.GOLD;
            case GOLD:
                return User.MembershipRank.PLATINUM;
            case PLATINUM:
                return null; // Đã là hạng cao nhất
            default:
                return User.MembershipRank.SILVER;
        }
    }
    
    /**
     * Tính số điểm từ giá trị đơn hàng
     */
    private int calculateOrderPoints(double orderTotal, User.MembershipRank rank) {
        // Nếu rank là null hoặc không tồn tại trong map, sử dụng hạng BRONZE mặc định
        User.MembershipRank actualRank = rank;
        if (actualRank == null || !EARN_RATE.containsKey(actualRank)) {
            actualRank = User.MembershipRank.BRONZE;
        }
        
        // Tính điểm: cứ 10,000đ được 1 điểm (tỷ lệ có thể thay đổi theo hạng)
        double earnRate = EARN_RATE.get(actualRank);
        return (int) Math.floor((orderTotal / 10000) * earnRate);
    }
    
    /**
     * Lấy lịch sử giao dịch điểm của người dùng
     */
    public List<LoyaltyTransaction> getUserTransactions(Long userId) {
        return loyaltyTransactionRepository.findByUserId(userId);
    }
    
    /**
     * Khởi tạo hạng thành viên cho tất cả người dùng chưa có hạng thành viên
     * Phương thức này có thể được gọi thủ công khi cần thiết
     */
    @Transactional
    public void initializeMembershipRanksForNullUsers() {
        List<User> usersWithNullRank = userRepository.findByMembershipRankIsNull();
        for (User user : usersWithNullRank) {
            // Khởi tạo với hạng BRONZE mặc định
            user.setMembershipRank(User.MembershipRank.BRONZE);
            if (user.getLoyaltyPoints() == null) {
                user.setLoyaltyPoints(0);
            }
            // Cập nhật hạng dựa trên điểm hiện tại
            updateMembershipRank(user);
            userRepository.save(user);
        }
        System.out.println("Initialized membership ranks for " + usersWithNullRank.size() + " users");
    }
    
    /**
     * Cập nhật dữ liệu đơn hàng cho các giao dịch điểm tích lũy hiện có
     * Phương thức này có thể được gọi thủ công khi cần thiết
     */
    @Transactional
    public void updateExistingTransactionsWithOrderData() {
        List<LoyaltyTransaction> transactions = loyaltyTransactionRepository.findAll();
        int updatedCount = 0;
        
        for (LoyaltyTransaction tx : transactions) {
            if (tx.getOrder() != null) {
                Order order = tx.getOrder();
                
                // Cập nhật các trường từ đơn hàng nếu chưa có
                if (tx.getOrderCode() == null || tx.getOrderCode().isEmpty()) {
                    tx.setOrderCode(order.getOrderCode());
                }
                
                if (tx.getOrderAmount() == null) {
                    tx.setOrderAmount(order.getTotalAmount());
                }
                
                if (tx.getSubtotalAmount() == null && order.getSubtotalAmount() != null) {
                    tx.setSubtotalAmount(order.getSubtotalAmount());
                }
                
                if ((tx.getDiscountCodeValue() == null || tx.getDiscountCodeValue().isEmpty()) 
                        && order.getDiscountCodeValue() != null) {
                    tx.setDiscountCodeValue(order.getDiscountCodeValue());
                }
                
                loyaltyTransactionRepository.save(tx);
                updatedCount++;
            }
        }
        
        System.out.println("Updated " + updatedCount + " loyalty transactions with order data");
    }
    
    /**
     * Tích điểm cho tất cả đơn hàng đã hoàn thành (DELIVERED) nhưng chưa được tích điểm
     * Phương thức này có thể được gọi thủ công khi cần thiết
     * @return Số lượng đơn hàng đã được tích điểm
     */
    @Transactional
    public int processExistingDeliveredOrders() {
        // Lấy tất cả đơn hàng có trạng thái DELIVERED
        List<Order> deliveredOrders = orderRepository.findByStatus(Order.Status.DELIVERED);
        int processedCount = 0;
        
        for (Order order : deliveredOrders) {
            try {
                // Kiểm tra xem đơn hàng đã được tích điểm chưa
                if (order.getId() != null && !loyaltyTransactionRepository.existsByOrderIdAndTypeEarn(order.getId())) {
                    // Kiểm tra xem đơn hàng có người dùng không
                    if (order.getUser() != null) {
                        Long userId = order.getUser().getId();
                        String description = "Hoàn thành đơn hàng #" + order.getOrderCode();
                        
                        // Thêm điểm
                        addPointsFromOrder(userId, order, description);
                        
                        processedCount++;
                        System.out.println("Đã tích điểm cho đơn hàng cũ #" + order.getOrderCode());
                    }
                }
            } catch (Exception e) {
                // Log lỗi nhưng vẫn tiếp tục xử lý các đơn hàng khác
                System.err.println("Lỗi khi tích điểm cho đơn hàng #" + order.getOrderCode() + ": " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        System.out.println("Đã tích điểm cho " + processedCount + " đơn hàng đã hoàn thành");
        return processedCount;
    }
} 