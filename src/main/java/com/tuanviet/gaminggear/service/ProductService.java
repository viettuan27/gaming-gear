package com.tuanviet.gaminggear.service;

import com.tuanviet.gaminggear.dto.request.ProductRequest;
import com.tuanviet.gaminggear.dto.response.PageResponse;
import com.tuanviet.gaminggear.dto.response.ProductDetailsResponse;
import com.tuanviet.gaminggear.dto.response.ProductResponse;

import java.util.List;

public interface ProductService {
    ProductResponse create(ProductRequest request);
    ProductResponse update(Long id, ProductRequest request);

    ProductDetailsResponse getDetail(Long id);

    PageResponse<ProductResponse> getAllProducts(
            Long categoryId,
            Long brandId,
            boolean discounted,
            String keyword,
            int page,
            int size,
            String sortBy,
            String sortDirection
    );}
