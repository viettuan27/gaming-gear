package com.tuanviet.gaminggear.service.impl;

import com.tuanviet.gaminggear.dto.request.ProductRequest;
import com.tuanviet.gaminggear.dto.response.*;
import com.tuanviet.gaminggear.entity.catalog.Brand;
import com.tuanviet.gaminggear.entity.catalog.Category;
import com.tuanviet.gaminggear.entity.catalog.Product;
import com.tuanviet.gaminggear.exception.ResourceNotFoundException;
import com.tuanviet.gaminggear.mapper.ProductImageMapper;
import com.tuanviet.gaminggear.mapper.ProductMapper;
import com.tuanviet.gaminggear.mapper.ProductVariantMapper;
import com.tuanviet.gaminggear.repository.*;
import com.tuanviet.gaminggear.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductServiceImpl implements ProductService {

    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final ProductVariantRepository productVariantRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductVariantMapper productVariantMapper;
    private final ProductImageMapper productImageMapper;

    @Override
    @CacheEvict(cacheNames = {"product-list","product-detail"},allEntries = true)
    public ProductResponse create(ProductRequest request) {
        Category category = getCategoryById(request.categoryId());
        Brand brand = getBrandById(request.brandId());

        Product product = new Product();
        product.setCategory(category);
        product.setBrand(brand);
        product.setName(request.name().trim());
        product.setDescription(request.description());
        product.setActive(request.active());

        return productMapper.toResponse(productRepository.save(product));
    }

    @Override
    @CacheEvict(cacheNames = {"product-list","product-detail"},allEntries = true)
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = getProductById(id);
        Category category = getCategoryById(request.categoryId());
        Brand brand = getBrandById(request.brandId());

        product.setCategory(category);
        product.setBrand(brand);
        product.setName(request.name().trim());
        product.setDescription(request.description());
        product.setActive(request.active());
        return productMapper.toResponse(productRepository.save(product));
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "product-detail",key = "#id")
    public ProductDetailsResponse getDetail(Long id) {
        Product product = productRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));
        if(!product.getCategory().isActive() || !product.getBrand().isActive()){
            throw new ResourceNotFoundException("Sản phẩm không khả dụng");
        }

        List<ProductVariantResponse> variants = productVariantRepository
                .findByProduct_IdAndActiveTrueOrderByIdAsc(id)
                .stream()
                .map(productVariantMapper::toResponse)
                .toList();
        List<ProductImageResponse> images = productImageRepository
                .findByProduct_IdOrderBySortOrderAsc(id)
                .stream()
                .map(productImageMapper::toResponse)
                .toList();

        return new ProductDetailsResponse(
                product.getId(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getBrand().getId(),
                product.getBrand().getName(),
                product.getName(),
                product.getDescription(),
                variants,
                images
        );
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "product-list", condition = "!#discounted")
    public PageResponse<ProductResponse> getAllProducts(
            Long categoryId,
            Long brandId,
            boolean discounted,
            String keyword,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        Sort sort = sortDirection.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        String normalizedKeyword = keyword == null
                ? ""
                : keyword.trim();

        Page<Product> productPage = productRepository.searchPublicProducts(
                categoryId,
                brandId,
                discounted,
                normalizedKeyword,
                pageable
        );

        Page<ProductResponse> responsePage = productPage.map(productMapper::toResponse);

        return new PageResponse<>(
                responsePage.getContent(),
                responsePage.getNumber(),
                responsePage.getSize(),
                responsePage.getTotalElements(),
                responsePage.getTotalPages(),
                responsePage.isLast()
        );
    }

    private Category getCategoryById(Long id){
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục"));
    }

    private Brand getBrandById(Long id){
        return brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thương hiệu"));
    }

    private Product getProductById(Long id){
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));
    }

}
