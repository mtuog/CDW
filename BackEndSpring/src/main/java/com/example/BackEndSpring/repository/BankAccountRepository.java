package com.example.BackEndSpring.repository;

import com.example.BackEndSpring.model.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {
    List<BankAccount> findByIsActiveTrue();
    List<BankAccount> findByBankNameContainingIgnoreCase(String bankName);
} 