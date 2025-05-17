package com.example.BackEndSpring.repository;

import com.example.BackEndSpring.model.Order;
import com.example.BackEndSpring.model.OrderItem;
import com.example.BackEndSpring.model.Product;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrder(Order order);
    List<OrderItem> findByProduct(Product product);
} 