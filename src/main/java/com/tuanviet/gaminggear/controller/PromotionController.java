package com.tuanviet.gaminggear.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.tuanviet.gaminggear.common.ApiResponse;
import com.tuanviet.gaminggear.dto.request.PromotionRequest;
import com.tuanviet.gaminggear.dto.response.PromotionDetailResponse;
import com.tuanviet.gaminggear.dto.response.PromotionSummaryResponse;
import com.tuanviet.gaminggear.dto.response.PageResponse;
import com.tuanviet.gaminggear.dto.response.ProductResponse;
import com.tuanviet.gaminggear.entity.cms.ContentStatus;
import com.tuanviet.gaminggear.service.PromotionService;
import com.tuanviet.gaminggear.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Tag(
        name = "CMS",
        description = "Quản lý banner, trang nội dung và bài khuyến mãi"
)
@RestController
@RequiredArgsConstructor
@Validated
public class PromotionController {

    private final PromotionService promotionService;
    private final RateLimitService rateLimitService;

    @GetMapping("/api/v1/promotions/{slug}/products")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getProducts(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(50) int size) {
        return ResponseEntity.ok(ApiResponse.success("Danh sách sản phẩm khuyến mãi", promotionService.getProducts(slug, page, size)));
    }

    @Operation(summary = "Tạo bài khuyến mãi mới")
    @PostMapping(value = "/api/v1/admin/cms/promotions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PromotionDetailResponse>> create(
            HttpServletRequest httpServletRequest,
            @Valid @ModelAttribute PromotionRequest request,
            @RequestParam(value = "coverImage", required = false) MultipartFile coverImage
    ) {
        if (coverImage != null) {
            rateLimitService.checkUpload(httpServletRequest);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success("Tạo bài khuyến mãi thành công", promotionService.create(request, coverImage)));
    }

    @Operation(summary = "Cập nhật bài khuyến mãi")
    @PutMapping(value = "/api/v1/admin/cms/promotions/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PromotionDetailResponse>> update(
            HttpServletRequest httpServletRequest,
            @PathVariable Long id,
            @Valid @ModelAttribute PromotionRequest request,
            @RequestParam(value = "coverImage", required = false) MultipartFile coverImage
    ) {
        if (coverImage != null) {
            rateLimitService.checkUpload(httpServletRequest);
        }
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật bài khuyến mãi thành công", promotionService.update(id, request, coverImage)));
    }

    @Operation(
            summary = "Xuất bản bài khuyến mãi",
            description = "Chuyển bài khuyến mãi từ bản nháp sang công khai và ghi nhận thời gian xuất bản."
    )
    @PatchMapping("/api/v1/admin/cms/promotions/{id}/publish")
    public ResponseEntity<ApiResponse<PromotionDetailResponse>> publish(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Xuất bản bài khuyến mãi thành công", promotionService.publish(id)));
    }

    @Operation(summary = "Gỡ xuất bản bài khuyến mãi")
    @PatchMapping("/api/v1/admin/cms/promotions/{id}/unpublish")
    public ResponseEntity<ApiResponse<PromotionDetailResponse>> unpublish(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Gỡ xuất bản bài khuyến mãi thành công", promotionService.unpublish(id)));
    }

    @Operation(summary = "Lưu trữ bài khuyến mãi")
    @PatchMapping("/api/v1/admin/cms/promotions/{id}/archive")
    public ResponseEntity<ApiResponse<PromotionDetailResponse>> archive(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Lưu trữ bài khuyến mãi thành công", promotionService.archive(id)));
    }

    @Operation(summary = "Khôi phục bài khuyến mãi")
    @PatchMapping("/api/v1/admin/cms/promotions/{id}/restore")
    public ResponseEntity<ApiResponse<PromotionDetailResponse>> restore(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Khôi phục bài khuyến mãi thành công", promotionService.restore(id)));
    }

    @Operation(summary = "Xóa bài khuyến mãi")
    @DeleteMapping("/api/v1/admin/cms/promotions/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        promotionService.delete(id);

        return ResponseEntity.ok(
                ApiResponse.success("Xóa bài khuyến mãi thành công", null));
    }

    @Operation(summary = "Lấy chi tiết bài khuyến mãi cho quản trị viên")
    @GetMapping("/api/v1/admin/cms/promotions/{id}")
    public ResponseEntity<ApiResponse<PromotionDetailResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy chi tiết bài khuyến mãi thành công", promotionService.getById(id)));
    }

    @Operation(summary = "Lấy danh sách bài khuyến mãi cho quản trị viên")
    @GetMapping("/api/v1/admin/cms/promotions")
    public ResponseEntity<ApiResponse<PageResponse<PromotionSummaryResponse>>> getAll(
            @RequestParam(required = false) ContentStatus status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size,
            @RequestParam(defaultValue = "desc") String sortDirection
    ) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách bài khuyến mãi thành công",
                        promotionService.getAll(status, page, size, sortDirection)));
    }

    @Operation(summary = "Lấy bài khuyến mãi đã xuất bản theo slug")
    @GetMapping("/api/v1/promotions/{slug}")
    public ResponseEntity<ApiResponse<PromotionDetailResponse>> getPublishedBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy bài khuyến mãi thành công",
                        promotionService.getPublishedBySlug(slug)));
    }

    @Operation(summary = "Lấy danh sách bài khuyến mãi đã xuất bản")
    @GetMapping("/api/v1/promotions")
    public ResponseEntity<ApiResponse<PageResponse<PromotionSummaryResponse>>> getAllPublished(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size,
            @RequestParam(defaultValue = "desc") String sortDirection
    ) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách bài khuyến mãi thành công",
                        promotionService.getAllPublished(page, size, sortDirection)));
    }
}
