package com.tuanviet.gaminggear.service.impl;

import com.tuanviet.gaminggear.dto.request.PromotionRequest;
import com.tuanviet.gaminggear.dto.response.PromotionDetailResponse;
import com.tuanviet.gaminggear.dto.response.PromotionSummaryResponse;
import com.tuanviet.gaminggear.dto.response.PageResponse;
import com.tuanviet.gaminggear.entity.cms.Promotion;
import com.tuanviet.gaminggear.entity.cms.ContentStatus;
import com.tuanviet.gaminggear.exception.BadRequestException;
import com.tuanviet.gaminggear.exception.ConflictException;
import com.tuanviet.gaminggear.exception.ResourceNotFoundException;
import com.tuanviet.gaminggear.mapper.PromotionMapper;
import com.tuanviet.gaminggear.repository.PromotionRepository;
import com.tuanviet.gaminggear.service.PromotionService;
import com.tuanviet.gaminggear.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import com.tuanviet.gaminggear.repository.ProductRepository;
import com.tuanviet.gaminggear.repository.CategoryRepository;
import com.tuanviet.gaminggear.dto.response.ProductResponse;
import com.tuanviet.gaminggear.mapper.ProductMapper;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional
public class PromotionServiceImpl implements PromotionService {

    private final PromotionRepository promotionRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;
    private final PromotionMapper promotionMapper;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getProducts(String slug, int page, int size) {
        String normalized = normalizeSlug(slug);
        if (promotionRepository.findBySlugIgnoreCaseAndStatus(normalized, ContentStatus.PUBLISHED).isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy bài khuyến mãi");
        }
        var products = productRepository.findPublishedPromotionProducts(normalized, PageRequest.of(page, size, Sort.by("id"))).map(productMapper::toResponse);
        return new PageResponse<>(products.getContent(), products.getNumber(), products.getSize(), products.getTotalElements(), products.getTotalPages(), products.isLast());
    }

    @Override
    
    public PromotionDetailResponse create(PromotionRequest request, MultipartFile coverImage) {
        String slug = normalizeSlug(request.slug());

        if (promotionRepository.existsBySlugIgnoreCase(slug)) {
            throw new ConflictException("Slug bài khuyến mãi đã tồn tại");
        }

        Promotion promotion = new Promotion();
        updatePromotionFields(promotion, request, slug);

        if (coverImage == null) {
            return promotionMapper.toDetailResponse(promotionRepository.save(promotion));
        }

        String objectKey = fileStorageService.uploadImage("cms/promotions", coverImage);

        try {
            promotion.setCoverImageObjectKey(objectKey);

            registerDeleteOnRollback(objectKey);

            return promotionMapper.toDetailResponse(promotionRepository.save(promotion));

        } catch (RuntimeException exception) {
            fileStorageService.delete(objectKey);
            throw exception;
        }
    }

    @Override
    
    public PromotionDetailResponse update(Long id, PromotionRequest request, MultipartFile coverImage) {
        Promotion promotion = getPromotionById(id);
        String slug = normalizeSlug(request.slug());

        if (promotionRepository.existsBySlugIgnoreCaseAndIdNot(slug, id)) {
            throw new ConflictException("Slug bài khuyến mãi đã tồn tại");
        }

        updatePromotionFields(promotion, request, slug);

        if (coverImage == null) {
            return promotionMapper.toDetailResponse(promotionRepository.save(promotion));
        }

        String oldObjectKey = promotion.getCoverImageObjectKey();
        String newObjectKey = fileStorageService.uploadImage("cms/promotions", coverImage
        );

        try {
            promotion.setCoverImageObjectKey(newObjectKey);

            registerDeleteOnRollback(newObjectKey);
            registerDeleteAfterCommit(oldObjectKey);

            return promotionMapper.toDetailResponse(promotionRepository.save(promotion));

        } catch (RuntimeException exception) {
            fileStorageService.delete(newObjectKey);
            throw exception;
        }
    }

    @Override
    
    public PromotionDetailResponse publish(Long id) {
        Promotion promotion = getPromotionById(id);

        if (promotion.getStatus() != ContentStatus.DRAFT) {
            throw new BadRequestException(
                    "Chỉ có thể xuất bản bài khuyến mãi đang ở trạng thái nháp");
        }

        promotion.setStatus(ContentStatus.PUBLISHED);
        promotion.setPublishedAt(Instant.now());

        return promotionMapper.toDetailResponse(promotionRepository.save(promotion));
    }

    @Override
    
    public PromotionDetailResponse unpublish(Long id) {
        Promotion promotion = getPromotionById(id);

        if (promotion.getStatus() != ContentStatus.PUBLISHED) {
            throw new BadRequestException(
                    "Chỉ có thể gỡ xuất bản bài khuyến mãi đang được xuất bản");
        }

        promotion.setStatus(ContentStatus.DRAFT);
        promotion.setPublishedAt(null);

        return promotionMapper.toDetailResponse(promotionRepository.save(promotion));
    }

    @Override
    
