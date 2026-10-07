package com.tuanviet.gaminggear.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.tuanviet.gaminggear.common.ApiResponse;
import com.tuanviet.gaminggear.dto.request.BannerRequest;
import com.tuanviet.gaminggear.dto.response.BannerResponse;
import com.tuanviet.gaminggear.entity.cms.BannerPosition;
import com.tuanviet.gaminggear.service.BannerService;
import com.tuanviet.gaminggear.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(
        name = "CMS",
        description = "Quản lý banner, trang nội dung và bài viết"
)
@RestController
@RequiredArgsConstructor
@Validated
public class BannerController {

    private final BannerService bannerService;
    private final RateLimitService rateLimitService;

    @Operation(summary = "Tạo banner mới")
    @PostMapping(value = "/api/v1/admin/cms/banners", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<BannerResponse>> create(
            HttpServletRequest httpServletRequest,
            @Valid @ModelAttribute BannerRequest request,
            @RequestParam("file") MultipartFile file
    ) {
        rateLimitService.checkUpload(httpServletRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo banner thành công", bannerService.create(request, file)));
    }

    @Operation(summary = "Cập nhật banner")
    @PutMapping(value = "/api/v1/admin/cms/banners/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<BannerResponse>> update(
            HttpServletRequest httpServletRequest,
            @PathVariable Long id,
            @Valid @ModelAttribute BannerRequest request,
            @RequestParam(value = "file", required = false) MultipartFile file
    ) {
        if (file != null) {
            rateLimitService.checkUpload(httpServletRequest);
        }
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật banner thành công", bannerService.update(id, request, file)));
    }

    @Operation(summary = "Xuất bản banner")
    @PatchMapping("/api/v1/admin/cms/banners/{id}/publish")
    public ResponseEntity<ApiResponse<BannerResponse>> publish(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                ApiResponse.success("Xuất bản banner thành công", bannerService.publish(id)));
    }

    @Operation(summary = "Gỡ xuất bản banner")
    @PatchMapping("/api/v1/admin/cms/banners/{id}/unpublish")
    public ResponseEntity<ApiResponse<BannerResponse>> unpublish(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Gỡ xuất bản banner thành công", bannerService.unpublish(id)));
    }

    @Operation(summary = "Lưu trữ banner")
    @PatchMapping("/api/v1/admin/cms/banners/{id}/archive")
    public ResponseEntity<ApiResponse<BannerResponse>> archive(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Lưu trữ banner thành công", bannerService.archive(id)));
    }

    @Operation(summary = "Khôi phục banner")
    @PatchMapping("/api/v1/admin/cms/banners/{id}/restore")
    public ResponseEntity<ApiResponse<BannerResponse>> restore(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Khôi phục banner thành công", bannerService.restore(id)));
    }

    @Operation(summary = "Xóa banner")
    @DeleteMapping("/api/v1/admin/cms/banners/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        bannerService.delete(id);

        return ResponseEntity.ok(
                ApiResponse.success("Xóa banner thành công", null)
        );
    }

    @Operation(summary = "Lấy chi tiết banner cho quản trị viên")
    @GetMapping("/api/v1/admin/cms/banners/{id}")
    public ResponseEntity<ApiResponse<BannerResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy chi tiết banner thành công", bannerService.getById(id)));
    }

    @Operation(summary = "Lấy toàn bộ banner cho quản trị viên")
    @GetMapping("/api/v1/admin/cms/banners")
    public ResponseEntity<ApiResponse<List<BannerResponse>>> getAll() {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách banner thành công", bannerService.getAll()));
    }

    @Operation(summary = "Lấy banner đã xuất bản theo vị trí")
    @GetMapping("/api/v1/banners")
    public ResponseEntity<ApiResponse<List<BannerResponse>>> getPublishedByPosition(@RequestParam BannerPosition position) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách banner thành công",
                        bannerService.getPublishedByPosition(position)));
    }
}
