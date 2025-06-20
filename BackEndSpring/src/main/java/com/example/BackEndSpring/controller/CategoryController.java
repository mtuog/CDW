package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.model.Category;
import com.example.BackEndSpring.service.CategoryService;
import com.example.BackEndSpring.service.DatabaseTranslationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true", 
    allowedHeaders = {"authorization", "content-type", "x-auth-token", "origin", "x-requested-with", "accept"},
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;
    private final DatabaseTranslationService translationService;

    @Autowired
    public CategoryController(CategoryService categoryService, DatabaseTranslationService translationService) {
        this.categoryService = categoryService;
        this.translationService = translationService;
    }

    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        List<Category> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }
    
    // GET all categories with translation
    @GetMapping("/translated")
    public ResponseEntity<List<Category>> getAllCategoriesTranslated(@RequestParam(defaultValue = "vi") String lang) {
        System.out.println("=== CATEGORY TRANSLATION REQUEST ===");
        System.out.println("Language parameter: " + lang);
        
        List<Category> categories = categoryService.getAllCategories();
        System.out.println("Original categories count: " + categories.size());
        for (Category cat : categories) {
            System.out.println("Original category: " + cat.getName());
        }
        
        List<Category> translatedCategories = translationService.translateCategories(categories, lang);
        System.out.println("Translated categories count: " + translatedCategories.size());
        for (Category cat : translatedCategories) {
            System.out.println("Translated category: " + cat.getName());
        }
        System.out.println("====================================");
        
        return ResponseEntity.ok(translatedCategories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable Long id) {
        Optional<Category> category = categoryService.getCategoryById(id);
        return category.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    @GetMapping("/name/{name}")
    public ResponseEntity<Category> getCategoryByName(@PathVariable String name) {
        Category category = categoryService.getCategoryByName(name);
        if (category != null) {
            return ResponseEntity.ok(category);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        Category savedCategory = categoryService.saveCategory(category);
        return new ResponseEntity<>(savedCategory, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Category> updateCategory(@PathVariable Long id, @RequestBody Category category) {
        Optional<Category> existingCategory = categoryService.getCategoryById(id);
        if (existingCategory.isPresent()) {
            category.setId(id);
            Category updatedCategory = categoryService.saveCategory(category);
            return ResponseEntity.ok(updatedCategory);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        Optional<Category> existingCategory = categoryService.getCategoryById(id);
        if (existingCategory.isPresent()) {
            categoryService.deleteCategory(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
} 