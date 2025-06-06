package com.example.BackEndSpring.repository;

import com.example.BackEndSpring.model.BankPayment;
import com.example.BackEndSpring.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankPaymentRepository extends JpaRepository<BankPayment, Long> {
    List<BankPayment> findByOrderId(Long orderId);
    Optional<BankPayment> findByTransactionCode(String transactionCode);
    
    // Custom query with fetch join to load Order eagerly
    @Query("SELECT b FROM BankPayment b LEFT JOIN FETCH b.order WHERE b.status = :status")
    List<BankPayment> findByStatus(@Param("status") BankPayment.PaymentStatus status);
    
    List<BankPayment> findByOrder(Order order);
    Optional<BankPayment> findTopByOrderOrderByCreatedAtDesc(Order order);
} 