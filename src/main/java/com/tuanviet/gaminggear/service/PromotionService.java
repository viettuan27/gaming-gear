package com.tuanviet.gaminggear.service;

import com.tuanviet.gaminggear.dto.request.PromotionRequest;
import com.tuanviet.gaminggear.dto.response.PromotionDetailResponse;
import com.tuanviet.gaminggear.dto.response.PromotionSummaryResponse;
import com.tuanviet.gaminggear.dto.response.PageResponse;
import com.tuanviet.gaminggear.entity.cms.ContentStatus;
import org.springframework.web.multipart.MultipartFile;
import com.tuanviet.gaminggear.dto.response.ProductResponse;

public interface PromotionService {

    PageResponse<ProductResponse> getProducts(String slug, int page, int size);

    PromotionDetailResponse create(PromotionRequest request, MultipartFile coverImage);

    PromotionDetailResponse update(Long id, PromotionRequest request, MultipartFile coverImage);

    PromotionDetailResponse publish(Long id);

    PromotionDetailResponse unpublish(Long id);

    PromotionDetailResponse archive(Long id);

    PromotionDetailResponse restore(Long id);

    void delete(Long id);

    PromotionDetailResponse getById(Long id);

    PageResponse<PromotionSummaryResponse> getAll(
            ContentStatus status,
            int page,
            int size,
            String sortDirection
    );

    PromotionDetailResponse getPublishedBySlug(String slug);

    PageResponse<PromotionSummaryResponse> getAllPublished(
            int page,
            int size,
            String sortDirection
    );
}
