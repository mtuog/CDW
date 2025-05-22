package com.example.BackEndSpring;

import com.example.BackEndSpring.model.User;
import com.example.BackEndSpring.model.Role;
import com.example.BackEndSpring.repository.UserRepository;
import com.example.BackEndSpring.repository.RoleRepository;
import com.example.BackEndSpring.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Lớp chính khởi động ứng dụng Spring Boot
 * Lớp này chỉ có nhiệm vụ khởi động ứng dụng, các logic khởi tạo được di chuyển sang AppInitializer
 */
@SpringBootApplication
public class BackEndSpringApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackEndSpringApplication.class, args);
	}
	
	@Bean
	public RestTemplate restTemplate() {
		return new RestTemplate();
	}
	
	@Bean
	public CommandLineRunner initData(UserRepository userRepository, RoleRepository roleRepository, BCryptPasswordEncoder passwordEncoder) {
		return args -> {
			// Khởi tạo các role mặc định nếu chưa có
			if (roleRepository.findByName("ADMIN").isEmpty()) {
				roleRepository.save(new Role(null, "ADMIN", "Quản trị viên", null));
			}
			if (roleRepository.findByName("USER").isEmpty()) {
				roleRepository.save(new Role(null, "USER", "Người dùng thông thường", null));
			}
			
			// Kiểm tra xem đã có tài khoản admin chưa
			System.out.println("Đang kiểm tra tài khoản admin...");
			
			Optional<User> adminUser = userRepository.findByUsername("admin");
			Role adminRole = roleRepository.findByName("ADMIN").orElseThrow();
			if (adminUser.isEmpty()) {
				System.out.println("Không tìm thấy tài khoản admin. Đang tạo tài khoản admin mặc định...");
				User admin = new User();
				admin.setUsername("admin");
				admin.setEmail("admin@cdweb.com");
				admin.setPassword(passwordEncoder.encode("admin123"));
				admin.setVerified(true);
				admin.setCreatedAt(LocalDateTime.now());
				admin.setFullName("Administrator");
				admin.getRoles().add(adminRole);
				admin = userRepository.save(admin);
				System.out.println("Đã tạo tài khoản admin mặc định thành công!");
				System.out.println("Admin ID: " + admin.getId());
				System.out.println("Admin Username: " + admin.getUsername());
				System.out.println("Admin Email: admin@cdweb.com");
				System.out.println("Admin Roles: " + admin.getRoles());
			} else {
				User admin = adminUser.get();
				System.out.println("Đã tìm thấy tài khoản admin trong database.");
				System.out.println("Admin ID: " + admin.getId());
				System.out.println("Admin Username: " + admin.getUsername());
				System.out.println("Admin Email: " + admin.getEmail());
				System.out.println("Admin Roles: " + admin.getRoles());
			}
		};
	}
}
