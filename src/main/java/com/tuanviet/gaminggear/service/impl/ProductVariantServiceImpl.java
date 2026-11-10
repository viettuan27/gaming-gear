package com.tuanviet.gaminggear.service.impl;

import com.tuanviet.gaminggear.dto.request.ProductVariantRequest;
import com.tuanviet.gaminggear.dto.response.ProductVariantResponse;
import com.tuanviet.gaminggear.entity.catalog.Product;
import com.tuanviet.gaminggear.entity.catalog.ProductVariant;
import com.tuanviet.gaminggear.exception.ConflictException;
import com.tuanviet.gaminggear.exception.ResourceNotFoundException;
import com.tuanviet.gaminggear.mapper.ProductVariantMapper;
import com.tuanviet.gaminggear.repository.ProductRepository;
import com.tuanviet.gaminggear.repository.ProductVariantRepository;
import com.tuanviet.gaminggear.service.ProductVariantService;
import lombok.RequiredArgsConstructor;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class ProductVariantServiceImpl implements ProductVariantService {

    private static final long LOCK_WAIT_SECONDS = 5;

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductVariantMapper productVariantMapper;
    private final ProductVariantTransactionService productVariantTransactionService;
    private final RedissonClient redissonClient;

    @Override
    @Transactional
    @CacheEvict(cacheNames = {"product-detail", "product-list"}, allEntries = true)
    public ProductVariantResponse create(Long productId, ProductVariantRequest request) {
        Product product = getProductById(productId);
        String sku = request.sku().trim().toUpperCase();

        if (productVariantRepository.existsBySkuIgnoreCase(sku)) {
            throw new ConflictException("SKU đã tồn tại");
        }

        ProductVariant productVariant = new ProductVariant();
        productVariant.setProduct(product);
        productVariant.setName(request.name().trim());
        productVariant.setSku(sku);
        productVariant.setPrice(request.price());
        productVariant.setOriginalPrice(request.originalPrice());
        productVariant.setStockQuantity(request.stockQuantity());
        productVariant.setActive(request.active());

        return productVariantMapper.toResponse(productVariantRepository.save(productVariant));
    }

    @Override
    @CacheEvict(cacheNames = {"product-detail", "product-list"}, allEntries = true)
    public ProductVariantResponse update(Long variantId, ProductVariantRequest request) {
        RLock lock = redissonClient.getLock(getStockLockName(variantId));

        try {
            if (!lock.tryLock(LOCK_WAIT_SECONDS, TimeUnit.SECONDS)) {
                throw new ConflictException(
                        "Sản phẩm đang được xử lý, vui lòng thử lại"
                );
            }

            return productVariantTransactionService.update(variantId, request);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();

            throw new ConflictException(
                    "Yêu cầu đang được xử lý, vui lòng thử lại"
            );
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    private Product getProductById(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));
    }

    private String getStockLockName(Long variantId) {
        return "lock:stock:variant:{" + variantId + "}";
    }
}
