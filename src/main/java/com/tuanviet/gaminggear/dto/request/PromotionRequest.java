package com.tuanviet.gaminggear.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record PromotionRequest(
        @NotBlank(message = "Tiêu đề bài khuyến mãi không được để trống")
        @Size(max = 150, message = "Tiêu đề bài khuyến mãi tối đa 150 ký tự")
        String title,

        @NotBlank(message = "Slug không được để trống")
        @Size(max = 200, message = "Slug tối đa 200 ký tự")
        @Pattern(
                regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                message = "Slug chỉ gồm chữ thường, số và dấu gạch ngang"
        )
        String slug,

        @Size(max = 500, message = "Tóm tắt tối đa 500 ký tự")
        String excerpt,

        @NotBlank(message = "Nội dung bài khuyến mãi không được để trống")
        @Size(max = 50000, message = "Nội dung bài khuyến mãi tối đa 50000 ký tự")
        String content,

        @Size(max = 160, message = "SEO title tối đa 160 ký tự")
        String metaTitle,

        @Size(max = 300, message = "SEO description tối đa 300 ký tự")
        String metaDescription,
        List<Long> productIds,
        List<Long> categoryIds
) {
}