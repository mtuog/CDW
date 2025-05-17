package com.example.BackEndSpring;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Lớp chính khởi động ứng dụng Spring Boot
 * Lớp này chỉ có nhiệm vụ khởi động ứng dụng, các logic khởi tạo được di chuyển sang AppInitializer
 */
@SpringBootApplication
public class BackEndSpringApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackEndSpringApplication.class, args);
	}
}
