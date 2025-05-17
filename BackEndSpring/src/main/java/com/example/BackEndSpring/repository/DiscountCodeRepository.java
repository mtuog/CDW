package com.example.BackEndSpring.repository;

import com.example.BackEndSpring.model.DiscountCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DiscountCodeRepository extends JpaRepository<DiscountCode, Long> {
    
    Optional<DiscountCode> findByCode(String code);
    
    List<DiscountCode> findByActive(boolean active);
    
    @Query("SELECT d FROM DiscountCode d WHERE d.active = true AND d.startDate <= :now AND d.endDate >= :now")
    List<DiscountCode> findAllActiveAndValid(LocalDateTime now);
    
    @Query("SELECT d FROM DiscountCode d WHERE d.endDate < :now")
    List<DiscountCode> findAllExpired(LocalDateTime now);
    
    boolean existsByCode(String code);
} 