    public PromotionDetailResponse archive(Long id) {
        Promotion promotion = getPromotionById(id);

        if (promotion.getStatus() == ContentStatus.ARCHIVED) {
            throw new BadRequestException("Bài khuyến mãi đã được lưu trữ");
        }

        promotion.setStatus(ContentStatus.ARCHIVED);
        promotion.setPublishedAt(null);

        return promotionMapper.toDetailResponse(promotionRepository.save(promotion));
    }

    @Override
    
    public PromotionDetailResponse restore(Long id) {
        Promotion promotion = getPromotionById(id);

        if (promotion.getStatus() != ContentStatus.ARCHIVED) {
            throw new BadRequestException(
                    "Chỉ có thể khôi phục bài khuyến mãi đã được lưu trữ");
        }

        promotion.setStatus(ContentStatus.DRAFT);
        promotion.setPublishedAt(null);

        return promotionMapper.toDetailResponse(promotionRepository.save(promotion));
    }

    @Override
    
    public void delete(Long id) {
        Promotion promotion = getPromotionById(id);

        if (promotion.getStatus() == ContentStatus.PUBLISHED) {
            throw new BadRequestException(
                    "Không thể xóa bài khuyến mãi đang được xuất bản. "
                            + "Hãy gỡ xuất bản hoặc lưu trữ bài khuyến mãi trước");
        }

        promotionRepository.delete(promotion);
        registerDeleteAfterCommit(promotion.getCoverImageObjectKey());
    }

    @Override
    @Transactional(readOnly = true)
    public PromotionDetailResponse getById(Long id) {
        return promotionMapper.toDetailResponse(getPromotionById(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PromotionSummaryResponse> getAll(
            ContentStatus status,
            int page,
            int size,
            String sortDirection) {

        Pageable pageable = PageRequest.of(
                page,
                size,
                createSort("createdAt", sortDirection));

        Page<Promotion> promotionPage = status == null
                ? promotionRepository.findAll(pageable)
                : promotionRepository.findByStatus(status, pageable);

        return toPageResponse(promotionPage);
    }

    @Override
    @Transactional(readOnly = true)
    
    public PromotionDetailResponse getPublishedBySlug(String slug) {
        String normalizedSlug = normalizeSlug(slug);

        return promotionRepository
                .findBySlugIgnoreCaseAndStatus(normalizedSlug, ContentStatus.PUBLISHED)
                .map(promotionMapper::toDetailResponse)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy bài khuyến mãi"));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PromotionSummaryResponse> getAllPublished(
            int page,
            int size,
            String sortDirection) {

        Pageable pageable = PageRequest.of(
                page,
                size,
                createSort("publishedAt", sortDirection));

        Page<Promotion> promotionPage = promotionRepository.findByStatus(
                ContentStatus.PUBLISHED,
                pageable);

        return toPageResponse(promotionPage);
    }

    private Promotion getPromotionById(Long id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài khuyến mãi"));
    }

    private void updatePromotionFields(
            Promotion promotion,
            PromotionRequest request,
            String slug
    ) {
        var products = productRepository.findAllById(request.productIds() == null ? List.of() : request.productIds());
        var categories = categoryRepository.findAllById(request.categoryIds() == null ? List.of() : request.categoryIds());
        if (request.productIds() != null && products.size() != new HashSet<>(request.productIds()).size()) {
            throw new ResourceNotFoundException("Không tìm thấy sản phẩm được chọn");
        }
        if (request.categoryIds() != null && categories.size() != new HashSet<>(request.categoryIds()).size()) {
            throw new ResourceNotFoundException("Không tìm thấy danh mục được chọn");
        }
        promotion.setProducts(new HashSet<>(products));
        promotion.setCategories(new HashSet<>(categories));
        promotion.setTitle(request.title().trim());
        promotion.setSlug(slug);
        promotion.setExcerpt(normalizeOptionalText(request.excerpt()));
        promotion.setContent(request.content());
        promotion.setMetaTitle(normalizeOptionalText(request.metaTitle()));
        promotion.setMetaDescription(normalizeOptionalText(request.metaDescription()));
    }

    private PageResponse<PromotionSummaryResponse> toPageResponse(
            Page<Promotion> promotionPage
    ) {
        Page<PromotionSummaryResponse> responsePage = promotionPage.map(promotionMapper::toSummaryResponse);

        return new PageResponse<>(
                responsePage.getContent(),
                responsePage.getNumber(),
                responsePage.getSize(),
                responsePage.getTotalElements(),
                responsePage.getTotalPages(),
                responsePage.isLast()
        );
    }

    private Sort createSort(String property, String sortDirection) {
        if (!"asc".equalsIgnoreCase(sortDirection)
                && !"desc".equalsIgnoreCase(sortDirection)) {
            throw new BadRequestException("Chiều sắp xếp chỉ có thể là asc hoặc desc");
        }

        return sortDirection.equalsIgnoreCase("asc")
                ? Sort.by(property).ascending()
                : Sort.by(property).descending();
    }

    private String normalizeSlug(String slug) {
        return slug.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private void registerDeleteAfterCommit(String objectKey) {
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        fileStorageService.delete(objectKey);
                    }
                }
        );
    }

    private void registerDeleteOnRollback(String objectKey) {
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCompletion(int status) {
                        if (status == STATUS_ROLLED_BACK) {
                            fileStorageService.delete(objectKey);
                        }
                    }
                }
        );
    }
}
