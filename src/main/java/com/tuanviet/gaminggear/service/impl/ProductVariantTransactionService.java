package com.tuanviet.gaminggear.service.impl;

import com.tuanviet.gaminggear.dto.request.ProductVariantRequest;
import com.tuanviet.gaminggear.dto.response.ProductVariantResponse;
import com.tuanviet.gaminggear.entity.catalog.ProductVariant;
import com.tuanviet.gaminggear.exception.ConflictException;
import com.tuanviet.gaminggear.exception.ResourceNotFoundException;
import com.tuanviet.gaminggear.mapper.ProductVariantMapper;
import com.tuanviet.gaminggear.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductVariantTransactionService {

    private final ProductVariantRepository productVariantRepository;
    private final ProductVariantMapper productVariantMapper;

    public ProductVariantResponse update(Long variantId, ProductVariantRequest request) {
        ProductVariant productVariant = getProductVariantById(variantId);
        String sku = request.sku().trim().toUpperCase();

        if (productVariantRepository.existsBySkuIgnoreCaseAndIdNot(sku, variantId)) {
            throw new ConflictException("SKU đã tồn tại");
        }

        productVariant.setName(request.name().trim());
        productVariant.setSku(sku);
        productVariant.setPrice(request.price());
        productVariant.setOriginalPrice(request.originalPrice());
        productVariant.setStockQuantity(request.stockQuantity());
        productVariant.setActive(request.active());

        return productVariantMapper.toResponse(productVariantRepository.save(productVariant));
    }

    private ProductVariant getProductVariantById(Long variantId) {
        return productVariantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy phiên bản sản phẩm"
                ));
    }
}
