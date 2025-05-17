package com.example.BackEndSpring.dto;

import com.example.BackEndSpring.model.Product;
import com.example.BackEndSpring.model.Wishlist;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WishlistDTO {
    
    private Long id;
    private Long userId;
    private Long productId;
    private LocalDateTime dateAdded;
    private Product product;
    
    public static WishlistDTO fromEntity(Wishlist wishlist) {
        WishlistDTO dto = new WishlistDTO();
        dto.setId(wishlist.getId());
        dto.setUserId(wishlist.getUser().getId());
        dto.setProductId(wishlist.getProduct().getId());
        dto.setDateAdded(wishlist.getCreatedAt());
        dto.setProduct(wishlist.getProduct());
        return dto;
    }
} 