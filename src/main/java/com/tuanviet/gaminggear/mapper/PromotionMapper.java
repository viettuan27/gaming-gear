package com.tuanviet.gaminggear.mapper;

import com.tuanviet.gaminggear.dto.response.PromotionDetailResponse;
import com.tuanviet.gaminggear.dto.response.PromotionSummaryResponse;
import com.tuanviet.gaminggear.entity.cms.Promotion;
import com.tuanviet.gaminggear.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PromotionMapper {

    private final FileStorageService fileStorageService;

    public PromotionSummaryResponse toSummaryResponse(Promotion promotion){
        return new PromotionSummaryResponse(
                promotion.getId(),
                promotion.getTitle(),
                promotion.getSlug(),
                promotion.getExcerpt(),
                getCoverImageUrl(promotion),
                promotion.getStatus(),
                promotion.getPublishedAt()
        );
    }

    public PromotionDetailResponse toDetailResponse(Promotion promotion){
        return new PromotionDetailResponse(
                promotion.getId(),
                promotion.getTitle(),
                promotion.getSlug(),
                promotion.getExcerpt(),
                promotion.getContent(),
                getCoverImageUrl(promotion),
                promotion.getMetaTitle(),
                promotion.getMetaDescription(),
                promotion.getStatus(),
                promotion.getPublishedAt(),
                promotion.getCreatedAt(),
                promotion.getUpdatedAt(),
                promotion.getProducts().stream().map(product -> product.getId()).sorted().toList(),
                promotion.getCategories().stream().map(category -> category.getId()).sorted().toList()
        );
    }

    private String getCoverImageUrl(Promotion promotion){
        if(promotion.getCoverImageObjectKey() == null
                || promotion.getCoverImageObjectKey().isBlank()){
            return null;
        }
        return fileStorageService.getPublicUrl(promotion.getCoverImageObjectKey());
    }
}
