package com.example.BackEndSpring.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.Embeddable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethod {
    private String id;
    private String name;
    private boolean enabled;
    private String description;
    private double fee;
    private String icon;
    private int position;
} 