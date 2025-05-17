package com.example.BackEndSpring.repository;

import com.example.BackEndSpring.model.LoyaltyTransaction;
import com.example.BackEndSpring.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LoyaltyTransactionRepository extends JpaRepository<LoyaltyTransaction, Long> {
    
    /**
     * Tìm tất cả giao dịch của một người dùng, sắp xếp theo thời gian gần nhất
     */
    @Query("SELECT lt FROM LoyaltyTransaction lt WHERE lt.user.id = :userId ORDER BY lt.createdAt DESC")
    List<LoyaltyTransaction> findByUserId(@Param("userId") Long userId);
    
    /**
     * Tìm tất cả giao dịch của một người dùng theo loại giao dịch
     */
    @Query("SELECT lt FROM LoyaltyTransaction lt WHERE lt.user.id = :userId AND lt.type = :type ORDER BY lt.createdAt DESC")
    List<LoyaltyTransaction> findByUserIdAndType(@Param("userId") Long userId, @Param("type") LoyaltyTransaction.TransactionType type);
    
    /**
     * Tính tổng điểm đã tích luỹ của người dùng
     */
    @Query("SELECT SUM(lt.points) FROM LoyaltyTransaction lt WHERE lt.user.id = :userId AND lt.type = 'EARN'")
    Integer getTotalEarnedPoints(@Param("userId") Long userId);
    
    /**
     * Tính tổng điểm đã sử dụng của người dùng
     */
    @Query("SELECT SUM(lt.points) FROM LoyaltyTransaction lt WHERE lt.user.id = :userId AND lt.type = 'REDEEM'")
    Integer getTotalRedeemedPoints(@Param("userId") Long userId);
    
    /**
     * Tìm tất cả giao dịch liên quan đến một đơn hàng
     */
    @Query("SELECT lt FROM LoyaltyTransaction lt WHERE lt.order.id = :orderId")
    List<LoyaltyTransaction> findByOrderId(@Param("orderId") Long orderId);
    
    /**
     * Kiểm tra xem đơn hàng đã được tích điểm chưa
     * @param orderId ID của đơn hàng cần kiểm tra
     * @return true nếu đơn hàng đã có giao dịch tích điểm, false nếu chưa
     */
    @Query("SELECT COUNT(lt) > 0 FROM LoyaltyTransaction lt WHERE lt.order.id = :orderId AND lt.type = 'EARN'")
    boolean existsByOrderIdAndTypeEarn(@Param("orderId") Long orderId);
} 