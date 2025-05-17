package com.example.BackEndSpring.repository;

import com.example.BackEndSpring.model.AddressBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AddressBookRepository extends JpaRepository<AddressBook, Long> {
    
    @Query("SELECT a FROM AddressBook a WHERE a.user.id = :userId")
    List<AddressBook> findByUserId(@Param("userId") Long userId);
    
    // Add a native query for troubleshooting
    @Query(value = "SELECT * FROM address_book WHERE user_id = :userId", nativeQuery = true)
    List<AddressBook> findByUserIdNative(@Param("userId") Long userId);
    
    @Query("SELECT a FROM AddressBook a WHERE a.user.id = :userId AND a.isDefault = true")
    Optional<AddressBook> findDefaultByUserId(@Param("userId") Long userId);
} 