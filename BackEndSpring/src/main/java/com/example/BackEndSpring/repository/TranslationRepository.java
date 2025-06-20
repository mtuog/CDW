package com.example.BackEndSpring.repository;

import com.example.BackEndSpring.model.Translation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TranslationRepository extends JpaRepository<Translation, Long> {
    
    /**
     * Find exact translation by source text and target language
     */
    Optional<Translation> findBySourceTextAndTargetLanguage(String sourceText, String targetLanguage);
    
    /**
     * Find all translations for a specific target language
     */
    List<Translation> findByTargetLanguage(String targetLanguage);
    
    /**
     * Find translations by category and target language
     */
    List<Translation> findByCategoryAndTargetLanguage(String category, String targetLanguage);
    
    /**
     * Find all pattern translations (for pattern matching)
     */
    @Query("SELECT t FROM Translation t WHERE t.targetLanguage = :targetLanguage AND t.category IN ('PRODUCT_PATTERN', 'DESCRIPTION_PATTERN')")
    List<Translation> findPatternsByTargetLanguage(@Param("targetLanguage") String targetLanguage);
    
    /**
     * Find all category translations
     */
    @Query("SELECT t FROM Translation t WHERE t.targetLanguage = :targetLanguage AND t.category = 'CATEGORY'")
    List<Translation> findCategoryTranslationsByTargetLanguage(@Param("targetLanguage") String targetLanguage);
    
    /**
     * Find all UI translations
     */
    @Query("SELECT t FROM Translation t WHERE t.targetLanguage = :targetLanguage AND t.category = 'UI'")
    List<Translation> findUITranslationsByTargetLanguage(@Param("targetLanguage") String targetLanguage);
    
    /**
     * Check if translation exists
     */
    boolean existsBySourceTextAndTargetLanguage(String sourceText, String targetLanguage);
    
    /**
     * Delete translation by source text and target language
     */
    void deleteBySourceTextAndTargetLanguage(String sourceText, String targetLanguage);
    
    /**
     * Find translations by source text (all languages)
     */
    List<Translation> findBySourceText(String sourceText);
    
    /**
     * Search translations by source text containing keyword
     */
    @Query("SELECT t FROM Translation t WHERE t.sourceText LIKE %:keyword% AND t.targetLanguage = :targetLanguage")
    List<Translation> searchBySourceTextContaining(@Param("keyword") String keyword, @Param("targetLanguage") String targetLanguage);
    
    /**
     * Count translations by target language
     */
    long countByTargetLanguage(String targetLanguage);
    
    /**
     * Count translations by category and target language
     */
    long countByCategoryAndTargetLanguage(String category, String targetLanguage);
} 