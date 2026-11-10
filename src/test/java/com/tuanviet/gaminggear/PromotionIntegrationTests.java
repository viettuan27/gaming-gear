package com.tuanviet.gaminggear;

import com.tuanviet.gaminggear.entity.catalog.Brand;
import com.tuanviet.gaminggear.entity.catalog.Category;
import com.tuanviet.gaminggear.entity.catalog.Product;
import com.tuanviet.gaminggear.entity.catalog.ProductVariant;
import com.tuanviet.gaminggear.entity.cms.ContentStatus;
import com.tuanviet.gaminggear.controller.PromotionController;
import com.tuanviet.gaminggear.repository.BrandRepository;
import com.tuanviet.gaminggear.repository.CategoryRepository;
import com.tuanviet.gaminggear.repository.ProductRepository;
import com.tuanviet.gaminggear.repository.ProductVariantRepository;
import com.tuanviet.gaminggear.repository.PromotionRepository;
import com.tuanviet.gaminggear.service.PromotionService;
import com.tuanviet.gaminggear.service.ProductService;
import com.tuanviet.gaminggear.service.ProductVariantService;
import com.tuanviet.gaminggear.dto.request.ProductVariantRequest;
import com.tuanviet.gaminggear.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpMethod;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

@SpringBootTest
@Transactional
class PromotionIntegrationTests {
    @Autowired BrandRepository brands;
    @Autowired CategoryRepository categories;
    @Autowired ProductRepository products;
    @Autowired ProductVariantRepository variants;
    @Autowired PromotionRepository promotions;
    @Autowired PromotionService service;
    @Autowired PromotionController controller;
    @Autowired ProductService productService;
    @Autowired ProductVariantService variantService;
    @Autowired WebApplicationContext webApplicationContext;

    @Test
    void savesSelectionsAndResolvesCategoryProductsWithoutDuplicates() throws Exception {
        String unique = UUID.randomUUID().toString();
        Brand brand = new Brand(); brand.setName("test-brand-" + unique); brands.save(brand);
        Category category = new Category(); category.setName("test-category-" + unique); categories.save(category);
        Product first = new Product(); first.setName("first"); first.setBrand(brand); first.setCategory(category); products.save(first);
        String slug = "test-" + unique;

        var mvc = MockMvcBuilders.standaloneSetup(controller).build();
        mvc.perform(multipart("/api/v1/admin/cms/promotions")
                .param("title", "Ưu đãi thử")
                .param("slug", slug)
                .param("content", "Nội dung thử")
                .param("productIds[0]", String.valueOf(first.getId()))
                .param("categoryIds[0]", String.valueOf(category.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.productIds[0]").value(first.getId()))
                .andExpect(jsonPath("$.data.categoryIds[0]").value(category.getId()));

        var promotion = promotions.findBySlugIgnoreCaseAndStatus(slug, ContentStatus.DRAFT).orElseThrow();
        assertThrows(ResourceNotFoundException.class, () -> service.getProducts(slug, 0, 10));
        service.publish(promotion.getId());
        assertEquals(1, service.getProducts(slug, 0, 10).totalElements());

        Product second = new Product(); second.setName("second"); second.setBrand(brand); second.setCategory(category); products.save(second);
        assertEquals(2, service.getProducts(slug, 0, 10).totalElements());
        assertEquals(2, service.getProducts(slug, 0, 1).totalPages());

        mvc.perform(multipart(HttpMethod.PUT, "/api/v1/admin/cms/promotions/{id}", promotion.getId())
                .param("title", "Ưu đãi thử")
                .param("slug", slug)
                .param("content", "Nội dung thử")
                .param("productIds[0]", String.valueOf(first.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.categoryIds").isEmpty());
        assertEquals(1, service.getProducts(slug, 0, 10).totalElements());

        ProductVariant variant = new ProductVariant(); variant.setProduct(first); variant.setName("test"); variant.setSku(unique); variant.setPrice(new BigDecimal("80")); variant.setOriginalPrice(new BigDecimal("100")); variants.saveAndFlush(variant);
        var discounted = products.searchPublicProducts(category.getId(), null, true, "", org.springframework.data.domain.PageRequest.of(0, 10));
        assertEquals(1, discounted.getTotalElements());
        assertEquals(first.getId(), discounted.getContent().get(0).getId());

        service.unpublish(promotion.getId());
        assertThrows(ResourceNotFoundException.class, () -> service.getProducts(slug, 0, 10));
    }

    @Test
    void publicCanViewPromotionsButAdminEndpointsRequireLogin() throws Exception {
        var mvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();
        mvc.perform(get("/api/v1/promotions")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/admin/cms/promotions")).andExpect(status().isUnauthorized());
    }

    @Test
    void invalidatesDiscountListWhenVariantIsCreated() {
        String unique = UUID.randomUUID().toString();
        Brand brand = new Brand(); brand.setName("test-brand-" + unique); brands.save(brand);
        Category category = new Category(); category.setName("test-category-" + unique); categories.save(category);
        Product product = new Product(); product.setName("cache-test"); product.setBrand(brand); product.setCategory(category); products.saveAndFlush(product);
        assertEquals(0, productService.getAllProducts(category.getId(), null, true, "", 0, 10, "id", "asc").totalElements());
        variantService.create(product.getId(), new ProductVariantRequest("test", unique, new BigDecimal("80"), new BigDecimal("100"), 2, true));
        variants.flush();
        assertEquals(1, products.searchPublicProducts(category.getId(), null, true, "", org.springframework.data.domain.PageRequest.of(0, 10)).getTotalElements());
        assertEquals(1, productService.getAllProducts(category.getId(), null, true, "", 0, 10, "id", "asc").totalElements());
    }
}
