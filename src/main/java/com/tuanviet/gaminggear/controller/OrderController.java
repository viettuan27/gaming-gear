package com.tuanviet.gaminggear.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.tuanviet.gaminggear.common.ApiResponse;
import com.tuanviet.gaminggear.dto.request.CreateOrderRequest;
import com.tuanviet.gaminggear.dto.request.UpdateOrderStatusRequest;
import com.tuanviet.gaminggear.dto.response.OrderResponse;
import com.tuanviet.gaminggear.dto.response.OrderStatisticsResponse;
import com.tuanviet.gaminggear.dto.response.OrderSummaryResponse;
import com.tuanviet.gaminggear.dto.response.PageResponse;
import com.tuanviet.gaminggear.entity.order.OrderStatus;
import com.tuanviet.gaminggear.security.custom.CustomUserDetails;
import com.tuanviet.gaminggear.service.OrderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Tag(
        name = "Đơn hàng",
        description = "Tạo, theo dõi và quản lý đơn hàng"
)
@RestController
@RequiredArgsConstructor
@Validated
public class OrderController {

    private final OrderService orderService;

    @Operation(
            summary = "Tạo đơn hàng từ giỏ hàng",
            description = "Kiểm tra tồn kho, tạo đơn hàng và trừ tồn kho trong giao dịch được bảo vệ bởi Redisson lock."
    )
    @PostMapping("/api/v1/orders")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody CreateOrderRequest request
            ){
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(
                        "Đặt hàng thành công",
                        orderService.createOrder(currentUser.getUserId(),request)));
    }

    @Operation(summary = "Lấy lịch sử đơn hàng của tôi")
    @GetMapping("/api/v1/orders/my")
    public ResponseEntity<ApiResponse<PageResponse<OrderSummaryResponse>>> getMyOrders(
            @AuthenticationPrincipal CustomUserDetails currentUser,

            @RequestParam(defaultValue = "0")
            @Min(value = 0, message = "Số trang phải lớn hơn hoặc bằng 0")
            int page,

            @RequestParam(defaultValue = "10")
            @Min(value = 1, message = "Kích thước trang phải lớn hơn hoặc bằng 1")
            @Max(value = 50, message = "Kích thước trang tối đa là 50")
            int size,

            @RequestParam(defaultValue = "desc")
            String sortDirection
    ){
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy danh sách đơn hàng thành công",
                        orderService.getMyOrders(currentUser.getUserId(), page,size,sortDirection)));
    }

    @Operation(summary = "Lấy chi tiết đơn hàng")
    @GetMapping("/api/v1/orders/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderDetails(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long orderId
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy chi tiết đơn hàng thành công",
                        orderService.getOrderDetails(currentUser.getUserId(), orderId)));
    }

    @Operation(summary = "Hủy đơn hàng")
    @PutMapping("/api/v1/orders/{orderId}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long orderId
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Hủy đơn hàng thành công",
                        orderService.cancelOrder(currentUser.getUserId(), orderId)));
    }

    @Operation(summary = "Lấy danh sách đơn hàng cho quản trị viên")
    @GetMapping("/api/v1/admin/orders")
    public ResponseEntity<ApiResponse<PageResponse<OrderSummaryResponse>>> getAllOrders(
            @RequestParam(required = false) OrderStatus status,

            @RequestParam(defaultValue = "0")
            @Min(value = 0, message = "Số trang phải lớn hơn hoặc bằng 0")
            int page,

            @RequestParam(defaultValue = "10")
            @Min(value = 1, message = "Kích thước trang phải lớn hơn hoặc bằng 1")
            @Max(value = 50, message = "Kích thước trang tối đa là 50")
            int size,

            @RequestParam(defaultValue = "desc")
            String sortDirection
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy danh sách đơn hàng thành công",
                        orderService.getAllOrders(status, page, size, sortDirection)));
    }

    @Operation(summary = "Lấy thống kê doanh thu cho quản trị viên")
    @GetMapping("/api/v1/admin/orders/statistics")
    public ResponseEntity<ApiResponse<OrderStatisticsResponse>> getAdminOrderStatistics() {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy thống kê đơn hàng thành công",
                        orderService.getAdminOrderStatistics()));
    }

    @Operation(summary = "Cập nhật trạng thái đơn hàng")
    @PutMapping("/api/v1/admin/orders/{orderId}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Cập nhật trạng thái đơn hàng thành công",
                        orderService.updateOrderStatus(orderId, request)));
    }

}
