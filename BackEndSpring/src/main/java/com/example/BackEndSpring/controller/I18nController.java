package com.example.BackEndSpring.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.RequestContextUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.*;

@RestController
@RequestMapping("/api/i18n")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"}) // Cho phép React call
public class I18nController {

    @Autowired
    private MessageSource messageSource;

    /**
     * Lấy tất cả messages theo ngôn ngữ - Dành cho Frontend
     */
    @GetMapping("/messages")
    public ResponseEntity<Map<String, Object>> getMessages(
            @RequestParam(defaultValue = "vi") String lang,
            HttpServletRequest request) {

        Map<String, Object> response = new HashMap<>();

        try {
            Locale locale = Locale.forLanguageTag(lang);
            Map<String, String> messages = new HashMap<>();

            // ===== HOME PAGE MESSAGES =====
            messages.put("home.banner.title",
                    messageSource.getMessage("home.banner.title", null, locale));
            messages.put("home.banner.subtitle",
                    messageSource.getMessage("home.banner.subtitle", null, locale));
            messages.put("home.shopNow",
                    messageSource.getMessage("home.shopNow", null, "Mua Ngay", locale));
            messages.put("home.discover",
                    messageSource.getMessage("home.discover", null, "Khám Phá", locale));
            messages.put("home.toShop",
                    messageSource.getMessage("home.toShop", null, "Đến Shop", locale));

            // ===== HEADER MESSAGES =====
            messages.put("header.freeShipping",
                    messageSource.getMessage("header.freeShipping", null, "Miễn phí vận chuyển cho đơn hàng tiêu chuẩn trên $100", locale));
            messages.put("header.help",
                    messageSource.getMessage("header.help", null, "Trợ giúp và câu hỏi thường gặp", locale));
            messages.put("header.myAccount",
                    messageSource.getMessage("header.myAccount", null, "Tài khoản của tôi", locale));
            messages.put("header.login",
                    messageSource.getMessage("header.login", null, "Đăng nhập", locale));
            messages.put("header.logout",
                    messageSource.getMessage("header.logout", null, "Đăng xuất", locale));

            // ===== MENU NAVIGATION =====
            messages.put("menu.home",
                    messageSource.getMessage("menu.home", null, "Trang chủ", locale));
            messages.put("menu.products",
                    messageSource.getMessage("menu.products", null, "Sản phẩm", locale));
            messages.put("menu.cart",
                    messageSource.getMessage("menu.cart", null, "Giỏ hàng", locale));
            messages.put("menu.about",
                    messageSource.getMessage("menu.about", null, "Giới thiệu", locale));
            messages.put("menu.contact",
                    messageSource.getMessage("menu.contact", null, "Liên hệ", locale));

            // ===== COMMON ACTIONS =====
            messages.put("common.search",
                    messageSource.getMessage("common.search", null, "Tìm kiếm", locale));
            messages.put("common.add",
                    messageSource.getMessage("common.add", null, "Thêm", locale));
            messages.put("common.loading",
                    messageSource.getMessage("common.loading", null, "Đang tải...", locale));
            messages.put("common.save",
                    messageSource.getMessage("common.save", null, "Lưu", locale));
            messages.put("common.cancel",
                    messageSource.getMessage("common.cancel", null, "Hủy", locale));
            messages.put("common.edit",
                    messageSource.getMessage("common.edit", null, "Sửa", locale));
            messages.put("common.delete",
                    messageSource.getMessage("common.delete", null, "Xóa", locale));
            messages.put("common.yes",
                    messageSource.getMessage("common.yes", null, "Có", locale));
            messages.put("common.no",
                    messageSource.getMessage("common.no", null, "Không", locale));

            // ===== PRODUCT PAGE =====
            messages.put("product.filter",
                    messageSource.getMessage("product.filter", null, "Lọc", locale));
            messages.put("product.moreCategories",
                    messageSource.getMessage("product.moreCategories", null, "Nhiều Hơn", locale));
            messages.put("product.searchPlaceholder",
                    messageSource.getMessage("product.searchPlaceholder", null, "Tìm kiếm sản phẩm...", locale));
            messages.put("product.loadError",
                    messageSource.getMessage("product.loadError", null, "Không thể tải dữ liệu. Vui lòng thử lại sau.", locale));
            messages.put("product.addToCart",
                    messageSource.getMessage("product.addToCart", null, "Thêm vào giỏ", locale));
            messages.put("product.viewDetail",
                    messageSource.getMessage("product.viewDetail", null, "Xem chi tiết", locale));
            messages.put("product.outOfStock",
                    messageSource.getMessage("product.outOfStock", null, "Hết hàng", locale));
            messages.put("product.inStock",
                    messageSource.getMessage("product.inStock", null, "Còn hàng", locale));
            messages.put("product.sortBy",
                    messageSource.getMessage("product.sortBy", null, "Sắp xếp theo", locale));
            messages.put("product.sortDefault",
                    messageSource.getMessage("product.sortDefault", null, "Mặc định", locale));
            messages.put("product.sortLowToHigh",
                    messageSource.getMessage("product.sortLowToHigh", null, "Giá: Thấp đến cao", locale));
            messages.put("product.sortHighToLow",
                    messageSource.getMessage("product.sortHighToLow", null, "Giá: Cao đến thấp", locale));

            // ===== CART MESSAGES =====
            messages.put("cart.title",
                    messageSource.getMessage("cart.title", null, "Giỏ hàng", locale));
            messages.put("cart.empty",
                    messageSource.getMessage("cart.empty", null, "Giỏ hàng trống", locale));
            messages.put("cart.total",
                    messageSource.getMessage("cart.total", null, "Tổng cộng", locale));
            messages.put("cart.checkout",
                    messageSource.getMessage("cart.checkout", null, "Thanh toán", locale));

            // ===== COMMON BUTTONS =====
            messages.put("button.submit",
                    messageSource.getMessage("button.submit", null, "Gửi", locale));
            messages.put("button.cancel",
                    messageSource.getMessage("button.cancel", null, "Hủy", locale));
            messages.put("button.save",
                    messageSource.getMessage("button.save", null, "Lưu", locale));
            messages.put("button.edit",
                    messageSource.getMessage("button.edit", null, "Sửa", locale));
            messages.put("button.delete",
                    messageSource.getMessage("button.delete", null, "Xóa", locale));

            // ===== FORM LABELS =====
            messages.put("form.name",
                    messageSource.getMessage("form.name", null, "Tên", locale));
            messages.put("form.email",
                    messageSource.getMessage("form.email", null, "Email", locale));
            messages.put("form.phone",
                    messageSource.getMessage("form.phone", null, "Số điện thoại", locale));
            messages.put("form.message",
                    messageSource.getMessage("form.message", null, "Tin nhắn", locale));
            messages.put("form.address",
                    messageSource.getMessage("form.address", null, "Địa chỉ", locale));
            messages.put("form.password",
                    messageSource.getMessage("form.password", null, "Mật khẩu", locale));
            messages.put("form.confirmPassword",
                    messageSource.getMessage("form.confirmPassword", null, "Xác nhận mật khẩu", locale));

            // ===== SUCCESS/ERROR MESSAGES =====
            messages.put("message.success",
                    messageSource.getMessage("message.success", null, "Thành công", locale));
            messages.put("message.error",
                    messageSource.getMessage("message.error", null, "Có lỗi xảy ra", locale));
            messages.put("message.loading",
                    messageSource.getMessage("message.loading", null, "Đang tải...", locale));
            messages.put("message.saved",
                    messageSource.getMessage("message.saved", null, "Đã lưu thành công", locale));
            messages.put("message.deleted",
                    messageSource.getMessage("message.deleted", null, "Đã xóa thành công", locale));
            messages.put("message.updated",
                    messageSource.getMessage("message.updated", null, "Đã cập nhật thành công", locale));

            // ===== NAVIGATION =====
            messages.put("nav.previous",
                    messageSource.getMessage("nav.previous", null, "Trước", locale));
            messages.put("nav.next",
                    messageSource.getMessage("nav.next", null, "Tiếp theo", locale));
            messages.put("nav.first",
                    messageSource.getMessage("nav.first", null, "Đầu tiên", locale));
            messages.put("nav.last",
                    messageSource.getMessage("nav.last", null, "Cuối cùng", locale));

            // Response data
            response.put("success", true);
            response.put("messages", messages);
            response.put("locale", locale.toString());
            response.put("displayName", locale.getDisplayName());
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error loading messages: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Thay đổi ngôn ngữ và lưu vào session
     */
    @PostMapping("/change-language")
    public ResponseEntity<Map<String, Object>> changeLanguage(
            @RequestParam String lang,
            HttpServletRequest request,
            HttpServletResponse response) {

        Map<String, Object> responseBody = new HashMap<>();

        try {
            Locale newLocale = Locale.forLanguageTag(lang);

            // Set locale vào session
            RequestContextUtils.getLocaleResolver(request)
                    .setLocale(request, response, newLocale);

            responseBody.put("success", true);
            responseBody.put("message", "Language changed successfully");
            responseBody.put("locale", newLocale.toString());
            responseBody.put("displayName", newLocale.getDisplayName());
            responseBody.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(responseBody);

        } catch (Exception e) {
            responseBody.put("success", false);
            responseBody.put("error", "Invalid language parameter: " + e.getMessage());
            return ResponseEntity.badRequest().body(responseBody);
        }
    }

    /**
     * Lấy ngôn ngữ hiện tại
     */
    @GetMapping("/current-language")
    public ResponseEntity<Map<String, Object>> getCurrentLanguage(
            HttpServletRequest request) {

        Map<String, Object> response = new HashMap<>();

        try {
            Locale currentLocale = RequestContextUtils.getLocale(request);

            response.put("success", true);
            response.put("locale", currentLocale.toString());
            response.put("language", currentLocale.getLanguage());
            response.put("country", currentLocale.getCountry());
            response.put("displayName", currentLocale.getDisplayName());
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error getting current language: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Lấy danh sách ngôn ngữ hỗ trợ
     */
    @GetMapping("/supported-languages")
    public ResponseEntity<Map<String, Object>> getSupportedLanguages() {

        Map<String, Object> response = new HashMap<>();

        try {
            List<Map<String, String>> languages = new ArrayList<>();

            // Tiếng Việt
            Map<String, String> vi = new HashMap<>();
            vi.put("code", "vi");
            vi.put("name", "Tiếng Việt");
            vi.put("flag", "🇻🇳");
            languages.add(vi);

            // English
            Map<String, String> en = new HashMap<>();
            en.put("code", "en");
            en.put("name", "English");
            en.put("flag", "🇺🇸");
            languages.add(en);

            response.put("success", true);
            response.put("languages", languages);
            response.put("total", languages.size());
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error getting supported languages: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Lấy message cụ thể theo key
     */
    @GetMapping("/message/{key}")
    public ResponseEntity<Map<String, Object>> getMessage(
            @PathVariable String key,
            @RequestParam(defaultValue = "vi") String lang,
            @RequestParam(required = false) String[] args) {

        Map<String, Object> response = new HashMap<>();

        try {
            Locale locale = Locale.forLanguageTag(lang);
            Object[] messageArgs = args != null ? args : null;

            String message = messageSource.getMessage(key, messageArgs, key, locale);

            response.put("success", true);
            response.put("key", key);
            response.put("message", message);
            response.put("locale", locale.toString());
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error getting message: " + e.getMessage());
            response.put("key", key);
            return ResponseEntity.status(500).body(response);
        }
    }
}
