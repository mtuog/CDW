package com.example.BackEndSpring.service;

import com.example.BackEndSpring.model.Category;
import com.example.BackEndSpring.repository.CategoryRepository;
import com.example.BackEndSpring.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Autowired
    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    public List<Category> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        
        // Đếm số lượng sản phẩm cho mỗi danh mục
        for (Category category : categories) {
            Long productCount = productRepository.countByCategoryId(category.getId());
            category.setProductCount(productCount);
        }
        
        return categories;
    }

    public Optional<Category> getCategoryById(Long id) {
        Optional<Category> categoryOpt = categoryRepository.findById(id);
        
        // Nếu tìm thấy danh mục, đếm số lượng sản phẩm
        if (categoryOpt.isPresent()) {
            Category category = categoryOpt.get();
            Long productCount = productRepository.countByCategoryId(category.getId());
            category.setProductCount(productCount);
        }
        
        return categoryOpt;
    }
    
    public Category getCategoryByName(String name) {
        Category category = categoryRepository.findByName(name);
        
        // Nếu tìm thấy danh mục, đếm số lượng sản phẩm
        if (category != null) {
            Long productCount = productRepository.countByCategoryId(category.getId());
            category.setProductCount(productCount);
        }
        
        return category;
    }

    public Category saveCategory(Category category) {
        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
} 