package com.tuanviet.gaminggear.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.tuanviet.gaminggear.common.ApiResponse;
import com.tuanviet.gaminggear.dto.request.ProductRequest;
import com.tuanviet.gaminggear.dto.response.PageResponse;
import com.tuanviet.gaminggear.dto.response.ProductDetailsResponse;
import com.tuanviet.gaminggear.dto.response.ProductResponse;
import com.tuanviet.gaminggear.service.ProductService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Tag(
        name = "Danh mục sản phẩm",
        description = "Quản lý và tra cứu sản phẩm"
)
@RestController
@RequiredArgsConstructor
@Validated
public class ProductController {
    private final ProductService productService;

    @Operation(summary = "Tạo sản phẩm mới")
    @PostMapping("/api/v1/admin/products")
    public ResponseEntity<ApiResponse<ProductResponse>> create(@Valid @RequestBody ProductRequest request){

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo sản phẩm thành công", productService.create(request)));
    }

    @Operation(summary = "Cập nhật sản phẩm")
    @PutMapping("/api/v1/admin/products/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> update(@PathVariable Long id, @Valid @RequestBody ProductRequest request){
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật sản phẩm thành công", productService.update(id, request))
        );
    }

    @Operation(summary = "Lấy chi tiết sản phẩm")
    @GetMapping("/api/v1/products/{id}")
    public ResponseEntity<ApiResponse<ProductDetailsResponse>> getDetails(@PathVariable Long id){
        return ResponseEntity.ok()
                .body(ApiResponse.success("Chi tiết sản phẩm",productService.getDetail(id)));
    }
    @Operation(summary = "Lấy danh sách sản phẩm có phân trang")
    @GetMapping("/api/v1/products")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getAllProducts(
            @RequestParam(required = false)
            Long categoryId,

            @RequestParam(required = false)
            Long brandId,

            @RequestParam(defaultValue = "false")
            boolean discounted,

            @RequestParam(required = false)
            String keyword,
            @RequestParam(defaultValue = "0")
            @Min(value = 0, message = "Số trang phải lớn hơn hoặc bằng 0")
            int page,

            @RequestParam(defaultValue = "10")
            @Min(value = 1, message = "Kích thước trang phải lớn hơn hoặc bằng 1")
            @Max(value = 50, message = "Kích thước trang tối đa là 50")
            int size,

            @RequestParam(defaultValue = "createdAt")
            String sortBy,

            @RequestParam(defaultValue = "desc")
            String sortDirection
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy danh sách sản phẩm thành công",
                        productService.getAllProducts(
                                categoryId,
                                brandId,
                                discounted,
                                keyword,
                                page,
                                size,
                                sortBy,
                                sortDirection
                        )
                )
        );
    }
}
