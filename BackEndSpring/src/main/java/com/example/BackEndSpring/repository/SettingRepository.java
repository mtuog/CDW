package com.example.BackEndSpring.repository;

import com.example.BackEndSpring.model.Setting;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SettingRepository extends JpaRepository<Setting, Long> {
    Optional<Setting> findBySettingKey(String settingKey);
    List<Setting> findByGroupName(String groupName);
    boolean existsBySettingKey(String settingKey);
} 