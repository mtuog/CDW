package com.example.BackEndSpring.repository;

import com.example.BackEndSpring.model.PaymentSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentSettingsRepository extends JpaRepository<PaymentSettings, Long> {
    // Lấy cài đặt hiện tại (thường chỉ có 1 record)
    PaymentSettings findFirstByOrderByIdDesc();
} 