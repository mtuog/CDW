package com.example.BackEndSpring.repository;

import com.example.BackEndSpring.model.Order;
import com.example.BackEndSpring.model.User;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    List<Order> findByUser(User user);
    List<Order> findByStatus(Order.Status status);
    List<Order> findByUserAndStatus(User user, Order.Status status);
    
    Page<Order> findAll(Pageable pageable);
    
    List<Order> findByCreatedAtAfter(LocalDateTime date);
    
    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :startDate AND :endDate ORDER BY o.createdAt DESC")
    List<Order> findOrdersBetweenDates(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = :status")
    long countByStatus(@Param("status") Order.Status status);
    
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = :status")
    Double sumTotalAmountByStatus(@Param("status") Order.Status status);
    
    // Tìm kiếm nâng cao với phân trang
    @Query("SELECT o FROM Order o WHERE " +
           "(:search IS NULL OR " +
           "LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "o.phone LIKE CONCAT('%', :search, '%') OR " +
           "LOWER(o.discountCodeValue) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "(o.user IS NOT NULL AND " +
           "(LOWER(o.user.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(o.user.email) LIKE LOWER(CONCAT('%', :search, '%'))))) " +
           "AND (:status IS NULL OR o.status = :status) " +
           "AND (:fromDate IS NULL OR o.createdAt >= :fromDate) " +
           "AND (:toDate IS NULL OR o.createdAt <= :toDate)")
    Page<Order> findOrdersWithFilters(
           @Param("search") String search,
           @Param("status") Order.Status status,
           @Param("fromDate") LocalDateTime fromDate,
           @Param("toDate") LocalDateTime toDate,
           Pageable pageable);
} 