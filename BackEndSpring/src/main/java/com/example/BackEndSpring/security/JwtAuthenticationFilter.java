package com.example.BackEndSpring.security;

import com.example.BackEndSpring.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        // Log method và endpoint được gọi
        logger.info("Processing authentication for: " + request.getMethod() + " " + request.getRequestURI());
        
        final String authorizationHeader = request.getHeader("Authorization");
        
        logger.info("Authorization header: " + (authorizationHeader != null ? 
                    (authorizationHeader.length() > 15 ? 
                    authorizationHeader.substring(0, 15) + "..." : authorizationHeader) 
                    : "null"));

        String username = null;
        java.util.List<String> roles = null;
        String jwt = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
                Object rolesObj = jwtUtil.extractAllClaims(jwt).get("roles");
                if (rolesObj instanceof java.util.List) {
                    roles = (java.util.List<String>) rolesObj;
                } else if (rolesObj instanceof String) {
                    roles = java.util.Arrays.asList((String) rolesObj);
                }
                logger.info("JWT token is valid, extracted username: " + username + ", roles: " + roles);
            } catch (Exception e) {
                logger.error("JWT token validation failed", e);
            }
        } else {
            logger.warn("No JWT token found in request headers or token does not start with 'Bearer '");
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            logger.info("Security context was null, creating authentication for: " + username);
            
            try {
                // Handle both cases: roles exist or roles are empty/null
                List<SimpleGrantedAuthority> authorities;
                
                if (roles != null && !roles.isEmpty()) {
                    // Convert roles to authorities with ROLE_ prefix
                    authorities = roles.stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                        .collect(Collectors.toList());
                    logger.info("Created authorities from JWT roles: " + authorities);
                } else {
                    // Fallback: assign default USER role for users with empty roles (social login users)
                    authorities = java.util.Arrays.asList(new SimpleGrantedAuthority("ROLE_USER"));
                    logger.info("No roles in JWT, assigned default USER role for: " + username);
                }
                    
                    // Create a simple UserDetails object
                    UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                        .username(username)
                        .password("") // Not used for JWT validation
                        .authorities(authorities)
                        .build();
                    
                    // Validate token
                    if (jwtUtil.validateToken(jwt, userDetails)) {
                        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                                userDetails, null, authorities);
                        authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                        
                        logger.info("Authentication successful, set security context for: " + username);
                        logger.info("Final authorities: " + authorities);
                        
                        // Check if it's an admin endpoint and the user has admin role
                        if (request.getRequestURI().contains("/api/admin/")) {
                            boolean hasAdminRole = authorities.stream()
                                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
                            if (!hasAdminRole) {
                                logger.warn("User " + username + " attempted to access admin endpoint without ROLE_ADMIN");
                            } else {
                                logger.info("ADMIN access granted for: " + username);
                            }
                        }
                    } else {
                        logger.warn("Token is not valid for user: " + username);
                }
            } catch (Exception e) {
                logger.error("Failed to create authentication for user: " + username, e);
            }
        } else if (username != null) {
            logger.info("Security context already has authentication for: " + username);
        }

        filterChain.doFilter(request, response);
    }
} 