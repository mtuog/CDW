package com.example.BackEndSpring.config;

import com.example.BackEndSpring.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import jakarta.mail.MessagingException;
import java.io.PrintWriter;
import java.io.StringWriter;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<Map<String, String>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("message", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("message", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler({SQLException.class, DataAccessException.class, DataIntegrityViolationException.class})
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<Map<String, String>> handleDatabaseException(Exception ex) {
        log.error("Database error", ex);
        Map<String, String> response = new HashMap<>();
        
        String errorMessage = ex.getMessage();
        response.put("message", "Đã xảy ra lỗi khi thao tác với cơ sở dữ liệu");
        
        // Extract specific information from SQL errors
        if (ex instanceof SQLException) {
            SQLException sqlEx = (SQLException) ex;
            response.put("sqlState", sqlEx.getSQLState());
            response.put("errorCode", String.valueOf(sqlEx.getErrorCode()));
            
            // Handle common MySQL error codes
            if (sqlEx.getMessage().contains("doesn't have a default value")) {
                response.put("errorType", "MISSING_DEFAULT_VALUE");
                response.put("suggestion", "Cần cung cấp giá trị cho trường bắt buộc hoặc thêm giá trị mặc định trong entity class");
            } else if (sqlEx.getErrorCode() == 1062) {
                response.put("errorType", "DUPLICATE_ENTRY");
                response.put("suggestion", "Giá trị đã tồn tại, vui lòng sử dụng giá trị khác");
            }
        } else if (ex instanceof DataIntegrityViolationException) {
            response.put("errorType", "DATA_INTEGRITY_VIOLATION");
            response.put("suggestion", "Dữ liệu không hợp lệ hoặc vi phạm ràng buộc toàn vẹn");
        }
        
        response.put("error", errorMessage);
        response.put("details", ex.getClass().getName());
        
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<Map<String, String>> handleGlobalException(Exception ex) {
        log.error("Unhandled error", ex);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Đã xảy ra lỗi trong quá trình xử lý yêu cầu.");
        response.put("error", ex.getMessage());
        
        // Log error stack trace for debugging
        StringWriter sw = new StringWriter();
        ex.printStackTrace(new PrintWriter(sw));
        log.error("Error stack trace: {}", sw.toString());
        
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(MailAuthenticationException.class)
    public ResponseEntity<Object> handleMailAuthenticationException(MailAuthenticationException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", HttpStatus.SERVICE_UNAVAILABLE.value());
        body.put("error", "Mail Authentication Error");
        body.put("message", "Lỗi xác thực email. Vui lòng kiểm tra lại cấu hình SMTP.");
        body.put("details", ex.getMessage());
        
        return new ResponseEntity<>(body, HttpStatus.SERVICE_UNAVAILABLE);
    }
    
    @ExceptionHandler(MessagingException.class)
    public ResponseEntity<Object> handleMessagingException(MessagingException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", HttpStatus.SERVICE_UNAVAILABLE.value());
        body.put("error", "Messaging Error");
        body.put("message", "Lỗi gửi email. Vui lòng thử lại sau.");
        body.put("details", ex.getMessage());
        
        return new ResponseEntity<>(body, HttpStatus.SERVICE_UNAVAILABLE);
    }
} 