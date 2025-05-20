package com.example.BackEndSpring.repository;

import com.example.BackEndSpring.model.BankPayment;
import com.example.BackEndSpring.model.PaymentLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentLogRepository extends JpaRepository<PaymentLog, Long> {
    List<PaymentLog> findByPayment(BankPayment payment);
    List<PaymentLog> findByOrderId(Long orderId);
    List<PaymentLog> findByTransactionCode(String transactionCode);
    List<PaymentLog> findByActionOrderByTimestampDesc(String action);
    List<PaymentLog> findByOrderIdOrderByTimestampDesc(Long orderId);
} 