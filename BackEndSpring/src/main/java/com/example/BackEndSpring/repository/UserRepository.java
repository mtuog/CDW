package com.example.BackEndSpring.repository;

import com.example.BackEndSpring.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByVerificationCode(String verificationCode);
    Optional<User> findByResetPasswordToken(String resetPasswordToken);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    Optional<User> findByVerificationToken(String token);
    List<User> findByMembershipRankIsNull();
} 