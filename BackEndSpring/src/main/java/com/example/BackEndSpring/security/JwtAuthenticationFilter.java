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
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

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
        String jwt = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
                logger.info("JWT token is valid, extracted username: " + username);
            } catch (Exception e) {
                logger.error("JWT token validation failed", e);
            }
        } else {
            logger.warn("No JWT token found in request headers or token does not start with 'Bearer '");
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            logger.info("Security context was null, loading user details for: " + username);
            
            try {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
                logger.info("User loaded successfully: " + userDetails.getUsername());
                
                if (jwtUtil.validateToken(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                    
                    logger.info("Authentication successful, set security context for: " + username);
                    logger.info("Authorities: " + userDetails.getAuthorities());
                } else {
                    logger.warn("Token is not valid for user: " + username);
                }
            } catch (Exception e) {
                logger.error("Failed to load user: " + username, e);
            }
        } else if (username == null) {
            logger.warn("No username extracted from JWT token");
        } else {
            logger.info("SecurityContext already contains an authentication");
        }

        filterChain.doFilter(request, response);
    }
} 