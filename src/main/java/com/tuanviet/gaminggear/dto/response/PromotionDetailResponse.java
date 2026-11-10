package com.tuanviet.gaminggear.dto.response;

import com.tuanviet.gaminggear.entity.cms.ContentStatus;

import java.time.Instant;
import java.util.List;

public record PromotionDetailResponse(
        Long id,
        String title,
        String slug,
        String excerpt,
        String content,
        String coverImageUrl,
        String metaTitle,
        String metaDescription,
        ContentStatus status,
        Instant publishedAt,
        Instant createdAt,
        Instant updatedAt,
        List<Long> productIds,
        List<Long> categoryIds
) {
}
