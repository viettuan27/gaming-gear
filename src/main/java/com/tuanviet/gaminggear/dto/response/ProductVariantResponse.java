package com.tuanviet.gaminggear.dto.response;

import java.math.BigDecimal;

public record ProductVariantResponse(
        Long id,
        Long productId,
        String name,
        String sku,
        BigDecimal price,
        BigDecimal originalPrice,
        int stockQuantity,
        boolean active
) {
}
