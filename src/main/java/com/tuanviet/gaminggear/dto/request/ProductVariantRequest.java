package com.tuanviet.gaminggear.dto.request;


import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ProductVariantRequest(
        @NotBlank(message = "Tên phiên bản không được để trống")
        @Size(max = 150, message = "Tên phiên bản tối đa 150 ký tự")
        String name,

        @NotBlank(message = "SKU không được để trống")
        @Size(max = 100, message = "SKU tối đa 100 ký tự")
        String sku,

        @NotNull(message = "Giá không được để trống")
        @DecimalMin(value = "0.0", inclusive = true, message = "Giá phải lớn hơn hoặc bằng 0")
        BigDecimal price,

        @DecimalMin(value = "0.0", inclusive = true, message = "Giá niêm yết phải lớn hơn hoặc bằng 0")
        BigDecimal originalPrice,

        @Min(value = 0, message = "Số lượng tồn kho không được âm")
        int stockQuantity,

        boolean active
) {
    @AssertTrue(message = "Giá niêm yết phải lớn hơn giá bán")
    public boolean isOriginalPriceGreaterThanPrice() {
        return originalPrice == null || price == null || originalPrice.compareTo(price) > 0;
    }
}
