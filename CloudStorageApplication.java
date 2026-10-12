package com.cloudstorage;

import com.cloudstorage.entity.User;
import com.cloudstorage.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.file.Files;
import java.nio.file.Paths;

@SpringBootApplication
public class CloudStorageApplication {

    public static void main(String[] args) {
        SpringApplication.run(CloudStorageApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Ensure uploads root directory exists
            Files.createDirectories(Paths.get("./uploads"));
            Files.createDirectories(Paths.get("./data"));

            // Seed demo account if database is empty
            if (userRepository.findByUsername("demo").isEmpty()) {
                User demoUser = new User();
                demoUser.setUsername("demo");
                demoUser.setEmail("demo@cloudstorage.io");
                demoUser.setFullName("Demo Cloud User");
                demoUser.setPassword(passwordEncoder.encode("demo123"));
                demoUser.setRole("ROLE_USER");
                demoUser.setStorageLimitBytes(5L * 1024 * 1024 * 1024); // 5 GB
                userRepository.save(demoUser);
                System.out.println(">>> Demo user created: username='demo', password='demo123'");
            }

            if (userRepository.findByUsername("admin").isEmpty()) {
                User adminUser = new User();
                adminUser.setUsername("admin");
                adminUser.setEmail("admin@cloudstorage.io");
                adminUser.setFullName("System Administrator");
                adminUser.setPassword(passwordEncoder.encode("password123"));
                adminUser.setRole("ROLE_ADMIN");
                adminUser.setStorageLimitBytes(20L * 1024 * 1024 * 1024); // 20 GB
                userRepository.save(adminUser);
                System.out.println(">>> Admin user created: username='admin', password='password123'");
            }

            System.out.println("==================================================================");
            System.out.println("Cloud Storage Application Backend Started Successfully!");
            System.out.println("API Endpoint: http://localhost:8080");
            System.out.println("H2 Database Console: http://localhost:8080/h2-console");
            System.out.println("JDBC URL: jdbc:h2:file:./data/cloudstorage | Username: sa | Password: (empty)");
            System.out.println("==================================================================");
        };
    }
}
