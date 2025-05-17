package com.example.BackEndSpring.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WishlistRequest {
    
    private Long productId;
    private Long userId;
} 