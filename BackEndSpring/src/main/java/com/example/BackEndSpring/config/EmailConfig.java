package com.example.BackEndSpring.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class EmailConfig {
    
    @Value("${spring.mail.host}")
    private String host;
    
    @Value("${spring.mail.port}")
    private int port;
    
    @Value("${spring.mail.username}")
    private String username;
    
    @Value("${spring.mail.password}")
    private String password;
    
    @Value("${spring.mail.properties.mail.smtp.auth}")
    private String auth;
    
    @Value("${spring.mail.properties.mail.smtp.starttls.enable}")
    private String starttls;
    
    @Value("${spring.mail.properties.mail.smtp.timeout:5000}")
    private String timeout;
    
    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(host);
        mailSender.setPort(port);
        
        if (username != null && !username.isEmpty()) {
            mailSender.setUsername(username);
        }
        
        if (password != null && !password.isEmpty()) {
            mailSender.setPassword(password);
        }
        
        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", auth);
        props.put("mail.smtp.starttls.enable", starttls);
        props.put("mail.smtp.timeout", timeout);
        props.put("mail.debug", "true"); // Enable for debugging
        
        return mailSender;
    }
} 